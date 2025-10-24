const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../config/database');

// =============================================
// GET /api/vendor-features/categories
// Get all feature categories
// =============================================
router.get('/categories', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .execute('sp_GetVendorFeatureCategories');
    
    res.json({
      success: true,
      categories: result.recordset
    });
  } catch (error) {
    console.error('Error fetching feature categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feature categories',
      error: error.message
    });
  }
});

// =============================================
// GET /api/vendor-features/category/:categoryKey
// Get features by category key
// =============================================
router.get('/category/:categoryKey', async (req, res) => {
  try {
    const { categoryKey } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('CategoryKey', sql.NVarChar(50), categoryKey)
      .execute('sp_GetVendorFeaturesByCategory');
    
    res.json({
      success: true,
      features: result.recordset
    });
  } catch (error) {
    console.error('Error fetching features by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch features',
      error: error.message
    });
  }
});

// =============================================
// GET /api/vendor-features/all-grouped
// Get all features grouped by category
// =============================================
router.get('/all-grouped', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .execute('sp_GetAllVendorFeaturesGrouped');
    
    // Group the results by category
    const grouped = {};
    result.recordset.forEach(row => {
      const catKey = row.CategoryKey;
      if (!grouped[catKey]) {
        grouped[catKey] = {
          categoryID: row.CategoryID,
          categoryName: row.CategoryName,
          categoryKey: row.CategoryKey,
          categoryDescription: row.CategoryDescription,
          categoryIcon: row.CategoryIcon,
          categoryOrder: row.CategoryOrder,
          features: []
        };
      }
      
      if (row.FeatureID) {
        grouped[catKey].features.push({
          featureID: row.FeatureID,
          featureName: row.FeatureName,
          featureKey: row.FeatureKey,
          featureDescription: row.FeatureDescription,
          featureIcon: row.FeatureIcon,
          featureOrder: row.FeatureOrder
        });
      }
    });
    
    // Convert to array and sort by category order
    const categories = Object.values(grouped).sort((a, b) => a.categoryOrder - b.categoryOrder);
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching grouped features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch features',
      error: error.message
    });
  }
});

// =============================================
// GET /api/vendor-features/vendor/:vendorProfileId
// Get vendor's selected features
// =============================================
router.get('/vendor/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('VendorProfileID', sql.Int, parseInt(vendorProfileId))
      .execute('sp_GetVendorSelectedFeatures');
    
    // Group by category
    const grouped = {};
    result.recordset.forEach(row => {
      const catKey = row.CategoryKey;
      if (!grouped[catKey]) {
        grouped[catKey] = {
          categoryID: row.CategoryID,
          categoryName: row.CategoryName,
          categoryKey: row.CategoryKey,
          categoryIcon: row.CategoryIcon,
          features: []
        };
      }
      
      grouped[catKey].features.push({
        featureID: row.FeatureID,
        featureName: row.FeatureName,
        featureKey: row.FeatureKey,
        featureIcon: row.FeatureIcon,
        selectedAt: row.SelectedAt
      });
    });
    
    const categories = Object.values(grouped);
    
    res.json({
      success: true,
      selectedFeatures: result.recordset,
      groupedByCategory: categories
    });
  } catch (error) {
    console.error('Error fetching vendor selected features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor features',
      error: error.message
    });
  }
});

// =============================================
// POST /api/vendor-features/vendor/:vendorProfileId
// Save vendor's feature selections
// =============================================
router.post('/vendor/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    const { featureIds } = req.body; // Array of feature IDs
    
    if (!Array.isArray(featureIds)) {
      return res.status(400).json({
        success: false,
        message: 'featureIds must be an array'
      });
    }
    
    const pool = await poolPromise;
    
    // Convert array to comma-separated string
    const featureIdsStr = featureIds.length > 0 ? featureIds.join(',') : '';
    
    const result = await pool.request()
      .input('VendorProfileID', sql.Int, parseInt(vendorProfileId))
      .input('FeatureIDs', sql.NVarChar(sql.MAX), featureIdsStr)
      .execute('sp_SaveVendorFeatureSelections');
    
    const status = result.recordset[0];
    
    if (status.Status === 'success') {
      res.json({
        success: true,
        message: status.Message,
        selectionCount: status.SelectionCount
      });
    } else {
      res.status(500).json({
        success: false,
        message: status.Message
      });
    }
  } catch (error) {
    console.error('Error saving vendor feature selections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save feature selections',
      error: error.message
    });
  }
});

// =============================================
// GET /api/vendor-features/vendor/:vendorProfileId/summary
// Get vendor's feature summary (count per category)
// =============================================
router.get('/vendor/:vendorProfileId/summary', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('VendorProfileID', sql.Int, parseInt(vendorProfileId))
      .execute('sp_GetVendorFeatureSummary');
    
    res.json({
      success: true,
      summary: result.recordset
    });
  } catch (error) {
    console.error('Error fetching vendor feature summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feature summary',
      error: error.message
    });
  }
});

module.exports = router;
