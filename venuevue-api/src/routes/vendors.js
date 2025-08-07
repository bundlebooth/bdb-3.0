const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');
const { upload } = require('../middlewares/uploadMiddleware'); 

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
    
    // Format the response to match the expected JSON structure
    const formattedVendors = result.recordset.map(vendor => ({
      id: vendor.id,
      name: vendor.name,
      type: vendor.type,
      location: vendor.location,
      description: vendor.description,
      price: vendor.price,
      priceLevel: vendor.priceLevel,
      rating: vendor.rating,
      reviewCount: vendor.ReviewCount,
      favoriteCount: vendor.FavoriteCount,
      bookingCount: vendor.BookingCount,
      image: vendor.image,
      capacity: vendor.Capacity,
      rooms: vendor.Rooms,
      isPremium: vendor.IsPremium,
      isEcoFriendly: vendor.IsEcoFriendly,
      isAwardWinning: vendor.IsAwardWinning,
      region: vendor.Region,
      distanceMiles: vendor.DistanceMiles,
      categories: vendor.Categories,
      services: vendor.services ? JSON.parse(vendor.services) : [],
      reviews: vendor.reviews ? JSON.parse(vendor.reviews) : []
    }));

    res.json({
      vendors: formattedVendors,
      totalCount: result.recordset.length > 0 ? result.recordset[0].TotalCount : 0
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

// Register new vendor
router.post('/register', upload.single('businessLicense'), async (req, res) => {
  try {
    const {
      userId,
      businessName,
      displayName,
      email,
      phone,
      website,
      yearsInBusiness,
      description,
      tagline,
      address,
      city,
      state,
      country,
      postalCode,
      categories,
      services
    } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    
    // Set all input parameters
    request.input('UserID', sql.Int, userId);
    request.input('BusinessName', sql.NVarChar(100), businessName);
    request.input('DisplayName', sql.NVarChar(100), displayName);
    request.input('BusinessDescription', sql.NVarChar(sql.MAX), description);
    request.input('BusinessPhone', sql.NVarChar(20), phone);
    request.input('Website', sql.NVarChar(255), website);
    request.input('YearsInBusiness', sql.Int, yearsInBusiness ? parseInt(yearsInBusiness) : null);
    request.input('Address', sql.NVarChar(255), address);
    request.input('City', sql.NVarChar(100), city);
    request.input('State', sql.NVarChar(50), state);
    request.input('Country', sql.NVarChar(50), country);
    request.input('PostalCode', sql.NVarChar(20), postalCode);
    
    // Categories and services as JSON
    request.input('Categories', sql.NVarChar(sql.MAX), JSON.stringify(categories));
    request.input('Services', sql.NVarChar(sql.MAX), JSON.stringify(services));
    
    // Execute the stored procedure
    const result = await request.execute('sp_RegisterVendor');
    
    if (result.recordset[0].Success) {
      // Handle file upload (business license) if needed
      if (req.file) {
        // In production, you would upload to cloud storage here
        // For now, we'll just log the file info
        console.log('Business license uploaded:', req.file);
      }
      
      res.status(201).json({
        success: true,
        message: 'Vendor registered successfully',
        userId: result.recordset[0].UserID,
        vendorProfileId: result.recordset[0].VendorProfileID
      });
    } else {
      throw new Error('Registration failed at database level');
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed. Please try again.',
      error: err.message 
    });
  }
});

// Check vendor registration status for current user - MOVED ABOVE /:id ROUTE
router.get('/status', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('UserID', sql.Int, userId);

    const result = await request.query(`
      SELECT 
        vp.VendorProfileID,
        vp.IsVerified,
        vp.IsCompleted,
        u.IsVendor
      FROM VendorProfiles vp
      JOIN Users u ON vp.UserID = u.UserID
      WHERE vp.UserID = @UserID
    `);

    if (result.recordset.length === 0) {
      return res.json({
        success: true,
        isVendor: false,
        isProfileComplete: false,
        isVerified: false
      });
    }

    const vendor = result.recordset[0];
    
    res.json({
      success: true,
      isVendor: vendor.IsVendor,
      isProfileComplete: vendor.IsCompleted === 1,
      isVerified: vendor.IsVerified,
      vendorProfileId: vendor.VendorProfileID
    });

  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check vendor status',
      error: err.message 
    });
  }
});

