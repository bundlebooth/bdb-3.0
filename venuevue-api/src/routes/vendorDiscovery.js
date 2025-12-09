const express = require('express');
const router = express.Router();

// Vendor Discovery Routes - DEPRECATED
// ALL DISCOVERY FUNCTIONALITY HAS BEEN CONSOLIDATED INTO THE MAIN /vendors ENDPOINT.
// Use: GET /api/vendors?includeDiscoverySections=true&pageSize=50

const deprecatedResponse = (res, endpoint) => {
    console.warn('DEPRECATED: ' + endpoint + ' called. Use /api/vendors?includeDiscoverySections=true instead.');
    return res.status(410).json({
        success: false,
        message: 'This endpoint is deprecated.',
        migration: 'Use GET /api/vendors?includeDiscoverySections=true instead.'
    });
};

router.get('/sections', (req, res) => deprecatedResponse(res, '/vendor-discovery/sections'));
router.get('/trending', (req, res) => deprecatedResponse(res, '/vendor-discovery/trending'));
router.get('/responsive', (req, res) => deprecatedResponse(res, '/vendor-discovery/responsive'));
router.get('/top-rated', (req, res) => deprecatedResponse(res, '/vendor-discovery/top-rated'));
router.get('/most-booked', (req, res) => deprecatedResponse(res, '/vendor-discovery/most-booked'));
router.get('/recently-added', (req, res) => deprecatedResponse(res, '/vendor-discovery/recently-added'));
router.get('/premium', (req, res) => deprecatedResponse(res, '/vendor-discovery/premium'));
router.get('/recently-reviewed', (req, res) => deprecatedResponse(res, '/vendor-discovery/recently-reviewed'));
router.get('/nearby', (req, res) => deprecatedResponse(res, '/vendor-discovery/nearby'));
router.get('/recommended', (req, res) => deprecatedResponse(res, '/vendor-discovery/recommended'));

module.exports = router;
