const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { poolPromise, sql } = require('../config/db');
const invoicesRouter = require('./invoices');

// Helper function to check if Stripe is properly configured
function isStripeConfigured() {
  return process.env.STRIPE_SECRET_KEY && 
         process.env.STRIPE_PUBLISHABLE_KEY && 
         process.env.STRIPE_CLIENT_ID &&
         !process.env.STRIPE_SECRET_KEY.includes('placeholder') &&
         !process.env.STRIPE_PUBLISHABLE_KEY.includes('placeholder');
}

// Canadian province tax rates (2024)
const PROVINCE_TAX_RATES = {
  'Alberta': { rate: 5, type: 'GST', label: 'GST 5%' },
  'British Columbia': { rate: 12, type: 'GST+PST', label: 'GST 5% + PST 7%' },
  'Manitoba': { rate: 12, type: 'GST+PST', label: 'GST 5% + PST 7%' },
  'New Brunswick': { rate: 15, type: 'HST', label: 'HST 15%' },
  'Newfoundland and Labrador': { rate: 15, type: 'HST', label: 'HST 15%' },
  'Northwest Territories': { rate: 5, type: 'GST', label: 'GST 5%' },
  'Nova Scotia': { rate: 15, type: 'HST', label: 'HST 15%' },
  'Nunavut': { rate: 5, type: 'GST', label: 'GST 5%' },
  'Ontario': { rate: 13, type: 'HST', label: 'HST 13%' },
  'Prince Edward Island': { rate: 15, type: 'HST', label: 'HST 15%' },
  'Quebec': { rate: 14.975, type: 'GST+QST', label: 'GST 5% + QST 9.975%' },
  'Saskatchewan': { rate: 11, type: 'GST+PST', label: 'GST 5% + PST 6%' },
  'Yukon': { rate: 5, type: 'GST', label: 'GST 5%' }
};

// Get tax rate for a province (returns percentage as number, e.g., 13 for 13%)
function getTaxRateForProvince(province) {
  if (!province) return 13; // Default to Ontario HST
  const normalized = province.trim();
  const taxInfo = PROVINCE_TAX_RATES[normalized];
  return taxInfo ? taxInfo.rate : 13;
}

// Get full tax info for a province
function getTaxInfoForProvince(province) {
  if (!province) return { rate: 13, type: 'HST', label: 'HST 13%' };
  const normalized = province.trim();
  return PROVINCE_TAX_RATES[normalized] || { rate: 13, type: 'HST', label: 'HST 13%' };
}

// Fetch commission settings from database (with env fallbacks)
async function getCommissionSettings() {
  const defaults = {
    platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT || '5'),
    stripeFeePercent: parseFloat(process.env.STRIPE_FEE_PERCENT || '2.9'),
    stripeFeeFixed: parseFloat(process.env.STRIPE_FEE_FIXED || '0.30'),
    taxPercent: parseFloat(process.env.TAX_PERCENT || '13'), // HST 13%
    currency: (process.env.STRIPE_CURRENCY || 'cad').toLowerCase()
  };

  try {
    const pool = await poolPromise;
    const tableCheck = await pool.request().execute('payments.sp_CheckCommissionTable');
    
    if (tableCheck.recordset[0].cnt === 0) {
      return defaults;
    }

    const result = await pool.request().execute('payments.sp_GetCommissionSettings');

    const settings = { ...defaults };
    result.recordset.forEach(row => {
      const key = row.SettingKey?.toLowerCase();
      const val = parseFloat(row.SettingValue);
      if (!isNaN(val)) {
        if (key === 'platform_fee_percent' || key === 'platformfeepercent') settings.platformFeePercent = val;
        if (key === 'stripe_fee_percent' || key === 'stripefeepercent') settings.stripeFeePercent = val;
        if (key === 'stripe_fee_fixed' || key === 'stripefeefixed') settings.stripeFeeFixed = val;
        if (key === 'tax_percent' || key === 'taxpercent' || key === 'hst_percent') settings.taxPercent = val;
      }
    });

    return settings;
  } catch (err) {
    console.warn('[getCommissionSettings] Error fetching from DB, using defaults:', err?.message);
    return defaults;
  }
}

// ===== STRIPE CONNECT ONBOARDING =====

