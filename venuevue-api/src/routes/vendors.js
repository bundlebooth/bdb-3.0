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

// Get current vendor's profile information - FIXED VERSION
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
      console.log(`User ${userIdNum} does not have a vendor profile. Creating one...`);
      
      // Create a basic vendor profile for the user
      const createProfileRequest = new sql.Request(pool);
      createProfileRequest.input('UserID', sql.Int, userIdNum);
      createProfileRequest.input('BusinessName', sql.NVarChar(100), user.Name + "'s Business");
      createProfileRequest.input('DisplayName', sql.NVarChar(100), user.Name);
      createProfileRequest.input('BusinessDescription', sql.NVarChar(sql.MAX), 'Welcome to our business!');
      createProfileRequest.input('BusinessPhone', sql.NVarChar(20), null);
      createProfileRequest.input('Website', sql.NVarChar(255), null);
      createProfileRequest.input('YearsInBusiness', sql.Int, 1);
      createProfileRequest.input('Address', sql.NVarChar(255), null);
      createProfileRequest.input('City', sql.NVarChar(100), null);
      createProfileRequest.input('State', sql.NVarChar(50), null);
      createProfileRequest.input('Country', sql.NVarChar(50), 'USA');
      createProfileRequest.input('PostalCode', sql.NVarChar(20), null);
      createProfileRequest.input('Categories', sql.NVarChar(sql.MAX), JSON.stringify(['general']));
      createProfileRequest.input('Services', sql.NVarChar(sql.MAX), JSON.stringify([]));

      try {
        const createResult = await createProfileRequest.execute('sp_RegisterVendor');
        
        if (createResult.recordset[0].Success) {
          const newVendorProfileId = createResult.recordset[0].VendorProfileID;
          console.log(`Created vendor profile ID: ${newVendorProfileId} for user ${userIdNum}`);
          
          // Return the new vendor profile ID for setup
          return res.json({
            success: true,
            vendorProfileId: newVendorProfileId,
            isNewProfile: true,
            message: 'Vendor profile created successfully. Please complete your setup.'
          });
        } else {
          throw new Error('Failed to create vendor profile');
        }
      } catch (createError) {
        console.error('Error creating vendor profile:', createError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create vendor profile',
          error: createError.message
        });
      }
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

// Get vendor details by ID
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

// ============================================
// COMPREHENSIVE VENDOR SETUP ENDPOINTS
// ============================================

