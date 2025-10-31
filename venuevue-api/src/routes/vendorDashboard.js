const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

function isStripeConfigured() {
  try {
    const sk = process.env.STRIPE_SECRET_KEY || '';
    return !!sk && !sk.includes('placeholder');
  } catch (e) { return false; }
}

async function getStripeStatus(pool, vendorProfileId) {
  try {
    const r = await new sql.Request(pool)
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .query('SELECT StripeAccountID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID');
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

async function computeSetupStatusByUserId(userId) {
  const pool = await poolPromise;
  const req = new sql.Request(pool);
  req.input('UserID', sql.Int, parseInt(userId));
  const prof = await req.query(`
    SELECT VendorProfileID, BusinessName, BusinessEmail, BusinessPhone, Address, FeaturedImageURL,
           DepositRequirements, PaymentMethods, PaymentTerms, LicenseNumber, InsuranceVerified,
           IsVerified, IsCompleted, AcceptingBookings
    FROM VendorProfiles WHERE UserID = @UserID`);
  if (!prof.recordset.length) return { exists: false, message: 'Vendor profile not found' };
  const p = prof.recordset[0];
  const vId = p.VendorProfileID;
  const counts = await new sql.Request(pool)
    .input('VendorProfileID', sql.Int, vId)
    .query(`SELECT
      (SELECT COUNT(*) FROM VendorCategories WHERE VendorProfileID=@VendorProfileID) AS CategoriesCount,
      (SELECT COUNT(*) FROM VendorImages WHERE VendorProfileID=@VendorProfileID) AS ImagesCount,
      (SELECT COUNT(*) FROM Services s JOIN ServiceCategories sc ON s.CategoryID=sc.CategoryID WHERE sc.VendorProfileID=@VendorProfileID AND s.IsActive=1) AS ServicesCount,
      (SELECT COUNT(*) FROM Packages WHERE VendorProfileID=@VendorProfileID) AS PackageCount,
      (SELECT COUNT(*) FROM VendorFAQs WHERE VendorProfileID=@VendorProfileID AND (IsActive = 1 OR IsActive IS NULL)) AS FAQCount,
      (SELECT COUNT(*) FROM VendorCategoryAnswers WHERE VendorProfileID=@VendorProfileID) AS CategoryAnswerCount,
      (SELECT COUNT(*) FROM VendorSocialMedia WHERE VendorProfileID=@VendorProfileID) AS SocialCount,
      (SELECT COUNT(*) FROM VendorBusinessHours WHERE VendorProfileID=@VendorProfileID AND IsAvailable=1) AS HoursCount,
      (SELECT COUNT(*) FROM VendorServiceAreas WHERE VendorProfileID=@VendorProfileID AND IsActive=1) AS ServiceAreaCount`);
  const c = counts.recordset[0] || {};
  const stripeStatus = await getStripeStatus(pool, vId);

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
    // Keep policies for legacy use (not in required list)
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
  const allRequiredComplete = incompleteSteps.length === 0;
  const canGoPublic = allRequiredComplete;
  return {
    exists: true,
    vendorProfileId: vId,
    steps,
    stripe: stripeStatus,
    allRequiredComplete,
    canGoPublic,
    isCompletedFlag: !!p.IsCompleted,
    acceptingBookings: !!p.AcceptingBookings,
    incompleteSteps
  };
}

// Get vendor dashboard data (summary)
router.get('/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params; // This 'id' is UserID for sp_GetVendorDashboard

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, id);

    const result = await request.execute('sp_GetVendorDashboard');
    
    // Handle case when no data is returned
    const profile = result.recordsets[0] && result.recordsets[0][0] ? result.recordsets[0][0] : null;
    const recentBookings = result.recordsets[1] || [];
    const recentReviews = result.recordsets[2] || [];
    const unreadMessages = (result.recordsets[3] && result.recordsets[3][0]) ? result.recordsets[3][0].UnreadMessages : 0;
    const unreadNotifications = (result.recordsets[4] && result.recordsets[4][0]) ? result.recordsets[4][0].UnreadNotifications : 0;
    const stats = result.recordsets[5] && result.recordsets[5][0] ? result.recordsets[5][0] : {
      totalBookings: 0,
      totalRevenue: 0,
      averageRating: 0,
      totalReviews: 0
    };

    const setupStatus = await computeSetupStatusByUserId(id);

    const dashboard = {
      success: true,
      profile: profile,
      recentBookings: recentBookings,
      recentReviews: recentReviews,
      unreadMessages: unreadMessages,
      unreadNotifications: unreadNotifications,
      stats: stats,
      setupStatus: setupStatus
    };

    res.json(dashboard);

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

router.get('/:id/setup-status', async (req, res) => {
  try {
    const status = await computeSetupStatusByUserId(req.params.id);
    if (!status.exists) return res.status(404).json({ success: false, message: status.message || 'Not found' });
    res.json({ success: true, ...status });
  } catch (err) {
    console.error('Setup status error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute setup status', error: err.message });
  }
});

// Get vendor analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params; // This 'id' is VendorProfileID for sp_GetVendorAnalytics
    const { startDate, endDate } = req.query;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('VendorProfileID', sql.Int, id);
    request.input('StartDate', sql.Date, startDate || null);
    request.input('EndDate', sql.Date, endDate || null);

    const result = await request.execute('sp_GetVendorAnalytics');
    
    const analytics = {
      bookingStats: result.recordsets[0][0],
      revenueByService: result.recordsets[1],
      revenueByMonth: result.recordsets[2],
      reviewStats: result.recordsets[3][0]
    };

    res.json(analytics);

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

// Get all bookings for a specific vendor
router.get('/:id/bookings/all', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetVendorBookingsAll');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get all vendor bookings error:', err);
    res.status(500).json({ message: 'Failed to get vendor bookings', error: err.message });
  }
});