// 1. INITIATE STRIPE CONNECT (for vendor onboarding)
router.post('/connect', async (req, res) => {
  try {
    const { userId, vendorProfileId } = req.body;

    if (!userId || !vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Vendor Profile ID are required'
      });
    }

    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured. Please contact support.'
      });
    }

    const pool = await poolPromise;
    
    // Check if vendor already has a Stripe account
    const vendorCheck = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .execute('payments.sp_GetVendorStripeAccount');

    if (!vendorCheck.recordset.length) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    let stripeAccountId = vendorCheck.recordset[0].StripeAccountID;

    // If no Stripe account exists, create one
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'CA', // Canada
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;

      // Save Stripe Account ID to database
      await pool.request()
        .input('VendorProfileID', sql.Int, vendorProfileId)
        .input('StripeAccountID', sql.NVarChar(100), stripeAccountId)
        .execute('payments.sp_SaveStripeAccount');
    }

    // Create account link for onboarding
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${frontendUrl}/become-a-vendor?stripe=refresh`,
      return_url: `${frontendUrl}/become-a-vendor?stripe=success`,
      type: 'account_onboarding',
    });

    return res.json({
      success: true,
      url: accountLink.url,
      accountId: stripeAccountId
    });

  } catch (error) {
    console.error('Stripe Connect error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate Stripe connection'
    });
  }
});

async function getInvoiceTotalsCents(bookingId) {
  const pool = await poolPromise;
  try { if (invoicesRouter && typeof invoicesRouter.upsertInvoiceForBooking === 'function') { await invoicesRouter.upsertInvoiceForBooking(pool, bookingId, { forceRegenerate: true }); } } catch (_) {}
  const r = pool.request();
  r.input('BookingID', sql.Int, bookingId);
  const q = await r.execute('payments.sp_GetInvoiceTotals');
  if (!q.recordset.length) {
    // Fallback: compute totals directly from booking/services/expenses
    const pctPlatform = parseFloat(process.env.PLATFORM_FEE_PERCENT || '5') / 100;
    const pctStripe = parseFloat(process.env.STRIPE_FEE_PERCENT || process.env.STRIPE_PROC_FEE_PERCENT || '2.9') / 100;
    const fixedStripe = parseFloat(process.env.STRIPE_FEE_FIXED || process.env.STRIPE_PROC_FEE_FIXED || '0.30');
    const pctTax = parseFloat(process.env.TAX_PERCENT || '0') / 100;

    // Get booking core
    const bReq = pool.request();
    bReq.input('BookingID', sql.Int, bookingId);
    const b = await bReq.execute('payments.sp_GetBookingTotal');
    const bookingTotal = Number(b.recordset[0]?.TotalAmount || 0);

    // Sum services if available
    let servicesSubtotal = 0;
    try {
      const bsReq = pool.request();
      bsReq.input('BookingID', sql.Int, bookingId);
      const bs = await bsReq.execute('payments.sp_GetBookingServices');
      if (bs.recordset.length) {
        servicesSubtotal = bs.recordset.reduce((s, row) => s + (Number(row.Quantity || 1) * Number(row.PriceAtBooking || 0)), 0);
      }
    } catch (_) { /* ignore */ }
    if (servicesSubtotal <= 0 && bookingTotal > 0) servicesSubtotal = bookingTotal;

    // Sum expenses if table exists
    let expensesTotal = 0;
    try {
      const exReq = pool.request();
      exReq.input('BookingID', sql.Int, bookingId);
      const ex = await exReq.execute('payments.sp_GetBookingExpenses');
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
    const q = await req.execute('payments.sp_CheckDuplicateTransaction');
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
    const existsReq = pool.request();
    existsReq.input('StripeChargeID', sql.NVarChar(100), String(stripeChargeId));
    const exists = await existsReq.execute('payments.sp_CheckDuplicateCharge');
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
  const ins = await req.execute('payments.sp_InsertTransaction');
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

function ensureSessionIdParam(urlStr, bookingId = null) {
  try {
    const u = new URL(urlStr);
    if (!u.searchParams.has('session_id')) {
      u.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
    }
    // Also add booking_id as fallback for older sessions
    if (bookingId && !u.searchParams.has('booking_id')) {
      u.searchParams.set('booking_id', String(bookingId));
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
    
    const result = await request.execute('payments.sp_GetVendorStripeAccount');
    
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
    
    await request.execute('payments.sp_SaveStripeAccount');
    
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
    
    await request.execute('payments.sp_SaveChargeToBooking');
    
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
    const qb = await r.execute('payments.sp_GetReceiptInfo');
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
        .execute('payments.sp_GetTransactionCharge');
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
        .execute('payments.sp_CheckBookingPaid');
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

    // Calculate platform fee (configurable via environment variable; default 5%)
    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '5') / 100;
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
      requestId,
      vendorProfileId,
      amount,
      currency = 'cad',
      description,
      clientProvince
    } = req.body;

    if (!isStripeConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Payment processing is not available. Please contact support.'
      });
    }

    // Either bookingId or requestId is required, plus amount
    if ((!bookingId && !requestId) || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment information'
      });
    }

    const pool = await poolPromise;

    // Prevent duplicate payments for already-paid bookings (only if bookingId exists)
    if (bookingId) {
      try {
        const check = await pool.request()
          .input('BookingID', sql.Int, bookingId)
          .execute('payments.sp_CheckBookingPaid');
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

    // Get commission settings
    const commissionSettings = await getCommissionSettings();
    const platformFeePercent = commissionSettings.platformFeePercent / 100;
    const stripeFeePercent = commissionSettings.stripeFeePercent / 100;
    const stripeFeeFixed = commissionSettings.stripeFeeFixed;

    // Determine tax rate based on client's province (location-based taxation)
    let taxPercent = commissionSettings.taxPercent; // Default from settings
    let taxInfo = { rate: taxPercent, type: 'HST', label: `HST ${taxPercent}%` };
    
    if (clientProvince) {
      taxInfo = getTaxInfoForProvince(clientProvince);
      taxPercent = taxInfo.rate;
      console.log(`[PaymentIntent] Using province-based tax for ${clientProvince}: ${taxPercent}%`);
    }

    // Calculate totals with province-specific tax
    const subtotal = Number(amount);
    const platformFee = Math.round(subtotal * platformFeePercent * 100) / 100;
    const taxAmount = Math.round((subtotal + platformFee) * (taxPercent / 100) * 100) / 100;
    const processingFee = Math.round((subtotal * stripeFeePercent + stripeFeeFixed) * 100) / 100;
    const totalAmount = Math.round((subtotal + platformFee + taxAmount + processingFee) * 100) / 100;
    const totalAmountCents = Math.round(totalAmount * 100);
    const applicationFeeCents = Math.round(platformFee * 100);

    if (totalAmountCents < 50) {
      return res.status(400).json({ success: false, message: 'Total amount is too low for payment processing' });
    }

    // Create a PaymentIntent on the platform with destination charge to the connected account
    const paymentDescription = description || (bookingId ? `Booking Payment #${bookingId}` : `Request Payment #${requestId}`);
    const pi = await stripe.paymentIntents.create({
      amount: totalAmountCents,
      currency,
      description: paymentDescription,
      automatic_payment_methods: { enabled: true },
      application_fee_amount: applicationFeeCents,
      transfer_data: {
        destination: vendorStripeAccountId,
      },
      metadata: {
        booking_id: bookingId ? String(bookingId) : '',
        request_id: requestId ? String(requestId) : '',
        vendor_profile_id: String(resolvedVendorProfileId),
        platform_fee_percent: String(commissionSettings.platformFeePercent),
        client_province: clientProvince || '',
        tax_type: taxInfo.type,
        subtotal_cents: String(Math.round(subtotal * 100)),
        platform_fee_cents: String(applicationFeeCents),
        tax_cents: String(Math.round(taxAmount * 100)),
        processing_fee_cents: String(Math.round(processingFee * 100)),
        total_cents: String(totalAmountCents),
        tax_percent: String(taxPercent)
      }
    });

    return res.json({
      success: true,
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      breakdown: {
        subtotal: subtotal,
        platformFee: platformFee,
        tax: taxAmount,
        taxPercent: taxPercent,
        taxType: taxInfo.type,
        taxLabel: taxInfo.label,
        processingFee: processingFee,
        total: totalAmount
      }
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
    
    const result = await request.execute('payments.sp_GetVendorFromBooking');
    
    return result.recordset.length > 0 ? result.recordset[0].VendorProfileID : null;
  } catch (error) {
    console.error('Error fetching vendor profile ID from booking:', error);
    return null;
  }
}

