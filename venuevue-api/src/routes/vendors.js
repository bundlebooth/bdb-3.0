const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');
const { upload } = require('../middlewares/uploadMiddleware');

// Helper function to resolve UserID to VendorProfileID
async function resolveVendorProfileId(id, pool) {
  const idNum = parseInt(id);
  if (isNaN(idNum) || idNum <= 0) {
    throw new Error('Invalid ID format. Must be a positive number.');
  }

  // First, try to get VendorProfileID from UserID
  const userCheckRequest = new sql.Request(pool);
  userCheckRequest.input('UserID', sql.Int, idNum);
  const userCheckResult = await userCheckRequest.query(`
    SELECT 
      u.UserID,
      u.IsVendor,
      vp.VendorProfileID
    FROM Users u
    LEFT JOIN VendorProfiles vp ON u.UserID = vp.UserID
    WHERE u.UserID = @UserID AND u.IsActive = 1
  `);

  if (userCheckResult.recordset.length > 0) {
    const user = userCheckResult.recordset[0];
    if (user.IsVendor && user.VendorProfileID) {
      return user.VendorProfileID;
    }
  }

  // If not found by UserID, try as direct VendorProfileID
  const vendorCheckRequest = new sql.Request(pool);
  vendorCheckRequest.input('VendorProfileID', sql.Int, idNum);
  const vendorCheckResult = await vendorCheckRequest.query(`
    SELECT VendorProfileID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID
  `);
  
  if (vendorCheckResult.recordset.length > 0) {
    return idNum;
  }

  return null;
}

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
    
    const formattedVendors = result.recordset.map(vendor => ({
      id: vendor.id,
      name: vendor.name || '',
      type: vendor.type || '',
      location: vendor.location || '',
      description: vendor.description || '',
      price: vendor.price,
      priceLevel: vendor.priceLevel,
      rating: vendor.rating,
      reviewCount: vendor.ReviewCount,
      favoriteCount: vendor.FavoriteCount,
      bookingCount: vendor.BookingCount,
      image: vendor.image || '',
      capacity: vendor.Capacity,
      rooms: vendor.Rooms,
      isPremium: vendor.IsPremium,
      isEcoFriendly: vendor.IsEcoFriendly,
      isAwardWinning: vendor.IsAwardWinning,
      region: vendor.Region || '',
      distanceMiles: vendor.DistanceMiles,
      categories: vendor.Categories || '',
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
      displayName,
      businessPhone,
      postalCode,
      country,
      businessName,
      category,
      yearsInBusiness,
      description,
      phone,
      address,
      website,
      services
    } = req.body;

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

    let categoriesData = [];
    if (category) {
      categoriesData = Array.isArray(category) ? category : [category];
    }

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, userId ? parseInt(userId) : null);
    request.input('BusinessName', sql.NVarChar(100), businessName);
    request.input('DisplayName', sql.NVarChar(100), displayName || businessName);
    request.input('BusinessDescription', sql.NVarChar(sql.MAX), description);
    request.input('BusinessPhone', sql.NVarChar(20), businessPhone || phone);
    request.input('Website', sql.NVarChar(255), website);
    request.input('YearsInBusiness', sql.Int, yearsInBusiness ? parseInt(yearsInBusiness) : null);
    request.input('Address', sql.NVarChar(255), address);
    
    const [city, state] = address ? address.split(',').map(s => s.trim()) : [null, null];
    request.input('City', sql.NVarChar(100), city);
    request.input('State', sql.NVarChar(50), state);
    request.input('Country', sql.NVarChar(50), country || 'USA');
    request.input('PostalCode', sql.NVarChar(20), postalCode);
    
    request.input('Categories', sql.NVarChar(sql.MAX), JSON.stringify(categoriesData));
    request.input('Services', sql.NVarChar(sql.MAX), JSON.stringify(servicesData));
    
    const result = await request.execute('sp_RegisterVendor');
    
    if (result.recordset[0].Success) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
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

// Check vendor registration status
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

// Get vendor details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    // Resolve the ID to VendorProfileID
    const vendorProfileId = await resolveVendorProfileId(id, pool);
    
    if (!vendorProfileId) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found. Please ensure the vendor exists and is active.'
      });
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('UserID', sql.Int, userId || null);

    const result = await request.execute('sp_GetVendorDetails');
    
    if (result.recordsets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor details not found'
      });
    }

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

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);
      
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

// ===== ENHANCED VENDOR SETUP ENDPOINTS =====

