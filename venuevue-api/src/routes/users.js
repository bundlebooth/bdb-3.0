const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import authentication middleware
const authenticate = require('../middlewares/auth');

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const pool = await poolPromise;
    const checkUser = await pool.request()
      .input('Email', sql.NVarChar(255), email)
      .query('SELECT UserID FROM Users WHERE Email = @Email');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const result = await pool.request()
      .input('Email', sql.NVarChar(255), email)
      .input('PasswordHash', sql.NVarChar(255), hashedPassword)
      .input('FirstName', sql.NVarChar(100), firstName)
      .input('LastName', sql.NVarChar(100), lastName)
      .output('UserID', sql.Int)
      .execute('sp_User_Create');
      
    const userId = result.output.UserID;
    
    // Generate JWT token
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { 
      expiresIn: '1h' 
    });
    
    res.status(201).json({ 
      userId, 
      token,
      message: 'User registered successfully' 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('Email', sql.NVarChar(255), email)
      .query('SELECT UserID, PasswordHash FROM Users WHERE Email = @Email');
      
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.recordset[0];
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user.UserID }, process.env.JWT_SECRET, { 
      expiresIn: '1h' 
    });
    
    res.json({ 
      userId: user.UserID,
      token,
      message: 'Login successful' 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get user profile
// Get user profile
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Validate user ID parameter
    const userId = parseInt(req.params.id);
    if (!userId || userId <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID' 
      });
    }

    // Verify the authenticated user can access this profile
    if (userId !== req.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized to access this profile' 
      });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .execute('sp_User_GetProfile');
      
    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Sanitize user data before sending (remove sensitive fields)
    const userProfile = result.recordset[0];
    const { PasswordHash, ResetToken, ...safeUserData } = userProfile;
    
    res.json({
      success: true,
      data: safeUserData
    });
    
  } catch (err) {
    console.error('Profile error:', err);
    
    // Handle specific database errors
    if (err.name === 'ConnectionError') {
      return res.status(503).json({ 
        success: false,
        message: 'Service unavailable' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
