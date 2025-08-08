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
    
    // Set only expected input parameters for sp_RegisterVendor
    request.input('UserID', sql.Int, userId ? parseInt(userId) : null);
    request.input('BusinessName', sql.NVarChar(100), businessName);
    request.input('DisplayName', sql.NVarChar(100), displayName || businessName);
    request.input('BusinessDescription', sql.NVarChar(sql.MAX), description);
    request.input('BusinessPhone', sql.NVarChar(20), businessPhone || phone);
    request.input('Website', sql.NVarChar(255), website);
    request.input('YearsInBusiness', sql.Int, yearsInBusiness ? parseInt(yearsInBusiness) : null);
    request.input('Address', sql.NVarChar(255), address);
    
    // Parse address components
    const [city, state] = address ? address.split(',').map(s => s.trim()) : [null, null];
    request.input('City', sql.NVarChar(100), city);
    request.input('State', sql.NVarChar(50), state);
    request.input('Country', sql.NVarChar(50), country || 'USA'); // Default country
    
    request.input('PostalCode', sql.NVarChar(20), postalCode);
    
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

// Complete vendor setup with all features
router.post('/:id/setup', async (req, res) => {
  try {
    const { id } = req.params;
    const { gallery, packages, services, socialMedia, availability } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    // Start transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Save gallery images
      if (gallery && gallery.length > 0) {
        for (const image of gallery) {
          const request = new sql.Request(transaction);
          request.input('VendorProfileID', sql.Int, id);
          request.input('ImageURL', sql.NVarChar(500), image.url);
          request.input('ImageType', sql.NVarChar(10), image.type);
          request.input('Caption', sql.NVarChar(255), image.caption);
          
          await request.query(`
            INSERT INTO VendorGallery (VendorProfileID, ImageURL, ImageType, Caption)
            VALUES (@VendorProfileID, @ImageURL, @ImageType, @Caption)
          `);
        }
      }

      // Save packages
      if (packages && packages.length > 0) {
        for (const pkg of packages) {
          const request = new sql.Request(transaction);
          request.input('VendorProfileID', sql.Int, id);
          request.input('PackageName', sql.NVarChar(255), pkg.name);
          request.input('Description', sql.NVarChar(sql.MAX), pkg.description);
          request.input('Price', sql.Decimal(10, 2), pkg.price);
          request.input('Duration', sql.NVarChar(50), pkg.duration);
          request.input('MaxGuests', sql.Int, pkg.maxGuests);
          
          await request.query(`
            INSERT INTO VendorPackages (VendorProfileID, PackageName, Description, Price, Duration, MaxGuests)
            VALUES (@VendorProfileID, @PackageName, @Description, @Price, @Duration, @MaxGuests)
          `);
        }
      }

      // Save services
      if (services && services.length > 0) {
        for (const service of services) {
          const request = new sql.Request(transaction);
          request.input('VendorProfileID', sql.Int, id);
          request.input('ServiceName', sql.NVarChar(255), service.name);
          request.input('Description', sql.NVarChar(sql.MAX), service.description);
          request.input('Price', sql.Decimal(10, 2), service.price);
          request.input('Duration', sql.NVarChar(50), service.duration);
          
          await request.query(`
            INSERT INTO VendorServices (VendorProfileID, ServiceName, Description, Price, Duration)
            VALUES (@VendorProfileID, @ServiceName, @Description, @Price, @Duration)
          `);
        }
      }

      // Save social media
      if (socialMedia && Object.keys(socialMedia).length > 0) {
        for (const [platform, url] of Object.entries(socialMedia)) {
          const request = new sql.Request(transaction);
          request.input('VendorProfileID', sql.Int, id);
          request.input('Platform', sql.NVarChar(50), platform);
          request.input('URL', sql.NVarChar(500), url);
          
          await request.query(`
            INSERT INTO VendorSocialMedia (VendorProfileID, Platform, URL)
            VALUES (@VendorProfileID, @Platform, @URL)
            ON DUPLICATE KEY UPDATE URL = @URL
          `);
        }
      }

      // Save availability
      if (availability && availability.length > 0) {
        for (const slot of availability) {
          const request = new sql.Request(transaction);
          request.input('VendorProfileID', sql.Int, id);
          request.input('DayOfWeek', sql.TinyInt, slot.day);
          request.input('StartTime', sql.Time, slot.start);
          request.input('EndTime', sql.Time, slot.end);
          
          await request.query(`
            INSERT INTO VendorAvailability (VendorProfileID, DayOfWeek, StartTime, EndTime)
            VALUES (@VendorProfileID, @DayOfWeek, @StartTime, @EndTime)
          `);
        }
      }

      // Update vendor setup completion status
      const statusRequest = new sql.Request(transaction);
      statusRequest.input('VendorProfileID', sql.Int, id);
      
      await statusRequest.query(`
        UPDATE VendorProfiles 
        SET 
          SetupCompleted = 1,
          SetupStep = 4,
          UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID
      `);

      // Commit transaction
      await transaction.commit();

      res.json({
        success: true,
        message: 'Vendor setup completed successfully'
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to complete vendor setup',
      error: err.message 
    });
  }
});

