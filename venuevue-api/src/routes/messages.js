const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');
const { authenticateToken } = require('../middleware/auth');

// Initialize Socket.IO (this should be in your app.js)
// See the next section for app.js modifications

// Get conversation messages
router.get('/conversation/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id; // From JWT token

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
        
        if (err.number === 50000) { // Custom RAISERROR from SQL
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

// Send message
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { 
            conversationId, 
            content,
            attachment
        } = req.body;

        const senderId = req.user.id;

        // Validate required fields
        if (!conversationId || !content) {
            return res.status(400).json({ 
                success: false,
                message: 'conversationId and content are required fields' 
            });
        }

        const pool = await poolPromise;
        const request = pool.request();
        
        request.input('ConversationID', sql.Int, conversationId);
        request.input('SenderID', sql.Int, senderId);
        request.input('Content', sql.NVarChar(sql.MAX), content);
        
        // Handle optional attachment
        if (attachment) {
            request.input('AttachmentURL', sql.NVarChar(255), attachment.url || null);
            request.input('AttachmentType', sql.NVarChar(50), attachment.type || null);
            request.input('AttachmentSize', sql.Int, attachment.size || null);
            request.input('AttachmentName', sql.NVarChar(255), attachment.name || null);
        } else {
            request.input('AttachmentURL', sql.NVarChar(255), null);
            request.input('AttachmentType', sql.NVarChar(50), null);
            request.input('AttachmentSize', sql.Int, null);
            request.input('AttachmentName', sql.NVarChar(255), null);
        }

        const result = await request.execute('sp_SendMessage');
        
        if (result.recordset && result.recordset.length > 0) {
            const savedMessage = result.recordset[0];
            
            // Broadcast to conversation participants
            if (req.app.get('io')) {
                req.app.get('io').to(`conversation_${conversationId}`).emit('new-message', savedMessage);
            }
            
            return res.json({ 
                success: true,
                message: 'Message sent successfully',
                data: savedMessage
            });
        } else {
            throw new Error('No data returned from stored procedure');
        }

    } catch (err) {
        console.error('Message sending error:', err);
        
        // Handle specific SQL errors
        if (err.number === 547) { // Foreign key violation
            return res.status(400).json({
                success: false,
                message: 'Invalid conversation or user reference',
                suggestion: 'Verify the conversation exists and user has access'
            });
        }
        
        if (err.number === 50000) { // Custom RAISERROR from SQL
            return res.status(400).json({ 
                success: false,
                message: err.message 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Failed to send message',
            error: err.message,
            details: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});

// Create new conversation
router.post('/conversation', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { vendorProfileId, bookingId, initialMessage } = req.body;

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
        
        if (initialMessage && result.recordset[0].ConversationID) {
            const messageRequest = pool.request();
            messageRequest.input('ConversationID', sql.Int, result.recordset[0].ConversationID);
            messageRequest.input('SenderID', sql.Int, userId);
            messageRequest.input('Content', sql.NVarChar(sql.MAX), initialMessage);
            await messageRequest.execute('sp_SendMessage');
        }

        res.json({ 
            success: true,
            conversation: result.recordset[0]
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

module.exports = router;
