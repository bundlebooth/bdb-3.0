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
    const { unreadOnly, limit = 50 } = req.query;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, userId);
    
    let query = `
      SELECT 
        NotificationID,
        UserID,
        Title,
        Message,
        Type,
        IsRead,
        ReadAt,
        RelatedID,
        RelatedType,
        ActionURL,
        CreatedAt
      FROM Notifications 
      WHERE UserID = @UserID
    `;
    
    if (unreadOnly === 'true') {
      query += ' AND IsRead = 0';
    }
    
    query += ' ORDER BY CreatedAt DESC';
    
    if (limit) {
      request.input('Limit', sql.Int, parseInt(limit));
      query = `SELECT TOP (@Limit) * FROM (${query}) AS SubQuery`;
    }

    const result = await request.query(query);
    
    res.json({
      success: true,
      notifications: result.recordset,
      count: result.recordset.length
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('NotificationID', sql.Int, notificationId);
    request.input('ReadAt', sql.DateTime, new Date());

    const result = await request.query(`
      UPDATE Notifications 
      SET IsRead = 1, ReadAt = @ReadAt
      WHERE NotificationID = @NotificationID
    `);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to mark notification as read',
      error: err.message 
    });
  }
});

// Mark all notifications as read for a user
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
        
    const pool = await sql.connect();
    await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
            UPDATE Notifications 
            SET IsRead = 1, ReadAt = GETDATE()
            WHERE UserID = @userId AND IsRead = 0
        `);
        
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Get unread notification count for a user
router.get('/user/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, userId);

    const result = await request.query(`
      SELECT COUNT(*) as unreadCount
      FROM Notifications 
      WHERE UserID = @UserID AND IsRead = 0
    `);
    
    res.json({
      success: true,
      unreadCount: result.recordset[0].unreadCount
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get unread count',
      error: err.message 
    });
  }
});

module.exports = router;
