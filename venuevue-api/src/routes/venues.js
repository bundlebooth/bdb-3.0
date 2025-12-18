const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const { authenticate } = require('../middlewares/auth');  

// Get all venues
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .execute('vendors.sp_Provider_Search');
      
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get venue details
router.get('/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ProviderID', sql.Int, req.params.id)
      .execute('vendors.sp_Provider_GetFullProfile');
      
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search venues
router.post('/search', async (req, res) => {
  try {
    const { searchTerm, typeId, category, location, minPrice, maxPrice, minRating } = req.body;
    
    const pool = await poolPromise;
    const result = await pool.request()
      .input('SearchTerm', sql.NVarChar(100), searchTerm || null)
      .input('ProviderTypeID', sql.Int, typeId || null)
      .input('Category', sql.NVarChar(50), category || null)
      .input('Location', sql.NVarChar(100), location || null)
      .input('MinPrice', sql.Decimal(18, 2), minPrice || null)
      .input('MaxPrice', sql.Decimal(18, 2), maxPrice || null)
      .input('MinRating', sql.Decimal(3, 2), minRating || null)
      .execute('vendors.sp_Provider_Search');
      
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
