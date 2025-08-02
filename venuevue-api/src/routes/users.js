const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import authentication middleware (ensure this exports a function)
const authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

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
router.get('/:id', authenticate, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, req.params.id)
      .execute('sp_User_GetProfile');
      
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

module.exports = router;
