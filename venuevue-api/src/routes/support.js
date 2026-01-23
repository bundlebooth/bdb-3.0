const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');

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
    const request = pool.request();
    
    // Generate ticket number
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
    
    request.input('TicketNumber', sql.NVarChar(50), ticketNumber);
    request.input('UserID', sql.Int, userId || null);
    request.input('UserEmail', sql.NVarChar(255), userEmail || null);
    request.input('UserName', sql.NVarChar(255), userName || null);
    request.input('Subject', sql.NVarChar(500), subject);
    request.input('Description', sql.NVarChar(sql.MAX), description);
    request.input('Category', sql.NVarChar(50), category || 'general');
    request.input('Priority', sql.NVarChar(20), priority || 'medium');
    request.input('Source', sql.NVarChar(50), source || 'widget');
    request.input('ConversationID', sql.Int, conversationId || null);
    request.input('Attachments', sql.NVarChar(sql.MAX), attachments ? JSON.stringify(attachments) : null);
    
    // Try to use stored procedure first, fall back to direct insert
    try {
      const result = await request.execute('admin.sp_CreateSupportTicket');
      res.json({ 
        success: true, 
        ticketId: result.recordset[0]?.TicketID,
        ticketNumber: ticketNumber,
        message: 'Support ticket created successfully'
      });
    } catch (spError) {
      // Fallback to direct insert if stored procedure doesn't exist
      console.warn('Stored procedure not found, using direct insert:', spError.message);
      
      const insertResult = await pool.request()
        .input('TicketNumber', sql.NVarChar(50), ticketNumber)
        .input('UserID', sql.Int, userId || null)
        .input('UserEmail', sql.NVarChar(255), userEmail || null)
        .input('UserName', sql.NVarChar(255), userName || null)
        .input('Subject', sql.NVarChar(500), subject)
        .input('Description', sql.NVarChar(sql.MAX), description)
        .input('Category', sql.NVarChar(50), category || 'general')
        .input('Priority', sql.NVarChar(20), priority || 'medium')
        .input('Status', sql.NVarChar(20), 'open')
        .input('Source', sql.NVarChar(50), source || 'widget')
        .input('ConversationID', sql.Int, conversationId || null)
        .input('Attachments', sql.NVarChar(sql.MAX), attachments ? JSON.stringify(attachments) : null)
        .query(`
          INSERT INTO admin.SupportTickets 
          (TicketNumber, UserID, UserEmail, UserName, Subject, Description, Category, Priority, Status, Source, ConversationID, Attachments, CreatedAt)
          OUTPUT INSERTED.TicketID
          VALUES (@TicketNumber, @UserID, @UserEmail, @UserName, @Subject, @Description, @Category, @Priority, @Status, @Source, @ConversationID, @Attachments, GETDATE())
        `);
      
      res.json({ 
        success: true, 
        ticketId: insertResult.recordset[0]?.TicketID,
        ticketNumber: ticketNumber,
        message: 'Support ticket created successfully'
      });
    }
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
      .query(`
        SELECT TicketID, TicketNumber, Subject, Description, Category, Priority, Status, 
               CreatedAt, UpdatedAt, ResolvedAt, Resolution
        FROM admin.SupportTickets 
        WHERE UserID = @UserID 
        ORDER BY CreatedAt DESC
      `);
    
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
      .query(`
        SELECT TicketID, TicketNumber, Subject, Description, Category, Priority, Status, 
               CreatedAt, UpdatedAt, ResolvedAt, Resolution, Attachments
        FROM admin.SupportTickets 
        WHERE TicketID = @TicketID
      `);
    
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