// Get all services for a specific vendor
router.get('/:id/services', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetVendorServices');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get vendor services error:', err);
    res.status(500).json({ message: 'Failed to get vendor services', error: err.message });
  }
});

// Add or Update a vendor service
router.post('/:id/services/upsert', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const { serviceId, categoryName, serviceName, serviceDescription, price, durationMinutes, maxAttendees, isActive, requiresDeposit, depositPercentage, cancellationPolicy } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('ServiceID', sql.Int, serviceId || null);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('CategoryName', sql.NVarChar(100), categoryName);
    request.input('ServiceName', sql.NVarChar(100), serviceName);
    request.input('ServiceDescription', sql.NVarChar(sql.MAX), serviceDescription || null);
    request.input('Price', sql.Decimal(10, 2), price);
    request.input('DurationMinutes', sql.Int, durationMinutes || null);
    request.input('MaxAttendees', sql.Int, maxAttendees || null);
    request.input('IsActive', sql.Bit, isActive);
    request.input('RequiresDeposit', sql.Bit, requiresDeposit);
    request.input('DepositPercentage', sql.Decimal(5,2), depositPercentage);
    request.input('CancellationPolicy', sql.NVarChar(sql.MAX), cancellationPolicy || null);

    const result = await request.execute('sp_UpsertVendorService');
    res.json({ success: true, serviceId: result.recordset[0].ServiceID });
  } catch (err) {
    console.error('Upsert vendor service error:', err);
    res.status(500).json({ message: 'Failed to upsert vendor service', error: err.message });
  }
});

// Delete a vendor service
router.delete('/:id/services/:serviceId', async (req, res) => {
  try {
    const { id, serviceId } = req.params; // VendorProfileID, ServiceID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('ServiceID', sql.Int, parseInt(serviceId));
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_DeleteVendorService');
    if (result.recordset[0].Success) {
      res.json({ success: true, message: 'Service deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Service not found or could not be deleted' });
    }
  } catch (err) {
    console.error('Delete vendor service error:', err);
    res.status(500).json({ message: 'Failed to delete vendor service', error: err.message });
  }
});

// Get all reviews for a specific vendor
router.get('/:id/reviews/all', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetVendorReviewsAll');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get all vendor reviews error:', err);
    res.status(500).json({ message: 'Failed to get vendor reviews', error: err.message });
  }
});

// Get vendor profile details for editing
router.get('/:id/profile-details', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetVendorProfileDetails');
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ message: 'Vendor profile not found' });
    }
  } catch (err) {
    console.error('Get vendor profile details error:', err);
    res.status(500).json({ message: 'Failed to get vendor profile details', error: err.message });
  }
});

// Get vendor images
router.get('/:id/images', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, idNum);
    const result = await request.execute('sp_GetVendorImages');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get vendor images error:', err);
    res.status(500).json({ message: 'Failed to get vendor images', error: err.message });
  }
});

// Add or Update a vendor image
router.post('/:id/images/upsert', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid vendor profile ID' });
    }
    const { imageId, imageUrl, isPrimary, caption, displayOrder } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('ImageID', sql.Int, imageId || null);
    request.input('VendorProfileID', sql.Int, idNum);
    request.input('ImageURL', sql.NVarChar(255), imageUrl);
    request.input('IsPrimary', sql.Bit, isPrimary);
    request.input('Caption', sql.NVarChar(255), caption || null);
    request.input('DisplayOrder', sql.Int, displayOrder || 0);

    const result = await request.execute('sp_UpsertVendorImage');
    res.json({ success: true, imageId: result.recordset[0].ImageID });
  } catch (err) {
    console.error('Upsert vendor image error:', err);
    res.status(500).json({ message: 'Failed to upsert vendor image', error: err.message });
  }
});

// Delete a vendor image
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const { id, imageId } = req.params; // VendorProfileID, ImageID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('ImageID', sql.Int, parseInt(imageId));
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_DeleteVendorImage');
    if (result.recordset[0].Success) {
      res.json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Image not found or could not be deleted' });
    }
  } catch (err) {
    console.error('Delete vendor image error:', err);
    res.status(500).json({ message: 'Failed to delete vendor image', error: err.message });
  }
});

// Get vendor availability (business hours and exceptions)
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetVendorAvailability');
    
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
    
    const businessHours = result.recordsets[0].map(bh => ({
      ...bh,
      OpenTime: formatTime(bh.OpenTime),
      CloseTime: formatTime(bh.CloseTime)
    }));
    
    res.json({
      businessHours,
      availabilityExceptions: result.recordsets[1]
    });
  } catch (err) {
    console.error('Get vendor availability error:', err);
    res.status(500).json({ message: 'Failed to get vendor availability', error: err.message });
  }
});

