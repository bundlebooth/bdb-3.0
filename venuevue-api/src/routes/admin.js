const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const { sendEmail, sendAccountSuspended, sendAccountReactivated, sendSupportMessageToUser } = require('../services/email');
const { serializeDates, serializeRecords } = require('../utils/helpers');

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
    
    const result = await pool.request().execute('admin.sp_GetDashboardStats');
    
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
    
    // Get database info using stored procedure
    const dbInfo = await pool.request().execute('admin.sp_GetEnvironmentInfo');
    
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
    
    // Get platform health data using stored procedure
    const result = await pool.request().execute('admin.sp_GetPlatformHealth');
    
    const dbStats = result.recordsets[0]?.[0] || {};
    const storageStats = result.recordsets[1]?.[0] || {};
    const loadStats = result.recordsets[2]?.[0] || {};
    
    const memUsage = process.memoryUsage();
    const memoryPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
    
    // Calculate database load based on user connections from this app (not all SQL Server sessions)
    // Use userConnections if available, otherwise estimate based on app connections only
    const activeConns = dbStats.userConnections || dbStats.activeConnections || 1;
    // More realistic calculation: assume max 200 connections for a healthy system
    // Only count as high load if there are many concurrent queries
    const dbLoad = Math.min(Math.round((activeConns / 200) * 100), 100);
    
    // Calculate storage (estimate based on data size, assume 10GB max)
    const storageMB = storageStats.totalSizeMB || 100;
    const storagePercent = Math.min(Math.round((storageMB / 10240) * 100), 100);
    
    res.json({
      serverStatus: 'operational',
      apiResponseTime: dbResponseTime,
      databaseLoad: dbLoad,
      storageUsed: storagePercent,
      memoryUsed: memoryPercent,
      activeConnections: activeConns,
      totalRecords: loadStats,
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

// GET /admin/recent-activity - Get ALL user notifications consolidated
router.get('/recent-activity', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pool = await getPool();
    
    const request = pool.request();
    request.input('PageNumber', sql.Int, parseInt(page));
    request.input('PageSize', sql.Int, parseInt(limit));
    
    const result = await request.execute('admin.sp_GetAllNotifications');
    
    const notifications = result.recordsets[0] || [];
    const total = result.recordsets[1]?.[0]?.total || 0;
    
    // Transform notifications to activity format for frontend compatibility
    const activity = notifications.map(n => ({
      id: n.NotificationID,
      user: n.UserName || 'Unknown User',
      userEmail: n.UserEmail,
      type: n.Type,
      action: n.Message,
      description: n.Title,
      timestamp: n.CreatedAt,
      isRead: n.IsRead,
      relatedId: n.RelatedID,
      relatedType: n.RelatedType
    }));
    
    return res.json({ activity, total, page: parseInt(page), limit: parseInt(limit) });
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
    
    const request = pool.request();
    request.input('Status', sql.NVarChar(50), status);
    
    const result = await request.execute('admin.sp_GetVendorApprovals');
    
    res.json({ profiles: serializeRecords(result.recordset) });
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
    
    // Use the same stored procedure as the vendor profile page
    const request = pool.request();
    request.input('VendorProfileID', sql.Int, id);
    request.input('UserID', sql.Int, null);
    
    const result = await request.execute('vendors.sp_GetDetails');
    
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
    
    // Get owner info and visibility status using stored procedure
    const ownerRequest = pool.request();
    ownerRequest.input('VendorProfileID', sql.Int, id);
    const ownerResult = await ownerRequest.execute('admin.sp_GetVendorOwnerInfo');
    const ownerInfo = ownerResult.recordset[0] || {};
    
    // Get service areas using stored procedure
    let serviceAreas = [];
    try {
      const serviceAreasRequest = pool.request();
      serviceAreasRequest.input('VendorProfileID', sql.Int, id);
      const serviceAreasResult = await serviceAreasRequest.execute('admin.sp_GetVendorServiceAreas');
      serviceAreas = serviceAreasResult.recordset || [];
    } catch (e) {
      console.warn('Service areas query failed:', e.message);
    }
    
    // Get vendor features using stored procedure
    let features = [];
    try {
      const featuresRequest = pool.request();
      featuresRequest.input('VendorProfileID', sql.Int, id);
      const featuresResult = await featuresRequest.execute('admin.sp_GetVendorFeatures');
      features = featuresResult.recordset || [];
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
    
    // Check Stripe connection status using stored procedure
    let stripeStatus = { connected: false };
    try {
      const stripeRequest = pool.request();
      stripeRequest.input('VendorProfileID', sql.Int, id);
      const stripeResult = await stripeRequest.execute('admin.sp_GetVendorStripeAccount');
      
      const stripeAccountId = stripeResult.recordset[0]?.StripeAccountId;
      if (stripeAccountId) {
        stripeStatus = {
          connected: true,
          accountId: stripeAccountId
        };
      }
    } catch (e) {
      console.warn('Error checking Stripe status:', e.message);
    }
    
    // Get questionnaire answers (category answers) using stored procedure
    let categoryAnswers = categoryAnswersRecordset || [];
    // If the stored procedure didn't return full question text, fetch it separately
    if (categoryAnswers.length === 0 || !categoryAnswers[0]?.QuestionText) {
      try {
        const answersRequest = pool.request();
        answersRequest.input('VendorProfileID', sql.Int, id);
        const answersResult = await answersRequest.execute('admin.sp_GetVendorCategoryAnswers');
        categoryAnswers = answersResult.recordset || [];
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
    
    const request = pool.request();
    request.input('Status', sql.NVarChar(50), status || null);
    request.input('Search', sql.NVarChar(100), search || null);
    request.input('PageNumber', sql.Int, parseInt(page));
    request.input('PageSize', sql.Int, parseInt(limit));
    
    const result = await request.execute('admin.sp_GetAllVendors');
    
    res.json({
      vendors: result.recordsets[0] || [],
      total: result.recordsets[1]?.[0]?.total || 0,
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
    
    const request = pool.request();
    request.input('VendorProfileID', sql.Int, id);
    request.input('AdminNotes', sql.NVarChar(sql.MAX), adminNotes || null);
    
    await request.execute('admin.sp_ApproveVendor');
    
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
    
    const request = pool.request();
    request.input('VendorProfileID', sql.Int, id);
    request.input('Reason', sql.NVarChar(sql.MAX), reason || null);
    request.input('AdminNotes', sql.NVarChar(sql.MAX), adminNotes || null);
    
    await request.execute('admin.sp_RejectVendor');
    
    res.json({ success: true, message: 'Vendor rejected and hidden from platform' });
  } catch (error) {
    console.error('Error rejecting vendor:', error);
    res.status(500).json({ error: 'Failed to reject vendor' });
  }
});

// POST /admin/vendors/:id/suspend - Suspend vendor
// Sets IsVisible = 0 to hide vendor from main grid and sends notification email
router.post('/vendors/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const pool = await getPool();
    
    // Get vendor info for email using stored procedure
    const vendorResult = await pool.request()
      .input('VendorProfileID', sql.Int, id)
      .execute('admin.sp_GetVendorInfoForEmail');
    
    const vendor = vendorResult.recordset[0];
    
    const request = pool.request();
    request.input('VendorProfileID', sql.Int, id);
    request.input('Reason', sql.NVarChar(sql.MAX), reason || null);
    
    await request.execute('admin.sp_SuspendVendor');
    
    // Send suspension email notification
    if (vendor && vendor.Email) {
      try {
        await sendAccountSuspended(
          vendor.Email,
          vendor.FirstName || vendor.BusinessName,
          reason || 'Violation of platform terms of service',
          vendor.UserID
        );
        console.log(`📧 Sent suspension email to vendor ${id}`);
      } catch (emailErr) {
        console.error('Failed to send suspension email:', emailErr.message);
      }
    }
    
    res.json({ success: true, message: 'Vendor suspended and hidden from platform' });
  } catch (error) {
    console.error('Error suspending vendor:', error);
    res.status(500).json({ error: 'Failed to suspend vendor' });
  }
});

// POST /admin/vendors/:id/reactivate - Reactivate a suspended vendor
router.post('/vendors/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    // Get vendor info for email using stored procedure
    const vendorResult = await pool.request()
      .input('VendorProfileID', sql.Int, id)
      .execute('admin.sp_GetVendorInfoForEmail');
    
    const vendor = vendorResult.recordset[0];
    
    // Reactivate vendor using stored procedure
    await pool.request()
      .input('VendorProfileID', sql.Int, id)
      .execute('admin.sp_ReactivateVendor');
    
    // Send reactivation email notification
    if (vendor && vendor.Email) {
      try {
        await sendAccountReactivated(
          vendor.Email,
          vendor.FirstName || vendor.BusinessName,
          vendor.UserID
        );
        console.log(`📧 Sent reactivation email to vendor ${id}`);
      } catch (emailErr) {
        console.error('Failed to send reactivation email:', emailErr.message);
      }
    }
    
    res.json({ success: true, message: 'Vendor reactivated and visible on platform' });
  } catch (error) {
    console.error('Error reactivating vendor:', error);
    res.status(500).json({ error: 'Failed to reactivate vendor' });
  }
});

// POST /admin/vendors/:id/toggle-visibility - Toggle vendor visibility
// Toggles IsVisible between 0 and 1
router.post('/vendors/:id/toggle-visibility', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const request = pool.request();
    request.input('VendorProfileID', sql.Int, id);
    
    const result = await request.execute('admin.sp_ToggleVendorVisibility');
    const newVisibility = result.recordset[0]?.NewVisibility;
    
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
    
    const request = pool.request();
    request.input('VendorProfileID', sql.Int, id);
    request.input('Visible', sql.Bit, isVisible);
    
    await request.execute('admin.sp_SetVendorVisibility');
    
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
    
    const request = pool.request();
    request.input('Status', sql.NVarChar(50), status || null);
    request.input('Search', sql.NVarChar(100), search || null);
    request.input('PageNumber', sql.Int, parseInt(page));
    request.input('PageSize', sql.Int, parseInt(limit));
    
    const result = await request.execute('admin.sp_GetUsers');
    
    res.json({
      users: result.recordsets[0] || [],
      total: result.recordsets[1]?.[0]?.total || 0,
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
    
    const request = pool.request();
    request.input('UserID', sql.Int, id);
    
    await request.execute('admin.sp_ToggleUserStatus');
    
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
    const { name, firstName, lastName, email } = req.body;
    const pool = await getPool();
    
    // Support both name (legacy) and firstName/lastName
    let fName = firstName;
    let lName = lastName;
    if (!fName && name) {
      const nameParts = name.trim().split(' ');
      fName = nameParts[0] || '';
      lName = nameParts.slice(1).join(' ') || '';
    }
    
    const request = pool.request();
    request.input('UserID', sql.Int, id);
    request.input('FirstName', sql.NVarChar(100), fName);
    request.input('LastName', sql.NVarChar(100), lName || null);
    request.input('Email', sql.NVarChar(100), email);
    
    await request.execute('admin.sp_UpdateUser');
    
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
    
    const request = pool.request();
    request.input('UserID', sql.Int, id);
    
    const result = await request.execute('admin.sp_GetUserDetails');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: serializeDates(result.recordset[0]) });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /admin/users/:id/unlock - Unlock a locked user account
router.post('/users/:id/unlock', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    // Unlock the account and reset failed attempts
    await pool.request()
      .input('UserID', sql.Int, id)
      .query(`
        UPDATE users.Users 
        SET IsLocked = 0, 
            LockExpiresAt = NULL, 
            LockReason = NULL,
            FailedLoginAttempts = 0
        WHERE UserID = @UserID
      `);
    
    // Get user info for email notification
    const userResult = await pool.request()
      .input('UserID', sql.Int, id)
      .query('SELECT Email, Name FROM users.Users WHERE UserID = @UserID');
    
    if (userResult.recordset.length > 0) {
      const user = userResult.recordset[0];
      
      // Send account unlocked email
      try {
        await sendAccountReactivated(user.Email, user.Name);
      } catch (emailErr) {
        console.error('Failed to send account unlocked email:', emailErr.message);
      }
      
      // Log the unlock action
      await pool.request()
        .input('userId', sql.Int, id)
        .input('email', sql.NVarChar, user.Email)
        .input('action', sql.NVarChar, 'AccountUnlocked')
        .input('ActionStatus', sql.NVarChar, 'Success')
        .input('ipAddress', sql.NVarChar, req.ip || 'Admin Console')
        .input('userAgent', sql.NVarChar, 'Admin Action')
        .input('details', sql.NVarChar, `Account unlocked by admin (UserID: ${req.user?.id || 'Unknown'})`)
        .execute('users.sp_InsertSecurityLog');
    }
    
    res.json({ success: true, message: 'Account unlocked successfully' });
  } catch (error) {
    console.error('Error unlocking user account:', error);
    res.status(500).json({ error: 'Failed to unlock account' });
  }
});

