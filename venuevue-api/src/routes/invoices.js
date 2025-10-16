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
      b.EventName, b.EventType, b.EventLocation, b.TimeZone, b.ServiceID,
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
           s.ServiceID, s.Name AS ServiceName, s.DurationMinutes
    FROM BookingServices bs
    LEFT JOIN Services s ON bs.ServiceID = s.ServiceID
    WHERE bs.BookingID = @BookingID
  `);
  let services = servicesRes.recordset || [];

  if ((!services || services.length === 0)) {
    try {
      let svcName = null;
      if (booking.ServiceID) {
        const nameRes = await pool.request()
          .input('ServiceID', sql.Int, booking.ServiceID)
          .query('SELECT TOP 1 Name FROM Services WHERE ServiceID = @ServiceID');
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
    const expensesRes = await request.query(`
      SELECT BookingExpenseID, Title, Amount, Notes, CreatedAt
      FROM BookingExpenses
      WHERE BookingID = @BookingID
      ORDER BY CreatedAt ASC
    `);
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

  const txRes = await request.query(`
    SELECT StripeChargeID, FeeAmount, Amount, CreatedAt
    FROM Transactions
    WHERE BookingID = @BookingID AND Status = 'succeeded'
    ORDER BY CreatedAt ASC
  `);
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
    const taxPercent = parseFloat(process.env.TAX_PERCENT || '0') / 100;
    const taxAmount = toCurrency((subtotal + platformFee) * taxPercent);

    // Include fees in client grand total
    const totalDue = toCurrency(subtotal + platformFee + taxAmount);

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
      r.input('Currency', sql.NVarChar(3), 'USD');
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
      r.input('Status', sql.NVarChar(20), invStatus);
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
      await r.query(`
        UPDATE Invoices
        SET IssueDate=@IssueDate, Status=@Status, Subtotal=@Subtotal, VendorExpensesTotal=@VendorExpensesTotal,
            PlatformFee=@PlatformFee, StripeFee=@StripeFee, TaxAmount=@TaxAmount, TotalAmount=@TotalAmount, FeesIncludedInTotal=@FeesIncludedInTotal,
            UpdatedAt=GETDATE(), SnapshotJSON=@SnapshotJSON
        WHERE InvoiceID=@InvoiceID;
      `);
      // Wipe items if regenerating
      if (forceRegenerate) {
        await r.query(`DELETE FROM InvoiceItems WHERE InvoiceID = @InvoiceID`);
      }
    }

    // Insert items (services and expenses only) if the table exists
    let itemsTableAvailable = true;
    try {
      await new sql.Request(tx).query('SELECT TOP 0 1 AS ok FROM InvoiceItems');
    } catch (err) {
      const msg = String(err?.message || '');
      if (msg.includes("Invalid object name 'InvoiceItems'") || err?.number === 208) {
        itemsTableAvailable = false;
      } else {
        throw err;
      }
    }

    if (itemsTableAvailable) {
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

      // No fee_* items inserted; fees are summarized in invoice totals only.
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
  try {
    const itemsRes = await r.query(`SELECT * FROM InvoiceItems WHERE InvoiceID=@InvoiceID ORDER BY InvoiceItemID ASC`);
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
    const payRes = await r.query(`
      SELECT t.StripeChargeID, t.Amount, t.FeeAmount, t.NetAmount, t.Currency, t.CreatedAt
      FROM Transactions t
      WHERE t.BookingID = (SELECT BookingID FROM Invoices WHERE InvoiceID=@InvoiceID)
      ORDER BY t.CreatedAt ASC
    `);
    const rows = payRes.recordset || [];
    const seen = new Set();
    const dedup = [];
    for (const t of rows) {
      const d = new Date(t.CreatedAt);
      const key = (t.StripeChargeID && String(t.StripeChargeID)) || (`${toCurrency(t.Amount)}@${d.getUTCFullYear()}-${(d.getUTCMonth()+1).toString().padStart(2,'0')}-${d.getUTCDate().toString().padStart(2,'0')}T${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')}`);
      if (seen.has(key)) continue;
      seen.add(key);
      dedup.push(t);
    }
    invoice.payments = dedup;
  } catch (err) {
    invoice.payments = [];
  }
  // Enrich with booking/vendor/client for ease of frontend
  const bookRes = await r.query(`
    SELECT b.BookingID, b.EventDate, b.EndDate, b.Status, b.EventName, b.EventType, b.EventLocation, b.TimeZone,
           u.Name AS ClientName, u.Email AS ClientEmail, vp.BusinessName AS VendorName
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
    // Optional auto-regenerate: explicit or legacy cleanup
    const regen = String(req.query.regenerate || '0') === '1';
    if (regen) {
      await upsertInvoiceForBooking(pool, parseInt(bookingId, 10), { forceRegenerate: true });
    } else {
      // If existing invoice uses old policy or has fee_* items, regenerate once
      const chk = await pool.request().input('BookingID', sql.Int, parseInt(bookingId, 10)).query(`
        SELECT TOP 1 InvoiceID, FeesIncludedInTotal FROM Invoices WHERE BookingID=@BookingID ORDER BY IssueDate DESC
      `);
      if (chk.recordset.length) {
        const invRow = chk.recordset[0];
        let needsRegen = invRow.FeesIncludedInTotal === 0;
        if (!needsRegen) {
          try {
            const feeItems = await pool.request().input('InvoiceID', sql.Int, invRow.InvoiceID).query(`
              SELECT TOP 1 1 AS HasFee FROM InvoiceItems WHERE InvoiceID=@InvoiceID AND ItemType LIKE 'fee_%'
            `);
            needsRegen = feeItems.recordset.length > 0;
          } catch (_) { /* ignore */ }
        }
        if (needsRegen) {
          await upsertInvoiceForBooking(pool, parseInt(bookingId, 10), { forceRegenerate: true });
        }
      } else {
        await upsertInvoiceForBooking(pool, parseInt(bookingId, 10), { forceRegenerate: true });
      }
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
    let rows;
    try {
      const q1 = `
        SELECT * FROM vw_InvoicesList
        WHERE UserID = @UserID
        ORDER BY IssueDate DESC
      `;
      const r1 = await r.query(q1);
      rows = r1.recordset;
    } catch (viewErr) {
      const q2 = `
        SELECT i.*,
               COALESCE(
                 CASE WHEN svc.ServiceStartTime IS NOT NULL AND br.EventDate IS NOT NULL
                      THEN CAST(CONVERT(VARCHAR(10), br.EventDate, 120) + ' ' + CONVERT(VARCHAR(8), svc.ServiceStartTime, 108) AS DATETIME) END,
                 b.EventDate,
                 CASE WHEN br.EventDate IS NOT NULL THEN CAST(CONVERT(VARCHAR(10), br.EventDate, 120) + ' ' + ISNULL(CONVERT(VARCHAR(8), br.EventTime, 108), '00:00:00') AS DATETIME) ELSE NULL END
               ) AS EventDate,
               COALESCE(
                 CASE WHEN svc.ServiceEndTime IS NOT NULL AND br.EventDate IS NOT NULL
                      THEN CAST(CONVERT(VARCHAR(10), br.EventDate, 120) + ' ' + CONVERT(VARCHAR(8), svc.ServiceEndTime, 108) AS DATETIME) END,
                 b.EndDate,
                 CASE WHEN br.EventDate IS NOT NULL THEN CAST(CONVERT(VARCHAR(10), br.EventDate, 120) + ' ' + ISNULL(CONVERT(VARCHAR(8), br.EventEndTime, 108), ISNULL(CONVERT(VARCHAR(8), br.EventTime, 108), '00:00:00')) AS DATETIME) ELSE NULL END
               ) AS EndDate,
               COALESCE(b.EventLocation, br.EventLocation) AS EventLocation,
               COALESCE(b.EventName, br.EventName) AS EventName,
               COALESCE(b.EventType, br.EventType) AS EventType,
               COALESCE(b.TimeZone, br.TimeZone) AS TimeZone,
               b.Status AS Status, b.FullAmountPaid, vp.BusinessName AS VendorName, u.Name AS ClientName, u.Email AS ClientEmail,
               COALESCE(
                 svc.ServiceNames,
                 (
                   SELECT STRING_AGG(x.ServiceName, ', ')
                   FROM (
                     SELECT DISTINCT s2.Name AS ServiceName
                     FROM BookingServices bs
                     JOIN Services s2 ON s2.ServiceID = bs.ServiceID
                     WHERE bs.BookingID = b.BookingID
                   ) x
                 ),
                 (SELECT s3.Name FROM Services s3 WHERE s3.ServiceID = b.ServiceID)
               ) AS ServicesSummary
        FROM Invoices i
        INNER JOIN Bookings b ON i.BookingID = b.BookingID
        LEFT JOIN BookingRequests br
          ON br.PaymentIntentID = b.StripePaymentIntentID
         AND br.UserID = b.UserID
         AND br.VendorProfileID = b.VendorProfileID
        OUTER APPLY (
          SELECT 
            MIN(TRY_CONVERT(time, COALESCE(
              JSON_VALUE(js.value, '$.startTime'),
              JSON_VALUE(js.value, '$.timeStart'),
              JSON_VALUE(js.value, '$.start'),
              JSON_VALUE(js.value, '$.StartTime'),
              JSON_VALUE(js.value, '$.eventStart'),
              JSON_VALUE(js.value, '$.start_time')
            ))) AS ServiceStartTime,
            MAX(TRY_CONVERT(time, COALESCE(
              JSON_VALUE(js.value, '$.endTime'),
              JSON_VALUE(js.value, '$.timeEnd'),
              JSON_VALUE(js.value, '$.end'),
              JSON_VALUE(js.value, '$.EndTime'),
              JSON_VALUE(js.value, '$.eventEnd'),
              JSON_VALUE(js.value, '$.end_time')
            ))) AS ServiceEndTime,
            STRING_AGG(
              COALESCE(
                JSON_VALUE(js.value, '$.serviceName'),
                JSON_VALUE(js.value, '$.name'),
                JSON_VALUE(js.value, '$.Name'),
                JSON_VALUE(js.value, '$.service.name'),
                JSON_VALUE(js.value, '$.title')
              ), ', '
            ) AS ServiceNames
          FROM OPENJSON(br.Services) js
        ) svc
        LEFT JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
        LEFT JOIN Users u ON b.UserID = u.UserID
        WHERE i.UserID = @UserID
        ORDER BY i.IssueDate DESC
      `;
      const r2 = await r.query(q2);
      rows = r2.recordset;
    }
    res.json({ success: true, invoices: rows });
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
    let rows;
    try {
      const q1 = `
        SELECT * FROM vw_InvoicesList
        WHERE VendorProfileID = @VendorProfileID
        ORDER BY IssueDate DESC
      `;
      const r1 = await r.query(q1);
      rows = r1.recordset;
    } catch (viewErr) {
      const q2 = `
        SELECT i.*,
               COALESCE(
                 CASE WHEN svc.ServiceStartTime IS NOT NULL AND br.EventDate IS NOT NULL
                      THEN CAST(CONVERT(VARCHAR(10), br.EventDate, 120) + ' ' + CONVERT(VARCHAR(8), svc.ServiceStartTime, 108) AS DATETIME) END,
                 b.EventDate,
                 CASE WHEN br.EventDate IS NOT NULL THEN CAST(CONVERT(VARCHAR(10), br.EventDate, 120) + ' ' + ISNULL(CONVERT(VARCHAR(8), br.EventTime, 108), '00:00:00') AS DATETIME) ELSE NULL END
               ) AS EventDate,
               COALESCE(
                 CASE WHEN svc.ServiceEndTime IS NOT NULL AND br.EventDate IS NOT NULL
                      THEN CAST(CONVERT(VARCHAR(10), br.EventDate, 120) + ' ' + CONVERT(VARCHAR(8), svc.ServiceEndTime, 108) AS DATETIME) END,
                 b.EndDate,
                 CASE WHEN br.EventDate IS NOT NULL THEN CAST(CONVERT(VARCHAR(10), br.EventDate, 120) + ' ' + ISNULL(CONVERT(VARCHAR(8), br.EventEndTime, 108), ISNULL(CONVERT(VARCHAR(8), br.EventTime, 108), '00:00:00')) AS DATETIME) ELSE NULL END
               ) AS EndDate,
               COALESCE(b.EventLocation, br.EventLocation) AS EventLocation,
               COALESCE(b.EventName, br.EventName) AS EventName,
               COALESCE(b.EventType, br.EventType) AS EventType,
               COALESCE(b.TimeZone, br.TimeZone) AS TimeZone,
               b.Status AS Status, b.FullAmountPaid, u.Name AS ClientName,
               COALESCE(
                 svc.ServiceNames,
                 (
                   SELECT STRING_AGG(x.ServiceName, ', ')
                   FROM (
                     SELECT DISTINCT s2.Name AS ServiceName
                     FROM BookingServices bs
                     JOIN Services s2 ON s2.ServiceID = bs.ServiceID
                     WHERE bs.BookingID = b.BookingID
                   ) x
                 ),
                 (SELECT s3.Name FROM Services s3 WHERE s3.ServiceID = b.ServiceID)
               ) AS ServicesSummary
        FROM Invoices i
        INNER JOIN Bookings b ON i.BookingID = b.BookingID
        LEFT JOIN BookingRequests br
          ON br.PaymentIntentID = b.StripePaymentIntentID
         AND br.UserID = b.UserID
         AND br.VendorProfileID = b.VendorProfileID
        OUTER APPLY (
          SELECT 
            MIN(TRY_CONVERT(time, COALESCE(
              JSON_VALUE(js.value, '$.startTime'),
              JSON_VALUE(js.value, '$.timeStart'),
              JSON_VALUE(js.value, '$.start'),
              JSON_VALUE(js.value, '$.StartTime'),
              JSON_VALUE(js.value, '$.eventStart'),
              JSON_VALUE(js.value, '$.start_time')
            ))) AS ServiceStartTime,
            MAX(TRY_CONVERT(time, COALESCE(
              JSON_VALUE(js.value, '$.endTime'),
              JSON_VALUE(js.value, '$.timeEnd'),
              JSON_VALUE(js.value, '$.end'),
              JSON_VALUE(js.value, '$.EndTime'),
              JSON_VALUE(js.value, '$.eventEnd'),
              JSON_VALUE(js.value, '$.end_time')
            ))) AS ServiceEndTime,
            STRING_AGG(
              COALESCE(
                JSON_VALUE(js.value, '$.serviceName'),
                JSON_VALUE(js.value, '$.name'),
                JSON_VALUE(js.value, '$.Name'),
                JSON_VALUE(js.value, '$.service.name'),
                JSON_VALUE(js.value, '$.title')
              ), ', '
            ) AS ServiceNames
          FROM OPENJSON(br.Services) js
        ) svc
        LEFT JOIN Users u ON b.UserID = u.UserID
        WHERE i.VendorProfileID = @VendorProfileID
        ORDER BY i.IssueDate DESC
      `;
      const r2 = await r.query(q2);
      rows = r2.recordset;
    }
    res.json({ success: true, invoices: rows });
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

// Expose helper so Stripe payments webhook can regenerate invoices
router.upsertInvoiceForBooking = upsertInvoiceForBooking;
module.exports = router;