// Add or Update a vendor business hour
router.post('/:id/business-hours/upsert', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const { hoursId, dayOfWeek, openTime, closeTime, isAvailable, timezone } = req.body;

    // Normalize/validate time strings to HH:mm:ss
    const normalizeTime = (t) => {
      if (!t) return null;
      if (typeof t !== 'string') t = String(t);
      const m = t.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (!m) return null;
      let h = parseInt(m[1], 10);
      let min = parseInt(m[2], 10);
      let s = m[3] ? parseInt(m[3], 10) : 0;
      if (h < 0 || h > 23 || min < 0 || min > 59 || s < 0 || s > 59) return null;
      return `${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    };

    const normOpen = isAvailable ? normalizeTime(openTime) : null;
    const normClose = isAvailable ? normalizeTime(closeTime) : null;

    if (isAvailable && (!normOpen || !normClose)) {
      return res.status(400).json({ success: false, message: 'Invalid time. Expect HH:mm or HH:mm:ss.' });
    }
    if (isAvailable && normOpen && normClose && normOpen >= normClose) {
      return res.status(400).json({ success: false, message: 'Close time must be after open time.' });
    }

    const pool = await poolPromise;
    // If HoursID not provided, try to find existing entry for this vendor/day to avoid duplicate insert
    let resolvedHoursId = hoursId || null;
    if (!resolvedHoursId) {
      const existsReq = new sql.Request(pool);
      existsReq.input('VendorProfileID', sql.Int, parseInt(id));
      existsReq.input('DayOfWeek', sql.TinyInt, dayOfWeek);
      const existsRes = await existsReq.query(`
        SELECT HoursID FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID AND DayOfWeek = @DayOfWeek
      `);
      resolvedHoursId = existsRes.recordset[0]?.HoursID || null;
    }

    const tz = timezone || 'America/New_York';
    
    // Use direct SQL update/insert instead of stored procedure to include timezone
    const request = new sql.Request(pool);
    request.input('HoursID', sql.Int, resolvedHoursId);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('DayOfWeek', sql.TinyInt, dayOfWeek);
    request.input('OpenTime', sql.VarChar(8), normOpen);
    request.input('CloseTime', sql.VarChar(8), normClose);
    request.input('IsAvailable', sql.Bit, isAvailable);
    request.input('Timezone', sql.NVarChar(100), tz);

    let resultHoursId;
    if (resolvedHoursId) {
      // Update existing
      await request.query(`
        UPDATE VendorBusinessHours
        SET OpenTime = @OpenTime, CloseTime = @CloseTime, IsAvailable = @IsAvailable, 
            Timezone = @Timezone, UpdatedAt = GETUTCDATE()
        WHERE HoursID = @HoursID AND VendorProfileID = @VendorProfileID
      `);
      resultHoursId = resolvedHoursId;
    } else {
      // Insert new
      const insertResult = await request.query(`
        INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable, Timezone, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.HoursID
        VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, @IsAvailable, @Timezone, GETUTCDATE(), GETUTCDATE())
      `);
      resultHoursId = insertResult.recordset[0].HoursID;
    }

    res.json({ success: true, hoursId: resultHoursId });
  } catch (err) {
    console.error('Upsert vendor business hour error:', err);
    res.status(500).json({ message: 'Failed to upsert vendor business hour', error: err.message });
  }
});

// Delete a vendor business hour
router.delete('/:id/business-hours/:hoursId', async (req, res) => {
  try {
    const { id, hoursId } = req.params; // VendorProfileID, HoursID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('HoursID', sql.Int, parseInt(hoursId));
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_DeleteVendorBusinessHour');
    if (result.recordset[0].Success) {
      res.json({ success: true, message: 'Business hour deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Business hour not found or could not be deleted' });
    }
  } catch (err) {
    console.error('Delete vendor business hour error:', err);
    res.status(500).json({ message: 'Failed to delete vendor business hour', error: err.message });
  }
});

// Add or Update a vendor availability exception
router.post('/:id/availability-exceptions/upsert', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const { exceptionId, date, startTime, endTime, isAvailable, reason } = req.body;

    const normalizeTime = (t) => {
      if (!t) return null;
      if (typeof t !== 'string') t = String(t);
      const m = t.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (!m) return null;
      let h = parseInt(m[1], 10);
      let min = parseInt(m[2], 10);
      let s = m[3] ? parseInt(m[3], 10) : 0;
      if (h < 0 || h > 23 || min < 0 || min > 59 || s < 0 || s > 59) return null;
      return `${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    };

    const normStart = normalizeTime(startTime);
    const normEnd = normalizeTime(endTime);

    if ((startTime && !normStart) || (endTime && !normEnd)) {
      return res.status(400).json({ success: false, message: 'Invalid time for availability exception. Expect HH:mm or HH:mm:ss.' });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('ExceptionID', sql.Int, exceptionId || null);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('Date', sql.Date, date);
    // Pass as VarChar for implicit TIME conversion server-side
    request.input('StartTime', sql.VarChar(8), normStart);
    request.input('EndTime', sql.VarChar(8), normEnd);
    request.input('IsAvailable', sql.Bit, isAvailable);
    request.input('Reason', sql.NVarChar(255), reason || null);

    const result = await request.execute('sp_UpsertVendorAvailabilityException');
    res.json({ success: true, exceptionId: result.recordset[0].ExceptionID });
  } catch (err) {
    console.error('Upsert vendor availability exception error:', err);
    res.status(500).json({ message: 'Failed to upsert vendor availability exception', error: err.message });
  }
});

// Delete a vendor availability exception
router.delete('/:id/availability-exceptions/:exceptionId', async (req, res) => {
  try {
    const { id, exceptionId } = req.params; // VendorProfileID, ExceptionID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('ExceptionID', sql.Int, parseInt(exceptionId));
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_DeleteVendorAvailabilityException');
    if (result.recordset[0].Success) {
      res.json({ success: true, message: 'Availability exception deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Availability exception not found or could not be deleted' });
    }
  } catch (err) {
    console.error('Delete vendor availability exception error:', err);
    res.status(500).json({ message: 'Failed to delete vendor availability exception', error: err.message });
  }
});

// ===== Additional REST endpoints to edit all vendor setup data =====

// Social: GET current social links and booking link
router.get('/:id/social', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));

    const socialResult = await request.query(`
      SELECT Platform, URL, DisplayOrder FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder
    `);

    const bookingLinkResult = await request.query(`
      SELECT BookingLink FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID
    `);

    res.json({
      success: true,
      bookingLink: bookingLinkResult.recordset[0]?.BookingLink || null,
      socialMediaProfiles: socialResult.recordset || []
    });

  } catch (err) {
    console.error('Get social error:', err);
    res.status(500).json({ success: false, message: 'Failed to get social media', error: err.message });
  }
});

