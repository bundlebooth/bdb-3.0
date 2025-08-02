const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Email', sql.NVarChar(255), email)
      .input('PasswordHash', sql.NVarChar(255), hashedPassword)
      .input('FirstName', sql.NVarChar(100), firstName)
      .input('LastName', sql.NVarChar(100), lastName)
      .output('UserID', sql.Int)
      .execute('sp_User_Create');
      
    const userId = result.output.UserID;
    
    // Generate JWT token
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.status(201).json({ userId, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Email', sql.NVarChar(255), email)
      .input('PasswordHash', sql.NVarChar(255), password)
      .execute('sp_User_Authenticate');
      
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.recordset[0];
    
    // Generate JWT token
    const token = jwt.sign({ id: user.UserID }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
