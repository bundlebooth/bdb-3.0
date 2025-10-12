const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Helpers
function toCurrency(n) {
  try { return Math.round(Number(n || 0) * 100) / 100; } catch { return 0; }
}
function nowIso() { return new Date().toISOString(); }

async function loadBookingSnapshot(pool, bookingId) {
  const request = pool.request();
  request.input('BookingID', sql.Int, bookingId);
  // Booking core
  const bookingRes = await request.query(`
    SELECT TOP 1 
      b.BookingID, b.UserID, b.VendorProfileID, b.EventDate, b.EndDate, b.Status,
      b.TotalAmount, b.DepositAmount, b.DepositPaid, b.FullAmountPaid,
      u.Name AS ClientName, u.Email AS ClientEmail,
      vp.BusinessName AS VendorName
    FROM Bookings b
    LEFT JOIN Users u ON b.UserID = u.UserID
    LEFT JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID
  `);
  if (!bookingRes.recordset.length) {
    throw new Error('Booking not found');
  }
  const booking = bookingRes.recordset[0];

  // Services
  const servicesRes = await request.query(`
    SELECT bs.BookingServiceID, bs.Quantity, bs.PriceAtBooking,
           s.ServiceID, s.Name AS ServiceName
    FROM BookingServices bs
    LEFT JOIN Services s ON bs.ServiceID = s.ServiceID
    WHERE bs.BookingID = @BookingID
  `);
  const services = servicesRes.recordset || [];

  // Expenses
  const expensesRes = await request.query(`
    SELECT BookingExpenseID, Title, Amount, Notes, CreatedAt
    FROM BookingExpenses
    WHERE BookingID = @BookingID
    ORDER BY CreatedAt ASC
  `);
  const expenses = expensesRes.recordset || [];

  // Stripe fees if recorded (Transactions.FeeAmount)
  const txRes = await request.query(`
    SELECT FeeAmount, Amount, CreatedAt
    FROM Transactions
    WHERE BookingID = @BookingID AND Status = 'succeeded'
    ORDER BY CreatedAt DESC
  `);
  const transactions = txRes.recordset || [];

  return { booking, services, expenses, transactions };
}

function estimateStripeFee(totalAmount) {
  const pct = parseFloat(process.env.STRIPE_FEE_PERCENT || '2.9') / 100;
  const fixed = parseFloat(process.env.STRIPE_FEE_FIXED || '0.30');
  return toCurrency((Number(totalAmount || 0) * pct) + fixed);
}

function estimatePlatformFee(totalAmount) {
  const pct = parseFloat(process.env.PLATFORM_FEE_PERCENT || '5') / 100;
  return toCurrency(Number(totalAmount || 0) * pct);
}