// 7. CREATE CHECKOUT SESSION (Enhanced with detailed line items and metadata)
router.post('/checkout-session', async (req, res) => {
  try {
    const { 
      bookingId, 
      amount, 
      currency = 'cad',
      description,
      successUrl,
      cancelUrl,
      clientProvince
    } = req.body;

    if (!isStripeConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Payment processing is not available'
      });
    }

    const pool = await poolPromise;

    // Server-side safety: prevent creating a Checkout Session for an already-paid booking
    const bookingCheck = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('payments.sp_GetBookingForCheckout');
    
    if (bookingCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookingCheck.recordset[0];
    const alreadyPaid = booking.FullAmountPaid === true || booking.FullAmountPaid === 1;
    if (alreadyPaid) {
      return res.status(409).json({ success: false, message: 'This booking is already paid.' });
    }

    const vendorProfileId = booking.VendorProfileID;
    const vendorStripeAccountId = booking.StripeAccountID;

    if (!vendorStripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor is not connected to Stripe. Please contact the vendor.'
      });
    }

    // Get commission settings from database
    const commissionSettings = await getCommissionSettings();
    
    // Get booking services for detailed line items
    const servicesResult = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('payments.sp_GetBookingServicesDetailed');
    
    let services = servicesResult.recordset || [];
    
    // Fallback if no services found
    if (services.length === 0 && booking.TotalAmount > 0) {
      let serviceName = 'Service';
      if (booking.ServiceID) {
        const svcRes = await pool.request()
          .input('ServiceID', sql.Int, booking.ServiceID)
          .execute('payments.sp_GetServiceName');
        serviceName = svcRes.recordset[0]?.Name || 'Service';
      }
      services = [{
        ServiceName: serviceName,
        Quantity: 1,
        PriceAtBooking: booking.TotalAmount
      }];
    }

    // Determine tax rate based on client's province (location-based taxation)
    let taxPercent = commissionSettings.taxPercent;
    let taxInfo = { rate: taxPercent, type: 'HST', label: `HST ${taxPercent}%` };
    
    if (clientProvince) {
      taxInfo = getTaxInfoForProvince(clientProvince);
      taxPercent = taxInfo.rate;
      console.log(`[CheckoutSession] Using province-based tax for ${clientProvince}: ${taxPercent}%`);
    }

    // Calculate totals with province-specific tax
    const servicesSubtotal = services.reduce((sum, s) => sum + (Number(s.PriceAtBooking || 0) * (s.Quantity || 1)), 0);
    const platformFeeAmount = Math.round(servicesSubtotal * (commissionSettings.platformFeePercent / 100) * 100) / 100;
    const taxAmount = Math.round((servicesSubtotal + platformFeeAmount) * (taxPercent / 100) * 100) / 100;
    const processingFee = Math.round((servicesSubtotal * (commissionSettings.stripeFeePercent / 100) + commissionSettings.stripeFeeFixed) * 100) / 100;
    const totalAmount = Math.round((servicesSubtotal + platformFeeAmount + taxAmount + processingFee) * 100) / 100;

    // Build line items for Stripe Checkout
    const lineItems = [];

    // Add each service as a line item
    services.forEach(service => {
      lineItems.push({
        price_data: {
          currency: commissionSettings.currency,
          product_data: {
            name: service.ServiceName || 'Service',
            description: service.ServiceDescription || undefined
          },
          unit_amount: Math.round(Number(service.PriceAtBooking || 0) * 100)
        },
        quantity: service.Quantity || 1
      });
    });

    // Add platform fee as a line item (visible to customer)
    if (platformFeeAmount > 0) {
      lineItems.push({
        price_data: {
          currency: commissionSettings.currency,
          product_data: {
            name: 'Platform Service Fee',
            description: `${commissionSettings.platformFeePercent}% platform fee`
          },
          unit_amount: Math.round(platformFeeAmount * 100)
        },
        quantity: 1
      });
    }

    // Add tax as a line item (using province-specific tax label)
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: commissionSettings.currency,
          product_data: {
            name: `Tax (${taxInfo.label})`,
            description: clientProvince ? `Sales tax for ${clientProvince}` : 'Sales Tax'
          },
          unit_amount: Math.round(taxAmount * 100)
        },
        quantity: 1
      });
    }

    // Add processing fee as a line item (visible to customer)
    if (processingFee > 0) {
      lineItems.push({
        price_data: {
          currency: commissionSettings.currency,
          product_data: {
            name: 'Payment Processing Fee',
            description: `${commissionSettings.stripeFeePercent}% + $${commissionSettings.stripeFeeFixed.toFixed(2)}`
          },
          unit_amount: Math.round(processingFee * 100)
        },
        quantity: 1
      });
    }

    // Calculate application fee (platform keeps this)
    const applicationFeeCents = Math.round(platformFeeAmount * 100);
    const totalAmountCents = lineItems.reduce((sum, item) => sum + (item.price_data.unit_amount * item.quantity), 0);

    // Resolve and sanitize redirect URLs
    let successRedirect = resolveToHttpUrl(successUrl, '/payment-success', req);
    successRedirect = ensureSessionIdParam(successRedirect, bookingId);
    let cancelRedirect = resolveToHttpUrl(cancelUrl, '/dashboard?section=bookings&payment=cancelled', req);

    // Build comprehensive metadata
    const metadata = {
      booking_id: String(bookingId),
      vendor_profile_id: String(vendorProfileId),
      client_name: booking.ClientName || '',
      client_email: booking.ClientEmail || '',
      client_phone: booking.ClientPhone || '',
      vendor_name: booking.VendorName || '',
      event_date: booking.EventDate ? new Date(booking.EventDate).toISOString() : '',
      event_name: booking.EventName || '',
      event_type: booking.EventType || '',
      event_location: booking.EventLocation || '',
      client_province: clientProvince || '',
      tax_type: taxInfo.type,
      services_subtotal_cents: String(Math.round(servicesSubtotal * 100)),
      platform_fee_cents: String(applicationFeeCents),
      tax_cents: String(Math.round(taxAmount * 100)),
      processing_fee_cents: String(Math.round(processingFee * 100)),
      total_cents: String(totalAmountCents),
      platform_fee_percent: String(commissionSettings.platformFeePercent),
      tax_percent: String(taxPercent),
      stripe_fee_percent: String(commissionSettings.stripeFeePercent)
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successRedirect,
      cancel_url: cancelRedirect,
      customer_email: booking.ClientEmail || undefined,
      metadata: metadata,
      payment_intent_data: {
        application_fee_amount: applicationFeeCents,
        transfer_data: {
          destination: vendorStripeAccountId
        },
        metadata: metadata
      }
    });

    // Store session ID in booking for tracking
    await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .input('StripeSessionID', sql.NVarChar(255), session.id)
      .execute('payments.sp_SaveSessionToBooking');

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      sessionUrl: session.url,
      breakdown: {
        servicesSubtotal,
        platformFee: platformFeeAmount,
        tax: taxAmount,
        processingFee,
        total: totalAmountCents / 100
      }
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

// 8. PROCESS REFUND (Legacy - simple refund by charge ID)
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