// Social: Upsert social links and booking link
router.post('/:id/social', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const { bookingLink, socialMediaProfiles } = req.body;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));

    // Update booking link if provided
    if (bookingLink !== undefined) {
      const blReq = new sql.Request(pool);
      blReq.input('VendorProfileID', sql.Int, parseInt(id));
      blReq.input('BookingLink', sql.NVarChar, bookingLink || null);
      await blReq.query(`
        UPDATE VendorProfiles SET BookingLink = @BookingLink, UpdatedAt = GETDATE() WHERE VendorProfileID = @VendorProfileID
      `);
    }

    if (Array.isArray(socialMediaProfiles)) {
      // Clear existing
      await request.query(`DELETE FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID`);
      // Insert new
      for (let i = 0; i < socialMediaProfiles.length; i++) {
        const profile = socialMediaProfiles[i];
        if (!profile?.platform || !profile?.url) continue;
        const sReq = new sql.Request(pool);
        sReq.input('VendorProfileID', sql.Int, parseInt(id));
        sReq.input('Platform', sql.NVarChar(50), profile.platform);
        sReq.input('URL', sql.NVarChar(500), profile.url);
        sReq.input('DisplayOrder', sql.Int, i);
        await sReq.query(`
          INSERT INTO VendorSocialMedia (VendorProfileID, Platform, URL, DisplayOrder)
          VALUES (@VendorProfileID, @Platform, @URL, @DisplayOrder)
        `);
      }
    }

    res.json({ success: true, message: 'Social settings saved' });
  } catch (err) {
    console.error('Upsert social error:', err);
    res.status(500).json({ success: false, message: 'Failed to save social media', error: err.message });
  }
});

// Policies: GET
router.get('/:id/policies', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.query(`
      SELECT DepositRequirements, CancellationPolicy, ReschedulingPolicy, PaymentMethods, PaymentTerms
      FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID
    `);
    if (result.recordset.length === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, policies: result.recordset[0] });
  } catch (err) {
    console.error('Get policies error:', err);
    res.status(500).json({ success: false, message: 'Failed to get policies', error: err.message });
  }
});

// Policies: SAVE
router.post('/:id/policies', async (req, res) => {
  try {
    const { id } = req.params;
    const { depositRequirements, cancellationPolicy, reschedulingPolicy, paymentMethods, paymentTerms } = req.body;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('DepositRequirements', sql.NVarChar, depositRequirements ? JSON.stringify(depositRequirements) : null);
    request.input('CancellationPolicy', sql.NVarChar, cancellationPolicy || null);
    request.input('ReschedulingPolicy', sql.NVarChar, reschedulingPolicy || null);
    request.input('PaymentMethods', sql.NVarChar, paymentMethods ? JSON.stringify(paymentMethods) : null);
    request.input('PaymentTerms', sql.NVarChar, paymentTerms || null);
    await request.query(`
      UPDATE VendorProfiles SET 
        DepositRequirements = @DepositRequirements,
        CancellationPolicy = @CancellationPolicy,
        ReschedulingPolicy = @ReschedulingPolicy,
        PaymentMethods = @PaymentMethods,
        PaymentTerms = @PaymentTerms,
        UpdatedAt = GETDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    res.json({ success: true, message: 'Policies saved' });
  } catch (err) {
    console.error('Save policies error:', err);
    res.status(500).json({ success: false, message: 'Failed to save policies', error: err.message });
  }
});

// Verification & Legal: GET
router.get('/:id/verification', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.query(`
      SELECT LicenseNumber, InsuranceVerified, Awards, Certifications, IsEcoFriendly, IsPremium, IsAwardWinning, IsLastMinute
      FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID
    `);
    if (result.recordset.length === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, verification: result.recordset[0] });
  } catch (err) {
    console.error('Get verification error:', err);
    res.status(500).json({ success: false, message: 'Failed to get verification info', error: err.message });
  }
});

// Verification & Legal: SAVE
router.post('/:id/verification', async (req, res) => {
  try {
    const { id } = req.params;
    const { licenseNumber, insuranceVerified, awards, certifications, isEcoFriendly, isPremium, isAwardWinning, isLastMinute } = req.body;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('LicenseNumber', sql.NVarChar, licenseNumber || null);
    request.input('InsuranceVerified', sql.Bit, !!insuranceVerified);
    request.input('Awards', sql.NVarChar, awards ? JSON.stringify(awards) : null);
    request.input('Certifications', sql.NVarChar, certifications ? JSON.stringify(certifications) : null);
    request.input('IsEcoFriendly', sql.Bit, !!isEcoFriendly);
    request.input('IsPremium', sql.Bit, !!isPremium);
    request.input('IsAwardWinning', sql.Bit, !!isAwardWinning);
    request.input('IsLastMinute', sql.Bit, !!isLastMinute);
    await request.query(`
      UPDATE VendorProfiles SET 
        LicenseNumber = @LicenseNumber,
        InsuranceVerified = @InsuranceVerified,
        Awards = @Awards,
        Certifications = @Certifications,
        IsEcoFriendly = @IsEcoFriendly,
        IsPremium = @IsPremium,
        IsAwardWinning = @IsAwardWinning,
        IsLastMinute = @IsLastMinute,
        UpdatedAt = GETDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    res.json({ success: true, message: 'Verification info saved' });
  } catch (err) {
    console.error('Save verification error:', err);
    res.status(500).json({ success: false, message: 'Failed to save verification info', error: err.message });
  }
});

// FAQs: GET
router.get('/:id/faqs', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.query(`
      SELECT FAQID, Question, Answer, DisplayOrder, IsActive FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder
    `);
    res.json({ success: true, faqs: result.recordset });
  } catch (err) {
    console.error('Get FAQs error:', err);
    res.status(500).json({ success: false, message: 'Failed to get FAQs', error: err.message });
  }
});