// Get vendor setup progress
router.get('/:id/setup-progress', async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    // Resolve the ID to VendorProfileID
    const vendorProfileId = await resolveVendorProfileId(id, pool);
    
    if (!vendorProfileId) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found. Please ensure the user is registered as a vendor.'
      });
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);

    const result = await request.execute('sp_GetVendorSetupProgress');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor setup progress not found'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });

  } catch (err) {
    console.error('Setup progress error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get setup progress',
      error: err.message 
    });
  }
});

// Complete vendor setup with all data
router.post('/setup', async (req, res) => {
  try {
    const {
      vendorProfileId,
      gallery,
      packages,
      services,
      socialMedia,
      availability
    } = req.body;

    // Validate vendorProfileId
    if (!vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor Profile ID is required'
      });
    }

    const vendorProfileIdNum = parseInt(vendorProfileId);
    if (isNaN(vendorProfileIdNum) || vendorProfileIdNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Vendor Profile ID format. Must be a positive number.'
      });
    }

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    // Verify the vendor profile exists
    const verifyRequest = new sql.Request(pool);
    verifyRequest.input('VendorProfileID', sql.Int, vendorProfileIdNum);
    
    const verifyResult = await verifyRequest.query(`
      SELECT VendorProfileID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID
    `);
    
    if (verifyResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found. Please ensure the vendor profile exists.'
      });
    }

    console.log(`Completing setup for VendorProfileID: ${vendorProfileIdNum}`);

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileIdNum);
    request.input('GalleryData', sql.NVarChar(sql.MAX), gallery ? JSON.stringify(gallery) : null);
    request.input('PackagesData', sql.NVarChar(sql.MAX), packages ? JSON.stringify(packages) : null);
    request.input('ServicesData', sql.NVarChar(sql.MAX), services ? JSON.stringify(services) : null);
    request.input('SocialMediaData', sql.NVarChar(sql.MAX), socialMedia ? JSON.stringify(socialMedia) : null);
    request.input('AvailabilityData', sql.NVarChar(sql.MAX), availability ? JSON.stringify(availability) : null);

    const result = await request.execute('sp_CompleteVendorSetup');
    
    const response = result.recordset[0];
    
    if (response.Success) {
      res.json({
        success: true,
        message: response.Message,
        vendorProfileId: vendorProfileIdNum
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.Message
      });
    }

  } catch (err) {
    console.error('Setup completion error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to complete setup',
      error: err.message 
    });
  }
});

// Add gallery image
router.post('/:id/gallery', async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl, imageType, caption } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, id);
    request.input('ImageURL', sql.NVarChar(500), imageUrl);
    request.input('ImageType', sql.NVarChar(10), imageType || 'upload');
    request.input('Caption', sql.NVarChar(255), caption);

    const result = await request.execute('sp_AddVendorGalleryImage');
    
    res.json({
      success: true,
      imageId: result.recordset[0].ImageID
    });

  } catch (err) {
    console.error('Gallery image error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add gallery image',
      error: err.message 
    });
  }
});

// Add package
router.post('/:id/packages', async (req, res) => {
  try {
    const { id } = req.params;
    const { packageName, description, price, duration, maxGuests, includes } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, id);
    request.input('PackageName', sql.NVarChar(255), packageName);
    request.input('Description', sql.NVarChar(sql.MAX), description);
    request.input('Price', sql.Decimal(10, 2), price);
    request.input('Duration', sql.NVarChar(50), duration);
    request.input('MaxGuests', sql.Int, maxGuests);

    const result = await request.execute('sp_AddVendorPackage');
    
    res.json({
      success: true,
      serviceId: result.recordset[0].ServiceID
    });

  } catch (err) {
    console.error('Package error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add package',
      error: err.message 
    });
  }
});

// Add service
router.post('/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceName, description, price, duration, category } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, id);
    request.input('ServiceName', sql.NVarChar(255), serviceName);
    request.input('Description', sql.NVarChar(sql.MAX), description);
    request.input('Price', sql.Decimal(10, 2), price);
    request.input('Duration', sql.NVarChar(50), duration);
    request.input('Category', sql.NVarChar(100), category || 'General Services');

    const result = await request.execute('sp_AddVendorService');
    
    res.json({
      success: true,
      serviceId: result.recordset[0].ServiceID
    });

  } catch (err) {
    console.error('Service error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add service',
      error: err.message 
    });
  }
});

// Add social media
router.post('/:id/social-media', async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, url } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, id);
    request.input('Platform', sql.NVarChar(50), platform);
    request.input('URL', sql.NVarChar(500), url);

    const result = await request.execute('sp_AddVendorSocialMedia');
    
    res.json({
      success: true,
      message: 'Social media link added successfully'
    });

  } catch (err) {
    console.error('Social media error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add social media link',
      error: err.message 
    });
  }
});

