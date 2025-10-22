const express = require('express');
const router = express.Router();
const { getBillingConfig } = require('../config/billing');

// Simple welcome message for the root URL
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to VenueVue API!',
    endpoints: {
      users: '/users',
      config: '/config',
      docs: 'Coming soon'
    },
    timestamp: new Date().toISOString()
  });
});

// Config endpoint to serve frontend configuration including API keys
router.get('/config', (req, res) => {
  try {
    const b = getBillingConfig();
    res.json({
      status: 'success',
      data: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
        PLATFORM_FEE_PERCENT: b.platformPct,
        STRIPE_PROC_FEE_PERCENT: b.stripePct,
        STRIPE_PROC_FEE_FIXED: b.stripeFixed,
        TAX_PERCENT: b.taxPct,
        CURRENCY: (b.currency || 'cad').toUpperCase()
      }
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch configuration'
    });
  }
});

module.exports = router;
