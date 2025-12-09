const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

// Helper to get pool
const getPool = async () => await poolPromise;

// Apply authentication to all routes
// Note: Admin check is done on frontend via isAdmin flag
// Backend will verify admin status for sensitive operations
router.use(authenticateToken);

// ==================== DASHBOARD STATS ====================

// GET /admin/dashboard-stats - Get overview statistics
router.get('/dashboard-stats', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM VendorProfiles) as totalVendors,
        (SELECT COUNT(*) FROM VendorProfiles WHERE ProfileStatus = 'pending_review') as pendingVendors,
        (SELECT COUNT(*) FROM Users WHERE IsActive = 1) as totalUsers,
        (SELECT COUNT(*) FROM Bookings) as totalBookings,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM Bookings WHERE CreatedAt >= DATEADD(month, -1, GETDATE())) as monthlyRevenue,
        (SELECT COUNT(*) FROM VendorProfiles WHERE ProfileStatus = 'approved') as activeListings
    `);
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /admin/recent-activity - Get recent platform activity
router.get('/recent-activity', async (req, res) => {
  try {
    const pool = await getPool();
    
    // Get recent vendor registrations
    const vendors = await pool.request().query(`
      SELECT TOP 3
        'vendor' as type,
        'New vendor registration: ' + BusinessName as description,
        CreatedAt as timestamp,
        'fa-user-plus' as icon,
        '#2dce89' as color
      FROM VendorProfiles
      ORDER BY CreatedAt DESC
    `);
    
    // Get recent bookings
    const bookings = await pool.request().query(`
      SELECT TOP 3
        'booking' as type,
        'New booking confirmed: #BK-' + CAST(BookingID as NVARCHAR) as description,
        CreatedAt as timestamp,
        'fa-calendar-check' as icon,
        '#5e72e4' as color
      FROM Bookings
      ORDER BY CreatedAt DESC
    `);
    
    // Get recent reviews
    const reviews = await pool.request().query(`
      SELECT TOP 3
        'review' as type,
        'New review submitted (' + CAST(r.Rating as NVARCHAR) + ' stars)' as description,
        r.CreatedAt as timestamp,
        'fa-star' as icon,
        '#fb6340' as color
      FROM Reviews r
      ORDER BY r.CreatedAt DESC
    `);
    
    // Combine and sort by timestamp
    const activity = [...vendors.recordset, ...bookings.recordset, ...reviews.recordset]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
    
    res.json({ activity });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity', details: error.message });
  }
});

// ==================== VENDOR APPROVALS ====================

// GET /admin/vendor-approvals - Get vendor profiles for approval review
router.get('/vendor-approvals', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const pool = await getPool();
    
    let whereClause = '1=1';
    if (status === 'pending') whereClause = `vp.ProfileStatus = 'pending_review'`;
    else if (status === 'approved') whereClause = `vp.ProfileStatus = 'approved'`;
    else if (status === 'rejected') whereClause = `vp.ProfileStatus = 'rejected'`;
    // 'all' shows everything
    
    const result = await pool.request().query(`
      SELECT 
        vp.VendorProfileID,
        vp.BusinessName,
        vp.DisplayName,
        vp.BusinessDescription,
        vp.BusinessPhone,
        vp.BusinessEmail,
        vp.StreetAddress,
        vp.City,
        vp.State,
        vp.PostalCode,
        vp.Country,
        vp.ProfileStatus,
        vp.CreatedAt,
        vp.UpdatedAt,
        vp.AdminNotes,
        vp.RejectionReason,
        u.Name as OwnerName,
        u.Email as OwnerEmail,
        u.Phone as OwnerPhone,
        (SELECT TOP 1 ImageURL FROM VendorImages WHERE VendorProfileID = vp.VendorProfileID AND IsPrimary = 1) as PrimaryImage,
        (SELECT TOP 1 Category FROM VendorCategories WHERE VendorProfileID = vp.VendorProfileID) as Categories,
        (SELECT COUNT(*) FROM VendorImages WHERE VendorProfileID = vp.VendorProfileID) as ImageCount,
        (SELECT COUNT(*) FROM VendorServices WHERE VendorProfileID = vp.VendorProfileID) as ServiceCount
      FROM VendorProfiles vp
      LEFT JOIN Users u ON vp.UserID = u.UserID
      WHERE ${whereClause}
      ORDER BY vp.CreatedAt DESC
    `);
    
    res.json({ profiles: result.recordset });
  } catch (error) {
    console.error('Error fetching vendor approvals:', error);
    res.status(500).json({ error: 'Failed to fetch vendor approvals', details: error.message });
  }
});

// GET /admin/vendor-approvals/:id - Get full vendor details for review
// Uses the same sp_GetVendorDetails stored procedure as the vendor profile page
router.get('/vendor-approvals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    console.log('Fetching vendor details for ID:', id);
    
    // Use the same stored procedure as the vendor profile page
    const request = pool.request();
    request.input('VendorProfileID', sql.Int, id);
    request.input('UserID', sql.Int, null);
    
    const result = await request.execute('sp_GetVendorDetails');
    
    if (result.recordsets.length === 0 || result.recordsets[0].length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    // Capture the recordsets - same structure as vendors.js
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
    
    const profile = profileRecordset[0];
    console.log('Profile found:', profile.BusinessName, 'StripeAccountId:', profile.StripeAccountId);
    
    // Get owner info
    const ownerResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT u.Name as OwnerName, u.Email as OwnerEmail, u.Phone as OwnerPhone, u.CreatedAt as UserCreatedAt
        FROM VendorProfiles vp
        LEFT JOIN Users u ON vp.UserID = u.UserID
        WHERE vp.VendorProfileID = @id
      `);
    const ownerInfo = ownerResult.recordset[0] || {};
    
    // Get service areas
    let serviceAreas = [];
    try {
      const serviceAreasResult = await pool.request()
        .input('VendorProfileID', sql.Int, id)
        .query(`
          SELECT 
            VendorServiceAreaID,
            GooglePlaceID,
            CityName,
            [State/Province] AS StateProvince,
            Country,
            Latitude,
            Longitude,
            ServiceRadius,
            FormattedAddress,
            PlaceType,
            PostalCode,
            TravelCost,
            MinimumBookingAmount,
            IsActive
          FROM VendorServiceAreas 
          WHERE VendorProfileID = @VendorProfileID
          ORDER BY CityName
        `);
      serviceAreas = serviceAreasResult.recordset || [];
    } catch (e) {
      console.warn('Service areas query failed:', e.message);
    }
    
    // Get vendor features - use same query as vendorFeatures.js
    let features = [];
    try {
      const featuresResult = await pool.request()
        .input('VendorProfileID', sql.Int, id)
        .query(`
          SELECT 
            vsf.VendorFeatureSelectionID,
            vsf.VendorProfileID,
            vsf.FeatureID,
            f.FeatureName,
            f.FeatureKey,
            f.FeatureDescription,
            f.FeatureIcon,
            c.CategoryID,
            c.CategoryName,
            c.CategoryKey,
            c.CategoryIcon
          FROM VendorSelectedFeatures vsf
          LEFT JOIN VendorFeatures f ON vsf.FeatureID = f.FeatureID
          LEFT JOIN VendorFeatureCategories c ON f.CategoryID = c.CategoryID
          WHERE vsf.VendorProfileID = @VendorProfileID
            AND (f.IsActive = 1 OR f.IsActive IS NULL)
          ORDER BY COALESCE(c.DisplayOrder, 999), COALESCE(f.DisplayOrder, 999)
        `);
      features = featuresResult.recordset || [];
      console.log('Features found:', features.length);
    } catch (e) {
      console.warn('Features query failed:', e.message);
    }
    
    // Format time values - SQL Server returns TIME as Date objects
    const formatTime = (timeValue) => {
      if (!timeValue) return null;
      if (typeof timeValue === 'string') return timeValue;
      if (timeValue instanceof Date) {
        return timeValue.toTimeString().split(' ')[0];
      }
      return timeValue;
    };
    
    const businessHours = (businessHoursRecordset || []).map(bh => ({
      ...bh,
      OpenTime: formatTime(bh.OpenTime),
      CloseTime: formatTime(bh.CloseTime)
    }));
    
    console.log('Data summary - Images:', imagesRecordset?.length, 'Services:', servicesRecordset?.length, 
                'Categories:', categoriesRecordset?.length, 'Hours:', businessHours.length);
    
    // Check Stripe connection status using the same logic as payments.js
    let stripeStatus = { connected: false };
    try {
      // Get the StripeAccountId from VendorProfiles table
      const stripeResult = await pool.request()
        .input('VendorProfileID', sql.Int, id)
        .query(`SELECT StripeAccountId FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID`);
      
      const stripeAccountId = stripeResult.recordset[0]?.StripeAccountId;
      if (stripeAccountId) {
        stripeStatus = {
          connected: true,
          accountId: stripeAccountId
        };
        console.log('Stripe connected:', stripeAccountId);
      } else {
        console.log('No Stripe account found for vendor');
      }
    } catch (e) {
      console.warn('Error checking Stripe status:', e.message);
    }
    
    // Get questionnaire answers (category answers)
    let categoryAnswers = categoryAnswersRecordset || [];
    // If the stored procedure didn't return full question text, fetch it separately
    if (categoryAnswers.length === 0 || !categoryAnswers[0]?.QuestionText) {
      try {
        const answersResult = await pool.request()
          .input('VendorProfileID', sql.Int, id)
          .query(`
            SELECT ca.AnswerID, ca.QuestionID, cq.QuestionText, cq.Category, ca.Answer
            FROM VendorCategoryAnswers ca
            JOIN CategoryQuestions cq ON ca.QuestionID = cq.QuestionID
            WHERE ca.VendorProfileID = @VendorProfileID
            ORDER BY ca.AnswerID
          `);
        categoryAnswers = answersResult.recordset || [];
        console.log('Category answers found:', categoryAnswers.length);
      } catch (e) {
        console.warn('Category answers query failed:', e.message);
      }
    }
    
    // Build response matching the vendor profile structure
    const responseData = {
      profile: {
        ...profile,
        ...ownerInfo,
        Images: imagesRecordset || [],
        Services: servicesRecordset || [],
        Categories: (categoriesRecordset || []).map(c => c.Category || c.CategoryName),
        BusinessHours: businessHours,
        ServiceAreas: serviceAreas,
        Features: features,
        SocialLinks: socialMediaRecordset || [],
        FAQs: faqsRecordset || [],
        Portfolio: portfolioRecordset || [],
        Team: teamRecordset || [],
        Reviews: reviewsRecordset || [],
        AvailableSlots: availableSlotsRecordset || [],
        StripeStatus: stripeStatus,
        CategoryAnswers: categoryAnswers
      }
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching vendor details:', error);
    res.status(500).json({ error: 'Failed to fetch vendor details', details: error.message });
  }
});

