const express = require('express');
const router = express.Router();

// Simple welcome message for the root URL
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to VenueVue API!',
    endpoints: {
      users: '/users',
      docs: 'Coming soon'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
