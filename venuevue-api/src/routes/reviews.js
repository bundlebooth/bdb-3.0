const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');

// Submit review
router.post('/submit', async (req, res) => {
  try {
    const { userId, vendorProfileId, rating, comment } = req.body;

    if (!userId || !vendorProfileId || !rating || !comment) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('UserID', sql.Int, userId);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('Rating', sql.Int, rating);
    request.input('Comment', sql.NVarChar(sql.MAX), comment);
    
    const result = await request.execute('sp_SubmitReview');
    
    res.json({
      success: true,
      review: result.recordset[0]
    });

  } catch (err) {
    console.error('Review submission error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit review',
      error: err.message 
    });
  }
});

// Get reviews for vendor
router.get('/vendor/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.execute('sp_GetVendorReviews');
    
    res.json({
      success: true,
      reviews: result.recordset
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch reviews',
      error: err.message 
    });
  }
});

module.exports = router;
