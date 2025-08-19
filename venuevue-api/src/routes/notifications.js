const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Create notification
router.post('/', async (req, res) => {
  try {
    const { userId, type, title, message, relatedId } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'userId, type, title, and message are required' 
      });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, userId);
    request.input('Type', sql.NVarChar(50), type);
    request.input('Title', sql.NVarChar(255), title);
    request.input('Message', sql.NVarChar(sql.MAX), message);
    request.input('RelatedID', sql.Int, relatedId || null);
    request.input('IsRead', sql.Bit, 0);
    request.input('CreatedAt', sql.DateTime, new Date());

    const result = await request.query(`
      INSERT INTO Notifications (UserID, Type, Title, Message, RelatedID, IsRead, CreatedAt)
      OUTPUT INSERTED.*
      VALUES (@UserID, @Type, @Title, @Message, @RelatedID, @IsRead, @CreatedAt)
    `);
    
    res.json({
      success: true,
      notification: result.recordset[0]
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create notification',
      error: err.message 
    });
  }
});

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