// FAQs: UPSERT (replace all)
router.post('/:id/faqs/upsert', async (req, res) => {
  try {
    const { id } = req.params;
    const { faqs } = req.body;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    // Clear existing
    await request.query(`DELETE FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID`);
    // Insert new
    if (Array.isArray(faqs)) {
      for (let i = 0; i < faqs.length; i++) {
        const f = faqs[i];
        if (!f?.question || !f?.answer) continue;
        const fReq = new sql.Request(pool);
        fReq.input('VendorProfileID', sql.Int, parseInt(id));
        fReq.input('Question', sql.NVarChar(500), f.question);
        fReq.input('Answer', sql.NVarChar(sql.MAX), f.answer);
        fReq.input('DisplayOrder', sql.Int, i + 1);
        await fReq.query(`
          INSERT INTO VendorFAQs (VendorProfileID, Question, Answer, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
          VALUES (@VendorProfileID, @Question, @Answer, @DisplayOrder, 1, GETDATE(), GETDATE())
        `);
      }
    }
    res.json({ success: true, message: 'FAQs saved' });
  } catch (err) {
    console.error('Upsert FAQs error:', err);
    res.status(500).json({ success: false, message: 'Failed to save FAQs', error: err.message });
  }
});

// Category Answers: GET
router.get('/:id/category-answers', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.query(`
      SELECT AnswerID, QuestionID, Answer, CreatedAt, UpdatedAt
      FROM VendorCategoryAnswers
      WHERE VendorProfileID = @VendorProfileID
      ORDER BY AnswerID
    `);
    res.json({ success: true, answers: result.recordset });
  } catch (err) {
    console.error('Get category answers error:', err);
    res.status(500).json({ success: false, message: 'Failed to get category answers', error: err.message });
  }
});

// Category Answers: UPSERT (replace all)
router.post('/:id/category-answers/upsert', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const { answers } = req.body; // [{ questionId, answer }]

    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: answers must be an array' });
    }

    const pool = await poolPromise;

    // Clear existing answers
    const delReq = new sql.Request(pool);
    delReq.input('VendorProfileID', sql.Int, parseInt(id));
    await delReq.query(`DELETE FROM VendorCategoryAnswers WHERE VendorProfileID = @VendorProfileID`);

    // Insert new answers
    for (const a of answers) {
      if (!a || !a.questionId || typeof a.answer !== 'string') continue;
      const insReq = new sql.Request(pool);
      insReq.input('VendorProfileID', sql.Int, parseInt(id));
      insReq.input('QuestionID', sql.Int, parseInt(a.questionId));
      insReq.input('Answer', sql.NVarChar(sql.MAX), a.answer);
      await insReq.query(`
        INSERT INTO VendorCategoryAnswers (VendorProfileID, QuestionID, Answer, CreatedAt, UpdatedAt)
        VALUES (@VendorProfileID, @QuestionID, @Answer, GETDATE(), GETDATE())
      `);
    }

    res.json({ success: true, message: 'Category answers saved' });
  } catch (err) {
    console.error('Upsert category answers error:', err);
    res.status(500).json({ success: false, message: 'Failed to save category answers', error: err.message });
  }
});

// Team: GET
router.get('/:id/team', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.query(`
      SELECT TeamID, Name, Role, Bio, ImageURL, DisplayOrder FROM VendorTeam WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder
    `);
    res.json({ success: true, team: result.recordset });
  } catch (err) {
    console.error('Get team error:', err);
    res.status(500).json({ success: false, message: 'Failed to get team', error: err.message });
  }
});

// Team: UPSERT (replace all)
router.post('/:id/team/upsert', async (req, res) => {
  try {
    const { id } = req.params;
    const { teamMembers } = req.body;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    await request.query(`DELETE FROM VendorTeam WHERE VendorProfileID = @VendorProfileID`);
    if (Array.isArray(teamMembers)) {
      for (let i = 0; i < teamMembers.length; i++) {
        const t = teamMembers[i];
        if (!t?.name) continue;
        const tReq = new sql.Request(pool);
        tReq.input('VendorProfileID', sql.Int, parseInt(id));
        tReq.input('Name', sql.NVarChar, t.name);
        tReq.input('Role', sql.NVarChar, t.role || null);
        tReq.input('Bio', sql.NVarChar, t.bio || null);
        tReq.input('ImageURL', sql.NVarChar, t.imageUrl || null);
        tReq.input('DisplayOrder', sql.Int, i);
        await tReq.query(`
          INSERT INTO VendorTeam (VendorProfileID, Name, Role, Bio, ImageURL, DisplayOrder)
          VALUES (@VendorProfileID, @Name, @Role, @Bio, @ImageURL, @DisplayOrder)
        `);
      }
    }
    res.json({ success: true, message: 'Team saved' });
  } catch (err) {
    console.error('Upsert team error:', err);
    res.status(500).json({ success: false, message: 'Failed to save team', error: err.message });
  }
});

// Location: GET (profile address + service areas)
router.get('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const pReq = new sql.Request(pool);
    pReq.input('VendorProfileID', sql.Int, parseInt(id));
    const profileResult = await pReq.query(`
      SELECT Address, City, State, Country, PostalCode, Latitude, Longitude
      FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID
    `);
    if (profileResult.recordset.length === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });
    const aReq = new sql.Request(pool);
    aReq.input('VendorProfileID', sql.Int, parseInt(id));
    const areas = await aReq.query(`
      SELECT VendorServiceAreaID, GooglePlaceID, CityName, [State/Province] AS StateProvince, Country,
             Latitude, Longitude, ServiceRadius, FormattedAddress, PlaceType, PostalCode,
             TravelCost, MinimumBookingAmount, BoundsNortheastLat, BoundsNortheastLng,
             BoundsSouthwestLat, BoundsSouthwestLng, IsActive
      FROM VendorServiceAreas WHERE VendorProfileID = @VendorProfileID ORDER BY VendorServiceAreaID
    `);
    res.json({ success: true, location: profileResult.recordset[0], serviceAreas: areas.recordset });
  } catch (err) {
    console.error('Get location error:', err);
    res.status(500).json({ success: false, message: 'Failed to get location', error: err.message });
  }
});