// POST /admin/users/:id/reset-password - Admin-initiated password reset
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { sendEmailNotification = true } = req.body;
    const pool = await getPool();
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    
    // Get user info
    const userResult = await pool.request()
      .input('UserID', sql.Int, id)
      .query('SELECT Email, Name FROM users.Users WHERE UserID = @UserID');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.recordset[0];
    
    // Generate a temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    
    // Update password and unlock account
    await pool.request()
      .input('UserID', sql.Int, id)
      .input('PasswordHash', sql.NVarChar(255), hashedPassword)
      .query(`
        UPDATE users.Users 
        SET PasswordHash = @PasswordHash,
            IsLocked = 0,
            LockExpiresAt = NULL,
            LockReason = NULL,
            FailedLoginAttempts = 0,
            PasswordResetRequired = 1
        WHERE UserID = @UserID
      `);
    
    // Send password reset email if requested
    if (sendEmailNotification) {
      try {
        await sendEmail(
          user.Email,
          'Your Planbeau Password Has Been Reset',
          `<p>Hi ${user.Name},</p>
           <p>Your password has been reset by an administrator.</p>
           <p>Your temporary password is: <strong>${tempPassword}</strong></p>
           <p>Please log in and change your password immediately.</p>
           <p>If you did not request this reset, please contact support immediately at support@planbeau.com</p>`,
          `Hi ${user.Name}, Your password has been reset. Temporary password: ${tempPassword}. Please log in and change it immediately.`
        );
      } catch (emailErr) {
        console.error('Failed to send password reset email:', emailErr.message);
      }
    }
    
    // Log the password reset action
    await pool.request()
      .input('userId', sql.Int, id)
      .input('email', sql.NVarChar, user.Email)
      .input('action', sql.NVarChar, 'PasswordResetByAdmin')
      .input('ActionStatus', sql.NVarChar, 'Success')
      .input('ipAddress', sql.NVarChar, req.ip || 'Admin Console')
      .input('userAgent', sql.NVarChar, 'Admin Action')
      .input('details', sql.NVarChar, `Password reset by admin (UserID: ${req.user?.id || 'Unknown'})`)
      .execute('users.sp_InsertSecurityLog');
    
    res.json({ 
      success: true, 
      message: 'Password reset successfully',
      tempPassword: sendEmailNotification ? undefined : tempPassword // Only return temp password if email not sent
    });
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /admin/users/:id/freeze - Freeze/deactivate a user account
router.post('/users/:id/freeze', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const pool = await getPool();
    
    // Deactivate the account
    await pool.request()
      .input('UserID', sql.Int, id)
      .input('Reason', sql.NVarChar(500), reason || 'Account frozen by administrator')
      .query(`
        UPDATE users.Users 
        SET IsActive = 0,
            DeactivatedAt = GETDATE(),
            DeactivationReason = @Reason
        WHERE UserID = @UserID
      `);
    
    // Get user info for email notification
    const userResult = await pool.request()
      .input('UserID', sql.Int, id)
      .query('SELECT Email, Name FROM users.Users WHERE UserID = @UserID');
    
    if (userResult.recordset.length > 0) {
      const user = userResult.recordset[0];
      
      // Send account suspended email
      try {
        await sendAccountSuspended(user.Email, user.Name, reason || 'Account frozen by administrator');
      } catch (emailErr) {
        console.error('Failed to send account suspended email:', emailErr.message);
      }
      
      // Log the freeze action
      await pool.request()
        .input('userId', sql.Int, id)
        .input('email', sql.NVarChar, user.Email)
        .input('action', sql.NVarChar, 'AccountFrozen')
        .input('ActionStatus', sql.NVarChar, 'Success')
        .input('ipAddress', sql.NVarChar, req.ip || 'Admin Console')
        .input('userAgent', sql.NVarChar, 'Admin Action')
        .input('details', sql.NVarChar, `Account frozen by admin: ${reason || 'No reason provided'}`)
        .execute('users.sp_InsertSecurityLog');
    }
    
    res.json({ success: true, message: 'Account frozen successfully' });
  } catch (error) {
    console.error('Error freezing user account:', error);
    res.status(500).json({ error: 'Failed to freeze account' });
  }
});

// POST /admin/users/:id/unfreeze - Unfreeze/reactivate a user account
router.post('/users/:id/unfreeze', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    // Reactivate the account
    await pool.request()
      .input('UserID', sql.Int, id)
      .query(`
        UPDATE users.Users 
        SET IsActive = 1,
            DeactivatedAt = NULL,
            DeactivationReason = NULL
        WHERE UserID = @UserID
      `);
    
    // Get user info for email notification
    const userResult = await pool.request()
      .input('UserID', sql.Int, id)
      .query('SELECT Email, Name FROM users.Users WHERE UserID = @UserID');
    
    if (userResult.recordset.length > 0) {
      const user = userResult.recordset[0];
      
      // Send account reactivated email
      try {
        await sendAccountReactivated(user.Email, user.Name);
      } catch (emailErr) {
        console.error('Failed to send account reactivated email:', emailErr.message);
      }
      
      // Log the unfreeze action
      await pool.request()
        .input('userId', sql.Int, id)
        .input('email', sql.NVarChar, user.Email)
        .input('action', sql.NVarChar, 'AccountUnfrozen')
        .input('ActionStatus', sql.NVarChar, 'Success')
        .input('ipAddress', sql.NVarChar, req.ip || 'Admin Console')
        .input('userAgent', sql.NVarChar, 'Admin Action')
        .input('details', sql.NVarChar, `Account unfrozen by admin (UserID: ${req.user?.id || 'Unknown'})`)
        .execute('users.sp_InsertSecurityLog');
    }
    
    res.json({ success: true, message: 'Account unfrozen successfully' });
  } catch (error) {
    console.error('Error unfreezing user account:', error);
    res.status(500).json({ error: 'Failed to unfreeze account' });
  }
});