// Add availability
router.post('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, id);
    request.input('DayOfWeek', sql.TinyInt, dayOfWeek);
    request.input('StartTime', sql.Time, startTime);
    request.input('EndTime', sql.Time, endTime);

    const result = await request.execute('sp_AddVendorAvailability');
    
    res.json({
      success: true,
      message: 'Availability added successfully'
    });

  } catch (err) {
    console.error('Availability error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add availability',
      error: err.message 
    });
  }
});

// Get vendor setup data for editing
router.get('/:id/setup-data', async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, id);

    const result = await request.execute('sp_GetVendorSetupData');
    
    if (result.recordsets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const setupData = {
      vendor: result.recordsets[0][0],
      gallery: result.recordsets[1],
      packages: result.recordsets[2],
      services: result.recordsets[3],
      socialMedia: result.recordsets[4],
      availability: result.recordsets[5]
    };

    res.json({
      success: true,
      data: setupData
    });

  } catch (err) {
    console.error('Setup data error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get setup data',
      error: err.message 
    });
  }
});

// Get current vendor's profile information
router.get('/profile', async (req, res) => {
  try {
    const { userId } = req.query;

    // Validate userId parameter
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Validate that userId is a valid number
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID format. Must be a positive number.'
      });
    }

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    // First, check if user exists and is a vendor, then get their vendor profile ID
    const userRequest = new sql.Request(pool);
    userRequest.input('UserID', sql.Int, userIdNum);

    const userResult = await userRequest.query(`
      SELECT 
        u.UserID,
        u.Name,
        u.Email,
        u.IsVendor,
        vp.VendorProfileID
      FROM Users u
      LEFT JOIN VendorProfiles vp ON u.UserID = vp.UserID
      WHERE u.UserID = @UserID AND u.IsActive = 1
    `);

    console.log('User query result:', userResult.recordset);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    const user = userResult.recordset[0];

    if (!user.IsVendor) {
      console.log(`User ${userIdNum} is not a vendor.`);
      return res.status(403).json({
        success: false,
        message: 'User is not registered as a vendor'
      });
    }

    if (!user.VendorProfileID) {
      console.log(`User ${userIdNum} does not have a vendor profile.`);
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found. Please complete vendor registration.'
      });
    }

    console.log(`User ${userIdNum} has vendor profile ID: ${user.VendorProfileID}`);

    // Get comprehensive vendor profile data using the stored procedure
    const profileRequest = new sql.Request(pool);
    profileRequest.input('VendorProfileID', sql.Int, user.VendorProfileID);
    profileRequest.input('UserID', sql.Int, userIdNum); // Pass UserID for favorite check

    const profileResult = await profileRequest.execute('sp_GetVendorDetails');
    
    if (profileResult.recordsets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile details not found'
      });
    }

    // Structure the comprehensive profile data
    const profileData = {
      profile: profileResult.recordsets[0][0] || {},
      categories: profileResult.recordsets[1] || [],
      services: profileResult.recordsets[2] || [],
      addOns: profileResult.recordsets[3] || [],
      portfolio: profileResult.recordsets[4] || [],
      reviews: profileResult.recordsets[5] || [],
      faqs: profileResult.recordsets[6] || [],
      team: profileResult.recordsets[7] || [],
      socialMedia: profileResult.recordsets[8] || [],
      businessHours: profileResult.recordsets[9] || [],
      images: profileResult.recordsets[10] || [],
      isFavorite: profileResult.recordsets[11] ? profileResult.recordsets[11][0]?.IsFavorite || false : false,
      availableSlots: profileResult.recordsets[12] || []
    };

    // Get setup progress information
    const progressRequest = new sql.Request(pool);
    progressRequest.input('VendorProfileID', sql.Int, user.VendorProfileID);

    let setupProgress = {
      SetupStep: 1,
      SetupCompleted: false,
      GalleryCompleted: false,
      PackagesCompleted: false,
      ServicesCompleted: false,
      SocialMediaCompleted: false,
      AvailabilityCompleted: false
    };

    try {
      const progressResult = await progressRequest.execute('sp_GetVendorSetupProgress');
      if (progressResult.recordset.length > 0) {
        setupProgress = progressResult.recordset[0];
      }
    } catch (progressError) {
      console.warn('Setup progress query failed, using defaults:', progressError.message);
    }

    // Return successful response with vendor profile data
    res.json({
      success: true,
      vendorProfileId: user.VendorProfileID,
      data: {
        ...profileData,
        setupProgress: setupProgress,
        user: {
          userId: user.UserID,
          name: user.Name,
          email: user.Email,
          isVendor: user.IsVendor
        }
      }
    });

  } catch (err) {
    console.error('Vendor profile error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get vendor profile',
      error: err.message 
    });
  }
});

module.exports = router;
