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
    // First check if Connect is enabled by trying to list accounts
    await stripe.accounts.list({ limit: 1 });
  } catch (connectErr) {
    if (connectErr.message.includes('signed up for Connect')) {
      // Fallback: simulate successful onboarding for development
      console.warn('Stripe Connect not enabled, using fallback mode');
      const pool = await poolPromise;
      
      // Set a mock Stripe account ID to simulate connection
      const mockAccountId = `acct_mock_${vendorProfileId}_${Date.now()}`;
      await pool.request()
        .input('VendorProfileID', sql.Int, vendorProfileId)
        .input('StripeAccountID', sql.VarChar, mockAccountId)
        .query('UPDATE VendorProfiles SET StripeAccountID = @StripeAccountID WHERE VendorProfileID = @VendorProfileID');
      
      return res.json({ 
        success: true, 
        url: `${getFrontendUrl()}/vendor-dashboard?mock_connected=true`,
        accountId: mockAccountId,
        mock: true,
        message: 'Mock onboarding completed (Connect not enabled on server)'
      });
    }
    throw connectErr;
  }

  try {
    const pool = await poolPromise;

    // Fetch existing StripeAccountID
    const vendorRs = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .query('SELECT VendorProfileID, StripeAccountID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID');

    if (vendorRs.recordset.length === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const vendor = vendorRs.recordset[0];
    let accountId = vendor.StripeAccountID;

    // Create account if it doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({ type: 'express' });
      accountId = account.id;

      // Update vendor with new account ID
      await pool.request()
        .input('VendorProfileID', sql.Int, vendorProfileId)
        .input('StripeAccountID', sql.VarChar, accountId)
        .query('UPDATE VendorProfiles SET StripeAccountID = @StripeAccountID WHERE VendorProfileID = @VendorProfileID');
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${getFrontendUrl()}/vendor-dashboard?refresh=stripe`,
      return_url: `${getFrontendUrl()}/vendor-dashboard?connected=stripe`,
      type: 'account_onboarding',
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

    // Handle mock accounts (fallback mode)
    if (accountId.startsWith('acct_mock_')) {
      return res.json({ 
        success: true, 
        connected: true, 
        charges_enabled: true, 
        payouts_enabled: true,
        mock: true,
        note: 'Mock connection (Connect not enabled on server)'
      });
    }

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

    // Handle mock accounts (fallback mode)
    if (booking.StripeAccountID.startsWith('acct_mock_')) {
      // Simulate successful checkout creation
      const mockSessionId = `cs_mock_${bookingId}_${Date.now()}`;
      const mockUrl = `${getFrontendUrl()}/?payment=mock_success&booking=${booking.BookingID}&session=${mockSessionId}`;
      
      console.warn('Using mock checkout (Connect not enabled)');
      return res.json({ 
        success: true, 
        url: mockUrl, 
        sessionId: mockSessionId,
        mock: true,
        message: 'Mock checkout created (Connect not enabled on server)'
      });
    }

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
        metadata: { bookingId: booking.BookingID },
      },
      success_url: `${getFrontendUrl()}/?payment=success&booking=${booking.BookingID}`,
      cancel_url: `${getFrontendUrl()}/?payment=cancelled&booking=${booking.BookingID}`,
      metadata: { bookingId: booking.BookingID },
    });

    return res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe Checkout error:', err);
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