// 8a. CANCEL BOOKING WITH STRIPE CONNECT REFUND
// Refunds the payment to client but KEEPS the application fee (platform fee)
router.post('/cancel-booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { 
      cancelledBy, // 'client', 'vendor', 'admin'
      cancelledByUserId,
      reason,
      refundPercent // Optional: override refund percentage
    } = req.body;

    if (!isStripeConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Payment processing is not available'
      });
    }

    const pool = await poolPromise;

    // Get booking details including cancellation policy
    const bookingResult = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('bookings.sp_GetBookingForCancellation');

    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookingResult.recordset[0];

    // Check if booking can be cancelled
    if (['cancelled', 'cancelled_by_client', 'cancelled_by_vendor', 'cancelled_by_admin', 'refunded'].includes(booking.Status?.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    // Check cancellation permissions based on policy
    if (cancelledBy === 'client' && booking.AllowClientCancellation === false) {
      return res.status(403).json({ success: false, message: 'Client cancellation is not allowed for this vendor' });
    }
    if (cancelledBy === 'vendor' && booking.AllowVendorCancellation === false) {
      return res.status(403).json({ success: false, message: 'Vendor cancellation is not allowed' });
    }

    // Calculate refund amount based on cancellation policy
    const hoursUntilEvent = booking.HoursUntilEvent || 0;
    const totalAmount = Number(booking.TotalAmount) || 0;
    let calculatedRefundPercent = 0;
    let policyApplied = null;

    if (booking.PolicyID) {
      policyApplied = booking.PolicyID;
      if (hoursUntilEvent >= (booking.FullRefundHours || 168)) {
        calculatedRefundPercent = booking.FullRefundPercent || 100;
      } else if (hoursUntilEvent >= (booking.PartialRefundHours || 48)) {
        calculatedRefundPercent = booking.PartialRefundPercent || 50;
      } else if (hoursUntilEvent >= (booking.NoRefundHours || 24)) {
        calculatedRefundPercent = 0;
      } else {
        calculatedRefundPercent = 0;
      }
    } else {
      // Default policy: full refund if > 7 days, 50% if > 48 hours, 0% otherwise
      if (hoursUntilEvent >= 168) calculatedRefundPercent = 100;
      else if (hoursUntilEvent >= 48) calculatedRefundPercent = 50;
      else calculatedRefundPercent = 0;
    }

    // Allow override of refund percent (for admin)
    const finalRefundPercent = typeof refundPercent === 'number' ? refundPercent : calculatedRefundPercent;
    
    // Calculate refund amount (excluding application fee which platform keeps)
    // Get the original payment intent to find the application fee
    let refundAmount = 0;
    let applicationFeeRetained = 0;
    let stripeRefundId = null;
    let stripeRefundStatus = 'none';

    if (booking.StripePaymentIntentID && booking.FullAmountPaid && finalRefundPercent > 0) {
      try {
        const pi = await stripe.paymentIntents.retrieve(booking.StripePaymentIntentID);
        const chargeId = pi.latest_charge;
        
        if (chargeId) {
          const charge = await stripe.charges.retrieve(chargeId);
          const originalAmount = charge.amount; // in cents
          const applicationFee = pi.application_fee_amount || 0; // Platform fee in cents
          
          // Calculate refund: refund percentage of (total - application fee)
          // Application fee is NEVER refunded - it goes to the platform
          const refundableAmount = originalAmount - applicationFee;
          const refundAmountCents = Math.round(refundableAmount * (finalRefundPercent / 100));
          
          applicationFeeRetained = applicationFee / 100;
          refundAmount = refundAmountCents / 100;

          if (refundAmountCents > 0) {
            // Create refund - this refunds to customer and reverses transfer to vendor
            // But does NOT refund the application fee
            const refund = await stripe.refunds.create({
              charge: chargeId,
              amount: refundAmountCents,
              reason: cancelledBy === 'client' ? 'requested_by_customer' : 'requested_by_customer',
              metadata: {
                booking_id: String(bookingId),
                cancelled_by: cancelledBy,
                refund_percent: String(finalRefundPercent),
                hours_before_event: String(hoursUntilEvent)
              }
            });

            stripeRefundId = refund.id;
            stripeRefundStatus = refund.status;
          }
        }
      } catch (stripeErr) {
        console.error('Stripe refund error:', stripeErr);
        // Continue with cancellation even if refund fails
        stripeRefundStatus = 'failed';
      }
    }

    // Record cancellation in database
    const cancelResult = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .input('CancelledBy', sql.NVarChar(20), cancelledBy)
      .input('CancelledByUserID', sql.Int, cancelledByUserId || null)
      .input('CancellationReason', sql.NVarChar(sql.MAX), reason || null)
      .input('RefundAmount', sql.Decimal(10,2), refundAmount)
      .input('RefundPercent', sql.Decimal(5,2), finalRefundPercent)
      .input('ApplicationFeeRetained', sql.Decimal(10,2), applicationFeeRetained)
      .input('PolicyID', sql.Int, policyApplied)
      .input('HoursBeforeEvent', sql.Int, hoursUntilEvent)
      .execute('bookings.sp_CancelBookingWithRefund');

    const cancellationId = cancelResult.recordset[0]?.CancellationID;

    // Update with Stripe refund details
    if (stripeRefundId) {
      await pool.request()
        .input('CancellationID', sql.Int, cancellationId)
        .input('StripeRefundID', sql.NVarChar(100), stripeRefundId)
        .input('StripeRefundStatus', sql.NVarChar(50), stripeRefundStatus)
        .input('RefundStatus', sql.NVarChar(50), stripeRefundStatus === 'succeeded' ? 'completed' : 'processing')
        .execute('bookings.sp_UpdateCancellationRefund');
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      cancellationId,
      bookingId: parseInt(bookingId),
      cancelledBy,
      refund: {
        amount: refundAmount,
        percent: finalRefundPercent,
        applicationFeeRetained,
        stripeRefundId,
        status: stripeRefundStatus
      },
      policy: {
        applied: !!policyApplied,
        hoursBeforeEvent: hoursUntilEvent
      }
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
});

// 8b. GET CANCELLATION POLICY FOR A VENDOR
router.get('/cancellation-policy/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .execute('vendors.sp_GetCancellationPolicy');

    if (result.recordset.length === 0) {
      // Return default policy
      return res.json({
        success: true,
        policy: {
          fullRefundHours: 168,
          partialRefundHours: 48,
          noRefundHours: 24,
          fullRefundPercent: 100,
          partialRefundPercent: 50,
          allowClientCancellation: true,
          allowVendorCancellation: true,
          isDefault: true
        }
      });
    }

    const policy = result.recordset[0];
    res.json({
      success: true,
      policy: {
        policyId: policy.PolicyID,
        policyName: policy.PolicyName,
        fullRefundHours: policy.FullRefundHours,
        partialRefundHours: policy.PartialRefundHours,
        noRefundHours: policy.NoRefundHours,
        fullRefundPercent: policy.FullRefundPercent,
        partialRefundPercent: policy.PartialRefundPercent,
        policyDescription: policy.PolicyDescription,
        allowClientCancellation: policy.AllowClientCancellation,
        allowVendorCancellation: policy.AllowVendorCancellation,
        vendorCancellationPenalty: policy.VendorCancellationPenalty,
        isDefault: false
      }
    });

  } catch (error) {
    console.error('Get cancellation policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to get cancellation policy', error: error.message });
  }
});

