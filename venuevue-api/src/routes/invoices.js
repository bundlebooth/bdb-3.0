const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const { serializeDates, serializeRecords } = require('../utils/helpers');
const { decodeBookingId, decodeInvoiceId, isPublicId } = require('../utils/hashIds');
const { 
  getProvinceFromLocation, 
  getTaxInfoForProvince 
} = require('../utils/taxCalculations');

// Helpers
function toCurrency(n) {
  try { return Math.round(Number(n || 0) * 100) / 100; } catch { return 0; }
}
function nowIso() { return new Date().toISOString(); }

// Alias for backward compatibility
const extractProvinceFromLocation = getProvinceFromLocation;

// Helper to resolve booking ID (handles both public ID and numeric ID)
function resolveBookingId(idParam) {
  if (!idParam) return null;
  
  // If it's a public ID, decode it
  if (isPublicId(idParam)) {
    const decoded = decodeBookingId(idParam);
    return decoded;
  }
  // Otherwise, parse as numeric
  const parsed = parseInt(idParam, 10);
  return isNaN(parsed) ? null : parsed;
}

// Helper to resolve invoice ID (handles both public ID and numeric ID)
function resolveInvoiceId(idParam) {
  if (!idParam) return null;
  // If it's a public ID, decode it
  if (isPublicId(idParam)) {
    return decodeInvoiceId(idParam);
  }
  // Otherwise, parse as numeric
  const parsed = parseInt(idParam, 10);
  return isNaN(parsed) ? null : parsed;
}

// Get commission settings from database (same as payments.js)
async function getCommissionSettings() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('invoices.sp_GetCommissionSettings');
    
    const settings = {};
    result.recordset.forEach(row => {
      settings[row.SettingKey] = parseFloat(row.SettingValue) || 0;
    });
    
    return {
      platformFeePercent: settings['platform_fee_percent'] ?? parseFloat(process.env.PLATFORM_FEE_PERCENT || '5'),
      stripeFeePercent: settings['stripe_fee_percent'] ?? parseFloat(process.env.STRIPE_FEE_PERCENT || '2.9'),
      stripeFeeFixed: settings['stripe_fee_fixed'] ?? parseFloat(process.env.STRIPE_FEE_FIXED || '0.30'),
      taxPercent: settings['tax_percent'] ?? parseFloat(process.env.TAX_PERCENT || '13'),
      currency: (process.env.STRIPE_CURRENCY || 'cad').toLowerCase()
    };
  } catch (error) {
    console.warn('Could not fetch commission settings from DB, using env defaults:', error.message);
    return {
      platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT || '5'),
      stripeFeePercent: parseFloat(process.env.STRIPE_FEE_PERCENT || '2.9'),
      stripeFeeFixed: parseFloat(process.env.STRIPE_FEE_FIXED || '0.30'),
      taxPercent: parseFloat(process.env.TAX_PERCENT || '13'),
      currency: (process.env.STRIPE_CURRENCY || 'cad').toLowerCase()
    };
  }
}