async function upsertInvoiceForBooking(pool, bookingId, opts = {}) {
  const { forceRegenerate = true } = opts;
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const r = new sql.Request(tx);
    r.input('BookingID', sql.Int, bookingId);

    // Check if invoice exists
    const existing = await r.query(`SELECT TOP 1 InvoiceID FROM Invoices WHERE BookingID = @BookingID`);
    let invoiceId = existing.recordset[0]?.InvoiceID || null;

    // Build snapshot
    const snap = await loadBookingSnapshot(pool, bookingId);
    const totalAmount = toCurrency(snap.booking.TotalAmount || 0);
    const servicesSubtotal = toCurrency((snap.services || []).reduce((sum, s) => sum + (Number(s.PriceAtBooking || 0) * (s.Quantity || 1)), 0));
    const expensesTotal = toCurrency((snap.expenses || []).reduce((sum, e) => sum + Number(e.Amount || 0), 0));
    const subtotal = toCurrency(servicesSubtotal + expensesTotal);

    // Fees
    const recordedStripeFee = toCurrency((snap.transactions || []).reduce((sum, t) => sum + Number(t.FeeAmount || 0), 0));
    const stripeFee = recordedStripeFee > 0 ? recordedStripeFee : estimateStripeFee(totalAmount || subtotal);
    const platformFee = estimatePlatformFee(totalAmount || subtotal);

    // Total due: services + expenses (fees are informational by default)
    const totalDue = subtotal;

    // Upsert Invoices
    const issueDate = new Date();
    const invNumber = `INV-${bookingId}-${issueDate.toISOString().replace(/[-:TZ.]/g, '').slice(0,14)}`;
    if (!invoiceId) {
      r.input('UserID', sql.Int, snap.booking.UserID);
      r.input('VendorProfileID', sql.Int, snap.booking.VendorProfileID);
      r.input('InvoiceNumber', sql.NVarChar(50), invNumber);
      r.input('IssueDate', sql.DateTime, issueDate);
      r.input('DueDate', sql.DateTime, issueDate); // same day unless later extended
      r.input('Status', sql.NVarChar(20), 'issued');
      r.input('Currency', sql.NVarChar(3), 'USD');
      r.input('Subtotal', sql.Decimal(10,2), subtotal);
      r.input('VendorExpensesTotal', sql.Decimal(10,2), expensesTotal);
      r.input('PlatformFee', sql.Decimal(10,2), platformFee);
      r.input('StripeFee', sql.Decimal(10,2), stripeFee);
      r.input('TaxAmount', sql.Decimal(10,2), 0);
      r.input('TotalAmount', sql.Decimal(10,2), totalDue);
      r.input('FeesIncludedInTotal', sql.Bit, 0);
      r.input('SnapshotJSON', sql.NVarChar(sql.MAX), JSON.stringify({
        at: nowIso(),
        booking: snap.booking,
        services: snap.services,
        expenses: snap.expenses,
        transactions: snap.transactions
      }));

      const ins = await r.query(`
        INSERT INTO Invoices (
          BookingID, UserID, VendorProfileID, InvoiceNumber, IssueDate, DueDate, Status,
          Currency, Subtotal, VendorExpensesTotal, PlatformFee, StripeFee, TaxAmount, TotalAmount, FeesIncludedInTotal, SnapshotJSON, CreatedAt, UpdatedAt
        ) VALUES (
          @BookingID, @UserID, @VendorProfileID, @InvoiceNumber, @IssueDate, @DueDate, @Status,
          @Currency, @Subtotal, @VendorExpensesTotal, @PlatformFee, @StripeFee, @TaxAmount, @TotalAmount, @FeesIncludedInTotal, @SnapshotJSON, GETDATE(), GETDATE()
        );
        SELECT SCOPE_IDENTITY() AS InvoiceID;
      `);
      invoiceId = ins.recordset[0].InvoiceID;
    } else {
      // Update
      r.input('InvoiceID', sql.Int, invoiceId);
      r.input('IssueDate', sql.DateTime, issueDate);
      r.input('Subtotal', sql.Decimal(10,2), subtotal);
      r.input('VendorExpensesTotal', sql.Decimal(10,2), expensesTotal);
      r.input('PlatformFee', sql.Decimal(10,2), platformFee);
      r.input('StripeFee', sql.Decimal(10,2), stripeFee);
      r.input('TotalAmount', sql.Decimal(10,2), totalDue);
      r.input('SnapshotJSON', sql.NVarChar(sql.MAX), JSON.stringify({
        at: nowIso(),
        booking: snap.booking,
        services: snap.services,
        expenses: snap.expenses,
        transactions: snap.transactions
      }));
      await r.query(`
        UPDATE Invoices
        SET IssueDate=@IssueDate, Subtotal=@Subtotal, VendorExpensesTotal=@VendorExpensesTotal,
            PlatformFee=@PlatformFee, StripeFee=@StripeFee, TotalAmount=@TotalAmount,
            UpdatedAt=GETDATE(), SnapshotJSON=@SnapshotJSON
        WHERE InvoiceID=@InvoiceID;
      `);
      // Wipe items if regenerating
      if (forceRegenerate) {
        await r.query(`DELETE FROM InvoiceItems WHERE InvoiceID = @InvoiceID`);
      }
    }

    // Insert items (services, expenses, and fee-notes)
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
      await reqItem.query(`
        INSERT INTO InvoiceItems (InvoiceID, ItemType, RefID, Title, Description, Quantity, UnitPrice, Amount, IsPayable)
        VALUES (@InvoiceID, @ItemType, @RefID, @Title, @Description, @Quantity, @UnitPrice, @Amount, @IsPayable)
      `);
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
      await reqItem.query(`
        INSERT INTO InvoiceItems (InvoiceID, ItemType, RefID, Title, Description, Quantity, UnitPrice, Amount, IsPayable)
        VALUES (@InvoiceID, @ItemType, @RefID, @Title, @Description, @Quantity, @UnitPrice, @Amount, @IsPayable)
      `);
    }

    // Fees as non-payable informational lines
    const feePlatformReq = new sql.Request(tx);
    await feePlatformReq
      .input('InvoiceID', sql.Int, invoiceId)
      .input('ItemType', sql.NVarChar(50), 'fee_platform')
      .input('RefID', sql.Int, null)
      .input('Title', sql.NVarChar(255), 'Platform fee (info)')
      .input('Description', sql.NVarChar(sql.MAX), null)
      .input('Quantity', sql.Decimal(10,2), 1)
      .input('UnitPrice', sql.Decimal(10,2), platformFee)
      .input('Amount', sql.Decimal(10,2), platformFee)
      .input('IsPayable', sql.Bit, 0)
      .query(`
        INSERT INTO InvoiceItems (InvoiceID, ItemType, RefID, Title, Description, Quantity, UnitPrice, Amount, IsPayable)
        VALUES (@InvoiceID, @ItemType, @RefID, @Title, @Description, @Quantity, @UnitPrice, @Amount, @IsPayable)
      `);

    const feeStripeReq = new sql.Request(tx);
    await feeStripeReq
      .input('InvoiceID', sql.Int, invoiceId)
      .input('ItemType', sql.NVarChar(50), 'fee_stripe')
      .input('RefID', sql.Int, null)
      .input('Title', sql.NVarChar(255), 'Stripe processing fee (info)')
      .input('Description', sql.NVarChar(sql.MAX), null)
      .input('Quantity', sql.Decimal(10,2), 1)
      .input('UnitPrice', sql.Decimal(10,2), stripeFee)
      .input('Amount', sql.Decimal(10,2), stripeFee)
      .input('IsPayable', sql.Bit, 0)
      .query(`
        INSERT INTO InvoiceItems (InvoiceID, ItemType, RefID, Title, Description, Quantity, UnitPrice, Amount, IsPayable)
        VALUES (@InvoiceID, @ItemType, @RefID, @Title, @Description, @Quantity, @UnitPrice, @Amount, @IsPayable)
      `);

    await tx.commit();

    return { invoiceId, totals: { servicesSubtotal, expensesTotal, subtotal, platformFee, stripeFee, totalDue } };
  } catch (err) {
    try { await tx.rollback(); } catch {}
    throw err;
  }
}

