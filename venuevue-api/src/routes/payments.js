const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Helper function to check if Stripe is properly configured
function isStripeConfigured() {
  return process.env.STRIPE_SECRET_KEY && 
         process.env.STRIPE_PUBLISHABLE_KEY && 
         process.env.STRIPE_CLIENT_ID &&
         !process.env.STRIPE_SECRET_KEY.includes('placeholder') &&
         !process.env.STRIPE_PUBLISHABLE_KEY.includes('placeholder');
}

// Minimal check used for server-side operations that only require the secret key
function hasStripeSecret() {
  try {
    const sk = process.env.STRIPE_SECRET_KEY || '';
    return !!sk && !sk.includes('placeholder');
  } catch (e) {
    return false;
  }
}

// URL helpers for Checkout Session redirects
const DEFAULT_FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

function isValidHttpUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

function toAbsoluteUrl(pathOrUrl, base = DEFAULT_FRONTEND_URL) {
  if (!pathOrUrl) return base;
  if (isValidHttpUrl(pathOrUrl)) return pathOrUrl;
  try {
    // Treat anything else as a path relative to FRONTEND_URL
    if (String(pathOrUrl).startsWith('/')) {
      return new URL(pathOrUrl, base).toString();
    }
  } catch (e) {
    // fall through
  }
  // Fallback to base
  return base;
}

