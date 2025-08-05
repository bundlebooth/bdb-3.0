const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Handle Socket.IO events
exports.handleSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`New connection: User ${socket.userId}`);

    // Join conversation room
    socket.on('join-conversation', async (conversationId) => {
      try {
        const pool = await poolPromise;
        const result = await pool.request()
          .input('ConversationID', sql.Int, conversationId)
          .input('UserID', sql.Int, socket.userId)
          .query('SELECT 1 FROM ConversationParticipants WHERE ConversationID = @ConversationID AND UserID = @UserID');
        
        if (result.recordset.length > 0) {
          socket.join(`conversation_${conversationId}`);
          console.log(`User ${socket.userId} joined conversation ${conversationId}`);
        } else {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
        }
      } catch (err) {
        console.error('Join conversation error:', err);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle new messages
    socket.on('send-message', async (messageData) => {
      try {
        // Validate message
        if (!messageData.conversationId || !messageData.content) {
          throw new Error('Missing required fields');
        }

        const pool = await poolPromise;
        const request = pool.request();
        
        request.input('ConversationID', sql.Int, messageData.conversationId);
        request.input('SenderID', sql.Int, socket.userId);
        request.input('Content', sql.NVarChar(sql.MAX), messageData.content);
        
        const result = await request.execute('sp_SendMessage');
        
        if (result.recordset.length === 0) {
          throw new Error('Failed to save message');
        }

        const savedMessage = result.recordset[0];
        
        // Broadcast to conversation room
        io.to(`conversation_${messageData.conversationId}`).emit('new-message', savedMessage);
        
      } catch (err) {
        console.error('Message sending error:', err);
        socket.emit('message-error', { 
          error: err.message,
          conversationId: messageData?.conversationId 
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
};

// REST API Endpoints

// Get conversation messages
router.get('/conversation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required' 
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('ConversationID', sql.Int, id);
    request.input('UserID', sql.Int, userId);

    const result = await request.execute('sp_GetConversationMessages');
    
    res.json({
      success: true,
      messages: result.recordset
    });

  } catch (err) {
    console.error('Database error:', err);
    
    if (err.number === 50000) {
      return res.status(400).json({ 
        success: false,
        message: err.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch messages',
      error: err.message 
    });
  }
});

// Create new conversation
router.post('/conversation', async (req, res) => {
  try {
    const { userId, vendorProfileId, bookingId, initialMessage } = req.body;

    if (!userId || !vendorProfileId) {
      return res.status(400).json({ 
        success: false,
        message: 'userId and vendorProfileId are required' 
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('UserID', sql.Int, userId);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('BookingID', sql.Int, bookingId || null);
    request.input('Subject', sql.NVarChar(255), 'New Conversation');
    
    const result = await request.execute('sp_CreateConversation');
    
    // Emit via Socket.IO if initial message exists
    if (initialMessage && result.recordset[0]?.ConversationID) {
      const io = req.app.get('io');
      const messageRequest = pool.request();
      messageRequest.input('ConversationID', sql.Int, result.recordset[0].ConversationID);
      messageRequest.input('SenderID', sql.Int, userId);
      messageRequest.input('Content', sql.NVarChar(sql.MAX), initialMessage);
      
      const messageResult = await messageRequest.execute('sp_SendMessage');
      
      if (messageResult.recordset[0]) {
        io.to(`conversation_${result.recordset[0].ConversationID}`)
          .emit('new-message', messageResult.recordset[0]);
      }
    }

    res.json({ 
      success: true,
      conversation: result.recordset[0] || null
    });

  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create conversation',
      error: err.message 
    });
  }
});

// Send message (HTTP endpoint)
router.post('/', async (req, res) => {
  try {
    const { conversationId, senderId, content } = req.body;

    if (!conversationId || !senderId || !content) {
      return res.status(400).json({ 
        success: false,
        message: 'conversationId, senderId, and content are required' 
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('ConversationID', sql.Int, conversationId);
    request.input('SenderID', sql.Int, senderId);
    request.input('Content', sql.NVarChar(sql.MAX), content);
    
    const result = await request.execute('sp_SendMessage');
    
    // Emit via Socket.IO
    if (result.recordset[0]) {
      const io = req.app.get('io');
      io.to(`conversation_${conversationId}`)
        .emit('new-message', result.recordset[0]);
    }

    res.json({ 
      success: true,
      message: result.recordset[0] || null
    });

  } catch (err) {
    console.error('Message sending error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send message',
      error: err.message 
    });
  }
});

module.exports = router;
