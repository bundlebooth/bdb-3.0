const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const { sendTemplatedEmail } = require('../services/email');

// POST /api/support/tickets - Create support ticket (user-facing)
router.post('/tickets', async (req, res) => {
  try {
    const { userId, userEmail, userName, subject, description, category, priority, source, conversationId, attachments } = req.body;
    
    if (!subject || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject and description are required' 
      });
    }

    const pool = await poolPromise;
    
    // Generate ticket number
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
    
    const result = await pool.request()
      .input('TicketNumber', sql.NVarChar(50), ticketNumber)
      .input('UserID', sql.Int, userId || null)
      .input('UserEmail', sql.NVarChar(255), userEmail || null)
      .input('UserName', sql.NVarChar(255), userName || null)
      .input('Subject', sql.NVarChar(500), subject)
      .input('Description', sql.NVarChar(sql.MAX), description)
      .input('Category', sql.NVarChar(50), category || 'general')
      .input('Priority', sql.NVarChar(20), priority || 'medium')
      .input('Source', sql.NVarChar(50), source || 'widget')
      .input('ConversationID', sql.Int, conversationId || null)
      .input('Attachments', sql.NVarChar(sql.MAX), attachments ? JSON.stringify(attachments) : null)
      .execute('admin.sp_CreateSupportTicket');
    
    const ticketId = result.recordset[0]?.TicketID;
    
    // Send confirmation email to user
    if (userEmail) {
      try {
        await sendTemplatedEmail(
          'support_ticket_confirmation',
          userEmail,
          userName || 'Valued Customer',
          {
            userName: userName || 'Valued Customer',
            ticketNumber,
            ticketSubject: subject,
            category: category || 'general',
            description,
            createdAt: new Date().toLocaleString()
          },
          userId || null,
          null,
          null,
          'support'
        );
      } catch (emailError) {
        console.error('Failed to send ticket confirmation email:', emailError);
      }
    }
    
    // Send notification to support team
    try {
      await sendTemplatedEmail(
        'support_ticket_admin',
        'support@planbeau.com',
        'Support Team',
        {
          ticketNumber,
          userName: userName || 'Anonymous',
          userEmail: userEmail || 'Not provided',
          ticketSubject: subject,
          category: category || 'general',
          priority: priority || 'medium',
          description,
          attachmentCount: attachments ? attachments.length : 0,
          createdAt: new Date().toLocaleString()
        },
        null,
        null,
        null,
        'support'
      );
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
    }
    
    res.json({ 
      success: true, 
      ticketId,
      ticketNumber,
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create support ticket',
      error: error.message
    });
  }
});

// GET /api/support/tickets/user/:userId - Get user's support tickets
router.get('/tickets/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .execute('admin.sp_GetUserSupportTickets');
    
    res.json({ 
      success: true, 
      tickets: result.recordset 
    });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch support tickets',
      error: error.message
    });
  }
});

// GET /api/support/tickets/:ticketId - Get single ticket details
router.get('/tickets/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('TicketID', sql.Int, ticketId)
      .execute('admin.sp_GetSupportTicketById');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }
    
    res.json({ 
      success: true, 
      ticket: result.recordset[0] 
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch ticket',
      error: error.message
    });
  }
});

module.exports = router;
