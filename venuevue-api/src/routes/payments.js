const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { poolPromise } = require('../config/db');
const sql = require('mssql');
const invoicesRouter = require('./invoices');

// Helper function to check if Stripe is properly configured
function isStripeConfigured() {
  return process.env.STRIPE_SECRET_KEY && 
         process.env.STRIPE_PUBLISHABLE_KEY && 
         process.env.STRIPE_CLIENT_ID &&
         !process.env.STRIPE_SECRET_KEY.includes('placeholder') &&
         !process.env.STRIPE_PUBLISHABLE_KEY.includes('placeholder');
}

async function getInvoiceTotalsCents(bookingId) {
  const pool = await poolPromise;
  try { if (invoicesRouter && typeof invoicesRouter.upsertInvoiceForBooking === 'function') { await invoicesRouter.upsertInvoiceForBooking(pool, bookingId, { forceRegenerate: true }); } } catch (_) {}
  const r = pool.request();
  r.input('BookingID', sql.Int, bookingId);
  const q = await r.query(`SELECT TOP 1 InvoiceID, Subtotal, TaxAmount, TotalAmount, PlatformFee, StripeFee FROM Invoices WHERE BookingID=@BookingID ORDER BY IssueDate DESC`);
  if (!q.recordset.length) {
    // Fallback: compute totals directly from booking/services/expenses
    const pctPlatform = parseFloat(process.env.PLATFORM_FEE_PERCENT || '8') / 100;
    const pctStripe = parseFloat(process.env.STRIPE_FEE_PERCENT || process.env.STRIPE_PROC_FEE_PERCENT || '2.9') / 100;
    const fixedStripe = parseFloat(process.env.STRIPE_FEE_FIXED || process.env.STRIPE_PROC_FEE_FIXED || '0.30');
    const pctTax = parseFloat(process.env.TAX_PERCENT || '0') / 100;

    // Get booking core
    const b = await pool.request().input('BookingID', sql.Int, bookingId)
      .query('SELECT TOP 1 TotalAmount FROM Bookings WHERE BookingID=@BookingID');
    const bookingTotal = Number(b.recordset[0]?.TotalAmount || 0);

    // Sum services if available
    let servicesSubtotal = 0;
    try {
      const bs = await pool.request().input('BookingID', sql.Int, bookingId).query(`
        SELECT Quantity, PriceAtBooking FROM BookingServices WHERE BookingID=@BookingID
      `);
      if (bs.recordset.length) {
        servicesSubtotal = bs.recordset.reduce((s, row) => s + (Number(row.Quantity || 1) * Number(row.PriceAtBooking || 0)), 0);
      }
    } catch (_) { /* ignore */ }
    if (servicesSubtotal <= 0 && bookingTotal > 0) servicesSubtotal = bookingTotal;

    // Sum expenses if table exists
    let expensesTotal = 0;
    try {
      const ex = await pool.request().input('BookingID', sql.Int, bookingId).query(`
        SELECT Amount FROM BookingExpenses WHERE BookingID=@BookingID
      `);
      expensesTotal = ex.recordset.reduce((s, row) => s + Number(row.Amount || 0), 0);
    } catch (err) { /* table may not exist; ignore */ }

    const subtotal = Math.round((servicesSubtotal + expensesTotal) * 100) / 100;
    const platformFee = Math.round((subtotal * pctPlatform) * 100) / 100;
    const taxAmount = Math.round(((subtotal + platformFee) * pctTax) * 100) / 100;
    const stripeFee = Math.round(((subtotal * pctStripe) + fixedStripe) * 100) / 100;
    const total = Math.round((subtotal + platformFee + taxAmount + stripeFee) * 100) / 100;

    return {
      totalAmountCents: Math.round(total * 100),
      platformFeeCents: Math.round(platformFee * 100),
      stripeFeeCents: Math.round(stripeFee * 100),
      subtotalCents: Math.round(subtotal * 100),
      taxCents: Math.round(taxAmount * 100),
      invoiceId: null
    };
  }
  const row = q.recordset[0];
  return {
    totalAmountCents: Math.round(Number(row.TotalAmount || 0) * 100),
    platformFeeCents: Math.round(Number(row.PlatformFee || 0) * 100),
    stripeFeeCents: Math.round(Number(row.StripeFee || 0) * 100),
    subtotalCents: Math.round(Number(row.Subtotal || 0) * 100),
    taxCents: Math.round(Number(row.TaxAmount || 0) * 100),
    invoiceId: row.InvoiceID
  };
}

