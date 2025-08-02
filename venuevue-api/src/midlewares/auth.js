const jwt = require('jsonwebtoken');
const { poolPromise } = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists
    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, decoded.id)
      .query('SELECT UserID FROM Users WHERE UserID = @UserID');
      
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Please authenticate', error: err.message });
  }
};

module.exports = { authenticate };