// Step 1: Business Basics
router.post('/setup/step1-business-basics', async (req, res) => {
  try {
    const {
      vendorProfileId,
      businessName,
      displayName,
      businessEmail,
      businessPhone,
      website,
      businessDescription,
      tagline,
      yearsInBusiness,
      primaryCategory,
      additionalCategories
    } = req.body;

    // Validation
    if (!vendorProfileId || !businessName || !businessEmail || !businessPhone || !businessDescription || !primaryCategory) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: businessName, businessEmail, businessPhone, businessDescription, primaryCategory'
      });
    }

    const pool = await poolPromise;
    
    // Update vendor profile with business basics
    const updateRequest = new sql.Request(pool);
    updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    updateRequest.input('BusinessName', sql.NVarChar, businessName);
    updateRequest.input('DisplayName', sql.NVarChar, displayName || businessName);
    updateRequest.input('BusinessEmail', sql.NVarChar, businessEmail);
    updateRequest.input('BusinessPhone', sql.NVarChar, businessPhone);
    updateRequest.input('Website', sql.NVarChar, website || null);
    updateRequest.input('BusinessDescription', sql.NVarChar, businessDescription);
    updateRequest.input('Tagline', sql.NVarChar, tagline || null);
    updateRequest.input('YearsInBusiness', sql.Int, yearsInBusiness || null);
    
    await updateRequest.query(`
      UPDATE VendorProfiles 
      SET BusinessName = @BusinessName, DisplayName = @DisplayName, 
          BusinessEmail = @BusinessEmail, BusinessPhone = @BusinessPhone,
          Website = @Website, BusinessDescription = @BusinessDescription,
          Tagline = @Tagline, YearsInBusiness = @YearsInBusiness,
          UpdatedAt = GETDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    
    // Handle categories
    // Delete existing categories
    await updateRequest.query(`
      DELETE FROM VendorCategories WHERE VendorProfileID = @VendorProfileID
    `);
    
    // Insert primary category
    const primaryCatRequest = new sql.Request(pool);
    primaryCatRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    primaryCatRequest.input('Category', sql.NVarChar, primaryCategory);
    await primaryCatRequest.query(`
      INSERT INTO VendorCategories (VendorProfileID, Category)
      VALUES (@VendorProfileID, @Category)
    `);
    
    // Insert additional categories
    if (additionalCategories && additionalCategories.length > 0) {
      for (const category of additionalCategories) {
        const catRequest = new sql.Request(pool);
        catRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        catRequest.input('Category', sql.NVarChar, category);
        await catRequest.query(`
          INSERT INTO VendorCategories (VendorProfileID, Category)
          VALUES (@VendorProfileID, @Category)
        `);
      }
    }
    
    res.json({
      success: true,
      message: 'Business basics saved successfully',
      step: 1,
      nextStep: 2
    });
    
  } catch (err) {
    console.error('Step 1 setup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save business basics',
      error: err.message
    });
  }
});

// Step 2: Location Information
router.post('/setup/step2-location', async (req, res) => {
  try {
    const {
      vendorProfileId,
      address,
      city,
      state,
      country,
      postalCode,
      latitude,
      longitude,
      serviceAreas,
      serviceRadius,
      additionalFees
    } = req.body;

    // Validation
    if (!vendorProfileId || !address || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: address, city, state, postalCode'
      });
    }

    const pool = await poolPromise;
    
    // Update vendor profile with location
    const updateRequest = new sql.Request(pool);
    updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    updateRequest.input('Address', sql.NVarChar, address);
    updateRequest.input('City', sql.NVarChar, city);
    updateRequest.input('State', sql.NVarChar, state);
    updateRequest.input('Country', sql.NVarChar, country || 'USA');
    updateRequest.input('PostalCode', sql.NVarChar, postalCode);
    updateRequest.input('Latitude', sql.Decimal(10, 8), latitude || null);
    updateRequest.input('Longitude', sql.Decimal(11, 8), longitude || null);
    
    await updateRequest.query(`
      UPDATE VendorProfiles 
      SET Address = @Address, City = @City, State = @State, 
          Country = @Country, PostalCode = @PostalCode,
          Latitude = @Latitude, Longitude = @Longitude,
          UpdatedAt = GETDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    
    // Handle service areas
    if (serviceAreas && serviceAreas.length > 0) {
      // Delete existing service areas
      await updateRequest.query(`
        DELETE FROM VendorServiceAreas WHERE VendorProfileID = @VendorProfileID
      `);
      
      // Insert new service areas
      for (const area of serviceAreas) {
        const areaRequest = new sql.Request(pool);
        areaRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        areaRequest.input('City', sql.NVarChar, area.city);
        areaRequest.input('State', sql.NVarChar, area.state || state);
        areaRequest.input('Country', sql.NVarChar, area.country || country || 'USA');
        areaRequest.input('RadiusMiles', sql.Int, serviceRadius || 25);
        areaRequest.input('AdditionalFee', sql.Decimal(10, 2), area.additionalFee || 0);
        
        await areaRequest.query(`
          INSERT INTO VendorServiceAreas (VendorProfileID, City, State, Country, RadiusMiles, AdditionalFee)
          VALUES (@VendorProfileID, @City, @State, @Country, @RadiusMiles, @AdditionalFee)
        `);
      }
    }
    
    res.json({
      success: true,
      message: 'Location information saved successfully',
      step: 2,
      nextStep: 3
    });
    
  } catch (err) {
    console.error('Step 2 setup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save location information',
      error: err.message
    });
  }
});

