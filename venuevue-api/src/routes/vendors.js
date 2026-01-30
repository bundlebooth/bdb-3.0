const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const { serializeDates, serializeRecords } = require('../utils/helpers');
const { upload } = require('../middlewares/uploadMiddleware');
const cloudinaryService = require('../services/cloudinaryService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const axios = require('axios');
const { decodeVendorId, decodeServiceId, decodeImageId, isPublicId } = require('../utils/hashIds');
const { notifyAdminOfVendorApplication, notifyVendorOfApproval, notifyVendorOfRejection } = require('../services/emailService');

// Helper to resolve vendor ID (handles both public ID and numeric ID)
function resolveVendorIdParam(idParam) {
  if (!idParam) return null;
  if (isPublicId(idParam)) {
    return decodeVendorId(idParam);
  }
  const parsed = parseInt(idParam, 10);
  return isNaN(parsed) ? null : parsed;
}

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
    const r = await req.execute('vendors.sp_GetStripeAccountId');
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
  const profRes = await profReq.execute('vendors.sp_GetProfileForSetup');
  if (!profRes.recordset.length) return { exists: false, error: 'Vendor profile not found' };
  const p = profRes.recordset[0];
  const countsReq = new sql.Request(pool);
  countsReq.input('VendorProfileID', sql.Int, vendorProfileId);
  const countsRes = await countsReq.execute('vendors.sp_GetSetupCounts');
  const c = countsRes.recordset[0] || {};
  const stripeStatus = await getStripeStatusByVendorProfileId(pool, vendorProfileId);
  const steps = {
    basics: !!(p.BusinessName && p.BusinessEmail && p.BusinessPhone && (c.CategoriesCount||0) > 0),
    location: !!p.Address && (c.ServiceAreaCount || 0) > 0,
    additionalDetails: (c.CategoryAnswerCount || 0) > 0,
    social: (c.SocialCount || 0) > 0,
    servicesPackages: ((c.ServicesCount || 0) > 0) || ((c.PackageCount || 0) > 0),
    faq: (c.FAQCount || 0) > 0,
    gallery: !!p.LogoURL || (c.ImagesCount || 0) > 0,
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
    await sReq.execute('vendors.sp_UpdateSetupStep');
  } catch (e) {
    console.warn('sp_UpdateVendorSetupStep failed:', e?.message || e);
  }
}

// Helper function to parse and validate VendorProfileID
function parseVendorProfileId(id) {
  const idNum = parseInt(id);
  if (isNaN(idNum) || idNum <= 0) {
    return null;
  }
  return idNum;
}

// ===== SERVICE IMAGE UPLOAD ROUTES (Must be before parameterized routes) =====

// Upload service image to Cloudinary
router.post('/service-image/upload', upload.single('image'), async (req, res) => {
  try {
    // Ensure response is always JSON
    res.setHeader('Content-Type', 'application/json');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary is not configured. Please contact the administrator.'
      });
    }

    // Upload to Cloudinary in vendor-services folder
    const result = await cloudinaryService.uploadImage(req.file.path, {
      folder: 'venuevue/vendor-services',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    res.json({
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Service image upload error:', error);
    // Ensure we always return JSON even on error
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload service image',
        error: error.message 
      });
    }
  }
});

// Delete service image from Cloudinary
router.delete('/service-image/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // Decode the publicId (it comes URL encoded)
    const decodedPublicId = decodeURIComponent(publicId);
    
    const result = await cloudinaryService.deleteImage(decodedPublicId);

    res.json({
      success: true,
      message: 'Image deleted successfully',
      result
    });
  } catch (error) {
    console.error('Service image delete error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete service image',
      error: error.message 
    });
  }
});

// ===== END SERVICE IMAGE UPLOAD ROUTES =====

// Get all predefined services grouped by category
router.get('/predefined-services', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Use stored procedure to get predefined services
    const result = await pool.request().execute('vendors.sp_GetPredefinedServices');
    
    // Check if table exists (first recordset indicates table existence)
    if (result.recordsets.length > 0 && result.recordsets[0][0]?.TableExists === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'PredefinedServices table does not exist in database' 
      });
    }
    
    // Services are in the second recordset
    const services = result.recordsets.length > 1 ? result.recordsets[1] : result.recordset;
    
    // Group services by category
    const servicesByCategory = {};
    services.forEach(service => {
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
      totalServices: services.length
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
    request.input('Category', sql.NVarChar(100), category);
    
    const result = await request.execute('vendors.sp_GetPredefinedServicesByCategory');
    
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

// ===== TRENDING VENDORS ROUTE =====
// Get trending vendors based on page views (last 7 days)
router.get('/trending', async (req, res) => {
  try {
    const { topN = 10, city = null } = req.query;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('City', sql.NVarChar(100), city)
      .input('Limit', sql.Int, parseInt(topN))
      .execute('vendors.sp_GetTrending');

    // Format vendors for frontend compatibility
    const vendors = await Promise.all(result.recordset.map(async (vendor) => {
      // Get images for each vendor
      let images = [];
      let featuredImage = null;
      try {
        const imageRequest = new sql.Request(pool);
        imageRequest.input('VendorProfileID', sql.Int, vendor.VendorProfileID);
        const imageResult = await imageRequest.execute('vendors.sp_GetImages');
        images = imageResult.recordset.map(img => ({
          imageId: img.ImageID,
          url: img.ImageURL || img.CloudinaryUrl,
          isPrimary: img.IsPrimary,
          displayOrder: img.DisplayOrder
        }));
        featuredImage = images.find(img => img.isPrimary) || images[0] || null;
      } catch (imgErr) {
        console.warn('Error fetching images for vendor:', vendor.VendorProfileID, imgErr.message);
      }

      return {
        id: vendor.VendorProfileID,
        vendorProfileId: vendor.VendorProfileID,
        VendorProfileID: vendor.VendorProfileID,
        name: vendor.BusinessName || vendor.DisplayName || '',
        BusinessName: vendor.BusinessName,
        type: vendor.PrimaryCategory || '',
        location: `${vendor.City || ''}${vendor.State ? ', ' + vendor.State : ''}`,
        description: vendor.BusinessDescription || '',
        price: vendor.MinPrice,
        startingPrice: vendor.MinPrice,
        priceLevel: vendor.PriceLevel,
        rating: vendor.AverageRating || 5.0,
        averageRating: vendor.AverageRating || 5.0,
        reviewCount: vendor.ReviewCount || 0,
        totalReviews: vendor.ReviewCount || 0,
        image: featuredImage?.url || vendor.LogoURL || '',
        featuredImage: featuredImage,
        images: images,
        isPremium: vendor.IsPremium || false,
        isEcoFriendly: vendor.IsEcoFriendly || false,
        isAwardWinning: vendor.IsAwardWinning || false,
        categories: vendor.Categories || vendor.PrimaryCategory || '',
        city: vendor.City || '',
        state: vendor.State || '',
        // Analytics data - this is what makes them "trending"
        viewCount7Days: vendor.ViewCount7Days || 0,
        profileViews: vendor.ViewCount7Days || 0,
        isTrending: true
      };
    }));

    res.json({
      success: true,
      vendors: vendors,
      period: 'Last 7 days',
      count: vendors.length,
      message: 'Trending vendors based on page views'
    });
  } catch (error) {
    console.error('Error fetching trending vendors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending vendors',
      details: error.message
    });
  }
});

// Simple in-memory cache for Google reviews (expires after 1 hour)
const googleReviewsCache = new Map();
const GOOGLE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Helper function to fetch Google reviews for a vendor
async function fetchGoogleReviews(googlePlaceId) {
  if (!googlePlaceId) return null;
  
  // Check cache first
  const cached = googleReviewsCache.get(googlePlaceId);
  if (cached && Date.now() - cached.timestamp < GOOGLE_CACHE_TTL) {
    return cached.data;
  }
  
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!googleApiKey) return null;
  
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: googlePlaceId,
        fields: 'rating,user_ratings_total',
        key: googleApiKey
      },
      timeout: 3000 // 3 second timeout
    });
    
    if (response.data.status === 'OK') {
      const data = {
        googleRating: response.data.result.rating || 0,
        googleReviewCount: response.data.result.user_ratings_total || 0
      };
      // Cache the result
      googleReviewsCache.set(googlePlaceId, { data, timestamp: Date.now() });
      return data;
    }
  } catch (err) {
    // Silently fail - Google reviews are optional
  }
  return null;
}

