const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Handle Socket.IO events
const handleSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`New connection: User ${socket.userId}`);

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
        
        // Get conversation details to find recipient
        const conversationResult = await pool.request()
          .input('ConversationID', sql.Int, messageData.conversationId)
          .query('SELECT UserID, VendorProfileID FROM Conversations WHERE ConversationID = @ConversationID');
        
        if (conversationResult.recordset.length === 0) {
          throw new Error('Conversation not found');
        }
        
        const conversation = conversationResult.recordset[0];
        const recipientId = socket.userId === conversation.UserID 
          ? (await pool.request()
              .input('VendorProfileID', sql.Int, conversation.VendorProfileID)
              .query('SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID'))
              .recordset[0].UserID
          : conversation.UserID;
        
        // Emit to the specific recipient
        io.to(`user_${recipientId}`).emit('new-message', savedMessage);
        
        // Also emit to sender for real-time update on their own client
        socket.emit('new-message', savedMessage);
        
      } catch (err) {
        console.error('Message sending error:', err);
        socket.emit('message-error', { 
          error: err.message,
          conversationId: messageData?.conversationId 
        });
      }
    });

    // Join user's personal room when they connect
    socket.join(`user_${socket.userId}`);
    console.log(`User ${socket.userId} joined their personal room`);

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

router.post('/conversation/check', async (req, res) => {
  try {
    const { userId, vendorProfileId } = req.body;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .query(`
        SELECT TOP 1 ConversationID 
        FROM Conversations 
        WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
        ORDER BY CreatedAt DESC
      `);

    if (result.recordset.length > 0) {
      return res.json({
        success: true,
        conversationId: result.recordset[0].ConversationID
      });
    }

    res.json({
      success: true,
      conversationId: null
    });

  } catch (err) {
    console.error('Check conversation error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check conversation',
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
        // Get vendor user ID
        const vendorUser = await pool.request()
          .input('VendorProfileID', sql.Int, vendorProfileId)
          .query('SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID');
        
        if (vendorUser.recordset.length > 0) {
          // Emit to vendor
          io.to(`user_${vendorUser.recordset[0].UserID}`).emit('new-message', messageResult.recordset[0]);
          // Emit to sender
          io.to(`user_${userId}`).emit('new-message', messageResult.recordset[0]);
        }
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
      
      // Get conversation details to find recipient
      const conversationResult = await pool.request()
        .input('ConversationID', sql.Int, conversationId)
        .query('SELECT UserID, VendorProfileID FROM Conversations WHERE ConversationID = @ConversationID');
      
      if (conversationResult.recordset.length > 0) {
        const conversation = conversationResult.recordset[0];
        const recipientId = senderId === conversation.UserID 
          ? (await pool.request()
              .input('VendorProfileID', sql.Int, conversation.VendorProfileID)
              .query('SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID'))
              .recordset[0].UserID
          : conversation.UserID;
        
        // Emit to recipient
        io.to(`user_${recipientId}`).emit('new-message', result.recordset[0]);
        // Emit to sender
        io.to(`user_${senderId}`).emit('new-message', result.recordset[0]);
      }
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

module.exports = {
  router,
  handleSocketIO
};
