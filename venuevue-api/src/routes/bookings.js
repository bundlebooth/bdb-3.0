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

// MOVED: Get service categories for booking modal - BEFORE /:id route
router.get('/service-categories', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    // Query to get service categories from database
    const result = await request.query(`
      SELECT DISTINCT 
        ROW_NUMBER() OVER (ORDER BY Category) as id,
        Category as key,
        Category as name,
        CASE Category
          WHEN 'venue' THEN 'fas fa-building'
          WHEN 'photo' THEN 'fas fa-camera'
          WHEN 'music' THEN 'fas fa-music'
          WHEN 'catering' THEN 'fas fa-utensils'
          WHEN 'entertainment' THEN 'fas fa-theater-masks'
          WHEN 'experiences' THEN 'fas fa-star'
          WHEN 'decor' THEN 'fas fa-ribbon'
          WHEN 'beauty' THEN 'fas fa-spa'
          WHEN 'cake' THEN 'fas fa-birthday-cake'
          WHEN 'transport' THEN 'fas fa-shuttle-van'
          WHEN 'planner' THEN 'fas fa-clipboard-list'
          WHEN 'fashion' THEN 'fas fa-tshirt'
          WHEN 'stationery' THEN 'fas fa-envelope'
          ELSE 'fas fa-star'
        END as icon,
        COUNT(*) as serviceCount
      FROM VendorProfiles 
      WHERE Category IS NOT NULL AND Category != ''
      GROUP BY Category
      ORDER BY Category
    `);

    const categories = result.recordset;

    // If no categories found, return default categories
    if (categories.length === 0) {
      const defaultCategories = [
        { id: 1, key: 'venue', name: 'Venues', icon: 'fas fa-building', serviceCount: 0 },
        { id: 2, key: 'photo', name: 'Photo/Video', icon: 'fas fa-camera', serviceCount: 0 },
        { id: 3, key: 'music', name: 'Music/DJ', icon: 'fas fa-music', serviceCount: 0 },
        { id: 4, key: 'catering', name: 'Catering', icon: 'fas fa-utensils', serviceCount: 0 },
        { id: 5, key: 'entertainment', name: 'Entertainment', icon: 'fas fa-theater-masks', serviceCount: 0 },
        { id: 6, key: 'experiences', name: 'Experiences', icon: 'fas fa-star', serviceCount: 0 },
        { id: 7, key: 'decor', name: 'Decorations', icon: 'fas fa-ribbon', serviceCount: 0 },
        { id: 8, key: 'beauty', name: 'Beauty', icon: 'fas fa-spa', serviceCount: 0 },
        { id: 9, key: 'cake', name: 'Cake', icon: 'fas fa-birthday-cake', serviceCount: 0 },
        { id: 10, key: 'transport', name: 'Transportation', icon: 'fas fa-shuttle-van', serviceCount: 0 },
        { id: 11, key: 'planner', name: 'Planners', icon: 'fas fa-clipboard-list', serviceCount: 0 },
        { id: 12, key: 'fashion', name: 'Fashion', icon: 'fas fa-tshirt', serviceCount: 0 },
        { id: 13, key: 'stationery', name: 'Stationery', icon: 'fas fa-envelope', serviceCount: 0 }
      ];
      
      return res.json({
        success: true,
        categories: defaultCategories
      });
    }

    res.json({
      success: true,
      categories: categories
    });

  } catch (err) {
    console.error('Error fetching service categories:', err);
    
    // Return fallback categories on error
    const fallbackCategories = [
      { id: 1, key: 'venue', name: 'Venues', icon: 'fas fa-building', serviceCount: 0 },
      { id: 2, key: 'photo', name: 'Photo/Video', icon: 'fas fa-camera', serviceCount: 0 },
      { id: 3, key: 'music', name: 'Music/DJ', icon: 'fas fa-music', serviceCount: 0 },
      { id: 4, key: 'catering', name: 'Catering', icon: 'fas fa-utensils', serviceCount: 0 }
    ];
    
    res.json({
      success: true,
      categories: fallbackCategories
    });
  }
});