// Helper function to enhance vendor data with Cloudinary images
async function enhanceVendorWithImages(vendor, pool) {
  try {
    const imageRequest = new sql.Request(pool);
    imageRequest.input('VendorProfileID', sql.Int, vendor.VendorProfileID || vendor.id);
    
    const imageResult = await imageRequest.execute('vendors.sp_GetImages');

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
    
    // Fetch Google reviews if vendor has a googlePlaceId and no in-app reviews
    let googleData = {};
    if (vendor.googlePlaceId && (!vendor.totalReviews || vendor.totalReviews === 0)) {
      const googleReviews = await fetchGoogleReviews(vendor.googlePlaceId);
      if (googleReviews) {
        googleData = googleReviews;
      }
    }
    
    return {
      ...vendor,
      featuredImage: featuredImage,
      images: images,
      imageCount: images.length,
      ...googleData
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
      city, // City filter for location-based search
      minPrice, 
      maxPrice, 
      minRating,
      isPremium,
      isEcoFriendly,
      isAwardWinning,
      isLastMinute,
      isCertified,
      isInsured,
      isLocal,
      isMobile,
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
      region,
      priceLevel,
      // unified pricing-aware search params
      budgetType, // 'total' | 'per_person'
      pricingModel, // 'time_based' | 'fixed_based'
      fixedPricingType, // 'fixed_price' | 'per_attendee'
      // availability filters
      eventDate, // Date for availability checking (YYYY-MM-DD)
      dayOfWeek, // Day of week (e.g., 'Monday', 'Tuesday')
      startTime, // Start time (HH:MM format)
      endTime, // End time (HH:MM format)
      // New attribute filters
      instantBookingOnly, // Filter for instant booking vendors
      eventTypes, // Comma-separated event type IDs
      cultures, // Comma-separated culture IDs
      experienceRange, // Years of experience range (e.g., '5-10')
      serviceLocation, // Service location scope (e.g., 'Local', 'Regional')
      // NEW: Enhanced filter parameters
      minReviewCount, // Minimum number of reviews
      freshListingsDays, // Show vendors created within X days (e.g., 30)
      hasGoogleReviews, // Filter vendors with Google Place ID
      availabilityDate, // Filter by availability on specific date (YYYY-MM-DD)
      availabilityDayOfWeek, // Filter by day of week (0=Sunday, 1=Monday, etc.)
      featureIds, // Comma-separated feature IDs
      questionFilters, // JSON array of question filters [{questionId, answer}]
      // Discovery sections - when true, returns categorized sections from same query
      includeDiscoverySections
    } = req.query;

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    // Availability filters - format times properly
    const formatTime = (time) => {
      if (!time) return null;
      try {
        const timeStr = String(time).trim();
        const parts = timeStr.split(':');
        if (parts.length === 3) return timeStr;
        if (parts.length === 2) return `${timeStr}:00`;
        return null;
      } catch (err) {
        console.error('Time format error:', err);
        return null;
      }
    };
    
    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);
    
    let result;
    
    // Try stored procedure first, fall back to direct query if it fails
    try {
      const request = new sql.Request(pool);

      request.input('SearchTerm', sql.NVarChar(100), searchTerm || null);
      request.input('Category', sql.NVarChar(50), category || null);
      request.input('City', sql.NVarChar(100), city || null);
      request.input('MinPrice', sql.Decimal(10, 2), minPrice ? parseFloat(minPrice) : null);
      request.input('MaxPrice', sql.Decimal(10, 2), maxPrice ? parseFloat(maxPrice) : null);
      request.input('MinRating', sql.Decimal(2, 1), minRating ? parseFloat(minRating) : null);
      request.input('IsPremium', sql.Bit, isPremium === 'true' ? 1 : isPremium === 'false' ? 0 : null);
      request.input('IsEcoFriendly', sql.Bit, isEcoFriendly === 'true' ? 1 : isEcoFriendly === 'false' ? 0 : null);
      request.input('IsAwardWinning', sql.Bit, isAwardWinning === 'true' ? 1 : isAwardWinning === 'false' ? 0 : null);
      request.input('IsLastMinute', sql.Bit, isLastMinute === 'true' ? 1 : isLastMinute === 'false' ? 0 : null);
      request.input('IsCertified', sql.Bit, isCertified === 'true' ? 1 : isCertified === 'false' ? 0 : null);
      request.input('IsInsured', sql.Bit, isInsured === 'true' ? 1 : isInsured === 'false' ? 0 : null);
      request.input('IsLocal', sql.Bit, isLocal === 'true' ? 1 : isLocal === 'false' ? 0 : null);
      request.input('IsMobile', sql.Bit, isMobile === 'true' ? 1 : isMobile === 'false' ? 0 : null);
      request.input('Latitude', sql.Decimal(10, 8), latitude ? parseFloat(latitude) : null);
      request.input('Longitude', sql.Decimal(11, 8), longitude ? parseFloat(longitude) : null);
      request.input('RadiusMiles', sql.Int, radiusMiles ? parseInt(radiusMiles) : 25);
      request.input('PageNumber', sql.Int, pageNumber ? parseInt(pageNumber) : 1);
      request.input('PageSize', sql.Int, pageSize ? parseInt(pageSize) : 10);
      request.input('SortBy', sql.NVarChar(50), sortBy || 'recommended');
      request.input('BudgetType', sql.NVarChar(20), budgetType || null);
      request.input('PricingModelFilter', sql.NVarChar(20), pricingModel || null);
      request.input('FixedPricingTypeFilter', sql.NVarChar(20), fixedPricingType || null);
      request.input('Region', sql.NVarChar(50), region || null);
      request.input('PriceLevel', sql.NVarChar(10), priceLevel || null);
      request.input('EventDateRaw', sql.NVarChar(50), null);
      request.input('EventStartRaw', sql.NVarChar(20), null);
      request.input('EventEndRaw', sql.NVarChar(20), null);
      request.input('EventDate', sql.Date, eventDate ? new Date(eventDate) : null);
      request.input('DayOfWeek', sql.NVarChar(10), dayOfWeek || null);
      request.input('StartTime', sql.VarChar(8), formattedStartTime);
      request.input('EndTime', sql.VarChar(8), formattedEndTime);

      // Try enhanced stored procedure first
      try {
        const enhancedRequest = new sql.Request(pool);
        enhancedRequest.input('SearchTerm', sql.NVarChar(100), searchTerm || null);
        enhancedRequest.input('Category', sql.NVarChar(50), category || null);
        enhancedRequest.input('City', sql.NVarChar(100), city || null);
        enhancedRequest.input('Region', sql.NVarChar(50), region || null);
        enhancedRequest.input('MinPrice', sql.Decimal(10, 2), minPrice ? parseFloat(minPrice) : null);
        enhancedRequest.input('MaxPrice', sql.Decimal(10, 2), maxPrice ? parseFloat(maxPrice) : null);
        enhancedRequest.input('MinRating', sql.Decimal(2, 1), minRating ? parseFloat(minRating) : null);
        enhancedRequest.input('MinReviewCount', sql.Int, minReviewCount ? parseInt(minReviewCount) : null);
        enhancedRequest.input('IsPremium', sql.Bit, isPremium === 'true' ? 1 : null);
        enhancedRequest.input('IsEcoFriendly', sql.Bit, isEcoFriendly === 'true' ? 1 : null);
        enhancedRequest.input('IsAwardWinning', sql.Bit, isAwardWinning === 'true' ? 1 : null);
        enhancedRequest.input('IsLastMinute', sql.Bit, isLastMinute === 'true' ? 1 : null);
        enhancedRequest.input('IsCertified', sql.Bit, isCertified === 'true' ? 1 : null);
        enhancedRequest.input('IsInsured', sql.Bit, isInsured === 'true' ? 1 : null);
        enhancedRequest.input('IsLocal', sql.Bit, isLocal === 'true' ? 1 : null);
        enhancedRequest.input('IsMobile', sql.Bit, isMobile === 'true' ? 1 : null);
        enhancedRequest.input('InstantBookingOnly', sql.Bit, instantBookingOnly === 'true' ? 1 : null);
        enhancedRequest.input('FreshListingsDays', sql.Int, freshListingsDays ? parseInt(freshListingsDays) : null);
        enhancedRequest.input('HasGoogleReviews', sql.Bit, hasGoogleReviews === 'true' ? 1 : null);
        enhancedRequest.input('AvailabilityDate', sql.Date, availabilityDate ? new Date(availabilityDate) : null);
        enhancedRequest.input('AvailabilityDayOfWeek', sql.TinyInt, availabilityDayOfWeek ? parseInt(availabilityDayOfWeek) : null);
        enhancedRequest.input('Latitude', sql.Decimal(10, 8), latitude ? parseFloat(latitude) : null);
        enhancedRequest.input('Longitude', sql.Decimal(11, 8), longitude ? parseFloat(longitude) : null);
        enhancedRequest.input('RadiusMiles', sql.Int, radiusMiles ? parseInt(radiusMiles) : 25);
        enhancedRequest.input('EventTypeIDs', sql.NVarChar(500), eventTypes || null);
        enhancedRequest.input('CultureIDs', sql.NVarChar(500), cultures || null);
        enhancedRequest.input('QuestionFilters', sql.NVarChar(sql.MAX), questionFilters || null);
        enhancedRequest.input('FeatureIDs', sql.NVarChar(500), featureIds || null);
        enhancedRequest.input('ExperienceRange', sql.NVarChar(20), experienceRange || null);
        enhancedRequest.input('ServiceLocation', sql.NVarChar(50), serviceLocation || null);
        enhancedRequest.input('PageNumber', sql.Int, pageNumber ? parseInt(pageNumber) : 1);
        enhancedRequest.input('PageSize', sql.Int, pageSize ? parseInt(pageSize) : 10);
        enhancedRequest.input('SortBy', sql.NVarChar(50), sortBy || 'recommended');
        
        result = await enhancedRequest.execute('vendors.sp_SearchEnhanced');
        console.log('[vendors] Using sp_SearchEnhanced');
      } catch (enhancedError) {
        console.log('[vendors] sp_SearchEnhanced not available, falling back to sp_Search:', enhancedError.message);
        result = await request.execute('vendors.sp_Search');
      }
    } catch (spError) {
      console.error('sp_SearchVendors failed:', spError.message);
      throw spError;
    }
    
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
      isPremium: vendor.IsPremium,
      isEcoFriendly: vendor.IsEcoFriendly,
      isAwardWinning: vendor.IsAwardWinning,
      isLastMinute: vendor.IsLastMinute,
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
      longitude: vendor.Longitude || null,
      // For discovery sections
      createdAt: vendor.CreatedAt || null,
      avgResponseMinutes: vendor.AvgResponseMinutes || null,
      profileViews: vendor.ProfileViews || 0,
      // Google reviews data
      googlePlaceId: vendor.GooglePlaceId || vendor.GooglePlaceID || null,
      hasGoogleReviews: vendor.HasGoogleReviews || (vendor.GooglePlaceId ? true : false),
      // Vendor attributes for filtering
      instantBookingEnabled: vendor.InstantBookingEnabled || false,
      yearsOfExperienceRange: vendor.YearsOfExperienceRange || null,
      serviceLocationScope: vendor.ServiceLocationScope || null,
      // NEW: Enhanced filter fields
      isFreshListing: vendor.IsFreshListing || false,
      isCertified: vendor.IsCertified || false,
      isInsured: vendor.IsInsured || false,
      isMobile: vendor.IsMobile || false,
      yearsInBusiness: vendor.YearsInBusiness || null
    }));

    // Apply attribute-based filters (post-query filtering for attributes not in SP)
    if (instantBookingOnly === 'true') {
      formattedVendors = formattedVendors.filter(v => v.instantBookingEnabled);
    }
    if (experienceRange) {
      formattedVendors = formattedVendors.filter(v => v.yearsOfExperienceRange === experienceRange);
    }
    if (serviceLocation) {
      formattedVendors = formattedVendors.filter(v => v.serviceLocationScope === serviceLocation);
    }

    // Filter by event types if specified (requires additional query)
    if (eventTypes) {
      const eventTypeIds = eventTypes.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      console.log('[vendors] Event type filter - eventTypeIds:', eventTypeIds);
      if (eventTypeIds.length > 0) {
        // Ensure vendorIds are integers for proper SQL query
        const vendorIds = formattedVendors.map(v => parseInt(v.vendorProfileId || v.id)).filter(id => !isNaN(id) && id > 0);
        console.log('[vendors] Event type filter - vendorIds to check:', vendorIds);
        if (vendorIds.length > 0) {
          try {
            const eventTypeQuery = `
              SELECT DISTINCT VendorProfileID 
              FROM vendors.VendorEventTypes 
              WHERE EventTypeID IN (${eventTypeIds.join(',')})
              AND VendorProfileID IN (${vendorIds.join(',')})
            `;
            console.log('[vendors] Event type query:', eventTypeQuery);
            const etResult = await pool.request().query(eventTypeQuery);
            console.log('[vendors] Event type query result:', etResult.recordset);
            // Convert to Set of integers for proper comparison
            const matchingVendorIds = new Set(etResult.recordset.map(r => parseInt(r.VendorProfileID)));
            console.log('[vendors] Matching vendor IDs:', [...matchingVendorIds]);
            
            // Also check what's in VendorEventTypes table for debugging
            const debugQuery = `SELECT TOP 20 * FROM vendors.VendorEventTypes`;
            const debugResult = await pool.request().query(debugQuery);
            console.log('[vendors] DEBUG - VendorEventTypes table sample:', debugResult.recordset);
            
            // Use parseInt for comparison to avoid type mismatch
            formattedVendors = formattedVendors.filter(v => {
              const vid = parseInt(v.vendorProfileId || v.id);
              const matches = matchingVendorIds.has(vid);
              console.log('[vendors] Checking vendor', vid, 'matches:', matches);
              return matches;
            });
            console.log('[vendors] After event type filter - vendors remaining:', formattedVendors.length);
          } catch (etErr) {
            console.warn('Event type filtering failed:', etErr.message);
          }
        }
      }
    }

    // Filter by cultures if specified (requires additional query)
    if (cultures) {
      const cultureIds = cultures.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (cultureIds.length > 0) {
        const vendorIds = formattedVendors.map(v => parseInt(v.vendorProfileId || v.id)).filter(id => !isNaN(id) && id > 0);
        if (vendorIds.length > 0) {
          try {
            const cultureQuery = `
              SELECT DISTINCT VendorProfileID 
              FROM vendors.VendorCultures 
              WHERE CultureID IN (${cultureIds.join(',')})
              AND VendorProfileID IN (${vendorIds.join(',')})
            `;
            const cResult = await pool.request().query(cultureQuery);
            const matchingVendorIds = new Set(cResult.recordset.map(r => parseInt(r.VendorProfileID)));
            formattedVendors = formattedVendors.filter(v => matchingVendorIds.has(parseInt(v.vendorProfileId || v.id)));
          } catch (cErr) {
            console.warn('Culture filtering failed:', cErr.message);
          }
        }
      }
    }

    // Enhance with Cloudinary images if requested (default: true for better UX)
    if (includeImages !== 'false') {
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

    // Build discovery sections from the same query results if requested
    let discoverySections = null;
    if (includeDiscoverySections === 'true' && formattedVendors.length > 0) {
      discoverySections = [];
      
      // TRENDING VENDORS FIRST - sorted by combined score of bookings + favorites + reviews + profile views
      const trendingVendorsFirst = [...formattedVendors]
        .map(v => ({
          ...v,
          trendingScore: ((v.bookingCount || 0) * 3) + ((v.favoriteCount || 0) * 2) + ((v.totalReviews || 0) * 1) + ((v.profileViews || 0) * 1)
        }))
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, 20)
        .map(v => {
          // Show real analytics - prioritize profile views, then show position
          let badgeText;
          if (v.profileViews > 0) {
            badgeText = `${v.profileViews} view${v.profileViews !== 1 ? 's' : ''}`;
          } else {
            badgeText = 'Trending now';
          }
          return {
            ...v,
            analyticsBadge: badgeText
          };
        });
      // ALWAYS add trending section FIRST
      discoverySections.push({
        id: 'trending-vendors',
        title: 'Trending Vendors',
        description: 'Popular vendors based on page views and engagement',
        vendors: trendingVendorsFirst,
        showAnalyticsBadge: true,
        analyticsBadgeType: 'trending'
      });
      
      // Most Booked - sorted by booking count (only show vendors with actual bookings)
      const mostBookedVendors = [...formattedVendors]
        .filter(v => v.bookingCount && v.bookingCount > 0)
        .sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0))
        .slice(0, 20)
        .map(v => ({
          ...v,
          analyticsBadge: `${v.bookingCount} booking${v.bookingCount > 1 ? 's' : ''} this month`
        }));
      if (mostBookedVendors.length > 0) {
        discoverySections.push({
          id: 'most-booked',
          title: 'Most Booked',
          description: 'Vendors with the most bookings',
          vendors: mostBookedVendors,
          showAnalyticsBadge: true,
          analyticsBadgeType: 'bookings'
        });
      }
      
      // Quick Responders - show vendors with response time data
      // Include vendors with response times up to 24 hours (1440 minutes)
      let responsiveVendors = [...formattedVendors]
        .filter(v => v.avgResponseMinutes != null && v.avgResponseMinutes >= 0)
        .sort((a, b) => (a.avgResponseMinutes || 999) - (b.avgResponseMinutes || 999))
        .slice(0, 8)
        .map(v => {
          const mins = v.avgResponseMinutes;
          let responseText;
          if (mins === 0) {
            responseText = 'Replies instantly';
          } else if (mins < 60) {
            responseText = `Replies in ~${mins} min`;
          } else if (mins < 1440) {
            const hours = Math.round(mins / 60);
            responseText = `Replies in ~${hours} hr${hours > 1 ? 's' : ''}`;
          } else {
            responseText = 'Replies within a day';
          }
          return {
            ...v,
            analyticsBadge: responseText
          };
        });
      
      // Add Quick Responders section if we have vendors with response data
      if (responsiveVendors.length > 0) {
        discoverySections.push({
          id: 'quick-responders',
          title: 'Quick Responders',
          description: 'Vendors who reply fast to inquiries',
          vendors: responsiveVendors,
          showResponseTime: true,
          showAnalyticsBadge: true,
          analyticsBadgeType: 'response'
        });
      }
      
      // Top Rated - sorted by rating (show all vendors sorted by rating)
      const topRatedVendors = [...formattedVendors]
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, 20)
        .map(v => ({
          ...v,
          analyticsBadge: `${v.averageRating?.toFixed(1) || '5.0'} rating (${v.totalReviews || 0} reviews)`
        }));
      // ALWAYS add this section
      discoverySections.push({
        id: 'top-rated',
        title: 'Top Rated Vendors',
        description: 'Highest rated by customers',
        vendors: topRatedVendors,
        showAnalyticsBadge: true,
        analyticsBadgeType: 'rating'
      });
      
      // Premium Vendors
      const premiumVendors = formattedVendors
        .filter(v => v.isPremium)
        .slice(0, 20);
      if (premiumVendors.length > 0) {
        discoverySections.push({
          id: 'premium',
          title: 'Premium Vendors',
          description: 'Top-tier verified vendors',
          vendors: premiumVendors
        });
      }
      
      // Budget-Friendly - sorted by price low (show all vendors sorted by price)
      const budgetVendors = [...formattedVendors]
        .sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0))
        .slice(0, 20)
        .map(v => ({
          ...v,
          analyticsBadge: v.startingPrice ? `From $${v.startingPrice}` : 'Great value'
        }));
      // ALWAYS add this section
      discoverySections.push({
        id: 'budget-friendly',
        title: 'Budget-Friendly Options',
        description: 'Great value for your money',
        vendors: budgetVendors,
        showAnalyticsBadge: true,
        analyticsBadgeType: 'budget'
      });
      
      // Nearby - if location provided, sorted by distance
      if (latitude && longitude) {
        const nearbyVendors = [...formattedVendors]
          .filter(v => v.distanceMiles != null)
          .sort((a, b) => (a.distanceMiles || 999) - (b.distanceMiles || 999))
          .slice(0, 20)
          .map(v => ({
            ...v,
            // Send raw distance in miles - frontend will format with user's preferred unit
            analyticsBadgeDistanceMiles: v.distanceMiles,
            analyticsBadge: null // Will be formatted on frontend
          }));
        if (nearbyVendors.length > 0) {
          discoverySections.push({
            id: 'nearby',
            title: 'Vendors Near You',
            description: 'Closest to your location',
            vendors: nearbyVendors,
            showAnalyticsBadge: true,
            analyticsBadgeType: 'distance'
          });
        }
      }
      
      // Recently Added - vendors created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentlyAddedVendors = [...formattedVendors]
        .filter(v => v.createdAt && new Date(v.createdAt) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20);
      if (recentlyAddedVendors.length > 0) {
        discoverySections.push({
          id: 'recently-added',
          title: 'New Vendors',
          description: 'Recently joined our platform',
          vendors: recentlyAddedVendors
        });
      }
      
    }

    // Use SP count for total
    const filteredCount = result.recordset.length > 0 ? result.recordset[0].TotalCount : formattedVendors.length;

    res.json({
      success: true,
      vendors: formattedVendors,
      totalCount: filteredCount,
      pageNumber: parseInt(pageNumber) || 1,
      pageSize: parseInt(pageSize) || 10,
      hasImages: includeImages !== 'false',
      cityFilter: city || null,
      // Discovery sections - only included when requested
      ...(discoverySections && { discoverySections, totalSections: discoverySections.length })
    });

  } catch (err) {
    console.error('Database error:', err);
    // Return empty vendors array on error instead of 500
    res.json({ 
      success: true,
      vendors: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 10,
      hasImages: false,
      cityFilter: null
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

    // Use sp_SearchVendors stored procedure for map search
    const request = new sql.Request(pool);
    
    request.input('SearchTerm', sql.NVarChar(100), null);
    request.input('Category', sql.NVarChar(50), category || null);
    request.input('City', sql.NVarChar(100), null);
    request.input('MinPrice', sql.Decimal(10, 2), minPrice ? parseFloat(minPrice) : null);
    request.input('MaxPrice', sql.Decimal(10, 2), maxPrice ? parseFloat(maxPrice) : null);
    request.input('MinRating', sql.Decimal(2, 1), null);
    request.input('IsPremium', sql.Bit, null);
    request.input('IsEcoFriendly', sql.Bit, null);
    request.input('IsAwardWinning', sql.Bit, null);
    request.input('IsLastMinute', sql.Bit, null);
    request.input('IsCertified', sql.Bit, null);
    request.input('IsInsured', sql.Bit, null);
    request.input('IsLocal', sql.Bit, null);
    request.input('IsMobile', sql.Bit, null);
    request.input('Latitude', sql.Decimal(10, 8), eventLatitude);
    request.input('Longitude', sql.Decimal(11, 8), eventLongitude);
    request.input('RadiusMiles', sql.Int, 100); // Larger radius for map view
    request.input('PageNumber', sql.Int, 1);
    request.input('PageSize', sql.Int, 100); // Get more results for map
    request.input('SortBy', sql.NVarChar(50), prioritizeEventLocation === 'true' ? 'nearest' : 'recommended');
    request.input('BudgetType', sql.NVarChar(20), null);
    request.input('PricingModelFilter', sql.NVarChar(20), null);
    request.input('FixedPricingTypeFilter', sql.NVarChar(20), null);
    request.input('Region', sql.NVarChar(50), null);
    request.input('PriceLevel', sql.NVarChar(10), null);
    request.input('EventDateRaw', sql.NVarChar(50), eventDate || null);
    request.input('EventStartRaw', sql.NVarChar(20), eventStartTime || null);
    request.input('EventEndRaw', sql.NVarChar(20), eventEndTime || null);
    request.input('EventDate', sql.Date, eventDate ? new Date(eventDate) : null);
    request.input('DayOfWeek', sql.NVarChar(10), null);
    request.input('StartTime', sql.VarChar(8), eventStartTime || null);
    request.input('EndTime', sql.VarChar(8), eventEndTime || null);

    const result = await request.execute('vendors.sp_Search');
    
    const vendors = result.recordset.map(vendor => ({
      id: vendor.VendorProfileID,
      vendorProfileId: vendor.VendorProfileID,
      name: vendor.BusinessName || '',
      description: vendor.BusinessDescription || '',
      address: vendor.Address || '',
      city: vendor.City || '',
      state: vendor.State || '',
      country: vendor.Country || '',
      postalCode: vendor.PostalCode || '',
      latitude: parseFloat(vendor.Latitude) || null,
      longitude: parseFloat(vendor.Longitude) || null,
      price: vendor.MinPrice,
      priceLevel: vendor.PriceLevel,
      rating: vendor.AverageRating || 0,
      reviewCount: vendor.ReviewCount || 0,
      isPremium: vendor.IsPremium || false,
      isEcoFriendly: vendor.IsEcoFriendly || false,
      isAwardWinning: vendor.IsAwardWinning || false,
      categories: vendor.Categories || '',
      distanceFromEvent: vendor.DistanceMiles ? parseFloat(vendor.DistanceMiles).toFixed(2) : null,
      fullAddress: `${vendor.Address || ''}, ${vendor.City || ''}, ${vendor.State || ''} ${vendor.PostalCode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
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

// Search vendors by multiple categories and return sectioned results
router.get('/search-by-categories', async (req, res) => {
  try {
    const {
      categories,           // comma-separated list, e.g. "Music/DJ,Catering"
      category,             // single category fallback
      city,                 // City filter for location-based search
      minPrice,
      maxPrice,
      minRating,
      isPremium,
      isEcoFriendly,
      isAwardWinning,
      isLastMinute,
      isCertified,
      isInsured,
      isLocal,
      isMobile,
      latitude,
      longitude,
      radiusMiles,
      pageNumber,
      pageSize,
      sortBy,
      includeImages,
      region,
      priceLevel,
      budgetType,           // 'total' | 'per_person'
      pricingModel,         // 'time_based' | 'fixed_based'
      fixedPricingType,     // 'fixed_price' | 'per_attendee'
      // availability filters
      eventDate,            // Date for availability checking (YYYY-MM-DD)
      dayOfWeek,            // Day of week (e.g., 'Monday', 'Tuesday')
      startTime,            // Start time (HH:MM format)
      endTime,              // End time (HH:MM format)
      // attribute filters
      instantBookingOnly,   // Filter for instant booking vendors
      eventTypes,           // Comma-separated event type IDs
      cultures,             // Comma-separated culture IDs
      includeDiscoverySections // Include discovery sections in response
    } = req.query;

    // Normalize incoming categories into an array
    let categoryList = [];
    if (categories && typeof categories === 'string') {
      categoryList = categories
        .split(',')
        .map(s => {
          try { return decodeURIComponent(s).trim(); } catch { return s.trim(); }
        })
        .filter(Boolean);
    } else if (category && typeof category === 'string') {
      try { categoryList = [decodeURIComponent(category).trim()]; }
      catch { categoryList = [category.trim()]; }
    }

    // Expand combined labels like "Music/DJ" and map friendly labels to DB values
    if (categoryList.length > 0) {
      const expanded = [];
      for (let raw of categoryList) {
        const label = (raw || '').trim();
        if (!label) continue;
        const parts = label.includes('/') ? label.split('/').map(s => s.trim()).filter(Boolean) : [label];
        for (let p of parts) {
          const lower = p.toLowerCase();
          if (lower === 'video') { expanded.push('Videography'); continue; }
          if (lower === 'photo') { expanded.push('Photo'); expanded.push('Photography'); continue; }
          if (lower === 'venues') { expanded.push('Venue'); expanded.push('Hotel'); continue; }
          if (lower === 'decorations') { expanded.push('Decor'); expanded.push('Florist'); continue; }
          expanded.push(p);
        }
      }
      // Deduplicate and replace categoryList
      categoryList = Array.from(new Set(expanded));
    }

    if (categoryList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide 'category' or 'categories' query parameter"
      });
    }

    const pool = await poolPromise;

    // Helper to fetch one category using sp_SearchVendors and map results like the main /vendors endpoint
    async function fetchCategory(cat) {
      const request = new sql.Request(pool);
      request.input('SearchTerm', sql.NVarChar(100), null);
      request.input('Category', sql.NVarChar(50), cat);
      request.input('City', sql.NVarChar(100), city || null); // Pass city to stored procedure
      request.input('MinPrice', sql.Decimal(10, 2), minPrice ? parseFloat(minPrice) : null);
      request.input('MaxPrice', sql.Decimal(10, 2), maxPrice ? parseFloat(maxPrice) : null);
      request.input('MinRating', sql.Decimal(2, 1), minRating ? parseFloat(minRating) : null);
      request.input('IsPremium', sql.Bit, isPremium === 'true' ? 1 : isPremium === 'false' ? 0 : null);
      request.input('IsEcoFriendly', sql.Bit, isEcoFriendly === 'true' ? 1 : isEcoFriendly === 'false' ? 0 : null);
      request.input('IsAwardWinning', sql.Bit, isAwardWinning === 'true' ? 1 : isAwardWinning === 'false' ? 0 : null);
      request.input('IsLastMinute', sql.Bit, isLastMinute === 'true' ? 1 : isLastMinute === 'false' ? 0 : null);
      request.input('IsCertified', sql.Bit, isCertified === 'true' ? 1 : isCertified === 'false' ? 0 : null);
      request.input('IsInsured', sql.Bit, isInsured === 'true' ? 1 : isInsured === 'false' ? 0 : null);
      request.input('IsLocal', sql.Bit, isLocal === 'true' ? 1 : isLocal === 'false' ? 0 : null);
      request.input('IsMobile', sql.Bit, isMobile === 'true' ? 1 : isMobile === 'false' ? 0 : null);
      request.input('Latitude', sql.Decimal(10, 8), latitude ? parseFloat(latitude) : null);
      request.input('Longitude', sql.Decimal(11, 8), longitude ? parseFloat(longitude) : null);
      request.input('RadiusMiles', sql.Int, radiusMiles ? parseInt(radiusMiles) : 25);
      request.input('PageNumber', sql.Int, pageNumber ? parseInt(pageNumber) : 1);
      request.input('PageSize', sql.Int, pageSize ? parseInt(pageSize) : 10);
      request.input('SortBy', sql.NVarChar(50), sortBy || 'recommended');
      request.input('BudgetType', sql.NVarChar(20), budgetType || null);
      request.input('PricingModelFilter', sql.NVarChar(20), pricingModel || null);
      request.input('FixedPricingTypeFilter', sql.NVarChar(20), fixedPricingType || null);
      request.input('Region', sql.NVarChar(50), region || null);
      request.input('PriceLevel', sql.NVarChar(10), priceLevel || null);
      request.input('EventDateRaw', sql.NVarChar(50), null); // Legacy parameter
      request.input('EventStartRaw', sql.NVarChar(20), null); // Legacy parameter
      request.input('EventEndRaw', sql.NVarChar(20), null); // Legacy parameter
      // Availability filters
      request.input('EventDate', sql.Date, eventDate ? new Date(eventDate) : null);
      request.input('DayOfWeek', sql.NVarChar(10), dayOfWeek || null);
      request.input('StartTime', sql.Time, startTime || null);
      request.input('EndTime', sql.Time, endTime || null);

      const r = await request.execute('vendors.sp_Search');

      let vendors = r.recordset.map(vendor => ({
        id: vendor.id,
        vendorProfileId: vendor.VendorProfileID || vendor.id,
        name: vendor.name || '',
        type: vendor.type || '',
        location: vendor.location || '',
        description: vendor.description || '',
        price: vendor.price,
        startingPrice: vendor.MinPriceNumeric ?? vendor.MinPrice,
        startingServiceName: vendor.StartingServiceName || vendor.MinServiceName || null,
        priceLevel: vendor.priceLevel,
        rating: vendor.rating,
        reviewCount: vendor.ReviewCount,
        averageRating: vendor.rating ? parseFloat(vendor.rating) : null,
        totalReviews: vendor.ReviewCount ?? 0,
        favoriteCount: vendor.FavoriteCount,
        bookingCount: vendor.BookingCount,
        image: vendor.image || '',
        isPremium: vendor.IsPremium,
        isEcoFriendly: vendor.IsEcoFriendly,
        isAwardWinning: vendor.IsAwardWinning,
        isLastMinute: vendor.IsLastMinute,
        region: vendor.Region || '',
        distanceMiles: vendor.DistanceMiles,
        categories: vendor.Categories || '',
        services: vendor.services ? JSON.parse(vendor.services) : [],
        reviews: vendor.reviews ? JSON.parse(vendor.reviews) : [],
        address: vendor.Address || '',
        city: vendor.City || '',
        state: vendor.State || '',
        country: vendor.Country || '',
        postalCode: vendor.PostalCode || '',
        latitude: vendor.Latitude || null,
        longitude: vendor.Longitude || null,
        // For discovery sections
        createdAt: vendor.CreatedAt || null,
        avgResponseMinutes: vendor.AvgResponseMinutes || null,
        profileViews: vendor.ProfileViews || 0,
        // Google reviews data
        googlePlaceId: vendor.GooglePlaceId || vendor.GooglePlaceID || null
      }));

      // City filtering is now handled by the stored procedure
      // No post-query filtering needed

      if (includeImages !== 'false') {
        const batchSize = 5;
        const enhanced = [];
        for (let i = 0; i < vendors.length; i += batchSize) {
          const batch = vendors.slice(i, i + batchSize);
          const eb = await Promise.all(batch.map(v => enhanceVendorWithImages(v, pool)));
          enhanced.push(...eb);
        }
        vendors = enhanced;
      }

      return {
        category: cat,
        vendors,
        totalCount: r.recordset.length > 0 ? r.recordset[0].TotalCount : vendors.length
      };
    }

    const sections = await Promise.all(categoryList.map(fetchCategory));

    // Combine all vendors from all sections for discovery sections
    let allVendors = sections.flatMap(s => s.vendors || []);
    
    // Build discovery sections if requested
    let discoverySections = null;
    if (includeDiscoverySections === 'true' && allVendors.length > 0) {
      discoverySections = [];
      
      // TRENDING VENDORS FIRST - sorted by combined score
      const trendingVendorsFirst = [...allVendors]
        .map(v => ({
          ...v,
          trendingScore: ((v.bookingCount || 0) * 3) + ((v.favoriteCount || 0) * 2) + ((v.totalReviews || 0) * 1) + ((v.profileViews || 0) * 1)
        }))
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, 20)
        .map(v => {
          let badgeText;
          if (v.profileViews > 0) {
            badgeText = `${v.profileViews} view${v.profileViews !== 1 ? 's' : ''}`;
          } else {
            badgeText = 'Trending now';
          }
          return { ...v, analyticsBadge: badgeText };
        });
      discoverySections.push({
        id: 'trending-vendors',
        title: 'Trending Vendors',
        description: 'Popular vendors based on page views and engagement',
        vendors: trendingVendorsFirst,
        showAnalyticsBadge: true,
        analyticsBadgeType: 'trending'
      });
      
      // Most Booked - sorted by booking count (only show vendors with actual bookings)
      const mostBookedVendors = [...allVendors]
        .filter(v => v.bookingCount && v.bookingCount > 0)
        .sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0))
        .slice(0, 20)
        .map(v => ({
          ...v,
          analyticsBadge: `${v.bookingCount} booking${v.bookingCount > 1 ? 's' : ''} this month`
        }));
      if (mostBookedVendors.length > 0) {
        discoverySections.push({
          id: 'most-booked',
          title: 'Most Booked',
          description: 'Vendors with the most bookings',
          vendors: mostBookedVendors,
          showAnalyticsBadge: true,
          analyticsBadgeType: 'bookings'
        });
      }
      
      // Quick Responders - show vendors with response time data
      // Include vendors with response times up to 24 hours (1440 minutes)
      let responsiveVendors = [...allVendors]
        .filter(v => v.avgResponseMinutes != null && v.avgResponseMinutes >= 0)
        .sort((a, b) => (a.avgResponseMinutes || 999) - (b.avgResponseMinutes || 999))
        .slice(0, 8)
        .map(v => {
          const mins = v.avgResponseMinutes;
          let responseText;
          if (mins === 0) {
            responseText = 'Replies instantly';
          } else if (mins < 60) {
            responseText = `Replies in ~${mins} min`;
          } else if (mins < 1440) {
            const hours = Math.round(mins / 60);
            responseText = `Replies in ~${hours} hr${hours > 1 ? 's' : ''}`;
          } else {
            responseText = 'Replies within a day';
          }
          return { ...v, analyticsBadge: responseText };
        });
      
      // Add Quick Responders section if we have vendors with response data
      if (responsiveVendors.length > 0) {
        discoverySections.push({
          id: 'quick-responders',
          title: 'Quick Responders',
          description: 'Vendors who reply fast to inquiries',
          vendors: responsiveVendors,
          showResponseTime: true,
          showAnalyticsBadge: true,
          analyticsBadgeType: 'response'
        });
      }
      
      // Top Rated - sorted by rating (show all vendors sorted by rating)
      const topRatedVendors = [...allVendors]
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, 20)
        .map(v => ({
          ...v,
          analyticsBadge: `${v.averageRating?.toFixed(1) || '5.0'} rating (${v.totalReviews || 0} reviews)`
        }));
      // ALWAYS add this section
      discoverySections.push({
        id: 'top-rated',
        title: 'Top Rated Vendors',
        description: 'Highest rated by customers',
        vendors: topRatedVendors,
        showAnalyticsBadge: true,
        analyticsBadgeType: 'rating'
      });
      
      // Premium Vendors
      const premiumVendors = allVendors
        .filter(v => v.isPremium)
        .slice(0, 20);
      if (premiumVendors.length > 0) {
        discoverySections.push({
          id: 'premium',
          title: 'Premium Vendors',
          description: 'Top-tier verified vendors',
          vendors: premiumVendors
        });
      }
      
      // Budget-Friendly - sorted by price low (show all vendors sorted by price)
      const budgetVendors = [...allVendors]
        .sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0))
        .slice(0, 20)
        .map(v => ({
          ...v,
          analyticsBadge: v.startingPrice ? `From $${v.startingPrice}` : 'Great value'
        }));
      // ALWAYS add this section
      discoverySections.push({
        id: 'budget-friendly',
        title: 'Budget-Friendly Options',
        description: 'Great value for your money',
        vendors: budgetVendors,
        showAnalyticsBadge: true,
        analyticsBadgeType: 'budget'
      });
      
      // Nearby - if location provided, sorted by distance
      if (latitude && longitude) {
        const nearbyVendors = [...allVendors]
          .filter(v => v.distanceMiles != null)
          .sort((a, b) => (a.distanceMiles || 999) - (b.distanceMiles || 999))
          .slice(0, 20)
          .map(v => ({
            ...v,
            // Send raw distance in miles - frontend will format with user's preferred unit
            analyticsBadgeDistanceMiles: v.distanceMiles,
            analyticsBadge: null // Will be formatted on frontend
          }));
        if (nearbyVendors.length > 0) {
          discoverySections.push({
            id: 'nearby',
            title: 'Vendors Near You',
            description: 'Closest to your location',
            vendors: nearbyVendors,
            showAnalyticsBadge: true,
            analyticsBadgeType: 'distance'
          });
        }
      }
    }

    res.json({
      success: true,
      sections: sections,
      categories: categoryList,
      // Include total filtered count for the filter modal preview
      totalCount: allVendors.length,
      // Discovery sections - only included when requested
      ...(discoverySections && { discoverySections, totalSections: discoverySections.length })
    });

  } catch (err) {
    console.error('search-by-categories error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search vendors by categories',
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
    request.input('BusinessDescription', sql.NVarChar(sql.MAX), description || '');
    request.input('BusinessPhone', sql.NVarChar(20), businessPhone || phone || '');
    request.input('Website', sql.NVarChar(255), website || '');
    request.input('YearsInBusiness', sql.Int, yearsInBusiness ? parseInt(yearsInBusiness) : null);
    request.input('Address', sql.NVarChar(255), address || '');
    
    const [city, state] = address ? address.split(',').map(s => s.trim()) : ['', ''];
    request.input('City', sql.NVarChar(100), city || '');
    request.input('State', sql.NVarChar(50), state || '');
    request.input('Country', sql.NVarChar(50), country || 'USA');
    request.input('PostalCode', sql.NVarChar(20), postalCode || '');
    
    request.input('Categories', sql.NVarChar(sql.MAX), JSON.stringify(categoriesData));
    request.input('Services', sql.NVarChar(sql.MAX), JSON.stringify(servicesData));
    
    const result = await request.execute('vendors.sp_RegisterVendor');
    
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
            serviceRequest.input('VendorDescription', sql.NVarChar(sql.MAX), predefinedService.vendorDescription || '');
            
            await serviceRequest.execute('vendors.sp_InsertPredefinedService');
          } catch (serviceError) {
            console.error(`Error adding predefined service ${predefinedService.id}:`, serviceError);
            // Continue with other services even if one fails
          }
        }
      }
      
      // Send email notification to admin about new vendor application
      try {
        await notifyAdminOfVendorApplication(
          result.recordset[0].UserID,
          vendorProfileId,
          {
            businessName: businessName,
            businessEmail: null, // Will be fetched from user record
            businessPhone: businessPhone || phone,
            category: Array.isArray(categoriesData) ? categoriesData.join(', ') : category
          }
        );
      } catch (emailErr) {
        console.error('Failed to send vendor application notification:', emailErr.message);
        // Don't fail the registration if email fails
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

// Create or update vendor profile (for onboarding flow)
router.post('/profile', async (req, res) => {
  try {
    const {
      userId,
      businessName,
      displayName,
      businessDescription,
      businessPhone,
      website,
      yearsInBusiness,
      address,
      city,
      state,
      country,
      postalCode,
      categories,
      serviceAreas
    } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!businessName || !displayName || !businessPhone || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: businessName, displayName, businessPhone, city, state'
      });
    }

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    // Check if vendor profile already exists
    const checkRequest = new sql.Request(pool);
    checkRequest.input('UserID', sql.Int, parseInt(userId));
    const checkResult = await checkRequest.execute('vendors.sp_CheckProfileExists');

    let vendorProfileId;

    if (checkResult.recordset.length > 0) {
      // Update existing profile
      vendorProfileId = checkResult.recordset[0].VendorProfileID;
      
      const updateRequest = new sql.Request(pool);
      updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      updateRequest.input('BusinessName', sql.NVarChar(100), businessName);
      updateRequest.input('DisplayName', sql.NVarChar(100), displayName);
      updateRequest.input('BusinessDescription', sql.NVarChar(sql.MAX), businessDescription || '');
      updateRequest.input('BusinessPhone', sql.NVarChar(20), businessPhone);
      updateRequest.input('Website', sql.NVarChar(255), website || null);
      updateRequest.input('YearsInBusiness', sql.Int, parseInt(yearsInBusiness) || 1);
      updateRequest.input('Address', sql.NVarChar(255), address || null);
      updateRequest.input('City', sql.NVarChar(100), city);
      updateRequest.input('State', sql.NVarChar(50), state);
      updateRequest.input('Country', sql.NVarChar(50), country || 'Canada');
      updateRequest.input('PostalCode', sql.NVarChar(20), postalCode || null);

      await updateRequest.execute('vendors.sp_UpdateProfile');

    } else {
      // Create new profile using sp_RegisterVendor
      const createRequest = new sql.Request(pool);
      createRequest.input('UserID', sql.Int, parseInt(userId));
      createRequest.input('BusinessName', sql.NVarChar(100), businessName);
      createRequest.input('DisplayName', sql.NVarChar(100), displayName);
      createRequest.input('BusinessDescription', sql.NVarChar(sql.MAX), businessDescription || '');
      createRequest.input('BusinessPhone', sql.NVarChar(20), businessPhone);
      createRequest.input('Website', sql.NVarChar(255), website || null);
      createRequest.input('YearsInBusiness', sql.Int, parseInt(yearsInBusiness) || 1);
      createRequest.input('Address', sql.NVarChar(255), address || null);
      createRequest.input('City', sql.NVarChar(100), city);
      createRequest.input('State', sql.NVarChar(50), state);
      createRequest.input('Country', sql.NVarChar(50), country || 'Canada');
      createRequest.input('PostalCode', sql.NVarChar(20), postalCode || null);
      createRequest.input('Categories', sql.NVarChar(sql.MAX), JSON.stringify(categories || []));
      createRequest.input('Services', sql.NVarChar(sql.MAX), JSON.stringify([]));

      const result = await createRequest.execute('vendors.sp_RegisterVendor');
      
      if (!result.recordset[0].Success) {
        throw new Error('Failed to create vendor profile');
      }
      
      vendorProfileId = result.recordset[0].VendorProfileID;
    }

    // Update categories if provided - first one is primary
    if (categories && categories.length > 0) {
      // Delete existing categories
      const deleteCategoriesRequest = new sql.Request(pool);
      deleteCategoriesRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteCategoriesRequest.execute('vendors.sp_DeleteCategories');

      // Insert new categories - first one is primary
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const categoryRequest = new sql.Request(pool);
        categoryRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        categoryRequest.input('Category', sql.NVarChar(50), category);
        categoryRequest.input('IsPrimary', sql.Bit, i === 0 ? 1 : 0);
        
        await categoryRequest.execute('vendors.sp_InsertCategoryByName');
      }
    }

    // Update service areas if provided
    if (serviceAreas && serviceAreas.length > 0) {
      // Delete existing service areas
      const deleteAreasRequest = new sql.Request(pool);
      deleteAreasRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteAreasRequest.execute('vendors.sp_DeleteServiceAreas');

      // Insert new service areas
      for (const area of serviceAreas) {
        const areaRequest = new sql.Request(pool);
        areaRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        areaRequest.input('AreaName', sql.NVarChar(100), area);
        
        await areaRequest.execute('vendors.sp_InsertServiceArea');
      }
    }

    // Update user to be a vendor
    const updateUserRequest = new sql.Request(pool);
    updateUserRequest.input('UserID', sql.Int, parseInt(userId));
    await updateUserRequest.execute('vendors.sp_SetUserAsVendor');

    // Handle services if provided
    if (services && services.length > 0) {
      for (const service of services) {
        try {
          const serviceRequest = new sql.Request(pool);
          serviceRequest.input('VendorProfileID', sql.Int, vendorProfileId);
          serviceRequest.input('CategoryName', sql.NVarChar(50), categories[0] || 'General');
          serviceRequest.input('ServiceName', sql.NVarChar(100), service.name);
          serviceRequest.input('ServiceDescription', sql.NVarChar(sql.MAX), service.description || '');
          serviceRequest.input('Price', sql.Decimal(10, 2), service.price || 0);
          serviceRequest.input('DurationMinutes', sql.Int, service.duration || 60);
          serviceRequest.input('MaxAttendees', sql.Int, null);
          serviceRequest.input('DepositPercentage', sql.Decimal(5, 2), depositPercentage || null);
          serviceRequest.input('CancellationPolicy', sql.NVarChar(sql.MAX), cancellationPolicy || null);

          await serviceRequest.execute('vendors.sp_UpsertService');
        } catch (serviceError) {
          console.error('Error adding service:', serviceError);
        }
      }
    }

    // Handle business hours if provided
    if (businessHours) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of days) {
        if (businessHours[day]) {
          try {
            const hoursRequest = new sql.Request(pool);
            hoursRequest.input('VendorProfileID', sql.Int, vendorProfileId);
            hoursRequest.input('DayOfWeek', sql.NVarChar(10), day.charAt(0).toUpperCase() + day.slice(1));
            hoursRequest.input('IsAvailable', sql.Bit, businessHours[day].isAvailable);
            hoursRequest.input('OpenTime', sql.Time, businessHours[day].openTime + ':00');
            hoursRequest.input('CloseTime', sql.Time, businessHours[day].closeTime + ':00');

            await hoursRequest.execute('vendors.sp_UpsertBusinessHours');
          } catch (hoursError) {
            console.error('Error setting business hours:', hoursError);
          }
        }
      }
    }

    // Handle FAQs if provided
    if (faqs && faqs.length > 0) {
      for (const faq of faqs) {
        try {
          const faqRequest = new sql.Request(pool);
          faqRequest.input('VendorProfileID', sql.Int, vendorProfileId);
          faqRequest.input('Question', sql.NVarChar(500), faq.question);
          faqRequest.input('Answer', sql.NVarChar(sql.MAX), faq.answer);

          await faqRequest.execute('vendors.sp_InsertFAQ');
        } catch (faqError) {
          console.error('Error adding FAQ:', faqError);
        }
      }
    }

    // Update additional profile fields using stored procedure
    if (licenseNumber || insuranceVerified !== undefined) {
      const updateDetailsRequest = new sql.Request(pool);
      updateDetailsRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      updateDetailsRequest.input('LicenseNumber', sql.NVarChar(100), licenseNumber || null);
      updateDetailsRequest.input('InsuranceVerified', sql.Bit, insuranceVerified || false);
      updateDetailsRequest.input('Awards', sql.NVarChar(sql.MAX), null);
      updateDetailsRequest.input('Certifications', sql.NVarChar(sql.MAX), certifications || null);
      updateDetailsRequest.input('IsEcoFriendly', sql.Bit, false);
      updateDetailsRequest.input('IsPremium', sql.Bit, false);

      await updateDetailsRequest.execute('vendors.sp_UpdateVerification');
    }

    res.status(200).json({
      success: true,
      message: 'Vendor profile created successfully',
      vendorProfileId: vendorProfileId
    });

  } catch (err) {
    console.error('Vendor profile creation error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create vendor profile',
      error: err.message
    });
  }
});

// Complete vendor onboarding - handles all onboarding data in one request
// Supports partial saves - users can save progress at any step
router.post('/onboarding', async (req, res) => {
  try {
    const {
      userId,
      primaryCategory,
      categories,
      businessName,
      displayName,
      businessDescription,
      yearsInBusiness,
      tagline,
      priceRange,
      profileLogo,
      businessPhone,
      website,
      email,
      address,
      city,
      province,
      state,
      country,
      postalCode,
      latitude,
      longitude,
      serviceAreas,
      selectedServices,
      businessHours,
      timezone,
      photoURLs,
      socialMedia,
      selectedFilters,
      cancellationPolicy,
      depositPercentage,
      paymentTerms,
      faqs,
      googlePlaceId
    } = req.body;

    // Validation - only userId is truly required
    // All other fields are optional to allow partial saves at any step
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Use empty string for required DB fields if not provided
    // This allows users to save progress at any step (e.g., just categories)
    const effectiveBusinessName = businessName || '';
    const effectiveDisplayName = displayName || businessName || '';
    const effectiveBusinessPhone = businessPhone || '';

    // Handle profileLogo - if it's a base64 string, upload to Cloudinary first
    let profileLogoUrl = null;
    if (profileLogo) {
      if (profileLogo.startsWith('data:image')) {
        // It's a base64 image, upload to Cloudinary
        try {
          const uploadResult = await cloudinaryService.uploadImage(profileLogo, {
            folder: 'venuevue/vendor-logos',
            transformation: [
              { width: 400, height: 400, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          });
          profileLogoUrl = uploadResult.secure_url;
        } catch (uploadError) {
          console.error('Error uploading profile logo to Cloudinary:', uploadError);
          // Continue without the logo rather than failing the whole request
        }
      } else if (profileLogo.startsWith('http')) {
        // It's already a URL, use it directly
        profileLogoUrl = profileLogo;
      }
    }

    const pool = await poolPromise;
    
    if (!pool.connected) {
      throw new Error('Database connection not established');
    }

    // Check if vendor profile already exists
    const checkRequest = new sql.Request(pool);
    checkRequest.input('UserID', sql.Int, parseInt(userId));
    const checkResult = await checkRequest.execute('vendors.sp_CheckProfileExists');

    let vendorProfileId;
    // Remove duplicates from categories array
    const allCategories = [...new Set([primaryCategory, ...(categories || [])].filter(Boolean))];

    if (checkResult.recordset.length > 0) {
      // Update existing profile
      vendorProfileId = checkResult.recordset[0].VendorProfileID;
      
      const updateRequest = new sql.Request(pool);
      updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      updateRequest.input('BusinessName', sql.NVarChar(100), effectiveBusinessName);
      updateRequest.input('DisplayName', sql.NVarChar(100), effectiveDisplayName);
      updateRequest.input('BusinessDescription', sql.NVarChar(sql.MAX), businessDescription || '');
      updateRequest.input('BusinessPhone', sql.NVarChar(20), effectiveBusinessPhone);
      updateRequest.input('Website', sql.NVarChar(255), website || null);
      updateRequest.input('YearsInBusiness', sql.Int, parseInt(yearsInBusiness) || 1);
      updateRequest.input('Address', sql.NVarChar(255), address || null);
      updateRequest.input('City', sql.NVarChar(100), city || '');
      updateRequest.input('State', sql.NVarChar(50), state || province || '');
      updateRequest.input('Country', sql.NVarChar(50), country || 'Canada');
      updateRequest.input('PostalCode', sql.NVarChar(20), postalCode || null);
      updateRequest.input('Latitude', sql.Decimal(10, 8), latitude || null);
      updateRequest.input('Longitude', sql.Decimal(11, 8), longitude || null);
      updateRequest.input('Tagline', sql.NVarChar(255), tagline || null);
      updateRequest.input('PriceLevel', sql.NVarChar(20), priceRange || null);
      updateRequest.input('ProfileLogo', sql.NVarChar(255), profileLogoUrl || null);

      await updateRequest.execute('vendors.sp_UpdateProfileExtended');

    } else {
      // Create new profile
      const createRequest = new sql.Request(pool);
      createRequest.input('UserID', sql.Int, parseInt(userId));
      createRequest.input('BusinessName', sql.NVarChar(100), effectiveBusinessName);
      createRequest.input('DisplayName', sql.NVarChar(100), effectiveDisplayName);
      createRequest.input('BusinessDescription', sql.NVarChar(sql.MAX), businessDescription || '');
      createRequest.input('BusinessPhone', sql.NVarChar(20), effectiveBusinessPhone);
      createRequest.input('Website', sql.NVarChar(255), website || null);
      createRequest.input('YearsInBusiness', sql.Int, parseInt(yearsInBusiness) || 1);
      createRequest.input('Address', sql.NVarChar(255), address || null);
      createRequest.input('City', sql.NVarChar(100), city || '');
      createRequest.input('State', sql.NVarChar(50), state || province || '');
      createRequest.input('Country', sql.NVarChar(50), country || 'Canada');
      createRequest.input('PostalCode', sql.NVarChar(20), postalCode || null);
      createRequest.input('Categories', sql.NVarChar(sql.MAX), JSON.stringify(allCategories));
      createRequest.input('Services', sql.NVarChar(sql.MAX), JSON.stringify([]));

      const result = await createRequest.execute('vendors.sp_RegisterVendor');
      
      if (!result.recordset[0].Success) {
        throw new Error('Failed to create vendor profile');
      }
      
      vendorProfileId = result.recordset[0].VendorProfileID;

      // Update additional fields not in sp_RegisterVendor
      const updateExtraRequest = new sql.Request(pool);
      updateExtraRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      updateExtraRequest.input('Latitude', sql.Decimal(10, 8), latitude || null);
      updateExtraRequest.input('Longitude', sql.Decimal(11, 8), longitude || null);
      updateExtraRequest.input('Tagline', sql.NVarChar(255), tagline || null);
      updateExtraRequest.input('PriceLevel', sql.NVarChar(20), priceRange || null);
      updateExtraRequest.input('ProfileLogo', sql.NVarChar(255), profileLogoUrl || null);

      await updateExtraRequest.execute('vendors.sp_UpdateExtraFields');
    }

    // Update categories - first one is primary (from primaryCategory), rest are additional
    if (allCategories && allCategories.length > 0) {
      const deleteCategoriesRequest = new sql.Request(pool);
      deleteCategoriesRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteCategoriesRequest.execute('vendors.sp_DeleteCategories');

      for (let i = 0; i < allCategories.length; i++) {
        const category = allCategories[i];
        const categoryRequest = new sql.Request(pool);
        categoryRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        categoryRequest.input('Category', sql.NVarChar(50), category);
        // First category (primaryCategory) is marked as primary
        categoryRequest.input('IsPrimary', sql.Bit, i === 0 ? 1 : 0);
        
        await categoryRequest.execute('vendors.sp_InsertCategoryByName');
      }
    }

    // Update service areas - only if there are valid areas with city names
    // Filter out empty/invalid service areas to allow partial saves
    const validServiceAreas = (serviceAreas || []).filter(area => {
      const cityName = area.city || area.name || area;
      return cityName && typeof cityName === 'string' && cityName.trim().length > 0;
    });
    
    if (validServiceAreas.length > 0) {
      const deleteAreasRequest = new sql.Request(pool);
      deleteAreasRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteAreasRequest.execute('vendors.sp_DeleteServiceAreas');

      for (const area of validServiceAreas) {
        const areaRequest = new sql.Request(pool);
        areaRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        areaRequest.input('GooglePlaceID', sql.NVarChar(100), area.placeId || '');
        areaRequest.input('CityName', sql.NVarChar(100), area.city || area);
        areaRequest.input('StateProvince', sql.NVarChar(100), area.province || area.state || '');
        areaRequest.input('Country', sql.NVarChar(100), area.country || 'Canada');
        areaRequest.input('Latitude', sql.Decimal(9, 6), area.latitude || null);
        areaRequest.input('Longitude', sql.Decimal(9, 6), area.longitude || null);
        areaRequest.input('ServiceRadius', sql.Decimal(10, 2), area.serviceRadius || 25.0);
        areaRequest.input('FormattedAddress', sql.NVarChar(255), area.formattedAddress || null);
        areaRequest.input('PlaceType', sql.NVarChar(50), area.placeType || null);
        
        await areaRequest.execute('vendors.sp_InsertServiceAreaExtended');
      }
    }

    // Update business hours and timezone
    if (businessHours) {
      // Map day names to TINYINT (0=Sunday, 1=Monday, etc.)
      const dayMapping = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
      };

      // Helper function to extract time from various formats
      const extractTime = (timeValue, defaultTime = '09:00') => {
        if (!timeValue) return defaultTime;
        // If it's an ISO date string like "1970-01-01T09:00:00.000Z", extract the time
        if (typeof timeValue === 'string' && timeValue.includes('T')) {
          const match = timeValue.match(/T(\d{2}:\d{2})/);
          return match ? match[1] : defaultTime;
        }
        // If it's already a time string like "09:00" or "09:00:00", take first 5 chars
        if (typeof timeValue === 'string') {
          return timeValue.substring(0, 5);
        }
        return defaultTime;
      };

      for (const [dayName, dayNumber] of Object.entries(dayMapping)) {
        if (businessHours[dayName]) {
          const dayData = businessHours[dayName];
          const hoursRequest = new sql.Request(pool);
          hoursRequest.input('VendorProfileID', sql.Int, vendorProfileId);
          hoursRequest.input('DayOfWeek', sql.TinyInt, dayNumber);
          hoursRequest.input('IsAvailable', sql.Bit, dayData.isAvailable !== false);
          
          // For closed days, use default times; otherwise use provided times
          const openTime = (dayData.isAvailable !== false && dayData.openTime) ? extractTime(dayData.openTime, '09:00') : '09:00';
          const closeTime = (dayData.isAvailable !== false && dayData.closeTime) ? extractTime(dayData.closeTime, '17:00') : '17:00';
          
          hoursRequest.input('OpenTime', sql.VarChar(8), openTime);
          hoursRequest.input('CloseTime', sql.VarChar(8), closeTime);
          hoursRequest.input('Timezone', sql.NVarChar(100), timezone || 'America/New_York');

          await hoursRequest.execute('vendors.sp_UpsertBusinessHoursExtended');
        }
      }
    }

    // Update social media
    if (socialMedia) {
      // Delete existing social media entries
      const deleteSocialRequest = new sql.Request(pool);
      deleteSocialRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteSocialRequest.execute('vendors.sp_DeleteSocialMedia');

      // Insert new social media entries
      const platforms = {
        'Facebook': socialMedia.facebook,
        'Instagram': socialMedia.instagram,
        'Twitter': socialMedia.twitter,
        'LinkedIn': socialMedia.linkedin,
        'YouTube': socialMedia.youtube,
        'TikTok': socialMedia.tiktok
      };

      let displayOrder = 0;
      for (const [platform, url] of Object.entries(platforms)) {
        if (url && url.trim()) {
          const socialRequest = new sql.Request(pool);
          socialRequest.input('VendorProfileID', sql.Int, vendorProfileId);
          socialRequest.input('Platform', sql.NVarChar(50), platform);
          socialRequest.input('URL', sql.NVarChar(255), url);
          socialRequest.input('DisplayOrder', sql.Int, displayOrder++);

          await socialRequest.execute('vendors.sp_InsertSocialMedia');
        }
      }
    }

    // Save photo URLs to VendorImages
    if (photoURLs && Array.isArray(photoURLs) && photoURLs.length > 0) {
      try {
        // Don't delete existing images, just add new ones that don't exist
        for (const url of photoURLs) {
          if (url && url.trim()) {
            const checkRequest = new sql.Request(pool);
            checkRequest.input('VendorProfileID', sql.Int, vendorProfileId);
            checkRequest.input('ImageURL', sql.NVarChar(500), url.trim());
            
            // Check if image already exists
            const existsResult = await checkRequest.execute('vendors.sp_CheckImageExists');
            
            if (existsResult.recordset.length === 0) {
              const insertRequest = new sql.Request(pool);
              insertRequest.input('VendorProfileID', sql.Int, vendorProfileId);
              insertRequest.input('ImageURL', sql.NVarChar(500), url.trim());
              insertRequest.input('IsPrimary', sql.Bit, 0);
              await insertRequest.execute('vendors.sp_InsertImage');
            }
          }
        }
      } catch (imageError) {
        console.warn('⚠️ Could not save images:', imageError.message);
      }
    }

    // Save Google Place ID for Google Reviews
    if (googlePlaceId) {
      try {
        const googleRequest = new sql.Request(pool);
        googleRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        googleRequest.input('GooglePlaceId', sql.NVarChar(100), googlePlaceId);
        await googleRequest.execute('vendors.sp_UpdateGooglePlaceId');
      } catch (googleError) {
        console.warn('⚠️ Could not save Google Place ID:', googleError.message);
      }
    }

    // Save cancellation policy
    if (cancellationPolicy) {
      try {
        const policyRequest = new sql.Request(pool);
        policyRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        // Store as JSON string if it's an object
        const policyString = typeof cancellationPolicy === 'object' 
          ? JSON.stringify(cancellationPolicy) 
          : cancellationPolicy;
        policyRequest.input('CancellationPolicy', sql.NVarChar(sql.MAX), policyString);
        await policyRequest.execute('vendors.sp_UpdateCancellationPolicy');
      } catch (policyError) {
        console.warn('⚠️ Could not save cancellation policy:', policyError.message);
      }
    }

    // Update user to be a vendor
    const updateUserRequest = new sql.Request(pool);
    updateUserRequest.input('UserID', sql.Int, parseInt(userId));
    await updateUserRequest.execute('vendors.sp_SetUserAsVendor');

    // NOTE: Email notification is NOT sent here on save
    // Email is only sent when vendor clicks "Go Live" via submit-for-review endpoint
    // This prevents spam emails on every save action

    res.status(200).json({
      success: true,
      message: 'Vendor onboarding progress saved successfully',
      vendorProfileId: vendorProfileId
    });

  } catch (err) {
    console.error('❌ Vendor onboarding error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to complete vendor onboarding',
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

    const result = await request.execute('vendors.sp_GetStatus');

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

    const userResult = await userRequest.execute('vendors.sp_GetUserWithProfile');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    const user = userResult.recordset[0];

    if (!user.IsVendor) {
      return res.status(403).json({
        success: false,
        message: 'User is not registered as a vendor'
      });
    }

    if (!user.VendorProfileID) {
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
        const createResult = await createProfileRequest.execute('vendors.sp_RegisterVendor');
        
        if (createResult.recordset[0].Success) {
          const newVendorProfileId = createResult.recordset[0].VendorProfileID;
          
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

    // Get comprehensive vendor profile data using the stored procedure
    const profileRequest = new sql.Request(pool);
    profileRequest.input('VendorProfileID', sql.Int, user.VendorProfileID);
    profileRequest.input('UserID', sql.Int, userIdNum); // Pass UserID for favorite check

    const profileResult = await profileRequest.execute('vendors.sp_GetDetails');
    
    if (profileResult.recordsets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile details not found'
      });
    }


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
    
    try {
      if (imagesRecordsetIndex >= 0) {
        const imagesJson = profileResult.recordsets[imagesRecordsetIndex][0].images;
        
        if (imagesJson) {
          imagesFromStoredProcedure = JSON.parse(imagesJson);
        }
      }
    } catch (e) {
      console.error(`❌ ERROR PARSING IMAGES FROM STORED PROCEDURE:`, e);
      imagesFromStoredProcedure = [];
    }

    // Use images from stored procedure (dynamic, no fallback)
    const galleryImages = imagesFromStoredProcedure;
    
    // Get service areas for this vendor
    let serviceAreas = [];
    try {
      const serviceAreasRequest = new sql.Request(pool);
      serviceAreasRequest.input('VendorProfileID', sql.Int, user.VendorProfileID);
      const serviceAreasResult = await serviceAreasRequest.execute('vendors.sp_GetServiceAreas');
      serviceAreas = serviceAreasResult.recordset || [];
    } catch (serviceAreasError) {
      console.warn('Service areas query failed, using empty array:', serviceAreasError.message);
      serviceAreas = [];
    }

    // Structure the comprehensive profile data
    // Stored procedure sp_GetVendorDetails returns recordsets in this order:
    // 0: Profile, 1: Categories, 2: Services, 3: Portfolio, 4: Reviews, 5: FAQs,
    // 6: Team, 7: Social Media, 8: Business Hours, 9: Images, 10: Category Answers,
    // 11: Is Favorite, 12: Available Slots
    const profileData = {
      profile: profileResult.recordsets[0][0] || {},
      categories: profileResult.recordsets[1] || [],
      services: profileResult.recordsets[2] || [],
      portfolio: profileResult.recordsets[3] || [],
      reviews: profileResult.recordsets[4] || [],
      faqs: profileResult.recordsets[5] || [],
      team: profileResult.recordsets[6] || [],
      socialMedia: profileResult.recordsets[7] || [],
      businessHours: profileResult.recordsets[8] || [],
      serviceAreas: serviceAreas,
      images: galleryImages.length > 0 ? galleryImages : (profileResult.recordsets[9] || []),
      categoryAnswers: profileResult.recordsets[10] || [],
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
      const progressResult = await progressRequest.execute('vendors.sp_GetSetupProgress');
      if (progressResult.recordset.length > 0) {
        setupProgress = progressResult.recordset[0];
      }
    } catch (progressError) {
      console.warn('Setup progress query failed, using defaults:', progressError.message);
    }

    // Extract extra fields from profile data (now included in vw_VendorDetails view)
    // No separate SP call needed - all fields come from sp_GetProfileDetails
    const profile = profileData.profile;
    let stripeAccountId = profile.StripeAccountID || null;
    let profileStatus = profile.ProfileStatus || 'draft';
    let selectedFilters = [];

    // ALWAYS fetch GooglePlaceId directly from VendorProfiles table (most reliable source)
    let googlePlaceId = null;
    try {
      const googleRequest = new sql.Request(pool);
      googleRequest.input('VendorProfileID', sql.Int, user.VendorProfileID);
      const googleResult = await googleRequest.query(`
        SELECT GooglePlaceId FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID
      `);
      if (googleResult.recordset.length > 0 && googleResult.recordset[0].GooglePlaceId) {
        googlePlaceId = googleResult.recordset[0].GooglePlaceId;
      }
    } catch (googleError) {
      console.warn('Could not fetch GooglePlaceId:', googleError.message);
      // Fallback to profile data if direct query fails
      googlePlaceId = profile.GooglePlaceId || null;
    }
    
    // Convert timestamps to ISO string for frontend
    if (profile.SubmittedForReviewAt) {
      const submitted = new Date(profile.SubmittedForReviewAt);
      profileData.profile.SubmittedForReviewAt = !isNaN(submitted.getTime()) ? submitted.toISOString() : null;
    }
    if (profile.ReviewedAt) {
      const reviewed = new Date(profile.ReviewedAt);
      profileData.profile.ReviewedAt = !isNaN(reviewed.getTime()) ? reviewed.toISOString() : null;
    }
    
    // Build selectedFilters array from boolean fields
    if (profile.IsPremium) selectedFilters.push('filter-premium');
    if (profile.IsEcoFriendly) selectedFilters.push('filter-eco-friendly');
    if (profile.IsAwardWinning) selectedFilters.push('filter-award-winning');
    if (profile.IsLastMinute) selectedFilters.push('filter-last-minute');
    if (profile.IsCertified) selectedFilters.push('filter-certified');
    if (profile.IsInsured) selectedFilters.push('filter-insured');

    // Return successful response with vendor profile data
    res.json({
      success: true,
      vendorProfileId: user.VendorProfileID,
      stripeAccountId: stripeAccountId,
      googlePlaceId: googlePlaceId,
      data: {
        ...profileData,
        selectedFilters: selectedFilters,
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
    // Return a default empty profile on error instead of 500
    res.json({ 
      success: false,
      vendorProfileId: null,
      message: 'Failed to get vendor profile - database schema may be incomplete',
      data: {
        profile: {},
        categories: [],
        services: [],
        portfolio: [],
        reviews: [],
        faqs: [],
        team: [],
        socialMedia: [],
        businessHours: [],
        serviceAreas: [],
        images: [],
        categoryAnswers: [],
        isFavorite: false,
        availableSlots: [],
        selectedFilters: [],
        setupProgress: {}
      }
    });
  }
});

// Get vendor availability (business hours and exceptions)
// MUST be before /:id route to avoid being caught by it
router.get('/:id/availability', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const pool = await poolPromise;
    
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    // Get business hours
    const hoursResult = await request.execute('vendors.sp_GetBusinessHours');
    
    // Get availability exceptions
    const exceptionsRequest = new sql.Request(pool);
    exceptionsRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const exceptionsResult = await exceptionsRequest.execute('vendors.sp_GetAvailabilityExceptions');
    
    // Get booking settings (instant booking and lead time)
    const settingsRequest = new sql.Request(pool);
    settingsRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const settingsResult = await settingsRequest.query(`
      SELECT InstantBookingEnabled, MinBookingLeadTimeHours 
      FROM vendors.VendorProfiles 
      WHERE VendorProfileID = @VendorProfileID
    `);
    const settings = settingsResult.recordset[0] || {};
    
    // Format time values - SQL Server returns TIME as Date objects
    const formatTime = (timeValue) => {
      if (!timeValue) return null;
      if (typeof timeValue === 'string') return timeValue;
      // If it's a Date object, extract time portion
      if (timeValue instanceof Date) {
        return timeValue.toTimeString().split(' ')[0]; // Returns HH:MM:SS
      }
      return timeValue;
    };
    
    const businessHours = hoursResult.recordset.map(bh => ({
      ...bh,
      OpenTime: formatTime(bh.OpenTime),
      CloseTime: formatTime(bh.CloseTime)
    }));
    
    res.json({
      businessHours: businessHours,
      exceptions: exceptionsResult.recordset,
      instantBookingEnabled: settings.InstantBookingEnabled || false,
      minBookingLeadTimeHours: settings.MinBookingLeadTimeHours || 0
    });
  } catch (error) {
    console.error('Error fetching vendor availability:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch availability', error: error.message });
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

    // Parse the VendorProfileID from URL
    const vendorProfileId = parseVendorProfileId(id);
    
    if (!vendorProfileId) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found. Please ensure the vendor exists and is active.'
      });
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('UserID', sql.Int, userId || null);

    const result = await request.execute('vendors.sp_GetDetails');
    
    if (result.recordsets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor details not found'
      });
    }

    // Capture the recordsets into their respective variables with safe defaults
    // Stored procedure sp_GetDetails returns recordsets in this order:
    // 0: Profile, 1: Categories, 2: Services, 3: Portfolio, 4: Reviews, 5: FAQs,
    // 6: Team, 7: Social Media, 8: Business Hours, 9: Images, 10: Category Answers,
    // 11: Is Favorite, 12: Available Slots
    const profileRecordset = result.recordsets[0] || [];
    const categoriesRecordset = result.recordsets[1] || [];
    const servicesRecordset = result.recordsets[2] || [];
    const portfolioRecordset = result.recordsets[3] || [];
    const reviewsRecordset = result.recordsets[4] || [];
    const faqsRecordset = result.recordsets[5] || [];
    const teamRecordset = result.recordsets[6] || [];
    const socialMediaRecordset = result.recordsets[7] || [];
    const businessHoursRecordset = result.recordsets[8] || [];
    const imagesRecordset = result.recordsets[9] || [];
    const categoryAnswersRecordset = result.recordsets[10] || [];
    const isFavoriteRecordset = result.recordsets[11] || [];
    const availableSlotsRecordset = result.recordsets[12] || [];
    
    // Get service areas for this vendor
    let serviceAreas = [];
    try {
      const serviceAreasRequest = new sql.Request(pool);
      serviceAreasRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      const serviceAreasResult = await serviceAreasRequest.execute('vendors.sp_GetServiceAreasDetailed');
      serviceAreas = serviceAreasResult.recordset || [];
    } catch (serviceAreasError) {
      console.warn('Service areas query failed, using empty array:', serviceAreasError.message);
      serviceAreas = [];
    }

    // Get host user profile information if UserID exists
    let hostProfile = null;
    const vendorUserID = profileRecordset[0]?.UserID;
    if (vendorUserID) {
      try {
        const hostRequest = new sql.Request(pool);
        hostRequest.input('UserID', sql.Int, vendorUserID);
        const hostResult = await hostRequest.query(`
          SELECT 
            u.UserID as HostUserID,
            COALESCE(up.DisplayName, u.FirstName + ' ' + u.LastName) as HostName,
            COALESCE(up.ProfileImageURL, u.ProfileImageURL) as HostProfileImage,
            up.Bio as HostBio,
            up.Work as HostWork,
            up.Languages as HostLanguages,
            up.City as HostLocation,
            u.EmailVerified as HostIsVerified,
            u.CreatedAt as HostCreatedAt,
            0 as IsSuperhost
          FROM users.Users u
          LEFT JOIN users.UserProfiles up ON u.UserID = up.UserID
          WHERE u.UserID = @UserID
        `);
        if (hostResult.recordset && hostResult.recordset.length > 0) {
          hostProfile = hostResult.recordset[0];
        }
      } catch (hostError) {
        console.warn('Host profile query failed:', hostError.message);
      }
    }

    // Format time values - SQL Server returns TIME as Date objects
    const formatTime = (timeValue) => {
      if (!timeValue) return null;
      if (typeof timeValue === 'string') return timeValue;
      // If it's a Date object, extract time portion
      if (timeValue instanceof Date) {
        return timeValue.toTimeString().split(' ')[0]; // Returns HH:MM:SS
      }
      return timeValue;
    };
    
    const businessHours = (businessHoursRecordset || []).map(bh => ({
      ...bh,
      OpenTime: formatTime(bh.OpenTime),
      CloseTime: formatTime(bh.CloseTime)
    }));
    
    // Extract timezone from business hours (all days should have same timezone)
    const timezone = businessHours.length > 0 ? businessHours[0].Timezone : null;

    // Get discovery flags by checking if this vendor appears in discovery sections
    // Uses the SAME data source as the main page discovery sections
    let discoveryFlags = {
      isTrending: false,
      isMostBooked: false,
      isQuickResponder: false,
      isTopRated: false,
      isNewVendor: false,
      trendingBadge: null,
      bookingsBadge: null,
      responseBadge: null,
      ratingBadge: null
    };
    
    try {
      // Query the same fields used by the main vendors endpoint for discovery sections
      const discoveryRequest = new sql.Request(pool);
      discoveryRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      const discoveryResult = await discoveryRequest.query(`
        SELECT 
          vp.VendorProfileID,
          vp.CreatedAt,
          -- Calculate rating from reviews table
          (SELECT AVG(CAST(r.Rating AS FLOAT)) FROM vendors.Reviews r WHERE r.VendorProfileID = vp.VendorProfileID) as AvgRating,
          (SELECT COUNT(*) FROM vendors.Reviews r WHERE r.VendorProfileID = vp.VendorProfileID) as ReviewCount,
          -- Booking count in last 30 days
          (SELECT COUNT(*) FROM bookings.Bookings b 
           WHERE b.VendorProfileID = vp.VendorProfileID 
           AND b.CreatedAt >= DATEADD(day, -30, GETDATE())) as BookingCount,
          -- Favorite count
          (SELECT COUNT(*) FROM users.Favorites f WHERE f.VendorProfileID = vp.VendorProfileID) as FavoriteCount
        FROM vendors.VendorProfiles vp
        WHERE vp.VendorProfileID = @VendorProfileID
      `);
      
      if (discoveryResult.recordset && discoveryResult.recordset.length > 0) {
        const v = discoveryResult.recordset[0];
        
        // Log discovery data for debugging
        console.log('Discovery data for vendor', vendorProfileId, ':', {
          BookingCount: v.BookingCount,
          FavoriteCount: v.FavoriteCount,
          ReviewCount: v.ReviewCount,
          AvgRating: v.AvgRating,
          CreatedAt: v.CreatedAt
        });
        
        // TRENDING - formula: (bookings * 3) + (favorites * 2) + (reviews * 1)
        const trendingScore = ((v.BookingCount || 0) * 3) + ((v.FavoriteCount || 0) * 2) + ((v.ReviewCount || 0) * 1);
        if (trendingScore > 0) {
          discoveryFlags.isTrending = true;
          // Show actual analytics
          const parts = [];
          if (v.BookingCount > 0) parts.push(`${v.BookingCount} booking${v.BookingCount > 1 ? 's' : ''}`);
          if (v.FavoriteCount > 0) parts.push(`${v.FavoriteCount} favorite${v.FavoriteCount > 1 ? 's' : ''}`);
          if (v.ReviewCount > 0) parts.push(`${v.ReviewCount} review${v.ReviewCount > 1 ? 's' : ''}`);
          discoveryFlags.trendingBadge = parts.length > 0 ? parts.join(', ') + ' this month' : 'Popular with guests right now';
        }
        
        // MOST BOOKED - same logic: bookingCount > 0
        if (v.BookingCount > 0) {
          discoveryFlags.isMostBooked = true;
          discoveryFlags.bookingsBadge = `${v.BookingCount} booking${v.BookingCount > 1 ? 's' : ''} this month`;
        }
        
        // QUICK RESPONDER - skipped for now (AvgResponseMinutes not tracked in VendorProfiles)
        // This would need a separate query to calculate from message response times
        
        // TOP RATED - same logic: has reviews
        if (v.ReviewCount > 0) {
          discoveryFlags.isTopRated = true;
          discoveryFlags.ratingBadge = `${(v.AvgRating || 5.0).toFixed(1)} rating (${v.ReviewCount} reviews)`;
        }
        
        // NEW VENDOR - joined within last 90 days
        if (v.CreatedAt) {
          const daysSinceCreated = Math.floor((new Date() - new Date(v.CreatedAt)) / (1000 * 60 * 60 * 24));
          if (daysSinceCreated <= 90) {
            discoveryFlags.isNewVendor = true;
          }
        }
      }
    } catch (discoveryError) {
      console.warn('Discovery flags query failed:', discoveryError.message);
    }

    const vendorDetails = {
      profile: {
        ...profileRecordset[0],
        TimeZone: timezone || profileRecordset[0].TimeZone || profileRecordset[0].Timezone,
        // Add host profile info
        ...(hostProfile || {})
      },
      categories: categoriesRecordset,
      services: servicesRecordset,
      portfolio: portfolioRecordset,
      reviews: reviewsRecordset,
      faqs: faqsRecordset,
      team: teamRecordset,
      socialMedia: socialMediaRecordset,
      businessHours,
      images: imagesRecordset,
      categoryAnswers: categoryAnswersRecordset,
      isFavorite: isFavoriteRecordset && isFavoriteRecordset.length > 0 ? isFavoriteRecordset[0].IsFavorite : false,
      availableSlots: availableSlotsRecordset,
      serviceAreas: serviceAreas,
      discoveryFlags: discoveryFlags
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

      await request.execute('vendors.sp_UpdateProfileFull');

      if (files.length > 0) {
        for (const file of files) {
          const imgRequest = new sql.Request(transaction);
          imgRequest.input('VendorProfileID', sql.Int, id);
          imgRequest.input('ImageURL', sql.NVarChar(255), `/uploads/${file.filename}`);
          imgRequest.input('IsPrimary', sql.Bit, 0);
          
          await imgRequest.execute('vendors.sp_InsertImageWithPath');
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
      additionalCategories,
      priceLevel
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
    updateRequest.input('PriceLevel', sql.NVarChar, priceLevel || '$$');
    
    await updateRequest.execute('vendors.sp_UpdateBusinessBasics');
    
    // Handle categories - replace existing with primary + additional
    const deleteCatRequest = new sql.Request(pool);
    deleteCatRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    await deleteCatRequest.execute('vendors.sp_DeleteCategories');
    
    const primaryCatRequest = new sql.Request(pool);
    primaryCatRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    primaryCatRequest.input('Category', sql.NVarChar(50), primaryCategory);
    primaryCatRequest.input('IsPrimary', sql.Bit, 1);
    await primaryCatRequest.execute('vendors.sp_InsertCategoryByName');
    
    if (Array.isArray(additionalCategories) && additionalCategories.length > 0) {
      for (const category of additionalCategories) {
        if (!category || category === primaryCategory) continue;
        const catRequest = new sql.Request(pool);
        catRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        catRequest.input('Category', sql.NVarChar(50), category);
        catRequest.input('IsPrimary', sql.Bit, 0);
        await catRequest.execute('vendors.sp_InsertCategoryByName');
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
    updateRequest.input('LogoURL', sql.NVarChar, featuredImage);
    
    await updateRequest.execute('vendors.sp_UpdateLogoURL');
    
    // Handle gallery images
    if (galleryImages && galleryImages.length > 0) {
      // Delete existing images
      const deleteImgRequest = new sql.Request(pool);
      deleteImgRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteImgRequest.execute('vendors.sp_DeleteImages');
      
      // Insert new images
      for (let i = 0; i < galleryImages.length; i++) {
        const imageRequest = new sql.Request(pool);
        imageRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        imageRequest.input('ImageURL', sql.NVarChar(500), galleryImages[i].url);
        imageRequest.input('IsPrimary', sql.Bit, i === 0);
        imageRequest.input('DisplayOrder', sql.Int, i);
        imageRequest.input('Caption', sql.NVarChar(255), galleryImages[i].caption || null);
        
        await imageRequest.execute('vendors.sp_InsertGalleryImage');
      }
    }
    
    // Handle portfolio items
    if (portfolioItems && portfolioItems.length > 0) {
      // Delete existing portfolio
      const deletePortRequest = new sql.Request(pool);
      deletePortRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deletePortRequest.execute('vendors.sp_DeletePortfolio');
      
      // Insert new portfolio items
      for (let i = 0; i < portfolioItems.length; i++) {
        const portfolioRequest = new sql.Request(pool);
        portfolioRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        portfolioRequest.input('Title', sql.NVarChar(255), portfolioItems[i].title);
        portfolioRequest.input('Description', sql.NVarChar(sql.MAX), portfolioItems[i].description || null);
        portfolioRequest.input('ImageURL', sql.NVarChar(500), portfolioItems[i].imageUrl);
        portfolioRequest.input('ProjectDate', sql.Date, portfolioItems[i].projectDate || null);
        portfolioRequest.input('DisplayOrder', sql.Int, i);
        
        await portfolioRequest.execute('vendors.sp_InsertPortfolioItem');
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

// Step 4: Business Hours
router.post('/setup/step4-business-hours', async (req, res) => {
  try {
    const { vendorProfileId, timezone, businessHours } = req.body;

    if (!vendorProfileId || !businessHours || !Array.isArray(businessHours)) {
      return res.status(400).json({
        success: false,
        message: 'vendorProfileId and businessHours array are required'
      });
    }

    const pool = await poolPromise;
    
    // Update timezone in VendorProfiles (if column exists)
    if (timezone) {
      try {
        const timezoneRequest = new sql.Request(pool);
        timezoneRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        timezoneRequest.input('Timezone', sql.NVarChar(100), timezone);
        
        await timezoneRequest.execute('vendors.sp_UpdateTimezone');
      } catch (tzErr) {
        // Continue even if timezone update fails
      }
    }

    // Delete existing business hours
    const deleteRequest = new sql.Request(pool);
    deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    await deleteRequest.execute('vendors.sp_DeleteBusinessHours');

    // Insert new business hours with Timezone
    for (const hour of businessHours) {
      try {
        const insertRequest = new sql.Request(pool);
        insertRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        insertRequest.input('DayOfWeek', sql.TinyInt, hour.dayOfWeek);
        
        // Ensure time format is HH:MM:SS for SQL Server TIME type
        const openTime = hour.openTime && hour.openTime.length === 5 ? `${hour.openTime}:00` : hour.openTime;
        const closeTime = hour.closeTime && hour.closeTime.length === 5 ? `${hour.closeTime}:00` : hour.closeTime;
        
        insertRequest.input('OpenTime', sql.VarChar(8), openTime);
        insertRequest.input('CloseTime', sql.VarChar(8), closeTime);
        insertRequest.input('IsAvailable', sql.Bit, hour.isAvailable);
        insertRequest.input('Timezone', sql.NVarChar(100), timezone || 'America/Toronto');

        await insertRequest.execute('vendors.sp_InsertBusinessHour');
      } catch (hourErr) {
        console.error(`Error inserting hour for day ${hour.dayOfWeek}:`, hourErr);
        throw hourErr;
      }
    }

    res.json({
      success: true,
      message: 'Business hours updated successfully'
    });

  } catch (err) {
    console.error('Business hours update error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update business hours',
      error: err.message
    });
  }
});

// Debug endpoint to get valid service IDs for troubleshooting
router.get('/debug/service-ids', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    const result = await request.execute('vendors.sp_GetDebugServiceIds');
    
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
    
    request.input('ServiceName', sql.NVarChar(100), serviceName);
    
    const result = await request.execute('vendors.sp_GetServiceByName');
    
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
    
    if (predefinedServiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid predefined service IDs are required. Received service IDs: ' + JSON.stringify(selectedServices.map(s => s.serviceId))
      });
    }

    // Validate that the service IDs exist in PredefinedServices table using stored procedure
    const serviceValidationRequest = new sql.Request(pool);
    const serviceIdsForValidation = predefinedServiceIds.join(',');
    serviceValidationRequest.input('ServiceIds', sql.NVarChar(500), serviceIdsForValidation);

    const validationResult = await serviceValidationRequest.execute('vendors.sp_ValidatePredefinedServiceIds');

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
    const result = await request.execute('vendors.sp_SearchByPredefinedServices');
    
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
        LogoURL: vendor.image,
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
    const vendorProfileId = parseVendorProfileId(req.params.id);
    
    if (!vendorProfileId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor not found' 
      });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    // Query from Services table first (new unified pricing approach)
    const result = await request.execute('vendors.sp_GetSelectedServicesWithPricing');
    
    let rows = result.recordset;

    res.json({ 
      success: true, 
      selectedServices: rows 
    });
  } catch (error) {
    console.error('Error fetching vendor selected services:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch vendor selected services',
      error: error.message,
      details: error.toString()
    });
  }
});

// Save or update vendor's selected services
router.post('/:id/selected-services', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    
    if (!vendorProfileId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor not found' 
      });
    }

    const { selectedServices } = req.body;

    if (!selectedServices || !Array.isArray(selectedServices)) {
      return res.status(400).json({
        success: false,
        message: 'selectedServices array is required'
      });
    }

    const pool = await poolPromise;
    
    // Delete existing selected services
    const deleteRequest = new sql.Request(pool);
    deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    await deleteRequest.execute('vendors.sp_DeleteSelectedServices');

    // Insert new selected services
    for (const service of selectedServices) {
      const insertRequest = new sql.Request(pool);
      insertRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      insertRequest.input('PredefinedServiceID', sql.Int, service.predefinedServiceId || service.PredefinedServiceID);
      insertRequest.input('VendorPrice', sql.Decimal(10, 2), service.vendorPrice || service.price || 0);
      insertRequest.input('VendorDescription', sql.NVarChar(sql.MAX), service.vendorDescription || service.description || null);
      insertRequest.input('VendorDurationMinutes', sql.Int, service.vendorDurationMinutes || service.durationMinutes || null);
      insertRequest.input('ImageURL', sql.NVarChar(500), service.imageURL || service.ImageURL || null);
      
      await insertRequest.execute('vendors.sp_InsertSelectedService');
    }

    res.json({
      success: true,
      message: 'Selected services saved successfully',
      count: selectedServices.length
    });

  } catch (error) {
    console.error('Error saving vendor selected services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save vendor selected services',
      error: error.message
    });
  }
});

// Update a single selected service (useful for updating just the image)
router.put('/:id/selected-services/:serviceId', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    
    if (!vendorProfileId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor not found' 
      });
    }

    const { serviceId } = req.params;
    const { vendorPrice, vendorDescription, vendorDurationMinutes, imageURL } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('VendorSelectedServiceID', sql.Int, serviceId);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('VendorPrice', sql.Decimal(10, 2), vendorPrice);
    request.input('VendorDescription', sql.NVarChar, vendorDescription || null);
    request.input('VendorDurationMinutes', sql.Int, vendorDurationMinutes || null);
    request.input('ImageURL', sql.NVarChar, imageURL || null);
    
    const result = await request.execute('vendors.sp_UpdateSelectedService');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Selected service not found'
      });
    }

    res.json({
      success: true,
      message: 'Selected service updated successfully'
    });

  } catch (error) {
    console.error('Error updating vendor selected service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor selected service',
      error: error.message
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
      // First, detach existing services from categories to avoid FK constraint when deleting categories
      const detachRequest = new sql.Request(pool);
      detachRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await detachRequest.execute('vendors.sp_DetachServicesFromCategories');

      // Now delete existing categories
      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteRequest.execute('vendors.sp_DeleteServiceCategories');
      
      // Insert new categories
      for (let i = 0; i < serviceCategories.length; i++) {
        const catRequest = new sql.Request(pool);
        catRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        catRequest.input('Name', sql.NVarChar(100), serviceCategories[i].name);
        catRequest.input('Description', sql.NVarChar(sql.MAX), serviceCategories[i].description || null);
        catRequest.input('DisplayOrder', sql.Int, i);
        
        await catRequest.execute('vendors.sp_InsertServiceCategory');
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
          catRequest.input('CategoryName', sql.NVarChar(100), service.categoryName);
          const catResult = await catRequest.execute('vendors.sp_GetServiceCategoryId');
          if (catResult.recordset.length > 0) {
            categoryId = catResult.recordset[0].CategoryID;
          }
        }
        
        const serviceRequest = new sql.Request(pool);
        
        // Calculate derived price from the new pricing model
        const baseRate = service.baseRate != null ? parseFloat(service.baseRate) : null;
        const fixedPrice = service.fixedPrice != null ? parseFloat(service.fixedPrice) : null;
        const pricePerPerson = service.pricePerPerson != null ? parseFloat(service.pricePerPerson) : null;
        const legacyPrice = service.price != null ? parseFloat(service.price) : null;
        const derivedPrice = (fixedPrice != null) ? fixedPrice : (baseRate != null ? baseRate : (pricePerPerson != null ? pricePerPerson : legacyPrice));
        
        const baseDurationMinutes = service.baseDurationMinutes != null ? parseInt(service.baseDurationMinutes) : (service.durationMinutes || null);
        const maximumAttendees = service.maximumAttendees != null ? parseInt(service.maximumAttendees) : null;


        // Use the legacy stored procedure parameters (matching sp_UpsertVendorService with 11 parameters)
        serviceRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        serviceRequest.input('CategoryName', sql.NVarChar, service.categoryName || 'General');
        serviceRequest.input('ServiceName', sql.NVarChar, service.name);
        serviceRequest.input('ServiceDescription', sql.NVarChar, service.description || null);
        serviceRequest.input('Price', sql.Decimal(10, 2), derivedPrice);
        serviceRequest.input('DurationMinutes', sql.Int, baseDurationMinutes || null);
        serviceRequest.input('MaxAttendees', sql.Int, service.maxAttendees || maximumAttendees || null);
        serviceRequest.input('DepositPercentage', sql.Decimal(5, 2), service.depositPercentage != null ? parseFloat(service.depositPercentage) : 20);
        serviceRequest.input('CancellationPolicy', sql.NVarChar, service.cancellationPolicy || null);

        // Use unified upsert stored procedure
        try {
          await serviceRequest.execute('vendors.sp_UpsertService');
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
        
        await packageRequest.execute('vendors.sp_InsertPackage');
      }
    }
    
    // Handle selected predefined services
    // First, delete ALL existing services for this vendor (both predefined and custom)
    const deleteServicesRequest = new sql.Request(pool);
    deleteServicesRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    await deleteServicesRequest.execute('vendors.sp_DeleteAllServices');
    
    // Also delete from VendorSelectedServices (legacy table, may not be used anymore)
    const deleteSelectedRequest = new sql.Request(pool);
    deleteSelectedRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    await deleteSelectedRequest.execute('vendors.sp_DeleteSelectedServices');

    if (selectedPredefinedServices && selectedPredefinedServices.length > 0) {
      // Insert new selected predefined services
      for (const selectedService of selectedPredefinedServices) {
        try {
          const imageUrlValue = selectedService.imageURL || null;
          
          // Calculate the vendor price from the pricing model
          const baseRate = selectedService.baseRate != null ? parseFloat(selectedService.baseRate) : null;
          const fixedPrice = selectedService.fixedPrice != null ? parseFloat(selectedService.fixedPrice) : null;
          const pricePerPerson = selectedService.pricePerPerson != null ? parseFloat(selectedService.pricePerPerson) : null;
          const legacyPrice = selectedService.price != null ? parseFloat(selectedService.price) : null;
          
          // Derive vendor price based on pricing model priority
          let vendorPrice = null;
          if (fixedPrice != null) {
            vendorPrice = fixedPrice;
          } else if (baseRate != null) {
            vendorPrice = baseRate;
          } else if (pricePerPerson != null) {
            vendorPrice = pricePerPerson;
          } else if (legacyPrice != null) {
            vendorPrice = legacyPrice;
          } else {
            vendorPrice = 0; // Default fallback
          }

          // Use unified stored procedure with all pricing parameters
          const serviceRequest = new sql.Request(pool);
          serviceRequest.input('ServiceID', sql.Int, null);
          serviceRequest.input('VendorProfileID', sql.Int, vendorProfileId);
          serviceRequest.input('CategoryID', sql.Int, null);
          serviceRequest.input('CategoryName', sql.NVarChar, selectedService.categoryName || 'General');
          serviceRequest.input('Name', sql.NVarChar, selectedService.name);
          serviceRequest.input('ServiceName', sql.NVarChar, selectedService.name); // Backward compatibility
          serviceRequest.input('Description', sql.NVarChar, selectedService.description || null);
          serviceRequest.input('ServiceDescription', sql.NVarChar, selectedService.description || null); // Backward compatibility
          serviceRequest.input('Price', sql.Decimal(10, 2), vendorPrice);
          serviceRequest.input('DurationMinutes', sql.Int, selectedService.durationMinutes || selectedService.baseDurationMinutes || null);
          serviceRequest.input('MaxAttendees', sql.Int, selectedService.maximumAttendees || null);
          serviceRequest.input('IsActive', sql.Bit, 1);
          serviceRequest.input('RequiresDeposit', sql.Bit, 1);
          serviceRequest.input('DepositPercentage', sql.Decimal(5, 2), 20);
          serviceRequest.input('CancellationPolicy', sql.NVarChar, null);
          serviceRequest.input('LinkedPredefinedServiceID', sql.Int, selectedService.predefinedServiceId);
          
          // Unified pricing fields
          serviceRequest.input('PricingModel', sql.NVarChar, selectedService.pricingModel || 'time_based');
          serviceRequest.input('BaseDurationMinutes', sql.Int, selectedService.baseDurationMinutes || null);
          serviceRequest.input('BaseRate', sql.Decimal(10, 2), baseRate);
          serviceRequest.input('OvertimeRatePerHour', sql.Decimal(10, 2), selectedService.overtimeRatePerHour != null ? parseFloat(selectedService.overtimeRatePerHour) : null);
          serviceRequest.input('MinimumBookingFee', sql.Decimal(10, 2), selectedService.minimumBookingFee != null ? parseFloat(selectedService.minimumBookingFee) : null);
          serviceRequest.input('FixedPricingType', sql.NVarChar, selectedService.fixedPricingType || null);
          serviceRequest.input('FixedPrice', sql.Decimal(10, 2), fixedPrice);
          serviceRequest.input('PricePerPerson', sql.Decimal(10, 2), pricePerPerson);
          serviceRequest.input('MinimumAttendees', sql.Int, selectedService.minimumAttendees || null);
          serviceRequest.input('MaximumAttendees', sql.Int, selectedService.maximumAttendees || null);
          serviceRequest.input('ImageURL', sql.NVarChar(500), imageUrlValue);
          serviceRequest.input('SalePrice', sql.Decimal(10, 2), selectedService.salePrice != null ? parseFloat(selectedService.salePrice) : null);

          await serviceRequest.execute('vendors.sp_UpsertService');
          
        } catch (insertError) {
          console.error(`[BACKEND] ERROR inserting service ${selectedService.predefinedServiceId}:`, insertError);
          throw insertError; // Re-throw to be caught by outer catch
        }
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
      await deleteRequest.execute('vendors.sp_DeleteTeam');
      
      // Insert new team members
      for (let i = 0; i < teamMembers.length; i++) {
        const teamRequest = new sql.Request(pool);
        teamRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        teamRequest.input('Name', sql.NVarChar(100), teamMembers[i].name);
        teamRequest.input('Role', sql.NVarChar(100), teamMembers[i].role || null);
        teamRequest.input('Bio', sql.NVarChar(sql.MAX), teamMembers[i].bio || null);
        teamRequest.input('ImageURL', sql.NVarChar(500), teamMembers[i].imageUrl || null);
        teamRequest.input('DisplayOrder', sql.Int, i);
        
        await teamRequest.execute('vendors.sp_InsertTeamMember');
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
      externalLinks
    } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile ID is required'
      });
    }

    const pool = await poolPromise;
    
    // Handle social media profiles
    if (socialMediaProfiles && socialMediaProfiles.length > 0) {
      // Delete existing social media
      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteRequest.execute('vendors.sp_DeleteSocialMedia');
      
      // Insert new social media links
      for (let i = 0; i < socialMediaProfiles.length; i++) {
        const socialRequest = new sql.Request(pool);
        socialRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        socialRequest.input('Platform', sql.NVarChar(50), socialMediaProfiles[i].platform);
        socialRequest.input('URL', sql.NVarChar(255), socialMediaProfiles[i].url);
        socialRequest.input('DisplayOrder', sql.Int, i);
        
        await socialRequest.execute('vendors.sp_InsertSocialMedia');
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
    
    await updateRequest.execute('vendors.sp_UpdateBookingSettings');
    
    // Handle business hours
    if (businessHours && businessHours.length > 0) {
      // Delete existing business hours
      const deleteHoursRequest = new sql.Request(pool);
      deleteHoursRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteHoursRequest.execute('vendors.sp_DeleteBusinessHours');
      
      // Insert new business hours
      for (const hours of businessHours) {
        const hoursRequest = new sql.Request(pool);
        hoursRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        hoursRequest.input('DayOfWeek', sql.TinyInt, hours.dayOfWeek);
        hoursRequest.input('OpenTime', sql.Time, hours.openTime || null);
        hoursRequest.input('CloseTime', sql.Time, hours.closeTime || null);
        hoursRequest.input('IsAvailable', sql.Bit, hours.isAvailable || false);
        
        await hoursRequest.execute('vendors.sp_InsertBusinessHourSimple');
      }
    }
    
    // Handle availability exceptions
    if (availabilityExceptions && availabilityExceptions.length > 0) {
      for (const exception of availabilityExceptions) {
        const exceptionRequest = new sql.Request(pool);
        exceptionRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        exceptionRequest.input('Date', sql.Date, exception.date);
        exceptionRequest.input('StartTime', sql.Time, exception.startTime || null);
        exceptionRequest.input('EndTime', sql.Time, exception.endTime || null);
        exceptionRequest.input('IsAvailable', sql.Bit, exception.isAvailable);
        exceptionRequest.input('Reason', sql.NVarChar(255), exception.reason || null);
        
        await exceptionRequest.execute('vendors.sp_InsertAvailabilityException');
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
    
    await updateRequest.execute('vendors.sp_UpdatePolicies');
    
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
    
    await updateRequest.execute('vendors.sp_UpdateVerification');
    
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
      await deleteRequest.execute('vendors.sp_DeleteFAQs');
      
      // Insert new FAQs
      for (let i = 0; i < faqs.length; i++) {
        const faqRequest = new sql.Request(pool);
        faqRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        faqRequest.input('Question', sql.NVarChar(500), faqs[i].question);
        faqRequest.input('Answer', sql.NVarChar(sql.MAX), faqs[i].answer);
        faqRequest.input('AnswerType', sql.NVarChar(50), faqs[i].answerType || 'text');
        faqRequest.input('AnswerOptions', sql.NVarChar(sql.MAX), faqs[i].answerOptions ? JSON.stringify(faqs[i].answerOptions) : null);
        faqRequest.input('DisplayOrder', sql.Int, i);
        
        await faqRequest.execute('vendors.sp_InsertFAQExtended');
      }
    }
    
    // Mark setup as completed
    const updateRequest = new sql.Request(pool);
    updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    
    await updateRequest.execute('vendors.sp_MarkSetupComplete');
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
    
    const result = await request.execute('vendors.sp_GetSetupProgressSummary');
    
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
      step3: !!(profile.LogoURL),
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

    // Parse the VendorProfileID from URL
    const vendorProfileId = parseVendorProfileId(id);
    
    if (!vendorProfileId) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found. Please ensure the user is registered as a vendor.'
      });
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);

    const result = await request.execute('vendors.sp_GetSetupProgress');
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
    
    const verifyResult = await verifyRequest.execute('vendors.sp_VerifyProfileExists');
    
    if (verifyResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found. Please ensure the vendor profile exists.'
      });
    }

    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileIdNum);
    request.input('GalleryData', sql.NVarChar(sql.MAX), gallery ? JSON.stringify(gallery) : null);
    request.input('PackagesData', sql.NVarChar(sql.MAX), packages ? JSON.stringify(packages) : null);
    request.input('ServicesData', sql.NVarChar(sql.MAX), services ? JSON.stringify(services) : null);
    request.input('SocialMediaData', sql.NVarChar(sql.MAX), socialMedia ? JSON.stringify(socialMedia) : null);
    request.input('AvailabilityData', sql.NVarChar(sql.MAX), availability ? JSON.stringify(availability) : null);

    const result = await request.execute('vendors.sp_CompleteSetup');
    
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

    const result = await request.execute('vendors.sp_AddGalleryImage');
    
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

// DEPRECATED: Old package route - replaced by new packages route at bottom of file
// router.post('/:id/packages', ...) - see VENDOR PACKAGES ROUTES section

// Get vendor services
router.get('/:id/services', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const pool = await poolPromise;
    
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.execute('vendors.sp_GetServices');
    
    res.json({ success: true, services: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services', error: error.message });
  }
});

// Update or create a single service by predefined service ID (PATCH - upsert)
router.patch('/:id/services/:predefinedServiceId', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const predefinedServiceId = parseInt(req.params.predefinedServiceId);
    const { pricingModel, baseDurationMinutes, baseRate, overtimeRatePerHour, fixedPrice, perPersonPrice, minimumAttendees, maximumAttendees, description, imageURL, salePrice } = req.body;
    
    console.log('PATCH service request:', { vendorProfileId, predefinedServiceId, salePrice, pricingModel, fixedPrice });
    
    const pool = await poolPromise;
    
    // Check if service already exists
    const checkRequest = new sql.Request(pool);
    checkRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    checkRequest.input('LinkedPredefinedServiceID', sql.Int, predefinedServiceId);
    const checkResult = await checkRequest.query(`
      SELECT ServiceID FROM vendors.Services 
      WHERE VendorProfileID = @VendorProfileID AND LinkedPredefinedServiceID = @LinkedPredefinedServiceID
    `);
    
    const serviceExists = checkResult.recordset.length > 0;
    
    // Get predefined service details for name and category
    const predefinedRequest = new sql.Request(pool);
    predefinedRequest.input('PredefinedServiceID', sql.Int, predefinedServiceId);
    const predefinedResult = await predefinedRequest.query(`
      SELECT ServiceName, Category FROM admin.PredefinedServices WHERE PredefinedServiceID = @PredefinedServiceID
    `);
    const predefinedService = predefinedResult.recordset[0] || {};
    const serviceName = predefinedService.ServiceName || 'Service';
    const categoryName = predefinedService.Category || 'General';
    
    // Use sp_UpsertService stored procedure for both create and update
    const upsertRequest = new sql.Request(pool);
    upsertRequest.input('ServiceID', sql.Int, serviceExists ? checkResult.recordset[0].ServiceID : null);
    upsertRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    upsertRequest.input('CategoryID', sql.Int, null);
    upsertRequest.input('CategoryName', sql.NVarChar, categoryName);
    upsertRequest.input('Name', sql.NVarChar, serviceName);
    upsertRequest.input('ServiceName', sql.NVarChar, serviceName);
    upsertRequest.input('Description', sql.NVarChar, description || null);
    upsertRequest.input('ServiceDescription', sql.NVarChar, description || null);
    upsertRequest.input('Price', sql.Decimal(10, 2), fixedPrice || baseRate || perPersonPrice || 0);
    upsertRequest.input('DurationMinutes', sql.Int, baseDurationMinutes != null ? parseInt(baseDurationMinutes) : 60);
    upsertRequest.input('MaxAttendees', sql.Int, maximumAttendees != null ? parseInt(maximumAttendees) : null);
    upsertRequest.input('IsActive', sql.Bit, 1);
    upsertRequest.input('RequiresDeposit', sql.Bit, 1);
    upsertRequest.input('DepositPercentage', sql.Decimal(5, 2), 20);
    upsertRequest.input('CancellationPolicy', sql.NVarChar, null);
    upsertRequest.input('LinkedPredefinedServiceID', sql.Int, predefinedServiceId);
    upsertRequest.input('PricingModel', sql.NVarChar, pricingModel || 'time_based');
    upsertRequest.input('BaseDurationMinutes', sql.Int, baseDurationMinutes != null ? parseInt(baseDurationMinutes) : 60);
    upsertRequest.input('BaseRate', sql.Decimal(10, 2), baseRate != null && baseRate !== '' ? parseFloat(baseRate) : null);
    upsertRequest.input('OvertimeRatePerHour', sql.Decimal(10, 2), overtimeRatePerHour != null && overtimeRatePerHour !== '' ? parseFloat(overtimeRatePerHour) : null);
    upsertRequest.input('MinimumBookingFee', sql.Decimal(10, 2), null);
    upsertRequest.input('FixedPricingType', sql.NVarChar, pricingModel === 'per_attendee' ? 'per_attendee' : (pricingModel === 'fixed_price' ? 'fixed_price' : null));
    upsertRequest.input('FixedPrice', sql.Decimal(10, 2), fixedPrice != null && fixedPrice !== '' ? parseFloat(fixedPrice) : null);
    upsertRequest.input('PricePerPerson', sql.Decimal(10, 2), perPersonPrice != null && perPersonPrice !== '' ? parseFloat(perPersonPrice) : null);
    upsertRequest.input('MinimumAttendees', sql.Int, minimumAttendees != null && minimumAttendees !== '' ? parseInt(minimumAttendees) : null);
    upsertRequest.input('MaximumAttendees', sql.Int, maximumAttendees != null && maximumAttendees !== '' ? parseInt(maximumAttendees) : null);
    upsertRequest.input('ImageURL', sql.NVarChar(500), imageURL || null);
    upsertRequest.input('SalePrice', sql.Decimal(10, 2), salePrice != null && salePrice !== '' ? parseFloat(salePrice) : null);
    
    const result = await upsertRequest.execute('vendors.sp_UpsertService');
    const serviceId = result.recordset && result.recordset[0] ? result.recordset[0].ServiceID : null;
    
    console.log('Upsert result - serviceId:', serviceId, 'existed:', serviceExists);
    
    res.json({ 
      success: true, 
      message: serviceExists ? 'Service updated successfully' : 'Service created successfully',
      serviceId: serviceId
    });
  } catch (error) {
    console.error('Error saving service:', error);
    res.status(500).json({ success: false, message: 'Failed to save service', error: error.message });
  }
});

// Get vendor reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const pool = await poolPromise;
    
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.execute('vendors.sp_GetReviews');
    
    res.json({ success: true, reviews: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
});

// Get vendor gallery
router.get('/:id/gallery', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const pool = await poolPromise;
    
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.execute('vendors.sp_GetImages');
    
    res.json({ success: true, gallery: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch gallery', error: error.message });
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

    // Use legacy upsert SP for insertion (matching 11 parameter version)
    const request = new sql.Request(pool);
    // derive a legacy price for compatibility
    const legacyPrice = price != null ? parseFloat(price) : null;
    const derivedPrice = (fixedPrice != null ? parseFloat(fixedPrice) : (baseRate != null ? parseFloat(baseRate) : (pricePerPerson != null ? parseFloat(pricePerPerson) : legacyPrice)));
    
    request.input('VendorProfileID', sql.Int, id);
    request.input('CategoryName', sql.NVarChar, category || 'General');
    request.input('ServiceName', sql.NVarChar, serviceName);
    request.input('ServiceDescription', sql.NVarChar, description || null);
    request.input('Price', sql.Decimal(10, 2), derivedPrice);
    request.input('DurationMinutes', sql.Int, baseDurationMinutes != null ? parseInt(baseDurationMinutes) : (duration ? parseInt(duration) : null));
    request.input('MaxAttendees', sql.Int, maximumAttendees != null ? parseInt(maximumAttendees) : null);
    request.input('DepositPercentage', sql.Decimal(5, 2), 20);
    request.input('CancellationPolicy', sql.NVarChar, null);

    const insertResult = await request.execute('vendors.sp_UpsertService');
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

    const result = await request.execute('vendors.sp_AddSocialMedia');
    
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

    const result = await request.execute('vendors.sp_AddAvailability');
    
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

    const result = await request.execute('vendors.sp_GetSetupData');
    
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

    // Get all summary data using stored procedure
    const summaryResult = await request.execute('vendors.sp_GetSummary');

    if (summaryResult.recordsets[0].length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const basicInfo = summaryResult.recordsets[0][0];
    const categoriesResult = { recordset: summaryResult.recordsets[1] };
    const serviceAreasResult = { recordset: summaryResult.recordsets[2] };
    const servicesResult = { recordset: summaryResult.recordsets[3] };
    const packagesResult = { recordset: summaryResult.recordsets[4] };
    const imagesResult = { recordset: summaryResult.recordsets[5] };
    const socialMediaResult = { recordset: summaryResult.recordsets[6] };
    const businessHoursResult = { recordset: summaryResult.recordsets[7] };
    
    // Format time values - SQL Server returns TIME as Date objects
    const formatTime = (timeValue) => {
      if (!timeValue) return null;
      if (typeof timeValue === 'string') return timeValue;
      // If it's a Date object, extract time portion
      if (timeValue instanceof Date) {
        return timeValue.toTimeString().split(' ')[0]; // Returns HH:MM:SS
      }
      return timeValue;
    };
    
    const businessHours = businessHoursResult.recordset.map(bh => ({
      ...bh,
      OpenTime: formatTime(bh.OpenTime),
      CloseTime: formatTime(bh.CloseTime)
    }));

    const summaryData = {
      basicInfo,
      categories: categoriesResult.recordset,
      serviceAreas: serviceAreasResult.recordset,
      serviceCount: servicesResult.recordset[0]?.ServiceCount || 0,
      packageCount: packagesResult.recordset[0]?.PackageCount || 0,
      imageCount: imagesResult.recordset[0]?.ImageCount || 0,
      socialMedia: socialMediaResult.recordset,
      businessHours
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
    
    await request.execute('vendors.sp_UpdateLocation');
    
    // Handle service areas if provided
    if (serviceAreas && serviceAreas.length > 0) {
      // First, clear existing service areas
      const clearRequest = new sql.Request(pool);
      clearRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await clearRequest.execute('vendors.sp_DeleteServiceAreas');
      
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
        
        await areaRequest.execute('vendors.sp_InsertServiceAreaFull');
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
      deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteRequest.execute('vendors.sp_DeleteCategoryAnswers');

      // Insert new answers
      for (const answer of categoryAnswers) {
        const insertRequest = new sql.Request(pool);
        insertRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        insertRequest.input('QuestionID', sql.Int, answer.questionId);
        insertRequest.input('Answer', sql.NVarChar(sql.MAX), answer.answer);
        await insertRequest.execute('vendors.sp_InsertCategoryAnswer');
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
          
          // Try using VarChar instead of Time type to avoid validation issues
          request.input('OpenTime', sql.VarChar(8), openTime);
          request.input('CloseTime', sql.VarChar(8), closeTime);
          
          await request.execute('vendors.sp_InsertBusinessHourVarChar');
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
    const { vendorProfileId, logoURL, galleryImages } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Vendor profile ID is required' });
    }

    const pool = await poolPromise;
    
    // Update featured image if provided
    if (logoURL) {
      const request = new sql.Request(pool);
      request.input('VendorProfileID', sql.Int, vendorProfileId);
      request.input('LogoURL', sql.NVarChar(500), logoURL);
      
      await request.execute('vendors.sp_UpdateLogoURL');
    }
    
    // Save gallery images if provided
    if (galleryImages && Array.isArray(galleryImages) && galleryImages.length > 0) {
      // First, delete existing gallery images for this vendor
      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteRequest.execute('vendors.sp_DeleteGalleryImages');
      
      // Insert new gallery images
      for (let i = 0; i < galleryImages.length; i++) {
        const image = galleryImages[i];
        if (image.url) {
          const insertRequest = new sql.Request(pool);
          insertRequest.input('VendorProfileID', sql.Int, vendorProfileId);
          insertRequest.input('ImageURL', sql.NVarChar(500), image.url);
          insertRequest.input('Caption', sql.NVarChar(255), image.caption || '');
          insertRequest.input('ImageType', sql.NVarChar(20), 'Gallery');
          insertRequest.input('DisplayOrder', sql.Int, i);
          
          await insertRequest.execute('vendors.sp_InsertGalleryImageFull');
        }
      }
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
    
    if (socialProfiles) {
      // First, delete existing social media for this vendor
      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteRequest.execute('vendors.sp_DeleteSocialMedia');
      
      // Handle array format (socialMediaProfiles)
      if (Array.isArray(socialProfiles)) {
        for (let i = 0; i < socialProfiles.length; i++) {
          const profile = socialProfiles[i];
          if (profile.platform && profile.url) {
            const request = new sql.Request(pool);
            request.input('VendorProfileID', sql.Int, vendorProfileId);
            request.input('Platform', sql.NVarChar(50), profile.platform);
            request.input('URL', sql.NVarChar(500), profile.url);
            request.input('DisplayOrder', sql.Int, i);
            
            await request.execute('vendors.sp_InsertSocialMediaWithOrder');
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
            
            await request.execute('vendors.sp_InsertSocialMediaWithOrder');
          }
        }
      }
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
      await deleteRequest.execute('vendors.sp_DeleteFAQs');

      // Insert new FAQs
      for (let i = 0; i < faqs.length; i++) {
        const faq = faqs[i];
        if (faq.question && faq.answer) {
          const insertRequest = new sql.Request(pool);
          insertRequest.input('VendorProfileID', sql.Int, vendorProfileId);
          insertRequest.input('Question', sql.NVarChar(500), faq.question);
          insertRequest.input('Answer', sql.NVarChar(sql.MAX), faq.answer);
          insertRequest.input('AnswerType', sql.NVarChar(50), faq.answerType || 'text');
          insertRequest.input('AnswerOptions', sql.NVarChar(sql.MAX), faq.answerOptions ? JSON.stringify(faq.answerOptions) : null);
          insertRequest.input('DisplayOrder', sql.Int, i + 1);
          await insertRequest.execute('vendors.sp_InsertFAQWithActive');
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
    await updateRequest.execute('vendors.sp_MarkSetupCompleteWithTimestamp');
    
    // Handle any final FAQs if provided
    if (faqs && faqs.length > 0) {
      for (let i = 0; i < faqs.length; i++) {
        const faq = faqs[i];
        if (faq.question && faq.answer) {
          const faqRequest = new sql.Request(pool);
          faqRequest.input('VendorProfileID', sql.Int, vendorProfileId);
          faqRequest.input('Question', sql.NVarChar(500), faq.question);
          faqRequest.input('Answer', sql.NVarChar(sql.MAX), faq.answer);
          faqRequest.input('AnswerType', sql.NVarChar(50), faq.answerType || 'text');
          faqRequest.input('AnswerOptions', sql.NVarChar(sql.MAX), faq.answerOptions ? JSON.stringify(faq.answerOptions) : null);
          faqRequest.input('DisplayOrder', sql.Int, i + 1);
          await faqRequest.execute('vendors.sp_InsertFAQWithActive');
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
          
          await serviceRequest.execute('vendors.sp_InsertPredefinedService');
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
    
    // Get all summary data using stored procedure
    const summaryRequest = new sql.Request(pool);
    summaryRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const summaryResult = await summaryRequest.execute('vendors.sp_GetFullSummary');
    
    if (!summaryResult.recordsets[0] || summaryResult.recordsets[0].length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor profile not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        profile: summaryResult.recordsets[0][0],
        categoryAnswers: summaryResult.recordsets[1] || [],
        businessHours: summaryResult.recordsets[2] || [],
        galleryImages: summaryResult.recordsets[3] || [],
        socialMedia: summaryResult.recordsets[4] || [],
        faqs: summaryResult.recordsets[5] || []
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

    // Map display names to database category keys
    const categoryKeyMap = {
      'Photography': 'photo',
      'Photography & Videography': 'photo',
      'Photo & Video': 'photo',
      'Photo/Video': 'photo',
      'Videography': 'photo',
      'Venues': 'venue',
      'Venue': 'venue',
      'Music': 'music',
      'Music & Entertainment': 'music',
      'Music/DJ': 'music',
      'DJ': 'music',
      'Band': 'music',
      'Catering': 'catering',
      'Catering & Bar': 'catering',
      'Food & Beverage': 'catering',
      'Entertainment': 'entertainment',
      'Experiences': 'experiences',
      'Decor': 'decor',
      'Decoration': 'decor',
      'Decorations': 'decor',
      'Floral': 'decor',
      'Flowers': 'decor',
      'Beauty': 'beauty',
      'Beauty & Fashion': 'beauty',
      'Hair & Makeup': 'beauty',
      'Cake': 'cake',
      'Bakery': 'cake',
      'Cakes & Desserts': 'cake',
      'Transportation': 'transportation',
      'Transport': 'transportation',
      'Planner': 'planner',
      'Planners': 'planner',
      'Planning': 'planner',
      'Event Planning': 'planner',
      'Wedding Planner': 'planner',
      'Fashion': 'fashion',
      'Attire': 'fashion',
      'Stationery': 'stationery',
      'Invitations': 'stationery'
    };

    // Use mapped key or original value (lowercase)
    const categoryKey = categoryKeyMap[category] || category.toLowerCase();

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('Category', sql.NVarChar(50), categoryKey);
    
    const result = await request.execute('admin.sp_GetCategoryQuestions');
    
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

// Upload vendor logo
router.post('/:vendorProfileId/logo', upload.single('logo'), async (req, res) => {
  try {
    const { vendorProfileId } = req.params;

    if (isNaN(vendorProfileId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor profile ID'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinaryService.uploadImage(req.file.path, {
      folder: 'venuevue/vendor-logos',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'center' }
      ]
    });

    const logoUrl = uploadResult.secure_url;

    // Update vendor profile logo in database
    const pool = await poolPromise;
    const request = pool.request();
    request.input('VendorProfileID', sql.Int, parseInt(vendorProfileId));
    request.input('LogoURL', sql.NVarChar(255), logoUrl);

    await request.execute('vendors.sp_UpdateLogoSimple');

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logoUrl: logoUrl,
      url: logoUrl
    });

  } catch (err) {
    console.error('Logo upload error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo',
      error: err.message
    });
  }
});

// ==================== GOOGLE REVIEWS INTEGRATION ====================

// GET /api/vendors/google-reviews/:placeId
// Fetch Google Reviews for a specific Place ID
router.get('/google-reviews/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    if (!googleApiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Places API key not configured'
      });
    }

    // Fetch place details from Google Places API
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'name,rating,user_ratings_total,reviews,url',
        key: googleApiKey
      }
    });

    if (response.data.status !== 'OK') {
      return res.status(400).json({
        success: false,
        message: `Google Places API error: ${response.data.status}`,
        error: response.data.error_message || 'Invalid Place ID'
      });
    }

    const placeData = response.data.result;

    res.json({
      success: true,
      data: {
        rating: placeData.rating || 0,
        user_ratings_total: placeData.user_ratings_total || 0,
        url: placeData.url || '',
        reviews: (placeData.reviews || []).map(review => ({
          author_name: review.author_name,
          author_url: review.author_url,
          profile_photo_url: review.profile_photo_url,
          rating: review.rating,
          text: review.text,
          time: review.time,
          relative_time_description: review.relative_time_description
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching Google Reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Google Reviews',
      error: error.message
    });
  }
});

// GET /api/vendors/:vendorProfileId/google-reviews-settings
// Get Google Reviews settings for a vendor (uses stored procedure)
router.get('/:vendorProfileId/google-reviews-settings', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .execute('vendors.sp_GetGooglePlaceId');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    res.json({
      success: true,
      GooglePlaceId: result.recordset[0].GooglePlaceId || ''
    });
  } catch (error) {
    console.error('Error fetching Google Reviews settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
});

// POST /api/vendors/:vendorProfileId/google-reviews-settings
// Save Google Reviews settings for a vendor (uses stored procedure)
router.post('/:vendorProfileId/google-reviews-settings', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    const { GooglePlaceId } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .input('GooglePlaceId', sql.NVarChar(100), GooglePlaceId || null)
      .execute('vendors.sp_SaveGooglePlaceId');

    res.json({
      success: true,
      message: 'Google Place ID saved successfully'
    });
  } catch (error) {
    console.error('Error saving Google Reviews settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save settings',
      error: error.message
    });
  }
});

// POST /api/vendors/report
// Submit a report for a vendor listing
router.post('/report', async (req, res) => {
  try {
    const { vendorProfileId, reason, details, reportedBy } = req.body;
    
    if (!vendorProfileId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile ID and reason are required'
      });
    }
    
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .input('ReportedByUserID', sql.Int, reportedBy || null)
      .input('Reason', sql.NVarChar(50), reason)
      .input('Details', sql.NVarChar(sql.MAX), details || null)
      .execute('vendors.sp_SubmitVendorReport');
    
    res.json({
      success: true,
      message: 'Report submitted successfully',
      reportId: result.recordset[0]?.ReportID
    });
  } catch (error) {
    console.error('Error submitting vendor report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message
    });
  }
});

// Check vendor availability for a specific date and location
router.post('/check-availability', async (req, res) => {
  try {
    const { date, city, dayOfWeek, startTime, endTime } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    // Convert date to proper format
    const eventDate = new Date(date);
    const dayNumber = eventDate.getDay(); // 0=Sunday, 1=Monday, etc.
    
    // Convert time format from HH:MM to HH:MM:SS if needed
    const formatTime = (time) => {
      if (!time) return null;
      const timeStr = String(time).trim();
      const parts = timeStr.split(':');
      // If time is already in HH:MM:SS format, return as is
      if (parts.length === 3) return timeStr;
      // If time is in HH:MM format, add :00 for seconds
      if (parts.length === 2) return timeStr + ':00';
      // If invalid format, return null
      return null;
    };
    
    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);
    
    // Use sp_SearchVendors stored procedure for availability check
    request.input('SearchTerm', sql.NVarChar(100), null);
    request.input('Category', sql.NVarChar(50), null);
    request.input('City', sql.NVarChar(100), city || null);
    request.input('MinPrice', sql.Decimal(10, 2), null);
    request.input('MaxPrice', sql.Decimal(10, 2), null);
    request.input('MinRating', sql.Decimal(2, 1), null);
    request.input('IsPremium', sql.Bit, null);
    request.input('IsEcoFriendly', sql.Bit, null);
    request.input('IsAwardWinning', sql.Bit, null);
    request.input('IsLastMinute', sql.Bit, null);
    request.input('IsCertified', sql.Bit, null);
    request.input('IsInsured', sql.Bit, null);
    request.input('IsLocal', sql.Bit, null);
    request.input('IsMobile', sql.Bit, null);
    request.input('Latitude', sql.Decimal(10, 8), null);
    request.input('Longitude', sql.Decimal(11, 8), null);
    request.input('RadiusMiles', sql.Int, 50);
    request.input('PageNumber', sql.Int, 1);
    request.input('PageSize', sql.Int, 100);
    request.input('SortBy', sql.NVarChar(50), 'recommended');
    request.input('BudgetType', sql.NVarChar(20), null);
    request.input('PricingModelFilter', sql.NVarChar(20), null);
    request.input('FixedPricingTypeFilter', sql.NVarChar(20), null);
    request.input('Region', sql.NVarChar(50), null);
    request.input('PriceLevel', sql.NVarChar(10), null);
    request.input('EventDateRaw', sql.NVarChar(50), null);
    request.input('EventStartRaw', sql.NVarChar(20), null);
    request.input('EventEndRaw', sql.NVarChar(20), null);
    request.input('EventDate', sql.Date, eventDate);
    request.input('DayOfWeek', sql.NVarChar(10), dayOfWeek || null);
    request.input('StartTime', sql.VarChar(8), formattedStartTime);
    request.input('EndTime', sql.VarChar(8), formattedEndTime);

    const result = await request.execute('vendors.sp_Search');

    const availableVendors = result.recordset.map(vendor => ({
      vendorProfileId: vendor.VendorProfileID,
      businessName: vendor.BusinessName,
      displayName: vendor.DisplayName,
      city: vendor.City,
      state: vendor.State,
      logoUrl: vendor.LogoURL,
      averageRating: vendor.AverageRating,
      reviewCount: vendor.ReviewCount,
      isPremium: vendor.IsPremium,
      categoryName: vendor.PrimaryCategory || vendor.Categories
    }));

    res.json({
      success: true,
      availableVendors: availableVendors,
      totalCount: result.recordset.length,
      searchDate: date,
      searchCity: city,
      dayOfWeek: dayOfWeek
    });

  } catch (error) {
    console.error('Error checking vendor availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check vendor availability',
      error: error.message
    });
  }
});

// ===== BUSINESS PROFILE MANAGEMENT ENDPOINTS =====

// Get vendor social media
router.get('/:id/social', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const pool = await poolPromise;
    
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.execute('vendors.sp_GetSocialMedia');
    
    // Convert to object format expected by frontend
    const socialMedia = {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
      tiktok: ''
    };
    
    result.recordset.forEach(row => {
      const platform = row.Platform.toLowerCase();
      socialMedia[platform] = row.URL;
    });
    
    res.json(socialMedia);
  } catch (error) {
    console.error('Error fetching social media:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch social media', error: error.message });
  }
});

// Save vendor social media
router.post('/:id/social', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const { facebook, instagram, twitter, linkedin, youtube, tiktok } = req.body;
    const pool = await poolPromise;
    
    // Delete existing entries
    const deleteRequest = new sql.Request(pool);
    deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    await deleteRequest.execute('vendors.sp_DeleteSocialMedia');
    
    // Insert new entries
    const platforms = { Facebook: facebook, Instagram: instagram, Twitter: twitter, LinkedIn: linkedin, YouTube: youtube, TikTok: tiktok };
    let displayOrder = 0;
    
    for (const [platform, url] of Object.entries(platforms)) {
      if (url && url.trim()) {
        const insertRequest = new sql.Request(pool);
        insertRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        insertRequest.input('Platform', sql.NVarChar(50), platform);
        insertRequest.input('URL', sql.NVarChar(255), url);
        insertRequest.input('DisplayOrder', sql.Int, displayOrder++);
        
        await insertRequest.execute('vendors.sp_InsertSocialMediaWithOrder');
      }
    }
    
    res.json({ success: true, message: 'Social media saved successfully' });
  } catch (error) {
    console.error('Error saving social media:', error);
    res.status(500).json({ success: false, message: 'Failed to save social media', error: error.message });
  }
});

// Get vendor location and service areas
router.get('/:id/location', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const pool = await poolPromise;
    
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    // Get vendor profile location and service areas
    const locationResult = await request.execute('vendors.sp_GetLocationAndAreas');
    
    const profileData = locationResult.recordsets[0][0] || {};
    const areasData = locationResult.recordsets[1] || [];
    
    res.json({
      address: profileData.Address || '',
      city: profileData.City || '',
      state: profileData.State || '',
      country: profileData.Country || '',
      postalCode: profileData.PostalCode || '',
      latitude: profileData.Latitude || null,
      longitude: profileData.Longitude || null,
      serviceAreas: areasData.map(area => ({
        placeId: area.GooglePlaceID,
        city: area.CityName,
        province: area.StateProvince,
        country: area.Country,
        latitude: area.Latitude,
        longitude: area.Longitude,
        serviceRadius: area.ServiceRadius,
        formattedAddress: area.FormattedAddress,
        placeType: area.PlaceType,
        isActive: area.IsActive
      }))
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch location', error: error.message });
  }
});

// Save vendor location and service areas
router.post('/:id/location', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const { address, city, state, country, postalCode, latitude, longitude, serviceAreas } = req.body;
    const pool = await poolPromise;
    
    // Update vendor profile location
    const updateRequest = new sql.Request(pool);
    updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    updateRequest.input('Address', sql.NVarChar(255), address || null);
    updateRequest.input('City', sql.NVarChar(100), city || '');
    updateRequest.input('State', sql.NVarChar(50), state || '');
    updateRequest.input('Country', sql.NVarChar(50), country || 'Canada');
    updateRequest.input('PostalCode', sql.NVarChar(20), postalCode || null);
    updateRequest.input('Latitude', sql.Decimal(10, 8), latitude || null);
    updateRequest.input('Longitude', sql.Decimal(11, 8), longitude || null);
    
    await updateRequest.execute('vendors.sp_UpdateLocationProfile');
    
    // Delete existing service areas
    const deleteRequest = new sql.Request(pool);
    deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    await deleteRequest.execute('vendors.sp_DeleteServiceAreas');
    
    // Insert new service areas
    if (Array.isArray(serviceAreas) && serviceAreas.length > 0) {
      for (const area of serviceAreas) {
        const areaRequest = new sql.Request(pool);
        areaRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        areaRequest.input('GooglePlaceID', sql.NVarChar(100), area.placeId || '');
        areaRequest.input('CityName', sql.NVarChar(100), area.city || '');
        areaRequest.input('StateProvince', sql.NVarChar(100), area.province || area.state || '');
        areaRequest.input('Country', sql.NVarChar(100), area.country || 'Canada');
        areaRequest.input('Latitude', sql.Decimal(9, 6), area.latitude || null);
        areaRequest.input('Longitude', sql.Decimal(9, 6), area.longitude || null);
        areaRequest.input('ServiceRadius', sql.Decimal(10, 2), area.serviceRadius || 25.0);
        areaRequest.input('FormattedAddress', sql.NVarChar(255), area.formattedAddress || null);
        areaRequest.input('PlaceType', sql.NVarChar(50), area.placeType || null);
        
        await areaRequest.execute('vendors.sp_InsertServiceAreaSimple');
      }
    }
    
    res.json({ success: true, message: 'Location and service areas saved successfully' });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ success: false, message: 'Failed to save location', error: error.message });
  }
});

// Get vendor filters/badges
router.get('/:id/filters', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const pool = await poolPromise;
    
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    // Query the actual badge columns that exist in the database
    let result;
    try {
      result = await request.execute('vendors.sp_GetFilters');
      const profile = result.recordset[0] || {};
      
      // Reconstruct filters from boolean flags
      const filterList = [];
      if (profile.IsPremium) filterList.push('filter-premium');
      if (profile.IsEcoFriendly) filterList.push('filter-eco-friendly');
      if (profile.IsAwardWinning) filterList.push('filter-award-winning');
      if (profile.IsLastMinute) filterList.push('filter-last-minute');
      if (profile.IsCertified) filterList.push('filter-certified');
      if (profile.IsInsured) filterList.push('filter-insured');
      if (profile.IsLocal) filterList.push('filter-local');
      if (profile.IsMobile) filterList.push('filter-accessible'); // Map IsMobile to accessible
      
      res.json({
        filters: filterList.join(','),
        isPremium: profile.IsPremium || false,
        isEcoFriendly: profile.IsEcoFriendly || false,
        isAwardWinning: profile.IsAwardWinning || false,
        isLastMinute: profile.IsLastMinute || false,
        isCertified: profile.IsCertified || false,
        isInsured: profile.IsInsured || false,
        isLocal: profile.IsLocal || false,
        isMobile: profile.IsMobile || false
      });
    } catch (colError) {
      console.error('Error querying filters:', colError);
      res.json({ filters: '', isPremium: false });
    }
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch filters', error: error.message });
  }
});

// Save vendor filters/badges
router.put('/:id/filters', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const { filters } = req.body;
    const pool = await poolPromise;
    
    // Parse the comma-separated filters string
    const filterList = filters ? filters.split(',').filter(f => f) : [];
    
    // Map filter IDs to database columns
    const isPremium = filterList.includes('filter-premium');
    const isEcoFriendly = filterList.includes('filter-eco-friendly');
    const isAwardWinning = filterList.includes('filter-award-winning');
    const isLastMinute = filterList.includes('filter-last-minute');
    const isCertified = filterList.includes('filter-certified');
    const isInsured = filterList.includes('filter-insured');
    const isLocal = filterList.includes('filter-local');
    const isMobile = filterList.includes('filter-accessible'); // Map accessible to IsMobile
    
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('IsPremium', sql.Bit, isPremium);
    request.input('IsEcoFriendly', sql.Bit, isEcoFriendly);
    request.input('IsAwardWinning', sql.Bit, isAwardWinning);
    request.input('IsLastMinute', sql.Bit, isLastMinute);
    request.input('IsCertified', sql.Bit, isCertified);
    request.input('IsInsured', sql.Bit, isInsured);
    request.input('IsLocal', sql.Bit, isLocal);
    request.input('IsMobile', sql.Bit, isMobile);
    
    await request.execute('vendors.sp_UpdateFilters');
    
    res.json({ success: true, message: 'Filters saved successfully' });
  } catch (error) {
    console.error('Error saving filters:', error);
    res.status(500).json({ success: false, message: 'Failed to save filters', error: error.message });
  }
});

// Get vendor FAQs
router.get('/:id/faqs', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const pool = await poolPromise;
    
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.execute('vendors.sp_GetFAQs');
    
    res.json(result.recordset.map(faq => ({
      id: faq.FAQID,
      question: faq.Question,
      answer: faq.Answer,
      displayOrder: faq.DisplayOrder
    })));
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch FAQs', error: error.message });
  }
});

// Save vendor FAQs
router.post('/:id/faqs', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const { faqs } = req.body;
    const pool = await poolPromise;
    
    // Delete existing FAQs
    const deleteRequest = new sql.Request(pool);
    deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    await deleteRequest.execute('vendors.sp_DeleteFAQs');
    
    // Insert new FAQs
    if (Array.isArray(faqs) && faqs.length > 0) {
      for (let i = 0; i < faqs.length; i++) {
        const faq = faqs[i];
        const insertRequest = new sql.Request(pool);
        insertRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        insertRequest.input('Question', sql.NVarChar(500), faq.question);
        insertRequest.input('Answer', sql.NVarChar(sql.MAX), faq.answer);
        insertRequest.input('DisplayOrder', sql.Int, i);
        
        await insertRequest.execute('vendors.sp_InsertFAQSimple');
      }
    }
    
    res.json({ success: true, message: 'FAQs saved successfully' });
  } catch (error) {
    console.error('Error saving FAQs:', error);
    res.status(500).json({ success: false, message: 'Failed to save FAQs', error: error.message });
  }
});

// Delete a specific FAQ
router.delete('/:id/faqs/:faqId', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const { faqId } = req.params;
    const pool = await poolPromise;
    
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('FAQID', sql.Int, faqId);
    
    await request.execute('vendors.sp_DeleteFAQById');
    
    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ success: false, message: 'Failed to delete FAQ', error: error.message });
  }
});

// Get vendor images
router.get('/:id/images', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const pool = await poolPromise;
    
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.execute('vendors.sp_GetImages');
    
    res.json(result.recordset.map(img => ({
      id: img.ImageID,
      url: img.ImageURL,
      caption: img.Caption,
      isPrimary: img.IsPrimary,
      displayOrder: img.DisplayOrder,
      albumId: img.AlbumID
    })));
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch images', error: error.message });
  }
});

// Upload vendor images - EXACT COPY of working service-image/upload logic
router.post('/:id/images', upload.single('image'), async (req, res) => {
  try {
    // Ensure response is always JSON
    res.setHeader('Content-Type', 'application/json');
    
    const vendorProfileId = parseVendorProfileId(req.params.id);
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary is not configured. Please contact the administrator.'
      });
    }

    // Upload to Cloudinary - EXACT same as service-image/upload
    const result = await cloudinaryService.uploadImage(req.file.path, {
      folder: 'venuevue/vendor-images',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    // Insert into database
    const pool = await poolPromise;
    
    // Get max display order
    const orderRequest = new sql.Request(pool);
    orderRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const orderResult = await orderRequest.execute('vendors.sp_GetNextImageOrder');
    const nextOrder = orderResult.recordset[0].NextOrder;
    
    const insertRequest = new sql.Request(pool);
    insertRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    insertRequest.input('ImageURL', sql.NVarChar(500), result.secure_url);
    insertRequest.input('DisplayOrder', sql.Int, nextOrder);
    
    const insertResult = await insertRequest.execute('vendors.sp_InsertImageWithOutput');

    res.json({
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      id: insertResult.recordset[0].ImageID,
      url: result.secure_url,
      images: [{ id: insertResult.recordset[0].ImageID, url: result.secure_url }]
    });
  } catch (error) {
    console.error('Vendor image upload error:', error);
    // Ensure we always return JSON even on error
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload vendor image',
        error: error.message 
      });
    }
  }
});

// Delete vendor image
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const { imageId } = req.params;
    const pool = await poolPromise;
    
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('ImageID', sql.Int, imageId);
    
    await request.execute('vendors.sp_DeleteImageById');
    
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ success: false, message: 'Failed to delete image', error: error.message });
  }
});

// Add image by URL
router.post('/:id/images/url', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const { url, caption } = req.body;
    const pool = await poolPromise;
    
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }
    
    // Get max display order
    const orderRequest = new sql.Request(pool);
    orderRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const orderResult = await orderRequest.execute('vendors.sp_GetNextImageOrder');
    const nextOrder = orderResult.recordset[0].NextOrder;
    
    // Insert the image
    const insertRequest = new sql.Request(pool);
    insertRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    insertRequest.input('ImageURL', sql.NVarChar(500), url);
    insertRequest.input('Caption', sql.NVarChar(255), caption || null);
    insertRequest.input('DisplayOrder', sql.Int, nextOrder);
    
    const result = await insertRequest.execute('vendors.sp_InsertImageWithCaption');
    
    res.json({ 
      success: true, 
      message: 'Image added successfully',
      imageId: result.recordset[0].ImageID
    });
  } catch (error) {
    console.error('Error adding image by URL:', error);
    res.status(500).json({ success: false, message: 'Failed to add image', error: error.message });
  }
});

// Reorder vendor images
router.put('/:id/images/reorder', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const { images } = req.body;
    const pool = await poolPromise;
    
    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ success: false, message: 'Images array is required' });
    }
    
    // Update each image's display order
    for (const img of images) {
      const request = new sql.Request(pool);
      request.input('ImageID', sql.Int, img.imageId);
      request.input('VendorProfileID', sql.Int, vendorProfileId);
      request.input('DisplayOrder', sql.Int, img.displayOrder);
      
      await request.execute('vendors.sp_UpdateImageDisplayOrder');
    }
    
    res.json({ success: true, message: 'Images reordered successfully' });
  } catch (error) {
    console.error('Error reordering images:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder images', error: error.message });
  }
});

// Upload vendor logo
router.post('/:id/logo', upload.single('logo'), async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Upload to Cloudinary using cloudinaryService (same as working service-image/upload)
    const result = await cloudinaryService.uploadImage(req.file.path, {
      folder: 'venuevue/vendor-logos',
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
    
    // Update vendor profile with logo URL
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('LogoURL', sql.NVarChar(255), result.secure_url);
    
    await request.execute('vendors.sp_UpdateLogo');
    
    res.json({ success: true, logoUrl: result.secure_url });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ success: false, message: 'Failed to upload logo', error: error.message });
  }
});

// ============================================
// VENDOR PROFILE REVIEW WORKFLOW ENDPOINTS
// ============================================

// Submit vendor profile for admin review
router.post('/:vendorProfileId/submit-for-review', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    
    const pool = await poolPromise;
    
    // First check current profile status to prevent re-submission using stored procedure
    const checkRequest = new sql.Request(pool);
    checkRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const checkResult = await checkRequest.execute('vendors.sp_GetProfileStatus');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }
    
    const currentStatus = checkResult.recordset[0].ProfileStatus;
    
    // Prevent re-submission if already pending or approved
    if (currentStatus === 'pending_review') {
      return res.status(400).json({ 
        success: false, 
        message: 'Your profile is already under review. Please wait for approval or feedback.',
        status: currentStatus
      });
    }
    
    if (currentStatus === 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Your profile has already been approved.',
        status: currentStatus
      });
    }
    
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    // Update profile status to pending_review
    await request.execute('vendors.sp_SubmitForReview');
    
    // Get vendor details for email notification using stored procedure
    try {
      const vendorRequest = new sql.Request(pool);
      vendorRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      const vendorResult = await vendorRequest.execute('vendors.sp_GetVendorCompletionStatus');
      
      if (vendorResult.recordset.length > 0) {
        const vendor = vendorResult.recordset[0];
        console.log(`[SubmitForReview] Sending email notification for vendorProfileId: ${vendorProfileId}`);
        
        // Use EXACT SAME logic as SetupIncompleteBanner's isStepCompleted function
        // Step definitions from SetupIncompleteBanner.js lines 49-63
        const incompleteSections = [];
        
        // categories - "What services do you offer?" - return !!formData.primaryCategory
        if (!vendor.PrimaryCategory) {
          incompleteSections.push('What services do you offer?');
        }
        
        // business-details - "Tell us about your business" - return !!(formData.businessName && formData.displayName)
        if (!vendor.BusinessName || !vendor.DisplayName) {
          incompleteSections.push('Tell us about your business');
        }
        
        // contact - "How can clients reach you?" - return !!formData.businessPhone
        if (!vendor.BusinessPhone) {
          incompleteSections.push('How can clients reach you?');
        }
        
        // location - "Where are you located?" - return !!(formData.city && formData.province && formData.serviceAreas.length > 0)
        if (!vendor.City || !vendor.State || vendor.ServiceAreaCount === 0) {
          incompleteSections.push('Where are you located?');
        }
        
        // services - "What services do you provide?" - return formData.selectedServices.length > 0
        if (vendor.ServiceCount === 0) {
          incompleteSections.push('What services do you provide?');
        }
        
        // business-hours - "When are you available?" - return Object.values(formData.businessHours).some(h => h.isAvailable)
        if (vendor.AvailableDaysCount === 0) {
          incompleteSections.push('When are you available?');
        }
        
        
        // gallery - "Add photos to showcase your work" - return formData.photoURLs.length > 0
        if (vendor.ImageCount === 0) {
          incompleteSections.push('Add photos to showcase your work');
        }
        
        // social-media - "Connect your social profiles" - return !!(formData.facebook || formData.instagram || formData.twitter || formData.linkedin)
        if (vendor.SocialMediaCount === 0) {
          incompleteSections.push('Connect your social profiles');
        }
        
        // filters - "Enable special badges for your profile" - return formData.selectedFilters.length > 0
        if (vendor.HasBadges === 0) {
          incompleteSections.push('Enable special badges for your profile');
        }
        
        // stripe - "Connect Stripe for Payments" - OPTIONAL (temporarily bypassed) - always true
        // google-reviews - "Connect Google Reviews" - return !!formData.googlePlaceId
        if (!vendor.GooglePlaceId) {
          incompleteSections.push('Connect Google Reviews');
        }
        
        // policies - "Set your policies and answer common questions" - return !!(formData.cancellationPolicy || formData.depositRequirements || formData.paymentTerms || (formData.faqs && formData.faqs.length > 0))
        if (!vendor.CancellationPolicy && !vendor.DepositRequirements && !vendor.PaymentTerms && vendor.FAQCount === 0) {
          incompleteSections.push('Set your policies and answer common questions');
        }
        
        console.log(`[SubmitForReview] Incomplete sections (${incompleteSections.length}): ${incompleteSections.join(', ') || 'None'}`);
        
        await notifyAdminOfVendorApplication(
          vendor.UserID,
          parseInt(vendorProfileId),
          {
            businessName: vendor.BusinessName,
            businessEmail: vendor.BusinessEmail || null,
            businessPhone: vendor.BusinessPhone,
            category: vendor.PrimaryCategory || 'Not specified',
            // Pass the actual incomplete sections list instead of boolean flags
            incompleteSectionsList: incompleteSections
          }
        );
        console.log(`[SubmitForReview] Email notification sent successfully`);
      }
    } catch (emailErr) {
      console.error('[SubmitForReview] Failed to send vendor application notification:', emailErr.message);
      // Don't fail the submission if email fails
    }
    
    res.json({ 
      success: true, 
      message: 'Profile submitted for review',
      status: 'pending_review'
    });
  } catch (error) {
    console.error('Error submitting profile for review:', error);
    res.status(500).json({ success: false, message: 'Failed to submit profile for review', error: error.message });
  }
});

// Get all pending vendor profiles for admin review
router.get('/admin/pending-reviews', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    const result = await request.execute('vendors.sp_GetPendingReviews');
    
    res.json({ 
      success: true, 
      profiles: result.recordset 
    });
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending reviews', error: error.message });
  }
});

// Approve vendor profile (admin only)
router.post('/admin/:vendorProfileId/approve', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    const { adminNotes } = req.body;
    
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('AdminNotes', sql.NVarChar(sql.MAX), adminNotes || null);
    
    // Update profile status to approved and make it visible
    await request.execute('vendors.sp_ApproveProfile');
    
    // Send email notification to vendor
    try {
      await notifyVendorOfApproval(parseInt(vendorProfileId, 10));
    } catch (emailErr) {
      console.error('Failed to send approval notification:', emailErr.message);
    }
    
    res.json({ 
      success: true, 
      message: 'Profile approved and is now live',
      status: 'approved'
    });
  } catch (error) {
    console.error('Error approving profile:', error);
    res.status(500).json({ success: false, message: 'Failed to approve profile', error: error.message });
  }
});

// Reject vendor profile (admin only)
router.post('/admin/:vendorProfileId/reject', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    const { rejectionReason, adminNotes } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }
    
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('RejectionReason', sql.NVarChar(sql.MAX), rejectionReason);
    request.input('AdminNotes', sql.NVarChar(sql.MAX), adminNotes || null);
    
    // Update profile status to rejected
    await request.execute('vendors.sp_RejectProfile');
    
    // Send email notification to vendor
    try {
      await notifyVendorOfRejection(parseInt(vendorProfileId, 10), rejectionReason);
    } catch (emailErr) {
      console.error('Failed to send rejection notification:', emailErr.message);
    }
    
    res.json({ 
      success: true, 
      message: 'Profile rejected',
      status: 'rejected'
    });
  } catch (error) {
    console.error('Error rejecting profile:', error);
    res.status(500).json({ success: false, message: 'Failed to reject profile', error: error.message });
  }
});

// Get vendor profile status
router.get('/:vendorProfileId/status', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;
    
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.execute('vendors.sp_GetProfileStatus');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }
    
    res.json({ 
      success: true, 
      ...result.recordset[0]
    });
  } catch (error) {
    console.error('Error fetching profile status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile status', error: error.message });
  }
});

// ============================================
// VENDOR REVIEWS ENDPOINTS
// (Merged from reviews.js)
// ============================================

// POST /api/vendors/reviews/submit - Submit a review for a vendor with survey
router.post('/reviews/submit', async (req, res) => {
  try {
    const { 
      userId, vendorProfileId, bookingId, rating, title, comment,
      qualityRating, communicationRating, valueRating, 
      punctualityRating, professionalismRating, wouldRecommend 
    } = req.body;

    if (!userId || !vendorProfileId || !rating || !comment) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('UserID', sql.Int, userId);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('BookingID', sql.Int, bookingId || null);
    request.input('Rating', sql.Int, rating);
    request.input('Title', sql.NVarChar(100), title || null);
    request.input('Comment', sql.NVarChar(sql.MAX), comment);
    request.input('QualityRating', sql.TinyInt, qualityRating || null);
    request.input('CommunicationRating', sql.TinyInt, communicationRating || null);
    request.input('ValueRating', sql.TinyInt, valueRating || null);
    request.input('PunctualityRating', sql.TinyInt, punctualityRating || null);
    request.input('ProfessionalismRating', sql.TinyInt, professionalismRating || null);
    request.input('WouldRecommend', sql.Bit, wouldRecommend != null ? wouldRecommend : null);
    
    const result = await request.execute('vendors.sp_SubmitReview');
    
    // Check for error message (already reviewed)
    if (result.recordset[0]?.ErrorMessage) {
      return res.status(400).json({
        success: false,
        message: result.recordset[0].ErrorMessage
      });
    }
    
    res.json({
      success: true,
      review: result.recordset[0]
    });

  } catch (err) {
    console.error('Review submission error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit review',
      error: err.message 
    });
  }
});

// POST /api/vendors/reviews/upload-photo - Upload a photo for a review
router.post('/reviews/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Upload to Cloudinary in review-photos folder
    const result = await cloudinaryService.uploadImage(req.file.path, {
      folder: 'venuevue/review-photos',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Review photo upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload review photo',
      error: error.message 
    });
  }
});

// POST /api/vendors/reviews/submit-with-photos - Submit a review with photos
router.post('/reviews/submit-with-photos', async (req, res) => {
  try {
    const { 
      userId, vendorProfileId, bookingId, rating, title, comment,
      qualityRating, communicationRating, valueRating, 
      punctualityRating, professionalismRating, wouldRecommend,
      photoUrls // Array of photo URLs from Cloudinary
    } = req.body;

    if (!userId || !vendorProfileId || !rating || !comment) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('UserID', sql.Int, userId);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('BookingID', sql.Int, bookingId || null);
    request.input('Rating', sql.Int, rating);
    request.input('Title', sql.NVarChar(100), title || null);
    request.input('Comment', sql.NVarChar(sql.MAX), comment);
    request.input('QualityRating', sql.TinyInt, qualityRating || null);
    request.input('CommunicationRating', sql.TinyInt, communicationRating || null);
    request.input('ValueRating', sql.TinyInt, valueRating || null);
    request.input('PunctualityRating', sql.TinyInt, punctualityRating || null);
    request.input('ProfessionalismRating', sql.TinyInt, professionalismRating || null);
    request.input('WouldRecommend', sql.Bit, wouldRecommend != null ? wouldRecommend : null);
    // Store photo URLs as JSON string
    request.input('PhotoUrls', sql.NVarChar(sql.MAX), photoUrls && photoUrls.length > 0 ? JSON.stringify(photoUrls) : null);
    
    const result = await request.execute('vendors.sp_SubmitReviewWithPhotos');
    
    // Check for error message (already reviewed)
    if (result.recordset[0]?.ErrorMessage) {
      return res.status(400).json({
        success: false,
        message: result.recordset[0].ErrorMessage
      });
    }
    
    res.json({
      success: true,
      review: result.recordset[0]
    });

  } catch (err) {
    console.error('Review submission error:', err);
    // Fall back to regular submit if new SP doesn't exist
    if (err.message && err.message.includes('sp_SubmitReviewWithPhotos')) {
      // Try the original SP without photos
      try {
        const { 
          userId, vendorProfileId, bookingId, rating, title, comment,
          qualityRating, communicationRating, valueRating, 
          punctualityRating, professionalismRating, wouldRecommend
        } = req.body;

        const pool = await poolPromise;
        const request = pool.request();
        
        request.input('UserID', sql.Int, userId);
        request.input('VendorProfileID', sql.Int, vendorProfileId);
        request.input('BookingID', sql.Int, bookingId || null);
        request.input('Rating', sql.Int, rating);
        request.input('Title', sql.NVarChar(100), title || null);
        request.input('Comment', sql.NVarChar(sql.MAX), comment);
        request.input('QualityRating', sql.TinyInt, qualityRating || null);
        request.input('CommunicationRating', sql.TinyInt, communicationRating || null);
        request.input('ValueRating', sql.TinyInt, valueRating || null);
        request.input('PunctualityRating', sql.TinyInt, punctualityRating || null);
        request.input('ProfessionalismRating', sql.TinyInt, professionalismRating || null);
        request.input('WouldRecommend', sql.Bit, wouldRecommend != null ? wouldRecommend : null);
        
        const result = await request.execute('vendors.sp_SubmitReview');
        
        if (result.recordset[0]?.ErrorMessage) {
          return res.status(400).json({
            success: false,
            message: result.recordset[0].ErrorMessage
          });
        }
        
        return res.json({
          success: true,
          review: result.recordset[0],
          photosSkipped: true // Indicate photos weren't saved
        });
      } catch (fallbackErr) {
        return res.status(500).json({ 
          success: false,
          message: 'Failed to submit review',
          error: fallbackErr.message 
        });
      }
    }
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit review',
      error: err.message 
    });
  }
});

// GET /api/vendors/reviews/vendor/:vendorProfileId - Get reviews for a vendor
router.get('/reviews/vendor/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.execute('vendors.sp_GetVendorReviews');
    
    res.json({
      success: true,
      reviews: result.recordset
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch reviews',
      error: err.message 
    });
  }
});

// ============================================
// VENDOR ONLINE STATUS ENDPOINTS
// ============================================

// GET /api/vendors/online-status/:vendorProfileId - Get online status for a vendor
router.get('/online-status/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;

    if (isNaN(vendorProfileId)) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('VendorProfileID', sql.Int, parseInt(vendorProfileId))
      .execute('vendors.sp_GetOnlineStatus');

    if (result.recordset.length === 0) {
      return res.json({ 
        success: true, 
        isOnline: false, 
        lastActiveAt: null,
        lastActiveText: 'Never'
      });
    }

    const vendor = result.recordset[0];
    res.json({
      success: true,
      vendorProfileId: vendor.VendorProfileID,
      userId: vendor.UserID,
      isOnline: vendor.IsOnline === 1,
      lastActiveAt: vendor.LastActiveAt,
      lastActiveText: formatVendorLastActive(vendor.MinutesAgo, vendor.IsOnline)
    });
  } catch (err) {
    console.error('Get vendor online status error:', err);
    res.json({ success: false, isOnline: false, lastActiveAt: null });
  }
});

// POST /api/vendors/online-status/batch - Get online status for multiple vendors
router.post('/online-status/batch', async (req, res) => {
  try {
    const { vendorProfileIds } = req.body;

    if (!vendorProfileIds || !Array.isArray(vendorProfileIds) || vendorProfileIds.length === 0) {
      return res.status(400).json({ success: false, message: 'vendorProfileIds array is required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('VendorProfileIDs', sql.NVarChar(sql.MAX), vendorProfileIds.join(','))
      .execute('vendors.sp_GetOnlineStatus');

    const statusMap = {};
    result.recordset.forEach(vendor => {
      statusMap[vendor.VendorProfileID] = {
        isOnline: vendor.IsOnline === 1,
        lastActiveAt: vendor.LastActiveAt,
        lastActiveText: formatVendorLastActive(vendor.MinutesAgo, vendor.IsOnline)
      };
    });

    res.json({ success: true, statuses: statusMap });
  } catch (err) {
    console.error('Get batch vendor online status error:', err);
    res.json({ success: false, statuses: {} });
  }
});

// Helper function to format last active time for vendors
function formatVendorLastActive(minutesAgo, isOnline) {
  if (isOnline === 1 || minutesAgo === 'Online') return 'Online';
  if (minutesAgo === null || minutesAgo === undefined) return 'Never';
  
  const mins = parseInt(minutesAgo);
  if (isNaN(mins)) return 'Offline';
  
  if (mins < 60) return `Active ${mins} min ago`;
  if (mins < 1440) {
    const hours = Math.floor(mins / 60);
    return `Active ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  const days = Math.floor(mins / 1440);
  if (days === 1) return 'Active yesterday';
  if (days < 7) return `Active ${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `Active ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  return 'Active over a month ago';
}

// =============================================
// VENDOR CATEGORIES ROUTES
// =============================================

// GET /api/vendors/:id/categories - Get categories for a vendor
router.get('/:id/categories', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const pool = await poolPromise;
    const request = pool.request();
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    const result = await request.execute('vendors.sp_GetVendorCategories');
    
    res.json({ 
      success: true, 
      categories: result.recordset || [] 
    });
  } catch (err) {
    console.error('Get vendor categories error:', err);
    // Return empty array if table doesn't exist or other error
    res.json({ success: true, categories: [] });
  }
});

// PUT /api/vendors/:id/categories - Update vendor's primary category and subcategories
router.put('/:id/categories', async (req, res) => {
  try {
    const vendorProfileId = resolveVendorIdParam(req.params.id);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const { primaryCategoryId, primaryCategory, subcategoryIds } = req.body;
    
    // primaryCategoryId might be a string like "photo" or a category name like "Photo/Video"
    // We need to handle both cases
    let categoryName = primaryCategory || primaryCategoryId;
    
    // Map category IDs to names if needed
    const categoryIdToName = {
      'venue': 'Venues',
      'photo': 'Photo/Video',
      'music': 'Music/DJ',
      'catering': 'Catering',
      'entertainment': 'Entertainment',
      'decorations': 'Decorations',
      'beauty': 'Beauty',
      'cake': 'Cake',
      'transportation': 'Transportation',
      'planners': 'Planners',
      'fashion': 'Fashion',
      'stationery': 'Stationery'
    };
    
    if (categoryIdToName[categoryName]) {
      categoryName = categoryIdToName[categoryName];
    }

    const pool = await poolPromise;
    
    // Update primary category
    const categoryRequest = new sql.Request(pool);
    categoryRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    categoryRequest.input('Category', sql.NVarChar(100), categoryName);
    categoryRequest.input('IsPrimary', sql.Bit, 1);
    
    // First delete existing categories, then insert new one
    await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .query('DELETE FROM vendors.VendorCategories WHERE VendorProfileID = @VendorProfileID');
    
    await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .input('Category', sql.NVarChar(100), categoryName)
      .input('IsPrimary', sql.Bit, 1)
      .query('INSERT INTO vendors.VendorCategories (VendorProfileID, Category, IsPrimary) VALUES (@VendorProfileID, @Category, @IsPrimary)');
    
    // Update subcategories if provided
    if (subcategoryIds && Array.isArray(subcategoryIds)) {
      // Delete existing subcategories
      await pool.request()
        .input('VendorProfileID', sql.Int, vendorProfileId)
        .query('DELETE FROM vendors.VendorSubcategories WHERE VendorProfileID = @VendorProfileID');
      
      // Insert new subcategories
      for (const subId of subcategoryIds) {
        await pool.request()
          .input('VendorProfileID', sql.Int, vendorProfileId)
          .input('SubcategoryID', sql.Int, subId)
          .query('INSERT INTO vendors.VendorSubcategories (VendorProfileID, SubcategoryID) VALUES (@VendorProfileID, @SubcategoryID)');
      }
    }
    
    res.json({ success: true, message: 'Categories updated successfully' });
  } catch (err) {
    console.error('Update vendor categories error:', err);
    res.status(500).json({ success: false, message: 'Failed to update categories', error: err.message });
  }
});

// =============================================
// VENDOR PACKAGES ROUTES
// =============================================

// GET /api/vendors/:id/packages - Get packages for a vendor
router.get('/:id/packages', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    // Try stored procedure first, fallback to direct query
    try {
      const result = await request.execute('vendors.sp_GetVendorPackages');
      res.json({ success: true, packages: result.recordset || [] });
    } catch (spError) {
      // Fallback: use fallback stored procedure
      const fallbackRequest = pool.request();
      fallbackRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      const result = await fallbackRequest.execute('vendors.sp_GetPackagesFallback');
      
      // Parse IncludedServices JSON for each package
      const packages = (result.recordset || []).map(pkg => ({
        ...pkg,
        IncludedServices: pkg.IncludedServices ? JSON.parse(pkg.IncludedServices) : []
      }));
      
      res.json({ success: true, packages });
    }
  } catch (err) {
    console.error('Get vendor packages error:', err);
    // Return empty array if table doesn't exist yet
    res.json({ success: true, packages: [] });
  }
});

// POST /api/vendors/:id/packages - Create or update a package
router.post('/:id/packages', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const { packageId, name, description, includedServices, price, salePrice, priceType, durationMinutes, imageURL, finePrint, isActive, baseRate, overtimeRate, fixedPrice, pricePerPerson, minAttendees, maxAttendees } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Package name and price are required' });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('PackageID', sql.Int, packageId || null);
    request.input('PackageName', sql.NVarChar(200), name);
    request.input('Description', sql.NVarChar(sql.MAX), description || null);
    request.input('Price', sql.Decimal(10, 2), price);
    request.input('SalePrice', sql.Decimal(10, 2), salePrice || null);
    request.input('PriceType', sql.NVarChar(50), priceType || 'fixed_price');
    request.input('DurationMinutes', sql.Int, durationMinutes || null);
    request.input('ImageURL', sql.NVarChar(500), imageURL || null);
    request.input('FinePrint', sql.NVarChar(sql.MAX), finePrint || null);
    request.input('IncludedServices', sql.NVarChar(sql.MAX), JSON.stringify(includedServices || []));
    request.input('IsActive', sql.Bit, isActive !== false ? 1 : 0);
    request.input('BaseRate', sql.Decimal(10, 2), baseRate || null);
    request.input('OvertimeRate', sql.Decimal(10, 2), overtimeRate || null);
    request.input('FixedPrice', sql.Decimal(10, 2), fixedPrice || null);
    request.input('PricePerPerson', sql.Decimal(10, 2), pricePerPerson || null);
    request.input('MinAttendees', sql.Int, minAttendees || null);
    request.input('MaxAttendees', sql.Int, maxAttendees || null);
    
    // Try stored procedure first, fallback to direct query
    try {
      const result = await request.execute('vendors.sp_UpsertVendorPackage');
      res.json({ success: true, packageId: result.recordset[0]?.PackageID, message: 'Package saved successfully' });
    } catch (spError) {
      // Fallback: use fallback stored procedures
      if (packageId) {
        // Update existing package
        const updateRequest = pool.request();
        updateRequest.input('PackageID', sql.Int, packageId);
        updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        updateRequest.input('PackageName', sql.NVarChar(200), name);
        updateRequest.input('Description', sql.NVarChar(sql.MAX), description || null);
        updateRequest.input('Price', sql.Decimal(10, 2), price);
        updateRequest.input('SalePrice', sql.Decimal(10, 2), salePrice || null);
        updateRequest.input('PriceType', sql.NVarChar(50), priceType || 'fixed_price');
        updateRequest.input('DurationMinutes', sql.Int, durationMinutes || null);
        updateRequest.input('ImageURL', sql.NVarChar(500), imageURL || null);
        updateRequest.input('FinePrint', sql.NVarChar(sql.MAX), finePrint || null);
        updateRequest.input('IncludedServices', sql.NVarChar(sql.MAX), JSON.stringify(includedServices || []));
        updateRequest.input('IsActive', sql.Bit, isActive !== false ? 1 : 0);
        updateRequest.input('BaseRate', sql.Decimal(10, 2), baseRate || null);
        updateRequest.input('OvertimeRate', sql.Decimal(10, 2), overtimeRate || null);
        updateRequest.input('FixedPrice', sql.Decimal(10, 2), fixedPrice || null);
        updateRequest.input('PricePerPerson', sql.Decimal(10, 2), pricePerPerson || null);
        updateRequest.input('MinAttendees', sql.Int, minAttendees || null);
        updateRequest.input('MaxAttendees', sql.Int, maxAttendees || null);
        await updateRequest.execute('vendors.sp_UpdatePackageFull');
        res.json({ success: true, packageId, message: 'Package updated successfully' });
      } else {
        // Insert new package
        const insertRequest = pool.request();
        insertRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        insertRequest.input('PackageName', sql.NVarChar(200), name);
        insertRequest.input('Description', sql.NVarChar(sql.MAX), description || null);
        insertRequest.input('Price', sql.Decimal(10, 2), price);
        insertRequest.input('SalePrice', sql.Decimal(10, 2), salePrice || null);
        insertRequest.input('PriceType', sql.NVarChar(50), priceType || 'fixed_price');
        insertRequest.input('DurationMinutes', sql.Int, durationMinutes || null);
        insertRequest.input('ImageURL', sql.NVarChar(500), imageURL || null);
        insertRequest.input('FinePrint', sql.NVarChar(sql.MAX), finePrint || null);
        insertRequest.input('IncludedServices', sql.NVarChar(sql.MAX), JSON.stringify(includedServices || []));
        insertRequest.input('IsActive', sql.Bit, isActive !== false ? 1 : 0);
        insertRequest.input('BaseRate', sql.Decimal(10, 2), baseRate || null);
        insertRequest.input('OvertimeRate', sql.Decimal(10, 2), overtimeRate || null);
        insertRequest.input('FixedPrice', sql.Decimal(10, 2), fixedPrice || null);
        insertRequest.input('PricePerPerson', sql.Decimal(10, 2), pricePerPerson || null);
        insertRequest.input('MinAttendees', sql.Int, minAttendees || null);
        insertRequest.input('MaxAttendees', sql.Int, maxAttendees || null);
        const insertResult = await insertRequest.execute('vendors.sp_InsertPackageFull');
        res.json({ success: true, packageId: insertResult.recordset[0]?.PackageID, message: 'Package created successfully' });
      }
    }
  } catch (err) {
    console.error('Upsert vendor package error:', err);
    res.status(500).json({ success: false, message: 'Failed to save package', error: err.message });
  }
});

