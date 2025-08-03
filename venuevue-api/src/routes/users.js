const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to validate email format
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// User registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, isVendor = false } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Name, email, and password are required' 
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long' 
      });
    }

    // Hash password
    let passwordHash;
    try {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    } catch (hashError) {
      console.error('Password hashing error:', hashError);
      return res.status(500).json({ 
        message: 'Error processing password' 
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('Name', sql.NVarChar(100), name.trim());
    request.input('Email', sql.NVarChar(100), email.toLowerCase().trim());
    request.input('PasswordHash', sql.NVarChar(255), passwordHash);
    request.input('IsVendor', sql.Bit, isVendor);
    request.input('AuthProvider', sql.NVarChar(20), 'email');

    const result = await request.execute('sp_RegisterUser');
    
    const userId = result.recordset[0].UserID;

    // Create JWT token
    const token = jwt.sign(
      { 
        id: userId, 
        email: email.toLowerCase().trim(), 
        isVendor 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({ 
      success: true,
      userId,
      name,
      email: email.toLowerCase().trim(),
      isVendor,
      token
    });

  } catch (err) {
    console.error('Registration error:', err);
    
    if (err.number === 2627) { // SQL Server duplicate key error
      return res.status(409).json({ 
        success: false,
        message: 'Email already exists' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Registration failed',
      error: err.message 
    });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
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

    // Check password
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.UserID, 
        email: user.Email, 
        isVendor: user.IsVendor 
      },
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

// Get user dashboard data
router.get('/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate user ID
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

// Update user location
router.post('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, city, state, country } = req.body;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false,
        message: 'Latitude and longitude are required' 
      });
    }

    // Validate user ID
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID' 
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('UserID', sql.Int, parseInt(id));
    request.input('Latitude', sql.Decimal(10, 8), latitude);
    request.input('Longitude', sql.Decimal(11, 8), longitude);
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
