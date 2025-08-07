const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    const { name, email, password, isVendor = false } = req.body;

    // Manual validation
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Name is required' 
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
    const emailCheck = await checkRequest.query(
      'SELECT 1 FROM Users WHERE Email = @Email'
    );

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
    request.input('Name', sql.NVarChar(100), name.trim());
    request.input('Email', sql.NVarChar(100), email.toLowerCase().trim());
    request.input('PasswordHash', sql.NVarChar(255), passwordHash);
    request.input('IsVendor', sql.Bit, isVendor);
    request.input('AuthProvider', sql.NVarChar(20), 'email');

    const result = await request.execute('sp_RegisterUser');
    const userId = result.recordset[0].UserID;

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email, isVendor },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      isVendor,
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

    const result = await request.query(`
      SELECT 
        UserID, 
        Name, 
        Email, 
        PasswordHash, 
        IsVendor,
        IsActive
      FROM Users 
      WHERE Email = @Email
    `);
    
    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.recordset[0];

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
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.UserID, email: user.Email, isVendor: user.IsVendor },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      userId: user.UserID,
      name: user.Name,
      email: user.Email,
      isVendor: user.IsVendor,
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

// NEW: Endpoint for social login
router.post('/social-login', async (req, res) => {
  try {
    const { email, name, authProvider, avatar } = req.body;

    if (!email || !name || !authProvider) {
      return res.status(400).json({
        success: false,
        message: 'Email, name, and authProvider are required.'
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    request.input('Email', sql.NVarChar(100), email);
    request.input('Name', sql.NVarChar(100), name);
    request.input('AuthProvider', sql.NVarChar(20), authProvider);
    request.input('Avatar', sql.NVarChar(255), avatar || null);

    const result = await request.execute('sp_RegisterSocialUser');
    const user = result.recordset[0];

    if (!user) {
      throw new Error('Failed to create or retrieve user from social login.');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.UserID, email: user.Email, isVendor: user.IsVendor },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      userId: user.UserID,
      name: user.Name,
      email: user.Email,
      isVendor: user.IsVendor,
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

    const result = await request.query(`
      SELECT 
        UserID as userId,
        Name as name,
        Email as email,
        Avatar as avatar,
        IsVendor as isVendor
      FROM Users 
      WHERE UserID = @UserID
    `);
    
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

    const result = await request.execute('sp_GetUserDashboard');
    
    if (!result.recordsets[0] || result.recordsets[0].length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const dashboard = {
      success: true,
      user: result.recordsets[0][0],
      upcomingBookings: result.recordsets[1] || [],
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

// Get all bookings for a user
router.get('/:id/bookings/all', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetUserBookingsAll');
    res.json(result.recordset);
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
    const result = await request.execute('sp_GetUserReviews');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get user reviews error:', err);
    res.status(500).json({ message: 'Failed to get user reviews', error: err.message });
  }
});

// Get user profile details for editing
router.get('/:id/profile-details', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetUserProfileDetails');
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
    const { name, phone, bio, avatar } = req.body;
    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, parseInt(id));
    request.input('Name', sql.NVarChar(100), name || null);
    request.input('Phone', sql.NVarChar(20), phone || null);
    request.input('Bio', sql.NVarChar(sql.MAX), bio || null);
    request.input('Avatar', sql.NVarChar(255), avatar || null);
    await request.execute('sp_UpdateUserProfile');
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
    await request.execute('sp_UpdateUserPassword');
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

    // Basic validation
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude are required'
      });
    }

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('UserID', sql.Int, parseInt(id));
    request.input('Latitude', sql.Decimal(10, 8), parseFloat(latitude));
    request.input('Longitude', sql.Decimal(11, 8), parseFloat(longitude));
    request.input('City', sql.NVarChar(100), city || null);
    request.input('State', sql.NVarChar(50), state || null);
    request.input('Country', sql.NVarChar(50), country || null);

    const result = await request.execute('sp_UpdateUserLocation');
    
    res.json({
      success: true,
      locationId: result.recordset[0].LocationID
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

module.exports = router;
