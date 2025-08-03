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
      isAwardWinning,
      latitude,
      longitude,
      radiusMiles,
      pageNumber,
      pageSize,
      sortBy
    } = req.query;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);

    // Set input parameters
    request.input('SearchTerm', sql.NVarChar(100), searchTerm || null);
    request.input('Category', sql.NVarChar(50), category || null);
    request.input('MinPrice', sql.Decimal(10, 2), minPrice ? parseFloat(minPrice) : null);
    request.input('MaxPrice', sql.Decimal(10, 2), maxPrice ? parseFloat(maxPrice) : null);
    request.input('IsPremium', sql.Bit, isPremium === 'true' ? 1 : isPremium === 'false' ? 0 : null);
    request.input('IsEcoFriendly', sql.Bit, isEcoFriendly === 'true' ? 1 : isEcoFriendly === 'false' ? 0 : null);
    request.input('IsAwardWinning', sql.Bit, isAwardWinning === 'true' ? 1 : isAwardWinning === 'false' ? 0 : null);
    request.input('Latitude', sql.Decimal(10, 8), latitude ? parseFloat(latitude) : null);
    request.input('Longitude', sql.Decimal(11, 8), longitude ? parseFloat(longitude) : null);
    request.input('RadiusMiles', sql.Int, radiusMiles ? parseInt(radiusMiles) : 25);
    request.input('PageNumber', sql.Int, pageNumber ? parseInt(pageNumber) : 1);
    request.input('PageSize', sql.Int, pageSize ? parseInt(pageSize) : 10);
    request.input('SortBy', sql.NVarChar(50), sortBy || 'recommended');

    const result = await request.execute('sp_SearchVendors');
    
    // Get vendor IDs from the initial result
    const vendorIds = result.recordset.map(v => v.id);
    
    if (vendorIds.length === 0) {
      return res.json([]);
    }

    // Get services for these vendors
    const servicesRequest = new sql.Request(pool);
    const servicesResult = await servicesRequest.query(`
      SELECT 
        sc.VendorProfileID,
        sc.Category,
        s.ServiceID,
        s.Name AS ServiceName,
        s.Description AS ServiceDescription,
        s.Price
      FROM ServiceCategories sc
      JOIN Services s ON sc.CategoryID = s.CategoryID
      WHERE sc.VendorProfileID IN (${vendorIds.map(id => `'${id}'`).join(',')})
      ORDER BY sc.VendorProfileID, sc.Category
    `);

    // Get reviews for these vendors
    const reviewsRequest = new sql.Request(pool);
    const reviewsResult = await reviewsRequest.query(`
      SELECT 
        r.ReviewID AS id,
        r.VendorProfileID,
        CONCAT(u.FirstName, ' ', u.LastName) AS user,
        r.Rating,
        r.Comment AS comment,
        r.CreatedDate AS date
      FROM Reviews r
      JOIN Users u ON r.UserID = u.UserID
      WHERE r.VendorProfileID IN (${vendorIds.map(id => `'${id}'`).join(',')})
      AND r.IsApproved = 1
      ORDER BY r.VendorProfileID, r.CreatedDate DESC
    `);

    // Group services by vendor and category
    const servicesByVendor = {};
    servicesResult.recordset.forEach(service => {
      if (!servicesByVendor[service.VendorProfileID]) {
        servicesByVendor[service.VendorProfileID] = {};
      }
      
      if (!servicesByVendor[service.VendorProfileID][service.Category]) {
        servicesByVendor[service.VendorProfileID][service.Category] = [];
      }
      
      servicesByVendor[service.VendorProfileID][service.Category].push({
        name: service.ServiceName,
        description: service.ServiceDescription,
        price: `$${service.Price.toFixed(2)}`
      });
    });

    // Group reviews by vendor
    const reviewsByVendor = {};
    reviewsResult.recordset.forEach(review => {
      if (!reviewsByVendor[review.VendorProfileID]) {
        reviewsByVendor[review.VendorProfileID] = [];
      }
      
      reviewsByVendor[review.VendorProfileID].push({
        id: review.id,
        user: review.user,
        rating: review.Rating,
        comment: review.comment,
        date: review.date.toISOString()
      });
    });

    // Combine all data into the final response
    const response = result.recordset.map(vendor => ({
      id: vendor.id,
      name: vendor.name,
      type: vendor.type,
      location: vendor.location,
      description: vendor.description,
      price: vendor.price,
      priceLevel: vendor.priceLevel,
      rating: vendor.rating?.toString(),
      image: vendor.image,
      services: servicesByVendor[vendor.id] 
        ? Object.keys(servicesByVendor[vendor.id]).map(category => ({
            category,
            services: servicesByVendor[vendor.id][category]
          }))
        : [],
      reviews: reviewsByVendor[vendor.id] || [],
      IsPremium: vendor.IsPremium,
      IsEcoFriendly: vendor.IsEcoFriendly,
      IsAwardWinning: vendor.IsAwardWinning
    }));

    res.json(response);

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

module.exports = router;
