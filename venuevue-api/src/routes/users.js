const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const { serializeDates, serializeRecords } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendTwoFactorCode, sendTemplatedEmail, sendAccountSuspended } = require('../services/email');
const { processUnsubscribe, generateUnsubscribeHtml, getUserPreferences, updateUserPreferences, verifyUnsubscribeToken, resubscribeUser } = require('../services/unsubscribeService');
const crypto = require('crypto');
const { upload } = require('../middlewares/uploadMiddleware');
const cloudinaryService = require('../services/cloudinaryService');

// Helper functions for validation
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
  return password && password.length >= 8;
};

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, isVendor = false, accountType } = req.body;
    
    // Convert accountType to isVendor boolean if provided
    const isVendorFlag = accountType === 'vendor' || isVendor;

    // Manual validation
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'First name is required' 
      });
    }

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid email is required' 
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 8 characters' 
      });
    }

    // Check if email exists
    const pool = await poolPromise;
    const checkRequest = pool.request();
    checkRequest.input('Email', sql.NVarChar(100), email);
    const emailCheck = await checkRequest.execute('users.sp_CheckEmailExists');

    if (emailCheck.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const request = pool.request();
    request.input('FirstName', sql.NVarChar(100), firstName.trim());
    request.input('LastName', sql.NVarChar(100), lastName ? lastName.trim() : null);
    request.input('Email', sql.NVarChar(100), email.toLowerCase().trim());
    request.input('PasswordHash', sql.NVarChar(255), passwordHash);
    request.input('IsVendor', sql.Bit, isVendorFlag);
    request.input('AuthProvider', sql.NVarChar(20), 'email');

    const result = await request.execute('users.sp_RegisterUser');
    const userId = result.recordset[0].UserID;

    // Log account creation
    try {
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('email', sql.NVarChar, email.toLowerCase().trim())
        .input('action', sql.NVarChar, 'AccountCreated')
        .input('ActionStatus', sql.NVarChar, 'Success')
        .input('ipAddress', sql.NVarChar, req.ip || req.headers['x-forwarded-for'] || 'Unknown')
        .input('userAgent', sql.NVarChar, req.headers['user-agent'] || 'Unknown')
        .input('details', sql.NVarChar, isVendorFlag ? 'Vendor account created' : 'Client account created')
        .execute('users.sp_InsertSecurityLog');
    } catch (logErr) { console.error('Failed to log security event:', logErr.message); }

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email, isVendor: isVendorFlag },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      userId,
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : null,
      email: email.toLowerCase().trim(),
      isVendor: isVendorFlag,
      token
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: err.message
    });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const pool = await poolPromise;
    
    const request = pool.request();
    request.input('Email', sql.NVarChar(100), email.toLowerCase().trim());

    const result = await request.execute('users.sp_GetLoginInfo');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.recordset[0];

    // Check if account is locked due to failed login attempts
    if (user.IsLocked) {
      const lockExpiry = user.LockExpiresAt ? new Date(user.LockExpiresAt) : null;
      if (lockExpiry && lockExpiry > new Date()) {
        const minutesRemaining = Math.ceil((lockExpiry - new Date()) / 60000);
        return res.status(423).json({
          success: false,
          message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${minutesRemaining} minute(s) or contact support.`,
          isLocked: true,
          lockExpiresAt: lockExpiry.toISOString()
        });
      }
    }

    // Check if account is deleted (soft delete)
    if (user.IsDeleted) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deleted. Account deletion is permanent and cannot be reversed. If you believe this is an error, please contact support.',
        isDeleted: true
      });
    }

    // Check if account is active
    if (!user.IsActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      // Get failed login lockout and lock duration settings from database
      let maxAttempts = 5; // default
      let lockDurationMinutes = 30; // default
      try {
        const lockoutResult = await pool.request().execute('users.sp_CheckSecuritySettings');
        if (lockoutResult.recordset && lockoutResult.recordset.length > 0) {
          const lockoutSetting = lockoutResult.recordset.find(s => s.SettingKey === 'failed_login_lockout');
          if (lockoutSetting) {
            maxAttempts = parseInt(lockoutSetting.SettingValue) || 5;
          }
          const durationSetting = lockoutResult.recordset.find(s => s.SettingKey === 'lock_duration_minutes');
          if (durationSetting) {
            lockDurationMinutes = parseInt(durationSetting.SettingValue) || 30;
          }
        }
      } catch (e) { /* use default */ }
      
      // Increment failed login attempts
      const failedAttempts = (user.FailedLoginAttempts || 0) + 1;
      
      try {
        // Update failed attempts count
        await pool.request()
          .input('UserID', sql.Int, user.UserID)
          .input('FailedAttempts', sql.Int, failedAttempts)
          .query(`
            UPDATE users.Users 
            SET FailedLoginAttempts = @FailedAttempts,
                LastFailedLoginAt = GETDATE()
            WHERE UserID = @UserID
          `);
        
        // Lock account if max attempts reached
        if (failedAttempts >= maxAttempts) {
          const lockExpiry = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
          await pool.request()
            .input('UserID', sql.Int, user.UserID)
            .input('LockExpiresAt', sql.DateTime, lockExpiry)
            .query(`
              UPDATE users.Users 
              SET IsLocked = 1, 
                  LockExpiresAt = @LockExpiresAt,
                  LockReason = 'Too many failed login attempts'
              WHERE UserID = @UserID
            `);
          
          // Send account locked email notification using existing account_suspended template
          try {
            await sendAccountSuspended(
              user.Email,
              user.Name,
              `Too many failed login attempts. Your account will be automatically unlocked in ${lockDurationMinutes} minutes.`,
              user.UserID
            );
          } catch (emailErr) {
            console.error('Failed to send account locked email:', emailErr.message);
          }
          
          // Log account lock event
          await pool.request()
            .input('userId', sql.Int, user.UserID)
            .input('email', sql.NVarChar, email)
            .input('action', sql.NVarChar, 'AccountLocked')
            .input('ActionStatus', sql.NVarChar, 'Success')
            .input('ipAddress', sql.NVarChar, req.ip || req.headers['x-forwarded-for'] || 'Unknown')
            .input('userAgent', sql.NVarChar, req.headers['user-agent'] || 'Unknown')
            .input('details', sql.NVarChar, `Account locked after ${failedAttempts} failed attempts`)
            .execute('users.sp_InsertSecurityLog');
        }
        
        // Log failed login attempt
        await pool.request()
          .input('userId', sql.Int, user.UserID)
          .input('email', sql.NVarChar, email)
          .input('action', sql.NVarChar, 'LoginFailed')
          .input('ActionStatus', sql.NVarChar, 'Failed')
          .input('ipAddress', sql.NVarChar, req.ip || req.headers['x-forwarded-for'] || 'Unknown')
          .input('userAgent', sql.NVarChar, req.headers['user-agent'] || 'Unknown')
          .input('details', sql.NVarChar, `Invalid password (attempt ${failedAttempts}/${maxAttempts})`)
          .execute('users.sp_InsertSecurityLog');
      } catch (logErr) { console.error('Failed to log security event:', logErr.message); }
      
      // Return appropriate message based on attempts remaining
      const attemptsRemaining = maxAttempts - failedAttempts;
      if (attemptsRemaining <= 0) {
        return res.status(423).json({
          success: false,
          message: 'Account has been locked due to too many failed login attempts. Please check your email for instructions.',
          isLocked: true
        });
      }
      
      return res.status(401).json({
        success: false,
        message: `Invalid credentials. ${attemptsRemaining} attempt(s) remaining before account lock.`,
        attemptsRemaining
      });
    }
    
    // Successful login - reset failed attempts
    try {
      await pool.request()
        .input('UserID', sql.Int, user.UserID)
        .query(`
          UPDATE users.Users 
          SET FailedLoginAttempts = 0,
              IsLocked = 0,
              LockExpiresAt = NULL,
              LockReason = NULL
          WHERE UserID = @UserID
        `);
    } catch (resetErr) { console.error('Failed to reset login attempts:', resetErr.message); }

    // Check 2FA settings from database (SecuritySettings table - key-value pairs)
    let enable2FA = String(process.env.ENABLE_2FA || 'false').toLowerCase() === 'true';
    
    try {
      // Get security settings via stored procedure (handles table existence check internally)
      const settingsResult = await pool.request().execute('users.sp_CheckSecuritySettings');
      
      if (settingsResult.recordset && settingsResult.recordset.length > 0) {
        const settings = {};
        settingsResult.recordset.forEach(row => {
          settings[row.SettingKey] = row.SettingValue;
        });
        
        // Enable 2FA based on user type and corresponding setting
        const require2FAForAdmins = settings['require_2fa_admins'] === 'true';
        const require2FAForVendors = settings['require_2fa_vendors'] === 'true';
        const require2FAForUsers = settings['require_2fa_users'] === 'true';
        
        // Check admin first (highest priority)
        if (user.IsAdmin && require2FAForAdmins) {
          enable2FA = true;
        }
        // Check vendor - require_2fa_vendors applies to vendors AND their clients
        if (user.IsVendor && require2FAForVendors) {
          enable2FA = true;
        }
        // Check regular users/clients - require_2fa_users applies to non-admin, non-vendor users
        // Also enable if require_2fa_vendors is true (vendors setting covers clients too)
        if (!user.IsAdmin && !user.IsVendor) {
          if (require2FAForUsers || require2FAForVendors) {
            enable2FA = true;
          }
        }
      }
    } catch (settingsErr) { 
      // Could not check 2FA settings from database
    }
    
    if (enable2FA) {
      const raw = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
      const salt = await bcrypt.genSalt(10);
      const codeHash = await bcrypt.hash(raw, salt);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await pool.request()
        .input('UserID', sql.Int, user.UserID)
        .input('CodeHash', sql.NVarChar(255), codeHash)
        .input('Purpose', sql.NVarChar(50), 'login')
        .input('ExpiresAt', sql.DateTime, expiresAt)
        .execute('users.sp_Insert2FACode');
      try { await sendTwoFactorCode(user.Email, raw); } catch (e) { console.error('2FA email error:', e.message); }
      const tempToken = jwt.sign(
        { id: user.UserID, email: user.Email, purpose: 'login_2fa' },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
      return res.json({ success: true, twoFactorRequired: true, tempToken, message: 'Verification code sent' });
    }
    // Get session timeout from security settings
    let sessionTimeoutMinutes = 60; // default 1 hour
    try {
      const timeoutResult = await pool.request().execute('users.sp_CheckSecuritySettings');
      if (timeoutResult.recordset && timeoutResult.recordset.length > 0) {
        const timeoutSetting = timeoutResult.recordset.find(s => s.SettingKey === 'session_timeout_minutes');
        if (timeoutSetting) {
          sessionTimeoutMinutes = parseInt(timeoutSetting.SettingValue) || 60;
        }
      }
    } catch (e) { /* use default */ }
    
    const token = jwt.sign(
      { id: user.UserID, email: user.Email, isVendor: user.IsVendor, isAdmin: user.IsAdmin },
      process.env.JWT_SECRET,
      { expiresIn: `${sessionTimeoutMinutes}m` }
    );
    // Log successful login
    try {
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'Unknown';
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const device = userAgent.includes('Mobile') ? 'Mobile' : (userAgent.includes('Chrome') ? 'Chrome' : (userAgent.includes('Firefox') ? 'Firefox' : 'Browser'));
      
      await pool.request()
        .input('userId', sql.Int, user.UserID)
        .input('email', sql.NVarChar, user.Email)
        .input('action', sql.NVarChar, 'Login')
        .input('ActionStatus', sql.NVarChar, 'Success')
        .input('ipAddress', sql.NVarChar, ipAddress)
        .input('userAgent', sql.NVarChar, userAgent)
        .input('device', sql.NVarChar, device)
        .input('details', sql.NVarChar, user.IsAdmin ? 'Admin login' : (user.IsVendor ? 'Vendor login' : 'Client login'))
        .execute('users.sp_InsertSecurityLog');
    } catch (logErr) { 
      console.error('❌ Failed to log security event:', logErr.message); 
      console.error('Full error:', logErr);
    }
    
    // Update LastLogin
    try {
      await pool.request()
        .input('userId', sql.Int, user.UserID)
        .execute('users.sp_UpdateLastLogin');
    } catch (updateErr) { console.error('Failed to update LastLogin:', updateErr.message); }
    
    res.json({
      success: true,
      userId: user.UserID,
      firstName: user.FirstName,
      lastName: user.LastName,
      email: user.Email,
      isVendor: user.IsVendor,
      isAdmin: user.IsAdmin,
      vendorProfileId: user.VendorProfileID || null,
      token
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: err.message
    });
  }
});

router.post('/login/verify-2fa', async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ success: false, message: 'Missing token or code' });
    }
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    if (decoded.purpose !== 'login_2fa') {
      return res.status(400).json({ success: false, message: 'Invalid token purpose' });
    }
    const pool = await poolPromise;
    const now = new Date();
    const rec = await pool.request()
      .input('UserID', sql.Int, decoded.id)
      .input('Purpose', sql.NVarChar(50), 'login')
      .execute('users.sp_Get2FACode');
    if (rec.recordset.length === 0) {
      return res.status(400).json({ success: false, message: 'No verification code found' });
    }
    const row = rec.recordset[0];
    if (new Date(row.ExpiresAt) < now) {
      return res.status(400).json({ success: false, message: 'Code expired' });
    }
    if (row.Attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many attempts' });
    }
    const ok = await bcrypt.compare(String(code).trim(), row.CodeHash);
    if (!ok) {
      await pool.request()
        .input('CodeID', sql.Int, row.CodeID)
        .execute('users.sp_Increment2FAAttempts');
      return res.status(400).json({ success: false, message: 'Invalid code' });
    }
    await pool.request()
      .input('CodeID', sql.Int, row.CodeID)
      .execute('users.sp_Mark2FAUsed');
    const ures = await pool.request()
      .input('UserID', sql.Int, decoded.id)
      .execute('users.sp_GetById');
    if (ures.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const u = ures.recordset[0];
    
    // Get session timeout from security settings
    let sessionTimeoutMinutes = 60; // default 1 hour
    try {
      const timeoutResult = await pool.request().execute('users.sp_CheckSecuritySettings');
      if (timeoutResult.recordset && timeoutResult.recordset.length > 0) {
        const timeoutSetting = timeoutResult.recordset.find(s => s.SettingKey === 'session_timeout_minutes');
        if (timeoutSetting) {
          sessionTimeoutMinutes = parseInt(timeoutSetting.SettingValue) || 60;
        }
      }
    } catch (e) { /* use default */ }
    
    const token = jwt.sign(
      { id: u.UserID, email: u.Email, isVendor: u.IsVendor, isAdmin: u.IsAdmin },
      process.env.JWT_SECRET,
      { expiresIn: `${sessionTimeoutMinutes}m` }
    );
    res.json({ success: true, userId: u.UserID, name: u.Name, email: u.Email, isVendor: u.IsVendor, isAdmin: u.IsAdmin, vendorProfileId: u.VendorProfileID || null, token });
  } catch (err) {
    console.error('Verify 2FA error:', err);
    res.status(500).json({ success: false, message: 'Verification failed', error: err.message });
  }
});

router.post('/login/resend-2fa', async (req, res) => {
  try {
    const { tempToken } = req.body;
    if (!tempToken) return res.status(400).json({ success: false, message: 'Missing token' });
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    if (decoded.purpose !== 'login_2fa') {
      return res.status(400).json({ success: false, message: 'Invalid token purpose' });
    }
    const pool = await poolPromise;
    const raw = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(raw, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pool.request()
      .input('UserID', sql.Int, decoded.id)
      .input('CodeHash', sql.NVarChar(255), codeHash)
      .input('Purpose', sql.NVarChar(50), 'login')
      .input('ExpiresAt', sql.DateTime, expiresAt)
      .execute('users.sp_Insert2FACode');
    try { await sendTwoFactorCode(decoded.email, raw); } catch (e) { console.error('2FA email error:', e.message); }
    res.json({ success: true, message: 'Verification code resent' });
  } catch (err) {
    console.error('Resend 2FA error:', err);
    res.status(500).json({ success: false, message: 'Resend failed', error: err.message });
  }
});

// NEW: Endpoint for social login with account type selection
router.post('/social-login', async (req, res) => {
  try {
    const { email, name, authProvider, avatar, isVendor = false, accountType } = req.body;

    if (!email || !name || !authProvider) {
      return res.status(400).json({
        success: false,
        message: 'Email, name, and authProvider are required.'
      });
    }

    // Convert accountType to isVendor boolean if provided
    const isVendorFlag = accountType === 'vendor' || isVendor;

    const pool = await poolPromise;
    const request = pool.request();
    request.input('Email', sql.NVarChar(100), email.toLowerCase().trim());
    // Split name into FirstName and LastName
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    request.input('FirstName', sql.NVarChar(100), firstName);
    request.input('LastName', sql.NVarChar(100), lastName);
    request.input('AuthProvider', sql.NVarChar(20), authProvider);
    request.input('ProfileImageURL', sql.NVarChar(255), avatar || '');
    request.input('IsVendor', sql.Bit, isVendorFlag);

    const result = await request.execute('users.sp_RegisterSocialUser');
    const user = result.recordset[0];

    if (!user) {
      throw new Error('Failed to create or retrieve user from social login.');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.UserID, email: user.Email, isVendor: user.IsVendor, isAdmin: user.IsAdmin || false },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      userId: user.UserID,
      name: user.Name,
      email: user.Email,
      isVendor: user.IsVendor,
      isAdmin: user.IsAdmin || false,
      isNewUser: user.IsNewUser || false,  // Return whether this is a new user
      vendorProfileId: user.VendorProfileID || null,
      authProvider: authProvider,  // Return the auth provider (google, facebook, etc.)
      profilePicture: avatar || user.ProfileImageURL || null,
      token
    });

  } catch (err) {
    console.error('Social login error:', err);
    res.status(500).json({
      success: false,
      message: 'Social login failed',
      error: err.message
    });
  }
});

// Check if email exists (for Google Sign-In flow)
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    request.input('Email', sql.NVarChar(100), email.toLowerCase().trim());

    const result = await request.execute('users.sp_CheckEmail');

    if (result.recordset.length > 0) {
      res.json({
        success: true,
        exists: true,
        isVendor: result.recordset[0].IsVendor
      });
    } else {
      res.json({
        success: true,
        exists: false
      });
    }

  } catch (err) {
    console.error('Check email error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to check email',
      error: err.message
    });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, decoded.id);

    const result = await request.execute('users.sp_GetMe');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.recordset[0];
    
    // If avatar is null, create initials from name or email
    if (!user.avatar) {
      user.avatar = (user.name || user.email.split('@')[0])[0].toUpperCase();
    }

    res.json({
      success: true,
      ...user
    });

  } catch (err) {
    console.error('Get user error:', err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: err.message
    });
  }
});

// Get user dashboard
router.get('/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));

    const result = await request.execute('users.sp_GetUserDashboard');
    
    if (!result.recordsets[0] || result.recordsets[0].length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fix date serialization for upcomingBookings
    const upcomingBookings = (result.recordsets[1] || []).map(booking => ({
      ...booking,
      EventDate: booking.EventDate instanceof Date ? booking.EventDate.toISOString() : booking.EventDate,
      EndDate: booking.EndDate instanceof Date ? booking.EndDate.toISOString() : booking.EndDate,
      CreatedAt: booking.CreatedAt instanceof Date ? booking.CreatedAt.toISOString() : booking.CreatedAt,
      UpdatedAt: booking.UpdatedAt instanceof Date ? booking.UpdatedAt.toISOString() : booking.UpdatedAt
    }));

    const dashboard = {
      success: true,
      user: result.recordsets[0][0],
      upcomingBookings: upcomingBookings,
      recentFavorites: result.recordsets[2] || [],
      unreadMessages: result.recordsets[3]?.[0]?.UnreadMessages || 0,
      unreadNotifications: result.recordsets[4]?.[0]?.UnreadNotifications || 0
    };

    res.json(dashboard);

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard',
      error: err.message
    });
  }
});

// Get all bookings for a user (unified view with consistent status)
router.get('/:id/bookings/all', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query; // Optional filter: 'pending', 'upcoming', 'completed', 'cancelled', 'declined'
    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));
    request.input('StatusFilter', sql.NVarChar(50), status || null);
    
    // Use unified stored procedure for consistent status handling
    const result = await request.execute('users.sp_GetUnifiedBookings');
    
    // Get vendor timezones for each booking
    const tzMap = {
      'America/Toronto': 'EST',
      'America/New_York': 'EST',
      'America/Chicago': 'CST',
      'America/Denver': 'MST',
      'America/Los_Angeles': 'PST',
      'America/Vancouver': 'PST',
      'America/Edmonton': 'MST',
      'America/Winnipeg': 'CST',
      'America/Halifax': 'AST',
      'America/St_Johns': 'NST'
    };
    
    // Fix date serialization - convert Date objects to ISO strings and add vendor timezone
    // Fetch timezone from business hours for each vendor
    const bookingsWithTimezone = await Promise.all(result.recordset.map(async (booking) => {
      let vendorTimezone = 'EST';
      
      if (booking.VendorProfileID) {
        try {
          const tzRequest = pool.request();
          tzRequest.input('VendorProfileID', sql.Int, booking.VendorProfileID);
          const tzResult = await tzRequest.execute('vendors.sp_GetBusinessHours');
          if (tzResult.recordset && tzResult.recordset.length > 0 && tzResult.recordset[0].Timezone) {
            const tz = tzResult.recordset[0].Timezone;
            vendorTimezone = tzMap[tz] || tz;
          }
        } catch (tzErr) {
          // Use default timezone on error
        }
      }
      
      return {
        ...booking,
        EventDate: booking.EventDate instanceof Date ? booking.EventDate.toISOString() : booking.EventDate,
        EndDate: booking.EndDate instanceof Date ? booking.EndDate.toISOString() : booking.EndDate,
        CreatedAt: booking.CreatedAt instanceof Date ? booking.CreatedAt.toISOString() : booking.CreatedAt,
        UpdatedAt: booking.UpdatedAt instanceof Date ? booking.UpdatedAt.toISOString() : booking.UpdatedAt,
        ExpiresAt: booking.ExpiresAt instanceof Date ? booking.ExpiresAt.toISOString() : booking.ExpiresAt,
        CancellationDate: booking.CancellationDate instanceof Date ? booking.CancellationDate.toISOString() : booking.CancellationDate,
        Timezone: booking.Timezone || vendorTimezone
      };
    }));
    
    res.json(bookingsWithTimezone);
  } catch (err) {
    console.error('Get all user bookings error:', err);
    res.status(500).json({ message: 'Failed to get user bookings', error: err.message });
  }
});

// Get all reviews by a user
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));
    const result = await request.execute('users.sp_GetUserReviews');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get user reviews error:', err);
    res.status(500).json({ message: 'Failed to get user reviews', error: err.message });
  }
});

// Get user profile (alias for profile-details)
router.get('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));
    const result = await request.execute('users.sp_GetUserProfileDetails');
    if (result.recordset.length > 0) {
      res.json({ success: true, profile: result.recordset[0] });
    } else {
      res.status(404).json({ success: false, message: 'User profile not found' });
    }
  } catch (err) {
    console.error('Get user profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to get user profile', error: err.message });
  }
});

// Get user's vendor profile
router.get('/:id/vendor-profile', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));
    const result = await request.execute('vendors.sp_GetVendorProfileByUserId');
    if (result.recordset.length > 0) {
      res.json({ success: true, vendorProfile: result.recordset[0] });
    } else {
      res.status(404).json({ success: false, message: 'Vendor profile not found for this user' });
    }
  } catch (err) {
    console.error('Get user vendor profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to get vendor profile', error: err.message });
  }
});

// Get user profile details for editing
router.get('/:id/profile-details', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));
    const result = await request.execute('users.sp_GetUserProfileDetails');
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ message: 'User profile not found' });
    }
  } catch (err) {
    console.error('Get user profile details error:', err);
    res.status(500).json({ message: 'Failed to get user profile details', error: err.message });
  }
});

// Update user profile
router.put('/:id/profile-update', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, firstName, lastName, phone, bio, avatar } = req.body;
    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));
    // Support both name (legacy) and firstName/lastName
    let fName = firstName;
    let lName = lastName;
    if (!fName && name) {
      const nameParts = name.trim().split(' ');
      fName = nameParts[0] || '';
      lName = nameParts.slice(1).join(' ') || '';
    }
    request.input('FirstName', sql.NVarChar(100), fName || null);
    request.input('LastName', sql.NVarChar(100), lName || null);
    request.input('Phone', sql.NVarChar(20), phone || null);
    request.input('Bio', sql.NVarChar(sql.MAX), bio || null);
    request.input('ProfileImageURL', sql.NVarChar(255), avatar || null);
    await request.execute('users.sp_UpdateProfile');
    res.json({ success: true, message: 'User profile updated successfully' });
  } catch (err) {
    console.error('Update user profile error:', err);
    res.status(500).json({ message: 'Failed to update user profile', error: err.message });
  }
});

// Update user password
router.put('/:id/password-update', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));
    request.input('PasswordHash', sql.NVarChar(255), passwordHash);
    await request.execute('users.sp_UpdateUserPassword');
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Update user password error:', err);
    res.status(500).json({ message: 'Failed to update password', error: err.message });
  }
});

// Update user location
router.post('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, city, state, country } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // State/province is required for tax calculation
    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'Province/state is required for tax calculation'
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    // Use 0 as default for lat/lng if not provided
    const lat = latitude !== undefined && latitude !== null && !isNaN(latitude) ? parseFloat(latitude) : 0;
    const lng = longitude !== undefined && longitude !== null && !isNaN(longitude) ? parseFloat(longitude) : 0;
    
    request.input('UserID', sql.Int, parseInt(id));
    request.input('Latitude', sql.Decimal(10, 8), lat);
    request.input('Longitude', sql.Decimal(11, 8), lng);
    request.input('City', sql.NVarChar(100), city || null);
    request.input('State', sql.NVarChar(50), state || null);
    request.input('Country', sql.NVarChar(50), country || 'Canada');

    const result = await request.execute('users.sp_UpdateLocation');
    
    res.json({
      success: true,
      locationId: result.recordset?.[0]?.LocationID || null,
      message: 'Location updated successfully'
    });

  } catch (err) {
    console.error('Location update error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: err.message
    });
  }
});

// Get user notification preferences
router.get('/:id/notification-preferences', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));

    const result = await request.execute('users.sp_GetNotificationPrefs');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const prefs = result.recordset[0].NotificationPreferences;
    const defaultPrefs = {
      email: {
        bookingConfirmations: true,
        bookingReminders: true,
        bookingUpdates: true,
        messages: true,
        payments: true,
        promotions: false,
        newsletter: false
      },
      push: {
        enabled: true,
        messages: true,
        bookingUpdates: true
      }
    };
    
    let preferences = defaultPrefs;
    if (prefs) {
      try {
        const parsed = JSON.parse(prefs);
        preferences = {
          email: { ...defaultPrefs.email, ...parsed.email },
          push: { ...defaultPrefs.push, ...parsed.push }
        };
      } catch (e) {
        console.error('Error parsing preferences:', e);
      }
    }

    res.json({
      success: true,
      preferences
    });

  } catch (err) {
    console.error('Get notification preferences error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification preferences',
      error: err.message
    });
  }
});

// Update user notification preferences
router.put('/:id/notification-preferences', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, push } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Build preferences object with all email categories
    const preferences = {
      email: {
        bookingConfirmations: email?.bookingConfirmations ?? true,
        bookingReminders: email?.bookingReminders ?? true,
        bookingUpdates: email?.bookingUpdates ?? true,
        messages: email?.messages ?? true,
        payments: email?.payments ?? true,
        promotions: email?.promotions ?? false,
        newsletter: email?.newsletter ?? false
      },
      push: {
        enabled: push?.enabled ?? true,
        messages: push?.messages ?? true,
        bookingUpdates: push?.bookingUpdates ?? true
      }
    };

    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));
    request.input('Preferences', sql.NVarChar(sql.MAX), JSON.stringify(preferences));

    await request.execute('users.sp_UpdateNotificationPrefs');

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences
    });

  } catch (err) {
    console.error('Update notification preferences error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: err.message
    });
  }
});

// Upload profile picture
router.post('/:id/profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
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
      folder: 'venuevue/profile-pictures',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' }
      ]
    });

    const profilePictureUrl = uploadResult.secure_url;

    // Update user profile image in database
    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));
    request.input('ProfileImageURL', sql.NVarChar(255), profilePictureUrl);

    await request.execute('users.sp_UpdateProfileImage');

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePictureUrl: profilePictureUrl,
      url: profilePictureUrl
    });

  } catch (err) {
    console.error('Profile picture upload error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
      error: err.message
    });
  }
});

// Get user by ID (with profile picture)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));

    const result = await request.execute('users.sp_GetProfile');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.recordset[0];
    
    res.json({
      success: true,
      FirstName: user.Name ? user.Name.split(' ')[0] : '',
      LastName: user.Name ? user.Name.split(' ').slice(1).join(' ') : '',
      Email: user.Email,
      Phone: user.Phone,
      ProfilePicture: user.ProfileImageURL,
      IsVendor: user.IsVendor,
      IsActive: user.IsActive,
      CreatedAt: user.CreatedAt
    });

  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: err.message
    });
  }
});

// Update user (including profile picture and location)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, city, province, country, currentPassword, newPassword } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const pool = await poolPromise;

    // If password change is requested, verify current password
    if (newPassword && currentPassword) {
      const checkRequest = pool.request();
      checkRequest.input('UserID', sql.Int, parseInt(id));
      const userResult = await checkRequest.execute('users.sp_GetPasswordHash');

      if (userResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, userResult.recordset[0].PasswordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      const passwordRequest = pool.request();
      passwordRequest.input('UserID', sql.Int, parseInt(id));
      passwordRequest.input('PasswordHash', sql.NVarChar(255), passwordHash);
      await passwordRequest.execute('users.sp_UpdatePassword');
    }

    // Update user profile
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));
    request.input('FirstName', sql.NVarChar(100), firstName || '');
    request.input('LastName', sql.NVarChar(100), lastName || null);
    request.input('Phone', sql.NVarChar(20), phone || null);

    await request.execute('users.sp_UpdateProfile');

    // Update user location if provided
    if (province) {
      const locationRequest = pool.request();
      locationRequest.input('UserID', sql.Int, parseInt(id));
      locationRequest.input('Latitude', sql.Decimal(10, 8), 0);
      locationRequest.input('Longitude', sql.Decimal(11, 8), 0);
      locationRequest.input('City', sql.NVarChar(100), city || null);
      locationRequest.input('State', sql.NVarChar(50), province || null);
      locationRequest.input('Country', sql.NVarChar(50), country || 'Canada');

      await locationRequest.execute('users.sp_UpdateUserLocation');
    }

    res.json({
      success: true,
      message: 'User profile updated successfully'
    });

  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: err.message
    });
  }
});

// ============================================
// USER FAVORITES ENDPOINTS
// (Merged from favorites.js)
// ============================================

// POST /api/users/favorites/toggle - Toggle favorite status
router.post('/favorites/toggle', async (req, res) => {
  try {
    const { userId, vendorProfileId } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, userId);
    request.input('VendorProfileID', sql.Int, vendorProfileId);

    const result = await request.execute('users.sp_ToggleFavorite');
    
    res.json(result.recordset[0]);

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

// GET /api/users/favorites/user/:userId - Get user favorites with complete vendor data
router.get('/favorites/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, userId);

    // Get favorites using stored procedure
    const result = await request.execute('users.sp_GetFavorites');
    
    res.json(result.recordset);

  } catch (err) {
    console.error('Database error:', err);
    // Return empty array on error instead of 500
    res.json([]);
  }
});

// ============================================
// ONLINE STATUS ENDPOINTS
// ============================================

// POST /api/users/heartbeat - Update user's last active timestamp (called periodically by frontend)
router.post('/heartbeat', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const pool = await poolPromise;
    await pool.request()
      .input('UserID', sql.Int, userId)
      .execute('users.sp_UpdateLastActive');

    res.json({ success: true });
  } catch (err) {
    // Silently fail for heartbeat - don't log errors for expired tokens
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false });
    }
    res.json({ success: false });
  }
});

// GET /api/users/online-status/:userId - Get online status for a single user
router.get('/online-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, parseInt(userId))
      .execute('users.sp_GetOnlineStatus');

    if (result.recordset.length === 0) {
      return res.json({ 
        success: true, 
        isOnline: false, 
        lastActiveAt: null,
        lastActiveText: 'Never'
      });
    }

    const user = result.recordset[0];
    res.json({
      success: true,
      userId: user.UserID,
      isOnline: user.IsOnline === 1,
      lastActiveAt: user.LastActiveAt,
      lastActiveText: formatLastActive(user.MinutesAgo, user.IsOnline)
    });
  } catch (err) {
    console.error('Get online status error:', err);
    res.json({ success: false, isOnline: false, lastActiveAt: null });
  }
});

// POST /api/users/online-status/batch - Get online status for multiple users
router.post('/online-status/batch', async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'userIds array is required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserIDs', sql.NVarChar(sql.MAX), userIds.join(','))
      .execute('users.sp_GetOnlineStatus');

    const statusMap = {};
    result.recordset.forEach(user => {
      statusMap[user.UserID] = {
        isOnline: user.IsOnline === 1,
        lastActiveAt: user.LastActiveAt,
        lastActiveText: formatLastActive(user.MinutesAgo, user.IsOnline)
      };
    });

    res.json({ success: true, statuses: statusMap });
  } catch (err) {
    console.error('Get batch online status error:', err);
    res.json({ success: false, statuses: {} });
  }
});

// Helper function to format last active time
function formatLastActive(minutesAgo, isOnline) {
  if (isOnline === 1 || minutesAgo === 'Online') return 'Online';
  if (minutesAgo === null || minutesAgo === undefined) return 'Never';
  
  const mins = parseInt(minutesAgo);
  if (isNaN(mins)) return 'Offline';
  
  if (mins < 60) return `Active ${mins} min ago`;
  if (mins < 1440) { // Less than 24 hours
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

// Unsubscribe from emails via token (no auth required) - API endpoint
router.get('/unsubscribe/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { category } = req.query;
    
    const result = await processUnsubscribe(token, category);
    const html = generateUnsubscribeHtml(result.success, result.email, category);
    
    res.send(html);
  } catch (err) {
    console.error('Unsubscribe error:', err);
    const html = generateUnsubscribeHtml(false, null, null);
    res.status(500).send(html);
  }
});

// Get preferences via token (no auth required) - for email preferences page
router.get('/email-preferences/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = verifyUnsubscribeToken(token);
    
    if (!decoded) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    
    const preferences = await getUserPreferences(decoded.userId);
    res.json({ success: true, preferences, email: decoded.email });
  } catch (err) {
    console.error('Get preferences error:', err);
    res.status(500).json({ success: false, message: 'Failed to get preferences' });
  }
});

// Update preferences via token (no auth required) - for email preferences page
router.put('/email-preferences/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { preferences } = req.body;
    
    const decoded = verifyUnsubscribeToken(token);
    if (!decoded) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    
    const success = await updateUserPreferences(decoded.userId, preferences);
    if (success) {
      res.json({ success: true, message: 'Preferences updated successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to update preferences' });
    }
  } catch (err) {
    console.error('Update preferences error:', err);
    res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
});

// Resubscribe to emails via token (no auth required)
router.post('/resubscribe/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = verifyUnsubscribeToken(token);
    
    if (!decoded) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    
    const result = await resubscribeUser(decoded.userId);
    if (result.success) {
      res.json({ success: true, message: 'Successfully resubscribed to emails', preferences: result.preferences });
    } else {
      res.status(500).json({ success: false, message: 'Failed to resubscribe' });
    }
  } catch (err) {
    console.error('Resubscribe error:', err);
    res.status(500).json({ success: false, message: 'Failed to resubscribe' });
  }
});

// ==================== PASSWORD RESET ====================

/**
 * Generate a password reset token
 */
function generatePasswordResetToken(userId, email) {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const payload = { userId, email, purpose: 'password-reset' };
  return jwt.sign(payload, secret, { expiresIn: '1h' }); // 1 hour expiry for security
}

/**
 * Verify a password reset token
 */
function verifyPasswordResetToken(token) {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret);
    if (decoded.purpose !== 'password-reset') {
      return null;
    }
    return decoded;
  } catch (error) {
    console.error('[PasswordReset] Token verification failed:', error.message);
    return null;
  }
}

/**
 * Get password reset URL
 */
function getPasswordResetUrl(userId, email) {
  const token = generatePasswordResetToken(userId, email);
  // ALWAYS use production URL for email links
  const frontendUrl = 'https://www.planbeau.com';
  return `${frontendUrl}/reset-password/${token}`;
}

// POST /users/forgot-password - Request password reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }
    
    const pool = await poolPromise;
    
    // Check if user exists
    const userResult = await pool.request()
      .input('Email', sql.NVarChar, email.toLowerCase())
      .query('SELECT UserID, Name, Email FROM users.Users WHERE Email = @Email');
    
    // Always return success to prevent email enumeration attacks
    if (userResult.recordset.length === 0) {
      return res.json({ success: true, message: 'If an account exists with this email, a password reset link will be sent.' });
    }
    
    const user = userResult.recordset[0];
    const resetUrl = getPasswordResetUrl(user.UserID, user.Email);
    
    // Send password reset email
    // Signature: sendTemplatedEmail(templateKey, recipientEmail, recipientName, variables, userId, bookingId, metadata, emailCategory)
    try {
      await sendTemplatedEmail(
        'password_reset',           // templateKey
        user.Email,                 // recipientEmail
        user.Name || 'User',        // recipientName
        {                           // variables
          userName: user.Name || 'User',
          resetUrl: resetUrl,
          expiryTime: '1 hour'
        },
        user.UserID,                // userId
        null,                       // bookingId
        null,                       // metadata
        'account'                   // emailCategory (account-related emails)
      );
      console.log('[PasswordReset] Email sent successfully to:', user.Email);
    } catch (emailErr) {
      console.error('[PasswordReset] Failed to send email:', emailErr.message, emailErr.stack);
    }
    
    // Log the password reset request
    await pool.request()
      .input('userId', sql.Int, user.UserID)
      .input('email', sql.NVarChar, user.Email)
      .input('action', sql.NVarChar, 'PasswordResetRequested')
      .input('ActionStatus', sql.NVarChar, 'Success')
      .input('ipAddress', sql.NVarChar, req.ip || 'Unknown')
      .input('userAgent', sql.NVarChar, req.headers['user-agent'] || 'Unknown')
      .input('details', sql.NVarChar, 'Password reset email sent')
      .execute('users.sp_InsertSecurityLog');
    
    res.json({ success: true, message: 'If an account exists with this email, a password reset link will be sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

// GET /users/reset-password/verify/:token - Verify reset token is valid
router.get('/reset-password/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = verifyPasswordResetToken(token);
    
    if (!decoded) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
    }
    
    // Verify user still exists
    const pool = await poolPromise;
    const userResult = await pool.request()
      .input('UserID', sql.Int, decoded.userId)
      .query('SELECT Email FROM users.Users WHERE UserID = @UserID');
    
    if (userResult.recordset.length === 0) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, email: decoded.email });
  } catch (err) {
    console.error('Verify reset token error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify token' });
  }
});

// POST /users/reset-password/complete/:token - Complete password reset
router.post('/reset-password/complete/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    
    // Verify token
    const decoded = verifyPasswordResetToken(token);
    if (!decoded) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
    }
    
    // Validate password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    
    const pool = await poolPromise;
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password and clear any lockout
    await pool.request()
      .input('UserID', sql.Int, decoded.userId)
      .input('PasswordHash', sql.NVarChar(255), hashedPassword)
      .query(`
        UPDATE users.Users 
        SET PasswordHash = @PasswordHash,
            FailedLoginAttempts = 0,
            IsLocked = 0,
            LockExpiresAt = NULL,
            LockReason = NULL,
            UpdatedAt = GETUTCDATE()
        WHERE UserID = @UserID
      `);
    
    // Log the password reset
    await pool.request()
      .input('userId', sql.Int, decoded.userId)
      .input('email', sql.NVarChar, decoded.email)
      .input('action', sql.NVarChar, 'PasswordResetCompleted')
      .input('ActionStatus', sql.NVarChar, 'Success')
      .input('ipAddress', sql.NVarChar, req.ip || 'Unknown')
      .input('userAgent', sql.NVarChar, req.headers['user-agent'] || 'Unknown')
      .input('details', sql.NVarChar, 'Password reset completed via email link')
      .execute('users.sp_InsertSecurityLog');
    
    // Send confirmation email
    try {
      await sendTemplatedEmail(decoded.email, 'password_changed', {
        userName: decoded.email.split('@')[0]
      });
    } catch (emailErr) {
      console.error('Failed to send password changed confirmation:', emailErr.message);
    }
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Complete password reset error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// Delete account (soft delete)
router.delete('/:userId/delete-account', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, password } = req.body;
    
    // Verify the user is deleting their own account (from auth token)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization required' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (String(decoded.id) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own account' });
    }
    
    const pool = await poolPromise;
    
    // Verify password before deletion
    const userResult = await pool.request()
      .input('UserID', sql.Int, userId)
      .query('SELECT PasswordHash FROM users.Users WHERE UserID = @UserID');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const isMatch = await bcrypt.compare(password, userResult.recordset[0].PasswordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
    
    // Perform soft delete
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .input('Reason', sql.NVarChar(500), reason || 'User requested account deletion')
      .execute('users.sp_SoftDeleteUser');
    
    if (result.recordset && result.recordset[0].Success) {
      // Log the deletion
      try {
        await pool.request()
          .input('userId', sql.Int, userId)
          .input('email', sql.NVarChar, decoded.email)
          .input('action', sql.NVarChar, 'AccountDeleted')
          .input('ActionStatus', sql.NVarChar, 'Success')
          .input('ipAddress', sql.NVarChar, req.ip || 'Unknown')
          .input('userAgent', sql.NVarChar, req.headers['user-agent'] || 'Unknown')
          .input('details', sql.NVarChar, reason || 'User requested account deletion')
          .execute('users.sp_InsertSecurityLog');
      } catch (logErr) { console.error('Failed to log deletion:', logErr.message); }
      
      res.json({ success: true, message: 'Account deleted successfully' });
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.recordset?.[0]?.Message || 'Failed to delete account' 
      });
    }
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
});

// Admin: Restore deleted account
router.post('/:userId/restore-account', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify admin
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization required' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const pool = await poolPromise;
    
    // Check if requester is admin
    const adminCheck = await pool.request()
      .input('UserID', sql.Int, decoded.id)
      .query('SELECT IsAdmin FROM users.Users WHERE UserID = @UserID');
    
    if (!adminCheck.recordset[0]?.IsAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    // Restore the account
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .execute('users.sp_RestoreUser');
    
    if (result.recordset && result.recordset[0].Success) {
      res.json({ success: true, message: 'Account restored successfully' });
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.recordset?.[0]?.Message || 'Failed to restore account' 
      });
    }
  } catch (err) {
    console.error('Restore account error:', err);
    res.status(500).json({ success: false, message: 'Failed to restore account' });
  }
});

// ============================================================
// COOKIE CONSENT
// ============================================================

// POST /users/cookie-consent - Save cookie consent preferences
router.post('/cookie-consent', async (req, res) => {
  try {
    const { 
      userId, 
      sessionId, 
      necessary = true, 
      analytics = false, 
      marketing = false, 
      functional = true 
    } = req.body;
    
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    const pool = await poolPromise;
    
    await pool.request()
      .input('UserID', sql.Int, userId || null)
      .input('SessionID', sql.NVarChar(100), sessionId || null)
      .input('IPAddress', sql.NVarChar(50), ipAddress)
      .input('NecessaryCookies', sql.Bit, necessary ? 1 : 0)
      .input('AnalyticsCookies', sql.Bit, analytics ? 1 : 0)
      .input('MarketingCookies', sql.Bit, marketing ? 1 : 0)
      .input('FunctionalCookies', sql.Bit, functional ? 1 : 0)
      .input('UserAgent', sql.NVarChar(500), userAgent)
      .execute('users.sp_SaveCookieConsent');
    
    res.json({ success: true, message: 'Cookie consent saved' });
  } catch (error) {
    console.error('Error saving cookie consent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
