const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');
const { upload } = require('../middlewares/uploadMiddleware');
const cloudinaryService = require('../services/cloudinaryService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

// Helper function to convert time string to 24-hour format for database comparison
function convertTo24Hour(timeString) {
  if (!timeString) return null;
  try {
    const timeRegex = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i;
    const match = timeString.trim().match(timeRegex);
    if (!match) {
      const directMatch = timeString.match(/^(\d{1,2}):(\d{2})$/);
      if (directMatch) {
        const hours = parseInt(directMatch[1]);
        const minutes = parseInt(directMatch[2]);
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        }
      }
      return null;
    }
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3] ? match[3].toUpperCase() : null;
    if (period) {
      if (period === 'PM' && hours !== 12) hours += 12;
      else if (period === 'AM' && hours === 12) hours = 0;
    }
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  } catch (error) {
    console.warn('Error converting time string:', timeString, error.message);
    return null;
  }
}

// (removed erroneous debug step route)
// Stripe/setup helpers (top-level)
function isStripeConfigured() {
  try {
    const sk = process.env.STRIPE_SECRET_KEY || '';
    return !!sk && !sk.includes('placeholder');
  } catch (e) { return false; }
}

async function getStripeStatusByVendorProfileId(pool, vendorProfileId) {
  try {
    const req = new sql.Request(pool);
    req.input('VendorProfileID', sql.Int, vendorProfileId);
    const r = await req.query('SELECT StripeAccountID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID');
    const acct = r.recordset[0]?.StripeAccountID || null;
    if (!acct) return { connected: false, chargesEnabled: false, payoutsEnabled: false, accountId: null };
    if (!isStripeConfigured()) return { connected: true, chargesEnabled: false, payoutsEnabled: false, accountId: acct };
    try {
      const a = await stripe.accounts.retrieve(acct);
      return { connected: true, chargesEnabled: !!a.charges_enabled, payoutsEnabled: !!a.payouts_enabled, accountId: acct };
    } catch {
      return { connected: true, chargesEnabled: false, payoutsEnabled: false, accountId: acct };
    }
  } catch {
    return { connected: false, chargesEnabled: false, payoutsEnabled: false, accountId: null };
  }
}

async function computeVendorSetupStatusByVendorProfileId(pool, vendorProfileId) {
  const profReq = new sql.Request(pool);
  profReq.input('VendorProfileID', sql.Int, vendorProfileId);
  const profRes = await profReq.query(`
    SELECT VendorProfileID, BusinessName, BusinessEmail, BusinessPhone, Address, FeaturedImageURL,
           PaymentMethods, PaymentTerms, LicenseNumber, InsuranceVerified, IsCompleted, AcceptingBookings
    FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID`);
  if (!profRes.recordset.length) return { exists: false, error: 'Vendor profile not found' };
  const p = profRes.recordset[0];
  const countsRes = await new sql.Request(pool)
    .input('VendorProfileID', sql.Int, vendorProfileId)
    .query(`SELECT
      (SELECT COUNT(*) FROM VendorCategories WHERE VendorProfileID = @VendorProfileID) AS CategoriesCount,
      (SELECT COUNT(*) FROM VendorImages WHERE VendorProfileID = @VendorProfileID) AS ImagesCount,
      (SELECT COUNT(*) FROM Services s JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID WHERE sc.VendorProfileID=@VendorProfileID AND s.IsActive=1) AS ServicesCount,
      (SELECT COUNT(*) FROM Packages WHERE VendorProfileID = @VendorProfileID) AS PackageCount,
      (SELECT COUNT(*) FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID AND (IsActive = 1 OR IsActive IS NULL)) AS FAQCount,
      (SELECT COUNT(*) FROM VendorCategoryAnswers WHERE VendorProfileID = @VendorProfileID) AS CategoryAnswerCount,
      (SELECT COUNT(*) FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID) AS SocialCount,
      (SELECT COUNT(*) FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID AND IsAvailable = 1) AS HoursCount,
      (SELECT COUNT(*) FROM VendorServiceAreas WHERE VendorProfileID = @VendorProfileID AND IsActive = 1) AS ServiceAreaCount`);
  const c = countsRes.recordset[0] || {};
  const stripeStatus = await getStripeStatusByVendorProfileId(pool, vendorProfileId);
  const steps = {
    basics: !!(p.BusinessName && p.BusinessEmail && p.BusinessPhone && (c.CategoriesCount||0) > 0),
    location: !!p.Address && (c.ServiceAreaCount || 0) > 0,
    additionalDetails: (c.CategoryAnswerCount || 0) > 0,
    social: (c.SocialCount || 0) > 0,
    servicesPackages: ((c.ServicesCount || 0) > 0) || ((c.PackageCount || 0) > 0),
    faq: (c.FAQCount || 0) > 0,
    gallery: !!p.FeaturedImageURL || (c.ImagesCount || 0) > 0,
    availability: (c.HoursCount || 0) > 0,
    verification: !!(p.InsuranceVerified || p.LicenseNumber),
    policies: !!(p.PaymentMethods && p.PaymentTerms),
    stripe: (stripeStatus.connected && stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled)
  };
  const labels = {
    basics: 'Business Basics',
    location: 'Location Information',
    additionalDetails: 'Additional Details',
    social: 'Social Media',
    servicesPackages: 'Services & Packages',
    faq: 'FAQ Section',
    gallery: 'Gallery & Media',
    availability: 'Availability & Scheduling',
    verification: 'Verification & legal',
    policies: 'Policies',
    stripe: 'Stripe payouts'
  };
  const requiredOrder = ['basics','location','additionalDetails','social','servicesPackages','faq','gallery','availability','verification','stripe'];
  const incompleteSteps = requiredOrder.filter(k => !steps[k]).map(k => ({ key: k, label: labels[k] }));
  return { exists: true, vendorProfileId, steps, incompleteSteps, stripe: stripeStatus, allRequiredComplete: incompleteSteps.length === 0 };
}

// Mark vendor setup step as completed (best-effort)
async function markSetupStep(pool, vendorProfileId, stepNumber) {
  try {
    const sReq = new sql.Request(pool);
    sReq.input('VendorProfileID', sql.Int, parseInt(vendorProfileId));
    sReq.input('StepNumber', sql.Int, parseInt(stepNumber));
    await sReq.execute('sp_UpdateVendorSetupStep');
  } catch (e) {
    console.warn('sp_UpdateVendorSetupStep failed:', e?.message || e);
  }
}

// Helper function to resolve UserID to VendorProfileID
async function resolveVendorProfileId(id, pool) {
  const idNum = parseInt(id);
  if (isNaN(idNum) || idNum <= 0) {
    throw new Error('Invalid ID format. Must be a positive number.');
  }

  // First, try as direct VendorProfileID (prioritize this over UserID lookup)
  const vendorCheckRequest = new sql.Request(pool);
  vendorCheckRequest.input('VendorProfileID', sql.Int, idNum);
  const vendorCheckResult = await vendorCheckRequest.query(`
    SELECT VendorProfileID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID
  `);
  
  if (vendorCheckResult.recordset.length > 0) {
    return idNum;
  }

  // If not found as VendorProfileID, try to get VendorProfileID from UserID
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

  return null;
}

// Get all predefined services grouped by category
router.get('/predefined-services', async (req, res) => {
  try {
    const pool = await poolPromise;
    // First check if table exists
    const checkTableRequest = new sql.Request(pool);
    const tableCheckResult = await checkTableRequest.query(`
      SELECT COUNT(*) as TableExists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'PredefinedServices'
    `);
    
    if (tableCheckResult.recordset[0].TableExists === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'PredefinedServices table does not exist in database' 
      });
    }
    
    const request = new sql.Request(pool);
    
    const result = await request.query(`
      SELECT 
        Category,
        PredefinedServiceID,
        ServiceName,
        ServiceDescription,
        DefaultDurationMinutes,
        DisplayOrder
      FROM PredefinedServices 
      ORDER BY Category, DisplayOrder, ServiceName
    `);
    
    // Group services by category
    const servicesByCategory = {};
    result.recordset.forEach(service => {
      if (!servicesByCategory[service.Category]) {
        servicesByCategory[service.Category] = [];
      }
      servicesByCategory[service.Category].push({
        id: service.PredefinedServiceID,
        name: service.ServiceName,
        description: service.ServiceDescription,
        defaultDuration: service.DefaultDurationMinutes,
        displayOrder: service.DisplayOrder
      });
    });
    
    res.json({ 
      success: true, 
      servicesByCategory,
      totalServices: result.recordset.length
    });
  } catch (error) {
    console.error('Error fetching all predefined services:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch predefined services',
      error: error.message,
      details: error.toString()
    });
  }
});

// Get predefined services by category
router.get('/predefined-services/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const pool = await poolPromise;
    
    const request = new sql.Request(pool);
    request.input('Category', sql.NVarChar, category);
    
    const result = await request.query(`
      SELECT 
        PredefinedServiceID,
        ServiceName,
        ServiceDescription,
        DefaultDurationMinutes,
        DisplayOrder
      FROM PredefinedServices 
      WHERE Category = @Category
      ORDER BY DisplayOrder, ServiceName
    `);
    
    res.json({ 
      success: true, 
      services: result.recordset 
    });
  } catch (error) {
    console.error('Error fetching predefined services:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch predefined services' 
    });
  }
});

// Helper function to enhance vendor data with Cloudinary images
async function enhanceVendorWithImages(vendor, pool) {
  try {
    const imageRequest = new sql.Request(pool);
    imageRequest.input('VendorProfileID', sql.Int, vendor.VendorProfileID || vendor.id);
    
    const imageResult = await imageRequest.query(`
      SELECT 
        ImageID,
        ImageURL,
        IsPrimary,
        DisplayOrder,
        ImageType,
        Caption
      FROM VendorImages 
      WHERE VendorProfileID = @VendorProfileID 
      ORDER BY IsPrimary DESC, DisplayOrder ASC
    `);

    // Process images with Cloudinary enhancements
    const images = imageResult.recordset.map(img => {
      const imageData = {
        imageId: img.ImageID,
        url: img.ImageURL,
        isPrimary: img.IsPrimary,
        displayOrder: img.DisplayOrder,
        imageType: img.ImageType,
        caption: img.Caption
      };

      // Use the direct image URL since Cloudinary columns may not exist yet
      imageData.thumbnailUrl = img.ImageURL;
      imageData.optimizedUrl = img.ImageURL;
      imageData.squareUrl = img.ImageURL;

      return imageData;
    });

    // Get featured image (primary image or first image)
    const featuredImage = images.find(img => img.isPrimary) || images[0] || null;
    
    return {
      ...vendor,
      featuredImage: featuredImage,
      images: images,
      imageCount: images.length
    };

  } catch (error) {
    console.error('Error enhancing vendor with images:', error);
    return {
      ...vendor,
      featuredImage: null,
      images: [],
      imageCount: 0
    };
  }
}

