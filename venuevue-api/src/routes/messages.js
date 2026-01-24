const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const { serializeDates, serializeRecords } = require('../utils/helpers');
const { notifyOfNewMessage } = require('../services/emailService');

// Handle Socket.IO events
const handleSocketIO = (io) => {
  io.on('connection', (socket) => {

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
        
        const result = await request.execute('messages.sp_SendMessage');
        
        if (result.recordset.length === 0) {
          throw new Error('Failed to save message');
        }

        const savedMessage = result.recordset[0];
        
        // Get conversation details to find recipient
        const conversationRequest = pool.request();
        conversationRequest.input('ConversationID', sql.Int, messageData.conversationId);
        const conversationResult = await conversationRequest.execute('messages.sp_GetConversationDetails');
        
        if (conversationResult.recordset.length === 0) {
          throw new Error('Conversation not found');
        }
        
        const conversation = conversationResult.recordset[0];
        let recipientId;
        if (socket.userId === conversation.UserID) {
          const vendorRequest = pool.request();
          vendorRequest.input('VendorProfileID', sql.Int, conversation.VendorProfileID);
          const vendorResult = await vendorRequest.execute('messages.sp_GetVendorUserID');
          recipientId = vendorResult.recordset[0].UserID;
        } else {
          recipientId = conversation.UserID;
        }
        
        // Format message data for frontend
        const messageForFrontend = {
          conversationId: messageData.conversationId,
          senderId: socket.userId,
          senderName: savedMessage.SenderName || 'User',
          content: messageData.content,
          createdAt: new Date().toISOString()
        };
        
        // Emit to the specific recipient
        io.to(`user_${recipientId}`).emit('new-message', messageForFrontend);
        
        // Also emit to sender for real-time update on their own client
        socket.emit('new-message', messageForFrontend);
        
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

    socket.on('disconnect', () => {
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

    const result = await request.execute('messages.sp_GetConversationMessages');
    
    // Format dates to ISO strings for proper JSON serialization
    const formattedMessages = result.recordset.map(msg => ({
      ...msg,
      CreatedAt: msg.CreatedAt ? new Date(msg.CreatedAt).toISOString() : null,
      ReadAt: msg.ReadAt ? new Date(msg.ReadAt).toISOString() : null
    }));
    
    res.json({
      success: true,
      messages: formattedMessages
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

// Get user conversations
router.get('/conversations/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const pool = await poolPromise;
    
    // Get user conversations using stored procedure
    const request = pool.request();
    request.input('UserID', sql.Int, userId);
    
    const result = await request.execute('messages.sp_GetUserConversations');

    // Format conversations to match frontend expected format
    // Filter out conversations with no messages (LastMessageContent is null/empty)
    const formattedConversations = result.recordset
      .filter(conv => conv.LastMessageContent && conv.LastMessageContent.trim() !== '') // Only show conversations with actual messages
      .map(conv => ({
        id: conv.ConversationID,
        VendorProfileID: conv.VendorProfileID,
        createdAt: conv.CreatedAt,
        OtherPartyName: conv.OtherPartyName,
        OtherPartyType: conv.OtherPartyType,
        OtherPartyAvatar: conv.OtherPartyAvatar,
        isClientRole: conv.IsClientRole === 1,
        isVendorRole: conv.IsVendorRole === 1,
        lastMessageContent: conv.LastMessageContent || '',
        lastMessageCreatedAt: conv.LastMessageCreatedAt || conv.CreatedAt,
        unreadCount: conv.UnreadCount || 0
      }));

    res.json({
      success: true,
      conversations: formattedConversations
    });

  } catch (err) {
    console.error('Database error:', err);
    // Return empty conversations on error instead of 500
    res.json({ 
      success: true,
      conversations: []
    });
  }
});

//Check if conversations already exist
router.post('/conversation/check', async (req, res) => {
    try {
        const { userId, vendorProfileId } = req.body;

        const pool = await poolPromise;
        const checkRequest = pool.request();
        checkRequest.input('UserID', sql.Int, userId);
        checkRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        const result = await checkRequest.execute('messages.sp_CheckExistingConversation');

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
    const { userId, vendorProfileId, bookingId, requestId, initialMessage } = req.body;

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
    // Note: sp_CreateConversation only accepts UserID, VendorProfileID, BookingID, and Subject
    // RequestID is not a parameter of the stored procedure
    request.input('Subject', sql.NVarChar(255), requestId ? 'Booking Request Discussion' : 'New Conversation');
    
    // Check if a conversation already exists for this user/vendor pair
    const existingRequest = pool.request();
    existingRequest.input('UserID', sql.Int, userId);
    existingRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const existingConv = await existingRequest.execute('messages.sp_CheckExistingConversation');

    if (existingConv.recordset.length > 0) {
      return res.json({ 
        success: true,
        conversation: { ConversationID: existingConv.recordset[0].ConversationID }
      });
    }
    
    const result = await request.execute('messages.sp_CreateConversation');
    
    // Emit via Socket.IO if initial message exists
    if (initialMessage && result.recordset[0]?.ConversationID) {
      const io = req.app.get('io');
      const messageRequest = pool.request();
      messageRequest.input('ConversationID', sql.Int, result.recordset[0].ConversationID);
      messageRequest.input('SenderID', sql.Int, userId);
      messageRequest.input('Content', sql.NVarChar(sql.MAX), initialMessage);
      
      const messageResult = await messageRequest.execute('messages.sp_SendMessage');
      
      if (messageResult.recordset[0]) {
        // Get vendor user ID
        const vendorUserRequest = pool.request();
        vendorUserRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        const vendorUser = await vendorUserRequest.execute('messages.sp_GetVendorUserID');
        
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
    
    const result = await request.execute('messages.sp_SendMessage');
    
    // Emit via Socket.IO
    if (result.recordset[0]) {
      const io = req.app.get('io');
      
      // Get conversation details to find recipient
      const convRequest = pool.request();
      convRequest.input('ConversationID', sql.Int, conversationId);
      const conversationResult = await convRequest.execute('messages.sp_GetConversationDetails');
      
      if (conversationResult.recordset.length > 0) {
        const conversation = conversationResult.recordset[0];
        let recipientId;
        let isVendorSending = false;
        
        // Check if this is a support conversation (VendorProfileID is NULL or 0)
        const isSupportConversation = !conversation.VendorProfileID || conversation.VendorProfileID === 0;
        
        if (isSupportConversation) {
          // User sending message to support - notify support team via email
          try {
            // Get user info for the notification
            const userInfoResult = await pool.request()
              .input('UserID', sql.Int, senderId)
              .query('SELECT FirstName, LastName, Email FROM users.Users WHERE UserID = @UserID');
            
            const userInfo = userInfoResult.recordset[0];
            const userName = userInfo ? `${userInfo.FirstName || ''} ${userInfo.LastName || ''}`.trim() || 'User' : 'User';
            const userEmail = userInfo?.Email || 'unknown';
            const messagePreview = content.length > 100 ? content.substring(0, 100) + '...' : content;
            
            // Send email to support team (support@planbeau.com)
            const { sendNewSupportMessageToTeam } = require('../services/email');
            await sendNewSupportMessageToTeam(
              'support@planbeau.com',
              userName,
              userEmail,
              conversationId,
              messagePreview,
              'https://www.planbeau.com/admin'
            );
            
            // Support team notified via email
          } catch (supportNotifyErr) {
            console.error('Failed to notify support team:', supportNotifyErr.message);
          }
          
          // Emit to sender only (support team will see via polling)
          io.to(`user_${senderId}`).emit('new-message', result.recordset[0]);
        } else {
          // Regular vendor-client conversation
          if (senderId === conversation.UserID) {
            // Client is sending to vendor
            const vendorReq = pool.request();
            vendorReq.input('VendorProfileID', sql.Int, conversation.VendorProfileID);
            const vendorRes = await vendorReq.execute('messages.sp_GetVendorUserID');
            recipientId = vendorRes.recordset[0].UserID;
            isVendorSending = false;
          } else {
            // Vendor is sending to client
            recipientId = conversation.UserID;
            isVendorSending = true;
          }
          
          // Emit to recipient
          io.to(`user_${recipientId}`).emit('new-message', result.recordset[0]);
          // Emit to sender
          io.to(`user_${senderId}`).emit('new-message', result.recordset[0]);

          // Send email notification (using centralized notification service)
          notifyOfNewMessage(conversationId, senderId, content);
        }
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

// Get unread message count for a user
router.get('/unread-count/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required' 
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserID', sql.Int, userId);
    
    const result = await request.execute('messages.sp_GetUnreadCount');

    const unreadCount = result.recordset[0]?.UnreadCount || 0;

    res.json({
      success: true,
      unreadCount: unreadCount
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

// Create or get conversation with vendor
router.post('/conversations', async (req, res) => {
  try {
    const { userId, vendorProfileId, subject } = req.body;
    
    if (!userId || !vendorProfileId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID and Vendor Profile ID are required' 
      });
    }

    const pool = await poolPromise;
    
    // Check if conversation already exists
    const checkRequest = pool.request();
    checkRequest.input('UserID', sql.Int, userId);
    checkRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const existingResult = await checkRequest.execute('messages.sp_CheckExistingConversation');
    
    if (existingResult.recordset.length > 0) {
      return res.json({
        success: true,
        conversationId: existingResult.recordset[0].ConversationID,
        isExisting: true
      });
    }
    
    // Create new conversation
    const createRequest = pool.request();
    createRequest.input('UserID', sql.Int, userId);
    createRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    createRequest.input('Subject', sql.NVarChar(255), subject || 'New Inquiry');
    const createResult = await createRequest.execute('messages.sp_CreateConversationDirect');
    
    const conversationId = createResult.recordset[0]?.ConversationID;

    res.json({
      success: true,
      conversationId: conversationId,
      isExisting: false
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

// Create or get support conversation
router.post('/conversations/support', async (req, res) => {
  try {
    const { userId, subject } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required' 
      });
    }

    const pool = await poolPromise;
    
    // Check if user already has a support conversation using stored procedure
    const existingResult = await pool.request()
      .input('UserID', sql.Int, userId)
      .execute('messages.sp_CheckSupportConversation');
    
    if (existingResult.recordset.length > 0) {
      return res.json({
        success: true,
        conversationId: existingResult.recordset[0].ConversationID,
        isExisting: true
      });
    }
    
    // Create new support conversation using stored procedure
    const createResult = await pool.request()
      .input('UserID', sql.Int, userId)
      .input('Subject', sql.NVarChar(255), subject || 'Support Request')
      .execute('messages.sp_CreateSupportConversation');
    
    const conversationId = createResult.recordset[0]?.ConversationID;

    res.json({
      success: true,
      conversationId: conversationId,
      isExisting: false
    });

  } catch (err) {
    console.error('Create support conversation error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create support conversation',
      error: err.message 
    });
  }
});

// Get vendor conversations
router.get('/conversations/vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('VendorProfileID', sql.Int, vendorId)
      .execute('messages.sp_GetVendorConversations');

    const formattedConversations = result.recordset.map(conv => ({
      id: conv.ConversationID,
      createdAt: conv.CreatedAt,
      userId: conv.UserID,
      userName: conv.UserName,
      userEmail: conv.UserEmail,
      // Map UserName to OtherPartyName so frontend displays the client's name (not vendor's own name)
      OtherPartyName: conv.UserName,
      OtherPartyAvatar: conv.UserProfilePic || null,
      OtherPartyType: 'user',
      lastMessageContent: conv.LastMessageContent,
      lastMessageCreatedAt: conv.LastMessageCreatedAt,
      lastMessageSenderId: conv.LastMessageSenderID,
      unreadCount: conv.UnreadCount
    }));

    res.json({
      success: true,
      conversations: formattedConversations
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations',
      error: err.message
    });
  }
});

// ============================================
// MESSAGE READ RECEIPT ENDPOINTS
// ============================================

// POST /api/messages/mark-read - Mark messages as read
router.post('/mark-read', async (req, res) => {
  try {
    const { conversationId, readerUserId, messageIds } = req.body;

    if (!conversationId || !readerUserId) {
      return res.status(400).json({ 
        success: false, 
        message: 'conversationId and readerUserId are required' 
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('ConversationID', sql.Int, conversationId);
    request.input('ReaderUserID', sql.Int, readerUserId);
    request.input('MessageIDs', sql.NVarChar(sql.MAX), messageIds ? messageIds.join(',') : null);

    const result = await request.execute('messages.sp_MarkMessagesAsRead');

    // Emit read receipts via Socket.IO
    const io = req.app.get('io');
    if (io && result.recordset.length > 0) {
      // Notify the sender(s) that their messages were read
      const senderIds = [...new Set(result.recordset.map(m => m.SenderID))];
      senderIds.forEach(senderId => {
        io.to(`user_${senderId}`).emit('messages-read', {
          conversationId,
          readBy: readerUserId,
          messageIds: result.recordset.filter(m => m.SenderID === senderId).map(m => m.MessageID),
          readAt: new Date().toISOString()
        });
      });
    }

    res.json({
      success: true,
      markedCount: result.recordset.length,
      messages: result.recordset
    });

  } catch (err) {
    console.error('Mark messages read error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark messages as read',
      error: err.message 
    });
  }
});

// GET /api/messages/read-status/:conversationId - Get read status for messages in a conversation
router.get('/read-status/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId || isNaN(conversationId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid conversationId is required' 
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    request.input('ConversationID', sql.Int, parseInt(conversationId));
    const result = await request.execute('messages.sp_GetReadStatus');

    const readStatus = {};
    result.recordset.forEach(msg => {
      readStatus[msg.MessageID] = {
        isRead: msg.IsRead === true || msg.IsRead === 1,
        readAt: msg.ReadAt
      };
    });

    res.json({
      success: true,
      readStatus
    });

  } catch (err) {
    console.error('Get read status error:', err);
    res.json({ success: false, readStatus: {} });
  }
});

// In-memory typing status store (simple approach - could use Redis for production)
const typingStatus = new Map();

// POST /api/messages/typing - Set typing status
router.post('/typing', async (req, res) => {
  try {
    const { conversationId, userId, isTyping } = req.body;
    
    if (!conversationId || userId === undefined || userId === null) {
      return res.status(400).json({ success: false, message: 'conversationId and userId required' });
    }
    
    const key = `${conversationId}-${userId}`;
    
    if (isTyping) {
      typingStatus.set(key, {
        userId,
        conversationId,
        timestamp: Date.now()
      });
    } else {
      typingStatus.delete(key);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Set typing status error:', err);
    res.json({ success: false });
  }
});

// GET /api/messages/typing/:conversationId - Check if other user is typing
router.get('/typing/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;
    
    if (!conversationId || !userId) {
      return res.json({ isTyping: false });
    }
    
    // Parse to integers for consistent comparison
    const convId = parseInt(conversationId);
    const reqUserId = parseInt(userId);
    
    // Find typing status for this conversation from OTHER users (not the requesting user)
    let isTyping = false;
    const now = Date.now();
    
    for (const [key, status] of typingStatus.entries()) {
      if (parseInt(status.conversationId) === convId && 
          parseInt(status.userId) !== reqUserId && 
          now - status.timestamp < 5000) { // Typing status expires after 5 seconds
        isTyping = true;
        break;
      }
    }
    
    // Clean up old typing statuses
    for (const [key, status] of typingStatus.entries()) {
      if (now - status.timestamp > 10000) {
        typingStatus.delete(key);
      }
    }
    
    res.json({ isTyping });
  } catch (err) {
    console.error('Get typing status error:', err);
    res.json({ isTyping: false });
  }
});

module.exports = {
  router,
  handleSocketIO
};
