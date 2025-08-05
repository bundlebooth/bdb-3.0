const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Get conversation messages
router.get('/conversation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('ConversationID', sql.Int, id);
    request.input('UserID', sql.Int, userId);

    const result = await request.execute('sp_GetConversationMessages');
    
    res.json(result.recordset);

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

// Send message
router.post('/', async (req, res) => {
  try {
    const { conversationId, senderId, content, attachment } = req.body;

    if (!conversationId || !senderId || !content) {
      return res.status(400).json({ message: 'conversationId, senderId, and content are required' });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('ConversationID', sql.Int, conversationId);
    request.input('SenderID', sql.Int, senderId);
    request.input('Content', sql.NVarChar(sql.MAX), content);
    
    // Handle optional attachment
    if (attachment) {
      request.input('AttachmentURL', sql.NVarChar(255), attachment.url);
      request.input('AttachmentType', sql.NVarChar(50), attachment.type);
      request.input('AttachmentSize', sql.Int, attachment.size);
      request.input('AttachmentName', sql.NVarChar(255), attachment.name);
    } else {
      request.input('AttachmentURL', sql.NVarChar(255), null);
      request.input('AttachmentType', sql.NVarChar(50), null);
      request.input('AttachmentSize', sql.Int, null);
      request.input('AttachmentName', sql.NVarChar(255), null);
    }

    const result = await request.execute('sp_SendMessage');
    
    res.json({ 
      success: true,
      messageId: result.recordset[0].MessageID 
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Failed to send message',
      error: err.message,
      details: err 
    });
  }
});

module.exports = router;