async function loadBookingSnapshot(pool, bookingId) {
  const request = pool.request();
  request.input('BookingID', sql.Int, bookingId);
  // Booking core
  const bookingRes = await request.execute('invoices.sp_GetBookingSnapshot');
  if (!bookingRes.recordset.length) {
    throw new Error('Booking not found');
  }
  const booking = bookingRes.recordset[0];

  // Services
  const servicesRes = await request.execute('invoices.sp_GetBookingServices');
  let services = servicesRes.recordset || [];

  if ((!services || services.length === 0)) {
    try {
      let svcName = null;
      if (booking.ServiceID) {
        const nameRes = await pool.request()
          .input('ServiceID', sql.Int, booking.ServiceID)
          .execute('invoices.sp_GetServiceName');
        svcName = nameRes.recordset[0]?.Name || null;
      }
      const price = toCurrency(booking.TotalAmount || 0);
      if (price > 0) {
        services = [{
          BookingServiceID: null,
          Quantity: 1,
          PriceAtBooking: price,
          ServiceID: booking.ServiceID || null,
          ServiceName: svcName || 'Service'
        }];
      }
    } catch (_) {}
  }

  // Expenses
  let expenses = [];
  try {
    const expensesRes = await request.execute('invoices.sp_GetBookingExpenses');
    expenses = expensesRes.recordset || [];
  } catch (err) {
    const msg = String(err?.message || '');
    // SQL Server missing table error number is usually 208
    if (msg.includes("Invalid object name 'BookingExpenses'") || err?.number === 208) {
      expenses = [];
    } else {
      throw err;
    }
  }

  const txRes = await request.execute('invoices.sp_GetBookingTransactions');
  let transactions = txRes.recordset || [];
  if (transactions && transactions.length > 0) {
    const seen = new Set();
    const dedup = [];
    for (const t of transactions) {
      const d = new Date(t.CreatedAt);
      const key = (t.StripeChargeID && String(t.StripeChargeID)) || (`${toCurrency(t.Amount)}@${d.getUTCFullYear()}-${(d.getUTCMonth()+1).toString().padStart(2,'0')}-${d.getUTCDate().toString().padStart(2,'0')}T${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')}`);
      if (seen.has(key)) continue;
      seen.add(key);
      dedup.push(t);
    }
    transactions = dedup;
  }

  return { booking, services, expenses, transactions };
}

function estimateStripeFee(totalAmount, settings = null) {
  const pct = (settings?.stripeFeePercent ?? parseFloat(process.env.STRIPE_FEE_PERCENT || '2.9')) / 100;
  const fixed = settings?.stripeFeeFixed ?? parseFloat(process.env.STRIPE_FEE_FIXED || '0.30');
  return toCurrency((Number(totalAmount || 0) * pct) + fixed);
}

function estimatePlatformFee(totalAmount, settings = null) {
  const pct = (settings?.platformFeePercent ?? parseFloat(process.env.PLATFORM_FEE_PERCENT || '5')) / 100;
  return toCurrency(Number(totalAmount || 0) * pct);
}

function estimateTax(subtotalPlusPlatformFee, settings = null) {
  const pct = (settings?.taxPercent ?? parseFloat(process.env.TAX_PERCENT || '13')) / 100;
  return toCurrency(Number(subtotalPlusPlatformFee || 0) * pct);
}