// Step 3: Gallery & Media
router.post('/setup/step3-gallery', async (req, res) => {
  try {
    const {
      vendorProfileId,
      featuredImage,
      galleryImages,
      portfolioItems
    } = req.body;

    // Validation
    if (!vendorProfileId || !featuredImage) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: featuredImage'
      });
    }

    const pool = await poolPromise;
    
    // Update featured image
    const updateRequest = new sql.Request(pool);
    updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    updateRequest.input('FeaturedImageURL', sql.NVarChar, featuredImage);
    
    await updateRequest.query(`
      UPDATE VendorProfiles 
      SET FeaturedImageURL = @FeaturedImageURL, UpdatedAt = GETDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    
    // Handle gallery images
    if (galleryImages && galleryImages.length > 0) {
      // Delete existing images
      await updateRequest.query(`
        DELETE FROM VendorImages WHERE VendorProfileID = @VendorProfileID
      `);
      
      // Insert new images
      for (let i = 0; i < galleryImages.length; i++) {
        const imageRequest = new sql.Request(pool);
        imageRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        imageRequest.input('ImageURL', sql.NVarChar, galleryImages[i].url);
        imageRequest.input('IsPrimary', sql.Bit, i === 0);
        imageRequest.input('DisplayOrder', sql.Int, i);
        imageRequest.input('Caption', sql.NVarChar, galleryImages[i].caption || null);
        
        await imageRequest.query(`
          INSERT INTO VendorImages (VendorProfileID, ImageURL, IsPrimary, DisplayOrder, Caption)
          VALUES (@VendorProfileID, @ImageURL, @IsPrimary, @DisplayOrder, @Caption)
        `);
      }
    }
    
    // Handle portfolio items
    if (portfolioItems && portfolioItems.length > 0) {
      // Delete existing portfolio
      await updateRequest.query(`
        DELETE FROM VendorPortfolio WHERE VendorProfileID = @VendorProfileID
      `);
      
      // Insert new portfolio items
      for (let i = 0; i < portfolioItems.length; i++) {
        const portfolioRequest = new sql.Request(pool);
        portfolioRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        portfolioRequest.input('Title', sql.NVarChar, portfolioItems[i].title);
        portfolioRequest.input('Description', sql.NVarChar, portfolioItems[i].description || null);
        portfolioRequest.input('ImageURL', sql.NVarChar, portfolioItems[i].imageUrl);
        portfolioRequest.input('ProjectDate', sql.Date, portfolioItems[i].projectDate || null);
        portfolioRequest.input('DisplayOrder', sql.Int, i);
        
        await portfolioRequest.query(`
          INSERT INTO VendorPortfolio (VendorProfileID, Title, Description, ImageURL, ProjectDate, DisplayOrder)
          VALUES (@VendorProfileID, @Title, @Description, @ImageURL, @ProjectDate, @DisplayOrder)
        `);
      }
    }
    
    res.json({
      success: true,
      message: 'Gallery and media saved successfully',
      step: 3,
      nextStep: 4
    });
    
  } catch (err) {
    console.error('Step 3 setup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save gallery and media',
      error: err.message
    });
  }
});

// Step 4: Services & Packages
router.post('/setup/step4-services', async (req, res) => {
  try {
    const {
      vendorProfileId,
      serviceCategories,
      services,
      packages
    } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile ID is required'
      });
    }

    const pool = await poolPromise;
    
    // Handle service categories
    if (serviceCategories && serviceCategories.length > 0) {
      // Delete existing categories
      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteRequest.query(`
        DELETE FROM ServiceCategories WHERE VendorProfileID = @VendorProfileID
      `);
      
      // Insert new categories
      for (let i = 0; i < serviceCategories.length; i++) {
        const catRequest = new sql.Request(pool);
        catRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        catRequest.input('Name', sql.NVarChar, serviceCategories[i].name);
        catRequest.input('Description', sql.NVarChar, serviceCategories[i].description || null);
        catRequest.input('DisplayOrder', sql.Int, i);
        
        await catRequest.query(`
          INSERT INTO ServiceCategories (VendorProfileID, Name, Description, DisplayOrder)
          VALUES (@VendorProfileID, @Name, @Description, @DisplayOrder)
        `);
      }
    }
    
    // Handle services
    if (services && services.length > 0) {
      for (const service of services) {
        // Get category ID if specified
        let categoryId = null;
        if (service.categoryName) {
          const catRequest = new sql.Request(pool);
          catRequest.input('VendorProfileID', sql.Int, vendorProfileId);
          catRequest.input('CategoryName', sql.NVarChar, service.categoryName);
          const catResult = await catRequest.query(`
            SELECT CategoryID FROM ServiceCategories 
            WHERE VendorProfileID = @VendorProfileID AND Name = @CategoryName
          `);
          if (catResult.recordset.length > 0) {
            categoryId = catResult.recordset[0].CategoryID;
          }
        }
        
        const serviceRequest = new sql.Request(pool);
        serviceRequest.input('CategoryID', sql.Int, categoryId);
        serviceRequest.input('Name', sql.NVarChar, service.name);
        serviceRequest.input('Description', sql.NVarChar, service.description);
        serviceRequest.input('Price', sql.Decimal(10, 2), service.price);
        serviceRequest.input('DurationMinutes', sql.Int, service.durationMinutes || null);
        serviceRequest.input('MaxAttendees', sql.Int, service.maxAttendees || null);
        serviceRequest.input('DepositPercentage', sql.Decimal(5, 2), service.depositPercentage || 20);
        serviceRequest.input('CancellationPolicy', sql.NVarChar, service.cancellationPolicy || null);
        
        await serviceRequest.query(`
          INSERT INTO Services (CategoryID, Name, Description, Price, DurationMinutes, MaxAttendees, DepositPercentage, CancellationPolicy)
          VALUES (@CategoryID, @Name, @Description, @Price, @DurationMinutes, @MaxAttendees, @DepositPercentage, @CancellationPolicy)
        `);
      }
    }
    
    // Handle packages
    if (packages && packages.length > 0) {
      for (const pkg of packages) {
        const packageRequest = new sql.Request(pool);
        packageRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        packageRequest.input('Name', sql.NVarChar, pkg.name);
        packageRequest.input('Description', sql.NVarChar, pkg.description);
        packageRequest.input('Price', sql.Decimal(10, 2), pkg.price);
        packageRequest.input('DurationMinutes', sql.Int, pkg.durationMinutes || null);
        packageRequest.input('MaxGuests', sql.Int, pkg.maxGuests || null);
        packageRequest.input('WhatsIncluded', sql.NVarChar, pkg.whatsIncluded || null);
        
        await packageRequest.query(`
          INSERT INTO Packages (VendorProfileID, Name, Description, Price, DurationMinutes, MaxGuests, WhatsIncluded)
          VALUES (@VendorProfileID, @Name, @Description, @Price, @DurationMinutes, @MaxGuests, @WhatsIncluded)
        `);
      }
    }
    
    res.json({
      success: true,
      message: 'Services and packages saved successfully',
      step: 4,
      nextStep: 5
    });
    
  } catch (err) {
    console.error('Step 4 setup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save services and packages',
      error: err.message
    });
  }
});

// Step 5: Team Information (Optional)
router.post('/setup/step5-team', async (req, res) => {
  try {
    const { vendorProfileId, teamMembers } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile ID is required'
      });
    }

    const pool = await poolPromise;
    
    // Handle team members
    if (teamMembers && teamMembers.length > 0) {
      // Delete existing team members
      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteRequest.query(`
        DELETE FROM VendorTeam WHERE VendorProfileID = @VendorProfileID
      `);
      
      // Insert new team members
      for (let i = 0; i < teamMembers.length; i++) {
        const teamRequest = new sql.Request(pool);
        teamRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        teamRequest.input('Name', sql.NVarChar, teamMembers[i].name);
        teamRequest.input('Role', sql.NVarChar, teamMembers[i].role || null);
        teamRequest.input('Bio', sql.NVarChar, teamMembers[i].bio || null);
        teamRequest.input('ImageURL', sql.NVarChar, teamMembers[i].imageUrl || null);
        teamRequest.input('DisplayOrder', sql.Int, i);
        
        await teamRequest.query(`
          INSERT INTO VendorTeam (VendorProfileID, Name, Role, Bio, ImageURL, DisplayOrder)
          VALUES (@VendorProfileID, @Name, @Role, @Bio, @ImageURL, @DisplayOrder)
        `);
      }
    }
    
    res.json({
      success: true,
      message: 'Team information saved successfully',
      step: 5,
      nextStep: 6
    });
    
  } catch (err) {
    console.error('Step 5 setup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save team information',
      error: err.message
    });
  }
});

// Step 6: Social Media & Links
router.post('/setup/step6-social', async (req, res) => {
  try {
    const {
      vendorProfileId,
      socialMediaProfiles,
      bookingLink,
      externalLinks
    } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile ID is required'
      });
    }

    const pool = await poolPromise;
    
    // Update booking link
    if (bookingLink) {
      const updateRequest = new sql.Request(pool);
      updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      updateRequest.input('BookingLink', sql.NVarChar, bookingLink);
      
      await updateRequest.query(`
        UPDATE VendorProfiles 
        SET BookingLink = @BookingLink, UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID
      `);
    }
    
    // Handle social media profiles
    if (socialMediaProfiles && socialMediaProfiles.length > 0) {
      // Delete existing social media
      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteRequest.query(`
        DELETE FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID
      `);
      
      // Insert new social media links
      for (let i = 0; i < socialMediaProfiles.length; i++) {
        const socialRequest = new sql.Request(pool);
        socialRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        socialRequest.input('Platform', sql.NVarChar, socialMediaProfiles[i].platform);
        socialRequest.input('URL', sql.NVarChar, socialMediaProfiles[i].url);
        socialRequest.input('DisplayOrder', sql.Int, i);
        
        await socialRequest.query(`
          INSERT INTO VendorSocialMedia (VendorProfileID, Platform, URL, DisplayOrder)
          VALUES (@VendorProfileID, @Platform, @URL, @DisplayOrder)
        `);
      }
    }
    
    res.json({
      success: true,
      message: 'Social media and links saved successfully',
      step: 6,
      nextStep: 7
    });
    
  } catch (err) {
    console.error('Step 6 setup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save social media and links',
      error: err.message
    });
  }
});

// Step 7: Availability & Scheduling
router.post('/setup/step7-availability', async (req, res) => {
  try {
    const {
      vendorProfileId,
      businessHours,
      availabilityExceptions,
      acceptingBookings,
      responseTimeExpectation,
      bufferTime
    } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile ID is required'
      });
    }

    const pool = await poolPromise;
    
    // Update booking settings
    const updateRequest = new sql.Request(pool);
    updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    updateRequest.input('AcceptingBookings', sql.Bit, acceptingBookings || false);
    updateRequest.input('AverageResponseTime', sql.Int, responseTimeExpectation || 24);
    
    await updateRequest.query(`
      UPDATE VendorProfiles 
      SET AcceptingBookings = @AcceptingBookings, 
          AverageResponseTime = @AverageResponseTime,
          UpdatedAt = GETDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    
    // Handle business hours
    if (businessHours && businessHours.length > 0) {
      // Delete existing business hours
      await updateRequest.query(`
        DELETE FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID
      `);
      
      // Insert new business hours
      for (const hours of businessHours) {
        const hoursRequest = new sql.Request(pool);
        hoursRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        hoursRequest.input('DayOfWeek', sql.TinyInt, hours.dayOfWeek);
        hoursRequest.input('OpenTime', sql.Time, hours.openTime || null);
        hoursRequest.input('CloseTime', sql.Time, hours.closeTime || null);
        hoursRequest.input('IsAvailable', sql.Bit, hours.isAvailable || false);
        
        await hoursRequest.query(`
          INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable)
          VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, @IsAvailable)
        `);
      }
    }
    
    // Handle availability exceptions
    if (availabilityExceptions && availabilityExceptions.length > 0) {
      for (const exception of availabilityExceptions) {
        const exceptionRequest = new sql.Request(pool);
        exceptionRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        exceptionRequest.input('StartDate', sql.Date, exception.startDate);
        exceptionRequest.input('EndDate', sql.Date, exception.endDate);
        exceptionRequest.input('StartTime', sql.Time, exception.startTime || null);
        exceptionRequest.input('EndTime', sql.Time, exception.endTime || null);
        exceptionRequest.input('IsAvailable', sql.Bit, exception.isAvailable);
        exceptionRequest.input('Reason', sql.NVarChar, exception.reason || null);
        
        await exceptionRequest.query(`
          INSERT INTO VendorAvailabilityExceptions (VendorProfileID, StartDate, EndDate, StartTime, EndTime, IsAvailable, Reason)
          VALUES (@VendorProfileID, @StartDate, @EndDate, @StartTime, @EndTime, @IsAvailable, @Reason)
        `);
      }
    }
    
    res.json({
      success: true,
      message: 'Availability and scheduling saved successfully',
      step: 7,
      nextStep: 8
    });
    
  } catch (err) {
    console.error('Step 7 setup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save availability and scheduling',
      error: err.message
    });
  }
});