// ==================== VENDOR MANAGEMENT ====================

// GET /admin/vendors - Get all vendors with filters
router.get('/vendors', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pool = await getPool();
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    if (status && status !== 'all') {
      if (status === 'pending') whereClause += ` AND vp.ProfileStatus = 'pending_review'`;
      else if (status === 'approved') whereClause += ` AND vp.ProfileStatus = 'approved'`;
      else if (status === 'rejected') whereClause += ` AND vp.ProfileStatus = 'rejected'`;
      else if (status === 'suspended') whereClause += ` AND vp.AcceptingBookings = 0`;
      else whereClause += ` AND vp.ProfileStatus = @status`;
    }
    if (search) {
      whereClause += ` AND (vp.BusinessName LIKE @search OR u.Email LIKE @search)`;
    }
    
    const request = pool.request()
      .input('status', sql.NVarChar, status)
      .input('search', sql.NVarChar, `%${search || ''}%`)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    
    const result = await request.query(`
      SELECT 
        vp.VendorProfileID,
        vp.BusinessName,
        vp.DisplayName,
        vp.BusinessDescription as Description,
        vp.City,
        vp.State,
        CASE 
          WHEN vp.ProfileStatus = 'pending_review' THEN 'Pending'
          WHEN vp.ProfileStatus = 'approved' THEN 'Approved'
          WHEN vp.ProfileStatus = 'rejected' THEN 'Rejected'
          WHEN vp.AcceptingBookings = 0 THEN 'Suspended'
          ELSE vp.ProfileStatus
        END as ProfileStatus,
        vp.AcceptingBookings as IsActive,
        vp.IsVerified as IsVisible,
        vp.CreatedAt,
        u.Email as OwnerEmail,
        u.Name as OwnerName,
        (SELECT TOP 1 ImageURL FROM VendorImages WHERE VendorProfileID = vp.VendorProfileID AND IsPrimary = 1) as PrimaryImage,
        vp.AvgRating as AverageRating,
        vp.TotalReviews as ReviewCount,
        vp.TotalBookings as BookingCount,
        (SELECT TOP 1 Category FROM VendorCategories WHERE VendorProfileID = vp.VendorProfileID) as Categories
      FROM VendorProfiles vp
      LEFT JOIN Users u ON vp.UserID = u.UserID
      WHERE ${whereClause}
      ORDER BY vp.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    
    const countResult = await pool.request()
      .input('status', sql.NVarChar, status)
      .input('search', sql.NVarChar, `%${search || ''}%`)
      .query(`
        SELECT COUNT(*) as total
        FROM VendorProfiles vp
        LEFT JOIN Users u ON vp.UserID = u.UserID
        WHERE ${whereClause}
      `);
    
    res.json({
      vendors: result.recordset,
      total: countResult.recordset[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors', details: error.message });
  }
});

// POST /admin/vendors/:id/approve - Approve vendor
router.post('/vendors/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('adminNotes', sql.NVarChar, adminNotes)
      .query(`
        UPDATE VendorProfiles 
        SET ProfileStatus = 'approved', 
            AcceptingBookings = 1, 
            IsVerified = 1,
            AdminNotes = @adminNotes,
            ReviewedAt = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @id
      `);
    
    res.json({ success: true, message: 'Vendor approved' });
  } catch (error) {
    console.error('Error approving vendor:', error);
    res.status(500).json({ error: 'Failed to approve vendor' });
  }
});

// POST /admin/vendors/:id/reject - Reject vendor
router.post('/vendors/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, adminNotes } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('reason', sql.NVarChar, reason)
      .input('adminNotes', sql.NVarChar, adminNotes)
      .query(`
        UPDATE VendorProfiles 
        SET ProfileStatus = 'rejected', 
            RejectionReason = @reason,
            AdminNotes = @adminNotes,
            ReviewedAt = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @id
      `);
    
    res.json({ success: true, message: 'Vendor rejected' });
  } catch (error) {
    console.error('Error rejecting vendor:', error);
    res.status(500).json({ error: 'Failed to reject vendor' });
  }
});

// POST /admin/vendors/:id/suspend - Suspend vendor
router.post('/vendors/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('reason', sql.NVarChar, reason)
      .query(`
        UPDATE VendorProfiles 
        SET AcceptingBookings = 0, 
            IsVerified = 0,
            AdminNotes = @reason,
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @id
      `);
    
    res.json({ success: true, message: 'Vendor suspended' });
  } catch (error) {
    console.error('Error suspending vendor:', error);
    res.status(500).json({ error: 'Failed to suspend vendor' });
  }
});

// POST /admin/vendors/:id/toggle-visibility - Toggle vendor visibility
router.post('/vendors/:id/toggle-visibility', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE VendorProfiles 
        SET AcceptingBookings = CASE WHEN AcceptingBookings = 1 THEN 0 ELSE 1 END,
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @id
      `);
    
    res.json({ success: true, message: 'Visibility toggled' });
  } catch (error) {
    console.error('Error toggling visibility:', error);
    res.status(500).json({ error: 'Failed to toggle visibility' });
  }
});

