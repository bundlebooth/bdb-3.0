const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a new booking
router.post('/', async (req, res) => {
  try {
    const { 
      userId, 
      vendorProfileId, 
      eventDate, 
      endDate, 
      attendeeCount, 
      specialRequests, 
      services,
      paymentIntentId
    } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, userId);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('EventDate', sql.DateTime, new Date(eventDate));
    request.input('EndDate', sql.DateTime, new Date(endDate));
    request.input('AttendeeCount', sql.Int, attendeeCount || 1);
    request.input('SpecialRequests', sql.NVarChar(sql.MAX), specialRequests || null);
    request.input('ServicesJSON', sql.NVarChar(sql.MAX), JSON.stringify(services));
    request.input('PaymentIntentID', sql.NVarChar(100), paymentIntentId || null);

    const result = await request.execute('sp_CreateBookingWithServices');
    
    const bookingId = result.recordset[0].BookingID;
    const conversationId = result.recordset[0].ConversationID;

    res.json({
      bookingId,
      conversationId
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

// Get booking details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('BookingID', sql.Int, id);
    request.input('UserID', sql.Int, userId || null);

    const result = await request.execute('sp_GetBookingDetails');
    
    if (result.recordset.length === 0 || result.recordset[0].CanViewDetails === 0) {
      return res.status(404).json({ message: 'Booking not found or access denied' });
    }

    const booking = {
      info: result.recordsets[0][0],
      services: result.recordsets[1],
      timeline: result.recordsets[2],
      conversationId: result.recordsets[3] && result.recordsets[3][0] ? result.recordsets[3][0].ConversationID : null
    };

    res.json(booking);

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

// Confirm booking payment
router.post('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentIntentId, amount, chargeId } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('BookingID', sql.Int, id);
    request.input('PaymentIntentID', sql.NVarChar(100), paymentIntentId);
    request.input('Amount', sql.Decimal(10, 2), amount);
    request.input('ChargeID', sql.NVarChar(100), chargeId);

    await request.execute('sp_ConfirmBookingPayment');
    
    res.json({ success: true });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

// NEW: Endpoint to create a Stripe Payment Intent (client-side)
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency,
      metadata: { integration_check: 'accept_a_payment' },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error('Stripe payment intent creation error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: err.message
    });
  }
});

// NEW: Multi-step booking request endpoints
router.post('/requests', async (req, res) => {
  try {
    const {
      userId,
      vendorIds,
      services,
      eventDetails,
      budget
    } = req.body;

    if (!userId || !vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and vendor IDs are required' 
      });
    }

    const pool = await poolPromise;
    const requests = [];

    // Create booking requests for each vendor
    for (const vendorId of vendorIds) {
      const request = new sql.Request(pool);
      
      request.input('UserID', sql.Int, userId);
      request.input('VendorProfileID', sql.Int, vendorId);
      request.input('Services', sql.NVarChar(sql.MAX), JSON.stringify(services));
      request.input('EventDate', sql.DateTime, new Date(eventDetails.date + 'T' + eventDetails.time));
      request.input('EventLocation', sql.NVarChar(500), eventDetails.location || null);
      request.input('AttendeeCount', sql.Int, eventDetails.attendeeCount || 50);
      request.input('Budget', sql.Decimal(10, 2), budget);
      request.input('SpecialRequests', sql.NVarChar(sql.MAX), eventDetails.specialRequests || null);
      request.input('Status', sql.NVarChar(50), 'pending');
      request.input('ExpiresAt', sql.DateTime, new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours

      const result = await request.query(`
        INSERT INTO BookingRequests (
          UserID, VendorProfileID, Services, EventDate, EventLocation, 
          AttendeeCount, Budget, SpecialRequests, Status, ExpiresAt, CreatedAt
        )
        OUTPUT INSERTED.RequestID, INSERTED.CreatedAt, INSERTED.ExpiresAt
        VALUES (
          @UserID, @VendorProfileID, @Services, @EventDate, @EventLocation,
          @AttendeeCount, @Budget, @SpecialRequests, @Status, @ExpiresAt, GETDATE()
        )
      `);

      if (result.recordset.length > 0) {
        requests.push({
          requestId: result.recordset[0].RequestID,
          vendorId: vendorId,
          status: 'pending',
          createdAt: result.recordset[0].CreatedAt,
          expiresAt: result.recordset[0].ExpiresAt
        });
      }
    }

    res.json({
      success: true,
      requests: requests
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create booking requests',
      error: err.message 
    });
  }
});