async function existsRecentTransaction({ bookingId, amount, externalId = null, minutes = 180 }) {
  try {
    const pool = await poolPromise;
    const req = pool.request();
    req.input('BookingID', sql.Int, bookingId);
    req.input('Amount', sql.Decimal(10,2), Math.round(Number(amount || 0) * 100) / 100);
    req.input('Ext', sql.NVarChar(100), externalId || null);
    req.input('Minutes', sql.Int, minutes);
    const q = await req.query(`
      SELECT TOP 1 TransactionID
      FROM Transactions
      WHERE BookingID = @BookingID AND Status = 'succeeded' AND (
        (StripeChargeID IS NOT NULL AND @Ext IS NOT NULL AND StripeChargeID = @Ext)
        OR (ABS(Amount - @Amount) < 0.01 AND CreatedAt > DATEADD(minute, -@Minutes, GETDATE()))
      )
    `);
    return q.recordset.length > 0;
  } catch (_) { return false; }
}

function estimateProcessingFee(amount) {
  try {
    const pct = parseFloat(process.env.STRIPE_PROC_FEE_PERCENT || process.env.STRIPE_FEE_PERCENT || '2.9') / 100;
    const fixed = parseFloat(process.env.STRIPE_PROC_FEE_FIXED || process.env.STRIPE_FEE_FIXED || '0.30');
    const n = Number(amount || 0);
    return Math.round(((n * pct) + fixed) * 100) / 100;
  } catch (_) { return 0; }
}

function getStripeCurrency() {
  try {
    const c = (process.env.STRIPE_CURRENCY || 'cad').toLowerCase();
    return (c === 'cad' || c === 'usd' || c === 'eur' || c === 'gbp') ? c : 'cad';
  } catch (_) { return 'cad'; }
}