// Location: SAVE (address + replace service areas)
router.post('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { address, city, state, country, postalCode, latitude, longitude, serviceAreas } = req.body;
    const pool = await poolPromise;
    const uReq = new sql.Request(pool);
    uReq.input('VendorProfileID', sql.Int, parseInt(id));
    uReq.input('Address', sql.NVarChar(255), address || null);
    uReq.input('City', sql.NVarChar(100), city || null);
    uReq.input('State', sql.NVarChar(100), state || null);
    uReq.input('Country', sql.NVarChar(100), country || null);
    uReq.input('PostalCode', sql.NVarChar(20), postalCode || null);
    uReq.input('Latitude', sql.Decimal(10, 8), latitude != null ? Number(latitude) : null);
    uReq.input('Longitude', sql.Decimal(11, 8), longitude != null ? Number(longitude) : null);
    await uReq.query(`
      UPDATE VendorProfiles SET Address=@Address, City=@City, State=@State, Country=@Country, PostalCode=@PostalCode,
        Latitude=@Latitude, Longitude=@Longitude, UpdatedAt = GETDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);

    // Replace service areas if provided
    if (Array.isArray(serviceAreas)) {
      const dReq = new sql.Request(pool);
      dReq.input('VendorProfileID', sql.Int, parseInt(id));
      await dReq.query(`DELETE FROM VendorServiceAreas WHERE VendorProfileID = @VendorProfileID`);
      for (const area of serviceAreas) {
        const aReq = new sql.Request(pool);
        aReq.input('VendorProfileID', sql.Int, parseInt(id));
        aReq.input('GooglePlaceID', sql.NVarChar(100), area.placeId || area.googlePlaceId || '');
        aReq.input('CityName', sql.NVarChar(100), area.city || area.name || area.locality || null);
        aReq.input('StateProvince', sql.NVarChar(100), area.province || area.state || null);
        aReq.input('Country', sql.NVarChar(100), area.country || country || null);
        aReq.input('Latitude', sql.Decimal(9, 6), area.latitude != null ? Number(area.latitude) : null);
        aReq.input('Longitude', sql.Decimal(9, 6), area.longitude != null ? Number(area.longitude) : null);
        aReq.input('ServiceRadius', sql.Decimal(10, 2), area.serviceRadius != null ? Number(area.serviceRadius) : 25.0);
        aReq.input('FormattedAddress', sql.NVarChar(255), area.formattedAddress || null);
        aReq.input('PlaceType', sql.NVarChar(50), area.placeType || null);
        aReq.input('PostalCode', sql.NVarChar(20), area.postalCode || null);
        aReq.input('TravelCost', sql.Decimal(10, 2), area.travelCost != null ? Number(area.travelCost) : null);
        aReq.input('MinimumBookingAmount', sql.Decimal(10, 2), area.minimumBookingAmount != null ? Number(area.minimumBookingAmount) : null);
        aReq.input('BoundsNortheastLat', sql.Decimal(9, 6), area.bounds?.northeast?.lat != null ? Number(area.bounds.northeast.lat) : null);
        aReq.input('BoundsNortheastLng', sql.Decimal(9, 6), area.bounds?.northeast?.lng != null ? Number(area.bounds.northeast.lng) : null);
        aReq.input('BoundsSouthwestLat', sql.Decimal(9, 6), area.bounds?.southwest?.lat != null ? Number(area.bounds.southwest.lat) : null);
        aReq.input('BoundsSouthwestLng', sql.Decimal(9, 6), area.bounds?.southwest?.lng != null ? Number(area.bounds.southwest.lng) : null);
        await aReq.query(`
          INSERT INTO VendorServiceAreas (
            VendorProfileID, GooglePlaceID, CityName, [State/Province], Country,
            Latitude, Longitude, ServiceRadius, FormattedAddress, PlaceType, PostalCode,
            TravelCost, MinimumBookingAmount, BoundsNortheastLat, BoundsNortheastLng,
            BoundsSouthwestLat, BoundsSouthwestLng, IsActive, CreatedDate, LastModifiedDate
          ) VALUES (
            @VendorProfileID, @GooglePlaceID, @CityName, @StateProvince, @Country,
            @Latitude, @Longitude, @ServiceRadius, @FormattedAddress, @PlaceType, @PostalCode,
            @TravelCost, @MinimumBookingAmount, @BoundsNortheastLat, @BoundsNortheastLng,
            @BoundsSouthwestLat, @BoundsSouthwestLng, 1, GETDATE(), GETDATE()
          )
        `);
      }
    }

    res.json({ success: true, message: 'Location saved' });
  } catch (err) {
    console.error('Save location error:', err);
    res.status(500).json({ success: false, message: 'Failed to save location', error: err.message });
  }
});

// Packages: GET
router.get('/:id/packages', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.query(`
      SELECT PackageID, Name, Description, Price, DurationMinutes, MaxGuests, WhatsIncluded
      FROM Packages WHERE VendorProfileID = @VendorProfileID ORDER BY PackageID
    `);
    res.json({ success: true, packages: result.recordset });
  } catch (err) {
    console.error('Get packages error:', err);
    res.status(500).json({ success: false, message: 'Failed to get packages', error: err.message });
  }
});

// Packages: UPSERT
router.post('/:id/packages/upsert', async (req, res) => {
  try {
    const { id } = req.params;
    const { packageId, name, description, price, durationMinutes, maxGuests, whatsIncluded } = req.body;
    const pool = await poolPromise;
    if (packageId) {
      const uReq = new sql.Request(pool);
      uReq.input('VendorProfileID', sql.Int, parseInt(id));
      uReq.input('PackageID', sql.Int, parseInt(packageId));
      uReq.input('Name', sql.NVarChar, name);
      uReq.input('Description', sql.NVarChar, description || null);
      uReq.input('Price', sql.Decimal(10, 2), price != null ? Number(price) : null);
      uReq.input('DurationMinutes', sql.Int, durationMinutes != null ? parseInt(durationMinutes) : null);
      uReq.input('MaxGuests', sql.Int, maxGuests != null ? parseInt(maxGuests) : null);
      uReq.input('WhatsIncluded', sql.NVarChar, whatsIncluded || null);
      await uReq.query(`
        UPDATE Packages SET Name=@Name, Description=@Description, Price=@Price, DurationMinutes=@DurationMinutes,
          MaxGuests=@MaxGuests, WhatsIncluded=@WhatsIncluded
        WHERE PackageID=@PackageID AND VendorProfileID=@VendorProfileID
      `);
      res.json({ success: true, packageId: parseInt(packageId), message: 'Package updated' });
    } else {
      const iReq = new sql.Request(pool);
      iReq.input('VendorProfileID', sql.Int, parseInt(id));
      iReq.input('Name', sql.NVarChar, name);
      iReq.input('Description', sql.NVarChar, description || null);
      iReq.input('Price', sql.Decimal(10, 2), price != null ? Number(price) : null);
      iReq.input('DurationMinutes', sql.Int, durationMinutes != null ? parseInt(durationMinutes) : null);
      iReq.input('MaxGuests', sql.Int, maxGuests != null ? parseInt(maxGuests) : null);
      iReq.input('WhatsIncluded', sql.NVarChar, whatsIncluded || null);
      const result = await iReq.query(`
        INSERT INTO Packages (VendorProfileID, Name, Description, Price, DurationMinutes, MaxGuests, WhatsIncluded)
        OUTPUT INSERTED.PackageID
        VALUES (@VendorProfileID, @Name, @Description, @Price, @DurationMinutes, @MaxGuests, @WhatsIncluded)
      `);
      res.json({ success: true, packageId: result.recordset[0].PackageID, message: 'Package created' });
    }
  } catch (err) {
    console.error('Upsert package error:', err);
    res.status(500).json({ success: false, message: 'Failed to upsert package', error: err.message });
  }
});

// Packages: DELETE
router.delete('/:id/packages/:packageId', async (req, res) => {
  try {
    const { id, packageId } = req.params;
    const pool = await poolPromise;
    const dReq = new sql.Request(pool);
    dReq.input('VendorProfileID', sql.Int, parseInt(id));
    dReq.input('PackageID', sql.Int, parseInt(packageId));
    await dReq.query(`DELETE FROM Packages WHERE PackageID = @PackageID AND VendorProfileID = @VendorProfileID`);
    res.json({ success: true, message: 'Package deleted' });
  } catch (err) {
    console.error('Delete package error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete package', error: err.message });
  }
});

// Category Answers: GET
router.get('/:id/category-answers', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.query(`
      SELECT ca.AnswerID, ca.QuestionID, cq.QuestionText, cq.Category, ca.Answer
      FROM VendorCategoryAnswers ca
      JOIN CategoryQuestions cq ON ca.QuestionID = cq.QuestionID
      WHERE ca.VendorProfileID = @VendorProfileID
      ORDER BY ca.AnswerID
    `);
    res.json({ success: true, answers: result.recordset });
  } catch (err) {
    console.error('Get category answers error:', err);
    res.status(500).json({ success: false, message: 'Failed to get category answers', error: err.message });
  }
});

// Category Answers: UPSERT (replace all)
router.post('/:id/category-answers/upsert', async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // [{questionId, answer}]
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    await request.query(`DELETE FROM VendorCategoryAnswers WHERE VendorProfileID = @VendorProfileID`);
    if (Array.isArray(answers)) {
      for (const a of answers) {
        if (!a?.questionId) continue;
        const aReq = new sql.Request(pool);
        aReq.input('VendorProfileID', sql.Int, parseInt(id));
        aReq.input('QuestionID', sql.Int, parseInt(a.questionId));
        aReq.input('Answer', sql.NVarChar(sql.MAX), a.answer || null);
        await aReq.query(`
          INSERT INTO VendorCategoryAnswers (VendorProfileID, QuestionID, Answer, CreatedAt, UpdatedAt)
          VALUES (@VendorProfileID, @QuestionID, @Answer, GETDATE(), GETDATE())
        `);
      }
    }
    res.json({ success: true, message: 'Category answers saved' });
  } catch (err) {
    console.error('Upsert category answers error:', err);
    res.status(500).json({ success: false, message: 'Failed to save category answers', error: err.message });
  }
});

// Popular Filters: GET
router.get('/:id/popular-filters', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.query(`
      SELECT IsPremium, IsEcoFriendly, IsAwardWinning, IsLastMinute
      FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID
    `);
    if (result.recordset.length === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, filters: result.recordset[0] });
  } catch (err) {
    console.error('Get popular filters error:', err);
    res.status(500).json({ success: false, message: 'Failed to get popular filters', error: err.message });
  }
});

// Popular Filters: SAVE
router.post('/:id/popular-filters', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const { isPremium, isEcoFriendly, isAwardWinning, isLastMinute } = req.body;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('IsPremium', sql.Bit, !!isPremium);
    request.input('IsEcoFriendly', sql.Bit, !!isEcoFriendly);
    request.input('IsAwardWinning', sql.Bit, !!isAwardWinning);
    request.input('IsLastMinute', sql.Bit, !!isLastMinute);
    await request.query(`
      UPDATE VendorProfiles SET 
        IsPremium = @IsPremium,
        IsEcoFriendly = @IsEcoFriendly,
        IsAwardWinning = @IsAwardWinning,
        IsLastMinute = @IsLastMinute,
        UpdatedAt = GETDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    res.json({ success: true, message: 'Popular filters saved' });
  } catch (err) {
    console.error('Save popular filters error:', err);
    res.status(500).json({ success: false, message: 'Failed to save popular filters', error: err.message });
  }
});