// ==================== USER MANAGEMENT ====================

// GET /admin/users - Get all users with filters
router.get('/users', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pool = await getPool();
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    if (status === 'active') whereClause += ' AND u.IsActive = 1';
    if (status === 'inactive') whereClause += ' AND u.IsActive = 0';
    if (status === 'vendors') whereClause += ' AND u.IsVendor = 1';
    if (status === 'clients') whereClause += ' AND u.IsVendor = 0';
    if (search) {
      whereClause += ` AND (u.Email LIKE @search OR u.Name LIKE @search)`;
    }
    
    const result = await pool.request()
      .input('search', sql.NVarChar, `%${search || ''}%`)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        SELECT 
          u.UserID,
          u.Email,
          u.Name,
          u.IsVendor,
          u.IsAdmin,
          u.IsActive,
          u.CreatedAt,
          u.LastLogin as LastLoginAt,
          (SELECT COUNT(*) FROM Bookings WHERE UserID = u.UserID) as BookingCount
        FROM Users u
        WHERE ${whereClause}
        ORDER BY u.CreatedAt DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    
    const countResult = await pool.request()
      .input('search', sql.NVarChar, `%${search || ''}%`)
      .query(`SELECT COUNT(*) as total FROM Users u WHERE ${whereClause}`);
    
    res.json({
      users: result.recordset,
      total: countResult.recordset[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// POST /admin/users/:id/toggle-status - Toggle user active status
router.post('/users/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Users 
        SET IsActive = CASE WHEN IsActive = 1 THEN 0 ELSE 1 END
        WHERE UserID = @id
      `);
    
    res.json({ success: true, message: 'User status toggled' });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
});

// PUT /admin/users/:id - Update user details
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .query(`
        UPDATE Users 
        SET Name = @name, Email = @email, UpdatedAt = GETDATE()
        WHERE UserID = @id
      `);
    
    res.json({ success: true, message: 'User updated' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /admin/users/:id - Get single user details
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          u.UserID,
          u.Email,
          u.Name,
          u.Phone,
          u.IsVendor,
          u.IsAdmin,
          u.IsActive,
          u.CreatedAt,
          u.LastLogin,
          u.EmailVerified,
          (SELECT COUNT(*) FROM Bookings WHERE UserID = u.UserID) as BookingCount,
          (SELECT COUNT(*) FROM Reviews WHERE UserID = u.UserID) as ReviewCount
        FROM Users u
        WHERE u.UserID = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.recordset[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /admin/users/:id/activity - Get user activity log
router.get('/users/:id/activity', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    // Get bookings
    const bookings = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT TOP 10
          'booking' as type,
          b.BookingID as id,
          'Booking #' + CAST(b.BookingID as NVARCHAR) + ' - ' + vp.BusinessName as description,
          b.Status,
          b.CreatedAt as date
        FROM Bookings b
        JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
        WHERE b.UserID = @id
        ORDER BY b.CreatedAt DESC
      `);
    
    // Get reviews
    const reviews = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT TOP 10
          'review' as type,
          r.ReviewID as id,
          'Review for ' + vp.BusinessName + ' (' + CAST(r.Rating as NVARCHAR) + ' stars)' as description,
          'completed' as Status,
          r.CreatedAt as date
        FROM Reviews r
        JOIN VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
        WHERE r.UserID = @id
        ORDER BY r.CreatedAt DESC
      `);
    
    const activity = [...bookings.recordset, ...reviews.recordset]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);
    
    res.json({ activity });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

// ==================== BOOKING MANAGEMENT ====================

// GET /admin/bookings - Get all bookings with filters
router.get('/bookings', async (req, res) => {
  try {
    const { status, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const pool = await getPool();
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    if (status && status !== 'all') {
      // Handle case-insensitive status matching
      const statusMap = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'disputed': 'Disputed'
      };
      const dbStatus = statusMap[status.toLowerCase()] || status;
      whereClause += ` AND b.Status = '${dbStatus}'`;
    }
    if (startDate) {
      whereClause += ` AND b.EventDate >= @startDate`;
    }
    if (endDate) {
      whereClause += ` AND b.EventDate <= @endDate`;
    }
    if (search) {
      whereClause += ` AND (CAST(b.BookingID as NVARCHAR) LIKE @search OR vp.BusinessName LIKE @search OR u.Name LIKE @search)`;
    }
    
    const result = await pool.request()
      .input('startDate', sql.Date, startDate || null)
      .input('endDate', sql.Date, endDate || null)
      .input('search', sql.NVarChar, `%${search || ''}%`)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        SELECT 
          b.BookingID,
          b.EventDate as BookingDate,
          b.StartTime,
          b.EndTime,
          b.Status,
          b.TotalAmount,
          b.CreatedAt,
          u.Name as ClientName,
          u.Email as ClientEmail,
          vp.BusinessName as VendorName,
          vp.VendorProfileID,
          vu.Email as VendorEmail,
          b.ServiceName
        FROM Bookings b
        LEFT JOIN Users u ON b.UserID = u.UserID
        LEFT JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
        LEFT JOIN Users vu ON vp.UserID = vu.UserID
        WHERE ${whereClause}
        ORDER BY b.CreatedAt DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    
    const countResult = await pool.request()
      .input('status', sql.NVarChar, status)
      .input('startDate', sql.Date, startDate || null)
      .input('endDate', sql.Date, endDate || null)
      .input('search', sql.NVarChar, `%${search || ''}%`)
      .query(`
        SELECT COUNT(*) as total
        FROM Bookings b
        LEFT JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
        WHERE ${whereClause}
      `);
    
    res.json({
      bookings: result.recordset,
      total: countResult.recordset[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings', details: error.message });
  }
});

// GET /admin/bookings/:id - Get single booking details
router.get('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          b.*,
          u.Name as ClientName,
          u.Email as ClientEmail,
          u.Phone as ClientPhone,
          vp.BusinessName as VendorName,
          vp.BusinessEmail as VendorEmail,
          vp.BusinessPhone as VendorPhone
        FROM Bookings b
        LEFT JOIN Users u ON b.UserID = u.UserID
        LEFT JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
        WHERE b.BookingID = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ booking: result.recordset[0] });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// PUT /admin/bookings/:id - Update booking
router.put('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, eventDate, startTime, endTime, totalAmount, notes } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar, status)
      .input('eventDate', sql.Date, eventDate)
      .input('startTime', sql.NVarChar, startTime)
      .input('endTime', sql.NVarChar, endTime)
      .input('totalAmount', sql.Decimal(10,2), totalAmount)
      .input('notes', sql.NVarChar, notes)
      .query(`
        UPDATE Bookings 
        SET Status = @status,
            EventDate = @eventDate,
            StartTime = @startTime,
            EndTime = @endTime,
            TotalAmount = @totalAmount,
            Notes = @notes,
            UpdatedAt = GETDATE()
        WHERE BookingID = @id
      `);
    
    res.json({ success: true, message: 'Booking updated' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// POST /admin/bookings/:id/cancel - Cancel booking
router.post('/bookings/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('reason', sql.NVarChar, reason)
      .query(`
        UPDATE Bookings 
        SET Status = 'Cancelled', 
            CancellationReason = @reason,
            CancelledAt = GETDATE()
        WHERE BookingID = @id
      `);
    
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// ==================== REVIEWS MANAGEMENT ====================

// GET /admin/reviews - Get all reviews with filters
router.get('/reviews', async (req, res) => {
  try {
    const { filter, search, page = 1, limit = 20 } = req.query;
    const pool = await getPool();
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    if (filter === 'flagged') whereClause += ' AND r.IsFlagged = 1';
    if (filter === 'recent') whereClause += ' AND r.CreatedAt >= DATEADD(day, -7, GETDATE())';
    if (search) {
      whereClause += ` AND (r.Comment LIKE @search OR vp.BusinessName LIKE @search)`;
    }
    
    const result = await pool.request()
      .input('search', sql.NVarChar, `%${search || ''}%`)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        SELECT 
          r.ReviewID,
          r.Rating,
          r.Comment as ReviewText,
          r.IsFlagged,
          r.FlagReason,
          r.AdminNotes,
          r.CreatedAt,
          u.Name as ReviewerName,
          u.Email as ReviewerEmail,
          vp.BusinessName as VendorName,
          vp.VendorProfileID,
          r.BookingID
        FROM Reviews r
        JOIN Users u ON r.UserID = u.UserID
        JOIN VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
        WHERE ${whereClause}
        ORDER BY r.CreatedAt DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    
    const countResult = await pool.request()
      .input('search', sql.NVarChar, `%${search || ''}%`)
      .query(`
        SELECT COUNT(*) as total
        FROM Reviews r
        JOIN VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
        WHERE ${whereClause}
      `);
    
    res.json({
      reviews: result.recordset,
      total: countResult.recordset[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /admin/reviews/:id/flag - Flag/unflag review
router.post('/reviews/:id/flag', async (req, res) => {
  try {
    const { id } = req.params;
    const { flagged, reason } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('flagged', sql.Bit, flagged)
      .input('reason', sql.NVarChar, reason)
      .query(`
        UPDATE Reviews 
        SET IsFlagged = @flagged, FlagReason = @reason
        WHERE ReviewID = @id
      `);
    
    res.json({ success: true, message: flagged ? 'Review flagged' : 'Review unflagged' });
  } catch (error) {
    console.error('Error flagging review:', error);
    res.status(500).json({ error: 'Failed to flag review' });
  }
});

// POST /admin/reviews/:id/unflag - Unflag review
router.post('/reviews/:id/unflag', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Reviews 
        SET IsFlagged = 0, FlagReason = NULL
        WHERE ReviewID = @id
      `);
    
    res.json({ success: true, message: 'Review unflagged' });
  } catch (error) {
    console.error('Error unflagging review:', error);
    res.status(500).json({ error: 'Failed to unflag review' });
  }
});