// Generate or regenerate invoice for a booking (idempotent upsert)
router.post('/booking/:bookingId/generate', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const requesterUserId = parseInt(req.query.userId || req.body?.userId || 0, 10);
    if (!requesterUserId) return res.status(400).json({ success: false, message: 'userId is required' });
    const pool = await poolPromise;
    // Access control: only client or vendor user can generate
    const br = await pool.request().input('BookingID', sql.Int, parseInt(bookingId, 10)).query(`
      SELECT b.UserID AS ClientUserID, vp.UserID AS VendorUserID
      FROM Bookings b
      JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
      WHERE b.BookingID = @BookingID
    `);
    if (!br.recordset.length) return res.status(404).json({ success: false, message: 'Booking not found' });
    const row = br.recordset[0];
    if (requesterUserId !== row.ClientUserID && requesterUserId !== row.VendorUserID) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const result = await upsertInvoiceForBooking(pool, parseInt(bookingId, 10), { forceRegenerate: true });
    const inv = await getInvoiceByBooking(pool, parseInt(bookingId, 10));
    res.json({ success: true, invoice: inv, meta: result });
  } catch (err) {
    console.error('Generate invoice error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate invoice', error: err.message });
  }
});

async function getInvoiceCore(pool, invoiceId) {
  const r = pool.request();
  r.input('InvoiceID', sql.Int, invoiceId);
  const invRes = await r.query(`SELECT * FROM Invoices WHERE InvoiceID=@InvoiceID`);
  if (!invRes.recordset.length) return null;
  const invoice = invRes.recordset[0];
  const itemsRes = await r.query(`SELECT * FROM InvoiceItems WHERE InvoiceID=@InvoiceID ORDER BY InvoiceItemID ASC`);
  invoice.items = itemsRes.recordset || [];
  // Enrich with booking/vendor/client for ease of frontend
  const bookRes = await r.query(`
    SELECT b.BookingID, b.EventDate, b.Status, u.Name AS ClientName, u.Email AS ClientEmail, vp.BusinessName AS VendorName
    FROM Bookings b
    LEFT JOIN Users u ON b.UserID=u.UserID
    LEFT JOIN VendorProfiles vp ON b.VendorProfileID=vp.VendorProfileID
    WHERE b.BookingID = ${invoice.BookingID}
  `);
  invoice.booking = bookRes.recordset[0] || null;
  return invoice;
}

