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
      return res.status(400).json({
        success: false,
        message: `Stripe authorization failed: ${error}`
      });
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

    res.json({
      success: true,
      message: 'Vendor connected successfully!',
      vendorProfileId: vendorProfileId,
      stripeAccountId: connectedAccountId
    });

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

    // Calculate platform fee (5-10%, configurable via environment variable)
    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '8') / 100;
    const platformFee = Math.round(amount * platformFeePercent);

    // Create destination charge
    const charge = await stripe.charges.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      source: paymentMethodId,
      description: description || `Booking payment for booking #${bookingId}`,
      application_fee_amount: platformFee,
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
      platformFee: platformFee / 100,
      vendorAmount: (charge.amount - platformFee) / 100
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

// 7. CREATE CHECKOUT SESSION (Alternative hosted checkout)
router.post('/checkout-session', async (req, res) => {
  try {
    const { 
      bookingId, 
      vendorProfileId, 
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

    const vendorStripeAccountId = await getVendorStripeAccountId(vendorProfileId);

    if (!vendorStripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor is not connected to Stripe'
      });
    }

    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '8') / 100;
    const platformFee = Math.round(amount * platformFeePercent * 100);

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
      success_url: successUrl || `${process.env.FRONTEND_URL}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/booking-cancelled`,
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
      case 'charge.succeeded':
        const charge = event.data.object;
        console.log(`Payment succeeded for charge ${charge.id}`);
        
        // Update booking status to 'confirmed' or 'paid'
        if (charge.metadata.booking_id) {
          const pool = await poolPromise;
          const request = new sql.Request(pool);
          request.input('BookingID', sql.Int, charge.metadata.booking_id);
          request.input('Status', sql.NVarChar(20), 'confirmed');
          
          await request.query(`
            UPDATE Bookings 
            SET Status = @Status, FullAmountPaid = 1, UpdatedAt = GETDATE()
            WHERE BookingID = @BookingID
          `);
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