// =============================================
// PORTFOLIO ALBUMS ROUTES
// =============================================

// Get all albums for a vendor
router.get('/:id/portfolio/albums', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetVendorPortfolioAlbums');
    res.json({ success: true, albums: result.recordset });
  } catch (err) {
    console.error('Get portfolio albums error:', err);
    res.status(500).json({ success: false, message: 'Failed to get albums', error: err.message });
  }
});

// Get images for a specific album
router.get('/:id/portfolio/albums/:albumId/images', async (req, res) => {
  try {
    const { id, albumId } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('AlbumID', sql.Int, parseInt(albumId));
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetAlbumImages');
    res.json({ success: true, images: result.recordset });
  } catch (err) {
    console.error('Get album images error:', err);
    res.status(500).json({ success: false, message: 'Failed to get album images', error: err.message });
  }
});

// Create or update album
router.post('/:id/portfolio/albums/upsert', async (req, res) => {
  try {
    const { id } = req.params;
    const { albumId, albumName, albumDescription, coverImageURL, cloudinaryPublicId, isPublic, displayOrder } = req.body;

    if (!albumName || albumName.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Album name is required' });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('AlbumID', sql.Int, albumId || null);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('AlbumName', sql.NVarChar(100), albumName.trim());
    request.input('AlbumDescription', sql.NVarChar(500), albumDescription || null);
    request.input('CoverImageURL', sql.NVarChar(500), coverImageURL || null);
    request.input('CloudinaryPublicId', sql.NVarChar(200), cloudinaryPublicId || null);
    request.input('IsPublic', sql.Bit, isPublic !== false);
    request.input('DisplayOrder', sql.Int, displayOrder || 0);

    const result = await request.execute('sp_UpsertPortfolioAlbum');
    res.json({ success: true, albumId: result.recordset[0].AlbumID });
  } catch (err) {
    console.error('Upsert album error:', err);
    res.status(500).json({ success: false, message: 'Failed to save album', error: err.message });
  }
});

// Add image to album
router.post('/:id/portfolio/albums/:albumId/images', async (req, res) => {
  try {
    const { id, albumId } = req.params;
    const { imageUrl, cloudinaryPublicId, cloudinaryUrl, cloudinarySecureUrl, caption, displayOrder } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image URL is required' });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('AlbumID', sql.Int, parseInt(albumId));
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('ImageURL', sql.NVarChar(500), imageUrl);
    request.input('CloudinaryPublicId', sql.NVarChar(200), cloudinaryPublicId || null);
    request.input('CloudinaryUrl', sql.NVarChar(500), cloudinaryUrl || null);
    request.input('CloudinarySecureUrl', sql.NVarChar(500), cloudinarySecureUrl || null);
    request.input('Caption', sql.NVarChar(255), caption || null);
    request.input('DisplayOrder', sql.Int, displayOrder || 0);

    const result = await request.execute('sp_AddPortfolioImage');
    res.json({ success: true, portfolioImageId: result.recordset[0].PortfolioImageID });
  } catch (err) {
    console.error('Add portfolio image error:', err);
    res.status(500).json({ success: false, message: 'Failed to add image to album', error: err.message });
  }
});

// Delete album image
router.delete('/:id/portfolio/images/:portfolioImageId', async (req, res) => {
  try {
    const { id, portfolioImageId } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('PortfolioImageID', sql.Int, parseInt(portfolioImageId));
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_DeletePortfolioImage');
    if (result.recordset[0].Success) {
      res.json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Image not found or access denied' });
    }
  } catch (err) {
    console.error('Delete portfolio image error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete image', error: err.message });
  }
});

