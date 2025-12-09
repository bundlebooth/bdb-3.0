const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { poolPromise } = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists and get admin status
    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, decoded.id)
      .query('SELECT UserID, IsAdmin, IsVendor FROM Users WHERE UserID = @UserID');
      
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    const user = result.recordset[0];
    
    req.user = { 
      id: decoded.id,
      userId: decoded.id, // Add userId for compatibility
      email: decoded.email,
      isVendor: decoded.isVendor || user.IsVendor,
      isAdmin: user.IsAdmin || false
    };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Please authenticate', error: err.message });
  }
};

// Alias for authenticate (used by some routes)
const authenticateToken = authenticate;

// Middleware to require admin privileges
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { authenticate, authenticateToken, requireAdmin };
