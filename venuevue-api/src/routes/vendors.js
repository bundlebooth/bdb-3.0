const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Search vendors using sp_SearchVendors
router.get('/', async (req, res) => {
  try {
    const { 
      searchTerm, 
      category, 
      minPrice, 
      maxPrice, 
      isPremium,
      isEcoFriendly,
      isAwardWinning 
    } = req.query;

    const pool = await poolPromise;
    const request = pool.request();

    // Map exactly to the stored procedure parameters
    request.input('SearchTerm', sql.NVarChar(100), searchTerm || null);
    request.input('Category', sql.NVarChar(50), category || null);
    request.input('MinPrice', sql.Decimal(10, 2), minPrice ? parseFloat(minPrice) : null);
    request.input('MaxPrice', sql.Decimal(10, 2), maxPrice ? parseFloat(maxPrice) : null);
    request.input('IsPremium', sql.Bit, isPremium === 'true' ? 1 : isPremium === 'false' ? 0 : null);
    request.input('IsEcoFriendly', sql.Bit, isEcoFriendly === 'true' ? 1 : isEcoFriendly === 'false' ? 0 : null);
    request.input('IsAwardWinning', sql.Bit, isAwardWinning === 'true' ? 1 : isAwardWinning === 'false' ? 0 : null);

    const result = await request.execute('sp_SearchVendors');
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (err) {
    console.error('Error executing sp_SearchVendors:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error searching vendors',
      error: err.message 
    });
  }
});

// Get vendor details using sp_GetVendorDetails
router.get('/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('VendorID', sql.Int, parseInt(req.params.id))
      .execute('sp_GetVendorDetails');

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (err) {
    console.error('Error executing sp_GetVendorDetails:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor details',
      error: err.message
    });
  }
});

module.exports = router;