// DELETE /api/vendors/:id/packages/:packageId - Delete a package
router.delete('/:id/packages/:packageId', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const packageId = parseInt(req.params.packageId);
    
    if (!vendorProfileId || isNaN(packageId)) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID or package ID' });
    }

    const pool = await poolPromise;
    
    // Soft delete by setting IsActive = 0
    const deleteRequest = pool.request();
    deleteRequest.input('PackageID', sql.Int, packageId);
    deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    await deleteRequest.execute('vendors.sp_SoftDeletePackage');
    
    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (err) {
    console.error('Delete vendor package error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete package', error: err.message });
  }
});

// =============================================
// VENDOR BADGES ROUTES
// =============================================

// GET /api/vendors/:id/badges - Get badges for a vendor
router.get('/:id/badges', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.execute('vendors.sp_GetVendorBadges');
    let badges = result.recordset || [];
    
    // Badge image mapping - images stored in /images/badges/
    // Include variations of badge type names
    const badgeImages = {
      'new_vendor': '/images/badges/new_vendor_2026.png',
      'newvendor': '/images/badges/new_vendor_2026.png',
      'new vendor': '/images/badges/new_vendor_2026.png',
      'featured': '/images/badges/featured_2026.png',
      'verified': '/images/badges/verified_2026.png',
      'choice_award': '/images/badges/choice_award_2026.png',
      'choiceaward': '/images/badges/choice_award_2026.png',
      'choice award': '/images/badges/choice_award_2026.png',
      'top_rated': '/images/badges/top_rated_2026.png',
      'toprated': '/images/badges/top_rated_2026.png',
      'top rated': '/images/badges/top_rated_2026.png'
    };
    
    // Add image URLs to badges if not already set
    console.log('Raw badges from DB:', badges.map(b => ({ BadgeType: b.BadgeType, ImageURL: b.ImageURL })));
    badges = badges.map(badge => {
      const badgeType = badge.BadgeType?.toLowerCase()?.replace(/\s+/g, '_') || '';
      const imageUrl = badge.ImageURL || badgeImages[badgeType] || badgeImages[badge.BadgeType?.toLowerCase()] || null;
      console.log(`Badge ${badge.BadgeType} -> imageUrl: ${imageUrl}`);
      return {
        ...badge,
        ImageURL: imageUrl
      };
    });
    
    // Check if vendor is new (joined within 90 days) and doesn't already have new_vendor badge
    const hasNewVendorBadge = badges.some(b => b.BadgeType?.toLowerCase() === 'new_vendor');
    if (!hasNewVendorBadge) {
      const createdAtRequest = new sql.Request(pool);
      createdAtRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      const createdAtResult = await createdAtRequest.query(`
        SELECT CreatedAt FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID
      `);
      
      if (createdAtResult.recordset && createdAtResult.recordset.length > 0) {
        const createdAt = createdAtResult.recordset[0].CreatedAt;
        if (createdAt) {
          const daysSinceCreated = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
          if (daysSinceCreated <= 90) {
            // Auto-add new vendor badge
            badges.push({
              BadgeID: 0, // Virtual badge, not in database
              BadgeType: 'new_vendor',
              BadgeName: 'New Vendor',
              Year: new Date().getFullYear(),
              ImageURL: badgeImages['new_vendor'],
              Description: 'Recently joined our platform',
              IsAutomatic: true
            });
          }
        }
      }
    }
    
    res.json({ success: true, badges });
  } catch (err) {
    console.error('Get vendor badges error:', err);
    res.status(500).json({ success: false, message: 'Failed to get vendor badges', error: err.message });
  }
});