async function upsertInvoiceForBooking(pool, bookingId, opts = {}) {
  const { forceRegenerate = true } = opts;
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const r = new sql.Request(tx);
    r.input('BookingID', sql.Int, bookingId);

    // Get commission settings from database (same source as checkout session)
    const commissionSettings = await getCommissionSettings();

    // Check if invoice exists
    const existing = await r.execute('invoices.sp_GetExistingInvoice');
    let invoiceId = existing.recordset[0]?.InvoiceID || null;

    // Build snapshot
    const snap = await loadBookingSnapshot(pool, bookingId);
    const bookingBaseAmount = toCurrency(snap.booking.TotalAmount || 0);
    const servicesSubtotal = toCurrency((snap.services || []).reduce((sum, s) => sum + (Number(s.PriceAtBooking || 0) * (s.Quantity || 1)), 0));
    const expensesTotal = toCurrency((snap.expenses || []).reduce((sum, e) => sum + Number(e.Amount || 0), 0));
    // Use services subtotal if available, otherwise fall back to booking total
    const subtotal = servicesSubtotal > 0 ? toCurrency(servicesSubtotal + expensesTotal) : bookingBaseAmount;

    // Get province from event location for tax calculation
    const eventLocation = snap.booking.EventLocation || snap.booking.Location || '';
    const eventProvince = extractProvinceFromLocation(eventLocation);
    const taxInfo = getTaxInfoForProvince(eventProvince);
    const taxPercent = taxInfo.rate;
    console.log(`[Invoice] Using province-based tax for ${eventProvince}: ${taxPercent}% (${taxInfo.label})`);

    // Fees - MUST match checkout session calculation exactly
    // Platform fee is calculated on subtotal
    const platformFee = toCurrency(subtotal * (commissionSettings.platformFeePercent / 100));
    // Tax is calculated on (subtotal + platform fee) using EVENT LOCATION province rate
    const taxAmount = toCurrency((subtotal + platformFee) * (taxPercent / 100));
    // Processing fee is calculated on subtotal
    const stripeFee = toCurrency((subtotal * (commissionSettings.stripeFeePercent / 100)) + commissionSettings.stripeFeeFixed);

    // Include fees in client grand total - MUST match checkout session
    const totalDue = toCurrency(subtotal + platformFee + taxAmount + stripeFee);

    // Determine invoice status based on booking flag or payments >= grand total
    const totalPaid = toCurrency((snap.transactions || []).reduce((s, t) => s + Number(t.Amount || 0), 0));
    const invStatus = ((snap.booking.FullAmountPaid === true || snap.booking.FullAmountPaid === 1) || (totalPaid + 0.01 >= totalDue)) ? 'paid' : 'issued';

    // Upsert Invoices
    const issueDate = new Date();
    const invNumber = `INV-${bookingId}-${issueDate.toISOString().replace(/[-:TZ.]/g, '').slice(0,14)}`;
    if (!invoiceId) {
      r.input('UserID', sql.Int, snap.booking.UserID);
      r.input('VendorProfileID', sql.Int, snap.booking.VendorProfileID);
      r.input('InvoiceNumber', sql.NVarChar(50), invNumber);
      r.input('IssueDate', sql.DateTime, issueDate);
      r.input('DueDate', sql.DateTime, issueDate); // same day unless later extended
      r.input('Status', sql.NVarChar(20), invStatus);
      r.input('Currency', sql.NVarChar(3), commissionSettings.currency.toUpperCase() || 'CAD');
      r.input('Subtotal', sql.Decimal(10,2), subtotal);
      r.input('VendorExpensesTotal', sql.Decimal(10,2), expensesTotal);
      r.input('PlatformFee', sql.Decimal(10,2), platformFee);
      r.input('StripeFee', sql.Decimal(10,2), stripeFee);
      r.input('TaxAmount', sql.Decimal(10,2), taxAmount);
      r.input('TotalAmount', sql.Decimal(10,2), totalDue);
      r.input('FeesIncludedInTotal', sql.Bit, 1);
      r.input('SnapshotJSON', sql.NVarChar(sql.MAX), JSON.stringify({
        at: nowIso(),
        booking: snap.booking,
        services: snap.services,
        expenses: snap.expenses,
        transactions: snap.transactions
      }));

      const ins = await r.execute('invoices.sp_Create');
      invoiceId = ins.recordset[0].InvoiceID;
    } else {
      // Update - use new request to avoid extra parameters from previous bindings
      const updateReq = new sql.Request(tx);
      updateReq.input('InvoiceID', sql.Int, invoiceId);
      updateReq.input('IssueDate', sql.DateTime, issueDate);
      updateReq.input('Status', sql.NVarChar(20), invStatus);
      updateReq.input('Subtotal', sql.Decimal(10,2), subtotal);
      updateReq.input('VendorExpensesTotal', sql.Decimal(10,2), expensesTotal);
      updateReq.input('PlatformFee', sql.Decimal(10,2), platformFee);
      updateReq.input('StripeFee', sql.Decimal(10,2), stripeFee);
      updateReq.input('TaxAmount', sql.Decimal(10,2), taxAmount);
      updateReq.input('TotalAmount', sql.Decimal(10,2), totalDue);
      updateReq.input('FeesIncludedInTotal', sql.Bit, 1);
      updateReq.input('SnapshotJSON', sql.NVarChar(sql.MAX), JSON.stringify({
        at: nowIso(),
        booking: snap.booking,
        services: snap.services,
        expenses: snap.expenses,
        transactions: snap.transactions
      }));
      await updateReq.execute('invoices.sp_Update');
      // Wipe items if regenerating
      if (forceRegenerate) {
        const deleteReq = new sql.Request(tx);
        deleteReq.input('InvoiceID', sql.Int, invoiceId);
        await deleteReq.execute('invoices.sp_DeleteItems');
      }
    }

    // Insert items (services and expenses only) using stored procedure
    try {
      // Insert service items
      for (const s of snap.services) {
        const reqItem = new sql.Request(tx);
        reqItem
          .input('InvoiceID', sql.Int, invoiceId)
          .input('ItemType', sql.NVarChar(50), 'service')
          .input('RefID', sql.Int, s.BookingServiceID || null)
          .input('Title', sql.NVarChar(255), s.ServiceName || 'Service')
          .input('Description', sql.NVarChar(sql.MAX), null)
          .input('Quantity', sql.Decimal(10,2), Number(s.Quantity || 1))
          .input('UnitPrice', sql.Decimal(10,2), Number(s.PriceAtBooking || 0))
          .input('Amount', sql.Decimal(10,2), toCurrency(Number(s.Quantity || 1) * Number(s.PriceAtBooking || 0)))
          .input('IsPayable', sql.Bit, 1);
        await reqItem.execute('invoices.sp_InsertItem');
      }

      // Insert expense items
      for (const e of snap.expenses) {
        const reqItem = new sql.Request(tx);
        reqItem
          .input('InvoiceID', sql.Int, invoiceId)
          .input('ItemType', sql.NVarChar(50), 'expense')
          .input('RefID', sql.Int, e.BookingExpenseID || null)
          .input('Title', sql.NVarChar(255), e.Title || 'Expense')
          .input('Description', sql.NVarChar(sql.MAX), e.Notes || null)
          .input('Quantity', sql.Decimal(10,2), 1)
          .input('UnitPrice', sql.Decimal(10,2), toCurrency(Number(e.Amount || 0)))
          .input('Amount', sql.Decimal(10,2), toCurrency(Number(e.Amount || 0)))
          .input('IsPayable', sql.Bit, 1);
        await reqItem.execute('invoices.sp_InsertItem');
      }
    } catch (err) {
      // InvoiceItems table may not exist, continue without items
      console.warn('Could not insert invoice items:', err.message);
    }

    await tx.commit();

    return { invoiceId, totals: { servicesSubtotal, expensesTotal, subtotal, platformFee, stripeFee, taxAmount, totalDue } };
  } catch (err) {
    try { await tx.rollback(); } catch {}
    throw err;
  }
}

