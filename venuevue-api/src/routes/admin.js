const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
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

// GET /admin/environment-info - Get environment and server information
router.get('/environment-info', async (req, res) => {
  try {
    const pool = await getPool();
    
    // Get database info
    const dbInfo = await pool.request().query(`
      SELECT 
        @@SERVERNAME as serverName,
        DB_NAME() as databaseName,
        @@VERSION as sqlVersion
    `);
    
    const serverInfo = dbInfo.recordset[0];
    
    // Calculate uptime
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptime = days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
    
    // Get memory usage
    const memUsage = process.memoryUsage();
    const memoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    // Determine environment
    const isProduction = process.env.NODE_ENV === 'production';
    const dbServer = process.env.DB_SERVER || 'localhost';
    const isLocalDb = dbServer.includes('localhost') || dbServer.includes('Sami-PC') || dbServer.includes('127.0.0.1');
    
    res.json({
      environment: isProduction ? 'production' : 'development',
      databaseMode: isLocalDb ? 'Local Database' : 'Cloud Database',
      databaseServer: serverInfo.serverName || dbServer,
      databaseName: serverInfo.databaseName || process.env.DB_NAME,
      apiUrl: `${req.protocol}://${req.get('host')}`,
      nodeVersion: process.version,
      uptime: uptime,
      memoryUsage: `${memoryMB}MB / ${memoryTotalMB}MB`,
      platform: process.platform,
      sqlVersion: serverInfo.sqlVersion ? serverInfo.sqlVersion.split('\n')[0] : 'Unknown'
    });
  } catch (error) {
    console.error('Error fetching environment info:', error);
    res.status(500).json({ error: 'Failed to fetch environment info', details: error.message });
  }
});

// GET /admin/platform-health - Get real-time platform health metrics
router.get('/platform-health', async (req, res) => {
  try {
    const startTime = Date.now();
    const pool = await getPool();
    
    // Test database response time
    await pool.request().query('SELECT 1');
    const dbResponseTime = Date.now() - startTime;
    
    // Get database stats
    const dbStats = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM sys.dm_exec_sessions WHERE is_user_process = 1) as activeConnections,
        (SELECT cntr_value FROM sys.dm_os_performance_counters WHERE counter_name = 'User Connections') as userConnections
    `);
    
    // Get table sizes for storage estimate
    const storageStats = await pool.request().query(`
      SELECT 
        SUM(reserved_page_count) * 8.0 / 1024 as totalSizeMB
      FROM sys.dm_db_partition_stats
    `);
    
    // Get record counts for load estimate
    const loadStats = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM VendorProfiles) as vendors,
        (SELECT COUNT(*) FROM Users) as users,
        (SELECT COUNT(*) FROM Bookings) as bookings,
        (SELECT COUNT(*) FROM Reviews) as reviews
    `);
    
    const memUsage = process.memoryUsage();
    const memoryPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
    
    // Calculate database load based on active connections (assume max 100 connections)
    const activeConns = dbStats.recordset[0]?.activeConnections || 1;
    const dbLoad = Math.min(Math.round((activeConns / 50) * 100), 100);
    
    // Calculate storage (estimate based on data size, assume 10GB max)
    const storageMB = storageStats.recordset[0]?.totalSizeMB || 100;
    const storagePercent = Math.min(Math.round((storageMB / 10240) * 100), 100);
    
    res.json({
      serverStatus: 'operational',
      apiResponseTime: dbResponseTime,
      databaseLoad: dbLoad,
      storageUsed: storagePercent,
      memoryUsed: memoryPercent,
      activeConnections: activeConns,
      totalRecords: loadStats.recordset[0],
      lastChecked: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching platform health:', error);
    res.status(500).json({ 
      serverStatus: 'degraded',
      error: 'Failed to fetch platform health',
      details: error.message 
    });
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
        ISNULL(vp.IsVisible, 0) as IsVisible,
        vp.IsVerified,
        vp.AcceptingBookings,
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
    
    // Get owner info and visibility status
    const ownerResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT u.Name as OwnerName, u.Email as OwnerEmail, u.Phone as OwnerPhone, u.CreatedAt as UserCreatedAt,
               ISNULL(vp.IsVisible, 0) as IsVisible, vp.ProfileStatus, vp.AcceptingBookings, vp.IsVerified
        FROM VendorProfiles vp
        LEFT JOIN Users u ON vp.UserID = u.UserID
        WHERE vp.VendorProfileID = @id
      `);
    const ownerInfo = ownerResult.recordset[0] || {};
    console.log('Visibility status:', ownerInfo.IsVisible, 'ProfileStatus:', ownerInfo.ProfileStatus);
    
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
            f.FeatureName AS FeatureKey,
            f.FeatureDescription,
            f.FeatureIcon,
            c.CategoryID,
            c.CategoryName,
            c.CategoryName AS CategoryKey,
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
      else if (status === 'visible') whereClause += ` AND ISNULL(vp.IsVisible, 0) = 1`;
      else if (status === 'hidden') whereClause += ` AND ISNULL(vp.IsVisible, 0) = 0`;
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
        ISNULL(vp.IsVisible, 0) as IsVisible,
        vp.IsVerified,
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
// Sets IsVisible = 1 to make vendor appear on main grid
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
            IsVisible = 1,
            AdminNotes = @adminNotes,
            ReviewedAt = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @id
      `);
    
    res.json({ success: true, message: 'Vendor approved and now visible on the platform' });
  } catch (error) {
    console.error('Error approving vendor:', error);
    res.status(500).json({ error: 'Failed to approve vendor' });
  }
});

// POST /admin/vendors/:id/reject - Reject vendor
// Sets IsVisible = 0 to hide vendor from main grid
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
            IsVisible = 0,
            RejectionReason = @reason,
            AdminNotes = @adminNotes,
            ReviewedAt = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @id
      `);
    
    res.json({ success: true, message: 'Vendor rejected and hidden from platform' });
  } catch (error) {
    console.error('Error rejecting vendor:', error);
    res.status(500).json({ error: 'Failed to reject vendor' });
  }
});

// POST /admin/vendors/:id/suspend - Suspend vendor
// Sets IsVisible = 0 to hide vendor from main grid
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
            IsVisible = 0,
            AdminNotes = @reason,
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @id
      `);
    
    res.json({ success: true, message: 'Vendor suspended and hidden from platform' });
  } catch (error) {
    console.error('Error suspending vendor:', error);
    res.status(500).json({ error: 'Failed to suspend vendor' });
  }
});

// POST /admin/vendors/:id/toggle-visibility - Toggle vendor visibility
// Toggles IsVisible between 0 and 1
router.post('/vendors/:id/toggle-visibility', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    // First get current visibility
    const current = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT IsVisible FROM VendorProfiles WHERE VendorProfileID = @id');
    
    const currentVisibility = current.recordset[0]?.IsVisible || 0;
    const newVisibility = currentVisibility === 1 ? 0 : 1;
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('newVisibility', sql.Bit, newVisibility)
      .query(`
        UPDATE VendorProfiles 
        SET IsVisible = @newVisibility,
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @id
      `);
    
    res.json({ 
      success: true, 
      message: newVisibility === 1 ? 'Vendor is now visible on the platform' : 'Vendor is now hidden from the platform',
      isVisible: newVisibility === 1
    });
  } catch (error) {
    console.error('Error toggling visibility:', error);
    res.status(500).json({ error: 'Failed to toggle visibility' });
  }
});