// Step 8: Policies & Preferences
router.post('/setup/step8-policies', async (req, res) => {
  try {
    const {
      vendorProfileId,
      depositRequirements,
      cancellationPolicy,
      reschedulingPolicy,
      paymentMethods,
      paymentTerms
    } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile ID is required'
      });
    }

    const pool = await poolPromise;
    
    // Update policies in vendor profile
    const updateRequest = new sql.Request(pool);
    updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    updateRequest.input('DepositRequirements', sql.NVarChar, JSON.stringify(depositRequirements) || null);
    updateRequest.input('CancellationPolicy', sql.NVarChar, cancellationPolicy || null);
    updateRequest.input('ReschedulingPolicy', sql.NVarChar, reschedulingPolicy || null);
    updateRequest.input('PaymentMethods', sql.NVarChar, JSON.stringify(paymentMethods) || null);
    updateRequest.input('PaymentTerms', sql.NVarChar, paymentTerms || null);
    
    await updateRequest.query(`
      UPDATE VendorProfiles 
      SET DepositRequirements = @DepositRequirements,
          CancellationPolicy = @CancellationPolicy,
          ReschedulingPolicy = @ReschedulingPolicy,
          PaymentMethods = @PaymentMethods,
          PaymentTerms = @PaymentTerms,
          UpdatedAt = GETDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    
    res.json({
      success: true,
      message: 'Policies and preferences saved successfully',
      step: 8,
      nextStep: 9
    });
    
  } catch (err) {
    console.error('Step 8 setup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save policies and preferences',
      error: err.message
    });
  }
});

// Step 9: Verification & Legal
router.post('/setup/step9-verification', async (req, res) => {
  try {
    const {
      vendorProfileId,
      licenseNumber,
      insuranceVerified,
      awards,
      certifications,
      isEcoFriendly,
      isPremium
    } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile ID is required'
      });
    }

    const pool = await poolPromise;
    
    // Update verification info
    const updateRequest = new sql.Request(pool);
    updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    updateRequest.input('LicenseNumber', sql.NVarChar, licenseNumber || null);
    updateRequest.input('InsuranceVerified', sql.Bit, insuranceVerified || false);
    updateRequest.input('Awards', sql.NVarChar, JSON.stringify(awards) || null);
    updateRequest.input('Certifications', sql.NVarChar, JSON.stringify(certifications) || null);
    updateRequest.input('IsEcoFriendly', sql.Bit, isEcoFriendly || false);
    updateRequest.input('IsPremium', sql.Bit, isPremium || false);
    
    await updateRequest.query(`
      UPDATE VendorProfiles 
      SET LicenseNumber = @LicenseNumber,
          InsuranceVerified = @InsuranceVerified,
          Awards = @Awards,
          Certifications = @Certifications,
          IsEcoFriendly = @IsEcoFriendly,
          IsPremium = @IsPremium,
          UpdatedAt = GETDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    
    res.json({
      success: true,
      message: 'Verification and legal information saved successfully',
      step: 9,
      nextStep: 10
    });
    
  } catch (err) {
    console.error('Step 9 setup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save verification and legal information',
      error: err.message
    });
  }
});