// Get booking details - NOW COMES AFTER service-categories
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

    // Format time to ensure it's in HH:MM:SS format
    const formatTime = (timeStr) => {
      if (!timeStr) return '12:00:00'; // Default to noon if no time provided
      
      // Handle various time formats
      const timeParts = timeStr.split(':');
      if (timeParts.length >= 2) {
        // Ensure we have hours and minutes
        const hours = timeParts[0].padStart(2, '0');
        const minutes = timeParts[1].padStart(2, '0');
        const seconds = timeParts[2] ? timeParts[2].padStart(2, '0') : '00';
        return `${hours}:${minutes}:${seconds}`;
      }
      return '12:00:00'; // Fallback to default
    };

    // Parse and validate date
    const parseDate = (dateStr) => {
      if (!dateStr) {
        throw new Error('Date is required');
      }
      
      // Check if date is in YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateStr)) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD');
      }
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      return date.toISOString().split('T')[0]; // Return in YYYY-MM-DD format
    };

    // Log incoming request for debugging
    console.log('Incoming request:', {
      userId,
      vendorIds,
      services,
      eventDetails,
      budget
    });

    // Create booking requests for each vendor
    for (const vendorId of vendorIds) {
      const request = new sql.Request(pool);
      
      try {
        const eventDate = parseDate(eventDetails?.date);
        const eventTime = formatTime(eventDetails?.time);

        console.log('Processing request for vendor:', {
          vendorId,
          eventDate,
          eventTime,
          location: eventDetails?.location,
          attendeeCount: eventDetails?.attendeeCount,
          budget
        });

        request.input('UserID', sql.Int, userId);
        request.input('VendorProfileID', sql.Int, vendorId);
        request.input('Services', sql.NVarChar(sql.MAX), JSON.stringify(services));
        request.input('EventDate', sql.Date, eventDate);
        request.input('EventTime', sql.Time, eventTime);
        request.input('EventLocation', sql.NVarChar(500), eventDetails?.location || '');
        request.input('AttendeeCount', sql.Int, eventDetails?.attendeeCount || 50);
        request.input('Budget', sql.Decimal(10, 2), budget);
        request.input('SpecialRequests', sql.NVarChar(sql.MAX), eventDetails?.specialRequests || '');
        request.input('Status', sql.NVarChar(50), 'pending');
        request.input('ExpiresAt', sql.DateTime, new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours

        const result = await request.query(`
          INSERT INTO BookingRequests (
            UserID, VendorProfileID, Services, EventDate, EventTime, EventLocation, 
            AttendeeCount, Budget, SpecialRequests, Status, ExpiresAt, CreatedAt
          )
          OUTPUT INSERTED.RequestID, INSERTED.CreatedAt, INSERTED.ExpiresAt
          VALUES (
            @UserID, @VendorProfileID, @Services, @EventDate, @EventTime, @EventLocation,
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
      } catch (dbError) {
        console.error('Database error for vendor', vendorId, ':', {
          error: dbError.message,
          stack: dbError.stack,
          parameters: {
            UserID: userId,
            VendorProfileID: vendorId,
            EventDate: eventDetails?.date,
            EventTime: eventDetails?.time,
            EventLocation: eventDetails?.location,
            AttendeeCount: eventDetails?.attendeeCount,
            Budget: budget
          }
        });
        throw dbError;
      }
    }

    res.json({
      success: true,
      requests: requests
    });

  } catch (err) {
    console.error('Error in /requests endpoint:', {
      error: err.message,
      stack: err.stack,
      requestBody: req.body
    });
    
    // More specific error messages
    let errorMessage = 'Failed to create booking requests';
    if (err.message.includes('date') || err.message.includes('time')) {
      errorMessage = err.message;
    }
    
    res.status(500).json({ 
      success: false,
      message: errorMessage,
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get services by category for booking modal
router.get('/services/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    // First, get the category name from the service-categories endpoint mapping
    const categoryMap = {
      1: 'venue', 2: 'photo', 3: 'music', 4: 'catering', 5: 'entertainment',
      6: 'experiences', 7: 'decor', 8: 'beauty', 9: 'cake', 10: 'transport',
      11: 'planner', 12: 'fashion', 13: 'stationery'
    };
    
    const categoryKey = categoryMap[parseInt(categoryId)];
    
    if (!categoryKey) {
      return res.json({
        success: true,
        services: []
      });
    }
    
    // Get vendors that offer services in this category
    request.input('Category', sql.NVarChar(50), categoryKey);
    
    const result = await request.query(`
      SELECT DISTINCT
        vp.VendorProfileID,
        vp.BusinessName,
        vp.BusinessDescription,
        vp.PriceLevel,
        vc.Category,
        vad.QuestionText,
        vad.Answer
      FROM VendorCategories vc
      INNER JOIN VendorProfiles vp ON vc.VendorProfileID = vp.VendorProfileID
      LEFT JOIN VendorAdditionalDetails vad ON vp.VendorProfileID = vad.VendorProfileID
      WHERE vc.Category LIKE '%' + @Category + '%'
        AND vp.IsCompleted = 1
        AND vp.AcceptingBookings = 1
      ORDER BY vp.BusinessName
    `);

    // Transform vendor data into services format
    const services = result.recordset.map((vendor, index) => {
      // Generate service name based on category and vendor
      const serviceNames = {
        'venue': `${vendor.BusinessName} - Event Space`,
        'photo': `${vendor.BusinessName} - Photography Services`,
        'music': `${vendor.BusinessName} - Music & DJ Services`,
        'catering': `${vendor.BusinessName} - Catering Services`,
        'entertainment': `${vendor.BusinessName} - Entertainment Services`,
        'experiences': `${vendor.BusinessName} - Experience Services`,
        'decor': `${vendor.BusinessName} - Decoration Services`,
        'beauty': `${vendor.BusinessName} - Beauty Services`,
        'cake': `${vendor.BusinessName} - Cake Services`,
        'transport': `${vendor.BusinessName} - Transportation Services`,
        'planner': `${vendor.BusinessName} - Planning Services`,
        'fashion': `${vendor.BusinessName} - Fashion Services`,
        'stationery': `${vendor.BusinessName} - Stationery Services`
      };
      
      // Estimate pricing based on price level
      const pricingMap = {
        '$': { min: 200, max: 500 },
        '$$': { min: 500, max: 1200 },
        '$$$': { min: 1200, max: 2500 },
        '$$$$': { min: 2500, max: 5000 }
      };
      
      const pricing = pricingMap[vendor.PriceLevel] || pricingMap['$$'];
      
      return {
        ServiceID: vendor.VendorProfileID,
        Name: serviceNames[categoryKey] || `${vendor.BusinessName} - Services`,
        Description: vendor.BusinessDescription || `Professional ${categoryKey} services`,
        BasePrice: pricing.min,
        MaxPrice: pricing.max,
        PriceUnit: 'per event',
        CategoryName: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
        VendorProfileID: vendor.VendorProfileID,
        BusinessName: vendor.BusinessName,
        PriceLevel: vendor.PriceLevel
      };
    });

    // If no services found, return sample services for the category
    if (services.length === 0) {
      const sampleServices = {
        'venue': [
          { id: 1, name: 'Wedding Venue', description: 'Beautiful wedding venue with garden', basePrice: 2000, priceUnit: 'per event' },
          { id: 2, name: 'Corporate Event Space', description: 'Professional meeting and event space', basePrice: 800, priceUnit: 'per day' }
        ],
        'photo': [
          { id: 3, name: 'Wedding Photography', description: 'Professional wedding photography package', basePrice: 1500, priceUnit: 'per event' },
          { id: 4, name: 'Event Videography', description: 'High-quality event video recording', basePrice: 1200, priceUnit: 'per event' }
        ],
        'music': [
          { id: 5, name: 'Wedding DJ', description: 'Professional DJ service for weddings', basePrice: 800, priceUnit: 'per event' },
          { id: 6, name: 'Live Band', description: 'Live music performance', basePrice: 1500, priceUnit: 'per event' }
        ],
        'catering': [
          { id: 7, name: 'Wedding Catering', description: 'Full-service wedding catering', basePrice: 50, priceUnit: 'per person' },
          { id: 8, name: 'Corporate Lunch', description: 'Business meeting catering', basePrice: 25, priceUnit: 'per person' }
        ]
      };
      
      const fallbackServices = sampleServices[categoryKey] || [];
      
      return res.json({
        success: true,
        services: fallbackServices.map(service => ({
          ServiceID: service.id,
          Name: service.name,
          Description: service.description,
          BasePrice: service.basePrice,
          PriceUnit: service.priceUnit,
          CategoryName: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)
        }))
      });
    }

    res.json({
      success: true,
      services: services
    });

  } catch (err) {
    console.error('Error fetching services:', err);
    
    // Return fallback services on error
    const fallbackServices = [
      { ServiceID: 1, Name: 'Professional Service', Description: 'High-quality professional service', BasePrice: 500, PriceUnit: 'per event', CategoryName: 'Service' }
    ];
    
    res.json({
      success: true,
      services: fallbackServices
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