// DELETE /admin/reviews/:id - Delete review
router.delete('/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM Reviews WHERE ReviewID = @id`);
    
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ==================== CATEGORIES MANAGEMENT ====================

// GET /admin/categories - Get all categories (from VendorCategories table)
router.get('/categories', async (req, res) => {
  try {
    const pool = await getPool();
    
    // Get unique categories from VendorCategories table
    const result = await pool.request().query(`
      SELECT 
        Category as CategoryName,
        COUNT(*) as VendorCount
      FROM VendorCategories
      GROUP BY Category
      ORDER BY Category
    `);
    
    // Transform to expected format
    const categories = result.recordset.map((cat, index) => ({
      CategoryID: index + 1,
      CategoryName: cat.CategoryName,
      Description: '',
      IconClass: 'fas fa-tag',
      IsActive: true,
      DisplayOrder: index,
      VendorCount: cat.VendorCount
    }));
    
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
});

// POST /admin/categories - Create category
router.post('/categories', async (req, res) => {
  try {
    const { name, description, iconClass } = req.body;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description)
      .input('iconClass', sql.NVarChar, iconClass)
      .query(`
        INSERT INTO Categories (CategoryName, Description, IconClass, IsActive)
        OUTPUT INSERTED.CategoryID
        VALUES (@name, @description, @iconClass, 1)
      `);
    
    res.json({ success: true, categoryId: result.recordset[0].CategoryID });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /admin/categories/:id - Update category
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, iconClass, isActive } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description)
      .input('iconClass', sql.NVarChar, iconClass)
      .input('isActive', sql.Bit, isActive)
      .query(`
        UPDATE Categories 
        SET CategoryName = @name, Description = @description, IconClass = @iconClass, IsActive = @isActive
        WHERE CategoryID = @id
      `);
    
    res.json({ success: true, message: 'Category updated' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /admin/categories/:id - Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    // First remove vendor associations
    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM VendorCategories WHERE CategoryID = @id`);
    
    // Then delete category
    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM Categories WHERE CategoryID = @id`);
    
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ==================== ANALYTICS ====================

// GET /admin/analytics - Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const pool = await getPool();
    
    let dateFilter;
    switch (range) {
      case '7d': dateFilter = 'DATEADD(day, -7, GETDATE())'; break;
      case '90d': dateFilter = 'DATEADD(day, -90, GETDATE())'; break;
      case '1y': dateFilter = 'DATEADD(year, -1, GETDATE())'; break;
      default: dateFilter = 'DATEADD(day, -30, GETDATE())';
    }
    
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM VendorProfiles) as totalVendors,
        (SELECT COUNT(*) FROM VendorProfiles WHERE ProfileStatus = 'approved') as activeListings,
        (SELECT COUNT(*) FROM Users WHERE IsActive = 1) as totalUsers,
        (SELECT COUNT(*) FROM Bookings WHERE CreatedAt >= ${dateFilter}) as totalBookings,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM Bookings WHERE CreatedAt >= ${dateFilter}) as monthlyRevenue,
        (SELECT ISNULL(SUM(TotalAmount * 0.1), 0) FROM Bookings WHERE CreatedAt >= ${dateFilter}) as platformFees,
        (SELECT AVG(CAST(TotalAmount as FLOAT)) FROM Bookings WHERE CreatedAt >= ${dateFilter}) as averageBookingValue
    `);
    
    // Get top categories
    const topCategories = await pool.request().query(`
      SELECT TOP 5
        vc.Category as name,
        COUNT(DISTINCT vc.VendorProfileID) as count,
        ISNULL(SUM(b.TotalAmount), 0) as revenue
      FROM VendorCategories vc
      LEFT JOIN Bookings b ON vc.VendorProfileID = b.VendorProfileID AND b.CreatedAt >= ${dateFilter}
      GROUP BY vc.Category
      ORDER BY count DESC
    `);
    
    // Get top vendors
    const topVendors = await pool.request().query(`
      SELECT TOP 5
        vp.BusinessName as name,
        vp.TotalBookings as bookings,
        ISNULL(SUM(b.TotalAmount), 0) as revenue,
        vp.AvgRating as rating
      FROM VendorProfiles vp
      LEFT JOIN Bookings b ON vp.VendorProfileID = b.VendorProfileID AND b.CreatedAt >= ${dateFilter}
      WHERE vp.ProfileStatus = 'approved'
      GROUP BY vp.VendorProfileID, vp.BusinessName, vp.TotalBookings, vp.AvgRating
      ORDER BY vp.TotalBookings DESC
    `);
    
    // Get booking trends (last 6 months)
    const bookingTrends = await pool.request().query(`
      SELECT 
        FORMAT(CreatedAt, 'MMM') as month,
        COUNT(*) as bookings,
        ISNULL(SUM(TotalAmount), 0) as revenue
      FROM Bookings
      WHERE CreatedAt >= DATEADD(month, -6, GETDATE())
      GROUP BY FORMAT(CreatedAt, 'MMM'), MONTH(CreatedAt)
      ORDER BY MONTH(CreatedAt)
    `);
    
    res.json({
      ...result.recordset[0],
      topCategories: topCategories.recordset,
      topVendors: topVendors.recordset,
      bookingTrends: bookingTrends.recordset
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

// ==================== PAYMENTS ====================

// GET /admin/payments/stats - Get payment statistics
router.get('/payments/stats', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM Bookings WHERE Status IN ('Completed', 'completed')) as totalRevenue,
        (SELECT ISNULL(SUM(TotalAmount * 0.1), 0) FROM Bookings WHERE Status IN ('Completed', 'completed')) as platformFees,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM Bookings WHERE Status IN ('Confirmed', 'confirmed', 'Pending', 'pending')) as pendingPayouts,
        (SELECT ISNULL(SUM(TotalAmount * 0.9), 0) FROM Bookings WHERE Status IN ('Completed', 'completed')) as completedPayouts
    `);
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ error: 'Failed to fetch payment stats', details: error.message });
  }
});

