const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, isVendor = false } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('Name', sql.NVarChar(100), name);
    request.input('Email', sql.NVarChar(100), email);
    request.input('PasswordHash', sql.NVarChar(255), passwordHash);
    request.input('IsVendor', sql.Bit, isVendor);

    const result = await request.execute('sp_RegisterUser');
    
    const userId = result.recordset[0].UserID;

    // Create JWT token
    const token = jwt.sign(
      { id: userId, email, isVendor },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({ 
      userId,
      token,
      isVendor
    });

  } catch (err) {
    console.error('Registration error:', err);
    
    if (err.number === 2627) { // SQL duplicate key error
      return res.status(409).json({ message: 'Email already exists' });
    }

    res.status(500).json({ 
      message: 'Registration failed',
      error: err.message 
    });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('Email', sql.NVarChar(100), email);

    const result = await request.query(`
      SELECT UserID, Name, Email, PasswordHash, IsVendor 
      FROM Users 
      WHERE Email = @Email
    `);
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.recordset[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.UserID, email: user.Email, isVendor: user.IsVendor },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ 
      userId: user.UserID,
      name: user.Name,
      email: user.Email,
      isVendor: user.IsVendor,
      token
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Login failed',
      error: err.message 
    });
  }
});

// Get user dashboard data
router.get('/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('UserID', sql.Int, id);

    const result = await request.execute('sp_GetUserDashboard');
    
    const dashboard = {
      user: result.recordsets[0][0],
      upcomingBookings: result.recordsets[1],
      recentFavorites: result.recordsets[2],
      unreadMessages: result.recordsets[3][0]?.UnreadMessages || 0,
      unreadNotifications: result.recordsets[4][0]?.UnreadNotifications || 0
    };

    res.json(dashboard);

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ 
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

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('UserID', sql.Int, id);
    request.input('Latitude', sql.Decimal(10, 8), latitude);
    request.input('Longitude', sql.Decimal(11, 8), longitude);
    request.input('City', sql.NVarChar(100), city || null);
    request.input('State', sql.NVarChar(50), state || null);
    request.input('Country', sql.NVarChar(50), country || null);

    const result = await request.execute('sp_UpdateUserLocation');
    
    res.json({ locationId: result.recordset[0].LocationID });

  } catch (err) {
    console.error('Location update error:', err);
    res.status(500).json({ 
      message: 'Failed to update location',
      error: err.message 
    });
  }
});

module.exports = router;
