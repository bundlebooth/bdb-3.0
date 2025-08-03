const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Get user notifications
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { unreadOnly } = req.query;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, userId);
    request.input('UnreadOnly', sql.Bit, unreadOnly === 'true' ? 1 : 0);
    request.input('Limit', sql.Int, 20);

    const result = await request.execute('sp_GetUserNotifications');
    
    res.json(result.recordset);

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

module.exports = router;
