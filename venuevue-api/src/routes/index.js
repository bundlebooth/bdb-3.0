const express = require('express');
const router = express.Router();

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
    const pf = parseFloat(process.env.PLATFORM_FEE_PERCENT || '8');
    const sp = parseFloat(process.env.STRIPE_FEE_PERCENT || process.env.STRIPE_PROC_FEE_PERCENT || '2.9');
    const sf = parseFloat(process.env.STRIPE_FEE_FIXED || process.env.STRIPE_PROC_FEE_FIXED || '0.30');
    const tax = parseFloat(process.env.TAX_PERCENT || '0');
    const curr = ((process.env.STRIPE_CURRENCY || process.env.CURRENCY || 'cad') + '').toLowerCase();
    res.json({
      status: 'success',
      data: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
        platformFeePercent: Number.isFinite(pf) ? pf : 0,
        stripeFeePercent: Number.isFinite(sp) ? sp : 2.9,
        stripeFeeFixed: Number.isFinite(sf) ? sf : 0.30,
        taxPercent: Number.isFinite(tax) ? tax : 0,
        currency: curr
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