// POST /api/vendors/:id/badges - Assign badge to vendor (admin only)
router.post('/:id/badges', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const { badgeType, badgeName, year, imageURL, description } = req.body;
    
    if (!badgeType) {
      return res.status(400).json({ success: false, message: 'Badge type is required' });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('BadgeType', sql.NVarChar(50), badgeType);
    request.input('BadgeName', sql.NVarChar(100), badgeName || null);
    request.input('Year', sql.Int, year || null);
    request.input('ImageURL', sql.NVarChar(500), imageURL || null);
    request.input('Description', sql.NVarChar(500), description || null);
    
    const result = await request.execute('vendors.sp_AssignVendorBadge');
    
    res.json({ success: true, badgeId: result.recordset[0]?.BadgeID, message: 'Badge assigned successfully' });
  } catch (err) {
    console.error('Assign vendor badge error:', err);
    res.status(500).json({ success: false, message: 'Failed to assign badge', error: err.message });
  }
});

// DELETE /api/vendors/:id/badges/:badgeId - Remove badge from vendor (admin only)
router.delete('/:id/badges/:badgeId', async (req, res) => {
  try {
    const vendorProfileId = parseVendorProfileId(req.params.id);
    const badgeId = parseInt(req.params.badgeId);
    
    if (!vendorProfileId || isNaN(badgeId)) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID or badge ID' });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('BadgeID', sql.Int, badgeId);
    
    await request.execute('vendors.sp_RemoveVendorBadge');
    
    res.json({ success: true, message: 'Badge removed successfully' });
  } catch (err) {
    console.error('Remove vendor badge error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove badge', error: err.message });
  }
});