// Generate or regenerate invoice for a booking (idempotent upsert)
router.post('/booking/:bookingId/generate', async (req, res) => {
  try {
    const bookingId = resolveBookingId(req.params.bookingId);
    if (!bookingId) return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    const requesterUserId = parseInt(req.query.userId || req.body?.userId || 0, 10);
    if (!requesterUserId) return res.status(400).json({ success: false, message: 'userId is required' });
    const pool = await poolPromise;
    // Access control: only client or vendor user can generate
    const br = await pool.request().input('BookingID', sql.Int, bookingId).execute('invoices.sp_GetBookingAccess');
    if (!br.recordset.length) return res.status(404).json({ success: false, message: 'Booking not found' });
    const row = br.recordset[0];
    if (requesterUserId !== row.ClientUserID && requesterUserId !== row.VendorUserID) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const result = await upsertInvoiceForBooking(pool, bookingId, { forceRegenerate: true });
    const inv = await getInvoiceByBooking(pool, bookingId);
    res.json({ success: true, invoice: inv, meta: result });
  } catch (err) {
    console.error('Generate invoice error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate invoice', error: err.message });
  }
});

async function getInvoiceCore(pool, invoiceId) {
  const r = pool.request();
  r.input('InvoiceID', sql.Int, invoiceId);
  const invRes = await r.execute('invoices.sp_GetById');
  if (!invRes.recordset.length) return null;
  const invoice = invRes.recordset[0];
  try {
    const itemsRes = await r.execute('invoices.sp_GetItems');
    invoice.items = itemsRes.recordset || [];
  } catch (err) {
    const msg = String(err?.message || '');
    if (msg.includes("Invalid object name 'InvoiceItems'") || err?.number === 208) {
      invoice.items = [];
    } else {
      throw err;
    }
  }
  // Load payments linked to the booking for this invoice
  try {
    const payRes = await r.execute('invoices.sp_GetPayments');
    const rows = payRes.recordset || [];
    const seen = new Set();
    const dedup = [];
    for (const t of rows) {
      const d = new Date(t.CreatedAt);
      const chargeId = t.StripeChargeID && String(t.StripeChargeID);
      
      // Skip PaymentIntent IDs (pi_) - only show Charge IDs (ch_) to avoid duplicates
      // PaymentIntent and Charge are related but we only want to show one
      if (chargeId && chargeId.startsWith('pi_')) continue;
      
      const key = chargeId || (`${toCurrency(t.Amount)}@${d.getUTCFullYear()}-${(d.getUTCMonth()+1).toString().padStart(2,'0')}-${d.getUTCDate().toString().padStart(2,'0')}T${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')}`);
      if (seen.has(key)) continue;
      seen.add(key);
      dedup.push(t);
    }
    invoice.payments = dedup;
  } catch (err) {
    invoice.payments = [];
  }
  // Enrich with booking/vendor/client for ease of frontend
  const bookReq = pool.request();
  bookReq.input('BookingID', sql.Int, invoice.BookingID);
  const bookRes = await bookReq.execute('invoices.sp_GetBookingDetails');
  invoice.booking = bookRes.recordset[0] || null;
  return invoice;
}