// Get vendor setup progress
router.get('/:id/setup-progress', async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, id);

    const result = await request.query(`
      SELECT 
        SetupStep,
        SetupCompleted,
        (SELECT COUNT(*) FROM VendorGallery WHERE VendorProfileID = @VendorProfileID) as GalleryCount,
        (SELECT COUNT(*) FROM VendorPackages WHERE VendorProfileID = @VendorProfileID) as PackagesCount,
        (SELECT COUNT(*) FROM VendorServices WHERE VendorProfileID = @VendorProfileID) as ServicesCount,
        (SELECT COUNT(*) FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID) as SocialMediaCount,
        (SELECT COUNT(*) FROM VendorAvailability WHERE VendorProfileID = @VendorProfileID) as AvailabilityCount
      FROM VendorProfiles 
      WHERE VendorProfileID = @VendorProfileID
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const progress = result.recordset[0];
    
    res.json({
      success: true,
      data: {
        currentStep: progress.SetupStep || 1,
        completed: progress.SetupCompleted || false,
        progress: {
          gallery: progress.GalleryCount > 0,
          packages: progress.PackagesCount > 0,
          services: progress.ServicesCount > 0,
          socialMedia: progress.SocialMediaCount > 0,
          availability: progress.AvailabilityCount > 0
        }
      }
    });

  } catch (err) {
    console.error('Progress check error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get setup progress',
      error: err.message 
    });
  }
});

// Vendor Setup Endpoints

// Get vendor setup progress
router.get('/:id/setup-progress', async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, id);

    const result = await request.execute('sp_GetVendorSetupProgress');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
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

// Complete vendor setup
router.post('/:id/setup', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      gallery,
      packages,
      services,
      socialMedia,
      availability
    } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, id);
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
        message: response.Message
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
    const { packageName, description, price, duration, maxGuests } = req.body;

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

// Update setup step
router.put('/:id/setup-step', async (req, res) => {
  try {
    const { id } = req.params;
    const { step } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, id);
    request.input('Step', sql.Int, step);

    const result = await request.execute('sp_UpdateVendorSetupStep');
    
    res.json({
      success: true,
      message: 'Setup step updated successfully'
    });

  } catch (err) {
    console.error('Setup step error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update setup step',
      error: err.message 
    });
  }
});

// Get vendor setup data
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

    // Format the response
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

// Enhanced Vendor Setup Endpoints

// Complete vendor setup with all data
router.post('/:id/setup', async (req, res) => {
  try {
    const { id } = req.params;
    const { gallery, packages, services, socialMedia, availability } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    // Start transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Save gallery images
      if (gallery && gallery.length > 0) {
        for (const image of gallery) {
          const request = new sql.Request(transaction);
          request.input('VendorProfileID', sql.Int, id);
          request.input('ImageURL', sql.NVarChar(500), image.url);
          request.input('ImageType', sql.NVarChar(10), image.type);
          request.input('Caption', sql.NVarChar(255), image.caption);
          
          await request.query(`
            INSERT INTO VendorImages (VendorProfileID, ImageURL, Caption, IsPrimary)
            VALUES (@VendorProfileID, @ImageURL, @Caption, 0)
          `);
        }
      }

      // Save packages
      if (packages && packages.length > 0) {
        for (const pkg of packages) {
          const request = new sql.Request(transaction);
          request.input('VendorProfileID', sql.Int, id);
          request.input('PackageName', sql.NVarChar(255), pkg.name);
          request.input('Description', sql.NVarChar(sql.MAX), pkg.description);
          request.input('Price', sql.Decimal(10, 2), pkg.price);
          request.input('Duration', sql.NVarChar(50), pkg.duration);
          request.input('MaxGuests', sql.Int, pkg.maxGuests);
          request.input('Includes', sql.NVarChar(sql.MAX), pkg.includes);
          
          await request.query(`
            INSERT INTO Services (VendorProfileID, ServiceName, ServiceDescription, Price, Duration, ServiceType)
            VALUES (@VendorProfileID, @PackageName, @Description, @Price, @Duration, 'Package')
          `);
        }
      }

      // Save individual services
      if (services && services.length > 0) {
        for (const service of services) {
          const request = new sql.Request(transaction);
          request.input('VendorProfileID', sql.Int, id);
          request.input('ServiceName', sql.NVarChar(255), service.name);
          request.input('Description', sql.NVarChar(sql.MAX), service.description);
          request.input('Price', sql.Decimal(10, 2), service.price);
          request.input('Duration', sql.NVarChar(50), service.duration);
          
          await request.query(`
            INSERT INTO Services (VendorProfileID, ServiceName, ServiceDescription, Price, Duration, ServiceType)
            VALUES (@VendorProfileID, @ServiceName, @Description, @Price, @Duration, 'Service')
          `);
        }
      }

      // Save social media links
      if (socialMedia && Object.keys(socialMedia).length > 0) {
        for (const [platform, url] of Object.entries(socialMedia)) {
          const request = new sql.Request(transaction);
          request.input('VendorProfileID', sql.Int, id);
          request.input('Platform', sql.NVarChar(50), platform);
          request.input('URL', sql.NVarChar(500), url);
          
          await request.query(`
            INSERT INTO VendorSocialMedia (VendorProfileID, Platform, URL)
            VALUES (@VendorProfileID, @Platform, @URL)
            ON DUPLICATE KEY UPDATE URL = @URL
          `);
        }
      }

      // Save availability
      if (availability && availability.length > 0) {
        for (const slot of availability) {
          const request = new sql.Request(transaction);
          request.input('VendorProfileID', sql.Int, id);
          request.input('DayOfWeek', sql.TinyInt, slot.day);
          request.input('OpenTime', sql.Time, slot.start);
          request.input('CloseTime', sql.Time, slot.end);
          request.input('IsAvailable', sql.Bit, 1);
          
          await request.query(`
            INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable)
            VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, @IsAvailable)
            ON DUPLICATE KEY UPDATE OpenTime = @OpenTime, CloseTime = @CloseTime, IsAvailable = @IsAvailable
          `);
        }
      }

      // Mark vendor setup as complete
      const updateRequest = new sql.Request(transaction);
      updateRequest.input('VendorProfileID', sql.Int, id);
      await updateRequest.query(`
        UPDATE VendorProfiles 
        SET IsVerified = 1, UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID
      `);

      // Commit transaction
      await transaction.commit();

      res.json({
        success: true,
        message: 'Vendor setup completed successfully'
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Vendor setup error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to complete vendor setup',
      error: err.message 
    });
  }
});

// Add gallery image endpoint
router.post('/gallery', async (req, res) => {
  try {
    const { vendor_id, image_url, image_type, caption } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendor_id);
    request.input('ImageURL', sql.NVarChar(500), image_url);
    request.input('Caption', sql.NVarChar(255), caption);
    
    await request.query(`
      INSERT INTO VendorImages (VendorProfileID, ImageURL, Caption, IsPrimary)
      VALUES (@VendorProfileID, @ImageURL, @Caption, 0)
    `);

    res.json({
      success: true,
      message: 'Gallery image added successfully'
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

// Add package endpoint
router.post('/packages', async (req, res) => {
  try {
    const { vendor_id, package_name, description, price, duration, includes, max_guests } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendor_id);
    request.input('ServiceName', sql.NVarChar(255), package_name);
    request.input('ServiceDescription', sql.NVarChar(sql.MAX), description);
    request.input('Price', sql.Decimal(10, 2), price);
    request.input('Duration', sql.NVarChar(50), duration);
    
    await request.query(`
      INSERT INTO Services (VendorProfileID, ServiceName, ServiceDescription, Price, Duration, ServiceType)
      VALUES (@VendorProfileID, @ServiceName, @ServiceDescription, @Price, @Duration, 'Package')
    `);

    res.json({
      success: true,
      message: 'Package added successfully'
    });

  } catch (err) {
    console.error('Package creation error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add package',
      error: err.message 
    });
  }
});

// Add service endpoint
router.post('/services', async (req, res) => {
  try {
    const { vendor_id, service_name, description, price, duration, category } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendor_id);
    request.input('ServiceName', sql.NVarChar(255), service_name);
    request.input('ServiceDescription', sql.NVarChar(sql.MAX), description);
    request.input('Price', sql.Decimal(10, 2), price);
    request.input('Duration', sql.NVarChar(50), duration);
    
    await request.query(`
      INSERT INTO Services (VendorProfileID, ServiceName, ServiceDescription, Price, Duration, ServiceType)
      VALUES (@VendorProfileID, @ServiceName, @ServiceDescription, @Price, @Duration, 'Service')
    `);

    res.json({
      success: true,
      message: 'Service added successfully'
    });

  } catch (err) {
    console.error('Service creation error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add service',
      error: err.message 
    });
  }
});

// Add social media endpoint
router.post('/social-media', async (req, res) => {
  try {
    const { vendor_id, platform, url } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendor_id);
    request.input('Platform', sql.NVarChar(50), platform);
    request.input('URL', sql.NVarChar(500), url);
    
    await request.query(`
      INSERT INTO VendorSocialMedia (VendorProfileID, Platform, URL)
      VALUES (@VendorProfileID, @Platform, @URL)
      ON DUPLICATE KEY UPDATE URL = @URL
    `);

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

// Add availability endpoint
router.post('/availability', async (req, res) => {
  try {
    const { vendor_id, day_of_week, start_time, end_time } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendor_id);
    request.input('DayOfWeek', sql.TinyInt, day_of_week);
    request.input('OpenTime', sql.Time, start_time);
    request.input('CloseTime', sql.Time, end_time);
    request.input('IsAvailable', sql.Bit, 1);
    
    await request.query(`
      INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable)
      VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, @IsAvailable)
      ON DUPLICATE KEY UPDATE OpenTime = @OpenTime, CloseTime = @CloseTime, IsAvailable = @IsAvailable
    `);

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

module.exports = router;
