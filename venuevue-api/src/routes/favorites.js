const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Toggle favorite status
router.post('/toggle', async (req, res) => {
  try {
    const { userId, vendorProfileId } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, userId);
    request.input('VendorProfileID', sql.Int, vendorProfileId);

    const result = await request.execute('sp_ToggleFavorite');
    
    res.json(result.recordset[0]);

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

// Get user favorites with complete vendor data
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, userId);

    // Get favorites with complete vendor data including images
    // Using only core columns that definitely exist in VendorProfiles table
    const result = await request.query(`
      SELECT 
        f.FavoriteID,
        f.UserID,
        f.VendorProfileID,
        v.BusinessName,
        v.DisplayName,
        v.BusinessDescription,
        v.City,
        v.State,
        v.Country,
        v.IsPremium,
        v.IsVerified,
        v.LogoURL,
        (SELECT TOP 1 vc.Category FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS PrimaryCategory,
        (SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID ORDER BY CASE WHEN vi.IsPrimary = 1 THEN 0 ELSE 1 END, vi.DisplayOrder) AS FeaturedImageURL,
        f.CreatedAt
      FROM Favorites f
      JOIN VendorProfiles v ON f.VendorProfileID = v.VendorProfileID
      WHERE f.UserID = @UserID
      ORDER BY f.CreatedAt DESC
    `);
    
    res.json(result.recordset);

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

module.exports = router;