// =============================================
// VENDOR ATTRIBUTES & BOOKING SETTINGS ROUTES
// =============================================

// GET /api/vendors/lookup/event-types - Get all event types
router.get('/lookup/event-types', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('admin.sp_GetEventTypes');
    res.json({ success: true, eventTypes: result.recordset || [] });
  } catch (err) {
    console.error('Get event types error:', err);
    res.status(500).json({ success: false, message: 'Failed to get event types', error: err.message });
  }
});

// GET /api/vendors/lookup/cultures - Get all cultures
router.get('/lookup/cultures', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('admin.sp_GetCultures');
    res.json({ success: true, cultures: result.recordset || [] });
  } catch (err) {
    console.error('Get cultures error:', err);
    res.status(500).json({ success: false, message: 'Failed to get cultures', error: err.message });
  }
});

// GET /api/vendors/lookup/experience-ranges - Get experience range options (static)
router.get('/lookup/experience-ranges', async (req, res) => {
  res.json({
    success: true,
    experienceRanges: [
      { key: '0-1', label: 'Less than 1 year' },
      { key: '1-2', label: '1-2 years' },
      { key: '2-5', label: '2-5 years' },
      { key: '5-10', label: '5-10 years' },
      { key: '10-15', label: '10-15 years' },
      { key: '15+', label: '15+ years' }
    ]
  });
});