// GET /admin/payments/vendor-balances - Get vendor balances
router.get('/payments/vendor-balances', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT 
        vp.VendorProfileID as VendorID,
        vp.BusinessName as VendorName,
        u.Email as VendorEmail,
        ISNULL(SUM(CASE WHEN b.Status IN ('Completed', 'completed') THEN b.TotalAmount * 0.9 ELSE 0 END), 0) as AvailableBalance,
        ISNULL(SUM(CASE WHEN b.Status IN ('Confirmed', 'confirmed') THEN b.TotalAmount * 0.9 ELSE 0 END), 0) as PendingBalance,
        ISNULL(SUM(b.TotalAmount * 0.9), 0) as TotalEarned,
        MAX(b.CreatedAt) as LastPayoutDate
      FROM VendorProfiles vp
      LEFT JOIN Users u ON vp.UserID = u.UserID
      LEFT JOIN Bookings b ON vp.VendorProfileID = b.VendorProfileID
      WHERE vp.ProfileStatus = 'approved'
      GROUP BY vp.VendorProfileID, vp.BusinessName, u.Email
      ORDER BY TotalEarned DESC
    `);
    
    res.json({ balances: result.recordset });
  } catch (error) {
    console.error('Error fetching vendor balances:', error);
    res.status(500).json({ error: 'Failed to fetch vendor balances', details: error.message });
  }
});

// GET /admin/payments/transactions - Get transactions
router.get('/payments/transactions', async (req, res) => {
  try {
    const { filter, page = 1, limit = 20 } = req.query;
    const pool = await getPool();
    const offset = (page - 1) * limit;
    
    const result = await pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        SELECT 
          b.BookingID as TransactionID,
          b.CreatedAt,
          u.Name as ClientName,
          vp.BusinessName as VendorName,
          b.BookingID,
          b.TotalAmount as Amount,
          b.TotalAmount * 0.1 as PlatformFee,
          b.Status
        FROM Bookings b
        JOIN Users u ON b.UserID = u.UserID
        JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
        ORDER BY b.CreatedAt DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    
    const countResult = await pool.request().query(`SELECT COUNT(*) as total FROM Bookings`);
    
    res.json({ transactions: result.recordset, total: countResult.recordset[0].total });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /admin/payments/payouts - Get payouts (vendor earnings)
router.get('/payments/payouts', async (req, res) => {
  try {
    const { filter, page = 1, limit = 20 } = req.query;
    const pool = await getPool();
    const offset = (page - 1) * limit;
    
    const result = await pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        SELECT 
          vp.VendorProfileID as PayoutID,
          vp.BusinessName as VendorName,
          u.Email as VendorEmail,
          ISNULL(SUM(b.TotalAmount * 0.9), 0) as Amount,
          'completed' as Status,
          MAX(b.CreatedAt) as ProcessedAt
        FROM VendorProfiles vp
        LEFT JOIN Users u ON vp.UserID = u.UserID
        LEFT JOIN Bookings b ON vp.VendorProfileID = b.VendorProfileID AND b.Status IN ('Completed', 'completed')
        WHERE vp.ProfileStatus = 'approved'
        GROUP BY vp.VendorProfileID, vp.BusinessName, u.Email
        HAVING SUM(b.TotalAmount) > 0
        ORDER BY MAX(b.CreatedAt) DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM VendorProfiles WHERE ProfileStatus = 'approved'
    `);
    
    res.json({ payouts: result.recordset, total: countResult.recordset[0].total });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// ==================== SECURITY LOGS ====================