// Search vendors using sp_SearchVendors with enhanced location support
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
      sortBy,
      includeImages,
      predefinedServices,
      eventLocation,
      mapBounds,
      // unified pricing-aware search params
      budgetType, // 'total' | 'per_person'
      pricingModel, // 'time_based' | 'fixed_based'
      fixedPricingType, // 'fixed_price' | 'per_attendee'
      // availability filters (not supported in this SP; use /search-by-services for time-window filtering)
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
    // unified pricing-aware filters
    request.input('BudgetType', sql.NVarChar(20), budgetType || null);
    request.input('PricingModelFilter', sql.NVarChar(20), pricingModel || null);
    request.input('FixedPricingTypeFilter', sql.NVarChar(20), fixedPricingType || null);
    // Note: Do NOT pass EventDate/Start/End here. sp_SearchVendors does not accept them.

    const result = await request.execute('sp_SearchVendors');
    
    let formattedVendors = result.recordset.map(vendor => ({
      id: vendor.id,
      vendorProfileId: vendor.VendorProfileID || vendor.id,
      name: vendor.name || '',
      type: vendor.type || '',
      location: vendor.location || '',
      description: vendor.description || '',
      price: vendor.price,
      // New starting price fields from sp_SearchVendors
      startingPrice: vendor.MinPriceNumeric ?? vendor.MinPrice,
      startingServiceName: vendor.StartingServiceName || vendor.MinServiceName || null,
      priceLevel: vendor.priceLevel,
      rating: vendor.rating,
      reviewCount: vendor.ReviewCount,
      // Normalized fields for frontend cards
      averageRating: vendor.rating ? parseFloat(vendor.rating) : null,
      totalReviews: vendor.ReviewCount ?? 0,
      favoriteCount: vendor.FavoriteCount,
      bookingCount: vendor.BookingCount,
      image: vendor.image || '', // Legacy image field
      capacity: vendor.Capacity,
      rooms: vendor.Rooms,
      isPremium: vendor.IsPremium,
      isEcoFriendly: vendor.IsEcoFriendly,
      isAwardWinning: vendor.IsAwardWinning,
      region: vendor.Region || '',
      distanceMiles: vendor.DistanceMiles,
      categories: vendor.Categories || '',
      services: vendor.services ? JSON.parse(vendor.services) : [],
      reviews: vendor.reviews ? JSON.parse(vendor.reviews) : [],
      // Add location data for map display
      address: vendor.Address || '',
      city: vendor.City || '',
      state: vendor.State || '',
      country: vendor.Country || '',
      postalCode: vendor.PostalCode || '',
      latitude: vendor.Latitude || null,
      longitude: vendor.Longitude || null
    }));

    // Enhance with Cloudinary images if requested (default: true for better UX)
    if (includeImages !== 'false') {
      console.log('Enhancing vendors with Cloudinary images...');
      
      // Process vendors in batches to avoid overwhelming the database
      const batchSize = 5;
      const enhancedVendors = [];
      
      for (let i = 0; i < formattedVendors.length; i += batchSize) {
        const batch = formattedVendors.slice(i, i + batchSize);
        const enhancedBatch = await Promise.all(
          batch.map(vendor => enhanceVendorWithImages(vendor, pool))
        );
        enhancedVendors.push(...enhancedBatch);
      }
      
      formattedVendors = enhancedVendors;
    }

    res.json({
      success: true,
      vendors: formattedVendors,
      totalCount: result.recordset.length > 0 ? result.recordset[0].TotalCount : 0,
      pageNumber: parseInt(pageNumber) || 1,
      pageSize: parseInt(pageSize) || 10,
      hasImages: includeImages !== 'false'
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

// Enhanced map-based vendor search endpoint with dynamic discovery
router.get('/map', async (req, res) => {
  try {
    const { 
      eventLocation,
      eventLat,
      eventLng,
      category,
      services,
      minPrice,
      maxPrice,
      bounds,
      zoom,
      predefinedServices,
      eventDate,
      eventStartTime,
      eventEndTime,
      prioritizeEventLocation
    } = req.query;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    // Parse event location coordinates
    let eventLatitude = null;
    let eventLongitude = null;
    
    if (eventLat && eventLng) {
      eventLatitude = parseFloat(eventLat);
      eventLongitude = parseFloat(eventLng);
    } else if (eventLocation) {
      try {
        const eventLocationObj = JSON.parse(eventLocation);
        if (eventLocationObj.lat && eventLocationObj.lng) {
          eventLatitude = parseFloat(eventLocationObj.lat);
          eventLongitude = parseFloat(eventLocationObj.lng);
        }
      } catch (e) {
        console.warn('Could not parse event location:', eventLocation);
      }
    }

    // Build dynamic query with distance calculation from event location
    let query = `
      SELECT DISTINCT
        vp.VendorProfileID as id,
        vp.VendorProfileID,
        vp.BusinessName as name,
        vp.BusinessDescription as description,
        vp.Address as address,
        vp.City as city,
        vp.State as state,
        vp.Country as country,
        vp.PostalCode as postalCode,
        vp.Latitude as latitude,
        vp.Longitude as longitude,
        vp.PriceLevel as priceLevel,
        vp.IsPremium,
        vp.IsEcoFriendly,
        vp.IsAwardWinning,
        vc.Category as categories,
        CASE 
          WHEN vp.PriceLevel = '$' THEN 250
          WHEN vp.PriceLevel = '$$' THEN 750
          WHEN vp.PriceLevel = '$$$' THEN 1500
          WHEN vp.PriceLevel = '$$$$' THEN 3000
          ELSE 500
        END as price`;

    // Add distance calculation if event location is provided
    if (eventLatitude && eventLongitude) {
      query += `,
        (6371 * acos(
          cos(radians(@EventLat)) * cos(radians(vp.Latitude)) * 
          cos(radians(vp.Longitude) - radians(@EventLng)) + 
          sin(radians(@EventLat)) * sin(radians(vp.Latitude))
        )) as distanceFromEvent`;
    } else {
      query += `, NULL as distanceFromEvent`;
    }

    query += `
      FROM VendorProfiles vp
      LEFT JOIN VendorCategories vc ON vp.VendorProfileID = vc.VendorProfileID
      LEFT JOIN PredefinedServices ps ON ps.PredefinedServiceID = ps.PredefinedServiceID
      WHERE vp.IsCompleted = 1 
        AND vp.Latitude IS NOT NULL 
        AND vp.Longitude IS NOT NULL`;

    const request = new sql.Request(pool);
    let paramCount = 0;

    // Add event location parameters
    if (eventLatitude && eventLongitude) {
      request.input('EventLat', sql.Decimal(10, 8), eventLatitude);
      request.input('EventLng', sql.Decimal(11, 8), eventLongitude);
    }

    // Add event date/time parameters (raw) and business hours filter in SQL
    if (eventDate && eventStartTime && eventEndTime) {
      try {
        request.input('EventDateRaw', sql.NVarChar(50), eventDate);
        request.input('EventStartRaw', sql.NVarChar(20), eventStartTime);
        request.input('EventEndRaw', sql.NVarChar(20), eventEndTime);
        // Filter vendors whose business hours on the event day fully cover the requested time window
        query += ` AND EXISTS (
          SELECT 1 FROM VendorBusinessHours vbh
          WHERE vbh.VendorProfileID = vp.VendorProfileID
            AND vbh.IsAvailable = 1
            AND vbh.DayOfWeek = CASE DATENAME(WEEKDAY, TRY_CONVERT(date, @EventDateRaw))
                                  WHEN 'Sunday' THEN 0
                                  WHEN 'Monday' THEN 1
                                  WHEN 'Tuesday' THEN 2
                                  WHEN 'Wednesday' THEN 3
                                  WHEN 'Thursday' THEN 4
                                  WHEN 'Friday' THEN 5
                                  WHEN 'Saturday' THEN 6
                                END
            AND vbh.OpenTime <= TRY_CONVERT(time, @EventStartRaw)
            AND vbh.CloseTime >= TRY_CONVERT(time, @EventEndRaw)
        )`;
        console.log('Applying business hours filter for event date/time (SQL-level parsing)');
      } catch (e) {
        console.warn('Failed to apply business hours filter:', e.message);
      }
    }

    // Add category filter
    if (category) {
      query += ` AND vc.Category LIKE @Category${paramCount}`;
      request.input(`Category${paramCount}`, sql.NVarChar(50), `%${category}%`);
      paramCount++;
    }

    // Add predefined services filter
    if (predefinedServices) {
      try {
        const servicesArray = JSON.parse(predefinedServices);
        if (servicesArray.length > 0) {
          const serviceNames = servicesArray.map(s => s.name || s).join("','");
          query += ` AND ps.ServiceName IN ('${serviceNames}')`;
        }
      } catch (e) {
        console.warn('Invalid predefined services parameter:', predefinedServices);
      }
    }

    // Add price range filter
    if (minPrice) {
      query += ` AND CASE 
        WHEN vp.PriceLevel = '$' THEN 250
        WHEN vp.PriceLevel = '$$' THEN 750
        WHEN vp.PriceLevel = '$$$' THEN 1500
        WHEN vp.PriceLevel = '$$$$' THEN 3000
        ELSE 500
      END >= @MinPrice${paramCount}`;
      request.input(`MinPrice${paramCount}`, sql.Decimal(10, 2), parseFloat(minPrice));
      paramCount++;
    }

    if (maxPrice) {
      query += ` AND CASE 
        WHEN vp.PriceLevel = '$' THEN 250
        WHEN vp.PriceLevel = '$$' THEN 750
        WHEN vp.PriceLevel = '$$$' THEN 1500
        WHEN vp.PriceLevel = '$$$$' THEN 3000
        ELSE 500
      END <= @MaxPrice${paramCount}`;
      request.input(`MaxPrice${paramCount}`, sql.Decimal(10, 2), parseFloat(maxPrice));
      paramCount++;
    }

    // Add map bounds filter if provided
    if (bounds) {
      try {
        const boundsObj = JSON.parse(bounds);
        if (boundsObj.north && boundsObj.south && boundsObj.east && boundsObj.west) {
          query += ` AND vp.Latitude BETWEEN @SouthBound${paramCount} AND @NorthBound${paramCount}`;
          query += ` AND vp.Longitude BETWEEN @WestBound${paramCount} AND @EastBound${paramCount}`;
          
          request.input(`SouthBound${paramCount}`, sql.Decimal(10, 8), boundsObj.south);
          request.input(`NorthBound${paramCount}`, sql.Decimal(10, 8), boundsObj.north);
          request.input(`WestBound${paramCount}`, sql.Decimal(11, 8), boundsObj.west);
          request.input(`EastBound${paramCount}`, sql.Decimal(11, 8), boundsObj.east);
          paramCount++;
        }
      } catch (e) {
        console.warn('Invalid bounds parameter:', bounds);
      }
    }

    // Order by: prioritize event location proximity if specified, then rating
    if (eventLatitude && eventLongitude && prioritizeEventLocation === 'true') {
      query += ` ORDER BY distanceFromEvent ASC, vp.Rating DESC, vp.ReviewCount DESC`;
    } else {
      query += ` ORDER BY vp.Rating DESC, vp.ReviewCount DESC`;
    }

    // Add limit for performance
    query += ` OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY`;

    console.log('🗺️ Map search query:', query);
    const result = await request.query(query);
    
    const vendors = result.recordset.map(vendor => ({
      id: vendor.id,
      vendorProfileId: vendor.VendorProfileID,
      name: vendor.name || '',
      description: vendor.description || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      country: vendor.country || '',
      postalCode: vendor.postalCode || '',
      latitude: parseFloat(vendor.latitude) || null,
      longitude: parseFloat(vendor.longitude) || null,
      price: vendor.price,
      priceLevel: vendor.priceLevel,
      rating: vendor.rating || 0,
      reviewCount: vendor.ReviewCount || 0,
      isPremium: vendor.IsPremium || false,
      isEcoFriendly: vendor.IsEcoFriendly || false,
      isAwardWinning: vendor.IsAwardWinning || false,
      categories: vendor.categories || '',
      distanceFromEvent: vendor.distanceFromEvent ? parseFloat(vendor.distanceFromEvent).toFixed(2) : null,
      fullAddress: `${vendor.address || ''}, ${vendor.city || ''}, ${vendor.state || ''} ${vendor.postalCode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
    }));

    // Enhance with images if needed (limit to first 20 for performance)
    const vendorsToEnhance = vendors.slice(0, 20);
    const enhancedVendors = await Promise.all(
      vendorsToEnhance.map(vendor => enhanceVendorWithImages(vendor, pool))
    );
    
    // Combine enhanced and non-enhanced vendors
    const finalVendors = [
      ...enhancedVendors,
      ...vendors.slice(20)
    ];

    res.json({
      success: true,
      vendors: finalVendors,
      totalCount: vendors.length,
      eventLocation: eventLocation || null,
      eventCoordinates: eventLatitude && eventLongitude ? { lat: eventLatitude, lng: eventLongitude } : null,
      searchCriteria: {
        category,
        services,
        minPrice,
        maxPrice,
        bounds: bounds ? JSON.parse(bounds) : null,
        prioritizeEventLocation: prioritizeEventLocation === 'true'
      }
    });

  } catch (err) {
    console.error('Map search error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to search vendors for map',
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
      services,
      selectedPredefinedServices
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

    let selectedPredefinedServicesData = [];
    try {
      selectedPredefinedServicesData = selectedPredefinedServices ? JSON.parse(selectedPredefinedServices) : [];
    } catch (e) {
      console.error('Error parsing selected predefined services JSON:', e);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid selected predefined services format'
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
      const vendorProfileId = result.recordset[0].VendorProfileID;
      
      // Handle selected predefined services with vendor pricing
      if (selectedPredefinedServicesData && selectedPredefinedServicesData.length > 0) {
        for (const predefinedService of selectedPredefinedServicesData) {
          try {
            const serviceRequest = new sql.Request(pool);
            serviceRequest.input('VendorProfileID', sql.Int, vendorProfileId);
            serviceRequest.input('PredefinedServiceID', sql.Int, predefinedService.id);
            serviceRequest.input('VendorPrice', sql.Decimal(10, 2), predefinedService.vendorPrice);
            serviceRequest.input('VendorDuration', sql.Int, predefinedService.vendorDuration);
            serviceRequest.input('VendorDescription', sql.NVarChar(sql.MAX), predefinedService.vendorDescription || null);
            
            await serviceRequest.query(`
              INSERT INTO VendorPredefinedServices 
              (VendorProfileID, PredefinedServiceID, VendorPrice, VendorDuration, VendorDescription, IsActive, CreatedAt)
              VALUES 
              (@VendorProfileID, @PredefinedServiceID, @VendorPrice, @VendorDuration, @VendorDescription, 1, GETDATE())
            `);
            
            console.log(`Added predefined service ${predefinedService.id} for vendor ${vendorProfileId}`);
          } catch (serviceError) {
            console.error(`Error adding predefined service ${predefinedService.id}:`, serviceError);
            // Continue with other services even if one fails
          }
        }
      }
      
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          console.log('Vendor image uploaded:', file);
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Vendor registered successfully',
        userId: result.recordset[0].UserID,
        vendorProfileId: result.recordset[0].VendorProfileID,
        predefinedServicesAdded: selectedPredefinedServicesData.length
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

    // DEBUG: Log all recordsets to identify where images are located
    console.log(`🔍 DEBUGGING RECORDSETS FROM sp_GetVendorDetails:`);
    console.log(`📊 Total recordsets: ${profileResult.recordsets.length}`);
    
    profileResult.recordsets.forEach((recordset, index) => {
      console.log(`📋 Recordset[${index}]: ${recordset.length} records`);
      if (recordset.length > 0) {
        const firstRecord = recordset[0];
        const keys = Object.keys(firstRecord);
        console.log(`   🔑 Keys: ${keys.join(', ')}`);
        
        // Check if this recordset contains images
        if (keys.includes('images')) {
          console.log(`   🖼️  FOUND IMAGES in recordset[${index}]:`, firstRecord.images);
        }
      }
    });

    // Parse images JSON array from updated sp_GetVendorDetails stored procedure
    let imagesFromStoredProcedure = [];
    let imagesRecordsetIndex = -1;
    
    // Search for the recordset containing images
    for (let i = 0; i < profileResult.recordsets.length; i++) {
      const recordset = profileResult.recordsets[i];
      if (recordset.length > 0 && recordset[0].hasOwnProperty('images')) {
        imagesRecordsetIndex = i;
        break;
      }
    }
    
    console.log(`🎯 Images found in recordset index: ${imagesRecordsetIndex}`);
    
    try {
      if (imagesRecordsetIndex >= 0) {
        const imagesJson = profileResult.recordsets[imagesRecordsetIndex][0].images;
        console.log(`📝 Raw images JSON from recordset[${imagesRecordsetIndex}]:`, imagesJson);
        
        if (imagesJson) {
          imagesFromStoredProcedure = JSON.parse(imagesJson);
          console.log(`✅ PARSED IMAGES FROM STORED PROCEDURE:`, imagesFromStoredProcedure);
        } else {
          console.log(`❌ Images JSON is null/empty`);
        }
      } else {
        console.log(`❌ NO RECORDSET WITH IMAGES FOUND`);
      }
    } catch (e) {
      console.error(`❌ ERROR PARSING IMAGES FROM STORED PROCEDURE:`, e);
      imagesFromStoredProcedure = [];
    }

    // Use images from stored procedure (dynamic, no fallback)
    const galleryImages = imagesFromStoredProcedure;
    
    console.log(`FINAL GALLERY IMAGES TO RETURN:`, galleryImages);
    console.log(`FINAL GALLERY IMAGES LENGTH:`, galleryImages.length);

    // Get service areas for this vendor
    let serviceAreas = [];
    try {
      const serviceAreasRequest = new sql.Request(pool);
      serviceAreasRequest.input('VendorProfileID', sql.Int, user.VendorProfileID);
      const serviceAreasResult = await serviceAreasRequest.query(`
        SELECT 
          VendorServiceAreaID,
          GooglePlaceID,
          CityName,
          [State/Province] as StateProvince,
          Country,
          Latitude,
          Longitude,
          ServiceRadius,
          FormattedAddress,
          PlaceType,
          PostalCode,
          TravelCost,
          MinimumBookingAmount,
          BoundsNortheastLat,
          BoundsNortheastLng,
          BoundsSouthwestLat,
          BoundsSouthwestLng
        FROM VendorServiceAreas 
        WHERE VendorProfileID = @VendorProfileID AND IsActive = 1
        ORDER BY CityName
      `);
      serviceAreas = serviceAreasResult.recordset || [];
    } catch (serviceAreasError) {
      console.warn('Service areas query failed, using empty array:', serviceAreasError.message);
      serviceAreas = [];
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
      serviceAreas: serviceAreas,
      images: galleryImages, // Use directly fetched gallery images
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

    // Capture the recordsets into their respective variables
    const [
      profileRecordset, 
      categoriesRecordset, 
      servicesRecordset,
      portfolioRecordset, 
      reviewsRecordset, 
      faqsRecordset,
      teamRecordset,
      socialMediaRecordset,
      businessHoursRecordset,
      imagesRecordset,
      categoryAnswersRecordset,
      isFavoriteRecordset,
      availableSlotsRecordset
    ] = result.recordsets;

    const vendorDetails = {
      profile: {
        ...profileRecordset[0],
      },
      categories: categoriesRecordset,
      services: servicesRecordset,
      portfolio: portfolioRecordset,
      reviews: reviewsRecordset,
      faqs: faqsRecordset,
      team: teamRecordset,
      socialMedia: socialMediaRecordset,
      businessHours: businessHoursRecordset,
      images: imagesRecordset,
      categoryAnswers: categoryAnswersRecordset,
      isFavorite: isFavoriteRecordset && isFavoriteRecordset.length > 0 ? isFavoriteRecordset[0].IsFavorite : false,
      availableSlots: availableSlotsRecordset
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

    // Validation (description optional)
    if (!vendorProfileId || !businessName || !businessEmail || !businessPhone || !primaryCategory) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: businessName, businessEmail, businessPhone, primaryCategory'
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
    updateRequest.input('BusinessDescription', sql.NVarChar, (businessDescription && businessDescription.trim().length > 0) ? businessDescription : null);
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
    
    // Handle categories - replace existing with primary + additional
    await updateRequest.query(`
      DELETE FROM VendorCategories WHERE VendorProfileID = @VendorProfileID
    `);
    
    const primaryCatRequest = new sql.Request(pool);
    primaryCatRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    primaryCatRequest.input('Category', sql.NVarChar, primaryCategory);
    await primaryCatRequest.query(`
      INSERT INTO VendorCategories (VendorProfileID, Category)
      VALUES (@VendorProfileID, @Category)
    `);
    
    if (Array.isArray(additionalCategories) && additionalCategories.length > 0) {
      for (const category of additionalCategories) {
        if (!category || category === primaryCategory) continue;
        const catRequest = new sql.Request(pool);
        catRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        catRequest.input('Category', sql.NVarChar, category);
        await catRequest.query(`
          INSERT INTO VendorCategories (VendorProfileID, Category)
          VALUES (@VendorProfileID, @Category)
        `);
      }
    }

    await markSetupStep(pool, vendorProfileId, 1);

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
    // Mark step 3 completed (gallery)
    await markSetupStep(pool, vendorProfileId, 3);

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

// Debug endpoint to get valid service IDs for troubleshooting
router.get('/debug/service-ids', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    const result = await request.query(`
      SELECT 
        PredefinedServiceID,
        ServiceName,
        Category,
        ServiceDescription
      FROM PredefinedServices 
      ORDER BY Category, DisplayOrder, ServiceName
    `);
    
    res.json({
      success: true,
      services: result.recordset,
      totalCount: result.recordset.length
    });
  } catch (error) {
    console.error('Error fetching service IDs for debug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service IDs',
      error: error.message
    });
  }
});

// Get service ID by name for mapping hardcoded values
router.get('/service-id-by-name/:serviceName', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('ServiceName', sql.NVarChar, serviceName);
    
    const result = await request.query(`
      SELECT 
        PredefinedServiceID,
        ServiceName,
        Category,
        ServiceDescription
      FROM PredefinedServices 
      WHERE ServiceName = @ServiceName
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Service '${serviceName}' not found`
      });
    }
    
    res.json({
      success: true,
      service: result.recordset[0]
    });
  } catch (error) {
    console.error('Error fetching service by name:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service by name',
      error: error.message
    });
  }
});

// Helper function to geocode location using Google Maps Geocoding API
async function geocodeLocation(locationString) {
  try {
    const cleanLocation = locationString.trim();
    
    // Check if Google Maps API key is configured
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured, falling back to text search');
      return null;
    }
    
    // Use Google Maps Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanLocation)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) {
      console.error('Google Geocoding API request failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;
      
      console.log(`Geocoded "${cleanLocation}" to: ${location.lat}, ${location.lng} (${formattedAddress})`);
      
      return { 
        lat: location.lat, 
        lng: location.lng,
        formattedAddress: formattedAddress
      };
    } else {
      console.warn(`Google Geocoding failed for "${cleanLocation}":`, data.status, data.error_message);
      return null;
    }
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Search vendors by predefined services with enhanced criteria
router.post('/search-by-services', async (req, res) => {
  try {
    const { 
      selectedServices,
      eventDetails,
      totalBudget,
      serviceIds,
      budgetType,            // 'total' | 'per_person'
      pricingModel,          // 'time_based' | 'fixed_based'
      fixedPricingType       // 'fixed_price' | 'per_attendee'
    } = req.body;

    if (!selectedServices || selectedServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one service is required'
      });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);

    // Extract service IDs for filtering
    const predefinedServiceIds = selectedServices.map(s => s.serviceId).filter(id => !isNaN(id) && id > 0);
    
    console.log('Received selectedServices:', selectedServices);
    console.log('Extracted predefinedServiceIds:', predefinedServiceIds);
    
    if (predefinedServiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid predefined service IDs are required. Received service IDs: ' + JSON.stringify(selectedServices.map(s => s.serviceId))
      });
    }

    // Validate that the service IDs exist in PredefinedServices table
    const serviceValidationRequest = new sql.Request(pool);
    const serviceIdParams = predefinedServiceIds.map((id, index) => {
      serviceValidationRequest.input(`ServiceID${index}`, sql.Int, id);
      return `@ServiceID${index}`;
    }).join(',');

    const validationResult = await serviceValidationRequest.query(`
      SELECT PredefinedServiceID, ServiceName, Category 
      FROM PredefinedServices 
      WHERE PredefinedServiceID IN (${serviceIdParams})
    `);

    const validServiceIds = validationResult.recordset.map(s => s.PredefinedServiceID);
    const invalidServiceIds = predefinedServiceIds.filter(id => !validServiceIds.includes(id));

    if (invalidServiceIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid service IDs found: ${invalidServiceIds.join(', ')}. These services do not exist in the database.`,
        validServices: validationResult.recordset
      });
    }

    // Prepare parameters for stored procedure - use service IDs instead of categories
    const serviceIdsString = predefinedServiceIds.join(',');
    const totalBudgetValue = totalBudget || selectedServices.reduce((sum, s) => sum + (s.budget || 0), 0);
    
    // Set up stored procedure call
    request.input('ServiceIds', sql.NVarChar(500), serviceIdsString);
    request.input('Budget', sql.Decimal(10, 2), totalBudgetValue);
    request.input('EventDate', sql.Date, eventDetails?.date ? new Date(eventDetails.date) : null);
    request.input('City', sql.NVarChar(100), null); // Let frontend handle location filtering
    request.input('State', sql.NVarChar(50), null);
    request.input('Latitude', sql.Decimal(10, 8), null);
    request.input('Longitude', sql.Decimal(11, 8), null);
    request.input('RadiusMiles', sql.Int, 50);
    request.input('PageNumber', sql.Int, 1);
    request.input('PageSize', sql.Int, 100);
    request.input('SortBy', sql.NVarChar(20), 'relevance');
    // Unified pricing filters
    request.input('BudgetType', sql.NVarChar(20), budgetType || null);
    request.input('PricingModelFilter', sql.NVarChar(20), pricingModel || null);
    request.input('FixedPricingTypeFilter', sql.NVarChar(20), fixedPricingType || null);

    // New: pass service start/end times to stored procedure (SP filters by business hours)
    // IMPORTANT: Use ONLY per-service times from selectedServices (no event-level fallback)
    const serviceTimes = Array.isArray(selectedServices)
      ? selectedServices
          .map(s => ({
            start: s.startTime || s.serviceStartTime || s.start || null,
            end: s.endTime || s.serviceEndTime || s.end || null
          }))
          .filter(t => t.start && t.end)
      : [];

    let derivedStart = null;
    let derivedEnd = null;
    if (serviceTimes.length > 0) {
      // Use earliest start and latest end across selected services
      const starts = serviceTimes.map(t => convertTo24Hour(t.start)).filter(Boolean);
      const ends = serviceTimes.map(t => convertTo24Hour(t.end)).filter(Boolean);
      if (starts.length > 0) derivedStart = starts.sort()[0];
      if (ends.length > 0) derivedEnd = ends.sort().slice(-1)[0];
    }

    // Provide SERVICE start/end (24h) to SP for business-hours filtering (Event Date + Service times only)
    request.input('EventStartRaw', sql.NVarChar(20), derivedStart || null);
    request.input('EventEndRaw', sql.NVarChar(20), derivedEnd || null);

    // Call the new stored procedure for predefined services
    const result = await request.execute('sp_SearchVendorsByPredefinedServices');
    
    // Business hours filtering now handled inside stored procedure

    // Process results to match expected format
    const vendorsWithServices = result.recordset.map(vendor => {
      // Parse VendorImages JSON if it exists
      let vendorImages = [];
      if (vendor.VendorImages) {
        try {
          vendorImages = JSON.parse(vendor.VendorImages);
        } catch (e) {
          console.warn('Failed to parse VendorImages JSON for vendor:', vendor.id, e);
        }
      }

      // Parse services JSON if it exists (support multiple possible column aliases)
      let services = [];
      const rawServicesJson = vendor.services || vendor.Services || vendor.ServicesJson || vendor.ServiceJson || vendor.ServiceJSON || vendor.ServiceDetails || vendor.ServiceDetailsJson || vendor.ServiceDetailsJSON;
      if (rawServicesJson) {
        try {
          const parsed = typeof rawServicesJson === 'string' ? JSON.parse(rawServicesJson) : rawServicesJson;
          const servicesData = (parsed && parsed.services && Array.isArray(parsed.services)) ? parsed.services : parsed;

          if (Array.isArray(servicesData) && servicesData.length > 0) {
            // Case A: flat array of service objects (returned by sp_SearchVendorsByPredefinedServices)
            if (!servicesData[0].services) {
              services = servicesData.map(service => ({
                // Legacy fields for backward compatibility
                ServiceName: service.name || service.ServiceName,
                Category: service.Category,
                VendorPrice: service.Price,
                VendorDescription: service.description || service.VendorDescription,
                VendorDurationMinutes: service.DurationMinutes || service.VendorDurationMinutes,

                // Unified pricing fields
                pricingModel: service.PricingModel || service.pricingModel || null,
                fixedPricingType: service.FixedPricingType || service.fixedPricingType || null,
                baseRate: service.BaseRate != null ? Number(service.BaseRate) : (service.baseRate != null ? Number(service.baseRate) : null),
                baseDurationMinutes: service.BaseDurationMinutes != null ? Number(service.BaseDurationMinutes) : (service.baseDurationMinutes != null ? Number(service.baseDurationMinutes) : null),
                overtimeRatePerHour: service.OvertimeRatePerHour != null ? Number(service.OvertimeRatePerHour) : (service.overtimeRatePerHour != null ? Number(service.overtimeRatePerHour) : null),
                minimumBookingFee: service.MinimumBookingFee != null ? Number(service.MinimumBookingFee) : (service.minimumBookingFee != null ? Number(service.minimumBookingFee) : null),
                fixedPrice: service.FixedPrice != null ? Number(service.FixedPrice) : (service.fixedPrice != null ? Number(service.fixedPrice) : null),
                pricePerPerson: service.PricePerPerson != null ? Number(service.PricePerPerson) : (service.pricePerPerson != null ? Number(service.pricePerPerson) : null),
                minimumAttendees: service.MinimumAttendees != null ? Number(service.MinimumAttendees) : (service.minimumAttendees != null ? Number(service.minimumAttendees) : null),
                maximumAttendees: service.MaximumAttendees != null ? Number(service.MaximumAttendees) : (service.maximumAttendees != null ? Number(service.maximumAttendees) : null),

                // Also expose generic names used by some frontend code paths
                name: service.name || service.ServiceName,
                Price: service.Price,
                description: service.description || service.VendorDescription,
                DurationMinutes: service.DurationMinutes || service.VendorDurationMinutes
              }));
            } else {
              // Case B: array of categories with nested services
              services = servicesData.flatMap(category =>
                (category.services || []).map(service => ({
                  // Legacy fields for backward compatibility
                  ServiceName: service.name,
                  Category: category.category,
                  VendorPrice: service.Price,
                  VendorDescription: service.description,
                  VendorDurationMinutes: service.DurationMinutes,

                  // Unified pricing fields from Services table (if present in SP JSON)
                  pricingModel: service.PricingModel || null,                 // 'time_based' | 'fixed_based'
                  fixedPricingType: service.FixedPricingType || null,         // 'fixed_price' | 'per_attendee'
                  baseRate: service.BaseRate != null ? Number(service.BaseRate) : null,
                  baseDurationMinutes: service.BaseDurationMinutes != null ? Number(service.BaseDurationMinutes) : null,
                  overtimeRatePerHour: service.OvertimeRatePerHour != null ? Number(service.OvertimeRatePerHour) : null,
                  minimumBookingFee: service.MinimumBookingFee != null ? Number(service.MinimumBookingFee) : null,
                  fixedPrice: service.FixedPrice != null ? Number(service.FixedPrice) : null,
                  pricePerPerson: service.PricePerPerson != null ? Number(service.PricePerPerson) : null,
                  minimumAttendees: service.MinimumAttendees != null ? Number(service.MinimumAttendees) : null,
                  maximumAttendees: service.MaximumAttendees != null ? Number(service.MaximumAttendees) : null,

                  // Also expose generic names used by some frontend code paths
                  name: service.name,
                  Price: service.Price,
                  description: service.description,
                  DurationMinutes: service.DurationMinutes
                }))
              );
            }
          }
        } catch (e) {
          console.warn('Failed to parse services JSON for vendor:', vendor.id, e);
        }
      }

      return {
        VendorProfileID: vendor.id,
        BusinessName: vendor.name,
        BusinessType: vendor.type,
        BusinessDescription: vendor.description,
        Location: vendor.location,
        Latitude: vendor.Latitude,
        Longitude: vendor.Longitude,
        IsPremium: vendor.IsPremium,
        IsEcoFriendly: vendor.IsEcoFriendly,
        IsAwardWinning: vendor.IsAwardWinning,
        FeaturedImageURL: vendor.image,
        MatchingServices: vendor.CategoryMatchCount || 1,
        MatchingServiceNames: vendor.MatchingServiceNames || services.map(s => s.ServiceName).join(', '),
        VendorImages: vendorImages, // Include parsed VendorImages
        services: services,
        totalEstimatedCost: vendor.TotalEstimatedPrice || services.reduce((sum, service) => sum + (service.VendorPrice || 0), 0)
      };
    });

    res.json({
      success: true,
      vendors: vendorsWithServices,
      totalResults: vendorsWithServices.length,
      searchCriteria: {
        selectedServices: selectedServices.map(s => s.serviceName),
        totalBudget,
        location: eventDetails?.location,
        eventDate: eventDetails?.date,
        serviceStartTime: serviceTimes.length ? serviceTimes.map(t => t.start).sort()[0] : null,
        serviceEndTime: serviceTimes.length ? serviceTimes.map(t => t.end).sort().slice(-1)[0] : null,
        businessHoursFiltered: !!(eventDetails?.date && derivedStart && derivedEnd)
      }
    });

  } catch (error) {
    console.error('Error searching vendors by services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search vendors',
      error: error.message
    });
  }
});

// Get vendor's selected predefined services
router.get('/:id/selected-services', async (req, res) => {
  try {
    const vendorProfileId = await resolveVendorProfileId(req.params.id, await poolPromise);
    
    if (!vendorProfileId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor not found' 
      });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.query(`
      SELECT 
        vss.VendorSelectedServiceID,
        vss.PredefinedServiceID,
        ps.ServiceName,
        ps.ServiceDescription as PredefinedDescription,
        ps.Category,
        ps.DefaultDurationMinutes,
        vss.VendorPrice,
        vss.VendorDescription,
        vss.VendorDurationMinutes,
        vss.CreatedAt,
        vss.UpdatedAt
      FROM VendorSelectedServices vss
      INNER JOIN PredefinedServices ps ON vss.PredefinedServiceID = ps.PredefinedServiceID
      WHERE vss.VendorProfileID = @VendorProfileID
      ORDER BY ps.Category, ps.DisplayOrder, ps.ServiceName
    `);
    
    let rows = result.recordset;
    // Fallback: if no legacy selected entries, derive from Services linked to predefined services
    if (!rows || rows.length === 0) {
      try {
        const fbReq = new sql.Request(pool);
        fbReq.input('VendorProfileID', sql.Int, vendorProfileId);
        const fbRes = await fbReq.query(`
          SELECT 
            s.LinkedPredefinedServiceID AS PredefinedServiceID,
            ps.ServiceName,
            ps.Category,
            ps.DefaultDurationMinutes,
            s.Description AS VendorDescription,
            -- Derive a single VendorPrice compatible with settings UI
            CASE 
              WHEN s.PricingModel = 'time_based' THEN s.BaseRate
              WHEN s.PricingModel = 'fixed_based' AND s.FixedPricingType = 'fixed_price' THEN s.FixedPrice
              WHEN s.PricingModel = 'fixed_based' AND s.FixedPricingType = 'per_attendee' THEN s.PricePerPerson
              ELSE s.Price
            END AS VendorPrice,
            COALESCE(s.BaseDurationMinutes, s.DurationMinutes, ps.DefaultDurationMinutes) AS VendorDurationMinutes
          FROM Services s
          LEFT JOIN PredefinedServices ps ON ps.PredefinedServiceID = s.LinkedPredefinedServiceID
          WHERE s.VendorProfileID = @VendorProfileID AND s.LinkedPredefinedServiceID IS NOT NULL
          ORDER BY ps.Category, ps.ServiceName
        `);
        rows = fbRes.recordset || [];
      } catch (fbErr) {
        console.warn('Fallback selected-services query failed:', fbErr?.message || fbErr);
      }
    }

    res.json({ 
      success: true, 
      selectedServices: rows 
    });
  } catch (error) {
    console.error('Error fetching vendor selected services:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch vendor selected services' 
    });
  }
});