async function getInvoiceByBooking(pool, bookingId, autoGenerateIfMissing = true) {
  const r = pool.request();
  r.input('BookingID', sql.Int, bookingId);
  const invRes = await r.execute('invoices.sp_GetByBookingId');
  if (!invRes.recordset.length) {
    if (!autoGenerateIfMissing) return null;
    await upsertInvoiceForBooking(pool, bookingId, { forceRegenerate: true });
    const check = await r.execute('invoices.sp_GetByBookingId');
    if (!check.recordset.length) return null;
    return await getInvoiceCore(pool, check.recordset[0].InvoiceID);
  }
  return await getInvoiceCore(pool, invRes.recordset[0].InvoiceID);
}

// Get invoice by booking (auto-generate if missing)
router.get('/booking/:bookingId', async (req, res) => {
  try {
    const bookingId = resolveBookingId(req.params.bookingId);
    if (!bookingId) return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    const requesterUserId = parseInt(req.query.userId || 0, 10);
    if (!requesterUserId) return res.status(400).json({ success: false, message: 'userId is required' });
    const pool = await poolPromise;
    // Access control: only client or vendor user can view
    const br = await pool.request().input('BookingID', sql.Int, bookingId).execute('invoices.sp_GetBookingAccess');
    if (!br.recordset.length) return res.status(404).json({ success: false, message: 'Booking not found' });
    const row = br.recordset[0];
    if (requesterUserId !== row.ClientUserID && requesterUserId !== row.VendorUserID) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    // Optional auto-regenerate: explicit or legacy cleanup
    const regen = String(req.query.regenerate || '0') === '1';
    if (regen) {
      await upsertInvoiceForBooking(pool, bookingId, { forceRegenerate: true });
    } else {
      // If existing invoice uses old policy or has fee_* items, regenerate once
      const chk = await pool.request().input('BookingID', sql.Int, bookingId).execute('invoices.sp_GetWithFeesFlag');
      if (chk.recordset.length) {
        const invRow = chk.recordset[0];
        let needsRegen = invRow.FeesIncludedInTotal === 0;
        if (!needsRegen) {
          try {
            const feeItems = await pool.request().input('InvoiceID', sql.Int, invRow.InvoiceID).execute('invoices.sp_CheckFeeItems');
            needsRegen = feeItems.recordset.length > 0;
          } catch (_) { /* ignore */ }
        }
        if (needsRegen) {
          await upsertInvoiceForBooking(pool, bookingId, { forceRegenerate: true });
        }
      } else {
        await upsertInvoiceForBooking(pool, bookingId, { forceRegenerate: true });
      }
    }
    const invoice = await getInvoiceByBooking(pool, bookingId, true);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Get invoice by booking error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch invoice', error: err.message });
  }
});

