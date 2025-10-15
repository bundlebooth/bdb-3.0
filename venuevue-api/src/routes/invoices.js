const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// GET /api/invoices/booking/:bookingId
// Returns a computed invoice JSON for the given booking
router.get('/booking/:bookingId', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid bookingId' });
    }

    const pool = await poolPromise;
    // Booking + parties
    const bq = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .query(`
        SELECT TOP 1 
          b.BookingID,
          b.UserID,
          b.VendorProfileID,
          b.TotalAmount,
          b.Status,
          b.EventDate,
          b.EndDate,
          b.EventLocation,
          b.EventName,
          b.EventType,
          b.TimeZone,
          b.AttendeeCount,
          b.FullAmountPaid,
          u.Name AS ClientName,
          u.Email AS ClientEmail,
          vp.BusinessName AS VendorName,
          vp.BusinessEmail AS VendorEmail,
          vp.BusinessPhone AS VendorPhone
        FROM Bookings b
        LEFT JOIN Users u ON b.UserID = u.UserID
        LEFT JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
        WHERE b.BookingID = @BookingID
      `);

    if (!bq.recordset.length) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const b = bq.recordset[0];

    // Services
    let services = [];
    try {
      const s = await pool.request().input('BookingID', sql.Int, bookingId).query(`
        SELECT Title, Quantity, PriceAtBooking AS UnitPrice
        FROM BookingServices
        WHERE BookingID = @BookingID
      `);
      services = s.recordset.map(r => ({
        type: 'service',
        name: r.Title,
        quantity: Number(r.Quantity || 1),
        unitPrice: Number(r.UnitPrice || 0),
        lineTotal: Math.round((Number(r.Quantity || 1) * Number(r.UnitPrice || 0)) * 100) / 100
      }));
    } catch (_) {}

    // Expenses
    let expenses = [];
    try {
      const e = await pool.request().input('BookingID', sql.Int, bookingId).query(`
        SELECT Title, Amount
        FROM BookingExpenses
        WHERE BookingID = @BookingID
      `);
      expenses = e.recordset.map(r => ({
        type: 'expense',
        name: r.Title,
        quantity: 1,
        unitPrice: Number(r.Amount || 0),
        lineTotal: Number(r.Amount || 0)
      }));
    } catch (_) {}

    const lineItems = [...services, ...expenses];
    const servicesSubtotal = services.reduce((s, it) => s + Number(it.lineTotal || 0), 0);
    const expensesTotal = expenses.reduce((s, it) => s + Number(it.lineTotal || 0), 0);
    const subtotal = Math.round((servicesSubtotal + expensesTotal) * 100) / 100;

    // Fees (estimated if not recorded)
    const platformPct = parseFloat(process.env.PLATFORM_FEE_PERCENT || '5') / 100;
    const stripePct = parseFloat(process.env.STRIPE_FEE_PERCENT || process.env.STRIPE_PROC_FEE_PERCENT || '2.9') / 100;
    const stripeFixed = parseFloat(process.env.STRIPE_FEE_FIXED || process.env.STRIPE_PROC_FEE_FIXED || '0.30');
    const platformFee = Math.round((subtotal * platformPct) * 100) / 100;
    const processingFees = Math.round(((subtotal * stripePct) + stripeFixed) * 100) / 100;

    const grandTotal = Math.round((subtotal + platformFee + processingFees) * 100) / 100;

    // Payments recorded
    let payments = [];
    try {
      const p = await pool.request().input('BookingID', sql.Int, bookingId).query(`
        SELECT TransactionID, Amount, FeeAmount, NetAmount, Currency, Description, CreatedAt
        FROM Transactions
        WHERE BookingID = @BookingID AND Status = 'succeeded'
        ORDER BY CreatedAt ASC
      `);
      payments = p.recordset.map(r => ({
        TransactionID: r.TransactionID,
        Amount: Number(r.Amount || 0),
        FeeAmount: Number(r.FeeAmount || 0),
        NetAmount: Number(r.NetAmount || 0),
        Currency: r.Currency || 'USD',
        Description: r.Description || 'Payment',
        CreatedAt: r.CreatedAt
      }));
    } catch (_) {}
    const totalPaid = Math.round((payments.reduce((s, r) => s + Number(r.Amount || 0), 0)) * 100) / 100;
    const balanceDue = Math.max(0, Math.round((grandTotal - totalPaid) * 100) / 100);

    const statusText = (b.Status || '').toString().toLowerCase();
    const invoice = {
      invoiceNumber: `INV-${b.BookingID}`,
      issuedAt: new Date().toISOString(),
      bookingId: b.BookingID,
      eventDate: b.EventDate,
      status: statusText,
      currency: 'USD',
      viewerRole: '',
      billFrom: { name: b.VendorName || 'Vendor', email: b.VendorEmail || '', phone: b.VendorPhone || '' },
      billTo: { name: b.ClientName || 'Client', email: b.ClientEmail || '' },
      client: { id: b.UserID, name: b.ClientName || '' },
      vendor: { vendorProfileId: b.VendorProfileID, name: b.VendorName || '' },
      // Expose booking fields so frontend invoices table can populate event columns
      booking: {
        BookingID: b.BookingID,
        EventDate: b.EventDate,
        EndDate: b.EndDate || null,
        EventLocation: b.EventLocation || '',
        EventName: b.EventName || '',
        EventType: b.EventType || '',
        TimeZone: b.TimeZone || '',
        AttendeeCount: b.AttendeeCount != null ? Number(b.AttendeeCount) : null,
        Status: b.Status
      },
      lineItems,
      totals: {
        servicesSubtotal,
        expensesTotal,
        subtotal,
        platformFeePercent: Math.round(platformPct * 1000) / 10,
        platformFee,
        processingFees,
        processingFeesSource: 'estimated',
        grandTotal,
        totalPaid,
        balanceDue
      },
      payments
    };

    return res.json({ success: true, invoice });
  } catch (error) {
    console.error('Invoice error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate invoice', error: error.message });
  }
});

module.exports = router;