// Get service categories for booking modal
router.get('/service-categories', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    const result = await request.query(`
      SELECT DISTINCT 
        sc.CategoryID,
        sc.Name as CategoryName,
        sc.Description,
        COUNT(s.ServiceID) as ServiceCount
      FROM ServiceCategories sc
      LEFT JOIN Services s ON sc.CategoryID = s.CategoryID AND s.IsActive = 1
      WHERE sc.IsActive = 1
      GROUP BY sc.CategoryID, sc.Name, sc.Description
      ORDER BY sc.Name
    `);

    // Map categories to match the navigation structure
    const categoryMap = {
      'venue': { icon: 'fas fa-building', name: 'Venues' },
      'photo': { icon: 'fas fa-camera', name: 'Photo/Video' },
      'music': { icon: 'fas fa-music', name: 'Music/DJ' },
      'catering': { icon: 'fas fa-utensils', name: 'Catering' },
      'entertainment': { icon: 'fas fa-theater-masks', name: 'Entertainment' },
      'experiences': { icon: 'fas fa-star', name: 'Experiences' },
      'decor': { icon: 'fas fa-ribbon', name: 'Decorations' },
      'beauty': { icon: 'fas fa-spa', name: 'Beauty' },
      'cake': { icon: 'fas fa-birthday-cake', name: 'Cake' },
      'transport': { icon: 'fas fa-shuttle-van', name: 'Transportation' },
      'planner': { icon: 'fas fa-clipboard-list', name: 'Planners' },
      'fashion': { icon: 'fas fa-tshirt', name: 'Fashion' },
      'stationery': { icon: 'fas fa-envelope', name: 'Stationery' }
    };

    const categories = result.recordset.map(cat => {
      const categoryKey = cat.CategoryName.toLowerCase();
      const categoryInfo = categoryMap[categoryKey] || { icon: 'fas fa-star', name: cat.CategoryName };
      
      return {
        id: cat.CategoryID,
        name: categoryInfo.name,
        key: categoryKey,
        icon: categoryInfo.icon,
        description: cat.Description,
        serviceCount: cat.ServiceCount
      };
    });

    res.json({
      success: true,
      categories: categories
    });

  } catch (err) {
    console.error('Error fetching service categories:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service categories',
      error: err.message
    });
  }
});

// Get services by category for booking modal
router.get('/services/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('CategoryID', sql.Int, categoryId);
    
    const result = await request.query(`
      SELECT 
        s.ServiceID,
        s.Name,
        s.Description,
        s.BasePrice,
        s.PriceUnit,
        sc.Name as CategoryName
      FROM Services s
      JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
      WHERE s.CategoryID = @CategoryID AND s.IsActive = 1
      ORDER BY s.Name
    `);

    res.json({
      success: true,
      services: result.recordset
    });

  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: err.message
    });
  }
});

// Get booking requests for a user
router.get('/requests/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, userId);
    
    const result = await request.query(`
      SELECT 
        br.RequestID,
        br.VendorProfileID,
        vp.BusinessName as VendorName,
        br.Services,
        br.EventDate,
        br.EventLocation,
        br.AttendeeCount,
        br.Budget,
        br.SpecialRequests,
        br.Status,
        br.CreatedAt,
        br.ExpiresAt,
        br.ResponseMessage
      FROM BookingRequests br
      LEFT JOIN VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
      WHERE br.UserID = @UserID
      ORDER BY br.CreatedAt DESC
    `);

    res.json({
      success: true,
      requests: result.recordset
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get booking requests',
      error: err.message 
    });
  }
});

// Vendor responds to booking request
router.put('/requests/:requestId/respond', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { vendorId, status, responseMessage, proposedPrice } = req.body;

    if (!['approved', 'declined'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status must be approved or declined' 
      });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('RequestID', sql.Int, requestId);
    request.input('VendorProfileID', sql.Int, vendorId);
    request.input('Status', sql.NVarChar(50), status);
    request.input('ResponseMessage', sql.NVarChar(sql.MAX), responseMessage || null);
    request.input('ProposedPrice', sql.Decimal(10, 2), proposedPrice || null);
    request.input('RespondedAt', sql.DateTime, new Date());

    const result = await request.query(`
      UPDATE BookingRequests 
      SET 
        Status = @Status,
        ResponseMessage = @ResponseMessage,
        ProposedPrice = @ProposedPrice,
        RespondedAt = @RespondedAt
      OUTPUT INSERTED.RequestID, INSERTED.UserID, INSERTED.Status
      WHERE RequestID = @RequestID AND VendorProfileID = @VendorProfileID
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking request not found' 
      });
    }

    // TODO: Send real-time notification to user via Socket.IO
    // io.to(`user_${result.recordset[0].UserID}`).emit('booking_response', {
    //   requestId: requestId,
    //   status: status,
    //   responseMessage: responseMessage
    // });

    res.json({
      success: true,
      message: 'Response recorded successfully'
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to respond to booking request',
      error: err.message 
    });
  }
});

// Get pending requests for a vendor
router.get('/vendor/:vendorId/requests', async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('VendorProfileID', sql.Int, vendorId);
    
    const result = await request.query(`
      SELECT 
        br.RequestID,
        br.UserID,
        u.Name as ClientName,
        u.Email as ClientEmail,
        br.Services,
        br.EventDate,
        br.EventLocation,
        br.AttendeeCount,
        br.Budget,
        br.SpecialRequests,
        br.Status,
        br.CreatedAt,
        br.ExpiresAt
      FROM BookingRequests br
      LEFT JOIN Users u ON br.UserID = u.UserID
      WHERE br.VendorProfileID = @VendorProfileID
        AND br.Status = 'pending'
        AND br.ExpiresAt > GETDATE()
      ORDER BY br.CreatedAt DESC
    `);

    res.json({
      success: true,
      requests: result.recordset
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get vendor requests',
      error: err.message 
    });
  }
});

module.exports = router;