// 8c. UPDATE CANCELLATION POLICY FOR A VENDOR
router.post('/cancellation-policy/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    const {
      policyName,
      fullRefundHours,
      partialRefundHours,
      noRefundHours,
      fullRefundPercent,
      partialRefundPercent,
      policyDescription,
      allowClientCancellation,
      allowVendorCancellation,
      vendorCancellationPenalty
    } = req.body;

    const pool = await poolPromise;

    const result = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .input('PolicyName', sql.NVarChar(100), policyName || 'Standard Policy')
      .input('FullRefundHours', sql.Int, fullRefundHours || 168)
      .input('PartialRefundHours', sql.Int, partialRefundHours || 48)
      .input('NoRefundHours', sql.Int, noRefundHours || 24)
      .input('FullRefundPercent', sql.Decimal(5,2), fullRefundPercent || 100)
      .input('PartialRefundPercent', sql.Decimal(5,2), partialRefundPercent || 50)
      .input('PolicyDescription', sql.NVarChar(sql.MAX), policyDescription || null)
      .input('AllowClientCancellation', sql.Bit, allowClientCancellation !== false)
      .input('AllowVendorCancellation', sql.Bit, allowVendorCancellation !== false)
      .input('VendorCancellationPenalty', sql.Decimal(5,2), vendorCancellationPenalty || 0)
      .execute('vendors.sp_UpsertCancellationPolicy');

    res.json({
      success: true,
      message: 'Cancellation policy updated',
      policyId: result.recordset[0]?.PolicyID
    });

  } catch (error) {
    console.error('Update cancellation policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to update cancellation policy', error: error.message });
  }
});

// 8d. CALCULATE REFUND PREVIEW
router.post('/calculate-refund', async (req, res) => {
  try {
    const { bookingId, cancelledBy } = req.body;

    const pool = await poolPromise;

    const bookingResult = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('bookings.sp_GetBookingForCancellation');

    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookingResult.recordset[0];
    const hoursUntilEvent = booking.HoursUntilEvent || 0;
    const totalAmount = Number(booking.TotalAmount) || 0;

    // Calculate based on policy
    let refundPercent = 0;
    let refundTier = 'no_refund';

    if (booking.PolicyID) {
      if (hoursUntilEvent >= (booking.FullRefundHours || 168)) {
        refundPercent = booking.FullRefundPercent || 100;
        refundTier = 'full';
      } else if (hoursUntilEvent >= (booking.PartialRefundHours || 48)) {
        refundPercent = booking.PartialRefundPercent || 50;
        refundTier = 'partial';
      }
    } else {
      if (hoursUntilEvent >= 168) { refundPercent = 100; refundTier = 'full'; }
      else if (hoursUntilEvent >= 48) { refundPercent = 50; refundTier = 'partial'; }
    }

    // Estimate application fee (platform fee)
    const settings = await getCommissionSettings();
    const estimatedPlatformFee = totalAmount * (settings.platformFeePercent / 100);
    const refundableBase = totalAmount - estimatedPlatformFee;
    const estimatedRefund = refundableBase * (refundPercent / 100);

    res.json({
      success: true,
      preview: {
        bookingId,
        totalAmount,
        hoursUntilEvent,
        refundTier,
        refundPercent,
        platformFeeRetained: estimatedPlatformFee,
        estimatedRefund,
        policy: booking.PolicyID ? {
          fullRefundHours: booking.FullRefundHours,
          partialRefundHours: booking.PartialRefundHours,
          noRefundHours: booking.NoRefundHours
        } : null
      }
    });

  } catch (error) {
    console.error('Calculate refund error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate refund', error: error.message });
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

    if (!paymentIntentId) {
      return res.status(400).json({ success: false, message: 'No payment_intent on session' });
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    let bookingId = pi?.metadata?.booking_id || null;

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
    await request.execute('payments.sp_MarkBookingPaid');

    // Record a transaction row and regenerate the invoice snapshot
    try {
      const binfoReq = pool.request();
      binfoReq.input('BookingID', sql.Int, bookingId);
      const binfo = await binfoReq.execute('payments.sp_GetBookingUserVendor');
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

    // Fetch booking details to return in response
    const bookingDetailsResult = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('payments.sp_GetBookingDetails');
    
    const bookingDetails = bookingDetailsResult.recordset[0] || null;

    // Also update related booking request if exists (most recent for this user/vendor)
    if (bookingDetails) {
      const userId = bookingDetails.UserID;
      const vendorProfileId = bookingDetails.VendorProfileID;
      await pool.request()
        .input('UserID', sql.Int, userId)
        .input('VendorProfileID', sql.Int, vendorProfileId)
        .input('StripePaymentIntentID', sql.NVarChar(100), paymentIntentId)
        .execute('payments.sp_ConfirmBookingRequest');
    }

    res.json({ success: true, bookingId, paymentIntentId, booking: bookingDetails });
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
    // Handle empty strings as null
    let bookingId = pi?.metadata?.booking_id && pi.metadata.booking_id !== '' ? pi.metadata.booking_id : null;
    const requestId = pi?.metadata?.request_id && pi.metadata.request_id !== '' ? pi.metadata.request_id : null;
    
    console.log('[VerifyIntent] PaymentIntent metadata:', { bookingId, requestId, status });

    if (status !== 'succeeded') {
      return res.status(400).json({ success: false, message: `PaymentIntent not paid (status: ${status})` });
    }

    const pool = await poolPromise;

    // If we have a requestId but no bookingId, create a booking from the request
    if (requestId && !bookingId) {
      console.log('[VerifyIntent] Creating booking from request:', requestId);
      try {
        // Get request details using direct query
        const reqInfo = await pool.request()
          .input('RequestID', sql.Int, requestId)
          .query('SELECT UserID, VendorProfileID, EventDate, EventTime, EventEndTime, EventLocation, AttendeeCount, Budget, Services, SpecialRequests, EventName, EventType, TimeZone FROM bookings.BookingRequests WHERE RequestID = @RequestID');
        
        if (reqInfo.recordset.length > 0) {
          const req = reqInfo.recordset[0];
          console.log('[VerifyIntent] Found request:', { UserID: req.UserID, VendorProfileID: req.VendorProfileID });
          
          // Parse services JSON to get price
          let totalAmount = req.Budget || 0;
          let serviceId = null;
          try {
            const services = JSON.parse(req.Services || '[]');
            if (services.length > 0) {
              totalAmount = services.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
              serviceId = services[0]?.serviceId || null;
            }
          } catch (e) { console.warn('[VerifyIntent] Parse services error:', e?.message); }

          // Create confirmed booking using direct INSERT
          const insertResult = await pool.request()
            .input('UserID', sql.Int, req.UserID)
            .input('VendorProfileID', sql.Int, req.VendorProfileID)
            .input('ServiceID', sql.Int, serviceId)
            .input('EventDate', sql.DateTime, req.EventDate)
            .input('TotalAmount', sql.Decimal(10, 2), totalAmount)
            .input('AttendeeCount', sql.Int, req.AttendeeCount || 1)
            .input('SpecialRequests', sql.NVarChar(sql.MAX), req.SpecialRequests)
            .input('EventLocation', sql.NVarChar(500), req.EventLocation)
            .input('StripePaymentIntentID', sql.NVarChar(100), paymentIntentId)
            .query(`
              INSERT INTO bookings.Bookings (UserID, VendorProfileID, ServiceID, EventDate, Status, AttendeeCount, SpecialRequests, TotalAmount, EventLocation, StripePaymentIntentID, FullAmountPaid, CreatedAt)
              OUTPUT INSERTED.BookingID
              VALUES (@UserID, @VendorProfileID, @ServiceID, @EventDate, 'confirmed', @AttendeeCount, @SpecialRequests, @TotalAmount, @EventLocation, @StripePaymentIntentID, 1, GETDATE())
            `);
          
          if (insertResult.recordset && insertResult.recordset.length > 0) {
            bookingId = insertResult.recordset[0].BookingID;
            console.log('[VerifyIntent] Created booking:', bookingId);
            
            // Update request status to confirmed
            await pool.request()
              .input('RequestID', sql.Int, requestId)
              .input('PaymentIntentID', sql.NVarChar(100), paymentIntentId)
              .query("UPDATE bookings.BookingRequests SET Status = 'confirmed', ConfirmedAt = GETDATE(), PaymentIntentID = @PaymentIntentID WHERE RequestID = @RequestID");
            
            console.log('[VerifyIntent] Updated request status to confirmed');
          }
        } else {
          console.warn('[VerifyIntent] Request not found:', requestId);
        }
      } catch (reqErr) {
        console.error('[VerifyIntent] Create booking from request error:', reqErr?.message, reqErr?.stack);
      }
    }

    if (!bookingId) {
      return res.status(404).json({ success: false, message: 'Could not find or create booking' });
    }

    // Idempotently mark booking as paid/confirmed
    console.log('[VerifyIntent] Marking booking as paid:', bookingId);
    const markPaidReq = new sql.Request(pool);
    markPaidReq.input('BookingID', sql.Int, bookingId);
    markPaidReq.input('Status', sql.NVarChar(20), 'confirmed');
    markPaidReq.input('StripePaymentIntentID', sql.NVarChar(100), paymentIntentId);
    const markResult = await markPaidReq.execute('payments.sp_MarkBookingPaid');
    console.log('[VerifyIntent] Mark paid result:', markResult.recordset);

    // Record transaction and regenerate invoice
    try {
      const binfoReq = pool.request();
      binfoReq.input('BookingID', sql.Int, bookingId);
      const binfo = await binfoReq.execute('payments.sp_GetBookingUserVendor');
      const row = binfo.recordset[0] || {};
      console.log('[VerifyIntent] Booking info:', row);
      
      const paidAmount = ((pi && typeof pi.amount_received === 'number') ? pi.amount_received : (pi && typeof pi.amount === 'number' ? pi.amount : 0)) / 100;
      const exists = await existsRecentTransaction({ bookingId, amount: paidAmount, externalId: paymentIntentId, minutes: 240 });
      console.log('[VerifyIntent] Transaction exists:', exists, 'Amount:', paidAmount);
      
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
        console.log('[VerifyIntent] Transaction recorded');
      }
      
      // Generate invoice
      if (invoicesRouter && typeof invoicesRouter.upsertInvoiceForBooking === 'function') {
        try { 
          await invoicesRouter.upsertInvoiceForBooking(await poolPromise, bookingId, { forceRegenerate: true }); 
          console.log('[VerifyIntent] Invoice generated for booking:', bookingId);
        } catch (invErr) { 
          console.warn('[VerifyIntent] Invoice generation error:', invErr?.message); 
        }
      } else {
        console.warn('[VerifyIntent] invoicesRouter.upsertInvoiceForBooking not available');
      }
    } catch (txErr) { console.error('[VerifyIntent] recordTransaction error', txErr?.message, txErr?.stack); }

    // Also update related booking request if exists (most recent for this user/vendor)
    const bookingInfoReq = pool.request();
    bookingInfoReq.input('BookingID', sql.Int, bookingId);
    const bookingInfo = await bookingInfoReq.execute('payments.sp_GetBookingUserVendor');
    if (bookingInfo.recordset.length > 0) {
      const userId = bookingInfo.recordset[0].UserID;
      const vendorProfileId = bookingInfo.recordset[0].VendorProfileID;
      await pool.request()
        .input('UserID', sql.Int, userId)
        .input('VendorProfileID', sql.Int, vendorProfileId)
        .input('StripePaymentIntentID', sql.NVarChar(100), paymentIntentId)
        .execute('payments.sp_ConfirmBookingRequest');
    }

    return res.json({ success: true, bookingId, requestId, paymentIntentId });
  } catch (error) {
    console.error('Verify intent error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify intent', error: error.message });
  }
});