// GET /api/vendors/lookup/service-locations - Get service location options (static)
router.get('/lookup/service-locations', async (req, res) => {
  res.json({
    success: true,
    serviceLocations: [
      { key: 'Local', label: 'Local (within city)' },
      { key: 'Regional', label: 'Regional (within province)' },
      { key: 'National', label: 'National (across Canada)' },
      { key: 'International', label: 'International' }
    ]
  });
});

// GET /api/vendors/lookup/lead-times - Get lead time options (static)
router.get('/lookup/lead-times', async (req, res) => {
  res.json({
    success: true,
    leadTimes: [
      { hours: 0, label: 'No minimum' },
      { hours: 24, label: '24 hours (1 day)' },
      { hours: 48, label: '48 hours (2 days)' },
      { hours: 72, label: '72 hours (3 days)' },
      { hours: 168, label: '1 week' },
      { hours: 336, label: '2 weeks' },
      { hours: 504, label: '3 weeks' },
      { hours: 720, label: '1 month' },
      { hours: 1440, label: '2 months' }
    ]
  });
});

// GET /api/vendors/lookup/affordability-levels - Get affordability level options (static)
router.get('/lookup/affordability-levels', async (req, res) => {
  res.json({
    success: true,
    affordabilityLevels: [
      { key: 'Inexpensive', label: '$ - Inexpensive', symbol: '$' },
      { key: 'Moderate', label: '$$ - Moderate', symbol: '$$' },
      { key: 'Premium', label: '$$$ - Premium', symbol: '$$$' },
      { key: 'Luxury', label: '$$$$ - Luxury', symbol: '$$$$' }
    ]
  });
});