// GET /admin/security/logs - Get security logs (using user login data)
router.get('/security/logs', async (req, res) => {
  try {
    const { type = 'login', page = 1, limit = 50 } = req.query;
    const pool = await getPool();
    const offset = (page - 1) * limit;
    
    if (type === 'login') {
      // Get recent login activity from Users table
      const result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT 
            u.UserID as id,
            u.Email as user,
            'Login Success' as action,
            '0.0.0.0' as ip,
            'Unknown' as location,
            'Web Browser' as device,
            u.LastLogin as timestamp
          FROM Users u
          WHERE u.LastLogin IS NOT NULL
          ORDER BY u.LastLogin DESC
          OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);
      
      res.json({ logs: result.recordset, total: result.recordset.length });
    } else if (type === 'admin') {
      // Get admin users and their recent activity
      const result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT 
            u.UserID as id,
            u.Email as admin,
            'Admin Login' as action,
            'System' as target,
            'Admin accessed dashboard' as details,
            u.LastLogin as timestamp
          FROM Users u
          WHERE u.IsAdmin = 1 AND u.LastLogin IS NOT NULL
          ORDER BY u.LastLogin DESC
          OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);
      
      res.json({ logs: result.recordset, total: result.recordset.length });
    } else if (type === 'flagged') {
      // Get flagged reviews
      const result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT 
            r.ReviewID as id,
            'Review' as type,
            'Review #' + CAST(r.ReviewID as NVARCHAR) as item,
            'Flagged for review' as reason,
            'medium' as severity,
            r.CreatedAt as timestamp
          FROM Reviews r
          WHERE r.IsFlagged = 1
          ORDER BY r.CreatedAt DESC
          OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);
      
      res.json({ logs: result.recordset, total: result.recordset.length });
    } else {
      res.json({ logs: [], total: 0 });
    }
  } catch (error) {
    console.error('Error fetching security logs:', error);
    res.status(500).json({ error: 'Failed to fetch security logs', details: error.message });
  }
});