// 9. WEBHOOK HANDLER FOR STRIPE EVENTS
const webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!endpointSecret || endpointSecret.includes('placeholder')) {
      console.error('[Webhook] Webhook secret not properly configured');
      return res.status(400).send('Webhook Error: Webhook secret not configured');
    }
    
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
          if (bookingId) {
            const pool = await poolPromise;
            const request = new sql.Request(pool);
            request.input('BookingID', sql.Int, bookingId);
            request.input('Status', sql.NVarChar(20), 'confirmed');
            request.input('StripePaymentIntentID', sql.NVarChar(100), paymentIntent.id);
            await request.execute('payments.sp_MarkBookingPaid');

            try {
              const binfoReq2 = pool.request();
              binfoReq2.input('BookingID', sql.Int, bookingId);
              const binfo = await binfoReq2.execute('payments.sp_GetBookingUserVendor');
              const row = binfo.recordset[0] || {};
              const exists = await existsRecentTransaction({ bookingId, amount: row.TotalAmount, externalId: paymentIntent.id, minutes: 240 });
              if (!exists) {
                await recordTransaction({
                  bookingId,
                  userId: row.UserID,
                  vendorProfileId: row.VendorProfileID,
                  amount: row.TotalAmount,
                  currency: (paymentIntent && typeof paymentIntent.currency === 'string' && paymentIntent.currency) ? paymentIntent.currency.toUpperCase() : 'CAD',
                  stripeChargeId: paymentIntent.id,
                  description: 'Stripe Payment (webhook PI)'
                });
              }
              if (invoicesRouter && typeof invoicesRouter.upsertInvoiceForBooking === 'function') {
                try { await invoicesRouter.upsertInvoiceForBooking(await poolPromise, bookingId, { forceRegenerate: true }); } catch (_) {}
              }
            } catch (e) { console.warn('[Webhook PI] recordTransaction error', e?.message); }

            // Also update related booking request if exists (most recent for this user/vendor)
            const bookingInfoReq2 = pool.request();
            bookingInfoReq2.input('BookingID', sql.Int, bookingId);
            const bookingInfo = await bookingInfoReq2.execute('payments.sp_GetBookingUserVendor');
            if (bookingInfo.recordset.length > 0) {
              const userId = bookingInfo.recordset[0].UserID;
              const vendorProfileId = bookingInfo.recordset[0].VendorProfileID;
              await pool.request()
                .input('UserID', sql.Int, userId)
                .input('VendorProfileID', sql.Int, vendorProfileId)
                .input('StripePaymentIntentID', sql.NVarChar(100), paymentIntent.id)
                .execute('payments.sp_ConfirmBookingRequest');
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
          if (paymentIntentId) {
            const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
            const bookingId = pi?.metadata?.booking_id;
            if (bookingId) {
              const pool = await poolPromise;
              const request = new sql.Request(pool);
              request.input('BookingID', sql.Int, bookingId);
              request.input('Status', sql.NVarChar(20), 'confirmed');
              request.input('StripePaymentIntentID', sql.NVarChar(100), paymentIntentId);
              await request.execute('payments.sp_MarkBookingPaid');

              // Also update related booking request if exists (most recent for this user/vendor)
              const bookingInfoReq3 = pool.request();
              bookingInfoReq3.input('BookingID', sql.Int, bookingId);
              const bookingInfo = await bookingInfoReq3.execute('payments.sp_GetBookingUserVendor');
              if (bookingInfo.recordset.length > 0) {
                const userId = bookingInfo.recordset[0].UserID;
                const vendorProfileId = bookingInfo.recordset[0].VendorProfileID;
                await pool.request()
                  .input('UserID', sql.Int, userId)
                  .input('VendorProfileID', sql.Int, vendorProfileId)
                  .input('StripePaymentIntentID', sql.NVarChar(100), paymentIntentId)
                  .execute('payments.sp_ConfirmBookingRequest');
              }
            }
          }
        } catch (csErr) {
          console.error('Error handling checkout.session.completed:', csErr);
        }
        break;

      case 'charge.succeeded':
        const charge = event.data.object;
        
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
            await request.execute('payments.sp_MarkBookingPaid');

            try {
              const binfoReq3 = pool.request();
              binfoReq3.input('BookingID', sql.Int, bookingIdFromCharge);
              const binfo = await binfoReq3.execute('payments.sp_GetBookingUserVendor');
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
            const bookingInfoReq4 = pool.request();
            bookingInfoReq4.input('BookingID', sql.Int, bookingIdFromCharge);
            const bookingInfo = await bookingInfoReq4.execute('payments.sp_GetBookingUserVendor');
            if (bookingInfo.recordset.length > 0) {
              const userId = bookingInfo.recordset[0].UserID;
              const vendorProfileId = bookingInfo.recordset[0].VendorProfileID;
              await pool.request()
                .input('UserID', sql.Int, userId)
                .input('VendorProfileID', sql.Int, vendorProfileId)
                .input('StripePaymentIntentID', sql.NVarChar(100), charge.payment_intent || null)
                .execute('payments.sp_ConfirmBookingRequest');
            }
          }
        } catch (chErr) {
          console.error('Error updating booking on charge.succeeded:', chErr);
        }
        break;

      case 'charge.failed':
        const failedCharge = event.data.object;
        
        // Update booking status to 'payment_failed'
        if (failedCharge.metadata.booking_id) {
          const pool = await poolPromise;
          const request = new sql.Request(pool);
          request.input('BookingID', sql.Int, failedCharge.metadata.booking_id);
          request.input('Status', sql.NVarChar(20), 'payment_failed');
          
          await request.execute('payments.sp_MarkBookingFailed');
        }
        break;

      case 'charge.refunded':
        const refundedCharge = event.data.object;
        
        // Update booking with refund information
        if (refundedCharge.metadata.booking_id) {
          const pool = await poolPromise;
          const request = new sql.Request(pool);
          request.input('BookingID', sql.Int, refundedCharge.metadata.booking_id);
          request.input('RefundAmount', sql.Decimal(10, 2), refundedCharge.amount_refunded / 100);
          request.input('Status', sql.NVarChar(20), 'refunded');
          
          await request.execute('payments.sp_MarkBookingRefunded');
        }
        break;

      case 'account.updated':
        const account = event.data.object;
        
        // You can update vendor account status in your database here
        // This is useful for tracking when vendors complete their onboarding
        break;

      default:
        // Unhandled event type
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// 10. CHECK BOOKING PAYMENT STATUS (no access control - for payment success page)
router.get('/booking/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('BookingID', sql.Int, bookingId);
    
    const result = await request.execute('payments.sp_GetBookingPaymentStatus');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    const booking = result.recordset[0];
    const isPaid = booking.FullAmountPaid === true || booking.FullAmountPaid === 1;
    const isDepositPaid = booking.DepositPaid === true || booking.DepositPaid === 1;
    
    // Get invoice total (which includes all fees) if available
    let invoiceTotal = null;
    try {
      const invResult = await request.execute('payments.sp_GetInvoiceTotals');
      if (invResult.recordset.length > 0) {
        invoiceTotal = invResult.recordset[0].TotalAmount;
      }
    } catch (e) {
      console.warn('Could not fetch invoice total:', e.message);
    }
    
    // Use invoice total if available, otherwise calculate from commission settings
    let displayTotal = invoiceTotal || booking.TotalAmount;
    if (!invoiceTotal && booking.TotalAmount) {
      // Calculate total with fees using commission settings
      const settings = await getCommissionSettings();
      const subtotal = Number(booking.TotalAmount);
      const platformFee = Math.round(subtotal * (settings.platformFeePercent / 100) * 100) / 100;
      const taxAmount = Math.round((subtotal + platformFee) * (settings.taxPercent / 100) * 100) / 100;
      const processingFee = Math.round((subtotal * (settings.stripeFeePercent / 100) + settings.stripeFeeFixed) * 100) / 100;
      displayTotal = Math.round((subtotal + platformFee + taxAmount + processingFee) * 100) / 100;
    }
    
    res.json({
      success: true,
      bookingId: booking.BookingID,
      status: booking.Status,
      isPaid: isPaid,
      isDepositPaid: isDepositPaid,
      paymentIntentId: booking.StripePaymentIntentID,
      totalAmount: displayTotal,
      baseAmount: booking.TotalAmount,
      lastUpdated: booking.UpdatedAt,
      booking: {
        BookingID: booking.BookingID,
        Status: booking.Status,
        FullAmountPaid: isPaid,
        TotalAmount: displayTotal,
        BaseAmount: booking.TotalAmount,
        EventDate: booking.EventDate,
        EventName: booking.EventName,
        EventType: booking.EventType,
        EventLocation: booking.EventLocation,
        VendorName: booking.VendorName,
        ClientName: booking.ClientName,
        ClientEmail: booking.ClientEmail
      }
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

// ===== VENDOR CANCELLATION POLICY =====

// GET /payments/vendor/:vendorProfileId/cancellation-policy - Get vendor's cancellation policy
router.get('/vendor/:vendorProfileId/cancellation-policy', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Vendor Profile ID is required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .execute('vendors.sp_GetCancellationPolicy');

    if (result.recordset.length === 0) {
      return res.json({ 
        success: true, 
        policy: null,
        message: 'No cancellation policy found' 
      });
    }

    // Convert database format to frontend format
    const dbPolicy = result.recordset[0];
    
    // Determine policy type based on hours
    let policyType = 'custom';
    if (dbPolicy.FullRefundHours === 24 && dbPolicy.PartialRefundHours === 12) {
      policyType = 'flexible';
    } else if (dbPolicy.FullRefundHours === 168 && dbPolicy.PartialRefundHours === 72) {
      policyType = 'moderate';
    } else if (dbPolicy.FullRefundHours === 336 && dbPolicy.PartialRefundHours === 168) {
      policyType = 'strict';
    }

    const policy = {
      PolicyID: dbPolicy.PolicyID,
      VendorProfileID: dbPolicy.VendorProfileID,
      PolicyType: policyType,
      PolicyName: dbPolicy.PolicyName,
      FullRefundDays: Math.round(dbPolicy.FullRefundHours / 24),
      PartialRefundDays: Math.round(dbPolicy.PartialRefundHours / 24),
      NoRefundDays: Math.round(dbPolicy.NoRefundHours / 24),
      FullRefundPercent: 100,
      PartialRefundPercent: dbPolicy.PartialRefundPercent,
      PolicyDescription: dbPolicy.PolicyDescription,
      IsActive: true,
      CreatedAt: dbPolicy.CreatedAt,
      UpdatedAt: dbPolicy.UpdatedAt
    };

    res.json({
      success: true,
      policy: policy
    });

  } catch (err) {
    console.error('Get cancellation policy error:', err);
    res.status(500).json({ success: false, message: 'Failed to get cancellation policy', error: err.message });
  }
});

// POST /payments/vendor/:vendorProfileId/cancellation-policy - Save vendor's cancellation policy
router.post('/vendor/:vendorProfileId/cancellation-policy', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    const { policyType, fullRefundDays, partialRefundDays, partialRefundPercent, noRefundDays } = req.body;
    console.log('[Cancellation Policy] Saving for vendor:', vendorProfileId, 'Policy:', req.body);
    
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Vendor Profile ID is required' });
    }

    // Convert days to hours for database storage
    // Map policy types to hour values
    let fullRefundHours, partialRefundHours, noRefundHours;
    
    if (policyType === 'flexible') {
      fullRefundHours = 24; // 1 day
      partialRefundHours = 12;
      noRefundHours = 0;
    } else if (policyType === 'moderate') {
      fullRefundHours = 168; // 7 days
      partialRefundHours = 72; // 3 days
      noRefundHours = 24; // 1 day
    } else if (policyType === 'strict') {
      fullRefundHours = 336; // 14 days
      partialRefundHours = 168; // 7 days
      noRefundHours = 72; // 3 days
    } else {
      // Custom - convert days to hours
      fullRefundHours = (fullRefundDays || 7) * 24;
      partialRefundHours = (partialRefundDays || 3) * 24;
      noRefundHours = (noRefundDays || 1) * 24;
    }

    // Build policy description based on type
    const policyDescription = policyType === 'flexible' 
      ? 'Full refund if cancelled up to 24 hours before the event.'
      : policyType === 'moderate'
      ? 'Full refund if cancelled 7+ days before. 50% refund if cancelled 3-7 days before. No refund within 3 days.'
      : policyType === 'strict'
      ? '50% refund if cancelled 14+ days before. No refund within 14 days of the event.'
      : `Full refund if cancelled ${fullRefundDays}+ days before. ${partialRefundPercent}% refund ${partialRefundDays}-${fullRefundDays} days before.`;

    const policyName = policyType ? policyType.charAt(0).toUpperCase() + policyType.slice(1) + ' Policy' : 'Standard Policy';

    const pool = await poolPromise;
    const result = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .input('PolicyName', sql.NVarChar(100), policyName)
      .input('FullRefundHours', sql.Int, fullRefundHours)
      .input('PartialRefundHours', sql.Int, partialRefundHours)
      .input('PartialRefundPercent', sql.Decimal(5,2), partialRefundPercent || 50)
      .input('NoRefundHours', sql.Int, noRefundHours)
      .input('AllowClientCancellation', sql.Bit, 1)
      .input('AllowVendorCancellation', sql.Bit, 1)
      .input('CancellationFee', sql.Decimal(10,2), 0)
      .input('PolicyDescription', sql.NVarChar(sql.MAX), policyDescription)
      .execute('vendors.sp_SaveCancellationPolicy');

    res.json({ 
      success: true, 
      message: 'Cancellation policy saved',
      policyId: result.recordset[0]?.PolicyID
    });

  } catch (err) {
    console.error('Save cancellation policy error:', err);
    res.status(500).json({ success: false, message: 'Failed to save cancellation policy', error: err.message });
  }
});