function getRequestBaseUrl(req) {
  try {
    const origin = req.headers.origin || req.get && req.get('Origin');
    if (origin && isValidHttpUrl(origin)) return origin;
    const referer = req.headers.referer || req.get && req.get('Referer');
    if (referer) {
      const u = new URL(referer);
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.origin;
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_FRONTEND_URL;
}

function resolveToHttpUrl(inputUrl, fallbackPathOrUrl, req) {
  const base = getRequestBaseUrl(req);
  const fallbackAbs = isValidHttpUrl(fallbackPathOrUrl)
    ? fallbackPathOrUrl
    : toAbsoluteUrl(fallbackPathOrUrl, base);

  if (isValidHttpUrl(inputUrl)) return inputUrl;
  // If relative path, resolve against request base or FRONTEND_URL
  if (inputUrl && String(inputUrl).startsWith('/')) {
    return toAbsoluteUrl(inputUrl, base);
  }
  // Any other scheme (e.g., file://) or invalid -> fallback
  return fallbackAbs;
}

function ensureSessionIdParam(urlStr) {
  try {
    const u = new URL(urlStr);
    if (!u.searchParams.has('session_id')) {
      u.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
    }
    return u.toString();
  } catch (e) {
    return urlStr;
  }
}

// Helper function to get vendor's Stripe Connect account ID
async function getVendorStripeAccountId(vendorProfileId) {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.query(`
      SELECT StripeAccountID 
      FROM VendorProfiles 
      WHERE VendorProfileID = @VendorProfileID
    `);
    
    return result.recordset.length > 0 ? result.recordset[0].StripeAccountID : null;
  } catch (error) {
    console.error('Error fetching vendor Stripe account ID:', error);
    return null;
  }
}

// Helper function to save Stripe Connect account ID
async function saveStripeConnectAccountId(vendorProfileId, stripeAccountId) {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('StripeAccountID', sql.NVarChar(100), stripeAccountId);
    
    await request.query(`
      UPDATE VendorProfiles 
      SET StripeAccountID = @StripeAccountID, UpdatedAt = GETDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    
    return true;
  } catch (error) {
    console.error('Error saving Stripe Connect account ID:', error);
    return false;
  }
}

// Helper function to save charge ID to booking
async function saveChargeIdToBooking(bookingId, chargeId) {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('BookingID', sql.Int, bookingId);
    request.input('StripePaymentIntentID', sql.NVarChar(100), chargeId);
    
    await request.query(`
      UPDATE Bookings 
      SET StripePaymentIntentID = @StripePaymentIntentID, UpdatedAt = GETDATE()
      WHERE BookingID = @BookingID
    `);
    
    return true;
  } catch (error) {
    console.error('Error saving charge ID to booking:', error);
    return false;
  }
}

// 1. VENDOR ONBOARDING - Generate Stripe Connect OAuth URL
router.get('/connect/onboard/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    
    if (!isStripeConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Stripe Connect is not properly configured. Please contact support.',
        requiresSetup: true
      });
    }

    // Generate secure state parameter
    const state = `vendor_${vendorProfileId}_${Date.now()}`;
    const redirectUri = process.env.STRIPE_REDIRECT_URI || 'http://localhost:8080/stripe/redirect';

    const stripeAuthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.STRIPE_CLIENT_ID}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    res.json({
      success: true,
      authUrl: stripeAuthUrl,
      state: state
    });

  } catch (error) {
    console.error('Error generating Stripe onboarding URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate onboarding URL',
      error: error.message
    });
  }
});

// 2. HANDLE STRIPE OAUTH REDIRECT
router.get('/connect/redirect', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      return res.redirect(`${frontendUrl}?stripe_connect=error&message=${encodeURIComponent(`Stripe authorization failed: ${error}`)}`);
    }

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorization code or state parameter'
      });
    }

    // Verify state parameter format
    if (!state.startsWith('vendor_')) {
      return res.status(403).json({
        success: false,
        message: 'Invalid state parameter'
      });
    }

    // Extract vendor profile ID from state
    const vendorProfileId = state.split('_')[1];

    // Exchange code for access token
    const tokenResponse = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code,
    });

    const connectedAccountId = tokenResponse.stripe_user_id;

    // Save the connected account ID to database
    const saved = await saveStripeConnectAccountId(vendorProfileId, connectedAccountId);

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save Stripe account information'
      });
    }

    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    res.redirect(`${frontendUrl}?stripe_connect=success&vendor=${vendorProfileId}&message=Successfully connected to Stripe!`);

  } catch (error) {
    console.error('Stripe token exchange error:', error);
    res.status(500).json({
      success: false,
      message: 'Connection failed',
      error: error.message
    });
  }
});

// 3. CHECK VENDOR CONNECTION STATUS
router.get('/connect/status/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    
    if (!isStripeConfigured()) {
      return res.json({
        success: true,
        connected: false,
        requiresSetup: true,
        message: 'Stripe Connect is not configured'
      });
    }

    const stripeAccountId = await getVendorStripeAccountId(vendorProfileId);

    if (!stripeAccountId) {
      return res.json({
        success: true,
        connected: false,
        message: 'Vendor not connected to Stripe'
      });
    }

    // Check account status with Stripe
    try {
      const account = await stripe.accounts.retrieve(stripeAccountId);
      
      res.json({
        success: true,
        connected: true,
        accountId: stripeAccountId,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        country: account.country,
        businessType: account.business_type
      });
    } catch (stripeError) {
      console.error('Error retrieving Stripe account:', stripeError);
      res.json({
        success: true,
        connected: false,
        message: 'Stripe account not found or invalid'
      });
    }

  } catch (error) {
    console.error('Error checking vendor connection status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check connection status',
      error: error.message
    });
  }
});

// 4. REFRESH ONBOARDING LINK (if needed)
router.post('/connect/refresh-onboarding/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    
    if (!isStripeConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Stripe Connect is not properly configured'
      });
    }

    const stripeAccountId = await getVendorStripeAccountId(vendorProfileId);

    if (!stripeAccountId) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not connected to Stripe'
      });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/vendor/stripe-setup?refresh=true`,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/vendor/stripe-setup?success=true`,
      type: 'account_onboarding',
    });

    res.json({
      success: true,
      onboardingUrl: accountLink.url
    });

  } catch (error) {
    console.error('Error refreshing onboarding link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh onboarding link',
      error: error.message
    });
  }
});

// 5. GET STRIPE DASHBOARD ACCESS
router.get('/connect/dashboard/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    
    if (!isStripeConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Stripe Connect is not properly configured'
      });
    }

    const stripeAccountId = await getVendorStripeAccountId(vendorProfileId);

    if (!stripeAccountId) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not connected to Stripe'
      });
    }

    // Create login link for Stripe Express dashboard
    const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);

    res.json({
      success: true,
      dashboardUrl: loginLink.url
    });

  } catch (error) {
    console.error('Error creating dashboard link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create dashboard link',
      error: error.message
    });
  }
});

// 6. CREATE DESTINATION CHARGE FOR BOOKING
router.post('/checkout', async (req, res) => {
  try {
    const { 
      paymentMethodId, 
      bookingId, 
      vendorProfileId, 
      amount, 
      currency = 'usd',
      description,
      customerEmail 
    } = req.body;

    if (!isStripeConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Payment processing is not available. Please contact support.'
      });
    }

    // Validate required fields
    if (!paymentMethodId || !bookingId || !vendorProfileId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment information'
      });
    }

    // Get vendor's Stripe Connect account ID
    const vendorStripeAccountId = await getVendorStripeAccountId(vendorProfileId);

    if (!vendorStripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor is not connected to Stripe. Please contact the vendor.'
      });
    }

    // Calculate platform fee (configurable via environment variable; default 5%)
    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '5') / 100;
    // amount is expected in dollars; convert to cents before applying percent
    const platformFeeCents = Math.round(Math.round(amount * 100) * platformFeePercent);

    // Create destination charge
    const charge = await stripe.charges.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      source: paymentMethodId,
      description: description || `Booking payment for booking #${bookingId}`,
      application_fee_amount: platformFeeCents,
      destination: {
        account: vendorStripeAccountId,
      },
      metadata: {
        booking_id: bookingId,
        vendor_profile_id: vendorProfileId,
        platform_fee_percent: (platformFeePercent * 100).toString()
      }
    });

    // Save charge ID to booking
    await saveChargeIdToBooking(bookingId, charge.id);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      chargeId: charge.id,
      amount: charge.amount / 100,
      platformFee: platformFeeCents / 100,
      vendorAmount: (charge.amount - platformFeeCents) / 100
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        message: 'Your card was declined. Please try a different payment method.',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message
    });
  }
});