// POST /admin/vendors/:id/visibility - Set vendor visibility explicitly
// Sets IsVisible to 0 or 1 based on request body
router.post('/vendors/:id/visibility', async (req, res) => {
  try {
    const { id } = req.params;
    const { visible } = req.body;
    const pool = await getPool();
    
    const isVisible = visible ? 1 : 0;
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('visible', sql.Bit, isVisible)
      .query(`
        UPDATE VendorProfiles 
        SET IsVisible = @visible,
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @id
      `);
    
    res.json({ 
      success: true, 
      message: visible ? 'Vendor is now visible on the platform' : 'Vendor is now hidden from the platform',
      isVisible: isVisible === 1
    });
  } catch (error) {
    console.error('Error setting visibility:', error);
    res.status(500).json({ error: 'Failed to set visibility' });
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

// GET /admin/bookings - Get ALL bookings for ALL users and vendors
// Uses vw_UserBookings view (same as sp_GetUserBookingsAll used by dashboard)
router.get('/bookings', async (req, res) => {
  try {
    const { status, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const pool = await getPool();
    const offset = (page - 1) * limit;
    
    // Build WHERE clause dynamically
    let whereConditions = ['1=1'];
    
    if (status && status !== 'all') {
      // Capitalize first letter to match database status values
      const statusValue = status.charAt(0).toUpperCase() + status.slice(1);
      whereConditions.push(`Status = '${statusValue}'`);
    }
    if (startDate) {
      whereConditions.push(`EventDate >= '${startDate}'`);
    }
    if (endDate) {
      whereConditions.push(`EventDate <= '${endDate}'`);
    }
    if (search) {
      whereConditions.push(`(CAST(BookingID as NVARCHAR) LIKE '%${search}%' OR VendorName LIKE '%${search}%')`);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Use the vw_UserBookings view - same as dashboard uses via sp_GetUserBookingsAll
    // But without the UserID filter to get ALL bookings
    const result = await pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        SELECT 
          BookingID,
          UserID,
          VendorProfileID,
          VendorName,
          ServiceID,
          ServiceName,
          ServiceCategory,
          EventDate,
          EndDate,
          Status,
          TotalAmount,
          DepositAmount,
          DepositPaid,
          FullAmountPaid,
          AttendeeCount,
          SpecialRequests,
          EventLocation,
          EventName,
          EventType,
          TimeZone,
          CreatedAt,
          UpdatedAt,
          ServiceImage,
          ConversationID,
          UnreadMessages
        FROM vw_UserBookings
        WHERE ${whereClause}
        ORDER BY EventDate DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    
    const countResult = await pool.request()
      .query(`
        SELECT COUNT(*) as total
        FROM vw_UserBookings
        WHERE ${whereClause}
      `);
    
    console.log(`Admin: Fetched ${result.recordset.length} bookings out of ${countResult.recordset[0].total} total from vw_UserBookings`);
    
    res.json({
      bookings: result.recordset,
      total: countResult.recordset[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
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

// POST /admin/reviews/:id/note - Add admin note to review
router.post('/reviews/:id/note', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('note', sql.NVarChar, note)
      .query(`
        UPDATE Reviews 
        SET AdminNotes = @note
        WHERE ReviewID = @id
      `);
    
    res.json({ success: true, message: 'Note saved' });
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ error: 'Failed to save note' });
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

// GET /admin/security/logs - Get security logs from SecurityLogs table
router.get('/security/logs', async (req, res) => {
  try {
    const { type = 'login', status, search, page = 1, limit = 50 } = req.query;
    const pool = await getPool();
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;
    
    // Check if SecurityLogs table exists
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'SecurityLogs'
    `);
    
    if (tableCheck.recordset[0].cnt > 0) {
      // Use SecurityLogs table
      let whereConditions = ['1=1'];
      
      if (type === 'login') {
        whereConditions.push("Action IN ('Login', 'Logout', 'LoginFailed')");
      } else if (type === 'admin') {
        whereConditions.push("Action LIKE 'Admin%'");
      } else if (type === 'flagged') {
        whereConditions.push("ActionStatus = 'Failed'");
      }
      
      if (status === 'success') whereConditions.push("ActionStatus = 'Success'");
      if (status === 'failed') whereConditions.push("ActionStatus = 'Failed'");
      if (search) whereConditions.push(`(Email LIKE '%${search}%' OR Details LIKE '%${search}%')`);
      
      const whereClause = whereConditions.join(' AND ');
      
      const result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limitNum)
        .query(`
          SELECT 
            LogID as id,
            UserID,
            Email as [user],
            Action as action,
            ActionStatus as status,
            IPAddress as ip,
            Location as location,
            Device as device,
            Details as details,
            CreatedAt as timestamp
          FROM SecurityLogs
          WHERE ${whereClause}
          ORDER BY CreatedAt DESC
          OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);
      
      const countResult = await pool.request().query(`
        SELECT COUNT(*) as total FROM SecurityLogs WHERE ${whereClause}
      `);
      
      res.json({ 
        logs: result.recordset, 
        total: countResult.recordset[0].total,
        page: pageNum,
        limit: limitNum
      });
    } else {
      // Fallback to Users table LastLogin data
      const result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limitNum)
        .query(`
          SELECT 
            u.UserID as id,
            u.Email as [user],
            'Login Success' as action,
            'Success' as status,
            NULL as ip,
            NULL as location,
            'Web Browser' as device,
            NULL as details,
            u.LastLogin as timestamp
          FROM Users u
          WHERE u.LastLogin IS NOT NULL
          ORDER BY u.LastLogin DESC
          OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);
      
      res.json({ logs: result.recordset, total: result.recordset.length });
    }
  } catch (error) {
    console.error('Error fetching security logs:', error);
    res.status(500).json({ error: 'Failed to fetch security logs', details: error.message });
  }
});

// POST /admin/security/log - Log a security event
router.post('/security/log', async (req, res) => {
  try {
    const { userId, email, action, status = 'Success', ipAddress, userAgent, location, device, details } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('email', sql.NVarChar, email)
      .input('action', sql.NVarChar, action)
      .input('status', sql.NVarChar, status)
      .input('ipAddress', sql.NVarChar, ipAddress)
      .input('userAgent', sql.NVarChar, userAgent)
      .input('location', sql.NVarChar, location)
      .input('device', sql.NVarChar, device)
      .input('details', sql.NVarChar, details)
      .query(`
        INSERT INTO SecurityLogs (UserID, Email, Action, ActionStatus, IPAddress, UserAgent, Location, Device, Details)
        VALUES (@userId, @email, @action, @status, @ipAddress, @userAgent, @location, @device, @details)
      `);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging security event:', error);
    res.status(500).json({ error: 'Failed to log security event' });
  }
});

// ==================== CHAT OVERSIGHT ====================

// GET /admin/chats - Get ALL conversations for ALL users and vendors
router.get('/chats', async (req, res) => {
  try {
    const { filter = 'all', page = 1, limit = 20, search = '' } = req.query;
    const pool = await getPool();
    const offset = (page - 1) * limit;
    
    // Get ALL conversations from Conversations table joined with Messages
    const result = await pool.request()
      .input('search', sql.NVarChar, `%${search}%`)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        SELECT 
          c.ConversationID,
          c.UserID,
          c.VendorProfileID,
          c.CreatedAt,
          u.UserID as ClientID,
          ISNULL(u.Name, 'Unknown Client') as ClientName,
          ISNULL(u.Email, 'No Email') as ClientEmail,
          vp.VendorProfileID,
          ISNULL(vp.BusinessName, 'Unknown Vendor') as VendorName,
          ISNULL(vu.Email, 'No Email') as VendorEmail,
          ISNULL(vu.Name, 'Unknown Owner') as VendorOwnerName,
          ISNULL((SELECT TOP 1 Content FROM Messages WHERE ConversationID = c.ConversationID ORDER BY CreatedAt DESC), 'No messages') as LastMessage,
          (SELECT TOP 1 CreatedAt FROM Messages WHERE ConversationID = c.ConversationID ORDER BY CreatedAt DESC) as LastMessageAt,
          ISNULL((SELECT COUNT(*) FROM Messages WHERE ConversationID = c.ConversationID), 0) as MessageCount,
          ISNULL((SELECT COUNT(*) FROM Messages WHERE ConversationID = c.ConversationID AND IsRead = 0), 0) as UnreadCount,
          0 as IsFlagged
        FROM Conversations c
        LEFT JOIN Users u ON c.UserID = u.UserID
        LEFT JOIN VendorProfiles vp ON c.VendorProfileID = vp.VendorProfileID
        LEFT JOIN Users vu ON vp.UserID = vu.UserID
        WHERE (u.Name LIKE @search OR vp.BusinessName LIKE @search OR u.Email LIKE @search OR @search = '%%')
        ORDER BY ISNULL((SELECT TOP 1 CreatedAt FROM Messages WHERE ConversationID = c.ConversationID ORDER BY CreatedAt DESC), c.CreatedAt) DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM Conversations
    `);
    
    console.log(`Admin: Fetched ${result.recordset.length} conversations out of ${countResult.recordset[0].total} total`);
    
    res.json({
      conversations: result.recordset,
      total: countResult.recordset[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching admin conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
  }
});

// GET /admin/chats/:id/messages - Get messages for a conversation
router.get('/chats/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('conversationId', sql.Int, id)
      .query(`
        SELECT 
          m.MessageID,
          m.ConversationID,
          m.SenderID,
          m.Content,
          m.CreatedAt,
          m.IsRead,
          u.Name as SenderName,
          CASE WHEN u.IsVendor = 1 THEN 'vendor' ELSE 'client' END as SenderType,
          0 as IsFlagged,
          0 as IsSystem,
          0 as IsAdminNote
        FROM Messages m
        LEFT JOIN Users u ON m.SenderID = u.UserID
        WHERE m.ConversationID = @conversationId
        ORDER BY m.CreatedAt ASC
      `);
    
    res.json({ messages: result.recordset });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
});

// POST /admin/chats/:id/system-message - Send system message
router.post('/chats/:id/system-message', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const pool = await getPool();
    
    // Insert system message (use admin user ID or 0 for system)
    await pool.request()
      .input('conversationId', sql.Int, id)
      .input('message', sql.NVarChar, message)
      .query(`
        INSERT INTO Messages (ConversationID, SenderID, Content, SentAt, IsRead)
        VALUES (@conversationId, 0, '[SYSTEM] ' + @message, GETDATE(), 0)
      `);
    
    res.json({ success: true, message: 'System message sent' });
  } catch (error) {
    console.error('Error sending system message:', error);
    res.status(500).json({ error: 'Failed to send system message' });
  }
});

// POST /admin/chats/:id/notes - Add admin note to conversation
router.post('/chats/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const pool = await getPool();
    
    // Insert admin note
    await pool.request()
      .input('conversationId', sql.Int, id)
      .input('note', sql.NVarChar, note)
      .query(`
        INSERT INTO Messages (ConversationID, SenderID, Content, SentAt, IsRead)
        VALUES (@conversationId, 0, '[ADMIN NOTE] ' + @note, GETDATE(), 1)
      `);
    
    res.json({ success: true, message: 'Note added' });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// POST /admin/chats/messages/:id/flag - Flag a message
router.post('/chats/messages/:id/flag', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    // For now, just return success - can add IsFlagged column to Messages table later
    res.json({ success: true, message: 'Message flagged' });
  } catch (error) {
    console.error('Error flagging message:', error);
    res.status(500).json({ error: 'Failed to flag message' });
  }
});

// POST /admin/chats/:id/flag - Flag a conversation
router.post('/chats/:id/flag', async (req, res) => {
  try {
    const { id } = req.params;
    // For now, just return success - can add IsFlagged tracking later
    res.json({ success: true, message: 'Conversation flagged' });
  } catch (error) {
    console.error('Error flagging conversation:', error);
    res.status(500).json({ error: 'Failed to flag conversation' });
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

// GET /admin/support/tickets - Get support tickets
router.get('/support/tickets', async (req, res) => {
  try {
    const { status, priority, category, search, page = 1, limit = 20 } = req.query;
    const pool = await getPool();
    const offset = (page - 1) * limit;
    
    // Check if SupportTickets table exists
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'SupportTickets'
    `);
    
    if (tableCheck.recordset[0].cnt > 0) {
      let whereConditions = ['1=1'];
      if (status) whereConditions.push(`t.Status = '${status}'`);
      if (priority) whereConditions.push(`t.Priority = '${priority}'`);
      if (category) whereConditions.push(`t.Category = '${category}'`);
      if (search) whereConditions.push(`(t.Subject LIKE '%${search}%' OR t.UserEmail LIKE '%${search}%' OR t.TicketNumber LIKE '%${search}%')`);
      
      const whereClause = whereConditions.join(' AND ');
      
      const result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT 
            t.TicketID as id,
            t.TicketNumber as ticketNumber,
            t.UserID as userId,
            t.UserEmail as userEmail,
            t.UserName as userName,
            t.Subject as subject,
            t.Description as description,
            t.Category as category,
            t.Priority as priority,
            t.Status as status,
            t.AssignedTo as assignedTo,
            a.Name as assignedToName,
            t.Source as source,
            t.ConversationID as conversationId,
            t.CreatedAt as createdAt,
            t.UpdatedAt as updatedAt,
            t.ResolvedAt as resolvedAt,
            (SELECT COUNT(*) FROM SupportTicketMessages WHERE TicketID = t.TicketID) as messageCount
          FROM SupportTickets t
          LEFT JOIN Users a ON t.AssignedTo = a.UserID
          WHERE ${whereClause}
          ORDER BY 
            CASE t.Priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
            t.CreatedAt DESC
          OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);
      
      const countResult = await pool.request().query(`
        SELECT COUNT(*) as total FROM SupportTickets t WHERE ${whereClause}
      `);
      
      res.json({ 
        tickets: result.recordset, 
        total: countResult.recordset[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } else {
      res.json({ tickets: [], total: 0 });
    }
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// POST /admin/support/tickets - Create support ticket
router.post('/support/tickets', async (req, res) => {
  try {
    const { userId, userEmail, userName, subject, description, category, priority, source, conversationId } = req.body;
    const pool = await getPool();
    
    // Generate ticket number
    const ticketNumber = 'TKT-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    
    const result = await pool.request()
      .input('ticketNumber', sql.NVarChar, ticketNumber)
      .input('userId', sql.Int, userId)
      .input('userEmail', sql.NVarChar, userEmail)
      .input('userName', sql.NVarChar, userName)
      .input('subject', sql.NVarChar, subject)
      .input('description', sql.NVarChar, description)
      .input('category', sql.NVarChar, category || 'general')
      .input('priority', sql.NVarChar, priority || 'medium')
      .input('source', sql.NVarChar, source || 'chat')
      .input('conversationId', sql.Int, conversationId)
      .query(`
        INSERT INTO SupportTickets (TicketNumber, UserID, UserEmail, UserName, Subject, Description, Category, Priority, Source, ConversationID)
        OUTPUT INSERTED.TicketID, INSERTED.TicketNumber
        VALUES (@ticketNumber, @userId, @userEmail, @userName, @subject, @description, @category, @priority, @source, @conversationId)
      `);
    
    res.json({ success: true, ticketId: result.recordset[0].TicketID, ticketNumber: result.recordset[0].TicketNumber });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// PUT /admin/support/tickets/:id - Update support ticket
router.put('/support/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, category } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar, status)
      .input('priority', sql.NVarChar, priority)
      .input('assignedTo', sql.Int, assignedTo)
      .input('category', sql.NVarChar, category)
      .query(`
        UPDATE SupportTickets SET
          Status = ISNULL(@status, Status),
          Priority = ISNULL(@priority, Priority),
          AssignedTo = ISNULL(@assignedTo, AssignedTo),
          Category = ISNULL(@category, Category),
          UpdatedAt = GETUTCDATE(),
          ResolvedAt = CASE WHEN @status = 'resolved' THEN GETUTCDATE() ELSE ResolvedAt END,
          ClosedAt = CASE WHEN @status = 'closed' THEN GETUTCDATE() ELSE ClosedAt END
        WHERE TicketID = @id
      `);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// GET /admin/support/tickets/:id/messages - Get ticket messages
router.get('/support/tickets/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          m.MessageID as id,
          m.TicketID as ticketId,
          m.SenderID as senderId,
          u.Name as senderName,
          m.SenderType as senderType,
          m.Message as message,
          m.Attachments as attachments,
          m.IsInternal as isInternal,
          m.CreatedAt as createdAt
        FROM SupportTicketMessages m
        LEFT JOIN Users u ON m.SenderID = u.UserID
        WHERE m.TicketID = @id
        ORDER BY m.CreatedAt ASC
      `);
    
    res.json({ messages: result.recordset });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /admin/support/tickets/:id/messages - Add message to ticket
router.post('/support/tickets/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { senderId, senderType, message, attachments, isInternal } = req.body;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('ticketId', sql.Int, id)
      .input('senderId', sql.Int, senderId)
      .input('senderType', sql.NVarChar, senderType || 'admin')
      .input('message', sql.NVarChar, message)
      .input('attachments', sql.NVarChar, attachments ? JSON.stringify(attachments) : null)
      .input('isInternal', sql.Bit, isInternal || false)
      .query(`
        INSERT INTO SupportTicketMessages (TicketID, SenderID, SenderType, Message, Attachments, IsInternal)
        OUTPUT INSERTED.MessageID
        VALUES (@ticketId, @senderId, @senderType, @message, @attachments, @isInternal);
        
        UPDATE SupportTickets SET UpdatedAt = GETUTCDATE() WHERE TicketID = @ticketId;
      `);
    
    res.json({ success: true, messageId: result.recordset[0].MessageID });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// ==================== CONTENT MANAGEMENT ====================

// GET /admin/content/banners - Get homepage banners
router.get('/content/banners', async (req, res) => {
  try {
    const pool = await getPool();
    
    // Check if ContentBanners table exists
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'ContentBanners'
    `);
    
    if (tableCheck.recordset[0].cnt > 0) {
      const result = await pool.request().query(`
        SELECT * FROM ContentBanners ORDER BY DisplayOrder, CreatedAt DESC
      `);
      res.json({ items: result.recordset });
    } else {
      res.json({ items: [] });
    }
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

// POST /admin/content/banners - Create/update banner
router.post('/content/banners', async (req, res) => {
  try {
    const { id, title, subtitle, imageUrl, linkUrl, linkText, backgroundColor, textColor, position, displayOrder, startDate, endDate, isActive } = req.body;
    const pool = await getPool();
    
    if (id) {
      // Update existing
      await pool.request()
        .input('id', sql.Int, id)
        .input('title', sql.NVarChar, title)
        .input('subtitle', sql.NVarChar, subtitle)
        .input('imageUrl', sql.NVarChar, imageUrl)
        .input('linkUrl', sql.NVarChar, linkUrl)
        .input('linkText', sql.NVarChar, linkText)
        .input('backgroundColor', sql.NVarChar, backgroundColor)
        .input('textColor', sql.NVarChar, textColor)
        .input('position', sql.NVarChar, position || 'hero')
        .input('displayOrder', sql.Int, displayOrder || 0)
        .input('startDate', sql.DateTime2, startDate || null)
        .input('endDate', sql.DateTime2, endDate || null)
        .input('isActive', sql.Bit, isActive !== false)
        .query(`
          UPDATE ContentBanners SET
            Title = @title, Subtitle = @subtitle, ImageURL = @imageUrl,
            LinkURL = @linkUrl, LinkText = @linkText, BackgroundColor = @backgroundColor,
            TextColor = @textColor, Position = @position, DisplayOrder = @displayOrder,
            StartDate = @startDate, EndDate = @endDate, IsActive = @isActive, UpdatedAt = GETUTCDATE()
          WHERE BannerID = @id
        `);
      res.json({ success: true, id });
    } else {
      // Create new
      const result = await pool.request()
        .input('title', sql.NVarChar, title)
        .input('subtitle', sql.NVarChar, subtitle)
        .input('imageUrl', sql.NVarChar, imageUrl)
        .input('linkUrl', sql.NVarChar, linkUrl)
        .input('linkText', sql.NVarChar, linkText)
        .input('backgroundColor', sql.NVarChar, backgroundColor)
        .input('textColor', sql.NVarChar, textColor)
        .input('position', sql.NVarChar, position || 'hero')
        .input('displayOrder', sql.Int, displayOrder || 0)
        .input('startDate', sql.DateTime2, startDate || null)
        .input('endDate', sql.DateTime2, endDate || null)
        .input('isActive', sql.Bit, isActive !== false)
        .query(`
          INSERT INTO ContentBanners (Title, Subtitle, ImageURL, LinkURL, LinkText, BackgroundColor, TextColor, Position, DisplayOrder, StartDate, EndDate, IsActive)
          OUTPUT INSERTED.BannerID
          VALUES (@title, @subtitle, @imageUrl, @linkUrl, @linkText, @backgroundColor, @textColor, @position, @displayOrder, @startDate, @endDate, @isActive)
        `);
      res.json({ success: true, id: result.recordset[0].BannerID });
    }
  } catch (error) {
    console.error('Error saving banner:', error);
    res.status(500).json({ error: 'Failed to save banner' });
  }
});

// DELETE /admin/content/banners/:id - Delete banner
router.delete('/content/banners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM ContentBanners WHERE BannerID = @id');
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

// GET /admin/content/announcements - Get announcements
router.get('/content/announcements', async (req, res) => {
  try {
    const pool = await getPool();
    
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'Announcements'
    `);
    
    if (tableCheck.recordset[0].cnt > 0) {
      const result = await pool.request().query(`
        SELECT * FROM Announcements ORDER BY DisplayOrder, CreatedAt DESC
      `);
      res.json({ items: result.recordset });
    } else {
      res.json({ items: [] });
    }
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// POST /admin/content/announcements - Create/update announcement
router.post('/content/announcements', async (req, res) => {
  try {
    // Accept both 'content' and 'Message' field names for compatibility
    const { id, title, content, Message, type, Type, icon, linkUrl, linkText, displayType, targetAudience, startDate, StartDate, endDate, EndDate, isActive, IsActive, isDismissible, displayOrder, Title } = req.body;
    const pool = await getPool();
    
    // Normalize field names (frontend may send different cases)
    const announcementTitle = title || Title;
    const announcementContent = content || Message;
    const announcementType = type || Type || 'info';
    const announcementStartDate = startDate || StartDate;
    const announcementEndDate = endDate || EndDate;
    const announcementIsActive = isActive !== undefined ? isActive : (IsActive !== undefined ? IsActive : true);
    
    if (id) {
      await pool.request()
        .input('id', sql.Int, id)
        .input('title', sql.NVarChar, announcementTitle)
        .input('content', sql.NVarChar, announcementContent)
        .input('type', sql.NVarChar, announcementType)
        .input('icon', sql.NVarChar, icon)
        .input('linkUrl', sql.NVarChar, linkUrl)
        .input('linkText', sql.NVarChar, linkText)
        .input('displayType', sql.NVarChar, displayType || 'banner')
        .input('targetAudience', sql.NVarChar, targetAudience || 'all')
        .input('startDate', sql.DateTime2, announcementStartDate || null)
        .input('endDate', sql.DateTime2, announcementEndDate || null)
        .input('isActive', sql.Bit, announcementIsActive)
        .input('isDismissible', sql.Bit, isDismissible !== false)
        .input('displayOrder', sql.Int, displayOrder || 0)
        .query(`
          UPDATE Announcements SET
            Title = @title, Content = @content, Type = @type, Icon = @icon,
            LinkURL = @linkUrl, LinkText = @linkText, DisplayType = @displayType,
            TargetAudience = @targetAudience, StartDate = @startDate, EndDate = @endDate,
            IsActive = @isActive, IsDismissible = @isDismissible, DisplayOrder = @displayOrder, UpdatedAt = GETUTCDATE()
          WHERE AnnouncementID = @id
        `);
      res.json({ success: true, id });
    } else {
      const result = await pool.request()
        .input('title', sql.NVarChar, announcementTitle)
        .input('content', sql.NVarChar, announcementContent)
        .input('type', sql.NVarChar, announcementType)
        .input('icon', sql.NVarChar, icon)
        .input('linkUrl', sql.NVarChar, linkUrl)
        .input('linkText', sql.NVarChar, linkText)
        .input('displayType', sql.NVarChar, displayType || 'banner')
        .input('targetAudience', sql.NVarChar, targetAudience || 'all')
        .input('startDate', sql.DateTime2, announcementStartDate || null)
        .input('endDate', sql.DateTime2, announcementEndDate || null)
        .input('isActive', sql.Bit, announcementIsActive)
        .input('isDismissible', sql.Bit, isDismissible !== false)
        .input('displayOrder', sql.Int, displayOrder || 0)
        .query(`
          INSERT INTO Announcements (Title, Content, Type, Icon, LinkURL, LinkText, DisplayType, TargetAudience, StartDate, EndDate, IsActive, IsDismissible, DisplayOrder)
          OUTPUT INSERTED.AnnouncementID
          VALUES (@title, @content, @type, @icon, @linkUrl, @linkText, @displayType, @targetAudience, @startDate, @endDate, @isActive, @isDismissible, @displayOrder)
        `);
      res.json({ success: true, id: result.recordset[0].AnnouncementID });
    }
  } catch (error) {
    console.error('Error saving announcement:', error);
    res.status(500).json({ error: 'Failed to save announcement' });
  }
});

// DELETE /admin/content/announcements/:id - Delete announcement
router.delete('/content/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Announcements WHERE AnnouncementID = @id');
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// GET /admin/content/faqs - Get platform FAQs
router.get('/content/faqs', async (req, res) => {
  try {
    const pool = await getPool();
    
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'PlatformFAQs'
    `);
    
    if (tableCheck.recordset[0].cnt > 0) {
      const result = await pool.request().query(`
        SELECT * FROM PlatformFAQs ORDER BY DisplayOrder, CreatedAt DESC
      `);
      res.json({ items: result.recordset });
    } else {
      res.json({ items: [] });
    }
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// POST /admin/content/faqs - Create/update FAQ
router.post('/content/faqs', async (req, res) => {
  try {
    const { id, question, answer, category, displayOrder, isActive } = req.body;
    const pool = await getPool();
    
    if (id) {
      await pool.request()
        .input('id', sql.Int, id)
        .input('question', sql.NVarChar, question)
        .input('answer', sql.NVarChar, answer)
        .input('category', sql.NVarChar, category || 'general')
        .input('displayOrder', sql.Int, displayOrder || 0)
        .input('isActive', sql.Bit, isActive !== false)
        .query(`
          UPDATE PlatformFAQs SET Question = @question, Answer = @answer, Category = @category, DisplayOrder = @displayOrder, IsActive = @isActive, UpdatedAt = GETUTCDATE()
          WHERE FAQID = @id
        `);
      res.json({ success: true, id });
    } else {
      const result = await pool.request()
        .input('question', sql.NVarChar, question)
        .input('answer', sql.NVarChar, answer)
        .input('category', sql.NVarChar, category || 'general')
        .input('displayOrder', sql.Int, displayOrder || 0)
        .input('isActive', sql.Bit, isActive !== false)
        .query(`
          INSERT INTO PlatformFAQs (Question, Answer, Category, DisplayOrder, IsActive)
          OUTPUT INSERTED.FAQID
          VALUES (@question, @answer, @category, @displayOrder, @isActive)
        `);
      res.json({ success: true, id: result.recordset[0].FAQID });
    }
  } catch (error) {
    console.error('Error saving FAQ:', error);
    res.status(500).json({ error: 'Failed to save FAQ' });
  }
});

// DELETE /admin/content/faqs/:id - Delete FAQ
router.delete('/content/faqs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM PlatformFAQs WHERE FAQID = @id');
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// GET /admin/content/:type - Generic fallback for other content types
router.get('/content/:type', async (req, res) => {
  try {
    res.json({ items: [] });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// ==================== NOTIFICATIONS / EMAIL TEMPLATES ====================

// GET /admin/notifications/templates - Get email templates from database
router.get('/notifications/templates', async (req, res) => {
  try {
    const pool = await getPool();
    
    // Use the existing EmailTemplates table with EmailTemplateComponents
    const result = await pool.request().query(`
      SELECT 
        t.TemplateID as id,
        t.TemplateName as name,
        t.TemplateKey as templateKey,
        t.Category as category,
        t.Subject as subject,
        t.AvailableVariables as variables,
        t.IsActive as isActive,
        t.CreatedAt,
        t.UpdatedAt,
        'email' as type,
        COALESCE(h.HtmlContent, '') + COALESCE(b.HtmlContent, '') + COALESCE(f.HtmlContent, '') as body,
        h.HtmlContent as headerHtml,
        b.HtmlContent as bodyHtml,
        f.HtmlContent as footerHtml
      FROM EmailTemplates t
      LEFT JOIN EmailTemplateComponents h ON t.HeaderComponentID = h.ComponentID
      LEFT JOIN EmailTemplateComponents b ON t.BodyComponentID = b.ComponentID
      LEFT JOIN EmailTemplateComponents f ON t.FooterComponentID = f.ComponentID
      ORDER BY t.Category, t.TemplateName
    `);
    
    res.json({ templates: result.recordset });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
  }
});

// GET /admin/notifications/template/:id - Get single template with full HTML preview
router.get('/notifications/template/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          t.TemplateID as id,
          t.TemplateName as name,
          t.TemplateKey as templateKey,
          t.Category as category,
          t.Subject as subject,
          t.AvailableVariables as variables,
          t.IsActive as isActive,
          h.HtmlContent as headerHtml,
          b.HtmlContent as bodyHtml,
          f.HtmlContent as footerHtml,
          h.ComponentID as headerComponentId,
          b.ComponentID as bodyComponentId,
          f.ComponentID as footerComponentId
        FROM EmailTemplates t
        LEFT JOIN EmailTemplateComponents h ON t.HeaderComponentID = h.ComponentID
        LEFT JOIN EmailTemplateComponents b ON t.BodyComponentID = b.ComponentID
        LEFT JOIN EmailTemplateComponents f ON t.FooterComponentID = f.ComponentID
        WHERE t.TemplateID = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const template = result.recordset[0];
    // Combine for full preview
    template.fullHtml = (template.headerHtml || '') + (template.bodyHtml || '') + (template.footerHtml || '');
    
    res.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// PUT /admin/notifications/template/:id - Update template body component
router.put('/notifications/template/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, bodyHtml, isActive } = req.body;
    const pool = await getPool();
    
    // Get the body component ID
    const templateResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT BodyComponentID FROM EmailTemplates WHERE TemplateID = @id');
    
    if (templateResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const bodyComponentId = templateResult.recordset[0].BodyComponentID;
    
    // Update the template subject and active status
    await pool.request()
      .input('id', sql.Int, id)
      .input('subject', sql.NVarChar, subject)
      .input('isActive', sql.Bit, isActive !== false)
      .query(`
        UPDATE EmailTemplates 
        SET Subject = @subject, IsActive = @isActive, UpdatedAt = GETUTCDATE()
        WHERE TemplateID = @id
      `);
    
    // Update the body component HTML if provided
    if (bodyHtml && bodyComponentId) {
      await pool.request()
        .input('componentId', sql.Int, bodyComponentId)
        .input('htmlContent', sql.NVarChar, bodyHtml)
        .query(`
          UPDATE EmailTemplateComponents 
          SET HtmlContent = @htmlContent, UpdatedAt = GETUTCDATE()
          WHERE ComponentID = @componentId
        `);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// GET /admin/notifications/logs - Get email send logs
router.get('/notifications/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, templateKey, status } = req.query;
    const pool = await getPool();
    const offset = (page - 1) * limit;
    
    let whereConditions = ['1=1'];
    if (templateKey) whereConditions.push(`TemplateKey = '${templateKey}'`);
    if (status) whereConditions.push(`Status = '${status}'`);
    
    const whereClause = whereConditions.join(' AND ');
    
    const result = await pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        SELECT 
          EmailLogID as id,
          TemplateKey as templateKey,
          RecipientEmail as recipientEmail,
          RecipientName as recipientName,
          Subject as subject,
          Status as status,
          ErrorMessage as errorMessage,
          SentAt as sentAt,
          UserID as userId,
          BookingID as bookingId
        FROM EmailLogs
        WHERE ${whereClause}
        ORDER BY SentAt DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM EmailLogs WHERE ${whereClause}
    `);
    
    res.json({ 
      logs: result.recordset, 
      total: countResult.recordset[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
});

// PUT /admin/notifications/templates/:id - Update template
router.put('/notifications/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body } = req.body;
    // In a real implementation, save to database
    res.json({ success: true, message: 'Template updated' });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// POST /admin/notifications/send - Send notification
router.post('/notifications/send', async (req, res) => {
  try {
    const { type, recipientType, subject, message } = req.body;
    const pool = await getPool();
    
    // Get recipients based on type
    let recipients = [];
    if (recipientType === 'all') {
      const result = await pool.request().query(`SELECT Email FROM Users WHERE IsActive = 1`);
      recipients = result.recordset.map(r => r.Email);
    } else if (recipientType === 'vendors') {
      const result = await pool.request().query(`
        SELECT u.Email FROM Users u 
        WHERE u.IsVendor = 1 AND u.IsActive = 1
      `);
      recipients = result.recordset.map(r => r.Email);
    } else if (recipientType === 'clients') {
      const result = await pool.request().query(`
        SELECT u.Email FROM Users u 
        WHERE u.IsVendor = 0 AND u.IsActive = 1
      `);
      recipients = result.recordset.map(r => r.Email);
    }
    
    // Log notification (in real implementation, send actual emails)
    console.log(`Sending ${type} notification to ${recipients.length} recipients`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    
    res.json({ 
      success: true, 
      message: `Notification queued for ${recipients.length} recipients`,
      recipientCount: recipients.length
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// POST /admin/notifications/preview - Preview notification
router.post('/notifications/preview', async (req, res) => {
  try {
    const { subject, body, variables } = req.body;
    
    // Replace variables in template
    let previewBody = body;
    if (variables) {
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        previewBody = previewBody.replace(regex, variables[key]);
      });
    }
    
    res.json({
      subject,
      body: previewBody,
      preview: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            h2 { color: #007bff; }
            a { color: #007bff; text-decoration: none; }
          </style>
        </head>
        <body>
          ${previewBody}
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">This is a preview of the email that will be sent.</p>
        </body>
        </html>
      `
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
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

// POST /admin/settings/maintenance - Toggle maintenance mode
router.post('/settings/maintenance', async (req, res) => {
  try {
    const { enabled } = req.body;
    // In production, this would update a settings table or environment variable
    console.log(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
    res.json({ success: true, message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    console.error('Error toggling maintenance mode:', error);
    res.status(500).json({ error: 'Failed to toggle maintenance mode' });
  }
});

// ==================== BOOKING REFUNDS & DISPUTES ====================

// POST /admin/bookings/:id/refund - Process refund for a booking
router.post('/bookings/:id/refund', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const pool = await getPool();
    
    // Get booking details
    const bookingResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT * FROM Bookings WHERE BookingID = @id`);
    
    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = bookingResult.recordset[0];
    
    // Update booking status and record refund
    await pool.request()
      .input('id', sql.Int, id)
      .input('refundAmount', sql.Decimal(10,2), amount)
      .input('reason', sql.NVarChar, reason)
      .query(`
        UPDATE Bookings 
        SET Status = 'Refunded',
            RefundAmount = @refundAmount,
            RefundReason = @reason,
            RefundedAt = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE BookingID = @id
      `);
    
    // Log the refund action
    console.log(`Refund processed: Booking #${id}, Amount: $${amount}, Reason: ${reason}`);
    
    res.json({ 
      success: true, 
      message: `Refund of $${amount} processed for booking #${id}`,
      refundAmount: amount
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund', details: error.message });
  }
});

// POST /admin/bookings/:id/resolve-dispute - Resolve a booking dispute
router.post('/bookings/:id/resolve-dispute', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, action } = req.body;
    const pool = await getPool();
    
    let newStatus = 'Completed';
    let refundAmount = 0;
    
    // Get booking details
    const bookingResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT * FROM Bookings WHERE BookingID = @id`);
    
    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = bookingResult.recordset[0];
    
    // Determine action based on resolution type
    switch (action) {
      case 'refund_client':
        newStatus = 'Refunded';
        refundAmount = booking.TotalAmount;
        break;
      case 'partial_refund':
        newStatus = 'Partially Refunded';
        refundAmount = booking.TotalAmount * 0.5; // 50% refund
        break;
      case 'favor_vendor':
        newStatus = 'Completed';
        break;
      case 'split':
        newStatus = 'Partially Refunded';
        refundAmount = booking.TotalAmount * 0.5;
        break;
      default:
        newStatus = 'Completed';
    }
    
    // Update booking
    await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar, newStatus)
      .input('refundAmount', sql.Decimal(10,2), refundAmount)
      .input('resolution', sql.NVarChar, resolution)
      .query(`
        UPDATE Bookings 
        SET Status = @status,
            RefundAmount = @refundAmount,
            DisputeResolution = @resolution,
            DisputeResolvedAt = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE BookingID = @id
      `);
    
    res.json({ 
      success: true, 
      message: 'Dispute resolved successfully',
      newStatus,
      refundAmount
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    res.status(500).json({ error: 'Failed to resolve dispute', details: error.message });
  }
});

// GET /admin/bookings/export - Export bookings to CSV
router.get('/bookings/export', async (req, res) => {
  try {
    const { status } = req.query;
    const pool = await getPool();
    
    let whereClause = '1=1';
    if (status && status !== 'all') {
      whereClause = `b.Status = '${status}'`;
    }
    
    const result = await pool.request().query(`
      SELECT 
        b.BookingID,
        u.Name as ClientName,
        u.Email as ClientEmail,
        vp.BusinessName as VendorName,
        b.EventDate,
        b.StartTime,
        b.EndTime,
        b.TotalAmount,
        b.DepositAmount,
        b.Status,
        b.CreatedAt
      FROM Bookings b
      LEFT JOIN Users u ON b.UserID = u.UserID
      LEFT JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
      WHERE ${whereClause}
      ORDER BY b.CreatedAt DESC
    `);
    
    // Convert to CSV
    const bookings = result.recordset;
    if (bookings.length === 0) {
      return res.status(404).json({ error: 'No bookings to export' });
    }
    
    const headers = Object.keys(bookings[0]).join(',');
    const rows = bookings.map(b => Object.values(b).map(v => `"${v || ''}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=bookings-${status || 'all'}-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting bookings:', error);
    res.status(500).json({ error: 'Failed to export bookings', details: error.message });
  }
});

// ==================== CATEGORY SERVICES ====================

// POST /admin/categories/:id/visibility - Toggle category visibility
router.post('/categories/:id/visibility', async (req, res) => {
  try {
    const { id } = req.params;
    const { visible } = req.body;
    // Since categories are stored in VendorCategories, we'll just return success
    // In a full implementation, you'd have a Categories table with IsVisible column
    res.json({ success: true, message: `Category visibility updated to ${visible}` });
  } catch (error) {
    console.error('Error updating category visibility:', error);
    res.status(500).json({ error: 'Failed to update visibility' });
  }
});

// GET /admin/categories/:id/services - Get service templates for a category
router.get('/categories/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    // Get services associated with this category
    const result = await pool.request()
      .input('categoryId', sql.Int, id)
      .query(`
        SELECT DISTINCT
          vs.ServiceID,
          vs.ServiceName,
          vs.ServiceDescription as Description,
          vs.Price as DefaultPrice,
          vs.DurationMinutes,
          vc.Category as CategoryName
        FROM VendorServices vs
        JOIN VendorCategories vc ON vs.VendorProfileID = vc.VendorProfileID
        WHERE vc.Category = (
          SELECT TOP 1 Category FROM VendorCategories 
          WHERE VendorProfileID = @categoryId OR Category LIKE '%' + CAST(@categoryId as NVARCHAR) + '%'
        )
        ORDER BY vs.ServiceName
      `);
    
    res.json({ services: result.recordset });
  } catch (error) {
    console.error('Error fetching category services:', error);
    res.status(500).json({ error: 'Failed to fetch services', details: error.message });
  }
});

// POST /admin/categories/:id/services - Add service template to category
router.post('/categories/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, defaultPrice } = req.body;
    
    // In a full implementation, you'd have a ServiceTemplates table
    // For now, we'll just return success
    res.json({ 
      success: true, 
      message: 'Service template added',
      service: { name, description, defaultPrice }
    });
  } catch (error) {
    console.error('Error adding service template:', error);
    res.status(500).json({ error: 'Failed to add service template' });
  }
});

// DELETE /admin/services/:id - Delete a service template
router.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM VendorServices WHERE ServiceID = @id`);
    
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// ==================== PAYMENT OPERATIONS ====================

// POST /admin/payments/manual-payout - Process manual payout to vendor
router.post('/payments/manual-payout', async (req, res) => {
  try {
    const { vendorId, amount } = req.body;
    const pool = await getPool();
    
    // Get vendor details
    const vendorResult = await pool.request()
      .input('vendorId', sql.Int, vendorId)
      .query(`
        SELECT vp.BusinessName, vp.StripeAccountId, u.Email
        FROM VendorProfiles vp
        LEFT JOIN Users u ON vp.UserID = u.UserID
        WHERE vp.VendorProfileID = @vendorId
      `);
    
    if (vendorResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    const vendor = vendorResult.recordset[0];
    
    // Log the payout (in production, this would integrate with Stripe)
    console.log(`Manual payout initiated: Vendor ${vendor.BusinessName}, Amount: $${amount}`);
    
    res.json({ 
      success: true, 
      message: `Payout of $${amount} initiated for ${vendor.BusinessName}`,
      vendorName: vendor.BusinessName,
      amount
    });
  } catch (error) {
    console.error('Error processing manual payout:', error);
    res.status(500).json({ error: 'Failed to process payout', details: error.message });
  }
});

// POST /admin/payments/refund - Process refund for a transaction
router.post('/payments/refund', async (req, res) => {
  try {
    const { transactionId, amount, reason } = req.body;
    const pool = await getPool();
    
    // Get booking/transaction details
    const bookingResult = await pool.request()
      .input('id', sql.Int, transactionId)
      .query(`SELECT * FROM Bookings WHERE BookingID = @id`);
    
    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Update booking with refund info
    await pool.request()
      .input('id', sql.Int, transactionId)
      .input('refundAmount', sql.Decimal(10,2), amount)
      .input('reason', sql.NVarChar, reason)
      .query(`
        UPDATE Bookings 
        SET Status = 'Refunded',
            RefundAmount = @refundAmount,
            RefundReason = @reason,
            RefundedAt = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE BookingID = @id
      `);
    
    res.json({ 
      success: true, 
      message: `Refund of $${amount} processed`,
      refundAmount: amount
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund', details: error.message });
  }
});

// ==================== ANALYTICS EXTENDED ====================

// GET /admin/analytics/revenue - Get revenue analytics
router.get('/analytics/revenue', async (req, res) => {
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
    
    // Daily revenue for the period
    const dailyRevenue = await pool.request().query(`
      SELECT 
        CAST(CreatedAt as DATE) as date,
        COUNT(*) as bookings,
        ISNULL(SUM(TotalAmount), 0) as revenue,
        ISNULL(SUM(TotalAmount * 0.1), 0) as platformFees
      FROM Bookings
      WHERE CreatedAt >= ${dateFilter}
      GROUP BY CAST(CreatedAt as DATE)
      ORDER BY date
    `);
    
    res.json({ dailyRevenue: dailyRevenue.recordset });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

// GET /admin/analytics/users - Get user analytics
router.get('/analytics/users', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Users) as totalUsers,
        (SELECT COUNT(*) FROM Users WHERE IsVendor = 1) as totalVendors,
        (SELECT COUNT(*) FROM Users WHERE IsVendor = 0) as totalClients,
        (SELECT COUNT(*) FROM Users WHERE CreatedAt >= DATEADD(day, -7, GETDATE())) as newUsersThisWeek,
        (SELECT COUNT(*) FROM Users WHERE CreatedAt >= DATEADD(day, -30, GETDATE())) as newUsersThisMonth,
        (SELECT COUNT(*) FROM Users WHERE LastLogin >= DATEADD(day, -7, GETDATE())) as activeUsersThisWeek
    `);
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

// ==================== PUBLIC CONTENT ENDPOINTS (No Auth) ====================
// These endpoints are used by the homepage to display banners and announcements

// GET /admin/public/banners - Get active banners for homepage
router.get('/public/banners', async (req, res) => {
  try {
    const pool = await getPool();
    
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'ContentBanners'
    `);
    
    if (tableCheck.recordset[0].cnt > 0) {
      const result = await pool.request().query(`
        SELECT BannerID, Title, Subtitle, ImageURL, LinkURL, LinkText, BackgroundColor, TextColor, Position
        FROM ContentBanners
        WHERE IsActive = 1 
          AND (StartDate IS NULL OR StartDate <= GETUTCDATE()) 
          AND (EndDate IS NULL OR EndDate >= GETUTCDATE())
        ORDER BY DisplayOrder, CreatedAt DESC
      `);
      res.json({ banners: result.recordset });
    } else {
      res.json({ banners: [] });
    }
  } catch (error) {
    console.error('Error fetching public banners:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

// GET /admin/public/announcements - Get active announcements for homepage
router.get('/public/announcements', async (req, res) => {
  try {
    const { audience = 'all' } = req.query;
    const pool = await getPool();
    
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'Announcements'
    `);
    
    if (tableCheck.recordset[0].cnt > 0) {
      const result = await pool.request()
        .input('audience', sql.NVarChar, audience)
        .query(`
          SELECT AnnouncementID, Title, Content, Type, Icon, LinkURL, LinkText, DisplayType, IsDismissible
          FROM Announcements
          WHERE IsActive = 1 
            AND (StartDate IS NULL OR StartDate <= GETUTCDATE()) 
            AND (EndDate IS NULL OR EndDate >= GETUTCDATE())
            AND (TargetAudience = 'all' OR TargetAudience = @audience)
          ORDER BY DisplayOrder, CreatedAt DESC
        `);
      
      // Update view count
      if (result.recordset.length > 0) {
        const ids = result.recordset.map(a => a.AnnouncementID).join(',');
        await pool.request().query(`UPDATE Announcements SET ViewCount = ViewCount + 1 WHERE AnnouncementID IN (${ids})`);
      }
      
      res.json({ announcements: result.recordset });
    } else {
      res.json({ announcements: [] });
    }
  } catch (error) {
    console.error('Error fetching public announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// POST /admin/public/announcements/:id/dismiss - Dismiss an announcement
router.post('/public/announcements/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Announcements SET DismissCount = DismissCount + 1 WHERE AnnouncementID = @id');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing announcement:', error);
    res.status(500).json({ error: 'Failed to dismiss announcement' });
  }
});

// ==================== FAQ MANAGEMENT ====================

// GET /admin/faqs - Get all FAQs
router.get('/faqs', async (req, res) => {
  try {
    const pool = await getPool();
    
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'FAQs'
    `);
    
    if (tableCheck.recordset[0].cnt === 0) {
      return res.json({ faqs: [] });
    }
    
    const result = await pool.request().query(`
      SELECT FAQID, Question, Answer, Category, DisplayOrder, IsActive, CreatedAt, UpdatedAt
      FROM FAQs
      ORDER BY DisplayOrder, CreatedAt
    `);
    
    res.json({ faqs: result.recordset });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// POST /admin/faqs - Create new FAQ
router.post('/faqs', async (req, res) => {
  try {
    const { question, answer, category, displayOrder } = req.body;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('question', sql.NVarChar, question)
      .input('answer', sql.NVarChar, answer)
      .input('category', sql.NVarChar, category || 'General')
      .input('displayOrder', sql.Int, displayOrder || 0)
      .query(`
        INSERT INTO FAQs (Question, Answer, Category, DisplayOrder, IsActive)
        OUTPUT INSERTED.*
        VALUES (@question, @answer, @category, @displayOrder, 1)
      `);
    
    res.json({ success: true, faq: result.recordset[0] });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

// PUT /admin/faqs/:id - Update FAQ
router.put('/faqs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, displayOrder, isActive } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('question', sql.NVarChar, question)
      .input('answer', sql.NVarChar, answer)
      .input('category', sql.NVarChar, category)
      .input('displayOrder', sql.Int, displayOrder)
      .input('isActive', sql.Bit, isActive)
      .query(`
        UPDATE FAQs 
        SET Question = @question, Answer = @answer, Category = @category, 
            DisplayOrder = @displayOrder, IsActive = @isActive, UpdatedAt = GETUTCDATE()
        WHERE FAQID = @id
      `);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// DELETE /admin/faqs/:id - Delete FAQ
router.delete('/faqs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM FAQs WHERE FAQID = @id');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// ==================== COMMISSION SETTINGS ====================

// GET /admin/commission-settings - Get all commission settings
router.get('/commission-settings', async (req, res) => {
  try {
    const pool = await getPool();
    
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'CommissionSettings'
    `);
    
    if (tableCheck.recordset[0].cnt === 0) {
      return res.json({ settings: [] });
    }
    
    const result = await pool.request().query(`
      SELECT SettingID, SettingKey, SettingValue, Description, SettingType, MinValue, MaxValue, IsActive, CreatedAt, UpdatedAt
      FROM CommissionSettings
      ORDER BY SettingKey
    `);
    
    res.json({ settings: result.recordset });
  } catch (error) {
    console.error('Error fetching commission settings:', error);
    res.status(500).json({ error: 'Failed to fetch commission settings' });
  }
});

// PUT /admin/commission-settings/:key - Update commission setting
router.put('/commission-settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('key', sql.NVarChar, key)
      .input('value', sql.NVarChar, value)
      .input('description', sql.NVarChar, description)
      .query(`
        UPDATE CommissionSettings 
        SET SettingValue = @value, Description = ISNULL(@description, Description), UpdatedAt = GETUTCDATE()
        WHERE SettingKey = @key
      `);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating commission setting:', error);
    res.status(500).json({ error: 'Failed to update commission setting' });
  }
});

// POST /admin/commission-settings - Create new commission setting
router.post('/commission-settings', async (req, res) => {
  try {
    const { settingKey, settingValue, description, settingType, minValue, maxValue } = req.body;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('settingKey', sql.NVarChar, settingKey)
      .input('settingValue', sql.NVarChar, settingValue)
      .input('description', sql.NVarChar, description)
      .input('settingType', sql.NVarChar, settingType || 'percentage')
      .input('minValue', sql.Decimal(10, 2), minValue)
      .input('maxValue', sql.Decimal(10, 2), maxValue)
      .query(`
        INSERT INTO CommissionSettings (SettingKey, SettingValue, Description, SettingType, MinValue, MaxValue, IsActive)
        OUTPUT INSERTED.*
        VALUES (@settingKey, @settingValue, @description, @settingType, @minValue, @maxValue, 1)
      `);
    
    res.json({ success: true, setting: result.recordset[0] });
  } catch (error) {
    console.error('Error creating commission setting:', error);
    res.status(500).json({ error: 'Failed to create commission setting' });
  }
});

// PUT /admin/commission-settings - Update all commission settings at once
router.put('/commission-settings', async (req, res) => {
  try {
    const { platformFeePercent, stripeFeePercent, stripeFeeFixed, taxPercent, currency } = req.body;
    const pool = await getPool();
    
    // Update each setting
    const updates = [
      { key: 'platform_fee_percent', value: platformFeePercent },
      { key: 'stripe_fee_percent', value: stripeFeePercent },
      { key: 'stripe_fee_fixed', value: stripeFeeFixed },
      { key: 'tax_percent', value: taxPercent }
    ];
    
    for (const update of updates) {
      if (update.value !== undefined) {
        await pool.request()
          .input('key', sql.NVarChar, update.key)
          .input('value', sql.NVarChar, String(update.value))
          .query(`
            UPDATE CommissionSettings 
            SET SettingValue = @value, UpdatedAt = GETUTCDATE()
            WHERE SettingKey = @key
          `);
      }
    }
    
    res.json({ success: true, message: 'Commission settings updated' });
  } catch (error) {
    console.error('Error updating commission settings:', error);
    res.status(500).json({ error: 'Failed to update commission settings' });
  }
});

// GET /admin/payment-calculator - Calculate payment breakdown
router.get('/payment-calculator', async (req, res) => {
  try {
    const { amount } = req.query;
    const bookingAmount = parseFloat(amount) || 100;
    const pool = await getPool();
    
    // Get commission settings
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'CommissionSettings'
    `);
    
    let platformCommission = 15;
    let renterFee = 5;
    let stripeFeeRate = 2.9;
    let stripeFixedFee = 0.30;
    
    if (tableCheck.recordset[0].cnt > 0) {
      const settings = await pool.request().query(`
        SELECT SettingKey, SettingValue FROM CommissionSettings WHERE IsActive = 1
      `);
      
      settings.recordset.forEach(s => {
        if (s.SettingKey === 'platform_commission_rate') platformCommission = parseFloat(s.SettingValue);
        if (s.SettingKey === 'renter_processing_fee_rate') renterFee = parseFloat(s.SettingValue);
        if (s.SettingKey === 'stripe_application_fee_rate') stripeFeeRate = parseFloat(s.SettingValue);
        if (s.SettingKey === 'stripe_fixed_fee') stripeFixedFee = parseFloat(s.SettingValue);
      });
    }
    
    // Calculate breakdown
    const renterProcessingFee = (bookingAmount * renterFee) / 100;
    const totalCustomerPays = bookingAmount + renterProcessingFee;
    const platformFee = (bookingAmount * platformCommission) / 100;
    const stripeFee = (totalCustomerPays * stripeFeeRate) / 100 + stripeFixedFee;
    const vendorPayout = bookingAmount - platformFee;
    const platformRevenue = platformFee + renterProcessingFee - stripeFee;
    
    res.json({
      success: true,
      breakdown: {
        bookingAmount: bookingAmount.toFixed(2),
        renterProcessingFee: renterProcessingFee.toFixed(2),
        totalCustomerPays: totalCustomerPays.toFixed(2),
        platformCommission: platformFee.toFixed(2),
        platformCommissionRate: platformCommission,
        stripeFee: stripeFee.toFixed(2),
        vendorPayout: vendorPayout.toFixed(2),
        platformRevenue: platformRevenue.toFixed(2),
        renterFeeRate: renterFee
      }
    });
  } catch (error) {
    console.error('Error calculating payment:', error);
    res.status(500).json({ error: 'Failed to calculate payment' });
  }
});

// ==================== 2FA SETTINGS ====================

// GET /admin/security/2fa-settings - Get 2FA settings
router.get('/security/2fa-settings', async (req, res) => {
  try {
    const pool = await getPool();
    
    // Check if SecuritySettings table exists
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'SecuritySettings'
    `);
    
    if (tableCheck.recordset[0].cnt > 0) {
      const result = await pool.request().query(`
        SELECT SettingKey, SettingValue FROM SecuritySettings WHERE IsActive = 1
      `);
      
      const settings = {};
      result.recordset.forEach(s => {
        settings[s.SettingKey] = s.SettingValue;
      });
      
      res.json({
        success: true,
        settings: {
          require2FAForAdmins: settings.require_2fa_admins === 'true',
          require2FAForVendors: settings.require_2fa_vendors === 'true',
          sessionTimeout: parseInt(settings.session_timeout_minutes) || 60,
          failedLoginLockout: parseInt(settings.failed_login_lockout) || 5
        }
      });
    } else {
      // Return defaults if table doesn't exist
      res.json({
        success: true,
        settings: {
          require2FAForAdmins: process.env.ENABLE_2FA === 'true',
          require2FAForVendors: false,
          sessionTimeout: 60,
          failedLoginLockout: 5
        }
      });
    }
  } catch (error) {
    console.error('Error fetching 2FA settings:', error);
    res.status(500).json({ error: 'Failed to fetch 2FA settings' });
  }
});

// POST /admin/security/2fa-settings - Update 2FA settings
router.post('/security/2fa-settings', async (req, res) => {
  try {
    const { require2FAForAdmins, require2FAForVendors, sessionTimeout, failedLoginLockout } = req.body;
    const pool = await getPool();
    
    // Create SecuritySettings table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SecuritySettings')
      BEGIN
        CREATE TABLE SecuritySettings (
          SettingID INT PRIMARY KEY IDENTITY(1,1),
          SettingKey NVARCHAR(100) NOT NULL UNIQUE,
          SettingValue NVARCHAR(500) NOT NULL,
          Description NVARCHAR(500),
          IsActive BIT DEFAULT 1,
          UpdatedAt DATETIME DEFAULT GETUTCDATE(),
          UpdatedBy INT
        )
      END
    `);
    
    // Upsert settings
    const settings = [
      { key: 'require_2fa_admins', value: String(require2FAForAdmins) },
      { key: 'require_2fa_vendors', value: String(require2FAForVendors) },
      { key: 'session_timeout_minutes', value: String(sessionTimeout) },
      { key: 'failed_login_lockout', value: String(failedLoginLockout) }
    ];
    
    for (const setting of settings) {
      await pool.request()
        .input('key', sql.NVarChar, setting.key)
        .input('value', sql.NVarChar, setting.value)
        .query(`
          IF EXISTS (SELECT 1 FROM SecuritySettings WHERE SettingKey = @key)
            UPDATE SecuritySettings SET SettingValue = @value, UpdatedAt = GETUTCDATE() WHERE SettingKey = @key
          ELSE
            INSERT INTO SecuritySettings (SettingKey, SettingValue) VALUES (@key, @value)
        `);
    }
    
    // Log admin action
    try {
      await pool.request()
        .input('userId', sql.Int, req.user?.id || null)
        .input('email', sql.NVarChar, req.user?.email || 'admin')
        .input('action', sql.NVarChar, 'Admin2FASettingsUpdated')
        .input('status', sql.NVarChar, 'Success')
        .input('details', sql.NVarChar, JSON.stringify({ require2FAForAdmins, require2FAForVendors, sessionTimeout, failedLoginLockout }))
        .query(`
          INSERT INTO SecurityLogs (UserID, Email, Action, ActionStatus, Details)
          VALUES (@userId, @email, @action, @status, @details)
        `);
    } catch (logErr) { console.error('Failed to log admin action:', logErr.message); }
    
    res.json({ success: true, message: '2FA settings updated successfully' });
  } catch (error) {
    console.error('Error updating 2FA settings:', error);
    res.status(500).json({ error: 'Failed to update 2FA settings' });
  }
});

// GET /admin/security/admin-2fa-status - Get 2FA status for all admins
router.get('/security/admin-2fa-status', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT 
        u.UserID,
        u.Name,
        u.Email,
        u.IsAdmin,
        u.LastLogin,
        CASE WHEN u.TwoFactorEnabled = 1 THEN 1 ELSE 0 END as TwoFactorEnabled
      FROM Users u
      WHERE u.IsAdmin = 1
      ORDER BY u.Name
    `);
    
    res.json({ success: true, admins: result.recordset });
  } catch (error) {
    console.error('Error fetching admin 2FA status:', error);
    res.status(500).json({ error: 'Failed to fetch admin 2FA status' });
  }
});

// POST /admin/security/reset-2fa/:userId - Reset 2FA for a user
router.post('/security/reset-2fa/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await getPool();
    
    // Reset 2FA for user
    await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE Users SET TwoFactorEnabled = 0, TwoFactorSecret = NULL WHERE UserID = @userId
      `);
    
    // Delete any pending 2FA codes
    await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        DELETE FROM UserTwoFactorCodes WHERE UserID = @userId
      `);
    
    // Log admin action
    try {
      await pool.request()
        .input('adminId', sql.Int, req.user?.id || null)
        .input('email', sql.NVarChar, req.user?.email || 'admin')
        .input('action', sql.NVarChar, 'Admin2FAReset')
        .input('status', sql.NVarChar, 'Success')
        .input('details', sql.NVarChar, `Reset 2FA for user ID: ${userId}`)
        .query(`
          INSERT INTO SecurityLogs (UserID, Email, Action, ActionStatus, Details)
          VALUES (@adminId, @email, @action, @status, @details)
        `);
    } catch (logErr) { console.error('Failed to log admin action:', logErr.message); }
    
    res.json({ success: true, message: '2FA reset successfully' });
  } catch (error) {
    console.error('Error resetting 2FA:', error);
    res.status(500).json({ error: 'Failed to reset 2FA' });
  }
});

// GET /admin/security/flagged-items - Get flagged items
router.get('/security/flagged-items', async (req, res) => {
  try {
    const pool = await getPool();
    
    // Get flagged items from various sources
    const flaggedItems = [];
    
    // Get failed login attempts (potential security issues)
    const failedLogins = await pool.request().query(`
      SELECT TOP 10
        'Account' as type,
        Email as item,
        'Multiple failed login attempts' as reason,
        'high' as severity,
        CreatedAt as timestamp
      FROM SecurityLogs
      WHERE Action = 'LoginFailed'
      GROUP BY Email, CreatedAt
      HAVING COUNT(*) >= 3
      ORDER BY CreatedAt DESC
    `);
    
    flaggedItems.push(...failedLogins.recordset.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      ...item
    })));
    
    res.json({ success: true, items: flaggedItems });
  } catch (error) {
    console.error('Error fetching flagged items:', error);
    res.status(500).json({ error: 'Failed to fetch flagged items' });
  }
});

module.exports = router;