// Step 10: Setup Completion & Optional Info
router.post('/setup/step10-completion', async (req, res) => {
  try {
    const {
      vendorProfileId,
      faqs,
      testimonials
    } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile ID is required'
      });
    }

    const pool = await poolPromise;
    
    // Handle FAQs
    if (faqs && faqs.length > 0) {
      // Delete existing FAQs
      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteRequest.query(`
        DELETE FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID
      `);
      
      // Insert new FAQs
      for (let i = 0; i < faqs.length; i++) {
        const faqRequest = new sql.Request(pool);
        faqRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        faqRequest.input('Question', sql.NVarChar, faqs[i].question);
        faqRequest.input('Answer', sql.NVarChar, faqs[i].answer);
        faqRequest.input('DisplayOrder', sql.Int, i);
        
        await faqRequest.query(`
          INSERT INTO VendorFAQs (VendorProfileID, Question, Answer, DisplayOrder)
          VALUES (@VendorProfileID, @Question, @Answer, @DisplayOrder)
        `);
      }
    }
    
    // Mark setup as completed
    const updateRequest = new sql.Request(pool);
    updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    
    await updateRequest.query(`
      UPDATE VendorProfiles 
      SET IsCompleted = 1, UpdatedAt = GETDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    
    res.json({
      success: true,
      message: 'Vendor setup completed successfully! Your profile is now live.',
      step: 10,
      completed: true
    });
    
  } catch (err) {
    console.error('Step 10 setup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to complete vendor setup',
      error: err.message
    });
  }
});

// Get vendor setup progress
router.get('/setup/progress/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.query(`
      SELECT 
        v.IsCompleted,
        v.BusinessName,
        v.BusinessEmail,
        v.BusinessPhone,
        v.Address,
        v.FeaturedImageURL,
        v.AcceptingBookings,
        (SELECT COUNT(*) FROM VendorCategories WHERE VendorProfileID = @VendorProfileID) as CategoriesCount,
        (SELECT COUNT(*) FROM VendorImages WHERE VendorProfileID = @VendorProfileID) as ImagesCount,
        (SELECT COUNT(*) FROM Services WHERE CategoryID IN (SELECT CategoryID FROM ServiceCategories WHERE VendorProfileID = @VendorProfileID)) as ServicesCount,
        (SELECT COUNT(*) FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID) as SocialMediaCount,
        (SELECT COUNT(*) FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID) as BusinessHoursCount
      FROM VendorProfiles v
      WHERE v.VendorProfileID = @VendorProfileID
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }
    
    const profile = result.recordset[0];
    
    // Calculate completion progress
    const steps = {
      step1: !!(profile.BusinessName && profile.BusinessEmail && profile.BusinessPhone && profile.CategoriesCount > 0),
      step2: !!(profile.Address),
      step3: !!(profile.FeaturedImageURL),
      step4: !!(profile.ServicesCount > 0),
      step5: true, // Optional step
      step6: !!(profile.SocialMediaCount > 0),
      step7: !!(profile.BusinessHoursCount > 0),
      step8: true, // Policies are optional initially
      step9: true, // Verification is optional initially
      step10: profile.IsCompleted
    };
    
    const completedSteps = Object.values(steps).filter(Boolean).length;
    const totalSteps = Object.keys(steps).length;
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);
    
    res.json({
      success: true,
      progress: {
        currentStep: profile.IsCompleted ? 10 : completedSteps + 1,
        completedSteps,
        totalSteps,
        progressPercentage,
        isCompleted: profile.IsCompleted,
        steps
      }
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

// Complete vendor setup with all data - ENHANCED VERSION
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

    console.log('Setup request received:', { vendorProfileId, hasGallery: !!gallery, hasPackages: !!packages, hasServices: !!services });

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

module.exports = router;