async function getInvoiceByBooking(pool, bookingId, autoGenerateIfMissing = true) {
  const r = pool.request();
  r.input('BookingID', sql.Int, bookingId);
  const invRes = await r.query(`SELECT TOP 1 InvoiceID FROM Invoices WHERE BookingID=@BookingID`);
  if (!invRes.recordset.length) {
    if (!autoGenerateIfMissing) return null;
    await upsertInvoiceForBooking(pool, bookingId, { forceRegenerate: true });
    const check = await r.query(`SELECT TOP 1 InvoiceID FROM Invoices WHERE BookingID=@BookingID`);
    if (!check.recordset.length) return null;
    return await getInvoiceCore(pool, check.recordset[0].InvoiceID);
  }
  return await getInvoiceCore(pool, invRes.recordset[0].InvoiceID);
}

// Get invoice by booking (auto-generate if missing)
router.get('/booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const requesterUserId = parseInt(req.query.userId || 0, 10);
    if (!requesterUserId) return res.status(400).json({ success: false, message: 'userId is required' });
    const pool = await poolPromise;
    // Access control: only client or vendor user can view
    const br = await pool.request().input('BookingID', sql.Int, parseInt(bookingId, 10)).query(`
      SELECT b.UserID AS ClientUserID, vp.UserID AS VendorUserID
      FROM Bookings b
      JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
      WHERE b.BookingID = @BookingID
    `);
    if (!br.recordset.length) return res.status(404).json({ success: false, message: 'Booking not found' });
    const row = br.recordset[0];
    if (requesterUserId !== row.ClientUserID && requesterUserId !== row.VendorUserID) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const invoice = await getInvoiceByBooking(pool, parseInt(bookingId, 10), true);
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
    const r = pool.request();
    r.input('UserID', sql.Int, parseInt(userId, 10));
    const result = await r.query(`
      SELECT i.*, b.EventDate, b.Status AS BookingStatus, vp.BusinessName AS VendorName
      FROM Invoices i
      INNER JOIN Bookings b ON i.BookingID = b.BookingID
      LEFT JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
      WHERE i.UserID = @UserID
      ORDER BY i.IssueDate DESC
    `);
    res.json({ success: true, invoices: result.recordset });
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
    const r = pool.request();
    r.input('VendorProfileID', sql.Int, parseInt(vendorProfileId, 10));
    const result = await r.query(`
      SELECT i.*, b.EventDate, b.Status AS BookingStatus, u.Name AS ClientName
      FROM Invoices i
      INNER JOIN Bookings b ON i.BookingID = b.BookingID
      LEFT JOIN Users u ON b.UserID = u.UserID
      WHERE i.VendorProfileID = @VendorProfileID
      ORDER BY i.IssueDate DESC
    `);
    res.json({ success: true, invoices: result.recordset });
  } catch (err) {
    console.error('List vendor invoices error:', err);
    res.status(500).json({ success: false, message: 'Failed to list invoices', error: err.message });
  }
});

// Get invoice by ID
router.get('/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const pool = await poolPromise;
    const invoice = await getInvoiceCore(pool, parseInt(invoiceId, 10));
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch invoice', error: err.message });
  }
});

module.exports = router;