// Delete album
router.delete('/:id/portfolio/albums/:albumId', async (req, res) => {
  try {
    const { id, albumId } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('AlbumID', sql.Int, parseInt(albumId));
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_DeletePortfolioAlbum');
    if (result.recordset[0].Success) {
      res.json({ success: true, message: 'Album deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Album not found or access denied' });
    }
  } catch (err) {
    console.error('Delete album error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete album', error: err.message });
  }
});

// =============================================
// PUBLIC PORTFOLIO VIEWING ROUTES (No Auth Required)
// =============================================

// Get public albums for a vendor
router.get('/:id/portfolio/albums/public', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    
    // Get only public albums
    const result = await request.query(`
      SELECT 
        pa.AlbumID,
        pa.AlbumName,
        pa.AlbumDescription,
        pa.CoverImageURL,
        pa.DisplayOrder,
        pa.CreatedAt,
        (SELECT COUNT(*) FROM VendorPortfolioImages WHERE AlbumID = pa.AlbumID) as ImageCount
      FROM VendorPortfolioAlbums pa
      WHERE pa.VendorProfileID = @VendorProfileID 
        AND pa.IsPublic = 1
      ORDER BY pa.DisplayOrder, pa.CreatedAt DESC
    `);
    
    res.json({ success: true, albums: result.recordset });
  } catch (err) {
    console.error('Get public portfolio albums error:', err);
    res.status(500).json({ success: false, message: 'Failed to get public albums', error: err.message });
  }
});

// Get images for a public album
router.get('/:id/portfolio/albums/:albumId/images/public', async (req, res) => {
  try {
    const { id, albumId } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('AlbumID', sql.Int, parseInt(albumId));
    
    // Verify album is public and belongs to vendor
    const albumCheck = await request.query(`
      SELECT IsPublic FROM VendorPortfolioAlbums 
      WHERE AlbumID = @AlbumID AND VendorProfileID = @VendorProfileID
    `);
    
    if (albumCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Album not found' });
    }
    
    if (!albumCheck.recordset[0].IsPublic) {
      return res.status(403).json({ success: false, message: 'This album is private' });
    }
    
    // Get images
    const result = await request.query(`
      SELECT 
        PortfolioImageID,
        ImageURL,
        Caption,
        DisplayOrder,
        CreatedAt
      FROM VendorPortfolioImages
      WHERE AlbumID = @AlbumID
      ORDER BY DisplayOrder, CreatedAt
    `);
    
    res.json({ success: true, images: result.recordset });
  } catch (err) {
    console.error('Get public album images error:', err);
    res.status(500).json({ success: false, message: 'Failed to get album images', error: err.message });
  }
});

module.exports = router;
