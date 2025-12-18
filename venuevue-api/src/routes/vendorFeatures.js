const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');

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
    let result;
    
    try {
      result = await pool.request()
        .execute('sp_GetAllVendorFeaturesGrouped');
    } catch (spError) {
      console.error('sp_GetAllVendorFeaturesGrouped failed:', spError.message);
      return res.json({
        success: true,
        categories: []
      });
    }
    
    // Group the results by category
    const grouped = {};
    (result.recordset || []).forEach(row => {
      const catKey = row.CategoryKey;
      if (!catKey) return;
      
      if (!grouped[catKey]) {
        grouped[catKey] = {
          categoryID: row.CategoryID,
          categoryName: row.CategoryName,
          categoryKey: row.CategoryKey,
          categoryDescription: row.CategoryDescription,
          categoryIcon: row.CategoryIcon,
          applicableVendorCategories: row.ApplicableVendorCategories,
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
    let result;
    
    try {
      result = await pool.request()
        .input('VendorProfileID', sql.Int, parseInt(vendorProfileId))
        .execute('sp_Vendor_GetSelectedFeatures');
    } catch (spError) {
      console.error('sp_Vendor_GetSelectedFeatures failed:', spError.message);
      return res.json({
        success: true,
        selectedFeatures: [],
        groupedByCategory: []
      });
    }
    
    // Group by category
    const grouped = {};
    (result.recordset || []).forEach(row => {
      const catKey = row.CategoryKey;
      if (!catKey) return;
      
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
      selectedFeatures: result.recordset || [],
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
    
    let result;
    try {
      result = await pool.request()
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
    } catch (spError) {
      // Stored procedure doesn't exist, try direct SQL
      console.log('[vendor-features] sp_SaveVendorFeatureSelections not found, trying direct SQL');
      try {
        // Only delete and re-insert if there are features to save
        // This prevents accidental data loss when an empty array is passed
        if (featureIds.length > 0) {
          // Delete existing selections first
          await pool.request()
            .input('VendorProfileID', sql.Int, parseInt(vendorProfileId))
            .query('DELETE FROM VendorSelectedFeatures WHERE VendorProfileID = @VendorProfileID');
          console.log('[vendor-features] Deleted existing selections for vendorProfileId:', vendorProfileId);
          
          // Insert new selections
          console.log('[vendor-features] Inserting', featureIds.length, 'features:', featureIds);
          for (const featureId of featureIds) {
            try {
              // Try with SelectedAt column first (matches onboarding endpoint)
              await pool.request()
                .input('VendorProfileID', sql.Int, parseInt(vendorProfileId))
                .input('FeatureID', sql.Int, parseInt(featureId))
                .query('INSERT INTO VendorSelectedFeatures (VendorProfileID, FeatureID, SelectedAt) VALUES (@VendorProfileID, @FeatureID, GETDATE())');
            } catch (insertError) {
              // Try with CreatedAt column
              try {
                await pool.request()
                  .input('VendorProfileID', sql.Int, parseInt(vendorProfileId))
                  .input('FeatureID', sql.Int, parseInt(featureId))
                  .query('INSERT INTO VendorSelectedFeatures (VendorProfileID, FeatureID, CreatedAt) VALUES (@VendorProfileID, @FeatureID, GETDATE())');
              } catch (insertError2) {
                // Try without timestamp column
                await pool.request()
                  .input('VendorProfileID', sql.Int, parseInt(vendorProfileId))
                  .input('FeatureID', sql.Int, parseInt(featureId))
                  .query('INSERT INTO VendorSelectedFeatures (VendorProfileID, FeatureID) VALUES (@VendorProfileID, @FeatureID)');
              }
            }
          }
          console.log('[vendor-features] Successfully inserted', featureIds.length, 'features');
        } else {
          console.log('[vendor-features] No features to save, preserving existing selections');
        }
        
        res.json({
          success: true,
          message: featureIds.length > 0 ? 'Feature selections saved successfully' : 'No changes made (empty feature list)',
          selectionCount: featureIds.length
        });
      } catch (tableError) {
        // Tables don't exist
        console.log('[vendor-features] VendorSelectedFeatures table error:', tableError.message);
        res.status(500).json({
          success: false,
          message: 'Feature tables not set up in database. Please run the database migration scripts.',
          error: tableError.message
        });
      }
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