// List invoices for a client user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('UserID', sql.Int, parseInt(userId, 10))
      .execute('invoices.sp_GetUserInvoices');
    
    // Convert date objects to ISO strings for proper JSON serialization
    const invoices = (result.recordset || []).map(inv => ({
      ...inv,
      IssueDate: inv.IssueDate instanceof Date ? inv.IssueDate.toISOString() : inv.IssueDate,
      DueDate: inv.DueDate instanceof Date ? inv.DueDate.toISOString() : inv.DueDate,
      EventDate: inv.EventDate instanceof Date ? inv.EventDate.toISOString() : inv.EventDate,
      EndDate: inv.EndDate instanceof Date ? inv.EndDate.toISOString() : inv.EndDate
    }));
    
    res.json({ success: true, invoices });
  } catch (err) {
    console.error('List user invoices error:', err);
    res.status(500).json({ success: false, message: 'Failed to list invoices', error: err.message });
  }
});

// List invoices for a vendor
router.get('/vendor/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('VendorProfileID', sql.Int, parseInt(vendorProfileId, 10))
      .execute('invoices.sp_GetVendorInvoices');
    
    // Convert date objects to ISO strings for proper JSON serialization
    const invoices = (result.recordset || []).map(inv => ({
      ...inv,
      IssueDate: inv.IssueDate instanceof Date ? inv.IssueDate.toISOString() : inv.IssueDate,
      DueDate: inv.DueDate instanceof Date ? inv.DueDate.toISOString() : inv.DueDate,
      EventDate: inv.EventDate instanceof Date ? inv.EventDate.toISOString() : inv.EventDate,
      EndDate: inv.EndDate instanceof Date ? inv.EndDate.toISOString() : inv.EndDate
    }));
    
    res.json({ success: true, invoices });
  } catch (err) {
    console.error('List vendor invoices error:', err);
    res.status(500).json({ success: false, message: 'Failed to list invoices', error: err.message });
  }
});

// Get invoice by ID (with authorization check)
router.get('/:invoiceId', async (req, res) => {
  try {
    const invoiceId = resolveInvoiceId(req.params.invoiceId);
    if (!invoiceId) return res.status(400).json({ success: false, message: 'Invalid invoice ID' });
    const requesterUserId = parseInt(req.query.userId || 0, 10);
    if (!requesterUserId) return res.status(400).json({ success: false, message: 'userId is required' });
    
    const pool = await poolPromise;
    const invoice = await getInvoiceCore(pool, invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    
    // Authorization check: only client or vendor user can view
    const bookingId = invoice.BookingID;
    if (bookingId) {
      const br = await pool.request().input('BookingID', sql.Int, bookingId).execute('invoices.sp_GetBookingAccess');
      if (br.recordset.length > 0) {
        const row = br.recordset[0];
        if (requesterUserId !== row.ClientUserID && requesterUserId !== row.VendorUserID) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }
      }
    }
    
    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch invoice', error: err.message });
  }
});