// 0a. PUBLIC CONFIG: expose Stripe publishable key and commission settings for frontend
router.get('/config', async (req, res) => {
  try {
    const key = process.env.STRIPE_PUBLISHABLE_KEY || '';
    const valid = !!key && !key.includes('placeholder');

    // Fetch settings from database (with env fallbacks)
    const settings = await getCommissionSettings();

    res.json({
      success: true,
      publishableKey: valid ? key : null,
      platformFeePercent: settings.platformFeePercent,
      stripeProcFeePercent: settings.stripeFeePercent,
      stripeProcFeeFixed: settings.stripeFeeFixed,
      taxPercent: settings.taxPercent,
      currency: settings.currency
    });
  } catch (e) {
    console.error('❌ Config endpoint error:', e);
    res.status(500).json({ success: false, message: 'Failed to load config' });
  }
});

// 0b. GET TAX RATES: Get tax rate for a specific province or all provinces
router.get('/tax-rates', (req, res) => {
  const { province } = req.query;
  
  if (province) {
    // Return tax info for a specific province
    const taxInfo = getTaxInfoForProvince(province);
    return res.json({
      success: true,
      province: province,
      rate: taxInfo.rate,
      type: taxInfo.type,
      label: taxInfo.label
    });
  }
  
  // Return all province tax rates
  res.json({
    success: true,
    provinces: PROVINCE_TAX_RATES
  });
});

