const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Helpers
const getFrontendUrl = () => process.env.FRONTEND_URL || 'https://bundlebooth.github.io';
const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || 10);

// Create or fetch a vendor's Stripe Connect account and return an onboarding link
router.post('/connect/onboard/:vendorProfileId', async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ success: false, message: 'Stripe not configured on server (missing STRIPE_SECRET_KEY).' });
  }
  const { vendorProfileId } = req.params;
  if (!vendorProfileId) return res.status(400).json({ success: false, message: 'vendorProfileId is required' });
  try {
    const pool = await poolPromise;

    // Fetch existing StripeAccountID
    const vendorRs = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .query('SELECT VendorProfileID, StripeAccountID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID');

    if (vendorRs.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    let accountId = vendorRs.recordset[0].StripeAccountID;

    if (!accountId) {
      const account = await stripe.accounts.create({ type: 'express' });
      accountId = account.id;
      await pool.request()
        .input('VendorProfileID', sql.Int, vendorProfileId)
        .input('StripeAccountID', sql.NVarChar, accountId)
        .query('UPDATE VendorProfiles SET StripeAccountID = @StripeAccountID WHERE VendorProfileID = @VendorProfileID');
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${getFrontendUrl()}/connect/refresh`,
      return_url: `${getFrontendUrl()}/connect/return`,
      type: 'account_onboarding'
    });

    return res.json({ success: true, url: accountLink.url, accountId });
  } catch (err) {
    console.error('Stripe Connect onboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to start onboarding', error: err.message });
  }
});

// Check connect account status
router.get('/connect/status/:vendorProfileId', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({ success: true, connected: false, charges_enabled: false, payouts_enabled: false, note: 'Stripe not configured on server' });
    }
    const { vendorProfileId } = req.params;
    const pool = await poolPromise;
    const vendorRs = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .query('SELECT StripeAccountID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID');

    if (vendorRs.recordset.length === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const accountId = vendorRs.recordset[0].StripeAccountID;
    if (!accountId) return res.json({ success: true, connected: false });

    const acct = await stripe.accounts.retrieve(accountId);
    return res.json({ success: true, connected: !!acct.details_submitted, charges_enabled: acct.charges_enabled, payouts_enabled: acct.payouts_enabled });
  } catch (err) {
    console.error('Stripe Connect status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get status', error: err.message });
  }
});

// Debug endpoint to check if Connect is enabled for current API key
router.get('/debug/connect-status', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({ 
        success: false, 
        message: 'STRIPE_SECRET_KEY not set',
        connectEnabled: false 
      });
    }

    // Try to list accounts - this will fail if Connect isn't enabled
    const accounts = await stripe.accounts.list({ limit: 1 });
    
    return res.json({
      success: true,
      connectEnabled: true,
      message: 'Connect is enabled for this API key',
      keyPrefix: process.env.STRIPE_SECRET_KEY.substring(0, 12) + '...'
    });
  } catch (err) {
    return res.json({
      success: false,
      connectEnabled: false,
      message: 'Connect not enabled for this API key',
      error: err.message,
      keyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 12) + '...' : 'not set'
    });
  }
});

// Create a Checkout Session for a booking with a platform fee and destination to vendor
router.post('/checkout', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Stripe not configured on server (missing STRIPE_SECRET_KEY).' });
    }
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId is required' });

    const pool = await poolPromise;
    // Get booking, user, vendor, amount, currency and vendor's Stripe account
    const rs = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .query(`
        SELECT TOP 1 
               b.BookingID,
               b.TotalAmount,
               b.EventDate,
               b.VendorProfileID,
               b.UserID,
               vp.StripeAccountID,
               ISNULL(b.TotalAmount, 0) AS Amount
        FROM Bookings b
        INNER JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
        WHERE b.BookingID = @BookingID
      `);

    if (rs.recordset.length === 0) return res.status(404).json({ success: false, message: 'Booking not found' });

    const booking = rs.recordset[0];
    if (!booking.StripeAccountID) {
      return res.status(400).json({ success: false, message: 'Vendor is not connected to Stripe yet' });
    }

    const amountCents = Math.max(0, Math.round(Number(booking.Amount) * 100));
    const feeAmount = Math.round((PLATFORM_FEE_PERCENT / 100) * amountCents);
    const currency = 'usd';
    const eventDate = booking.EventDate ? new Date(booking.EventDate) : null;
    const dateStr = eventDate ? eventDate.toISOString().split('T')[0] : '';
    const description = `Booking #${booking.BookingID}${dateStr ? ' - ' + dateStr : ''}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency,
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: description },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: feeAmount,
        transfer_data: { destination: booking.StripeAccountID },
        metadata: { bookingId: String(booking.BookingID) }
      },
      success_url: `${getFrontendUrl()}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getFrontendUrl()}/payments/cancel?booking_id=${booking.BookingID}`,
      metadata: { bookingId: String(booking.BookingID) }
    });

    return res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create checkout session', error: err.message });
  }
});

// Webhook handler exported separately so app.js can mount with express.raw
async function webhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Unsafe fallback for local dev without verification
      event = JSON.parse(req.body);
    }
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentIntentId = session.payment_intent;
      const bookingId = (session.metadata && session.metadata.bookingId) || (session.payment_intent_data && session.payment_intent_data.metadata && session.payment_intent_data.metadata.bookingId);

      if (bookingId) {
        const pool = await poolPromise;
        await pool.request()
          .input('BookingID', sql.Int, Number(bookingId))
          .input('StripePaymentIntentID', sql.NVarChar, String(paymentIntentId || ''))
          .query(`
            UPDATE Bookings
            SET Status = 'Paid', FullAmountPaid = 1, StripePaymentIntentID = @StripePaymentIntentID, UpdatedAt = GETDATE()
            WHERE BookingID = @BookingID
          `);
      }
    }
  } catch (err) {
    console.error('Stripe webhook processing error:', err);
    // Always return 200 to acknowledge receipt to Stripe to avoid retries if handling errors are non-critical
  }

  res.json({ received: true });
}

module.exports = {
  router,
  webhook,
};