// Helper function to get vendor profile ID from booking
async function getVendorProfileIdFromBooking(bookingId) {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('BookingID', sql.Int, bookingId);
    
    const result = await request.query(`
      SELECT VendorProfileID 
      FROM Bookings 
      WHERE BookingID = @BookingID
    `);
    
    return result.recordset.length > 0 ? result.recordset[0].VendorProfileID : null;
  } catch (error) {
    console.error('Error fetching vendor profile ID from booking:', error);
    return null;
  }
}

// 7. CREATE CHECKOUT SESSION (Alternative hosted checkout)
router.post('/checkout-session', async (req, res) => {
  try {
    const { 
      bookingId, 
      amount, 
      currency = 'usd',
      description,
      successUrl,
      cancelUrl 
    } = req.body;

    if (!isStripeConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Payment processing is not available'
      });
    }

    // Get vendor profile ID from the booking record
    const vendorProfileId = await getVendorProfileIdFromBooking(bookingId);
    
    if (!vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Booking not found or invalid'
      });
    }

    const vendorStripeAccountId = await getVendorStripeAccountId(vendorProfileId);

    if (!vendorStripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor is not connected to Stripe'
      });
    }

    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '5') / 100;
    const platformFee = Math.round(Math.round(amount * 100) * platformFeePercent);

    // Resolve and sanitize redirect URLs
    let successRedirect = resolveToHttpUrl(successUrl, '/booking-success', req);
    successRedirect = ensureSessionIdParam(successRedirect);
    let cancelRedirect = resolveToHttpUrl(cancelUrl, '/booking-cancelled', req);

    // Debug logging (safe: no card details)
    const baseUrl = getRequestBaseUrl(req);
    console.log('[CheckoutSession] Creating with', {
      bookingId,
      vendorProfileId,
      vendorStripeAccountId,
      amount,
      amountCents: Math.round(amount * 100),
      currency,
      platformFee,
      baseUrl,
      successRedirect,
      cancelRedirect
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: description || `Booking Payment #${bookingId}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successRedirect,
      cancel_url: cancelRedirect,
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: vendorStripeAccountId,
        },
        metadata: {
          booking_id: bookingId,
          vendor_profile_id: vendorProfileId
        }
      }
    });

    // Debug logging (result)
    console.log('[CheckoutSession] Created', { sessionId: session.id, url: session.url });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message
    });
  }
});

// 8. PROCESS REFUND
router.post('/refund/:chargeId', async (req, res) => {
  try {
    const { chargeId } = req.params;
    const { amount, reason } = req.body;

    if (!isStripeConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Refund processing is not available'
      });
    }

    const refundData = {
      charge: chargeId,
      reason: reason || 'requested_by_customer'
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert to cents
    }

    const refund = await stripe.refunds.create(refundData);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Refund processing failed',
      error: error.message
    });
  }
});

// 9a. VERIFY CHECKOUT SESSION (Fallback if webhook is delayed)
router.get('/verify-session', async (req, res) => {
  try {
    const sessionId = req.query.session_id || req.query.sessionId;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Missing session_id' });
    }

    if (!hasStripeSecret()) {
      return res.status(400).json({ success: false, message: 'Stripe secret key is not configured on the API' });
    }

    // Retrieve the Checkout Session and associated PaymentIntent
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentStatus = session?.payment_status || session?.status; // 'paid' for modern sessions
    const paymentIntentId = session && session.payment_intent ? (typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id) : null;

    console.log('[VerifySession] session', sessionId, 'paymentStatus:', paymentStatus, 'payment_intent:', paymentIntentId);

    if (!paymentIntentId) {
      return res.status(400).json({ success: false, message: 'No payment_intent on session' });
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    let bookingId = pi?.metadata?.booking_id || null;

    console.log('[VerifySession] PI status:', pi?.status, 'metadata.booking_id:', bookingId);

    // Fallback: use booking_id passed in success URL if metadata is missing (older sessions)
    if (!bookingId) {
      const qId = parseInt(req.query.booking_id, 10);
      if (Number.isInteger(qId) && qId > 0) {
        console.warn('[VerifySession] Falling back to booking_id from query param:', qId);
        bookingId = qId;
      }
    }

    if (!bookingId) {
      return res.status(404).json({ success: false, message: 'Booking not found in PaymentIntent metadata or query' });
    }

    if (paymentStatus && paymentStatus !== 'paid' && paymentStatus !== 'complete' && paymentStatus !== 'completed' && pi?.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: `Session not paid (status: ${paymentStatus || pi?.status})` });
    }

    // Idempotent update of the booking as paid
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('BookingID', sql.Int, bookingId);
    request.input('Status', sql.NVarChar(20), 'confirmed');
    request.input('StripePaymentIntentID', sql.NVarChar(100), paymentIntentId);
    await request.query(`
      UPDATE Bookings
      SET 
        Status = @Status,
        FullAmountPaid = 1,
        StripePaymentIntentID = ISNULL(@StripePaymentIntentID, StripePaymentIntentID),
        UpdatedAt = GETDATE()
      WHERE BookingID = @BookingID
    `);

    // Also update related booking request if exists (most recent for this user/vendor)
    const bookingInfo = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .query('SELECT UserID, VendorProfileID FROM Bookings WHERE BookingID = @BookingID');
    if (bookingInfo.recordset.length > 0) {
      const userId = bookingInfo.recordset[0].UserID;
      const vendorProfileId = bookingInfo.recordset[0].VendorProfileID;
      await pool.request()
        .input('UserID', sql.Int, userId)
        .input('VendorProfileID', sql.Int, vendorProfileId)
        .input('StripePaymentIntentID', sql.NVarChar(100), paymentIntentId)
        .query(`
          UPDATE BookingRequests
          SET Status = 'confirmed', ConfirmedAt = GETDATE(), PaymentIntentID = @StripePaymentIntentID
          WHERE RequestID = (
            SELECT TOP 1 RequestID FROM BookingRequests
            WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
            ORDER BY CreatedAt DESC
          )
        `);
    }

    res.json({ success: true, bookingId, paymentIntentId });
  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify session', error: error.message });
  }
});

// 9. WEBHOOK HANDLER FOR STRIPE EVENTS
const webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        try {
          const paymentIntent = event.data.object;
          const bookingId = paymentIntent?.metadata?.booking_id;
          console.log(`[Webhook] payment_intent.succeeded for PI ${paymentIntent?.id} booking ${bookingId}`);
          if (bookingId) {
            const pool = await poolPromise;
            const request = new sql.Request(pool);
            request.input('BookingID', sql.Int, bookingId);
            request.input('Status', sql.NVarChar(20), 'confirmed');
            request.input('StripePaymentIntentID', sql.NVarChar(100), paymentIntent.id);
            await request.query(`
              UPDATE Bookings 
              SET Status = @Status, FullAmountPaid = 1, StripePaymentIntentID = @StripePaymentIntentID, UpdatedAt = GETDATE()
              WHERE BookingID = @BookingID
            `);

            // Also update related booking request if exists (most recent for this user/vendor)
            const bookingInfo = await pool.request()
              .input('BookingID', sql.Int, bookingId)
              .query('SELECT UserID, VendorProfileID FROM Bookings WHERE BookingID = @BookingID');
            if (bookingInfo.recordset.length > 0) {
              const userId = bookingInfo.recordset[0].UserID;
              const vendorProfileId = bookingInfo.recordset[0].VendorProfileID;
              await pool.request()
                .input('UserID', sql.Int, userId)
                .input('VendorProfileID', sql.Int, vendorProfileId)
                .input('StripePaymentIntentID', sql.NVarChar(100), paymentIntent.id)
                .query(`
                  UPDATE BookingRequests
                  SET Status = 'confirmed', ConfirmedAt = GETDATE(), PaymentIntentID = @StripePaymentIntentID
                  WHERE RequestID = (
                    SELECT TOP 1 RequestID FROM BookingRequests
                    WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
                    ORDER BY CreatedAt DESC
                  )
                `);
            }
          }
        } catch (piErr) {
          console.error('Error handling payment_intent.succeeded:', piErr);
        }
        break;

      case 'checkout.session.completed':
        try {
          const session = event.data.object;
          const paymentIntentId = session.payment_intent;
          console.log(`[Webhook] checkout.session.completed, PI: ${paymentIntentId}`);
          if (paymentIntentId) {
            const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
            const bookingId = pi?.metadata?.booking_id;
            if (bookingId) {
              const pool = await poolPromise;
              const request = new sql.Request(pool);
              request.input('BookingID', sql.Int, bookingId);
              request.input('Status', sql.NVarChar(20), 'confirmed');
              request.input('StripePaymentIntentID', sql.NVarChar(100), paymentIntentId);
              await request.query(`
                UPDATE Bookings 
                SET Status = @Status, FullAmountPaid = 1, StripePaymentIntentID = @StripePaymentIntentID, UpdatedAt = GETDATE()
                WHERE BookingID = @BookingID
              `);

              // Also update related booking request if exists (most recent for this user/vendor)
              const bookingInfo = await pool.request()
                .input('BookingID', sql.Int, bookingId)
                .query('SELECT UserID, VendorProfileID FROM Bookings WHERE BookingID = @BookingID');
              if (bookingInfo.recordset.length > 0) {
                const userId = bookingInfo.recordset[0].UserID;
                const vendorProfileId = bookingInfo.recordset[0].VendorProfileID;
                await pool.request()
                  .input('UserID', sql.Int, userId)
                  .input('VendorProfileID', sql.Int, vendorProfileId)
                  .input('StripePaymentIntentID', sql.NVarChar(100), paymentIntentId)
                  .query(`
                    UPDATE BookingRequests
                    SET Status = 'confirmed', ConfirmedAt = GETDATE(), PaymentIntentID = @StripePaymentIntentID
                    WHERE RequestID = (
                      SELECT TOP 1 RequestID FROM BookingRequests
                      WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
                      ORDER BY CreatedAt DESC
                    )
                  `);
              }
            }
          }
        } catch (csErr) {
          console.error('Error handling checkout.session.completed:', csErr);
        }
        break;

      case 'charge.succeeded':
        const charge = event.data.object;
        console.log(`Payment succeeded for charge ${charge.id}`);
        
        // Update booking status to 'confirmed' or 'paid'
        try {
          let bookingIdFromCharge = charge?.metadata?.booking_id;
          // Fallback: retrieve PaymentIntent to get metadata when not present on Charge
          if (!bookingIdFromCharge && charge?.payment_intent) {
            try {
              const pi = await stripe.paymentIntents.retrieve(charge.payment_intent);
              bookingIdFromCharge = pi?.metadata?.booking_id;
            } catch (retrieveErr) {
              console.warn('Could not retrieve PaymentIntent for charge metadata:', retrieveErr?.message);
            }
          }

          if (bookingIdFromCharge) {
            const pool = await poolPromise;
            const request = new sql.Request(pool);
            request.input('BookingID', sql.Int, bookingIdFromCharge);
            request.input('Status', sql.NVarChar(20), 'confirmed');
            request.input('StripePaymentIntentID', sql.NVarChar(100), charge.payment_intent || null);
            await request.query(`
              UPDATE Bookings 
              SET Status = @Status, FullAmountPaid = 1, StripePaymentIntentID = ISNULL(@StripePaymentIntentID, StripePaymentIntentID), UpdatedAt = GETDATE()
              WHERE BookingID = @BookingID
            `);

            // Also update related booking request if exists (most recent for this user/vendor)
            const bookingInfo = await pool.request()
              .input('BookingID', sql.Int, bookingIdFromCharge)
              .query('SELECT UserID, VendorProfileID FROM Bookings WHERE BookingID = @BookingID');
            if (bookingInfo.recordset.length > 0) {
              const userId = bookingInfo.recordset[0].UserID;
              const vendorProfileId = bookingInfo.recordset[0].VendorProfileID;
              await pool.request()
                .input('UserID', sql.Int, userId)
                .input('VendorProfileID', sql.Int, vendorProfileId)
                .input('StripePaymentIntentID', sql.NVarChar(100), charge.payment_intent || null)
                .query(`
                  UPDATE BookingRequests
                  SET Status = 'confirmed', ConfirmedAt = GETDATE(), PaymentIntentID = @StripePaymentIntentID
                  WHERE RequestID = (
                    SELECT TOP 1 RequestID FROM BookingRequests
                    WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
                    ORDER BY CreatedAt DESC
                  )
                `);
            }
          }
        } catch (chErr) {
          console.error('Error updating booking on charge.succeeded:', chErr);
        }
        break;

      case 'charge.failed':
        const failedCharge = event.data.object;
        console.log(`Payment failed for charge ${failedCharge.id}`);
        
        // Update booking status to 'payment_failed'
        if (failedCharge.metadata.booking_id) {
          const pool = await poolPromise;
          const request = new sql.Request(pool);
          request.input('BookingID', sql.Int, failedCharge.metadata.booking_id);
          request.input('Status', sql.NVarChar(20), 'payment_failed');
          
          await request.query(`
            UPDATE Bookings 
            SET Status = @Status, UpdatedAt = GETDATE()
            WHERE BookingID = @BookingID
          `);
        }
        break;

      case 'charge.refunded':
        const refundedCharge = event.data.object;
        console.log(`Refund processed for charge ${refundedCharge.id}`);
        
        // Update booking with refund information
        if (refundedCharge.metadata.booking_id) {
          const pool = await poolPromise;
          const request = new sql.Request(pool);
          request.input('BookingID', sql.Int, refundedCharge.metadata.booking_id);
          request.input('RefundAmount', sql.Decimal(10, 2), refundedCharge.amount_refunded / 100);
          request.input('Status', sql.NVarChar(20), 'refunded');
          
          await request.query(`
            UPDATE Bookings 
            SET RefundAmount = @RefundAmount, Status = @Status, UpdatedAt = GETDATE()
            WHERE BookingID = @BookingID
          `);
        }
        break;

      case 'account.updated':
        const account = event.data.object;
        console.log(`Connected account ${account.id} was updated`);
        
        // You can update vendor account status in your database here
        // This is useful for tracking when vendors complete their onboarding
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = { router, webhook };