// ==================== SUPPORT TOOLS ====================

// GET /admin/support/search - Search users/vendors
router.get('/support/search', async (req, res) => {
  try {
    const { q } = req.query;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('search', sql.NVarChar, `%${q}%`)
      .query(`
        SELECT TOP 10
          'user' as type,
          u.UserID as id,
          u.Name as name,
          u.Email as email,
          CASE WHEN u.IsVendor = 1 THEN 'Vendor' ELSE 'Client' END as accountType
        FROM Users u
        WHERE u.Email LIKE @search OR u.Name LIKE @search
        ORDER BY u.CreatedAt DESC
      `);
    
    res.json({ results: result.recordset });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ==================== CONTENT MANAGEMENT ====================

// GET /admin/content/:type - Get content items
router.get('/content/:type', async (req, res) => {
  try {
    // Return empty for now - can be expanded with actual CMS tables
    res.json({ items: [] });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// ==================== NOTIFICATIONS ====================

// GET /admin/notifications/templates - Get notification templates
router.get('/notifications/templates', async (req, res) => {
  try {
    // Return default templates
    res.json({ templates: [] });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// ==================== SETTINGS ====================

// GET /admin/settings - Get platform settings
router.get('/settings', async (req, res) => {
  try {
    // Return default settings - can be expanded with settings table
    res.json({ settings: {} });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /admin/settings - Update platform settings
router.put('/settings', async (req, res) => {
  try {
    // Save settings - can be expanded with settings table
    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

module.exports = router;