async function recordTransaction({ bookingId, userId = null, vendorProfileId = null, amount, currency = 'CAD', stripeChargeId = null, description = 'Payment', feeAmount = null }) {
  const pool = await poolPromise;
  const amt = Math.round(Number(amount || 0) * 100) / 100;
  const fee = typeof feeAmount === 'number' ? Math.round(feeAmount * 100) / 100 : estimateProcessingFee(amt);
  const net = Math.round((amt - fee) * 100) / 100;
  // Idempotency: do not insert duplicate charge/payment intent
  if (stripeChargeId) {
    const exists = await pool.request()
      .input('StripeChargeID', sql.NVarChar(100), String(stripeChargeId))
      .query('SELECT TOP 1 TransactionID FROM Transactions WHERE StripeChargeID = @StripeChargeID');
    if (exists.recordset.length) return exists.recordset[0].TransactionID;
  }
  const req = pool.request();
  req.input('UserID', sql.Int, userId || null);
  req.input('VendorProfileID', sql.Int, vendorProfileId || null);
  req.input('BookingID', sql.Int, bookingId);
  req.input('Amount', sql.Decimal(10,2), amt);
  req.input('FeeAmount', sql.Decimal(10,2), fee);
  req.input('NetAmount', sql.Decimal(10,2), net);
  req.input('Currency', sql.NVarChar(3), (currency || getStripeCurrency().toUpperCase()).toUpperCase());
  req.input('Description', sql.NVarChar(255), description || 'Payment');
  req.input('StripeChargeID', sql.NVarChar(100), stripeChargeId || null);
  req.input('Status', sql.NVarChar(20), 'succeeded');
  const ins = await req.query(`
    INSERT INTO Transactions (UserID, VendorProfileID, BookingID, Amount, FeeAmount, NetAmount, Currency, Description, StripeChargeID, Status, CreatedAt)
    OUTPUT INSERTED.TransactionID
    VALUES (@UserID, @VendorProfileID, @BookingID, @Amount, @FeeAmount, @NetAmount, @Currency, @Description, @StripeChargeID, @Status, GETDATE())
  `);
  return ins.recordset[0]?.TransactionID || null;
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
    // Prefer a configured stable frontend URL to avoid deploy-preview subdomain issues
    const configured = process.env.FRONTEND_URL;
    if (configured && isValidHttpUrl(configured)) return configured;

    const origin = req.headers.origin || (req.get && req.get('Origin'));
    if (origin && isValidHttpUrl(origin)) return origin;
    const referer = req.headers.referer || (req.get && req.get('Referer'));
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

// 10a. GET STRIPE RECEIPT/INVOICE URL FOR A BOOKING
router.get('/receipt/:bookingId', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    if (!Number.isInteger(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid bookingId' });
    }
    if (!hasStripeSecret()) {
      return res.status(400).json({ success: false, message: 'Stripe is not configured' });
    }

    const pool = await poolPromise;
    const r = pool.request();
    r.input('BookingID', sql.Int, bookingId);
    const qb = await r.query(`SELECT TOP 1 StripePaymentIntentID FROM Bookings WHERE BookingID=@BookingID`);
    if (!qb.recordset.length) return res.status(404).json({ success: false, message: 'Booking not found' });

    const piId = qb.recordset[0]?.StripePaymentIntentID || null;
    let pi = null;
    let charge = null;
    let receiptUrl = null;

    if (piId) {
      pi = await stripe.paymentIntents.retrieve(piId, { expand: ['charges.data.balance_transaction'] });
      const ch = pi?.charges?.data && pi.charges.data.length ? pi.charges.data[0] : null;
      if (ch) {
        charge = ch;
        receiptUrl = ch.receipt_url || null;
      }
    }

    if (!receiptUrl) {
      const tx = await pool.request()
        .input('BookingID', sql.Int, bookingId)
        .query(`SELECT TOP 1 StripeChargeID FROM Transactions WHERE BookingID=@BookingID AND Status='succeeded' ORDER BY CreatedAt DESC`);
      const chId = tx.recordset[0]?.StripeChargeID || null;
      if (chId) {
        charge = await stripe.charges.retrieve(chId);
        receiptUrl = charge?.receipt_url || null;
      }
    }

    const md = (pi && pi.metadata) || (charge && charge.metadata) || {};
    const breakdown = {
      subtotal_cents: md.subtotal_cents ? parseInt(md.subtotal_cents, 10) : null,
      platform_fee_cents: md.platform_fee_cents ? parseInt(md.platform_fee_cents, 10) : null,
      tax_cents: md.tax_cents ? parseInt(md.tax_cents, 10) : null,
      total_cents: md.total_cents ? parseInt(md.total_cents, 10) : null,
      tax_percent: md.tax_percent ? parseFloat(md.tax_percent) : null,
    };

    return res.json({
      success: !!receiptUrl,
      bookingId,
      paymentIntentId: pi?.id || (charge?.payment_intent || null),
      chargeId: charge?.id || null,
      amount: (typeof (pi?.amount_received) === 'number' ? pi.amount_received : (typeof (charge?.amount) === 'number' ? charge.amount : null))?.valueOf() != null
        ? ((pi?.amount_received ?? charge?.amount) / 100)
        : null,
      currency: (pi?.currency || charge?.currency || 'usd').toUpperCase(),
      receiptUrl: receiptUrl,
      breakdown
    });
  } catch (error) {
    console.error('Receipt retrieval error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch receipt', error: error.message });
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
      currency = 'cad',
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

    // Prevent duplicate payment attempts if booking is already fully paid
    try {
      const pool = await poolPromise;
      const check = await pool.request()
        .input('BookingID', sql.Int, bookingId)
        .query('SELECT FullAmountPaid FROM Bookings WHERE BookingID = @BookingID');
      if (check.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      const paidFlag = check.recordset[0].FullAmountPaid;
      const alreadyPaid = paidFlag === true || paidFlag === 1;
      if (alreadyPaid) {
        return res.status(409).json({ success: false, message: 'This booking is already paid.' });
      }
    } catch (dbErr) {
      console.warn('[Checkout] Could not verify booking paid status:', dbErr?.message);
    }

    // Get vendor's Stripe Connect account ID
    const vendorStripeAccountId = await getVendorStripeAccountId(vendorProfileId);

    if (!vendorStripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor is not connected to Stripe. Please contact the vendor.'
      });
    }

    // Calculate platform fee (configurable via environment variable; default 8%)
    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '8') / 100;
    const invTotals1 = await getInvoiceTotalsCents(bookingId);
    const platformFeeCents = (invTotals1.platformFeeCents != null) ? invTotals1.platformFeeCents : Math.round(Math.round(amount * 100) * platformFeePercent);
    const applicationFeeCents = platformFeeCents; // platform collects only its fee; processing fee is covered by higher charge amount
    const chargeAmountCents = invTotals1.totalAmountCents || Math.round(amount * 100);
    const taxPercentRaw = parseFloat(process.env.TAX_PERCENT || '0');

    // Create destination charge
    const charge = await stripe.charges.create({
      amount: chargeAmountCents,
      currency: currency,
      source: paymentMethodId,
      description: description || `Booking payment for booking #${bookingId}`,
      application_fee_amount: applicationFeeCents,
      destination: {
        account: vendorStripeAccountId,
      },
      metadata: {
        booking_id: bookingId,
        vendor_profile_id: vendorProfileId,
        platform_fee_percent: (platformFeePercent * 100).toString(),
        invoice_id: invTotals1.invoiceId || '',
        subtotal_cents: String(invTotals1.subtotalCents || 0),
        platform_fee_cents: String(platformFeeCents),
        tax_cents: String(invTotals1.taxCents || 0),
        total_cents: String(chargeAmountCents),
        tax_percent: String(Number.isFinite(taxPercentRaw) ? taxPercentRaw : 0)
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

// 6a. CREATE PAYMENT INTENT (for in-app modal with Payment Element)
router.post('/payment-intent', async (req, res) => {
  try {
    const {
      bookingId,
      vendorProfileId,
      amount,
      currency = 'cad',
      description
    } = req.body;

    if (!isStripeConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Payment processing is not available. Please contact support.'
      });
    }

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment information'
      });
    }

    // Prevent duplicate payments for already-paid bookings
    try {
      const pool = await poolPromise;
      const check = await pool.request()
        .input('BookingID', sql.Int, bookingId)
        .query('SELECT FullAmountPaid FROM Bookings WHERE BookingID = @BookingID');
      if (check.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      const paidFlag = check.recordset[0].FullAmountPaid;
      const alreadyPaid = paidFlag === true || paidFlag === 1;
      if (alreadyPaid) {
        return res.status(409).json({ success: false, message: 'This booking is already paid.' });
      }
    } catch (dbErr) {
      console.warn('[PaymentIntent] Could not verify booking paid status:', dbErr?.message);
    }

    // Resolve vendor profile from input or booking
    let resolvedVendorProfileId = vendorProfileId;
    if (!resolvedVendorProfileId) {
      resolvedVendorProfileId = await getVendorProfileIdFromBooking(bookingId);
    }

    const vendorStripeAccountId = await getVendorStripeAccountId(resolvedVendorProfileId);
    if (!vendorStripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor is not connected to Stripe. Please contact the vendor.'
      });
    }

    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '8') / 100;
    const invTotals2 = await getInvoiceTotalsCents(bookingId);
    const amountCents = invTotals2.totalAmountCents;
    if (!amountCents || amountCents < 50) {
      return res.status(400).json({ success: false, message: 'Unable to compute invoice total for payment' });
    }
    const applicationFee = (invTotals2.platformFeeCents != null) ? invTotals2.platformFeeCents : Math.round(amountCents * platformFeePercent);
    const taxPercentRaw2 = parseFloat(process.env.TAX_PERCENT || '0');

    // Create a PaymentIntent on the platform with destination charge to the connected account
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      description: description || `Booking Payment #${bookingId}`,
      automatic_payment_methods: { enabled: true },
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: vendorStripeAccountId,
      },
      metadata: {
        booking_id: bookingId,
        vendor_profile_id: resolvedVendorProfileId,
        platform_fee_percent: String(platformFeePercent * 100),
        invoice_id: invTotals2.invoiceId || '',
        subtotal_cents: String(invTotals2.subtotalCents || 0),
        platform_fee_cents: String(applicationFee),
        tax_cents: String(invTotals2.taxCents || 0),
        total_cents: String(amountCents),
        tax_percent: String(Number.isFinite(taxPercentRaw2) ? taxPercentRaw2 : 0)
      }
    });

    return res.json({
      success: true,
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  } catch (error) {
    console.error('PaymentIntent creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
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
      currency = 'cad',
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

    // Server-side safety: prevent creating a Checkout Session for an already-paid booking
    try {
      const pool = await poolPromise;
      const check = await pool.request()
        .input('BookingID', sql.Int, bookingId)
        .query('SELECT FullAmountPaid FROM Bookings WHERE BookingID = @BookingID');
      if (check.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      const paidFlag = check.recordset[0].FullAmountPaid;
      const alreadyPaid = paidFlag === true || paidFlag === 1;
      if (alreadyPaid) {
        return res.status(409).json({
          success: false,
          message: 'This booking is already paid.'
        });
      }
    } catch (dbErr) {
      console.warn('[CheckoutSession] Could not verify booking paid status:', dbErr?.message);
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

    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '8') / 100;
    const invTotals3 = await getInvoiceTotalsCents(bookingId);
    const totalAmountCents = invTotals3.totalAmountCents;
    if (!totalAmountCents || totalAmountCents < 50) {
      return res.status(400).json({ success: false, message: 'Unable to compute invoice total for checkout session' });
    }
    const platformFee = (invTotals3.platformFeeCents != null) ? invTotals3.platformFeeCents : Math.round(totalAmountCents * platformFeePercent);
    const taxPercentRaw3 = parseFloat(process.env.TAX_PERCENT || '0');

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
          unit_amount: totalAmountCents,
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
          vendor_profile_id: vendorProfileId,
          invoice_id: invTotals3.invoiceId || '',
          subtotal_cents: String(invTotals3.subtotalCents || 0),
          platform_fee_cents: String(platformFee),
          tax_cents: String(invTotals3.taxCents || 0),
          total_cents: String(totalAmountCents),
          tax_percent: String(Number.isFinite(taxPercentRaw3) ? taxPercentRaw3 : 0)
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

    if (String(sessionId).includes('{CHECKOUT_SESSION_ID}')) {
      return res.status(400).json({ success: false, message: 'Invalid session_id placeholder. This page must be opened via Stripe redirect, not directly.' });
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

    // Record a transaction row and regenerate the invoice snapshot
    try {
      const binfo = await pool.request().input('BookingID', sql.Int, bookingId)
        .query('SELECT UserID, VendorProfileID, TotalAmount FROM Bookings WHERE BookingID = @BookingID');
      const row = binfo.recordset[0] || {};
      const paidAmount = ((pi && typeof pi.amount_received === 'number') ? pi.amount_received : (pi && typeof pi.amount === 'number' ? pi.amount : 0)) / 100;
      const exists = await existsRecentTransaction({ bookingId, amount: paidAmount || row.TotalAmount, externalId: paymentIntentId, minutes: 240 });
      if (!exists) {
        const txnCurrency = (pi && typeof pi.currency === 'string' && pi.currency) ? pi.currency.toUpperCase() : 'CAD';
        await recordTransaction({
          bookingId,
          userId: row.UserID,
          vendorProfileId: row.VendorProfileID,
          amount: paidAmount || row.TotalAmount,
          currency: txnCurrency,
          stripeChargeId: paymentIntentId,
          description: 'Stripe Payment (verified)'
        });
      }
      if (invoicesRouter && typeof invoicesRouter.upsertInvoiceForBooking === 'function') {
        try { await invoicesRouter.upsertInvoiceForBooking(await poolPromise, bookingId, { forceRegenerate: true }); } catch (_) {}
      }
    } catch (txErr) { console.warn('[VerifySession] recordTransaction error', txErr?.message); }

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

// 9b. VERIFY PAYMENT INTENT (Fallback if webhook is delayed)
router.get('/verify-intent', async (req, res) => {
  try {
    const paymentIntentId = req.query.payment_intent || req.query.paymentIntentId;
    if (!paymentIntentId) {
      return res.status(400).json({ success: false, message: 'Missing payment_intent' });
    }

    if (!hasStripeSecret()) {
      return res.status(400).json({ success: false, message: 'Stripe secret key is not configured on the API' });
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    const status = pi?.status;
    let bookingId = pi?.metadata?.booking_id || null;

    if (!bookingId) {
      return res.status(404).json({ success: false, message: 'Booking not found in PaymentIntent metadata' });
    }

    if (status !== 'succeeded') {
      return res.status(400).json({ success: false, message: `PaymentIntent not paid (status: ${status})` });
    }

    // Idempotently mark booking as paid/confirmed
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

    // Record transaction and regenerate invoice
    try {
      const binfo = await pool.request().input('BookingID', sql.Int, bookingId)
        .query('SELECT UserID, VendorProfileID, TotalAmount FROM Bookings WHERE BookingID = @BookingID');
      const row = binfo.recordset[0] || {};
      const paidAmount = ((pi && typeof pi.amount_received === 'number') ? pi.amount_received : (pi && typeof pi.amount === 'number' ? pi.amount : 0)) / 100;
      const exists = await existsRecentTransaction({ bookingId, amount: paidAmount, externalId: paymentIntentId, minutes: 240 });
      if (!exists) {
        const txnCurrency = (pi && typeof pi.currency === 'string' && pi.currency) ? pi.currency.toUpperCase() : 'CAD';
        await recordTransaction({
          bookingId,
          userId: row.UserID,
          vendorProfileId: row.VendorProfileID,
          amount: paidAmount,
          currency: txnCurrency,
          stripeChargeId: paymentIntentId,
          description: 'Stripe Payment (verified)'
        });
      }
      if (invoicesRouter && typeof invoicesRouter.upsertInvoiceForBooking === 'function') {
        try { await invoicesRouter.upsertInvoiceForBooking(await poolPromise, bookingId, { forceRegenerate: true }); } catch (_) {}
      }
    } catch (txErr) { console.warn('[VerifyIntent] recordTransaction error', txErr?.message); }

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

    return res.json({ success: true, bookingId, paymentIntentId });
  } catch (error) {
    console.error('Verify intent error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify intent', error: error.message });
  }
});

// 9. WEBHOOK HANDLER FOR STRIPE EVENTS
const webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('[Webhook] Received webhook request');
  console.log('[Webhook] Signature present:', !!sig);
  console.log('[Webhook] Endpoint secret configured:', !!endpointSecret && !endpointSecret.includes('placeholder'));

  let event;

  try {
    if (!endpointSecret || endpointSecret.includes('placeholder')) {
      console.error('[Webhook] Webhook secret not properly configured');
      return res.status(400).send('Webhook Error: Webhook secret not configured');
    }
    
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('[Webhook] Event verified successfully:', event.type);
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

            try {
              const binfo = await pool.request().input('BookingID', sql.Int, bookingId)
                .query('SELECT UserID, VendorProfileID, TotalAmount FROM Bookings WHERE BookingID = @BookingID');
              const row = binfo.recordset[0] || {};
              const exists = await existsRecentTransaction({ bookingId, amount: row.TotalAmount, externalId: paymentIntent.id, minutes: 240 });
              if (!exists) {
                await recordTransaction({
                  bookingId,
                  userId: row.UserID,
                  vendorProfileId: row.VendorProfileID,
                  amount: row.TotalAmount,
                  currency: (pi && typeof pi.currency === 'string' && pi.currency) ? pi.currency.toUpperCase() : 'CAD',
                  stripeChargeId: paymentIntent.id,
                  description: 'Stripe Payment (webhook PI)'
                });
              }
              if (invoicesRouter && typeof invoicesRouter.upsertInvoiceForBooking === 'function') {
                try { await invoicesRouter.upsertInvoiceForBooking(await poolPromise, bookingId, { forceRegenerate: true }); } catch (_) {}
              }
            } catch (e) { console.warn('[Webhook PI] recordTransaction error', e?.message); }

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

            try {
              const binfo = await pool.request().input('BookingID', sql.Int, bookingIdFromCharge)
                .query('SELECT UserID, VendorProfileID, TotalAmount FROM Bookings WHERE BookingID = @BookingID');
              const row = binfo.recordset[0] || {};
              const fee = typeof charge.balance_transaction === 'object' && charge.balance_transaction?.fee
                ? (charge.balance_transaction.fee / 100)
                : null;
              const exists = await existsRecentTransaction({ bookingId: bookingIdFromCharge, amount: (charge.amount/100), externalId: charge.id, minutes: 240 });
              if (!exists) {
                await recordTransaction({
                  bookingId: bookingIdFromCharge,
                  userId: row.UserID,
                  vendorProfileId: row.VendorProfileID,
                  amount: (charge.amount / 100),
                  currency: (charge && typeof charge.currency === 'string' && charge.currency) ? charge.currency.toUpperCase() : 'CAD',
                  stripeChargeId: charge.id,
                  description: 'Stripe Charge',
                  feeAmount: fee
                });
              }
              if (invoicesRouter && typeof invoicesRouter.upsertInvoiceForBooking === 'function') {
                try { await invoicesRouter.upsertInvoiceForBooking(await poolPromise, bookingIdFromCharge, { forceRegenerate: true }); } catch (_) {}
              }
            } catch (e) { console.warn('[Webhook charge.succeeded] recordTransaction error', e?.message); }

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

// 10. CHECK BOOKING PAYMENT STATUS
router.get('/booking/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('BookingID', sql.Int, bookingId);
    
    const result = await request.query(`
      SELECT 
        BookingID,
        Status,
        FullAmountPaid,
        DepositPaid,
        StripePaymentIntentID,
        TotalAmount,
        UpdatedAt
      FROM Bookings 
      WHERE BookingID = @BookingID
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    const booking = result.recordset[0];
    const isPaid = booking.FullAmountPaid === true || booking.FullAmountPaid === 1;
    const isDepositPaid = booking.DepositPaid === true || booking.DepositPaid === 1;
    
    res.json({
      success: true,
      bookingId: booking.BookingID,
      status: booking.Status,
      isPaid: isPaid,
      isDepositPaid: isDepositPaid,
      paymentIntentId: booking.StripePaymentIntentID,
      totalAmount: booking.TotalAmount,
      lastUpdated: booking.UpdatedAt
    });
    
  } catch (error) {
    console.error('Error checking booking payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message
    });
  }
});

// 0. REDIRECT LANDING PAGE FOR STRIPE CONFIRMATION
router.get('/redirect-complete', (req, res) => {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Payment Complete</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;padding:24px;max-width:680px;margin:40px auto;color:#111827}</style></head><body><h2>Payment confirmation received</h2><p>You can safely return to the app.</p></body></html>`;
  res.set('Content-Type', 'text/html').send(html);
});

// 0a. PUBLIC CONFIG: expose Stripe publishable key for frontend
router.get('/config', (req, res) => {
  try {
    const key = process.env.STRIPE_PUBLISHABLE_KEY || '';
    const valid = !!key && !key.includes('placeholder');
    res.json({ success: valid, publishableKey: valid ? key : null });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load config' });
  }
});

module.exports = { router, webhook };