// Get vendor details for a public profile page
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // Optional: for checking favorites

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, id);
    request.input('UserID', sql.Int, userId || null);

    const result = await request.execute('sp_GetVendorDetails');
    
    if (result.recordsets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Format the response
    const vendorDetails = {
      profile: result.recordsets[0][0],
      categories: result.recordsets[1],
      services: result.recordsets[2],
      addOns: result.recordsets[3],
      portfolio: result.recordsets[4],
      reviews: result.recordsets[5],
      faqs: result.recordsets[6],
      team: result.recordsets[7],
      socialMedia: result.recordsets[8],
      businessHours: result.recordsets[9],
      images: result.recordsets[10],
      isFavorite: result.recordsets[11] ? result.recordsets[11][0].IsFavorite : false,
      availableSlots: result.recordsets[12]
    };

    res.json({
      success: true,
      data: vendorDetails
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get vendor details',
      error: err.message 
    });
  }
});

// NEW: Update Vendor Profile - Step 1 (Business Basics)
router.put('/:id/basics', async (req, res) => {
  try {
    const { id } = req.params;
    const { businessName, displayName, businessEmail, businessPhone, website, categories } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);

    request.input('VendorProfileID', sql.Int, id);
    request.input('BusinessName', sql.NVarChar(100), businessName);
    request.input('DisplayName', sql.NVarChar(100), displayName);
    request.input('BusinessEmail', sql.NVarChar(100), businessEmail);
    request.input('BusinessPhone', sql.NVarChar(20), businessPhone);
    request.input('Website', sql.NVarChar(255), website);
    request.input('Categories', sql.NVarChar(sql.MAX), JSON.stringify(categories));

    await request.execute('sp_UpdateVendorProfileBasics');
    res.json({ success: true, message: 'Business basics updated successfully' });
  } catch (err) {
    console.error('Update vendor basics error:', err);
    res.status(500).json({ success: false, message: 'Failed to update business basics', error: err.message });
  }
});

// NEW: Update Vendor Profile - Step 2 (Location Info)
router.put('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { address, city, state, country, postalCode, latitude, longitude } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);

    request.input('VendorProfileID', sql.Int, id);
    request.input('Address', sql.NVarChar(255), address);
    request.input('City', sql.NVarChar(100), city);
    request.input('State', sql.NVarChar(50), state);
    request.input('Country', sql.NVarChar(50), country);
    request.input('PostalCode', sql.NVarChar(20), postalCode);
    request.input('Latitude', sql.Decimal(10, 8), latitude);
    request.input('Longitude', sql.Decimal(11, 8), longitude);

    await request.execute('sp_UpdateVendorProfileLocation');
    res.json({ success: true, message: 'Location info updated successfully' });
  } catch (err) {
    console.error('Update vendor location error:', err);
    res.status(500).json({ success: false, message: 'Failed to update location info', error: err.message });
  }
});

// NEW: Update Vendor Profile - Step 3 (About the Vendor)
router.put('/:id/about', async (req, res) => {
  try {
    const { id } = req.params;
    const { tagline, businessDescription, yearsInBusiness } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);

    request.input('VendorProfileID', sql.Int, id);
    request.input('Tagline', sql.NVarChar(255), tagline);
    request.input('BusinessDescription', sql.NVarChar(sql.MAX), businessDescription);
    request.input('YearsInBusiness', sql.Int, yearsInBusiness);

    await request.execute('sp_UpdateVendorProfileAbout');
    res.json({ success: true, message: 'About section updated successfully' });
  } catch (err) {
    console.error('Update vendor about error:', err);
    res.status(500).json({ success: false, message: 'Failed to update about section', error: err.message });
  }
});

// Update vendor profile (old, deprecated route for multi-step flow)
router.put('/:id', upload.array('images', 5), async (req, res) => {
  res.status(400).json({ success: false, message: "This endpoint is now deprecated. Please use the specific /basics, /location, and /about endpoints for a multi-step update." });
});

module.exports = router;