// GET /api/vendors/lookup/price-types - Get price type options (static)
router.get('/lookup/price-types', async (req, res) => {
  res.json({
    success: true,
    priceTypes: [
      { key: 'Hourly', label: 'Hourly Rate' },
      { key: 'Fixed', label: 'Fixed Price' },
      { key: 'StartingFrom', label: 'Starting From' },
      { key: 'CustomQuote', label: 'Custom Quote' }
    ]
  });
});

// GET /api/vendors/lookup/subcategories - Get subcategories (optionally filtered by category)
router.get('/lookup/subcategories', async (req, res) => {
  try {
    const { category } = req.query;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    if (category) {
      request.input('Category', sql.NVarChar(50), category);
    }
    
    const result = await request.execute('admin.sp_GetSubcategories');
    res.json({ success: true, subcategories: result.recordset || [] });
  } catch (err) {
    console.error('Get subcategories lookup error:', err);
    res.status(500).json({ success: false, message: 'Failed to get subcategories', error: err.message });
  }
});

// GET /api/vendors/subcategories/:category - Get subcategories for a category
router.get('/subcategories/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('Category', sql.NVarChar(50), decodeURIComponent(category));
    
    const result = await request.execute('admin.sp_GetSubcategories');
    res.json({ success: true, subcategories: result.recordset || [] });
  } catch (err) {
    console.error('Get subcategories error:', err);
    res.status(500).json({ success: false, message: 'Failed to get subcategories', error: err.message });
  }
});

// GET /api/vendors/:id/subcategories - Get vendor's selected subcategories
router.get('/:id/subcategories', async (req, res) => {
  try {
    const vendorProfileId = resolveVendorIdParam(req.params.id);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.execute('vendors.sp_Vendor_GetSubcategories');
    res.json({ success: true, subcategories: result.recordset || [] });
  } catch (err) {
    console.error('Get vendor subcategories error:', err);
    res.status(500).json({ success: false, message: 'Failed to get vendor subcategories', error: err.message });
  }
});

// PUT /api/vendors/:id/subcategories - Update vendor's subcategories
router.put('/:id/subcategories', async (req, res) => {
  try {
    const vendorProfileId = resolveVendorIdParam(req.params.id);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const { subcategoryIds } = req.body;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('SubcategoryIDs', sql.NVarChar(sql.MAX), Array.isArray(subcategoryIds) ? subcategoryIds.join(',') : (subcategoryIds || ''));
    
    await request.execute('vendors.sp_Vendor_UpdateSubcategories');
    res.json({ success: true, message: 'Subcategories updated successfully' });
  } catch (err) {
    console.error('Update vendor subcategories error:', err);
    res.status(500).json({ success: false, message: 'Failed to update subcategories', error: err.message });
  }
});

// ============================================
// VENDOR FEATURES ENDPOINTS
// ============================================

// GET /api/vendors/features/categories - Get all feature categories
router.get('/features/categories', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    const result = await request.execute('vendors.sp_GetFeatureCategories');
    res.json({ success: true, categories: result.recordset || [] });
  } catch (err) {
    console.error('Get feature categories error:', err);
    res.status(500).json({ success: false, message: 'Failed to get feature categories', error: err.message });
  }
});

// GET /api/vendors/features/category/:categoryKey - Get features by category
router.get('/features/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('CategoryID', sql.Int, parseInt(categoryId));
    const result = await request.execute('vendors.sp_GetFeaturesByCategory');
    res.json({ success: true, features: result.recordset || [] });
  } catch (err) {
    console.error('Get features by category error:', err);
    res.status(500).json({ success: false, message: 'Failed to get features', error: err.message });
  }
});

// GET /api/vendors/features/all-grouped - Get all features grouped by category
router.get('/features/all-grouped', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    const result = await request.execute('vendors.sp_GetAllFeaturesGrouped');
    
    // Group the results by category
    const grouped = {};
    (result.recordset || []).forEach(feature => {
      const catName = feature.CategoryName || 'Other';
      if (!grouped[catName]) {
        grouped[catName] = {
          categoryId: feature.CategoryID,
          categoryName: catName,
          categoryIcon: feature.CategoryIcon,
          displayOrder: feature.CategoryOrder || feature.CategoryDisplayOrder,
          applicableVendorCategories: feature.ApplicableVendorCategories,
          features: []
        };
      }
      // Only add feature if it has a valid FeatureID (LEFT JOIN may return nulls)
      if (feature.FeatureID) {
        grouped[catName].features.push({
          featureId: feature.FeatureID,
          featureName: feature.FeatureName,
          featureDescription: feature.FeatureDescription,
          featureIcon: feature.FeatureIcon,
          displayOrder: feature.FeatureOrder || feature.FeatureDisplayOrder
        });
      }
    });
    
    // Convert to array and sort by category order
    const categories = Object.values(grouped).sort((a, b) => a.displayOrder - b.displayOrder);
    res.json({ success: true, categories });
  } catch (err) {
    console.error('Get all features grouped error:', err);
    res.status(500).json({ success: false, message: 'Failed to get features', error: err.message });
  }
});

