const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Add review
router.post('/', async (req, res) => {
  try {
    const { 
      userId, 
      vendorProfileId, 
      bookingId, 
      rating, 
      title, 
      comment 
    } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, userId);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('BookingID', sql.Int, bookingId);
    request.input('Rating', sql.Int, rating);
    request.input('Title', sql.NVarChar(100), title || null);
    request.input('Comment', sql.NVarChar(sql.MAX), comment);
    request.input('IsAnonymous', sql.Bit, 0);

    const result = await request.execute('sp_AddReview');
    
    res.json({ reviewId: result.recordset[0].ReviewID });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

module.exports = router;
