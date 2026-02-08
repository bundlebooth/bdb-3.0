const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');

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

    const result = await request.execute('notifications.sp_Create');
    
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
    request.input('UnreadOnly', sql.Bit, unreadOnly === 'true' ? 1 : 0);
    request.input('Limit', sql.Int, parseInt(limit) || 50);

    const result = await request.execute('notifications.sp_GetUserNotifications');
    
    // Convert dates to ISO strings for proper JSON serialization
    const notifications = result.recordset.map(n => ({
      ...n,
      CreatedAt: n.CreatedAt ? new Date(n.CreatedAt).toISOString() : null,
      ReadAt: n.ReadAt ? new Date(n.ReadAt).toISOString() : null
    }));
    
    res.json({
      success: true,
      notifications: notifications,
      count: notifications.length
    });

  } catch (err) {
    console.error('Database error:', err);
    // Return empty notifications on error instead of 500
    res.json({ 
      success: true,
      notifications: [],
      count: 0
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

    await request.execute('notifications.sp_MarkRead');
    
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

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('UserID', sql.Int, parseInt(userId, 10));

    await request.execute('notifications.sp_MarkAllRead');

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notifications as read' });
  }
});

// Get unread notification count for a user
router.get('/user/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, userId);

    const result = await request.execute('notifications.sp_GetUnreadCount');
    
    res.json({
      success: true,
      unreadCount: result.recordset[0]?.unreadCount || 0
    });

  } catch (err) {
    console.error('Database error:', err);
    // Return 0 unread count on error instead of 500
    res.json({ 
      success: true,
      unreadCount: 0
    });
  }
});

module.exports = router;