// GET /api/vendors/features/vendor/:vendorProfileId - Get vendor's selected features
router.get('/features/vendor/:vendorProfileId', async (req, res) => {
  try {
    const vendorProfileId = resolveVendorIdParam(req.params.vendorProfileId);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }
    
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    const result = await request.execute('vendors.sp_GetSelectedFeatures');
    res.json({ success: true, features: result.recordset || [] });
  } catch (err) {
    console.error('Get vendor features error:', err);
    res.status(500).json({ success: false, message: 'Failed to get vendor features', error: err.message });
  }
});

// POST /api/vendors/features/vendor/:vendorProfileId - Save vendor's feature selections
router.post('/features/vendor/:vendorProfileId', async (req, res) => {
  try {
    const vendorProfileId = resolveVendorIdParam(req.params.vendorProfileId);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }
    
    const { featureIds } = req.body;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('FeatureIDs', sql.NVarChar(sql.MAX), Array.isArray(featureIds) ? featureIds.join(',') : (featureIds || ''));
    
    await request.execute('vendors.sp_SaveFeatureSelections');
    res.json({ success: true, message: 'Features saved successfully' });
  } catch (err) {
    console.error('Save vendor features error:', err);
    res.status(500).json({ success: false, message: 'Failed to save features', error: err.message });
  }
});

// GET /api/vendors/features/vendor/:vendorProfileId/summary - Get vendor's feature summary
router.get('/features/vendor/:vendorProfileId/summary', async (req, res) => {
  try {
    const vendorProfileId = resolveVendorIdParam(req.params.vendorProfileId);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }
    
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    const result = await request.execute('vendors.sp_GetFeatureSummary');
    
    // Group by category for display
    const grouped = {};
    (result.recordset || []).forEach(feature => {
      const catName = feature.CategoryName || 'Other';
      if (!grouped[catName]) {
        grouped[catName] = {
          categoryName: catName,
          categoryIcon: feature.CategoryIcon,
          features: []
        };
      }
      grouped[catName].features.push({
        featureId: feature.FeatureID,
        featureName: feature.FeatureName,
        featureIcon: feature.FeatureIcon
      });
    });
    
    res.json({ success: true, summary: Object.values(grouped) });
  } catch (err) {
    console.error('Get vendor feature summary error:', err);
    res.status(500).json({ success: false, message: 'Failed to get feature summary', error: err.message });
  }
});

// GET /api/vendors/:id/attributes - Get vendor's attributes (event types, cultures, settings)
router.get('/:id/attributes', async (req, res) => {
  try {
    const vendorProfileId = resolveVendorIdParam(req.params.id);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.execute('vendors.sp_Vendor_GetAttributes');
    
    // Parse multiple result sets
    const profile = result.recordsets[0]?.[0] || {};
    const eventTypes = result.recordsets[1] || [];
    const cultures = result.recordsets[2] || [];
    const subcategories = result.recordsets[3] || [];
    
    res.json({
      success: true,
      attributes: {
        instantBookingEnabled: profile.InstantBookingEnabled || false,
        minBookingLeadTimeHours: profile.MinBookingLeadTimeHours || 24,
        serviceLocationScope: profile.ServiceLocationScope || 'Local',
        yearsOfExperienceRange: profile.YearsOfExperienceRange || '',
        priceType: profile.PriceType || '',
        basePrice: profile.BasePrice || null,
        eventTypes,
        cultures,
        subcategories
      }
    });
  } catch (err) {
    console.error('Get vendor attributes error:', err);
    res.status(500).json({ success: false, message: 'Failed to get vendor attributes', error: err.message });
  }
});

// PUT /api/vendors/:id/event-types - Update vendor's event types
router.put('/:id/event-types', async (req, res) => {
  try {
    const vendorProfileId = resolveVendorIdParam(req.params.id);
    console.log('[event-types] Saving event types for vendor:', vendorProfileId, 'eventTypeIds:', req.body.eventTypeIds);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const { eventTypeIds } = req.body;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    const eventTypeIdsStr = Array.isArray(eventTypeIds) ? eventTypeIds.join(',') : (eventTypeIds || '');
    request.input('EventTypeIDs', sql.NVarChar(sql.MAX), eventTypeIdsStr);
    
    console.log('[event-types] Calling sp_Vendor_UpdateEventTypes with VendorProfileID:', vendorProfileId, 'EventTypeIDs:', eventTypeIdsStr);
    await request.execute('vendors.sp_Vendor_UpdateEventTypes');
    
    // Verify the save worked
    const verifyQuery = `SELECT * FROM vendors.VendorEventTypes WHERE VendorProfileID = ${vendorProfileId}`;
    const verifyResult = await pool.request().query(verifyQuery);
    console.log('[event-types] Verification - saved event types:', verifyResult.recordset);
    
    res.json({ success: true, message: 'Event types updated successfully' });
  } catch (err) {
    console.error('Update vendor event types error:', err);
    res.status(500).json({ success: false, message: 'Failed to update event types', error: err.message });
  }
});

// PUT /api/vendors/:id/cultures - Update vendor's cultures
router.put('/:id/cultures', async (req, res) => {
  try {
    const vendorProfileId = resolveVendorIdParam(req.params.id);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const { cultureIds } = req.body;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('CultureIDs', sql.NVarChar(sql.MAX), Array.isArray(cultureIds) ? cultureIds.join(',') : (cultureIds || ''));
    
    await request.execute('vendors.sp_Vendor_UpdateCultures');
    res.json({ success: true, message: 'Cultures updated successfully' });
  } catch (err) {
    console.error('Update vendor cultures error:', err);
    res.status(500).json({ success: false, message: 'Failed to update cultures', error: err.message });
  }
});

// PUT /api/vendors/:id/booking-settings - Update vendor's booking settings
router.put('/:id/booking-settings', async (req, res) => {
  try {
    const vendorProfileId = resolveVendorIdParam(req.params.id);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const { instantBookingEnabled, minBookingLeadTimeHours } = req.body;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('InstantBookingEnabled', sql.Bit, instantBookingEnabled ? 1 : 0);
    request.input('MinBookingLeadTimeHours', sql.Int, minBookingLeadTimeHours || 24);
    
    await request.execute('vendors.sp_Vendor_UpdateBookingSettings');
    res.json({ success: true, message: 'Booking settings updated successfully' });
  } catch (err) {
    console.error('Update vendor booking settings error:', err);
    res.status(500).json({ success: false, message: 'Failed to update booking settings', error: err.message });
  }
});

// GET /api/vendors/:id/category-answers - Get vendor's category answers
router.get('/:id/category-answers', async (req, res) => {
  try {
    const vendorProfileId = resolveVendorIdParam(req.params.id);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    
    const result = await request.query(`
      SELECT vca.AnswerID, vca.QuestionID, vca.Answer, cq.QuestionText, cq.Category
      FROM vendors.VendorCategoryAnswers vca
      JOIN admin.CategoryQuestions cq ON vca.QuestionID = cq.QuestionID
      WHERE vca.VendorProfileID = @VendorProfileID
    `);
    
    res.json({ success: true, answers: result.recordset || [] });
  } catch (err) {
    console.error('Get vendor category answers error:', err);
    res.status(500).json({ success: false, message: 'Failed to get category answers', error: err.message });
  }
});

// PUT /api/vendors/:id/category-answers - Save vendor's category answers
router.put('/:id/category-answers', async (req, res) => {
  try {
    const vendorProfileId = resolveVendorIdParam(req.params.id);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const { answers } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Answers must be an array' });
    }

    const pool = await poolPromise;
    
    // Process each answer - upsert pattern
    for (const answer of answers) {
      const request = new sql.Request(pool);
      request.input('VendorProfileID', sql.Int, vendorProfileId);
      request.input('QuestionID', sql.Int, answer.questionId);
      request.input('Answer', sql.NVarChar(sql.MAX), answer.answer || '');
      
      await request.query(`
        MERGE vendors.VendorCategoryAnswers AS target
        USING (SELECT @VendorProfileID AS VendorProfileID, @QuestionID AS QuestionID) AS source
        ON target.VendorProfileID = source.VendorProfileID AND target.QuestionID = source.QuestionID
        WHEN MATCHED THEN
          UPDATE SET Answer = @Answer, UpdatedAt = GETUTCDATE()
        WHEN NOT MATCHED THEN
          INSERT (VendorProfileID, QuestionID, Answer, CreatedAt, UpdatedAt)
          VALUES (@VendorProfileID, @QuestionID, @Answer, GETUTCDATE(), GETUTCDATE());
      `);
    }
    
    res.json({ success: true, message: 'Category answers saved successfully' });
  } catch (err) {
    console.error('Save vendor category answers error:', err);
    res.status(500).json({ success: false, message: 'Failed to save category answers', error: err.message });
  }
});

// PUT /api/vendors/:id/vendor-attributes - Update vendor's profile attributes
router.put('/:id/vendor-attributes', async (req, res) => {
  try {
    const vendorProfileId = resolveVendorIdParam(req.params.id);
    if (!vendorProfileId) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }

    const { serviceLocationScope, yearsOfExperienceRange, priceType, basePrice } = req.body;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('ServiceLocationScope', sql.NVarChar(20), serviceLocationScope || null);
    request.input('YearsOfExperienceRange', sql.NVarChar(20), yearsOfExperienceRange || null);
    request.input('PriceType', sql.NVarChar(20), priceType || null);
    request.input('BasePrice', sql.Decimal(10, 2), basePrice || null);
    
    await request.execute('vendors.sp_Vendor_UpdateAttributes');
    res.json({ success: true, message: 'Vendor attributes updated successfully' });
  } catch (err) {
    console.error('Update vendor attributes error:', err);
    res.status(500).json({ success: false, message: 'Failed to update vendor attributes', error: err.message });
  }
});

// =============================================
// VENDOR FILTER OPTIONS & COUNT PREVIEW
// =============================================

// GET /api/vendors/filter-options - Get all filter options with counts for the filter modal
router.get('/filter-options', async (req, res) => {
  try {
    const { category, city, latitude, longitude, radiusMiles } = req.query;
    const pool = await poolPromise;

    // Get all lookup data in parallel for performance
    const [eventTypesRes, culturesRes, experienceRes, locationsRes, affordabilityRes] = await Promise.all([
      pool.request().execute('admin.sp_GetEventTypes'),
      pool.request().execute('admin.sp_GetCultures'),
      Promise.resolve({ 
        recordset: [
          { key: '0-1', label: 'Less than 1 year' },
          { key: '1-2', label: '1-2 years' },
          { key: '2-5', label: '2-5 years' },
          { key: '5-10', label: '5-10 years' },
          { key: '10-15', label: '10-15 years' },
          { key: '15+', label: '15+ years' }
        ]
      }),
      Promise.resolve({
        recordset: [
          { key: 'Local', label: 'Local (within city)' },
          { key: 'Regional', label: 'Regional (within province)' },
          { key: 'National', label: 'National (across Canada)' },
          { key: 'International', label: 'International' }
        ]
      }),
      Promise.resolve({
        recordset: [
          { key: 'Inexpensive', label: '$ - Inexpensive', symbol: '$' },
          { key: 'Moderate', label: '$$ - Moderate', symbol: '$$' },
          { key: 'Premium', label: '$$$ - Premium', symbol: '$$$' },
          { key: 'Luxury', label: '$$$$ - Luxury', symbol: '$$$$' }
        ]
      })
    ]);

    res.json({
      success: true,
      filterOptions: {
        eventTypes: eventTypesRes.recordset || [],
        cultures: culturesRes.recordset || [],
        experienceRanges: experienceRes.recordset || [],
        serviceLocations: locationsRes.recordset || [],
        affordabilityLevels: affordabilityRes.recordset || [],
        priceRange: { min: 0, max: 5000 },
        instantBooking: [
          { key: 'any', label: 'Any' },
          { key: 'instant', label: 'Instant Booking Only' }
        ]
      }
    });
  } catch (err) {
    console.error('Get filter options error:', err);
    res.status(500).json({ success: false, message: 'Failed to get filter options', error: err.message });
  }
});

// POST /api/vendors/filter-count - Get count of vendors matching filters (for live count updates)
router.post('/filter-count', async (req, res) => {
  try {
    const {
      category,
      city,
      latitude,
      longitude,
      radiusMiles,
      eventTypes,
      cultures,
      experienceRange,
      serviceLocation,
      affordabilityLevel,
      minPrice,
      maxPrice,
      instantBookingOnly,
      minRating,
      // NEW: Enhanced filter parameters
      minReviewCount,
      freshListingsDays,
      hasGoogleReviews,
      availabilityDate,
      availabilityDayOfWeek
    } = req.body;

    const pool = await poolPromise;
    
    // Use the enhanced sp_SearchEnhanced stored procedure for filter count
    const request = new sql.Request(pool);
    
    // Parse event types and cultures
    const eventTypeIdsStr = eventTypes && eventTypes.length > 0 
      ? (Array.isArray(eventTypes) ? eventTypes.join(',') : eventTypes)
      : null;
    const cultureIdsStr = cultures && cultures.length > 0 
      ? (Array.isArray(cultures) ? cultures.join(',') : cultures)
      : null;
    
    request.input('SearchTerm', sql.NVarChar(100), null);
    request.input('Category', sql.NVarChar(50), (category && category !== 'all') ? category : null);
    request.input('City', sql.NVarChar(100), city || null);
    request.input('MinPrice', sql.Decimal(10, 2), minPrice ? parseFloat(minPrice) : null);
    request.input('MaxPrice', sql.Decimal(10, 2), (maxPrice && maxPrice < 10000) ? parseFloat(maxPrice) : null);
    request.input('MinRating', sql.Decimal(2, 1), minRating ? parseFloat(minRating) : null);
    request.input('IsPremium', sql.Bit, null);
    request.input('IsEcoFriendly', sql.Bit, null);
    request.input('IsAwardWinning', sql.Bit, null);
    request.input('Latitude', sql.Decimal(10, 8), latitude ? parseFloat(latitude) : null);
    request.input('Longitude', sql.Decimal(11, 8), longitude ? parseFloat(longitude) : null);
    request.input('RadiusMiles', sql.Int, radiusMiles ? parseInt(radiusMiles) : 100);
    request.input('PageNumber', sql.Int, 1);
    request.input('PageSize', sql.Int, 500);
    request.input('SortBy', sql.NVarChar(50), 'recommended');
    // NEW: Enhanced filter parameters
    request.input('MinReviewCount', sql.Int, minReviewCount ? parseInt(minReviewCount) : null);
    request.input('InstantBookingOnly', sql.Bit, (instantBookingOnly === true || instantBookingOnly === 'true') ? 1 : null);
    request.input('FreshListingsDays', sql.Int, freshListingsDays ? parseInt(freshListingsDays) : null);
    request.input('HasGoogleReviews', sql.Bit, (hasGoogleReviews === true || hasGoogleReviews === 'true') ? 1 : null);
    request.input('AvailabilityDate', sql.Date, availabilityDate || null);
    request.input('AvailabilityDayOfWeek', sql.Int, availabilityDayOfWeek ? parseInt(availabilityDayOfWeek) : null);
    request.input('EventTypeIDs', sql.NVarChar(sql.MAX), eventTypeIdsStr);
    request.input('CultureIDs', sql.NVarChar(sql.MAX), cultureIdsStr);
    request.input('FeatureIDs', sql.NVarChar(sql.MAX), null);
    request.input('QuestionFilters', sql.NVarChar(sql.MAX), null);
    request.input('IsCertified', sql.Bit, null);
    request.input('IsInsured', sql.Bit, null);
    request.input('ExperienceRange', sql.NVarChar(20), experienceRange || null);
    request.input('ServiceLocation', sql.NVarChar(50), serviceLocation || null);

    let result;
    try {
      result = await request.execute('vendors.sp_SearchEnhanced');
      console.log('[filter-count] sp_SearchEnhanced returned:', result.recordset?.length || 0, 'vendors');
    } catch (spErr) {
      console.warn('[filter-count] sp_SearchEnhanced failed, falling back to sp_Search:', spErr.message);
      // Fallback to old stored procedure
      const fallbackRequest = new sql.Request(pool);
      fallbackRequest.input('SearchTerm', sql.NVarChar(100), null);
      fallbackRequest.input('Category', sql.NVarChar(50), (category && category !== 'all') ? category : null);
      fallbackRequest.input('City', sql.NVarChar(100), city || null);
      fallbackRequest.input('MinPrice', sql.Decimal(10, 2), minPrice ? parseFloat(minPrice) : null);
      fallbackRequest.input('MaxPrice', sql.Decimal(10, 2), (maxPrice && maxPrice < 10000) ? parseFloat(maxPrice) : null);
      fallbackRequest.input('MinRating', sql.Decimal(2, 1), minRating ? parseFloat(minRating) : null);
      fallbackRequest.input('IsPremium', sql.Bit, null);
      fallbackRequest.input('IsEcoFriendly', sql.Bit, null);
      fallbackRequest.input('IsAwardWinning', sql.Bit, null);
      fallbackRequest.input('IsLastMinute', sql.Bit, null);
      fallbackRequest.input('IsCertified', sql.Bit, null);
      fallbackRequest.input('IsInsured', sql.Bit, null);
      fallbackRequest.input('IsLocal', sql.Bit, null);
      fallbackRequest.input('IsMobile', sql.Bit, null);
      fallbackRequest.input('Latitude', sql.Decimal(10, 8), latitude ? parseFloat(latitude) : null);
      fallbackRequest.input('Longitude', sql.Decimal(11, 8), longitude ? parseFloat(longitude) : null);
      fallbackRequest.input('RadiusMiles', sql.Int, radiusMiles ? parseInt(radiusMiles) : 100);
      fallbackRequest.input('PageNumber', sql.Int, 1);
      fallbackRequest.input('PageSize', sql.Int, 500);
      fallbackRequest.input('SortBy', sql.NVarChar(50), 'recommended');
      fallbackRequest.input('BudgetType', sql.NVarChar(20), null);
      fallbackRequest.input('PricingModelFilter', sql.NVarChar(20), null);
      fallbackRequest.input('FixedPricingTypeFilter', sql.NVarChar(20), null);
      fallbackRequest.input('Region', sql.NVarChar(50), null);
      fallbackRequest.input('PriceLevel', sql.NVarChar(10), null);
      fallbackRequest.input('EventDateRaw', sql.NVarChar(50), null);
      fallbackRequest.input('EventStartRaw', sql.NVarChar(20), null);
      fallbackRequest.input('EventEndRaw', sql.NVarChar(20), null);
      fallbackRequest.input('EventDate', sql.Date, null);
      fallbackRequest.input('DayOfWeek', sql.NVarChar(10), null);
      fallbackRequest.input('StartTime', sql.VarChar(8), null);
      fallbackRequest.input('EndTime', sql.VarChar(8), null);
      result = await fallbackRequest.execute('vendors.sp_Search');
    }
    
    let vendors = result.recordset || [];
    console.log('[filter-count] Final vendor count:', vendors.length);
    
    // Post-query filtering only needed for fallback (sp_SearchEnhanced handles these)
    if (!result.recordset?.[0]?.HasGoogleReviews && (instantBookingOnly === true || instantBookingOnly === 'true')) {
      vendors = vendors.filter(v => v.InstantBookingEnabled);
    }
    if (!result.recordset?.[0]?.HasGoogleReviews && experienceRange) {
      vendors = vendors.filter(v => v.YearsOfExperienceRange === experienceRange);
    }
    if (!result.recordset?.[0]?.HasGoogleReviews && serviceLocation) {
      vendors = vendors.filter(v => v.ServiceLocationScope === serviceLocation);
    }
    
    // Event type and culture filtering only needed for fallback
    if (!result.recordset?.[0]?.HasGoogleReviews && eventTypes && eventTypes.length > 0) {
      const eventTypeIds = Array.isArray(eventTypes) ? eventTypes.map(id => parseInt(id)) : eventTypes.split(',').map(id => parseInt(id.trim()));
      const validEventTypeIds = eventTypeIds.filter(id => !isNaN(id) && id > 0);
      console.log('[filter-count] Filtering by eventTypes:', validEventTypeIds);
      if (validEventTypeIds.length > 0) {
        // Ensure vendorIds are integers
        const vendorIds = vendors.map(v => parseInt(v.VendorProfileID || v.id)).filter(id => !isNaN(id) && id > 0);
        console.log('[filter-count] Vendor IDs to check:', vendorIds);
        if (vendorIds.length > 0) {
          try {
            const eventTypeQuery = `
              SELECT DISTINCT VendorProfileID 
              FROM vendors.VendorEventTypes 
              WHERE EventTypeID IN (${validEventTypeIds.join(',')})
              AND VendorProfileID IN (${vendorIds.join(',')})
            `;
            console.log('[filter-count] Event type query:', eventTypeQuery);
            const etResult = await pool.request().query(eventTypeQuery);
            console.log('[filter-count] Event type query result:', etResult.recordset);
            // Convert to Set of integers for proper comparison
            const matchingVendorIds = new Set(etResult.recordset.map(r => parseInt(r.VendorProfileID)));
            console.log('[filter-count] Vendors matching event types:', matchingVendorIds.size, [...matchingVendorIds]);
            vendors = vendors.filter(v => matchingVendorIds.has(parseInt(v.VendorProfileID || v.id)));
          } catch (etErr) {
            console.warn('[filter-count] Event type filtering failed:', etErr.message);
          }
        } else {
          vendors = [];
        }
      }
    }
    
    // Filter by cultures if specified (only for fallback)
    if (!result.recordset?.[0]?.HasGoogleReviews && cultures && cultures.length > 0) {
      const cultureIdsParsed = Array.isArray(cultures) ? cultures.map(id => parseInt(id)) : cultures.split(',').map(id => parseInt(id.trim()));
      const validCultureIds = cultureIdsParsed.filter(id => !isNaN(id) && id > 0);
      if (validCultureIds.length > 0) {
        const vendorIds = vendors.map(v => parseInt(v.VendorProfileID || v.id)).filter(id => !isNaN(id) && id > 0);
        if (vendorIds.length > 0) {
          try {
            const cultureQuery = `
              SELECT DISTINCT VendorProfileID 
              FROM vendors.VendorCultures 
              WHERE CultureID IN (${validCultureIds.join(',')})
              AND VendorProfileID IN (${vendorIds.join(',')})
            `;
            const cResult = await pool.request().query(cultureQuery);
            const matchingVendorIds = new Set(cResult.recordset.map(r => parseInt(r.VendorProfileID)));
            vendors = vendors.filter(v => matchingVendorIds.has(parseInt(v.VendorProfileID || v.id)));
          } catch (cErr) {
            console.warn('[filter-count] Culture filtering failed:', cErr.message);
          }
        } else {
          vendors = [];
        }
      }
    }
    
    const count = vendors.length;
    console.log('[filter-count] Final count after attribute filters:', count);

    res.json({
      success: true,
      count,
      filters: {
        category,
        city,
        eventTypes,
        cultures,
        experienceRange,
        serviceLocation,
        minPrice,
        maxPrice,
        instantBookingOnly,
        minRating,
        // NEW: Enhanced filter parameters
        minReviewCount,
        freshListingsDays,
        hasGoogleReviews,
        availabilityDate,
        availabilityDayOfWeek
      }
    });
  } catch (err) {
    console.error('Filter count error:', err);
    res.status(500).json({ success: false, message: 'Failed to get filter count', error: err.message });
  }
});

// POST /api/vendors/filter-availability - Get which filter options are available given current selections
router.post('/filter-availability', async (req, res) => {
  try {
    const {
      category,
      city,
      latitude,
      longitude,
      radiusMiles,
      eventTypes,
      cultures,
      experienceRange,
      serviceLocation,
      affordabilityLevel,
      instantBookingOnly
    } = req.body;

    const pool = await poolPromise;
    
    // Build base query with current filters
    let baseConditions = `vp.IsVisible = 1`;
    const request = new sql.Request(pool);
    
    if (category && category !== 'all') {
      baseConditions += ` AND EXISTS (
        SELECT 1 FROM vendors.VendorCategories vc 
        WHERE vc.VendorProfileID = vp.VendorProfileID 
        AND vc.Category LIKE '%' + @Category + '%'
      )`;
      request.input('Category', sql.NVarChar(50), category);
    }
    
    // Geographic filter - use lat/lng with radius instead of city string
    if (latitude && longitude) {
      const radiusValue = radiusMiles || 50;
      baseConditions += ` AND (
        vp.Latitude IS NOT NULL AND vp.Longitude IS NOT NULL
        AND (
          3959 * ACOS(
            COS(RADIANS(${parseFloat(latitude)})) * COS(RADIANS(vp.Latitude)) * 
            COS(RADIANS(vp.Longitude) - RADIANS(${parseFloat(longitude)})) + 
            SIN(RADIANS(${parseFloat(latitude)})) * SIN(RADIANS(vp.Latitude))
          )
        ) <= ${parseInt(radiusValue)}
      )`;
    } else if (city) {
      baseConditions += ` AND vp.City LIKE '%' + @City + '%'`;
      request.input('City', sql.NVarChar(100), city);
    }

    // Get counts for each event type
    const eventTypeCountsQuery = `
      SELECT et.EventTypeID, et.EventTypeName, COUNT(DISTINCT vp.VendorProfileID) AS VendorCount
      FROM admin.EventTypes et
      LEFT JOIN vendors.VendorEventTypes vet ON et.EventTypeID = vet.EventTypeID
      LEFT JOIN vendors.VendorProfiles vp ON vet.VendorProfileID = vp.VendorProfileID AND ${baseConditions}
      GROUP BY et.EventTypeID, et.EventTypeName
      ORDER BY et.EventTypeName
    `;

    // Get counts for each culture
    const cultureCountsQuery = `
      SELECT c.CultureID, c.CultureName, COUNT(DISTINCT vp.VendorProfileID) AS VendorCount
      FROM admin.Cultures c
      LEFT JOIN vendors.VendorCultures vc ON c.CultureID = vc.CultureID
      LEFT JOIN vendors.VendorProfiles vp ON vc.VendorProfileID = vp.VendorProfileID AND ${baseConditions}
      GROUP BY c.CultureID, c.CultureName
      ORDER BY c.CultureName
    `;

    const [eventTypeCounts, cultureCounts] = await Promise.all([
      request.query(eventTypeCountsQuery),
      pool.request().query(cultureCountsQuery.replace('@Category', `'${category || ''}'`).replace('@City', `'${city || ''}'`))
    ]);

    res.json({
      success: true,
      availability: {
        eventTypes: eventTypeCounts.recordset.map(et => ({
          id: et.EventTypeID,
          name: et.EventTypeName,
          count: et.VendorCount,
          available: et.VendorCount > 0
        })),
        cultures: cultureCounts.recordset.map(c => ({
          id: c.CultureID,
          name: c.CultureName,
          count: c.VendorCount,
          available: c.VendorCount > 0
        }))
      }
    });
  } catch (err) {
    console.error('Filter availability error:', err);
    res.status(500).json({ success: false, message: 'Failed to get filter availability', error: err.message });
  }
});

module.exports = router;