// 0c. CALCULATE PAYMENT BREAKDOWN: Preview payment totals with province-based tax
router.post('/calculate-breakdown', async (req, res) => {
  try {
    const { amount, province } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const commissionSettings = await getCommissionSettings();
    const taxInfo = getTaxInfoForProvince(province);
    const taxPercent = taxInfo.rate;

    const subtotal = Number(amount);
    const platformFee = Math.round(subtotal * (commissionSettings.platformFeePercent / 100) * 100) / 100;
    const taxAmount = Math.round((subtotal + platformFee) * (taxPercent / 100) * 100) / 100;
    const processingFee = Math.round((subtotal * (commissionSettings.stripeFeePercent / 100) + commissionSettings.stripeFeeFixed) * 100) / 100;
    const total = Math.round((subtotal + platformFee + taxAmount + processingFee) * 100) / 100;

    res.json({
      success: true,
      breakdown: {
        subtotal,
        platformFee,
        platformFeePercent: commissionSettings.platformFeePercent,
        tax: taxAmount,
        taxPercent,
        taxType: taxInfo.type,
        taxLabel: taxInfo.label,
        processingFee,
        total
      },
      province: province || 'Ontario (default)'
    });
  } catch (e) {
    console.error('Calculate breakdown error:', e);
    res.status(500).json({ success: false, message: 'Failed to calculate breakdown' });
  }
});

module.exports = { router, webhook };
