const express = require('express');
const router = express.Router();
const axios = require('axios');

// Proxy endpoint for IP geolocation to avoid CORS issues on frontend
// Uses ip-api.com which is free and reliable but HTTP-only
router.get('/ip-location', async (req, res) => {
  try {
    // Get client IP - check various headers for proxied requests
    let clientIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress ||
                   req.ip;
    
    // Handle comma-separated list of IPs (first one is the client)
    if (clientIP && clientIP.includes(',')) {
      clientIP = clientIP.split(',')[0].trim();
    }
    
    // Remove IPv6 prefix if present
    if (clientIP && clientIP.startsWith('::ffff:')) {
      clientIP = clientIP.substring(7);
    }
    
    // For localhost/development, use empty string to get server's public IP
    if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === 'localhost') {
      clientIP = '';
    }
    
    // Call ip-api.com (free, no API key needed, HTTP only - but we're on backend so it's fine)
    const url = clientIP 
      ? `http://ip-api.com/json/${clientIP}?fields=status,message,city,regionName,country,lat,lon`
      : `http://ip-api.com/json/?fields=status,message,city,regionName,country,lat,lon`;
    
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data && response.data.status === 'success') {
      res.json({
        success: true,
        city: response.data.city,
        region: response.data.regionName,
        country: response.data.country,
        lat: response.data.lat,
        lng: response.data.lon
      });
    } else {
      res.json({
        success: false,
        message: response.data?.message || 'Failed to get location'
      });
    }
  } catch (error) {
    console.error('IP geolocation error:', error.message);
    res.json({
      success: false,
      message: 'Failed to get location'
    });
  }
});

module.exports = router;