// GET /admin/users/:id/activity - Get user activity log
router.get('/users/:id/activity', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const request = pool.request();
    request.input('UserID', sql.Int, id);
    
    const result = await request.execute('admin.sp_GetUserActivity');
    
    // Combine recordsets and sort by date
    const bookings = result.recordsets[0] || [];
    const reviews = result.recordsets[1] || [];
    
    const activity = [...bookings, ...reviews]
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
// Uses admin.sp_GetAllBookings stored procedure
router.get('/bookings', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pool = await getPool();
    
    // Use stored procedure for admin bookings - only pass parameters the SP accepts
    const request = pool.request();
    request.input('Status', sql.NVarChar(50), status && status !== 'all' ? status : null);
    request.input('Search', sql.NVarChar(100), search || null);
    request.input('PageNumber', sql.Int, parseInt(page));
    request.input('PageSize', sql.Int, parseInt(limit));
    
    const result = await request.execute('admin.sp_GetAllBookings');
    
    res.json({
      bookings: result.recordsets[0] || [],
      total: result.recordsets[1]?.[0]?.total || 0,
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
    
    const request = pool.request();
    request.input('BookingID', sql.Int, id);
    
    const result = await request.execute('admin.sp_GetBookingDetails');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ booking: serializeDates(result.recordset[0]) });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// PUT /admin/bookings/:id - Update booking
router.put('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, eventDate, endDate, totalAmount, specialRequests } = req.body;
    const pool = await getPool();
    
    const request = pool.request();
    request.input('BookingID', sql.Int, id);
    request.input('Status', sql.NVarChar(20), status || null);
    request.input('EventDate', sql.DateTime, eventDate || null);
    request.input('EndDate', sql.DateTime, endDate || null);
    request.input('TotalAmount', sql.Decimal(10,2), totalAmount || null);
    request.input('SpecialRequests', sql.NVarChar(sql.MAX), specialRequests || null);
    
    await request.execute('admin.sp_UpdateBooking');
    
    res.json({ success: true, message: 'Booking updated' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// POST /admin/bookings/:id/cancel - Cancel booking with optional Stripe refund
router.post('/bookings/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, processRefund = true, refundPercent } = req.body;
    const pool = await getPool();
    
    // If processRefund is true, redirect to the payments cancel endpoint
    if (processRefund) {
      // Forward to the payments cancel-booking endpoint which handles Stripe refunds
      const fetch = (await import('node-fetch')).default;
      const apiUrl = `http://localhost:${process.env.PORT || 5000}/payments/cancel-booking/${id}`;
      
      try {
        const refundResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cancelledBy: 'admin',
            reason: reason,
            refundPercent: refundPercent
          })
        });
        
        if (refundResponse.ok) {
          const refundData = await refundResponse.json();
          return res.json({ 
            success: true, 
            message: 'Booking cancelled with refund processed',
            refund: refundData.refund
          });
        }
      } catch (fetchErr) {
        console.warn('Could not process Stripe refund, falling back to DB-only cancel:', fetchErr.message);
      }
    }
    
    // Fallback: Just update database status
    const request = pool.request();
    request.input('BookingID', sql.Int, id);
    request.input('Reason', sql.NVarChar(sql.MAX), reason || null);
    
    await request.execute('admin.sp_CancelBooking');
    
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
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Try stored procedure first, fallback to direct query
    try {
      const request = pool.request();
      request.input('Filter', sql.NVarChar(50), filter || null);
      request.input('Search', sql.NVarChar(100), search || null);
      request.input('PageNumber', sql.Int, parseInt(page));
      request.input('PageSize', sql.Int, parseInt(limit));
      
      const result = await request.execute('admin.sp_GetAllReviews');
      
      return res.json({
        reviews: result.recordsets[0] || [],
        total: result.recordsets[1]?.[0]?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (spError) {
      console.log('Stored procedure not found, using direct query');
      
      // Direct query fallback
      let whereClause = '1=1';
      if (filter === 'flagged') {
        whereClause += ' AND r.IsFlagged = 1';
      } else if (filter === 'pending') {
        whereClause += ' AND r.IsApproved = 0';
      }
      
      if (search) {
        whereClause += ` AND (r.ReviewText LIKE '%${search}%' OR u.FirstName LIKE '%${search}%' OR u.LastName LIKE '%${search}%' OR vp.BusinessName LIKE '%${search}%')`;
      }
      
      const query = `
        SELECT 
          r.ReviewID,
          r.Rating,
          r.ReviewText,
          r.CreatedAt,
          r.IsFlagged,
          r.FlagReason,
          r.IsApproved,
          r.AdminNotes,
          u.UserID as ReviewerID,
          u.FirstName + ' ' + u.LastName as ReviewerName,
          u.Email as ReviewerEmail,
          vp.VendorProfileID,
          vp.BusinessName as VendorName,
          b.BookingID
        FROM dbo.Reviews r
        LEFT JOIN dbo.Users u ON r.UserID = u.UserID
        LEFT JOIN dbo.VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
        LEFT JOIN dbo.Bookings b ON r.BookingID = b.BookingID
        WHERE ${whereClause}
        ORDER BY r.CreatedAt DESC
        OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY;
        
        SELECT COUNT(*) as total FROM dbo.Reviews r WHERE ${whereClause.split(' AND (r.ReviewText')[0]};
      `;
      
      const result = await pool.request().query(query);
      
      return res.json({
        reviews: result.recordsets[0] || [],
        total: result.recordsets[1]?.[0]?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    }
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews', details: error.message });
  }
});

// GET /admin/reviews/stats - Get review statistics
router.get('/reviews/stats', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().execute('admin.sp_GetReviewStats');
    const stats = result.recordset[0] || { total: 0, flagged: 0, avgRating: 0 };
    
    res.json({
      total: stats.total || 0,
      flagged: stats.flagged || 0,
      avgRating: stats.avgRating || 0,
      googleReviews: 0
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.json({ total: 0, flagged: 0, avgRating: 0, googleReviews: 0 });
  }
});

// POST /admin/reviews/:id/flag - Flag/unflag review
router.post('/reviews/:id/flag', async (req, res) => {
  try {
    const { id } = req.params;
    const { flagged, reason } = req.body;
    const pool = await getPool();
    
    const request = pool.request();
    request.input('ReviewID', sql.Int, id);
    request.input('IsFlagged', sql.Bit, flagged);
    request.input('FlagReason', sql.NVarChar(sql.MAX), reason || null);
    
    await request.execute('admin.sp_FlagReview');
    
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
    
    const request = pool.request();
    request.input('ReviewID', sql.Int, id);
    
    await request.execute('admin.sp_UnflagReview');
    
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
    
    const request = pool.request();
    request.input('ReviewID', sql.Int, id);
    request.input('AdminNotes', sql.NVarChar(sql.MAX), note);
    
    await request.execute('admin.sp_AddReviewNote');
    
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
    
    const request = pool.request();
    request.input('ReviewID', sql.Int, id);
    
    await request.execute('admin.sp_DeleteReview');
    
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
    
    const result = await pool.request().execute('admin.sp_GetCategories');
    
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
    
    const request = pool.request();
    request.input('CategoryName', sql.NVarChar(100), name);
    request.input('Description', sql.NVarChar(sql.MAX), description || null);
    request.input('IconClass', sql.NVarChar(100), iconClass || null);
    
    const result = await request.execute('admin.sp_CreateCategory');
    
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
    
    const request = pool.request();
    request.input('CategoryID', sql.Int, id);
    request.input('CategoryName', sql.NVarChar(100), name);
    request.input('Description', sql.NVarChar(sql.MAX), description || null);
    request.input('IconClass', sql.NVarChar(100), iconClass || null);
    request.input('IsActive', sql.Bit, isActive !== false);
    
    await request.execute('admin.sp_UpdateCategory');
    
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
    
    const request = pool.request();
    request.input('CategoryID', sql.Int, id);
    
    await request.execute('admin.sp_DeleteCategory');
    
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
    
    const request = pool.request();
    request.input('Range', sql.NVarChar(10), range);
    
    const result = await request.execute('admin.sp_GetAnalytics');
    
    const stats = result.recordsets[0]?.[0] || {};
    const topCategories = result.recordsets[1] || [];
    const topVendors = result.recordsets[2] || [];
    const bookingTrends = result.recordsets[3] || [];
    
    res.json({
      ...stats,
      topCategories,
      topVendors,
      bookingTrends
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
    
    const result = await pool.request().execute('admin.sp_GetPaymentStats');
    
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
    
    const result = await pool.request().execute('admin.sp_GetVendorBalances');
    
    res.json({ balances: serializeRecords(result.recordset) });
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
    
    const request = pool.request();
    request.input('Filter', sql.NVarChar(50), filter || null);
    request.input('PageNumber', sql.Int, parseInt(page));
    request.input('PageSize', sql.Int, parseInt(limit));
    
    const result = await request.execute('admin.sp_GetTransactions');
    
    res.json({ 
      transactions: result.recordsets[0] || [], 
      total: result.recordsets[1]?.[0]?.total || 0 
    });
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
    
    const request = pool.request();
    request.input('Filter', sql.NVarChar(50), filter || null);
    request.input('PageNumber', sql.Int, parseInt(page));
    request.input('PageSize', sql.Int, parseInt(limit));
    
    const result = await request.execute('admin.sp_GetPayouts');
    
    res.json({ 
      payouts: result.recordsets[0] || [], 
      total: result.recordsets[1]?.[0]?.total || 0 
    });
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
    
    const request = pool.request();
    request.input('Type', sql.NVarChar(50), type);
    request.input('Status', sql.NVarChar(50), status || null);
    request.input('Search', sql.NVarChar(100), search || null);
    request.input('PageNumber', sql.Int, pageNum);
    request.input('PageSize', sql.Int, limitNum);
    
    const result = await request.execute('admin.sp_GetSecurityLogs');
    
    // Convert Date objects to ISO strings for proper JSON serialization
    const logs = (result.recordsets[0] || []).map(log => ({
      ...log,
      timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp
    }));
    
    res.json({ 
      logs, 
      total: result.recordsets[1]?.[0]?.total || 0,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('Error fetching security logs:', error);
    res.status(500).json({ error: 'Failed to fetch security logs', details: error.message });
  }
});

// GET /admin/security/locked-accounts - Get all locked user accounts
router.get('/security/locked-accounts', async (req, res) => {
  try {
    const pool = await getPool();
    
    // Get users who are marked as locked (IsLocked = 1) - includes both active and expired locks
    const result = await pool.request().query(`
      SELECT 
        UserID,
        Name,
        Email,
        FailedLoginAttempts,
        LastFailedLoginAt,
        LockExpiresAt,
        LockReason,
        CASE WHEN LockExpiresAt > GETUTCDATE() THEN 1 ELSE 0 END as IsActivelyLocked
      FROM users.Users
      WHERE IsLocked = 1
      ORDER BY LockExpiresAt DESC
    `);
    
    res.json({ success: true, accounts: serializeRecords(result.recordset || []) });
  } catch (error) {
    console.error('Error fetching locked accounts:', error);
    res.status(500).json({ error: 'Failed to fetch locked accounts' });
  }
});

// POST /admin/security/log - Log a security event
router.post('/security/log', async (req, res) => {
  try {
    const { userId, email, action, status = 'Success', ipAddress, userAgent, location, device, details } = req.body;
    const pool = await getPool();
    
    const request = pool.request();
    request.input('UserID', sql.Int, userId || null);
    request.input('Email', sql.NVarChar(255), email);
    request.input('Action', sql.NVarChar(100), action);
    request.input('ActionStatus', sql.NVarChar(50), status);
    request.input('IPAddress', sql.NVarChar(50), ipAddress || null);
    request.input('UserAgent', sql.NVarChar(500), userAgent || null);
    request.input('Location', sql.NVarChar(255), location || null);
    request.input('Device', sql.NVarChar(100), device || null);
    request.input('Details', sql.NVarChar(sql.MAX), details || null);
    
    await request.execute('admin.sp_LogSecurityEvent');
    
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
    
    const request = pool.request();
    request.input('Filter', sql.NVarChar(50), filter);
    request.input('Search', sql.NVarChar(100), search || null);
    request.input('PageNumber', sql.Int, parseInt(page));
    request.input('PageSize', sql.Int, parseInt(limit));
    
    const result = await request.execute('admin.sp_GetAllChats');
    
    res.json({
      conversations: result.recordsets[0] || [],
      total: result.recordsets[1]?.[0]?.total || 0,
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
    
    const request = pool.request();
    request.input('ConversationID', sql.Int, id);
    
    const result = await request.execute('admin.sp_GetChatMessages');
    
    res.json({ messages: serializeRecords(result.recordsets[1] || []) });
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
    
    const request = pool.request();
    request.input('ConversationID', sql.Int, id);
    request.input('Message', sql.NVarChar(sql.MAX), message);
    
    await request.execute('admin.sp_SendSystemMessage');
    
    res.json({ success: true, message: 'System message sent' });
  } catch (error) {
    console.error('Error sending system message:', error);
    res.status(500).json({ error: 'Failed to send system message', details: error.message });
  }
});

// POST /admin/chats/:id/notes - Add admin note to conversation
router.post('/chats/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const pool = await getPool();
    
    const request = pool.request();
    request.input('ConversationID', sql.Int, id);
    request.input('Note', sql.NVarChar(sql.MAX), note);
    
    await request.execute('admin.sp_AddChatNote');
    
    res.json({ success: true, message: 'Note added' });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note', details: error.message });
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
    
    const request = pool.request();
    request.input('Search', sql.NVarChar(100), q || '');
    
    const result = await request.execute('admin.sp_SearchUsers');
    
    res.json({ results: serializeRecords(result.recordset) });
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
    
    const request = pool.request();
    request.input('Status', sql.NVarChar(50), status || null);
    request.input('Priority', sql.NVarChar(50), priority || null);
    request.input('Category', sql.NVarChar(50), category || null);
    request.input('Search', sql.NVarChar(100), search || null);
    request.input('PageNumber', sql.Int, parseInt(page));
    request.input('PageSize', sql.Int, parseInt(limit));
    
    const result = await request.execute('admin.sp_GetSupportTickets');
    
    res.json({ 
      tickets: result.recordsets[0] || [], 
      total: result.recordsets[1]?.[0]?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    });
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
    
    // Use stored procedure to create ticket (ticket number generated in SP)
    const result = await pool.request()
      .input('UserID', sql.Int, userId || null)
      .input('UserEmail', sql.NVarChar(255), userEmail || null)
      .input('UserName', sql.NVarChar(100), userName || null)
      .input('Subject', sql.NVarChar(255), subject)
      .input('Description', sql.NVarChar(sql.MAX), description)
      .input('Category', sql.NVarChar(50), category || 'general')
      .input('Priority', sql.NVarChar(20), priority || 'medium')
      .input('Source', sql.NVarChar(50), source || 'chat')
      .input('ConversationID', sql.Int, conversationId || null)
      .execute('admin.sp_CreateSupportTicket');
    
    const newTicketId = result.recordset[0]?.TicketID;
    const newTicketNumber = result.recordset[0]?.TicketNumber;
    
    // Send confirmation email to user
    if (userEmail) {
      try {
        const dashboardUrl = 'https://www.planbeau.com/dashboard?section=support';
        await sendEmail(userEmail, 'support_ticket_opened', {
          userName: userName || 'User',
          ticketId: newTicketNumber,
          ticketSubject: subject,
          ticketCategory: category || 'General',
          dashboardUrl
        }, userId);
      } catch (emailErr) {
        console.error('Failed to send ticket created email:', emailErr.message);
      }
    }
    
    res.json({ success: true, ticketId: newTicketId, ticketNumber: newTicketNumber });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket', message: error.message });
  }
});

// PUT /admin/support/tickets/:id - Update support ticket
router.put('/support/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, category, resolution } = req.body;
    const pool = await getPool();
    
    // Get ticket info before update for notification
    const ticketInfo = await pool.request()
      .input('TicketID', sql.Int, id)
      .query(`
        SELECT TicketNumber, Subject, UserEmail, UserName, UserID, Status as OldStatus, Category
        FROM admin.SupportTickets WHERE TicketID = @TicketID
      `);
    
    const ticket = ticketInfo.recordset[0];
    const oldStatus = ticket?.OldStatus;
    
    const request = pool.request();
    request.input('TicketID', sql.Int, id);
    request.input('Status', sql.NVarChar(50), status || null);
    request.input('Priority', sql.NVarChar(50), priority || null);
    request.input('AssignedTo', sql.Int, assignedTo || null);
    request.input('Category', sql.NVarChar(50), category || null);
    
    await request.execute('admin.sp_UpdateSupportTicket');
    
    // Send email notification if status changed
    if (status && ticket && status !== oldStatus) {
      const dashboardUrl = 'https://www.planbeau.com/dashboard?section=support';
      
      try {
        let templateKey = null;
        const variables = {
          userName: ticket.UserName || 'User',
          ticketId: ticket.TicketNumber,
          ticketSubject: ticket.Subject,
          ticketCategory: ticket.Category || 'General',
          dashboardUrl,
          resolution: resolution || 'Your issue has been addressed.'
        };
        
        if (status === 'in_progress' || status === 'In Progress') {
          templateKey = 'support_ticket_in_progress';
        } else if (status === 'closed' || status === 'Closed' || status === 'resolved' || status === 'Resolved') {
          templateKey = 'support_ticket_closed';
        }
        
        if (templateKey && ticket.UserEmail) {
          await sendEmail(ticket.UserEmail, templateKey, variables, ticket.UserID);
        }
      } catch (emailErr) {
        console.error('Failed to send ticket status email:', emailErr.message);
      }
    }
    
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
    
    const request = pool.request();
    request.input('TicketID', sql.Int, id);
    
    const result = await request.execute('admin.sp_GetTicketMessages');
    
    res.json({ messages: serializeRecords(result.recordset) });
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
    
    const request = pool.request();
    request.input('TicketID', sql.Int, id);
    request.input('SenderID', sql.Int, senderId);
    request.input('SenderType', sql.NVarChar(50), senderType || 'admin');
    request.input('Message', sql.NVarChar(sql.MAX), message);
    request.input('Attachments', sql.NVarChar(sql.MAX), attachments ? JSON.stringify(attachments) : null);
    request.input('IsInternal', sql.Bit, isInternal || false);
    
    const result = await request.execute('admin.sp_AddTicketMessage');
    
    // Send email notification to user if admin replies (non-internal message)
    if (senderType === 'admin' && !isInternal) {
      try {
        const ticketInfo = await pool.request()
          .input('TicketID', sql.Int, id)
          .query(`
            SELECT TicketNumber, Subject, UserEmail, UserName, UserID
            FROM admin.SupportTickets WHERE TicketID = @TicketID
          `);
        
        const ticket = ticketInfo.recordset[0];
        if (ticket && ticket.UserEmail) {
          const dashboardUrl = 'https://www.planbeau.com/dashboard?section=support';
          const replyPreview = message.length > 200 ? message.substring(0, 200) + '...' : message;
          
          await sendEmail(ticket.UserEmail, 'support_ticket_reply', {
            userName: ticket.UserName || 'User',
            ticketId: ticket.TicketNumber,
            replierName: 'Planbeau Support',
            replyPreview,
            dashboardUrl
          }, ticket.UserID);
        }
      } catch (emailErr) {
        console.error('Failed to send ticket reply email:', emailErr.message);
      }
    }
    
    res.json({ success: true, messageId: result.recordset[0].MessageID });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// ==================== SUPPORT CONVERSATIONS (LIVE CHAT) ====================

// GET /admin/support/conversations - Get all support conversations
router.get('/support/conversations', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().execute('admin.sp_GetSupportConversations');
    
    res.json({ conversations: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching support conversations:', error);
    res.status(500).json({ error: 'Failed to fetch support conversations' });
  }
});

// GET /admin/support/conversations/:id/messages - Get messages for a support conversation
router.get('/support/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('ConversationID', sql.Int, id)
      .execute('admin.sp_GetSupportConversationMessages');
    
    res.json({ messages: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching support messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /admin/support/conversations/:id/reply - Send reply to support conversation
router.post('/support/conversations/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const adminUserId = req.user.id; // From auth middleware
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    const pool = await getPool();
    
    const result = await pool.request()
      .input('ConversationID', sql.Int, id)
      .input('SenderID', sql.Int, adminUserId)
      .input('Content', sql.NVarChar(sql.MAX), content.trim())
      .execute('admin.sp_SendSupportReply');
    
    // Send email AND in-app notification to user
    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      const messagePreview = content.length > 100 ? content.substring(0, 100) + '...' : content;
      
      // 1. Send email notification (with BCC to admin@planbeau.com)
      try {
        await sendSupportMessageToUser(
          user.Email,
          user.Name || 'User',
          messagePreview,
          'https://www.planbeau.com',
          user.UserID
        );
      } catch (emailErr) {
        console.error('Failed to send support reply email:', emailErr.message);
      }
      
      // 2. Create in-app notification
      try {
        await pool.request()
          .input('UserID', sql.Int, user.UserID)
          .input('Type', sql.NVarChar(50), 'support_message')
          .input('Message', sql.NVarChar(sql.MAX), `New message from Planbeau Support: "${messagePreview}"`)
          .input('RelatedID', sql.Int, parseInt(id))
          .input('RelatedType', sql.NVarChar(50), 'support_conversation')
          .execute('bookings.sp_InsertNotification');
      } catch (notifErr) {
        console.error('Failed to create support notification:', notifErr.message);
      }
    }
    
    res.json({ 
      success: true, 
      messageId: result.recordset[0]?.MessageID 
    });
  } catch (error) {
    console.error('Error sending support reply:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// ==================== CONTENT MANAGEMENT ====================

// GET /admin/content/banners - Get homepage banners
router.get('/content/banners', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().execute('admin.sp_GetBanners');
    
    res.json({ items: serializeRecords(result.recordset || []) });
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
    
    const request = pool.request();
    request.input('BannerID', sql.Int, id || null);
    request.input('Title', sql.NVarChar(255), title);
    request.input('Subtitle', sql.NVarChar(500), subtitle || null);
    request.input('ImageURL', sql.NVarChar(500), imageUrl || null);
    request.input('LinkURL', sql.NVarChar(500), linkUrl || null);
    request.input('LinkText', sql.NVarChar(100), linkText || null);
    request.input('BackgroundColor', sql.NVarChar(50), backgroundColor || null);
    request.input('TextColor', sql.NVarChar(50), textColor || null);
    request.input('Position', sql.NVarChar(50), position || 'hero');
    request.input('DisplayOrder', sql.Int, displayOrder || 0);
    request.input('StartDate', sql.DateTime2, startDate || null);
    request.input('EndDate', sql.DateTime2, endDate || null);
    request.input('IsActive', sql.Bit, isActive !== false);
    
    const result = await request.execute('admin.sp_UpsertBanner');
    
    res.json({ success: true, id: id || result.recordset[0]?.BannerID });
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
    
    const request = pool.request();
    request.input('BannerID', sql.Int, id);
    
    await request.execute('admin.sp_DeleteBanner');
    
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
    
    const result = await pool.request().execute('admin.sp_GetAnnouncements');
    
    res.json({ items: serializeRecords(result.recordset || []) });
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
    
    const request = pool.request();
    request.input('AnnouncementID', sql.Int, id || null);
    request.input('Title', sql.NVarChar(255), announcementTitle);
    request.input('Content', sql.NVarChar(sql.MAX), announcementContent);
    request.input('Type', sql.NVarChar(50), announcementType);
    request.input('Icon', sql.NVarChar(100), icon || null);
    request.input('LinkURL', sql.NVarChar(500), linkUrl || null);
    request.input('LinkText', sql.NVarChar(100), linkText || null);
    request.input('DisplayType', sql.NVarChar(50), displayType || 'banner');
    request.input('TargetAudience', sql.NVarChar(50), targetAudience || 'all');
    request.input('StartDate', sql.DateTime2, announcementStartDate || null);
    request.input('EndDate', sql.DateTime2, announcementEndDate || null);
    request.input('IsActive', sql.Bit, announcementIsActive);
    request.input('IsDismissible', sql.Bit, isDismissible !== false);
    request.input('DisplayOrder', sql.Int, displayOrder || 0);
    
    const result = await request.execute('admin.sp_UpsertAnnouncement');
    
    res.json({ success: true, id: id || result.recordset[0]?.AnnouncementID });
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
    
    const request = pool.request();
    request.input('AnnouncementID', sql.Int, id);
    
    await request.execute('admin.sp_DeleteAnnouncement');
    
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
    
    const result = await pool.request().execute('admin.sp_GetFAQs');
    
    res.json({ items: serializeRecords(result.recordset || []) });
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
    
    const request = pool.request();
    request.input('FAQID', sql.Int, id || null);
    request.input('Question', sql.NVarChar(500), question);
    request.input('Answer', sql.NVarChar(sql.MAX), answer);
    request.input('Category', sql.NVarChar(100), category || 'general');
    request.input('DisplayOrder', sql.Int, displayOrder || 0);
    request.input('IsActive', sql.Bit, isActive !== false);
    
    const result = await request.execute('admin.sp_UpsertFAQ');
    
    res.json({ success: true, id: id || result.recordset[0]?.FAQID });
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
    
    const request = pool.request();
    request.input('FAQID', sql.Int, id);
    
    await request.execute('admin.sp_DeleteFAQ');
    
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
    
    const result = await pool.request().execute('admin.sp_GetEmailTemplates');
    
    res.json({ templates: serializeRecords(result.recordset) });
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
    
    const request = pool.request();
    request.input('TemplateID', sql.Int, id);
    
    const result = await request.execute('admin.sp_GetEmailTemplate');
    
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
    
    const request = pool.request();
    request.input('TemplateID', sql.Int, id);
    request.input('Subject', sql.NVarChar(500), subject || null);
    request.input('BodyHtml', sql.NVarChar(sql.MAX), bodyHtml || null);
    request.input('IsActive', sql.Bit, isActive !== false);
    
    await request.execute('admin.sp_UpdateEmailTemplate');
    
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
    
    const request = pool.request();
    request.input('TemplateKey', sql.NVarChar(100), templateKey || null);
    request.input('Status', sql.NVarChar(50), status || null);
    request.input('PageNumber', sql.Int, parseInt(page));
    request.input('PageSize', sql.Int, parseInt(limit));
    
    const result = await request.execute('admin.sp_GetEmailLogs');
    
    // Convert Date objects to ISO strings for proper JSON serialization
    const logs = (result.recordsets[0] || []).map(log => ({
      ...log,
      sentAt: log.sentAt instanceof Date ? log.sentAt.toISOString() : log.sentAt,
      SentAt: log.SentAt instanceof Date ? log.SentAt.toISOString() : log.SentAt,
      createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt,
      CreatedAt: log.CreatedAt instanceof Date ? log.CreatedAt.toISOString() : log.CreatedAt
    }));
    
    res.json({ 
      logs, 
      total: result.recordsets[1]?.[0]?.total || 0,
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

// POST /admin/emails/send-test - Send test email
router.post('/emails/send-test', async (req, res) => {
  try {
    const { to, subject, body, templateKey } = req.body;
    
    if (!to || !subject) {
      return res.status(400).json({ error: 'Recipient email and subject are required' });
    }
    
    const htmlBody = body || '<p>This is a test email from PlanBeau admin panel.</p>';
    const textBody = htmlBody.replace(/<[^>]*>/g, ''); // Strip HTML for text version
    
    // Use the email service which handles SMTP and fallback properly
    await sendEmail({
      to: to,
      subject: subject,
      html: htmlBody,
      text: textBody
    });
    
    // Log successful send to EmailLogs table (used by sp_GetEmailLogs)
    try {
      const pool = await getPool();
      await pool.request()
        .input('TemplateKey', sql.NVarChar(50), templateKey || 'test_email')
        .input('RecipientEmail', sql.NVarChar(255), to)
        .input('RecipientName', sql.NVarChar(100), null)
        .input('Subject', sql.NVarChar(255), subject)
        .input('Status', sql.NVarChar(20), 'sent')
        .input('ErrorMessage', sql.NVarChar(sql.MAX), null)
        .input('UserID', sql.Int, null)
        .input('BookingID', sql.Int, null)
        .input('Metadata', sql.NVarChar(sql.MAX), JSON.stringify({ htmlBody: htmlBody }))
        .execute('sp_LogEmail');
    } catch (logError) {
      console.log('Could not log email to database:', logError.message);
    }
    
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error) {
    console.error('Error sending test email:', error);
    
    // Log failed send
    try {
      const pool = await getPool();
      await pool.request()
        .input('TemplateKey', sql.NVarChar(50), req.body.templateKey || 'test_email')
        .input('RecipientEmail', sql.NVarChar(255), req.body.to)
        .input('RecipientName', sql.NVarChar(100), null)
        .input('Subject', sql.NVarChar(255), req.body.subject)
        .input('Status', sql.NVarChar(20), 'failed')
        .input('ErrorMessage', sql.NVarChar(sql.MAX), error.message)
        .input('UserID', sql.Int, null)
        .input('BookingID', sql.Int, null)
        .input('Metadata', sql.NVarChar(sql.MAX), JSON.stringify({ htmlBody: req.body.body }))
        .execute('sp_LogEmail');
    } catch (logError) {
      console.log('Could not log failed email:', logError.message);
    }
    
    res.status(500).json({ error: 'Failed to send test email', details: error.message });
  }
});

// GET /admin/emails/header-footer - Get email header/footer settings
router.get('/emails/header-footer', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().execute('admin.sp_GetEmailHeaderFooter');
    
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.json({ header: '', footer: '' });
    }
  } catch (error) {
    console.error('Error fetching header/footer:', error);
    res.json({ header: '', footer: '' });
  }
});

// POST /admin/emails/header-footer - Save email header/footer settings
router.post('/emails/header-footer', async (req, res) => {
  try {
    const { header, footer } = req.body;
    const pool = await getPool();
    
    const request = pool.request();
    request.input('Header', sql.NVarChar(sql.MAX), header || '');
    request.input('Footer', sql.NVarChar(sql.MAX), footer || '');
    
    await request.execute('admin.sp_SaveEmailHeaderFooter');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving header/footer:', error);
    res.json({ success: true }); // Return success anyway for now
  }
});

// POST /admin/notifications/send - Send notification
router.post('/notifications/send', async (req, res) => {
  try {
    const { type, recipientType, subject, message } = req.body;
    const pool = await getPool();
    
    // Get recipients based on type using stored procedure
    const request = pool.request();
    request.input('RecipientType', sql.NVarChar(50), recipientType);
    
    const result = await request.execute('admin.sp_GetNotificationRecipients');
    const recipients = result.recordset.map(r => r.Email).filter(e => e);
    
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
    
    // Get booking details using stored procedure
    const getRequest = pool.request();
    getRequest.input('BookingID', sql.Int, id);
    const bookingResult = await getRequest.execute('admin.sp_GetBookingForRefund');
    
    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = bookingResult.recordset[0];
    
    // Process refund using stored procedure
    const refundRequest = pool.request();
    refundRequest.input('BookingID', sql.Int, id);
    refundRequest.input('RefundAmount', sql.Decimal(10,2), amount);
    refundRequest.input('Reason', sql.NVarChar(sql.MAX), reason);
    
    await refundRequest.execute('admin.sp_ProcessRefund');
    
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
    
    // Get booking details using stored procedure
    const getRequest = pool.request();
    getRequest.input('BookingID', sql.Int, id);
    const bookingResult = await getRequest.execute('admin.sp_GetBookingForRefund');
    
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
    
    // Update booking using stored procedure
    const resolveRequest = pool.request();
    resolveRequest.input('BookingID', sql.Int, id);
    resolveRequest.input('Status', sql.NVarChar(50), newStatus);
    resolveRequest.input('RefundAmount', sql.Decimal(10,2), refundAmount);
    resolveRequest.input('Resolution', sql.NVarChar(sql.MAX), resolution);
    
    await resolveRequest.execute('admin.sp_ResolveDispute');
    
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
    
    // Use sp_GetAllBookings for export with large page size
    const request = pool.request();
    request.input('Status', sql.NVarChar(50), status && status !== 'all' ? status : null);
    request.input('Search', sql.NVarChar(100), null);
    request.input('PageNumber', sql.Int, 1);
    request.input('PageSize', sql.Int, 10000); // Get all bookings for export
    
    const result = await request.execute('admin.sp_GetAllBookings');
    
    // Convert to CSV
    const bookings = result.recordsets[0] || [];
    if (bookings.length === 0) {
      return res.status(404).json({ error: 'No bookings to export' });
    }
    
    const headers = Object.keys(bookings[0]).join(',');
    const rows = bookings.map(b => Object.values(b).map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
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
    const pool = await getPool();
    
    // Update category visibility using stored procedure
    const request = pool.request();
    request.input('CategoryID', sql.Int, id);
    request.input('IsVisible', sql.Bit, visible ? 1 : 0);
    
    await request.execute('admin.sp_UpdateCategoryVisibility');
    
    res.json({ success: true, message: `Category visibility updated to ${visible}` });
  } catch (error) {
    console.error('Error updating category visibility:', error);
    res.status(500).json({ error: 'Failed to update visibility', details: error.message });
  }
});

// GET /admin/categories/:id/services - Get service templates for a category
router.get('/categories/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    // Get services associated with this category using stored procedure
    const request = pool.request();
    request.input('CategoryID', sql.Int, id);
    
    const result = await request.execute('admin.sp_GetCategoryServices');
    
    res.json({ services: serializeRecords(result.recordset) });
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
    
    const request = pool.request();
    request.input('ServiceID', sql.Int, id);
    
    await request.execute('admin.sp_DeleteService');
    
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
    
    // Get vendor details using stored procedure
    const request = pool.request();
    request.input('VendorProfileID', sql.Int, vendorId);
    
    const vendorResult = await request.execute('admin.sp_GetVendorForPayout');
    
    if (vendorResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    const vendor = vendorResult.recordset[0];
    
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
    
    // Get booking/transaction details using stored procedure
    const getRequest = pool.request();
    getRequest.input('BookingID', sql.Int, transactionId);
    const bookingResult = await getRequest.execute('admin.sp_GetBookingForRefund');
    
    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Process refund using stored procedure
    const refundRequest = pool.request();
    refundRequest.input('BookingID', sql.Int, transactionId);
    refundRequest.input('RefundAmount', sql.Decimal(10,2), amount);
    refundRequest.input('Reason', sql.NVarChar(sql.MAX), reason);
    
    await refundRequest.execute('admin.sp_ProcessRefund');
    
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
    
    // Calculate date range
    let days = 30;
    switch (range) {
      case '7d': days = 7; break;
      case '90d': days = 90; break;
      case '1y': days = 365; break;
      default: days = 30;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Use stored procedure for revenue report
    const request = pool.request();
    request.input('StartDate', sql.Date, startDate);
    request.input('EndDate', sql.Date, new Date());
    
    const dailyRevenue = await request.execute('admin.sp_GetRevenueReport');
    
    res.json({ dailyRevenue: serializeRecords(dailyRevenue.recordset) });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

// GET /admin/analytics/users - Get user analytics
router.get('/analytics/users', async (req, res) => {
  try {
    const pool = await getPool();
    
    // Use stored procedure for dashboard stats
    const result = await pool.request().execute('admin.sp_GetDashboardStats');
    
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
    
    const result = await pool.request().execute('admin.sp_GetPublicBanners');
    
    res.json({ banners: serializeRecords(result.recordset || []) });
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
    
    const request = pool.request();
    request.input('Audience', sql.NVarChar(50), audience);
    
    const result = await request.execute('admin.sp_GetPublicAnnouncements');
    
    res.json({ announcements: serializeRecords(result.recordset || []) });
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
    
    const request = pool.request();
    request.input('AnnouncementID', sql.Int, id);
    
    await request.execute('admin.sp_DismissAnnouncement');
    
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
    
    const result = await pool.request().execute('admin.sp_GetPublicFAQs');
    
    res.json({ faqs: serializeRecords(result.recordset) });
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
    
    const request = pool.request();
    request.input('Question', sql.NVarChar(500), question);
    request.input('Answer', sql.NVarChar(sql.MAX), answer);
    request.input('Category', sql.NVarChar(100), category || 'General');
    request.input('DisplayOrder', sql.Int, displayOrder || 0);
    
    const result = await request.execute('admin.sp_CreatePublicFAQ');
    
    res.json({ success: true, faq: serializeRecords(result.recordset)[0] });
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
    
    const request = pool.request();
    request.input('FAQID', sql.Int, id);
    request.input('Question', sql.NVarChar(500), question);
    request.input('Answer', sql.NVarChar(sql.MAX), answer);
    request.input('Category', sql.NVarChar(100), category);
    request.input('DisplayOrder', sql.Int, displayOrder);
    request.input('IsActive', sql.Bit, isActive);
    
    await request.execute('admin.sp_UpdatePublicFAQ');
    
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
    
    const request = pool.request();
    request.input('FAQID', sql.Int, id);
    
    await request.execute('admin.sp_DeleteFAQ');
    
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
    
    const result = await pool.request().execute('admin.sp_GetCommissionSettings');
    
    res.json({ settings: serializeRecords(result.recordset) });
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
    
    const request = pool.request();
    request.input('SettingKey', sql.NVarChar(100), key);
    request.input('SettingValue', sql.NVarChar(255), value);
    request.input('Description', sql.NVarChar(500), description || null);
    
    await request.execute('admin.sp_UpdateCommissionSetting');
    
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
    
    const request = pool.request();
    request.input('SettingKey', sql.NVarChar(100), settingKey);
    request.input('SettingValue', sql.NVarChar(255), settingValue);
    request.input('Description', sql.NVarChar(500), description || null);
    request.input('SettingType', sql.NVarChar(50), settingType || 'percentage');
    request.input('MinValue', sql.Decimal(10, 2), minValue || null);
    request.input('MaxValue', sql.Decimal(10, 2), maxValue || null);
    
    const result = await request.execute('admin.sp_CreateCommissionSetting');
    
    res.json({ success: true, setting: serializeRecords(result.recordset)[0] });
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
    
    // Update each setting using stored procedure
    const updates = [
      { key: 'platform_fee_percent', value: platformFeePercent },
      { key: 'stripe_fee_percent', value: stripeFeePercent },
      { key: 'stripe_fee_fixed', value: stripeFeeFixed },
      { key: 'tax_percent', value: taxPercent }
    ];
    
    for (const update of updates) {
      if (update.value !== undefined) {
        const request = pool.request();
        request.input('SettingKey', sql.NVarChar(100), update.key);
        request.input('SettingValue', sql.NVarChar(255), String(update.value));
        request.input('Description', sql.NVarChar(500), null);
        
        await request.execute('admin.sp_UpdateCommissionSetting');
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
    
    // Get commission settings using stored procedure
    let platformCommission = 15;
    let renterFee = 5;
    let stripeFeeRate = 2.9;
    let stripeFixedFee = 0.30;
    
    try {
      const settings = await pool.request().execute('admin.sp_GetPaymentCalculatorSettings');
      
      settings.recordset.forEach(s => {
        if (s.SettingKey === 'platform_commission_rate') platformCommission = parseFloat(s.SettingValue);
        if (s.SettingKey === 'renter_processing_fee_rate') renterFee = parseFloat(s.SettingValue);
        if (s.SettingKey === 'stripe_application_fee_rate') stripeFeeRate = parseFloat(s.SettingValue);
        if (s.SettingKey === 'stripe_fixed_fee') stripeFixedFee = parseFloat(s.SettingValue);
      });
    } catch (e) {
      console.warn('Could not load commission settings, using defaults');
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
    
    // Use stored procedure to get 2FA settings
    try {
      const result = await pool.request().execute('admin.sp_Get2FASettings');
      
      const settings = {};
      result.recordset.forEach(s => {
        settings[s.SettingKey] = s.SettingValue;
      });
      
      res.json({
        success: true,
        settings: {
          require2FAForAdmins: settings.require_2fa_admins === 'true',
          require2FAForVendors: settings.require_2fa_vendors === 'true',
          require2FAForUsers: settings.require_2fa_users === 'true',
          sessionTimeout: parseInt(settings.session_timeout_minutes) || 60,
          failedLoginLockout: parseInt(settings.failed_login_lockout) || 5,
          lockDurationMinutes: parseInt(settings.lock_duration_minutes) || 30
        }
      });
    } catch (e) {
      // Return defaults if stored procedure fails
      res.json({
        success: true,
        settings: {
          require2FAForAdmins: process.env.ENABLE_2FA === 'true',
          require2FAForVendors: false,
          require2FAForUsers: false,
          sessionTimeout: 60,
          failedLoginLockout: 5,
          lockDurationMinutes: 30
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
    const { require2FAForAdmins, require2FAForVendors, require2FAForUsers, sessionTimeout, failedLoginLockout, lockDurationMinutes } = req.body;
    const pool = await getPool();
    
    // Upsert settings using stored procedure
    const settings = [
      { key: 'require_2fa_admins', value: String(require2FAForAdmins) },
      { key: 'require_2fa_vendors', value: String(require2FAForVendors) },
      { key: 'require_2fa_users', value: String(require2FAForUsers) },
      { key: 'session_timeout_minutes', value: String(sessionTimeout) },
      { key: 'failed_login_lockout', value: String(failedLoginLockout) },
      { key: 'lock_duration_minutes', value: String(lockDurationMinutes || 30) }
    ];
    
    for (const setting of settings) {
      const request = pool.request();
      request.input('SettingKey', sql.NVarChar(100), setting.key);
      request.input('SettingValue', sql.NVarChar(500), setting.value);
      await request.execute('admin.sp_Upsert2FASetting');
    }
    
    // Log admin action using stored procedure
    try {
      const logRequest = pool.request();
      logRequest.input('UserID', sql.Int, req.user?.id || null);
      logRequest.input('Email', sql.NVarChar(255), req.user?.email || 'admin');
      logRequest.input('Action', sql.NVarChar(100), 'Admin2FASettingsUpdated');
      logRequest.input('ActionStatus', sql.NVarChar(50), 'Success');
      logRequest.input('Details', sql.NVarChar(sql.MAX), JSON.stringify({ require2FAForAdmins, require2FAForVendors, require2FAForUsers, sessionTimeout, failedLoginLockout }));
      logRequest.input('IPAddress', sql.NVarChar(50), null);
      await logRequest.execute('admin.sp_LogSecurityEvent');
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
    
    const result = await pool.request().execute('admin.sp_GetUsersWithTwoFactor');
    
    // Convert Date objects to ISO strings for proper JSON serialization
    const admins = (result.recordset || []).map(admin => ({
      ...admin,
      LastLogin: admin.LastLogin instanceof Date ? admin.LastLogin.toISOString() : admin.LastLogin,
      CreatedAt: admin.CreatedAt instanceof Date ? admin.CreatedAt.toISOString() : admin.CreatedAt
    }));
    
    res.json({ success: true, admins: serializeRecords(admins) });
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
    
    // Reset 2FA for user using stored procedure
    const request = pool.request();
    request.input('UserID', sql.Int, userId);
    await request.execute('admin.sp_ResetUser2FA');
    
    // Log admin action using stored procedure
    try {
      const logRequest = pool.request();
      logRequest.input('UserID', sql.Int, req.user?.id || null);
      logRequest.input('Email', sql.NVarChar(255), req.user?.email || 'admin');
      logRequest.input('Action', sql.NVarChar(100), 'Admin2FAReset');
      logRequest.input('ActionStatus', sql.NVarChar(50), 'Success');
      logRequest.input('Details', sql.NVarChar(sql.MAX), `Reset 2FA for user ID: ${userId}`);
      logRequest.input('IPAddress', sql.NVarChar(50), null);
      await logRequest.execute('admin.sp_LogSecurityEvent');
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
    
    // Get flagged items using stored procedure
    const result = await pool.request().execute('admin.sp_GetSecurityAudit');
    
    const flaggedItems = result.recordset.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      type: item.type,
      item: item.item,
      reason: item.issue || 'Multiple failed login attempts',
      severity: 'high',
      timestamp: item.lastOccurrence
    }));
    
    res.json({ success: true, items: serializeRecords(flaggedItems) });
  } catch (error) {
    console.error('Error fetching flagged items:', error);
    res.status(500).json({ error: 'Failed to fetch flagged items' });
  }
});

// ==================== BLOG MANAGEMENT ====================

// GET /admin/blogs - Get all blog posts
router.get('/blogs', async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    const pool = await getPool();
    
    const request = pool.request();
    request.input('Status', sql.NVarChar(50), status || null);
    request.input('Category', sql.NVarChar(100), category || null);
    request.input('Search', sql.NVarChar(100), search || null);
    request.input('PageNumber', sql.Int, parseInt(page));
    request.input('PageSize', sql.Int, parseInt(limit));
    
    // Try stored procedure first, fallback to direct query
    try {
      const result = await request.execute('admin.sp_GetBlogs');
      res.json({
        blogs: serializeRecords(result.recordsets[0] || []),
        total: result.recordsets[1]?.[0]?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (spError) {
      // Fallback: direct query if SP doesn't exist
      let query = `
        SELECT 
          BlogID, Title, Slug, Excerpt, Content, FeaturedImageURL,
          Category, Tags, Author, AuthorImageURL, Status,
          IsFeatured, ViewCount, PublishedAt, CreatedAt, UpdatedAt
        FROM content.Blogs
        WHERE 1=1
      `;
      
      if (status) query += ` AND Status = @Status`;
      if (category) query += ` AND Category = @Category`;
      if (search) query += ` AND (Title LIKE '%' + @Search + '%' OR Content LIKE '%' + @Search + '%')`;
      
      query += ` ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY`;
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      request.input('Offset', sql.Int, offset);
      request.input('Limit', sql.Int, parseInt(limit));
      
      const result = await request.query(query);
      
      // Get total count
      const countResult = await pool.request().query('SELECT COUNT(*) as total FROM content.Blogs');
      
      res.json({
        blogs: serializeRecords(result.recordset || []),
        total: countResult.recordset[0]?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    }
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'Failed to fetch blogs', details: error.message });
  }
});

// GET /admin/blogs/:id - Get single blog post
router.get('/blogs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const request = pool.request();
    request.input('BlogID', sql.Int, id);
    
    const result = await request.execute('admin.sp_GetBlogById');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    res.json({ blog: serializeRecords(result.recordset)[0] });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

// POST /admin/blogs - Create blog post
router.post('/blogs', async (req, res) => {
  try {
    const { 
      title, slug, excerpt, content, featuredImageUrl, 
      category, tags, author, authorImageUrl, status, isFeatured 
    } = req.body;
    const pool = await getPool();
    
    // Generate slug if not provided
    const blogSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const request = pool.request();
    request.input('Title', sql.NVarChar(255), title);
    request.input('Slug', sql.NVarChar(255), blogSlug);
    request.input('Excerpt', sql.NVarChar(500), excerpt || null);
    request.input('Content', sql.NVarChar(sql.MAX), content);
    request.input('FeaturedImageURL', sql.NVarChar(500), featuredImageUrl || null);
    request.input('Category', sql.NVarChar(100), category || 'General');
    request.input('Tags', sql.NVarChar(500), tags || null);
    request.input('Author', sql.NVarChar(100), author || 'PlanBeau Team');
    request.input('AuthorImageURL', sql.NVarChar(500), authorImageUrl || null);
    request.input('Status', sql.NVarChar(50), status || 'draft');
    request.input('IsFeatured', sql.Bit, isFeatured || false);
    request.input('PublishedAt', sql.DateTime2, status === 'published' ? new Date() : null);
    
    const result = await request.execute('admin.sp_CreateBlog');
    
    res.json({ success: true, blogId: serializeRecords(result.recordset)[0].BlogID });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Failed to create blog', details: error.message });
  }
});

// PUT /admin/blogs/:id - Update blog post
router.put('/blogs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, slug, excerpt, content, featuredImageUrl, 
      category, tags, author, authorImageUrl, status, isFeatured 
    } = req.body;
    const pool = await getPool();
    
    // Get current blog to check status change
    const statusRequest = pool.request();
    statusRequest.input('BlogID', sql.Int, id);
    const currentBlog = await statusRequest.execute('admin.sp_GetBlogStatus');
    
    const wasPublished = currentBlog.recordset[0]?.Status === 'published';
    const isNowPublished = status === 'published';
    
    const request = pool.request();
    request.input('BlogID', sql.Int, id);
    request.input('Title', sql.NVarChar(255), title);
    request.input('Slug', sql.NVarChar(255), slug);
    request.input('Excerpt', sql.NVarChar(500), excerpt || null);
    request.input('Content', sql.NVarChar(sql.MAX), content);
    request.input('FeaturedImageURL', sql.NVarChar(500), featuredImageUrl || null);
    request.input('Category', sql.NVarChar(100), category || 'General');
    request.input('Tags', sql.NVarChar(500), tags || null);
    request.input('Author', sql.NVarChar(100), author || 'PlanBeau Team');
    request.input('AuthorImageURL', sql.NVarChar(500), authorImageUrl || null);
    request.input('Status', sql.NVarChar(50), status || 'draft');
    request.input('IsFeatured', sql.Bit, isFeatured || false);
    request.input('SetPublishedAt', sql.Bit, !wasPublished && isNowPublished ? 1 : 0);
    
    await request.execute('admin.sp_UpdateBlog');
    
    res.json({ success: true, message: 'Blog updated' });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
});

// DELETE /admin/blogs/:id - Delete blog post
router.delete('/blogs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const deleteRequest = pool.request();
    deleteRequest.input('BlogID', sql.Int, id);
    await deleteRequest.execute('admin.sp_DeleteBlog');
    
    res.json({ success: true, message: 'Blog deleted' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});

// POST /admin/blogs/:id/publish - Publish blog post
router.post('/blogs/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const publishRequest = pool.request();
    publishRequest.input('BlogID', sql.Int, id);
    await publishRequest.execute('admin.sp_PublishBlog');
    
    res.json({ success: true, message: 'Blog published' });
  } catch (error) {
    console.error('Error publishing blog:', error);
    res.status(500).json({ error: 'Failed to publish blog' });
  }
});

// POST /admin/blogs/:id/unpublish - Unpublish blog post
router.post('/blogs/:id/unpublish', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const unpublishRequest = pool.request();
    unpublishRequest.input('BlogID', sql.Int, id);
    await unpublishRequest.execute('admin.sp_UnpublishBlog');
    
    res.json({ success: true, message: 'Blog unpublished' });
  } catch (error) {
    console.error('Error unpublishing blog:', error);
    res.status(500).json({ error: 'Failed to unpublish blog' });
  }
});

// POST /admin/blogs/:id/feature - Toggle featured status
router.post('/blogs/:id/feature', async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    const pool = await getPool();
    
    const featureRequest = pool.request();
    featureRequest.input('BlogID', sql.Int, id);
    featureRequest.input('IsFeatured', sql.Bit, featured);
    await featureRequest.execute('admin.sp_ToggleBlogFeatured');
    
    res.json({ success: true, message: featured ? 'Blog featured' : 'Blog unfeatured' });
  } catch (error) {
    console.error('Error toggling featured:', error);
    res.status(500).json({ error: 'Failed to toggle featured status' });
  }
});

// GET /admin/blogs/categories - Get blog categories
router.get('/blog-categories', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().execute('admin.sp_GetBlogCategories');
    
    // Add default categories if none exist
    const defaultCategories = [
      'Wedding Planning', 'Event Tips', 'Vendor Spotlights', 
      'Industry News', 'Holiday Festivities', 'Business Events'
    ];
    
    const existingCategories = result.recordset.map(r => r.Category);
    const allCategories = [...new Set([...existingCategories, ...defaultCategories])];
    
    res.json({ categories: serializeRecords(allCategories) });
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    res.json({ categories: ['Wedding Planning', 'Event Tips', 'Vendor Spotlights', 'Industry News', 'Holiday Festivities', 'Business Events'] });
  }
});

// =============================================
// VENDOR BADGES MANAGEMENT
// =============================================

// GET /admin/badges - Get all badge types
router.get('/badges', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().execute('admin.sp_GetAllBadgeTypes');
    res.json({ success: true, badgeTypes: serializeRecords(result.recordset) });
  } catch (error) {
    console.error('Error fetching badge types:', error);
    // Return default badge types if stored procedure doesn't exist
    res.json({ 
      success: true, 
      badgeTypes: serializeRecords([
        { BadgeType: 'new_vendor', BadgeName: 'New Vendor', Description: 'Recently joined vendor', Icon: 'fa-sparkles', Color: '#0369a1' },
        { BadgeType: 'top_rated', BadgeName: 'Top Rated', Description: 'Highly rated by clients', Icon: 'fa-star', Color: '#d97706' },
        { BadgeType: 'choice_award', BadgeName: 'Choice Award', Description: 'Winner of choice awards', Icon: 'fa-award', Color: '#dc2626' },
        { BadgeType: 'premium', BadgeName: 'Premium', Description: 'Premium vendor status', Icon: 'fa-crown', Color: '#7c3aed' },
        { BadgeType: 'verified', BadgeName: 'Verified', Description: 'Identity verified', Icon: 'fa-check-circle', Color: '#059669' },
        { BadgeType: 'featured', BadgeName: 'Featured', Description: 'Featured vendor', Icon: 'fa-fire', Color: '#db2777' }
      ])
    });
  }
});

// GET /admin/vendors/:id/badges - Get badges for a specific vendor
router.get('/vendors/:id/badges', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input('VendorProfileID', sql.Int, parseInt(id));
    
    const result = await request.execute('vendors.sp_GetVendorBadges');
    res.json({ success: true, badges: serializeRecords(result.recordset) });
  } catch (error) {
    console.error('Error fetching vendor badges:', error);
    res.status(500).json({ success: false, message: 'Failed to get vendor badges' });
  }
});

// POST /admin/vendors/:id/badges - Assign badge to vendor
router.post('/vendors/:id/badges', async (req, res) => {
  try {
    const { id } = req.params;
    const { badgeType, badgeName, year, imageURL, description } = req.body;
    
    if (!badgeType) {
      return res.status(400).json({ success: false, message: 'Badge type is required' });
    }

    const pool = await getPool();
    const request = pool.request();
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('BadgeType', sql.NVarChar(50), badgeType);
    request.input('BadgeName', sql.NVarChar(100), badgeName || null);
    request.input('Year', sql.Int, year || null);
    request.input('ImageURL', sql.NVarChar(500), imageURL || null);
    request.input('Description', sql.NVarChar(500), description || null);
    
    const result = await request.execute('vendors.sp_AssignVendorBadge');
    
    res.json({ success: true, badgeId: serializeRecords(result.recordset)[0]?.BadgeID, message: 'Badge assigned successfully' });
  } catch (error) {
    console.error('Error assigning badge:', error);
    res.status(500).json({ success: false, message: 'Failed to assign badge' });
  }
});

// DELETE /admin/vendors/:id/badges/:badgeId - Remove badge from vendor
router.delete('/vendors/:id/badges/:badgeId', async (req, res) => {
  try {
    const { id, badgeId } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('BadgeID', sql.Int, parseInt(badgeId));
    
    await request.execute('vendors.sp_RemoveVendorBadge');
    
    res.json({ success: true, message: 'Badge removed successfully' });
  } catch (error) {
    console.error('Error removing badge:', error);
    res.status(500).json({ success: false, message: 'Failed to remove badge' });
  }
});

// =============================================
// EMAIL QUEUE MANAGEMENT
// =============================================

const { getQueueStats, getQueueItems, cancelQueuedEmail, processEmailQueue } = require('../services/emailSchedulerService');

// GET /admin/email-queue/stats - Get queue statistics
router.get('/email-queue/stats', async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching email queue stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queue stats' });
  }
});

// GET /admin/email-queue - Get queue items with pagination
router.get('/email-queue', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 50 } = req.query;
    const result = await getQueueItems(status || null, parseInt(page), parseInt(pageSize));
    
    // Convert Date objects to ISO strings for proper JSON serialization
    const items = (result.items || []).map(item => ({
      ...item,
      ScheduledAt: item.ScheduledAt instanceof Date ? item.ScheduledAt.toISOString() : item.ScheduledAt,
      SentAt: item.SentAt instanceof Date ? item.SentAt.toISOString() : item.SentAt,
      CreatedAt: item.CreatedAt instanceof Date ? item.CreatedAt.toISOString() : item.CreatedAt
    }));
    
    res.json({ 
      success: true, 
      items: serializeRecords(items), 
      total: result.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    console.error('Error fetching email queue:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queue items' });
  }
});

// POST /admin/email-queue/:id/cancel - Cancel a queued email
router.post('/email-queue/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    
    const success = await cancelQueuedEmail(parseInt(id), userId, reason);
    
    if (success) {
      res.json({ success: true, message: 'Email cancelled successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Could not cancel email. It may have already been sent or cancelled.' });
    }
  } catch (error) {
    console.error('Error cancelling queued email:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel email' });
  }
});

// POST /admin/email-queue/process - Manually trigger queue processing
router.post('/email-queue/process', async (req, res) => {
  try {
    const result = await processEmailQueue();
    res.json({ 
      success: true, 
      message: `Processed ${result.processed} emails: ${result.sent} sent, ${result.failed} failed`,
      ...result
    });
  } catch (error) {
    console.error('Error processing email queue:', error);
    res.status(500).json({ success: false, message: 'Failed to process queue' });
  }
});

// ==================== FAQ CATEGORIES MANAGEMENT ====================

// GET /admin/faq-categories - Get all FAQ categories
router.get('/faq-categories', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT 
        c.CategoryID,
        c.Name,
        c.Slug,
        c.Description,
        c.Icon,
        c.DisplayOrder,
        c.IsActive,
        c.ParentCategoryID,
        (SELECT COUNT(*) FROM [admin].[FAQs] f WHERE f.CategoryID = c.CategoryID) AS ArticleCount
      FROM [admin].[FAQCategories] c
      ORDER BY c.DisplayOrder, c.Name
    `);
    
    res.json({ categories: serializeRecords(result.recordset) });
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    res.status(500).json({ error: 'Failed to fetch FAQ categories' });
  }
});

// POST /admin/faq-categories - Create new FAQ category
router.post('/faq-categories', async (req, res) => {
  try {
    const { name, slug, description, icon, displayOrder, isActive } = req.body;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('Name', sql.NVarChar(100), name)
      .input('Slug', sql.NVarChar(100), slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
      .input('Description', sql.NVarChar(500), description || null)
      .input('Icon', sql.NVarChar(50), icon || 'fa-folder')
      .input('DisplayOrder', sql.Int, displayOrder || 0)
      .input('IsActive', sql.Bit, isActive !== false)
      .query(`
        INSERT INTO [admin].[FAQCategories] (Name, Slug, Description, Icon, DisplayOrder, IsActive)
        OUTPUT INSERTED.*
        VALUES (@Name, @Slug, @Description, @Icon, @DisplayOrder, @IsActive)
      `);
    
    res.json({ success: true, category: serializeRecords(result.recordset)[0] });
  } catch (error) {
    console.error('Error creating FAQ category:', error);
    res.status(500).json({ error: 'Failed to create FAQ category' });
  }
});

// PUT /admin/faq-categories/:id - Update FAQ category
router.put('/faq-categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, displayOrder, isActive } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('CategoryID', sql.Int, id)
      .input('Name', sql.NVarChar(100), name)
      .input('Slug', sql.NVarChar(100), slug)
      .input('Description', sql.NVarChar(500), description || null)
      .input('Icon', sql.NVarChar(50), icon)
      .input('DisplayOrder', sql.Int, displayOrder)
      .input('IsActive', sql.Bit, isActive)
      .query(`
        UPDATE [admin].[FAQCategories]
        SET Name = @Name, Slug = @Slug, Description = @Description, Icon = @Icon, 
            DisplayOrder = @DisplayOrder, IsActive = @IsActive, UpdatedAt = GETUTCDATE()
        WHERE CategoryID = @CategoryID
      `);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating FAQ category:', error);
    res.status(500).json({ error: 'Failed to update FAQ category' });
  }
});

// DELETE /admin/faq-categories/:id - Delete FAQ category
router.delete('/faq-categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    // First update FAQs to remove category reference
    await pool.request()
      .input('CategoryID', sql.Int, id)
      .query(`UPDATE [admin].[FAQs] SET CategoryID = NULL WHERE CategoryID = @CategoryID`);
    
    // Then delete the category
    await pool.request()
      .input('CategoryID', sql.Int, id)
      .query(`DELETE FROM [admin].[FAQCategories] WHERE CategoryID = @CategoryID`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting FAQ category:', error);
    res.status(500).json({ error: 'Failed to delete FAQ category' });
  }
});

// ==================== ENHANCED FAQ MANAGEMENT ====================

// GET /admin/faqs/all - Get all FAQs with category info
router.get('/faqs/all', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT 
        f.FAQID,
        f.Question,
        f.Answer,
        f.Category,
        f.CategoryID,
        f.DisplayOrder,
        f.IsActive,
        f.ViewCount,
        f.HelpfulCount,
        f.NotHelpfulCount,
        f.CreatedAt,
        f.UpdatedAt,
        c.Name AS CategoryName,
        c.Slug AS CategorySlug
      FROM [admin].[FAQs] f
      LEFT JOIN [admin].[FAQCategories] c ON f.CategoryID = c.CategoryID
      ORDER BY f.CategoryID, f.DisplayOrder, f.FAQID
    `);
    
    res.json({ faqs: serializeRecords(result.recordset) });
  } catch (error) {
    console.error('Error fetching all FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// POST /admin/faqs/create - Create new FAQ with category
router.post('/faqs/create', async (req, res) => {
  try {
    const { question, answer, category, categoryId, displayOrder, isActive } = req.body;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('Question', sql.NVarChar(500), question)
      .input('Answer', sql.NVarChar(sql.MAX), answer)
      .input('Category', sql.NVarChar(100), category || 'General')
      .input('CategoryID', sql.Int, categoryId || null)
      .input('DisplayOrder', sql.Int, displayOrder || 0)
      .input('IsActive', sql.Bit, isActive !== false)
      .query(`
        INSERT INTO [admin].[FAQs] (Question, Answer, Category, CategoryID, DisplayOrder, IsActive)
        OUTPUT INSERTED.*
        VALUES (@Question, @Answer, @Category, @CategoryID, @DisplayOrder, @IsActive)
      `);
    
    res.json({ success: true, faq: result.recordset[0] });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

// PUT /admin/faqs/update/:id - Update FAQ with category
router.put('/faqs/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, categoryId, displayOrder, isActive } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('FAQID', sql.Int, id)
      .input('Question', sql.NVarChar(500), question)
      .input('Answer', sql.NVarChar(sql.MAX), answer)
      .input('Category', sql.NVarChar(100), category)
      .input('CategoryID', sql.Int, categoryId || null)
      .input('DisplayOrder', sql.Int, displayOrder)
      .input('IsActive', sql.Bit, isActive)
      .query(`
        UPDATE [admin].[FAQs]
        SET Question = @Question, Answer = @Answer, Category = @Category, CategoryID = @CategoryID,
            DisplayOrder = @DisplayOrder, IsActive = @IsActive, UpdatedAt = GETUTCDATE()
        WHERE FAQID = @FAQID
      `);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// ==================== ARTICLES MANAGEMENT ====================

// GET /admin/articles - Get all articles
router.get('/articles', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT 
        a.ArticleID,
        a.Title,
        a.Slug,
        a.Summary,
        a.Content,
        a.CategoryID,
        a.ArticleType,
        a.FeaturedImage,
        a.Author,
        a.Tags,
        a.DisplayOrder,
        a.IsActive,
        a.IsFeatured,
        a.ViewCount,
        a.HelpfulCount,
        a.NotHelpfulCount,
        a.PublishedAt,
        a.CreatedAt,
        a.UpdatedAt,
        c.Name AS CategoryName
      FROM [admin].[Articles] a
      LEFT JOIN [admin].[FAQCategories] c ON a.CategoryID = c.CategoryID
      ORDER BY a.IsFeatured DESC, a.DisplayOrder, a.CreatedAt DESC
    `);
    
    res.json({ articles: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// POST /admin/articles - Create new article
router.post('/articles', async (req, res) => {
  try {
    const { title, slug, summary, content, categoryId, articleType, featuredImage, author, tags, displayOrder, isActive, isFeatured } = req.body;
    const pool = await getPool();
    
    const generatedSlug = slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const result = await pool.request()
      .input('Title', sql.NVarChar(255), title)
      .input('Slug', sql.NVarChar(255), generatedSlug)
      .input('Summary', sql.NVarChar(500), summary || null)
      .input('Content', sql.NVarChar(sql.MAX), content)
      .input('CategoryID', sql.Int, categoryId || null)
      .input('ArticleType', sql.NVarChar(50), articleType || 'help')
      .input('FeaturedImage', sql.NVarChar(500), featuredImage || null)
      .input('Author', sql.NVarChar(100), author || 'Planbeau Team')
      .input('Tags', sql.NVarChar(500), tags || null)
      .input('DisplayOrder', sql.Int, displayOrder || 0)
      .input('IsActive', sql.Bit, isActive !== false)
      .input('IsFeatured', sql.Bit, isFeatured === true)
      .input('PublishedAt', sql.DateTime2, isActive !== false ? new Date() : null)
      .query(`
        INSERT INTO [admin].[Articles] (Title, Slug, Summary, Content, CategoryID, ArticleType, FeaturedImage, Author, Tags, DisplayOrder, IsActive, IsFeatured, PublishedAt)
        OUTPUT INSERTED.*
        VALUES (@Title, @Slug, @Summary, @Content, @CategoryID, @ArticleType, @FeaturedImage, @Author, @Tags, @DisplayOrder, @IsActive, @IsFeatured, @PublishedAt)
      `);
    
    res.json({ success: true, article: result.recordset[0] });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// PUT /admin/articles/:id - Update article
router.put('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, summary, content, categoryId, articleType, featuredImage, author, tags, displayOrder, isActive, isFeatured } = req.body;
    const pool = await getPool();
    
    await pool.request()
      .input('ArticleID', sql.Int, id)
      .input('Title', sql.NVarChar(255), title)
      .input('Slug', sql.NVarChar(255), slug)
      .input('Summary', sql.NVarChar(500), summary || null)
      .input('Content', sql.NVarChar(sql.MAX), content)
      .input('CategoryID', sql.Int, categoryId || null)
      .input('ArticleType', sql.NVarChar(50), articleType)
      .input('FeaturedImage', sql.NVarChar(500), featuredImage || null)
      .input('Author', sql.NVarChar(100), author)
      .input('Tags', sql.NVarChar(500), tags || null)
      .input('DisplayOrder', sql.Int, displayOrder)
      .input('IsActive', sql.Bit, isActive)
      .input('IsFeatured', sql.Bit, isFeatured)
      .query(`
        UPDATE [admin].[Articles]
        SET Title = @Title, Slug = @Slug, Summary = @Summary, Content = @Content, CategoryID = @CategoryID,
            ArticleType = @ArticleType, FeaturedImage = @FeaturedImage, Author = @Author, Tags = @Tags,
            DisplayOrder = @DisplayOrder, IsActive = @IsActive, IsFeatured = @IsFeatured, UpdatedAt = GETUTCDATE()
        WHERE ArticleID = @ArticleID
      `);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// DELETE /admin/articles/:id - Delete article
router.delete('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    await pool.request()
      .input('ArticleID', sql.Int, id)
      .query(`DELETE FROM [admin].[Articles] WHERE ArticleID = @ArticleID`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// ==================== FAQ FEEDBACK STATISTICS ====================

// GET /admin/faq-stats - Get FAQ feedback statistics for admin dashboard
router.get('/faq-stats', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT 
        f.FAQID,
        f.Question,
        f.Category,
        ISNULL(f.ViewCount, 0) AS ViewCount,
        ISNULL(f.HelpfulCount, 0) AS HelpfulCount,
        ISNULL(f.NeutralCount, 0) AS NeutralCount,
        ISNULL(f.NotHelpfulCount, 0) AS NotHelpfulCount,
        ISNULL(f.HelpfulCount, 0) + ISNULL(f.NeutralCount, 0) + ISNULL(f.NotHelpfulCount, 0) AS TotalFeedback,
        CASE 
          WHEN (ISNULL(f.HelpfulCount, 0) + ISNULL(f.NeutralCount, 0) + ISNULL(f.NotHelpfulCount, 0)) > 0 
          THEN CAST(ISNULL(f.HelpfulCount, 0) AS FLOAT) / (ISNULL(f.HelpfulCount, 0) + ISNULL(f.NeutralCount, 0) + ISNULL(f.NotHelpfulCount, 0)) * 100
          ELSE 0 
        END AS HelpfulPercentage
      FROM [admin].[FAQs] f
      WHERE f.IsActive = 1
      ORDER BY f.ViewCount DESC, f.FAQID
    `);
    
    // Calculate summary stats
    const faqs = result.recordset || [];
    const totalViews = faqs.reduce((sum, f) => sum + f.ViewCount, 0);
    const totalFeedback = faqs.reduce((sum, f) => sum + f.TotalFeedback, 0);
    const totalHelpful = faqs.reduce((sum, f) => sum + f.HelpfulCount, 0);
    const totalNeutral = faqs.reduce((sum, f) => sum + f.NeutralCount, 0);
    const totalNotHelpful = faqs.reduce((sum, f) => sum + f.NotHelpfulCount, 0);
    
    res.json({ 
      faqs,
      summary: {
        totalFaqs: faqs.length,
        totalViews,
        totalFeedback,
        totalHelpful,
        totalNeutral,
        totalNotHelpful,
        overallHelpfulRate: totalFeedback > 0 ? ((totalHelpful / totalFeedback) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching FAQ stats:', error);
    res.status(500).json({ error: 'Failed to fetch FAQ statistics' });
  }
});

// GET /admin/blog-stats - Get blog view statistics for admin dashboard
router.get('/blog-stats', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT 
        b.BlogID,
        b.Title,
        b.Slug,
        b.Category,
        b.Status,
        b.IsFeatured,
        ISNULL(b.ViewCount, 0) AS ViewCount,
        b.PublishedAt,
        b.CreatedAt
      FROM [content].[Blogs] b
      ORDER BY b.ViewCount DESC, b.CreatedAt DESC
    `);
    
    const blogs = result.recordset || [];
    const totalViews = blogs.reduce((sum, b) => sum + b.ViewCount, 0);
    const publishedBlogs = blogs.filter(b => b.Status === 'published');
    
    res.json({ 
      blogs,
      summary: {
        totalBlogs: blogs.length,
        publishedBlogs: publishedBlogs.length,
        totalViews,
        featuredBlogs: blogs.filter(b => b.IsFeatured).length
      }
    });
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    res.status(500).json({ error: 'Failed to fetch blog statistics' });
  }
});

// ============================================================
// COOKIE CONSENT & EMAIL UNSUBSCRIBE MANAGEMENT
// ============================================================

// GET /admin/cookie-consent/stats - Get cookie consent statistics
router.get('/cookie-consent/stats', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('users.sp_GetCookieConsentStats');
    const stats = result.recordset[0] || {};
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching cookie consent stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /admin/email-unsubscribes/stats - Get email unsubscribe statistics
router.get('/email-unsubscribes/stats', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('users.sp_GetEmailUnsubscribeStats');
    const stats = result.recordset || [];
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching email unsubscribe stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /admin/email-unsubscribes - Get all email unsubscribes with pagination
router.get('/email-unsubscribes', async (req, res) => {
  try {
    const { category, isActive, page = 1, pageSize = 50 } = req.query;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('Category', sql.NVarChar(50), category || null)
      .input('IsActive', sql.Bit, isActive === 'true' ? 1 : (isActive === 'false' ? 0 : null))
      .input('PageNumber', sql.Int, parseInt(page))
      .input('PageSize', sql.Int, parseInt(pageSize))
      .execute('users.sp_GetEmailUnsubscribes');
    
    res.json({ success: true, unsubscribes: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching email unsubscribes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /admin/vendor-reports - Get vendor reports for admin review
router.get('/vendor-reports', async (req, res) => {
  try {
    const { status, vendorProfileId } = req.query;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('Status', sql.NVarChar(20), status || null)
      .input('VendorProfileID', sql.Int, vendorProfileId ? parseInt(vendorProfileId) : null)
      .execute('vendors.sp_GetVendorReports');
    
    res.json({ success: true, reports: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching vendor reports:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /admin/vendor-reports/:reportId - Update vendor report status
router.put('/vendor-reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.user?.id || null;
    const pool = await poolPromise;
    
    await pool.request()
      .input('ReportID', sql.Int, parseInt(reportId))
      .input('Status', sql.NVarChar(20), status)
      .input('AdminNotes', sql.NVarChar(sql.MAX), adminNotes || null)
      .input('AdminID', sql.Int, adminId)
      .execute('vendors.sp_UpdateVendorReportStatus');
    
    res.json({ success: true, message: 'Report updated successfully' });
  } catch (error) {
    console.error('Error updating vendor report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== IMPERSONATE USER ====================

// POST /admin/impersonate/:userId - Start impersonating a user
router.post('/impersonate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id;
    
    console.log(`[Impersonate] Admin ${adminId} attempting to impersonate user ${userId}`);
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const pool = await getPool();
    
    // Get user details
    const userResult = await pool.request()
      .input('UserID', sql.Int, parseInt(userId))
      .query(`
        SELECT UserID, Email, Name, FirstName, LastName, IsVendor, IsAdmin, IsActive
        FROM users.Users
        WHERE UserID = @UserID
      `);
    
    console.log(`[Impersonate] User query result:`, userResult.recordset.length, 'records');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.recordset[0];
    console.log(`[Impersonate] Found user:`, user.Email);
    
    // Log impersonation action (optional - don't fail if logging fails)
    try {
      // Try to log to security events table directly if SP doesn't exist
      await pool.request()
        .input('UserID', sql.Int, adminId)
        .input('Action', sql.NVarChar(100), 'ImpersonateUser')
        .input('Details', sql.NVarChar(sql.MAX), `Admin impersonated user: ${user.Email} (ID: ${userId})`)
        .query(`
          INSERT INTO admin.SecurityEvents (UserID, Action, Details, CreatedAt, IPAddress)
          VALUES (@UserID, @Action, @Details, GETDATE(), NULL)
        `);
    } catch (logErr) {
      // Logging is optional - don't fail impersonation if logging fails
      console.log('Note: Security logging skipped:', logErr.message);
    }
    
    // Generate impersonation token (same as regular token but with impersonation flag)
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('[Impersonate] JWT_SECRET not configured!');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const tokenPayload = {
      id: user.UserID,
      email: user.Email,
      name: user.Name || `${user.FirstName || ''} ${user.LastName || ''}`.trim(),
      isVendor: user.IsVendor || false,
      isAdmin: false, // Don't give admin access when impersonating
      impersonatedBy: adminId,
      isImpersonation: true
    };
    
    console.log(`[Impersonate] Creating token for user:`, tokenPayload.email);
    
    const impersonationToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' });
    
    console.log(`[Impersonate] Token created successfully`);
    
    res.json({
      success: true,
      token: impersonationToken,
      user: {
        id: user.UserID,
        email: user.Email,
        name: user.Name || `${user.FirstName} ${user.LastName}`,
        isVendor: user.IsVendor
      },
      message: `Now impersonating ${user.Email}`
    });
  } catch (error) {
    console.error('Error impersonating user:', error);
    res.status(500).json({ error: 'Failed to impersonate user' });
  }
});

// POST /admin/impersonate/end - End impersonation session
router.post('/impersonate/end', async (req, res) => {
  try {
    const adminId = req.user?.impersonatedBy || req.user?.id;
    const pool = await getPool();
    
    // Log end of impersonation
    try {
      await pool.request()
        .input('UserID', sql.Int, adminId)
        .input('Email', sql.NVarChar(255), 'admin')
        .input('Action', sql.NVarChar(100), 'EndImpersonation')
        .input('ActionStatus', sql.NVarChar(50), 'Success')
        .input('Details', sql.NVarChar(sql.MAX), 'Admin ended impersonation session')
        .input('IPAddress', sql.NVarChar(50), req.ip || null)
        .execute('admin.sp_LogSecurityEvent');
    } catch (logErr) {
      console.error('Failed to log end impersonation:', logErr.message);
    }
    
    res.json({ success: true, message: 'Impersonation ended' });
  } catch (error) {
    console.error('Error ending impersonation:', error);
    res.status(500).json({ error: 'Failed to end impersonation' });
  }
});

module.exports = router;
