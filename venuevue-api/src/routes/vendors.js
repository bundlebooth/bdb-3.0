const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const { authenticate } = require('../middlewares/auth');
const sql = require('mssql');

// Get all venues
router.get('/', async (req, res) => {
  let pool;
  try {
    pool = await poolPromise;
    const request = pool.request();
    const result = await request.execute('sp_SearchVendors');
    
    // Transform the data to match expected format
    const transformed = result.recordset.map(vendor => ({
      id: vendor.VendorID,
      name: vendor.Name,
      location: vendor.Location,
      category: vendor.Category,
      type: vendor.Name.includes(' ') ? 'company' : 'independent',
      priceLevel: vendor.PriceLevel,
      price: `$${Math.floor(Math.random() * 900) + 100}`, // Temporary placeholder
      rating: `${vendor.Rating} (${vendor.ReviewCount})`,
      description: vendor.Description,
      image: vendor.PrimaryImage,
      badge: vendor.IsPremium ? 'Premium' : 
            vendor.IsAwardWinning ? 'Award Winning' : 
            vendor.IsEcoFriendly ? 'Eco Friendly' : null,
      isPremium: vendor.IsPremium,
      isEcoFriendly: vendor.IsEcoFriendly,
      isAwardWinning: vendor.IsAwardWinning,
      coordinates: {
        lat: vendor.Latitude,
        lng: vendor.Longitude
      }
    }));
      
    res.json(transformed);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: err.message });
  } finally {
    if (pool) {
      // No need to close the pool as it's managed by poolPromise
    }
  }
});

// Get venue details
router.get('/:id', async (req, res) => {
  let pool;
  try {
    pool = await poolPromise;
    const request = pool.request();
    const result = await request
      .input('ProviderID', sql.Int, req.params.id)
      .execute('sp_Provider_GetFullProfile');
      
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    // The stored procedure now returns data in the correct format
    const vendorData = result.recordset[0];
    // Parse the JSON fields if they come as strings
    if (typeof vendorData.coordinates === 'string') {
      vendorData.coordinates = JSON.parse(vendorData.coordinates);
    }
    if (typeof vendorData.services === 'string') {
      vendorData.services = JSON.parse(vendorData.services);
    }
    
    res.json(vendorData);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: err.message });
  } finally {
    if (pool) {
      // No need to close the pool as it's managed by poolPromise
    }
  }
});

// Search venues
router.post('/search', async (req, res) => {
  let pool;
  try {
    const { searchTerm, category, minPrice, maxPrice, minRating, isPremium, isEcoFriendly, isAwardWinning } = req.body;
    
    pool = await poolPromise;
    const request = pool.request();
    const result = await request
      .input('SearchTerm', sql.NVarChar(100), searchTerm || null)
      .input('Category', sql.NVarChar(50), category || null)
      .input('MinPrice', sql.Decimal(10, 2), minPrice || null)
      .input('MaxPrice', sql.Decimal(10, 2), maxPrice || null)
      .input('IsPremium', sql.Bit, isPremium || null)
      .input('IsEcoFriendly', sql.Bit, isEcoFriendly || null)
      .input('IsAwardWinning', sql.Bit, isAwardWinning || null)
      .execute('sp_SearchVendors');
    
    // Transform search results similar to the GET / endpoint
    const transformed = result.recordset.map(vendor => ({
      id: vendor.VendorID,
      name: vendor.Name,
      location: vendor.Location,
      category: vendor.Category,
      type: vendor.Name.includes(' ') ? 'company' : 'independent',
      priceLevel: vendor.PriceLevel,
      price: `$${Math.floor(Math.random() * 900) + 100}`, // Temporary placeholder
      rating: `${vendor.Rating} (${vendor.ReviewCount})`,
      description: vendor.Description,
      image: vendor.PrimaryImage,
      badge: vendor.IsPremium ? 'Premium' : 
            vendor.IsAwardWinning ? 'Award Winning' : 
            vendor.IsEcoFriendly ? 'Eco Friendly' : null,
      isPremium: vendor.IsPremium,
      isEcoFriendly: vendor.IsEcoFriendly,
      isAwardWinning: vendor.IsAwardWinning,
      coordinates: {
        lat: vendor.Latitude,
        lng: vendor.Longitude
      }
    }));
      
    res.json(transformed);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: err.message });
  } finally {
    if (pool) {
      // No need to close the pool as it's managed by poolPromise
    }
  }
});

module.exports = router;
