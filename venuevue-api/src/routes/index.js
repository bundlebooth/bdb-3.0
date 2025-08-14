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
    res.json({
      status: 'success',
      data: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        // Add other frontend config as needed
        apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api'
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