// Step 3: Services & Packages
router.post('/setup/step3-services', async (req, res) => {
  try {
    const {
      vendorProfileId,
      serviceCategories,
      services,
      packages,
      selectedPredefinedServices
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
      // Detach existing services from categories to avoid FK constraint when deleting categories
      const detachRequest = new sql.Request(pool);
      detachRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await detachRequest.query(`
        UPDATE Services
        SET CategoryID = NULL
        WHERE VendorProfileID = @VendorProfileID AND CategoryID IS NOT NULL
      `);

      // Now delete existing categories
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
        serviceRequest.input('Description', sql.NVarChar, service.description || null);
        // Normalize and map pricing model from UI to stored procedure expectations
        const rawModel = service.pricingModel; // 'time_based' | 'fixed_price' | 'per_attendee' from UI
        let pricingModel = null; // 'time_based' | 'fixed_based'
        let fixedPricingType = null; // 'fixed_price' | 'per_attendee'
        if (rawModel === 'time_based') {
          pricingModel = 'time_based';
        } else if (rawModel === 'fixed_price') {
          pricingModel = 'fixed_based';
          fixedPricingType = 'fixed_price';
        } else if (rawModel === 'per_attendee') {
          pricingModel = 'fixed_based';
          fixedPricingType = 'per_attendee';
        } else {
          pricingModel = service.pricingModel || null;
          fixedPricingType = service.fixedPricingType || null;
        }
        const baseRate = service.baseRate != null ? parseFloat(service.baseRate) : null;
        const baseDurationMinutes = service.baseDurationMinutes != null ? parseInt(service.baseDurationMinutes) : (service.durationMinutes || null);
        const overtimeRatePerHour = service.overtimeRatePerHour != null ? parseFloat(service.overtimeRatePerHour) : null;
        const minimumBookingFee = service.minimumBookingFee != null ? parseFloat(service.minimumBookingFee) : null;
        const fixedPrice = service.fixedPrice != null ? parseFloat(service.fixedPrice) : null;
        const pricePerPerson = service.pricePerPerson != null ? parseFloat(service.pricePerPerson) : null;
        const minimumAttendees = service.minimumAttendees != null ? parseInt(service.minimumAttendees) : null;
        const maximumAttendees = service.maximumAttendees != null ? parseInt(service.maximumAttendees) : null;

        // Validation: ensure required pricing fields are provided per pricing model
        if (!pricingModel) {
          return res.status(400).json({
            success: false,
            message: `Service validation failed: pricingModel is required for service '${service.name || ''}'.`
          });
        }
        if (pricingModel === 'time_based') {
          if (baseRate == null || baseDurationMinutes == null) {
            return res.status(400).json({
              success: false,
              message: `Time-based service '${service.name || ''}' requires baseRate and baseDurationMinutes.`
            });
          }
        } else if (pricingModel === 'fixed_based') {
          if (fixedPricingType === 'fixed_price') {
            if (fixedPrice == null) {
              return res.status(400).json({
                success: false,
                message: `Fixed-price service '${service.name || ''}' requires fixedPrice.`
              });
            }
          } else if (fixedPricingType === 'per_attendee') {
            if (pricePerPerson == null) {
              return res.status(400).json({
                success: false,
                message: `Per-attendee service '${service.name || ''}' requires pricePerPerson.`
              });
            }
          } else {
            return res.status(400).json({
              success: false,
              message: `Fixed-based service '${service.name || ''}' requires fixedPricingType of 'fixed_price' or 'per_attendee'.`
            });
          }
        }

        console.log('Upserting service', {
          vendorProfileId,
          name: service.name,
          pricingModel,
          fixedPricingType,
          baseRate,
          baseDurationMinutes,
          overtimeRatePerHour,
          minimumBookingFee,
          fixedPrice,
          pricePerPerson,
          minimumAttendees,
          maximumAttendees
        });

        // Backward compatible legacy fields
        const legacyPrice = service.price != null ? parseFloat(service.price) : null;
        const derivedPrice = (fixedPrice != null) ? fixedPrice : (baseRate != null ? baseRate : (pricePerPerson != null ? pricePerPerson : legacyPrice));

        // Common fields
        serviceRequest.input('Price', sql.Decimal(10, 2), derivedPrice);
        serviceRequest.input('DurationMinutes', sql.Int, baseDurationMinutes || null);
        serviceRequest.input('MaxAttendees', sql.Int, service.maxAttendees || maximumAttendees || null);
        serviceRequest.input('DepositPercentage', sql.Decimal(5, 2), service.depositPercentage != null ? parseFloat(service.depositPercentage) : 20);
        serviceRequest.input('CancellationPolicy', sql.NVarChar, service.cancellationPolicy || null);
        serviceRequest.input('LinkedPredefinedServiceID', sql.Int, service.linkedPredefinedServiceId || null);
        serviceRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        // Unified pricing fields
        serviceRequest.input('PricingModel', sql.NVarChar, pricingModel);
        serviceRequest.input('BaseDurationMinutes', sql.Int, baseDurationMinutes || null);
        serviceRequest.input('BaseRate', sql.Decimal(10, 2), baseRate);
        serviceRequest.input('OvertimeRatePerHour', sql.Decimal(10, 2), overtimeRatePerHour);
        serviceRequest.input('MinimumBookingFee', sql.Decimal(10, 2), minimumBookingFee);
        serviceRequest.input('FixedPricingType', sql.NVarChar, fixedPricingType);
        serviceRequest.input('FixedPrice', sql.Decimal(10, 2), fixedPrice);
        serviceRequest.input('PricePerPerson', sql.Decimal(10, 2), pricePerPerson);
        serviceRequest.input('MinimumAttendees', sql.Int, minimumAttendees);
        serviceRequest.input('MaximumAttendees', sql.Int, maximumAttendees);

        // Use unified upsert stored procedure
        try {
          await serviceRequest.execute('dbo.sp_UpsertVendorService');
        } catch (spErr) {
          console.error('sp_UpsertVendorService error:', spErr);
          return res.status(400).json({
            success: false,
            message: `Failed to save service '${service.name || ''}': ${spErr.message}`
          });
        }
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
    
    // Handle selected predefined services
    if (selectedPredefinedServices && selectedPredefinedServices.length > 0) {
      // First, delete existing selected predefined services for this vendor
      const deleteSelectedRequest = new sql.Request(pool);
      deleteSelectedRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteSelectedRequest.query(`
        DELETE FROM VendorSelectedServices WHERE VendorProfileID = @VendorProfileID
      `);

      // Insert new selected predefined services
      for (const selectedService of selectedPredefinedServices) {
        const insertSelectedRequest = new sql.Request(pool);
        insertSelectedRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        insertSelectedRequest.input('PredefinedServiceID', sql.Int, selectedService.predefinedServiceId);
        insertSelectedRequest.input('VendorPrice', sql.Decimal(10, 2), selectedService.price);
        insertSelectedRequest.input('VendorDescription', sql.NVarChar, selectedService.description || null);
        insertSelectedRequest.input('VendorDurationMinutes', sql.Int, selectedService.durationMinutes || null);
        
        await insertSelectedRequest.query(`
          INSERT INTO VendorSelectedServices 
          (VendorProfileID, PredefinedServiceID, VendorPrice, VendorDescription, VendorDurationMinutes, CreatedAt)
          VALUES 
          (@VendorProfileID, @PredefinedServiceID, @VendorPrice, @VendorDescription, @VendorDurationMinutes, GETDATE())
        `);
      }
    }
    
    // Mark step 3 completed (services)
    await markSetupStep(pool, vendorProfileId, 3);

    res.json({
      success: true,
      message: 'Services and packages saved successfully',
      step: 3,
      nextStep: 4
    });
    
  } catch (err) {
    console.error('Step 3 setup error:', err);
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
    
    // Mark step 5 completed
    await markSetupStep(pool, vendorProfileId, 5);

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
    
    // Mark step 6 completed
    await markSetupStep(pool, vendorProfileId, 6);

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
    
    // If attempting to enable bookings, enforce setup completion (including Stripe)
    if (acceptingBookings) {
      const status = await computeVendorSetupStatusByVendorProfileId(pool, parseInt(vendorProfileId));
      if (!status.allRequiredComplete) {
        return res.status(400).json({
          success: false,
          message: 'Cannot enable accepting bookings until all mandatory setup steps (including Stripe payouts) are complete.',
          incompleteSteps: status.incompleteSteps,
          stripe: status.stripe
        });
      }
    }
    
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
    
    // Mark step 7 completed
    await markSetupStep(pool, vendorProfileId, 7);

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
    
    // Mark step 8 completed
    await markSetupStep(pool, vendorProfileId, 8);

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
    
    // Mark step 9 completed
    await markSetupStep(pool, vendorProfileId, 9);

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
    // Mark step 10 completed
    await markSetupStep(pool, vendorProfileId, 10);

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
    const status = await computeVendorSetupStatusByVendorProfileId(pool, parseInt(vendorProfileId));
    
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
        steps,
        incompleteSteps: status.incompleteSteps,
        stripe: status.stripe,
        allRequiredComplete: status.allRequiredComplete
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
    const status = await computeVendorSetupStatusByVendorProfileId(pool, vendorProfileId);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor setup progress not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...result.recordset[0],
        incompleteSteps: status.incompleteSteps,
        stripe: status.stripe,
        allRequiredComplete: status.allRequiredComplete
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
    const { 
      serviceName, description, price, duration, category,
      // unified pricing fields
      pricingModel, // 'time_based' | 'fixed_based'
      baseDurationMinutes, baseRate, overtimeRatePerHour, minimumBookingFee,
      fixedPricingType, fixedPrice, pricePerPerson, minimumAttendees, maximumAttendees
    } = req.body;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    // Use unified upsert SP for insertion
    const request = new sql.Request(pool);
    request.input('ServiceID', sql.Int, null);
    request.input('VendorProfileID', sql.Int, id);
    request.input('CategoryID', sql.Int, null);
    request.input('Name', sql.NVarChar(255), serviceName);
    request.input('Description', sql.NVarChar(sql.MAX), description || null);
    // derive a legacy price for compatibility
    const legacyPrice = price != null ? parseFloat(price) : null;
    const derivedPrice = (fixedPrice != null ? parseFloat(fixedPrice) : (baseRate != null ? parseFloat(baseRate) : (pricePerPerson != null ? parseFloat(pricePerPerson) : legacyPrice)));
    request.input('Price', sql.Decimal(10, 2), derivedPrice);
    request.input('DurationMinutes', sql.Int, baseDurationMinutes != null ? parseInt(baseDurationMinutes) : (duration ? parseInt(duration) : null));
    request.input('MaxAttendees', sql.Int, maximumAttendees != null ? parseInt(maximumAttendees) : null);
    request.input('DepositPercentage', sql.Decimal(5, 2), 20);
    request.input('CancellationPolicy', sql.NVarChar, null);
    request.input('LinkedPredefinedServiceID', sql.Int, null);
    request.input('PricingModel', sql.NVarChar(20), pricingModel || null);
    request.input('BaseDurationMinutes', sql.Int, baseDurationMinutes != null ? parseInt(baseDurationMinutes) : null);
    request.input('BaseRate', sql.Decimal(10, 2), baseRate != null ? parseFloat(baseRate) : null);
    request.input('OvertimeRatePerHour', sql.Decimal(10, 2), overtimeRatePerHour != null ? parseFloat(overtimeRatePerHour) : null);
    request.input('MinimumBookingFee', sql.Decimal(10, 2), minimumBookingFee != null ? parseFloat(minimumBookingFee) : null);
    request.input('FixedPricingType', sql.NVarChar(20), pricingModel === 'fixed_based' ? (fixedPricingType || null) : null);
    request.input('FixedPrice', sql.Decimal(10, 2), pricingModel === 'fixed_based' && fixedPricingType === 'fixed_price' && fixedPrice != null ? parseFloat(fixedPrice) : null);
    request.input('PricePerPerson', sql.Decimal(10, 2), pricingModel === 'fixed_based' && fixedPricingType === 'per_attendee' && pricePerPerson != null ? parseFloat(pricePerPerson) : null);
    request.input('MinimumAttendees', sql.Int, pricingModel === 'fixed_based' && fixedPricingType === 'per_attendee' && minimumAttendees != null ? parseInt(minimumAttendees) : null);
    request.input('MaximumAttendees', sql.Int, pricingModel === 'fixed_based' && fixedPricingType === 'per_attendee' && maximumAttendees != null ? parseInt(maximumAttendees) : null);

    const insertResult = await request.execute('dbo.sp_UpsertVendorService');
    const newServiceId = insertResult.recordset && insertResult.recordset[0] ? insertResult.recordset[0].ServiceID : null;
    res.json({
      success: true,
      serviceId: newServiceId
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

// Get vendor summary for Step 8 display
router.get('/summary/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, id);

    // Get basic vendor info
    const vendorResult = await request.query(`
      SELECT 
        BusinessName, DisplayName, BusinessEmail, BusinessPhone, Website,
        YearsInBusiness, BusinessDescription, Tagline, Address, City, State,
        Country, PostalCode, FeaturedImageURL
      FROM VendorProfiles 
      WHERE VendorProfileID = @VendorProfileID
    `);

    if (vendorResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const basicInfo = vendorResult.recordset[0];

    // Get categories
    const categoriesResult = await request.query(`
      SELECT vc.Category 
      FROM VendorCategories vc
      WHERE vc.VendorProfileID = @VendorProfileID
    `);

    // Get service areas
    const serviceAreasResult = await request.query(`
      SELECT City, State, Country, RadiusMiles, AdditionalFee
      FROM VendorServiceAreas 
      WHERE VendorProfileID = @VendorProfileID
    `);

    // Get services count
    const servicesResult = await request.query(`
      SELECT COUNT(*) as ServiceCount 
      FROM Services s
      INNER JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
      WHERE sc.VendorProfileID = @VendorProfileID
    `);

    // Get packages count
    const packagesResult = await request.query(`
      SELECT COUNT(*) as PackageCount 
      FROM Packages 
      WHERE VendorProfileID = @VendorProfileID
    `);

    // Get images count
    const imagesResult = await request.query(`
      SELECT COUNT(*) as ImageCount 
      FROM VendorImages 
      WHERE VendorProfileID = @VendorProfileID
    `);

    // Get social media
    const socialMediaResult = await request.query(`
      SELECT Platform, URL 
      FROM VendorSocialMedia 
      WHERE VendorProfileID = @VendorProfileID
    `);

    // Get business hours
    const businessHoursResult = await request.query(`
      SELECT DayOfWeek, OpenTime, CloseTime, IsAvailable
      FROM VendorBusinessHours 
      WHERE VendorProfileID = @VendorProfileID
      ORDER BY DayOfWeek
    `);

    const summaryData = {
      basicInfo,
      categories: categoriesResult.recordset,
      serviceAreas: serviceAreasResult.recordset,
      serviceCount: servicesResult.recordset[0]?.ServiceCount || 0,
      packageCount: packagesResult.recordset[0]?.PackageCount || 0,
      imageCount: imagesResult.recordset[0]?.ImageCount || 0,
      socialMedia: socialMediaResult.recordset,
      businessHours: businessHoursResult.recordset
    };

    res.json({
      success: true,
      data: summaryData
    });

  } catch (err) {
    console.error('Vendor summary error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get vendor summary',
      error: err.message 
    });
  }
});

// (removed duplicate older Step 1 route; consolidated above)

// Step 2: Location Information
router.post('/setup/step2-location', async (req, res) => {
  try {
    const { vendorProfileId, address, city, state, country, postalCode, serviceAreas, serviceRadius, latitude, longitude } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Vendor profile ID is required' });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('Address', sql.NVarChar(255), address);
    request.input('City', sql.NVarChar(100), city);
    request.input('State', sql.NVarChar(100), state);
    request.input('Country', sql.NVarChar(100), country);
    request.input('PostalCode', sql.NVarChar(20), postalCode);
    request.input('Latitude', sql.Decimal(10, 8), latitude);
    request.input('Longitude', sql.Decimal(11, 8), longitude);
    
    await request.query(`
      UPDATE VendorProfiles 
      SET Address = @Address,
          City = @City,
          State = @State,
          Country = @Country,
          PostalCode = @PostalCode,
          Latitude = @Latitude,
          Longitude = @Longitude,
          UpdatedAt = GETUTCDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    
    // Handle service areas if provided
    if (serviceAreas && serviceAreas.length > 0) {
      // First, clear existing service areas
      const clearRequest = new sql.Request(pool);
      clearRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await clearRequest.query(`
        DELETE FROM VendorServiceAreas WHERE VendorProfileID = @VendorProfileID
      `);
      
      // Insert new service areas with Google Maps data
      for (const area of serviceAreas) {
        const areaRequest = new sql.Request(pool);
        areaRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        areaRequest.input('GooglePlaceID', sql.NVarChar(100), area.placeId || area.googlePlaceId || '');
        areaRequest.input('CityName', sql.NVarChar(100), area.city || area.name || area.locality || area);
        areaRequest.input('StateProvince', sql.NVarChar(100), area.province || area.state || area.administrative_area_level_1 || state);
        areaRequest.input('Country', sql.NVarChar(100), area.country || country);
        areaRequest.input('Latitude', sql.Decimal(9, 6), area.latitude || area.lat || null);
        areaRequest.input('Longitude', sql.Decimal(9, 6), area.longitude || area.lng || null);
        areaRequest.input('ServiceRadius', sql.Decimal(10, 2), area.serviceRadius || serviceRadius || 25.0);
        areaRequest.input('FormattedAddress', sql.NVarChar(255), area.formattedAddress || area.formatted_address || null);
        areaRequest.input('PlaceType', sql.NVarChar(50), area.placeType || area.types?.[0] || null);
        areaRequest.input('PostalCode', sql.NVarChar(20), area.postalCode || area.postal_code || null);
        areaRequest.input('TravelCost', sql.Decimal(10, 2), area.travelCost || null);
        areaRequest.input('MinimumBookingAmount', sql.Decimal(10, 2), area.minimumBookingAmount || null);
        
        // Handle bounds if provided
        const bounds = area.bounds || area.geometry?.viewport;
        areaRequest.input('BoundsNortheastLat', sql.Decimal(9, 6), bounds?.northeast?.lat || null);
        areaRequest.input('BoundsNortheastLng', sql.Decimal(9, 6), bounds?.northeast?.lng || null);
        areaRequest.input('BoundsSouthwestLat', sql.Decimal(9, 6), bounds?.southwest?.lat || null);
        areaRequest.input('BoundsSouthwestLng', sql.Decimal(9, 6), bounds?.southwest?.lng || null);
        
        await areaRequest.query(`
          INSERT INTO VendorServiceAreas (
            VendorProfileID, GooglePlaceID, CityName, [State/Province], Country, 
            Latitude, Longitude, ServiceRadius, FormattedAddress, PlaceType, PostalCode,
            TravelCost, MinimumBookingAmount, BoundsNortheastLat, BoundsNortheastLng, 
            BoundsSouthwestLat, BoundsSouthwestLng, IsActive, CreatedDate, LastModifiedDate
          )
          VALUES (
            @VendorProfileID, @GooglePlaceID, @CityName, @StateProvince, @Country,
            @Latitude, @Longitude, @ServiceRadius, @FormattedAddress, @PlaceType, @PostalCode,
            @TravelCost, @MinimumBookingAmount, @BoundsNortheastLat, @BoundsNortheastLng,
            @BoundsSouthwestLat, @BoundsSouthwestLng, 1, GETDATE(), GETDATE()
          )
        `);
      }
    }
    
    res.json({ success: true, message: 'Location information saved successfully' });

  } catch (err) {
    console.error('Step 2 error:', err);
    res.status(500).json({ success: false, message: 'Failed to save location information', error: err.message });
  }
});

// Step 4: Additional Details
router.post('/setup/step4-additional-details', async (req, res) => {
  try {
    const { vendorProfileId, categoryAnswers, primaryCategory } = req.body;
    
    if (!vendorProfileId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vendor profile ID is required' 
      });
    }

    const pool = await poolPromise;
    
    // Save category-specific question answers
    if (categoryAnswers && categoryAnswers.length > 0) {
      // First, delete existing answers for this vendor to avoid duplicates
      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('VendorProfileId', sql.Int, vendorProfileId);
      await deleteRequest.query(`
        DELETE FROM VendorCategoryAnswers 
        WHERE VendorProfileID = @VendorProfileId
      `);

      // Insert new answers
      for (const answer of categoryAnswers) {
        const insertRequest = new sql.Request(pool);
        insertRequest.input('VendorProfileId', sql.Int, vendorProfileId);
        insertRequest.input('QuestionId', sql.Int, answer.questionId);
        insertRequest.input('Answer', sql.NVarChar(sql.MAX), answer.answer);
        await insertRequest.query(`
          INSERT INTO VendorCategoryAnswers (VendorProfileID, QuestionID, Answer, CreatedAt, UpdatedAt)
          VALUES (@VendorProfileId, @QuestionId, @Answer, GETDATE(), GETDATE())
        `);
      }
    }

    res.json({
      success: true,
      message: 'Additional details saved successfully',
      data: {
        vendorProfileId: vendorProfileId,
        answersCount: categoryAnswers?.length || 0
      }
    });

  } catch (error) {
    console.error('Step 4 error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save additional details',
      error: error.message 
    });
  }
});

// Step 5: Availability & Scheduling
router.post('/setup/step5-availability', async (req, res) => {
  try {
    const { vendorProfileId, businessHours, bookingSettings } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Vendor profile ID is required' });
    }

    const pool = await poolPromise;
    
    // Handle business hours if provided
    if (businessHours) {
      for (const [day, hours] of Object.entries(businessHours)) {
        if (hours.isOpen) {
          const request = new sql.Request(pool);
          request.input('VendorProfileID', sql.Int, vendorProfileId);
          request.input('DayOfWeek', sql.Int, parseInt(day));
          // Format time values properly for SQL Server TIME type
          const formatTimeForSQL = (timeStr) => {
            if (!timeStr) return null;
            // Ensure format is HH:MM:SS
            const parts = timeStr.split(':');
            if (parts.length === 2) {
              return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
            }
            return timeStr;
          };
          
          const openTime = formatTimeForSQL(hours.openTime);
          const closeTime = formatTimeForSQL(hours.closeTime);
          
          console.log(`Day ${day}: Original times - Open: "${hours.openTime}", Close: "${hours.closeTime}"`);
          console.log(`Day ${day}: Formatted times - Open: "${openTime}", Close: "${closeTime}"`);
          
          // Try using VarChar instead of Time type to avoid validation issues
          request.input('OpenTime', sql.VarChar(8), openTime);
          request.input('CloseTime', sql.VarChar(8), closeTime);
          
          await request.query(`
            INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable, CreatedAt, UpdatedAt)
            VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, 1, GETUTCDATE(), GETUTCDATE())
          `);
        }
      }
    }
    
    res.json({ success: true, message: 'Availability and scheduling saved successfully' });

  } catch (err) {
    console.error('Step 5 error:', err);
    res.status(500).json({ success: false, message: 'Failed to save availability and scheduling', error: err.message });
  }
});

// Step 6: Gallery & Media
router.post('/setup/step6-gallery', async (req, res) => {
  try {
    const { vendorProfileId, featuredImageURL, galleryImages } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Vendor profile ID is required' });
    }

    const pool = await poolPromise;
    
    // Update featured image if provided
    if (featuredImageURL) {
      const request = new sql.Request(pool);
      request.input('VendorProfileID', sql.Int, vendorProfileId);
      request.input('FeaturedImageURL', sql.NVarChar(500), featuredImageURL);
      
      await request.query(`
        UPDATE VendorProfiles 
        SET FeaturedImageURL = @FeaturedImageURL,
            UpdatedAt = GETUTCDATE()
        WHERE VendorProfileID = @VendorProfileID
      `);
    }
    
    // Save gallery images if provided
    console.log('Gallery images received:', galleryImages);
    if (galleryImages && Array.isArray(galleryImages) && galleryImages.length > 0) {
      console.log(`Processing ${galleryImages.length} gallery images...`);
      
      // First, delete existing gallery images for this vendor
      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteRequest.query(`
        DELETE FROM VendorImages 
        WHERE VendorProfileID = @VendorProfileID AND ImageType = 'Gallery'
      `);
      console.log('Deleted existing gallery images');
      
      // Insert new gallery images
      for (let i = 0; i < galleryImages.length; i++) {
        const image = galleryImages[i];
        console.log(`Processing image ${i}:`, image);
        if (image.url) {
          const insertRequest = new sql.Request(pool);
          insertRequest.input('VendorProfileID', sql.Int, vendorProfileId);
          insertRequest.input('ImageURL', sql.NVarChar(500), image.url);
          insertRequest.input('Caption', sql.NVarChar(255), image.caption || '');
          insertRequest.input('ImageType', sql.NVarChar(20), 'Gallery');
          insertRequest.input('DisplayOrder', sql.Int, i);
          
          await insertRequest.query(`
            INSERT INTO VendorImages (VendorProfileID, ImageURL, Caption, ImageType, DisplayOrder, IsPrimary, CreatedAt)
            VALUES (@VendorProfileID, @ImageURL, @Caption, @ImageType, @DisplayOrder, 0, GETUTCDATE())
          `);
          console.log(`Inserted gallery image ${i} successfully`);
        } else {
          console.log(`Skipping image ${i} - no URL`);
        }
      }
    } else {
      console.log('No gallery images to process or invalid format');
    }
    
    res.json({ success: true, message: 'Gallery and media saved successfully' });

  } catch (err) {
    console.error('Step 6 error:', err);
    res.status(500).json({ success: false, message: 'Failed to save gallery and media', error: err.message });
  }
});

// Step 7: Social Media
router.post('/setup/step7-social', async (req, res) => {
  try {
    const { vendorProfileId, socialMedia, socialMediaProfiles } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Vendor profile ID is required' });
    }

    const pool = await poolPromise;
    
    // Handle social media profiles if provided (array format from frontend)
    const socialProfiles = socialMediaProfiles || socialMedia;
    console.log('Social media data received:', socialProfiles);
    
    if (socialProfiles) {
      // First, delete existing social media for this vendor
      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteRequest.query(`
        DELETE FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID
      `);
      console.log('Deleted existing social media');
      
      // Handle array format (socialMediaProfiles)
      if (Array.isArray(socialProfiles)) {
        for (let i = 0; i < socialProfiles.length; i++) {
          const profile = socialProfiles[i];
          console.log(`Processing social profile ${i}:`, profile);
          if (profile.platform && profile.url) {
            const request = new sql.Request(pool);
            request.input('VendorProfileID', sql.Int, vendorProfileId);
            request.input('Platform', sql.NVarChar(50), profile.platform);
            request.input('URL', sql.NVarChar(500), profile.url);
            request.input('DisplayOrder', sql.Int, i);
            
            await request.query(`
              INSERT INTO VendorSocialMedia (VendorProfileID, Platform, URL, DisplayOrder)
              VALUES (@VendorProfileID, @Platform, @URL, @DisplayOrder)
            `);
            console.log(`Inserted social media ${i} successfully`);
          }
        }
      } 
      // Handle object format (socialMedia)
      else if (typeof socialProfiles === 'object') {
        let displayOrder = 0;
        for (const [platform, url] of Object.entries(socialProfiles)) {
          if (url) {
            const request = new sql.Request(pool);
            request.input('VendorProfileID', sql.Int, vendorProfileId);
            request.input('Platform', sql.NVarChar(50), platform);
            request.input('URL', sql.NVarChar(500), url);
            request.input('DisplayOrder', sql.Int, displayOrder++);
            
            await request.query(`
              INSERT INTO VendorSocialMedia (VendorProfileID, Platform, URL, DisplayOrder)
              VALUES (@VendorProfileID, @Platform, @URL, @DisplayOrder)
            `);
            console.log(`Inserted social media ${platform} successfully`);
          }
        }
      }
    } else {
      console.log('No social media data to process');
    }
    
    res.json({ success: true, message: 'Social media saved successfully' });

  } catch (err) {
    console.error('Step 7 error:', err);
    res.status(500).json({ success: false, message: 'Failed to save social media', error: err.message });
  }
});

// Step 8: FAQ
router.post('/setup/step8-faq', async (req, res) => {
  try {
    const { vendorProfileId, faqs } = req.body;
    
    if (!vendorProfileId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vendor profile ID is required' 
      });
    }

    const pool = await poolPromise;
    
    // Handle FAQ data if provided
    if (faqs && faqs.length > 0) {
      // First, delete existing FAQs for this vendor to avoid duplicates
      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteRequest.query(`
        DELETE FROM VendorFAQs 
        WHERE VendorProfileID = @VendorProfileID
      `);

      // Insert new FAQs
      for (let i = 0; i < faqs.length; i++) {
        const faq = faqs[i];
        if (faq.question && faq.answer) {
          const insertRequest = new sql.Request(pool);
          insertRequest.input('VendorProfileID', sql.Int, vendorProfileId);
          insertRequest.input('Question', sql.NVarChar(500), faq.question);
          insertRequest.input('Answer', sql.NVarChar(sql.MAX), faq.answer);
          insertRequest.input('DisplayOrder', sql.Int, i + 1);
          await insertRequest.query(`
            INSERT INTO VendorFAQs (VendorProfileID, Question, Answer, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
            VALUES (@VendorProfileID, @Question, @Answer, @DisplayOrder, 1, GETUTCDATE(), GETUTCDATE())
          `);
        }
      }
    }
    
    res.json({
      success: true,
      message: faqs && faqs.length > 0 ? 'FAQ data saved successfully' : 'Step 8 completed (no FAQs provided)',
      data: {
        vendorProfileId: vendorProfileId,
        faqsCount: faqs?.length || 0
      }
    });

  } catch (error) {
    console.error('Error saving FAQ data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save FAQ data',
      error: error.message 
    });
  }
});

// Step 9: Summary & Completion
router.post('/setup/step9-completion', async (req, res) => {
  try {
    const { vendorProfileId, faqs, testimonials, selectedPredefinedServices } = req.body;
    
    if (!vendorProfileId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vendor profile ID is required' 
      });
    }

    const pool = await poolPromise;
    
    // Enforce completion of mandatory steps (including Stripe) before marking complete
    const status = await computeVendorSetupStatusByVendorProfileId(pool, parseInt(vendorProfileId));
    if (!status.allRequiredComplete) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete setup until all mandatory steps (including Stripe payouts) are complete.',
        incompleteSteps: status.incompleteSteps,
        stripe: status.stripe
      });
    }

    // Mark vendor setup as complete
    const updateRequest = new sql.Request(pool);
    updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    await updateRequest.query(`
      UPDATE VendorProfiles 
      SET IsCompleted = 1,
          SetupCompletedAt = GETUTCDATE(),
          UpdatedAt = GETUTCDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    
    // Handle any final FAQs if provided
    if (faqs && faqs.length > 0) {
      for (let i = 0; i < faqs.length; i++) {
        const faq = faqs[i];
        if (faq.question && faq.answer) {
          const faqRequest = new sql.Request(pool);
          faqRequest.input('VendorProfileId', sql.Int, vendorProfileId);
          faqRequest.input('Question', sql.NVarChar(500), faq.question);
          faqRequest.input('Answer', sql.NVarChar(sql.MAX), faq.answer);
          faqRequest.input('DisplayOrder', sql.Int, i + 1);
          await faqRequest.query(`
            INSERT INTO VendorFAQs (VendorProfileID, Question, Answer, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
            VALUES (@VendorProfileId, @Question, @Answer, @DisplayOrder, 1, GETUTCDATE(), GETUTCDATE())
          `);
        }
      }
    }
    
    // Handle selected predefined services with vendor pricing
    if (selectedPredefinedServices && selectedPredefinedServices.length > 0) {
      for (const predefinedService of selectedPredefinedServices) {
        try {
          const serviceRequest = new sql.Request(pool);
          serviceRequest.input('VendorProfileID', sql.Int, vendorProfileId);
          serviceRequest.input('PredefinedServiceID', sql.Int, predefinedService.id);
          serviceRequest.input('VendorPrice', sql.Decimal(10, 2), predefinedService.vendorPrice);
          serviceRequest.input('VendorDuration', sql.Int, predefinedService.vendorDuration);
          serviceRequest.input('VendorDescription', sql.NVarChar(sql.MAX), predefinedService.vendorDescription || null);
          
          await serviceRequest.query(`
            INSERT INTO VendorPredefinedServices 
            (VendorProfileID, PredefinedServiceID, VendorPrice, VendorDuration, VendorDescription, IsActive, CreatedAt)
            VALUES 
            (@VendorProfileID, @PredefinedServiceID, @VendorPrice, @VendorDuration, @VendorDescription, 1, GETDATE())
          `);
          
          console.log(`Added predefined service ${predefinedService.id} for vendor ${vendorProfileId}`);
        } catch (serviceError) {
          console.error(`Error adding predefined service ${predefinedService.id}:`, serviceError);
          // Continue with other services even if one fails
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Vendor setup completed successfully! Your profile is now live.',
      data: {
        vendorProfileId: vendorProfileId,
        setupComplete: true,
        faqsAdded: faqs?.length || 0,
        predefinedServicesAdded: selectedPredefinedServices?.length || 0
      }
    });

  } catch (error) {
    console.error('Error completing vendor setup:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to complete vendor setup',
      error: error.message 
    });
  }
});

// Get vendor summary data for Step 9
router.get('/summary/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    
    if (!vendorProfileId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vendor profile ID is required' 
      });
    }

    const pool = await poolPromise;
    
    // Get vendor profile data
    const profileRequest = new sql.Request(pool);
    profileRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const profileResult = await profileRequest.query(`
      SELECT * FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID
    `);
    
    if (!profileResult.recordset || profileResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor profile not found' 
      });
    }
    
    const vendorProfile = profileResult.recordset[0];
    
    // Get category answers
    const categoryRequest = new sql.Request(pool);
    categoryRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const categoryResult = await categoryRequest.query(`
      SELECT ca.*, cq.QuestionText, cq.Category 
      FROM VendorCategoryAnswers ca
      JOIN CategoryQuestions cq ON ca.QuestionID = cq.QuestionID
      WHERE ca.VendorProfileID = @VendorProfileID
    `);
    
    // Get business hours
    const hoursRequest = new sql.Request(pool);
    hoursRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const hoursResult = await hoursRequest.query(`
      SELECT * FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID ORDER BY DayOfWeek
    `);
    
    // Get gallery images
    const imagesRequest = new sql.Request(pool);
    imagesRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const imagesResult = await imagesRequest.query(`
      SELECT * FROM VendorImages WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder
    `);
    
    // Get social media
    const socialRequest = new sql.Request(pool);
    socialRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const socialResult = await socialRequest.query(`
      SELECT * FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder
    `);
    
    // Get FAQs
    const faqRequest = new sql.Request(pool);
    faqRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const faqResult = await faqRequest.query(`
      SELECT * FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder
    `);
    
    res.json({
      success: true,
      data: {
        profile: vendorProfile,
        categoryAnswers: categoryResult.recordset || [],
        businessHours: hoursResult.recordset || [],
        galleryImages: imagesResult.recordset || [],
        socialMedia: socialResult.recordset || [],
        faqs: faqResult.recordset || []
      }
    });

  } catch (error) {
    console.error('Error fetching vendor summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch vendor summary',
      error: error.message 
    });
  }
});

// Get category-specific questions for Step 4
router.get('/category-questions/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category parameter is required' 
      });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('Category', sql.NVarChar(50), category);
    
    const result = await request.execute('sp_GetCategoryQuestions');
    
    if (result.recordset) {
      res.json({ 
        success: true, 
        questions: result.recordset 
      });
    } else {
      res.json({ 
        success: true, 
        questions: [] 
      });
    }
    
  } catch (error) {
    console.error('Error fetching category questions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch category questions',
      error: error.message 
    });
  }
});

module.exports = router;