// Admin endpoint to force regenerate invoice (no access control - for debugging)
router.post('/admin/regenerate/:bookingId', async (req, res) => {
  try {
    const bookingId = resolveBookingId(req.params.bookingId);
    if (!bookingId) return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    const pool = await poolPromise;
    
    const result = await upsertInvoiceForBooking(pool, bookingId, { forceRegenerate: true });
    const invoice = await getInvoiceByBooking(pool, bookingId, true);
    
    res.json({ 
      success: true, 
      message: 'Invoice regenerated successfully',
      invoice 
    });
  } catch (err) {
    console.error('Admin regenerate invoice error:', err);
    res.status(500).json({ success: false, message: 'Failed to regenerate invoice', error: err.message });
  }
});

// Upload invoice PDF from frontend (for pixel-perfect email attachments)
router.post('/upload-pdf', async (req, res) => {
  try {
    const { bookingId, invoiceNumber, pdfBase64 } = req.body;
    
    if (!bookingId || !pdfBase64) {
      return res.status(400).json({ success: false, message: 'bookingId and pdfBase64 are required' });
    }
    
    const resolvedBookingId = resolveBookingId(bookingId);
    if (!resolvedBookingId) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }
    
    const pool = await poolPromise;
    
    // Store the PDF in the database (or update if exists)
    const request = pool.request();
    request.input('BookingID', sql.Int, resolvedBookingId);
    request.input('InvoiceNumber', sql.NVarChar(50), invoiceNumber || `INV-${resolvedBookingId}`);
    request.input('PDFData', sql.VarBinary(sql.MAX), Buffer.from(pdfBase64, 'base64'));
    request.input('CreatedAt', sql.DateTime, new Date());
    
    // Try to use stored procedure, fallback to direct query
    try {
      await request.execute('invoices.sp_UpsertInvoicePDF');
    } catch (spErr) {
      // Fallback: direct upsert using MERGE
      await pool.request()
        .input('BookingID', sql.Int, resolvedBookingId)
        .input('InvoiceNumber', sql.NVarChar(50), invoiceNumber || `INV-${resolvedBookingId}`)
        .input('PDFData', sql.VarBinary(sql.MAX), Buffer.from(pdfBase64, 'base64'))
        .input('CreatedAt', sql.DateTime, new Date())
        .query(`
          MERGE INTO invoices.InvoicePDFs AS target
          USING (SELECT @BookingID AS BookingID) AS source
          ON target.BookingID = source.BookingID
          WHEN MATCHED THEN
            UPDATE SET PDFData = @PDFData, InvoiceNumber = @InvoiceNumber, UpdatedAt = @CreatedAt
          WHEN NOT MATCHED THEN
            INSERT (BookingID, InvoiceNumber, PDFData, CreatedAt)
            VALUES (@BookingID, @InvoiceNumber, @PDFData, @CreatedAt);
        `);
    }
    
    console.log(`[Invoices] Stored PDF for booking ${resolvedBookingId}`);
    res.json({ success: true, message: 'Invoice PDF uploaded successfully' });
  } catch (err) {
    console.error('Upload invoice PDF error:', err);
    res.status(500).json({ success: false, message: 'Failed to upload invoice PDF', error: err.message });
  }
});

// Get stored invoice PDF for a booking (returns base64)
async function getStoredInvoicePDF(pool, bookingId) {
  try {
    const result = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .query(`
        SELECT PDFData, InvoiceNumber 
        FROM invoices.InvoicePDFs 
        WHERE BookingID = @BookingID
      `);
    
    if (result.recordset.length === 0) return null;
    
    const row = result.recordset[0];
    return {
      pdfBuffer: row.PDFData,
      invoiceNumber: row.InvoiceNumber
    };
  } catch (err) {
    // Table might not exist yet
    console.warn('[Invoices] Could not retrieve stored PDF:', err.message);
    return null;
  }
}

// Expose helpers so other modules can access invoice functions
router.upsertInvoiceForBooking = upsertInvoiceForBooking;
router.getInvoiceByBooking = getInvoiceByBooking;
router.getStoredInvoicePDF = getStoredInvoicePDF;
module.exports = router;
