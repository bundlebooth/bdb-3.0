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
router.post('/register', upload.array('images', 5), async (req, res) => {
  try {
    const {
      userId,
      name,
      email,
      passwordHash,
      businessName,
      businessType,
      category,
      yearsInBusiness,
      description,
      phone,
      address,
      website,
      services
    } = req.body;

    // Parse services JSON if provided
    let servicesData = [];
    try {
      servicesData = services ? JSON.parse(services) : [];
    } catch (e) {
      console.error('Error parsing services JSON:', e);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid services format'
      });
    }

    // Parse categories (single category or array)
    let categoriesData = [];
    if (category) {
      categoriesData = Array.isArray(category) ? category : [category];
    }

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    
    // Set all input parameters
    request.input('Name', sql.NVarChar(100), name);
    request.input('Email', sql.NVarChar(100), email);
    request.input('PasswordHash', sql.NVarChar(255), passwordHash);
    request.input('BusinessName', sql.NVarChar(100), businessName);
    request.input('BusinessDescription', sql.NVarChar(sql.MAX), description);
    request.input('BusinessPhone', sql.NVarChar(20), phone);
    request.input('Website', sql.NVarChar(255), website);
    request.input('YearsInBusiness', sql.Int, yearsInBusiness ? parseInt(yearsInBusiness) : null);
    request.input('Address', sql.NVarChar(255), address);
    
    // Parse address components
    const [city, state] = address ? address.split(',').map(s => s.trim()) : [null, null];
    request.input('City', sql.NVarChar(100), city);
    request.input('State', sql.NVarChar(50), state);
    request.input('Country', sql.NVarChar(50), 'USA'); // Default country
    
    // Categories and services as JSON
    request.input('Categories', sql.NVarChar(sql.MAX), JSON.stringify(categoriesData));
    request.input('Services', sql.NVarChar(sql.MAX), JSON.stringify(servicesData));
    
    // Execute the stored procedure
    const result = await request.execute('sp_RegisterVendor');
    
    if (result.recordset[0].Success) {
      // Handle file uploads (images) if any
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          // In production, upload to cloud storage here
          console.log('Vendor image uploaded:', file);
        });
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
        CASE 
          WHEN vp.BusinessName IS NULL THEN 0
          WHEN vp.BusinessDescription IS NULL THEN 0
          WHEN vp.BusinessPhone IS NULL THEN 0
          WHEN vp.Address IS NULL THEN 0
          ELSE 1
        END AS IsProfileComplete
      FROM VendorProfiles vp
      WHERE vp.UserID = @UserID
    `);

    if (result.recordset.length === 0) {
      return res.json({
        success: true,
        isVendor: false,
        isProfileComplete: false,
        IsVerified: false
      });
    }

    const vendor = result.recordset[0];
    
    res.json({
      success: true,
      isVendor: true,
      isProfileComplete: vendor.IsProfileComplete === 1,
      IsVerified: true,
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

// Get vendor details - MOVED BELOW /status ROUTE
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

// Update vendor profile
router.put('/:id', upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const files = req.files || [];

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    // Start transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);
      
      // Update basic vendor info
      request.input('VendorProfileID', sql.Int, id);
      request.input('BusinessName', sql.NVarChar(100), updateData.businessName);
      request.input('BusinessDescription', sql.NVarChar(sql.MAX), updateData.description);
      request.input('BusinessPhone', sql.NVarChar(20), updateData.phone);
      request.input('Website', sql.NVarChar(255), updateData.website);
      request.input('YearsInBusiness', sql.Int, updateData.yearsInBusiness);
      request.input('Address', sql.NVarChar(255), updateData.address);
      request.input('City', sql.NVarChar(100), updateData.city);
      request.input('State', sql.NVarChar(50), updateData.state);
      request.input('Country', sql.NVarChar(50), updateData.country || 'USA');
      request.input('PostalCode', sql.NVarChar(20), updateData.postalCode);
      request.input('IsPremium', sql.Bit, updateData.isPremium || 0);
      request.input('IsEcoFriendly', sql.Bit, updateData.isEcoFriendly || 0);
      request.input('IsAwardWinning', sql.Bit, updateData.isAwardWinning || 0);

      await request.query(`
        UPDATE VendorProfiles 
        SET 
          BusinessName = @BusinessName,
          BusinessDescription = @BusinessDescription,
          BusinessPhone = @BusinessPhone,
          Website = @Website,
          YearsInBusiness = @YearsInBusiness,
          Address = @Address,
          City = @City,
          State = @State,
          Country = @Country,
          PostalCode = @PostalCode,
          IsPremium = @IsPremium,
          IsEcoFriendly = @IsEcoFriendly,
          IsAwardWinning = @IsAwardWinning,
          UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID
      `);

      // Handle image uploads (in production, upload to cloud storage)
      if (files.length > 0) {
        for (const file of files) {
          const imgRequest = new sql.Request(transaction);
          imgRequest.input('VendorProfileID', sql.Int, id);
          imgRequest.input('ImageURL', sql.NVarChar(255), `/uploads/${file.filename}`);
          imgRequest.input('IsPrimary', sql.Bit, 0);
          
          await imgRequest.query(`
            INSERT INTO VendorImages (VendorProfileID, ImageURL, IsPrimary)
            VALUES (@VendorProfileID, @ImageURL, @IsPrimary)
          `);
        }
      }

      // Commit transaction
      await transaction.commit();

      res.json({
        success: true,
        message: 'Vendor profile updated successfully'
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update vendor profile',
      error: err.message 
    });
  }
});

module.exports = router;
