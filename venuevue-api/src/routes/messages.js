const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Get conversation messages
router.get('/conversation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

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
    const { conversationId, senderId, content } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('ConversationID', sql.Int, conversationId);
    request.input('SenderID', sql.Int, senderId);
    request.input('Content', sql.NVarChar(sql.MAX), content);

    const result = await request.execute('sp_SendMessage');
    
    res.json({ messageId: result.recordset[0].MessageID });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

module.exports = router;
