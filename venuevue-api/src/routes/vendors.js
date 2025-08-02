const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Search vendors using sp_SearchVendors
router.get('/', async (req, res) => {
  let pool;
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

    // Get a connection pool
    pool = await poolPromise;
    
    // Validate connection
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);

    // Set parameters with proper null handling
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
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Database operation failed',
      error: err.message 
    });
  } finally {
    // Release connection if needed
    if (pool) {
      // For mssql, connections are automatically returned to the pool
    }
  }
});

module.exports = router;
