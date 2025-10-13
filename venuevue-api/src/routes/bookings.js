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

// Create a Stripe Payment Intent (client-side)
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', vendorProfileId, bookingId, description } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    // Resolve vendor profile ID from request or booking
    let resolvedVendorProfileId = vendorProfileId || null;
    if (!resolvedVendorProfileId && bookingId) {
      try {
        const pool = await poolPromise;
        const result = await pool.request()
          .input('BookingID', sql.Int, bookingId)
          .query('SELECT VendorProfileID FROM Bookings WHERE BookingID = @BookingID');
        if (result.recordset.length > 0) {
          resolvedVendorProfileId = result.recordset[0].VendorProfileID;
        }
      } catch (dbErr) {
        console.warn('Could not resolve vendor from booking:', dbErr.message);
      }
    }

    let paymentIntent;
    if (resolvedVendorProfileId) {
      // Fetch vendor's Stripe Connect account ID
      const pool = await poolPromise;
      const accRes = await pool.request()
        .input('VendorProfileID', sql.Int, resolvedVendorProfileId)
        .query('SELECT StripeAccountID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID');
      const vendorStripeAccountId = accRes.recordset.length > 0 ? accRes.recordset[0].StripeAccountID : null;

      if (!vendorStripeAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Vendor is not connected to Stripe'
        });
      }

      // Calculate platform fee (default 5%) in cents
      const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '5') / 100;
      const platformFee = Math.round(Math.round(amount * 100) * platformFeePercent);

      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency,
        description: description || (bookingId ? `Booking Payment #${bookingId}` : undefined),
        application_fee_amount: platformFee,
        transfer_data: {
          destination: vendorStripeAccountId,
        },
        metadata: {
          booking_id: bookingId || null,
          vendor_profile_id: resolvedVendorProfileId,
          platform_fee_percent: (platformFeePercent * 100).toString()
        },
      });
    } else {
      // Fallback: Create standard PaymentIntent (no platform fee) for compatibility
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency,
        description: description || (bookingId ? `Booking Payment #${bookingId}` : undefined),
        metadata: {
          booking_id: bookingId || null,
          vendor_profile_id: null
        },
      });
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      appliedPlatformFee: paymentIntent.application_fee_amount ? paymentIntent.application_fee_amount / 100 : 0,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
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

// Multi-step booking request endpoints
router.post('/requests', async (req, res) => {
  try {
    const { userId, vendorIds, services, eventDetails, budget } = req.body;

    // Input validation
    if (!userId || !vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and vendor IDs are required' 
      });
    }

    if (!eventDetails || !eventDetails.date || !eventDetails.time) {
      return res.status(400).json({
        success: false,
        message: 'Event date and time are required'
      });
    }

    const pool = await poolPromise;
    const requests = [];

    // 1. Parse and validate the time string
    const timeString = String(eventDetails.time).trim();
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    
    if (!timeRegex.test(timeString)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Please use HH:MM or HH:MM:SS'
      });
    }

    // 2. Normalize to HH:MM:SS format
    const timeParts = timeString.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
    
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time values. Hours (0-23), Minutes (0-59), Seconds (0-59)'
      });
    }

    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Optional: parse and normalize end time if provided
    let formattedEndTime = null;
    if (eventDetails.endTime) {
      const endRaw = String(eventDetails.endTime).trim();
      if (!timeRegex.test(endRaw)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid end time format. Please use HH:MM or HH:MM:SS'
        });
      }
      const eparts = endRaw.split(':');
      const eh = parseInt(eparts[0], 10);
      const em = parseInt(eparts[1], 10);
      const es = eparts[2] ? parseInt(eparts[2], 10) : 0;
      if (eh < 0 || eh > 23 || em < 0 || em > 59 || es < 0 || es > 59) {
        return res.status(400).json({
          success: false,
          message: 'Invalid end time values. Hours (0-23), Minutes (0-59), Seconds (0-59)'
        });
      }
      formattedEndTime = `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}:${es.toString().padStart(2, '0')}`;
    }

    // 3. Validate date string (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(eventDetails.date))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD'
      });
    }

    // Create requests for each vendor
    for (const vendorId of vendorIds) {
      try {
        const request = new sql.Request(pool);
        
        request.input('UserID', sql.Int, userId);
        request.input('VendorProfileID', sql.Int, vendorId);
        request.input('Services', sql.NVarChar(sql.MAX), JSON.stringify(services));
        request.input('EventDate', sql.VarChar(10), String(eventDetails.date));
        request.input('EventTime', sql.VarChar(8), formattedTime);
        request.input('EventEndTime', sql.VarChar(8), formattedEndTime || null);
        request.input('EventLocation', sql.NVarChar(500), eventDetails.location || null);
        request.input('AttendeeCount', sql.Int, eventDetails.attendeeCount || 50);
        request.input('Budget', sql.Decimal(10, 2), budget);
        request.input('SpecialRequests', sql.NVarChar(sql.MAX), eventDetails.specialRequests || null);
        request.input('EventName', sql.NVarChar(255), eventDetails.name || null);
        request.input('EventType', sql.NVarChar(100), eventDetails.type || null);
        request.input('TimeZone', sql.NVarChar(100), eventDetails.timezone || null);
        request.input('Status', sql.NVarChar(50), 'pending');
        
        // Set expiry to 24 hours from now
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        request.input('ExpiresAt', sql.DateTime, expiresAt);

        const result = await request.query(`
          INSERT INTO BookingRequests (
            UserID, VendorProfileID, Services, EventDate, EventTime, EventEndTime, EventLocation, 
            AttendeeCount, Budget, SpecialRequests, EventName, EventType, TimeZone, Status, ExpiresAt, CreatedAt
          )
          OUTPUT INSERTED.RequestID, INSERTED.CreatedAt, INSERTED.ExpiresAt
          VALUES (
            @UserID, @VendorProfileID, @Services, 
            TRY_CONVERT(DATE, @EventDate), 
            TRY_CONVERT(TIME, @EventTime),
            TRY_CONVERT(TIME, @EventEndTime),
            @EventLocation,
            @AttendeeCount, @Budget, @SpecialRequests,
            @EventName, @EventType, @TimeZone,
            @Status, @ExpiresAt, GETDATE()
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
      } catch (err) {
        console.error(`Error creating request for vendor ${vendorId}:`, err);
        throw err;
      }
    }

    res.json({
      success: true,
      requests: requests
    });

  } catch (err) {
    console.error('Database error:', {
      message: err.message,
      code: err.code,
      number: err.number,
      stack: err.stack
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to create booking requests',
      error: err.message,
      details: {
        code: err.code,
        number: err.number
      }
    });
  }
});

// Get service categories for booking modal
router.get('/service-categories', (req, res) => {
  const categories = [
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

  res.status(200).json({
    success: true,
    categories: categories
  });
});

// Get services by category for booking modal
router.get('/services/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
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
    
    request.input('Category', sql.NVarChar(50), categoryKey);
    
    const result = await request.query(`
      SELECT DISTINCT
        vp.VendorProfileID,
        vp.BusinessName,
        vp.BusinessDescription,
        vp.PriceLevel,
        vc.Category
      FROM VendorCategories vc
      INNER JOIN VendorProfiles vp ON vc.VendorProfileID = vp.VendorProfileID
      WHERE vc.Category LIKE '%' + @Category + '%'
        AND vp.IsCompleted = 1
      ORDER BY vp.BusinessName
    `);

    const services = result.recordset.map((vendor, index) => {
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
        CONVERT(VARCHAR(8), br.EventTime, 108) AS EventTime,
        CONVERT(VARCHAR(8), br.EventEndTime, 108) AS EventEndTime,
        br.EventLocation,
        br.AttendeeCount,
        br.Budget,
        br.SpecialRequests,
        br.EventName,
        br.EventType,
        br.TimeZone,
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

// Get requests for a vendor with direction and status filters
router.get('/vendor/:vendorId/requests', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const rawStatus = (req.query.status || 'all').toString().toLowerCase();
    const direction = (req.query.direction || 'inbound').toString().toLowerCase(); // inbound | outbound

    const pool = await poolPromise;
    const request = new sql.Request(pool);

    // Always have VendorProfileID param
    request.input('VendorProfileID', sql.Int, parseInt(vendorId));

    // Resolve vendor's UserID (for outbound queries)
    let vendorUserId = null;
    if (direction === 'outbound') {
      const vu = await pool.request()
        .input('VendorProfileID', sql.Int, parseInt(vendorId))
        .query('SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID');
      vendorUserId = vu.recordset[0]?.UserID || null;
      if (!vendorUserId) {
        return res.json({ success: true, requests: [] });
      }
    }

    // Build WHERE for direction
    let whereClause = direction === 'outbound'
      ? 'br.UserID = @VendorUserID'
      : 'br.VendorProfileID = @VendorProfileID';

    if (direction === 'outbound') {
      request.input('VendorUserID', sql.Int, vendorUserId);
    }

    // Build status filter
    let statusFilter = '';
    if (rawStatus && rawStatus !== 'all') {
      request.input('Status', sql.NVarChar(50), rawStatus);
      if (rawStatus === 'expired') {
        // Include explicit expired rows or pending rows past expiry
        statusFilter = " AND (br.Status = 'expired' OR (br.Status = 'pending' AND br.ExpiresAt <= GETDATE()))";
      } else {
        statusFilter = ' AND br.Status = @Status';
      }
    }

    const orderClause = (rawStatus === 'all')
      ? 'ORDER BY br.CreatedAt DESC'
      : `ORDER BY 
        CASE WHEN br.Status = 'pending' THEN 1 ELSE 2 END,
        br.CreatedAt DESC`;

    const query = `
      SELECT 
        br.RequestID,
        br.UserID,
        u.Name AS ClientName,
        u.Email AS ClientEmail,
        vp.BusinessName AS VendorName,
        br.Services,
        br.EventDate,
        CONVERT(VARCHAR(8), br.EventTime, 108) AS EventTime,
        CONVERT(VARCHAR(8), br.EventEndTime, 108) AS EventEndTime,
        br.EventLocation,
        br.AttendeeCount,
        br.Budget,
        br.SpecialRequests,
        br.EventName,
        br.EventType,
        br.TimeZone,
        br.Status,
        br.CreatedAt,
        br.ExpiresAt,
        CASE WHEN br.ExpiresAt <= GETDATE() AND br.Status = 'pending' THEN 1 ELSE 0 END AS IsExpired
      FROM BookingRequests br
      LEFT JOIN Users u ON br.UserID = u.UserID
      LEFT JOIN VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
      WHERE ${whereClause}
      ${statusFilter}
      ${orderClause}`;

    const result = await request.query(query);

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

// Enhanced request management endpoints

// Create a new request with special request text for a specific vendor
router.post('/requests/send', async (req, res) => {
  try {
    const { 
      userId, 
      vendorProfileId, 
      specialRequestText,
      eventDate,
      eventTime,
      eventEndTime,
      eventLocation,
      attendeeCount,
      budget,
      services,
      eventName,
      eventType,
      timeZone
    } = req.body;

    // Validation
    if (!userId || !vendorProfileId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID and Vendor Profile ID are required' 
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    // Set expiry to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    request.input('UserID', sql.Int, userId);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('SpecialRequestText', sql.NVarChar(sql.MAX), specialRequestText || null);
    request.input('EventDate', sql.VarChar(10), eventDate || null);
    request.input('EventTime', sql.VarChar(8), eventTime || null);
    request.input('EventEndTime', sql.VarChar(8), eventEndTime || null);
    request.input('EventLocation', sql.NVarChar(500), eventLocation || null);
    request.input('AttendeeCount', sql.Int, attendeeCount || null);
    request.input('Budget', sql.Decimal(10, 2), budget || null);
    request.input('Services', sql.NVarChar(sql.MAX), services ? JSON.stringify(services) : null);
    request.input('EventName', sql.NVarChar(255), eventName || null);
    request.input('EventType', sql.NVarChar(100), eventType || null);
    request.input('TimeZone', sql.NVarChar(100), timeZone || null);
    request.input('Status', sql.NVarChar(50), 'pending');
    request.input('ExpiresAt', sql.DateTime, expiresAt);

    const result = await request.query(`
      INSERT INTO BookingRequests (
        UserID, VendorProfileID, SpecialRequests, EventDate, EventTime, EventEndTime,
        EventLocation, AttendeeCount, Budget, Services, EventName, EventType, TimeZone, Status, ExpiresAt, CreatedAt
      )
      OUTPUT INSERTED.RequestID, INSERTED.CreatedAt, INSERTED.ExpiresAt
      VALUES (
        @UserID, @VendorProfileID, @SpecialRequestText, TRY_CONVERT(DATE, @EventDate), TRY_CONVERT(TIME, @EventTime), TRY_CONVERT(TIME, @EventEndTime),
        @EventLocation, @AttendeeCount, @Budget, @Services, @EventName, @EventType, @TimeZone, @Status, @ExpiresAt, GETDATE()
      )
    `);

    if (result.recordset.length === 0) {
      throw new Error('Failed to create request');
    }

    const newRequest = result.recordset[0];

    // Create a conversation for this request
    const conversationRequest = pool.request();
    conversationRequest.input('UserID', sql.Int, userId);
    conversationRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    conversationRequest.input('Subject', sql.NVarChar(255), 'New Booking Request');

    const conversationResult = await conversationRequest.query(`
      INSERT INTO Conversations (UserID, VendorProfileID, Subject, CreatedAt)
      OUTPUT INSERTED.ConversationID
      VALUES (@UserID, @VendorProfileID, @Subject, GETDATE())
    `);

    const conversationId = conversationResult.recordset[0].ConversationID;

    // Send initial message if special request text exists
    if (specialRequestText) {
      const messageRequest = pool.request();
      messageRequest.input('ConversationID', sql.Int, conversationId);
      messageRequest.input('SenderID', sql.Int, userId);
      messageRequest.input('Content', sql.NVarChar(sql.MAX), specialRequestText);

      await messageRequest.query(`
        INSERT INTO Messages (ConversationID, SenderID, Content, CreatedAt)
        VALUES (@ConversationID, @SenderID, @Content, GETDATE())
      `);
    }

    // Create notification for vendor
    const vendorUserResult = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .query('SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID');

    if (vendorUserResult.recordset.length > 0) {
      const vendorUserId = vendorUserResult.recordset[0].UserID;
      
      const notificationRequest = pool.request();
      notificationRequest.input('UserID', sql.Int, vendorUserId);
      notificationRequest.input('Type', sql.NVarChar(50), 'new_request');
      notificationRequest.input('Title', sql.NVarChar(255), 'New Booking Request');
      notificationRequest.input('Message', sql.NVarChar(sql.MAX), 'You have received a new booking request. You have 24 hours to respond.');
      notificationRequest.input('RelatedID', sql.Int, newRequest.RequestID);
      notificationRequest.input('RelatedType', sql.NVarChar(50), 'request');

      await notificationRequest.query(`
        INSERT INTO Notifications (UserID, Type, Title, Message, RelatedID, RelatedType, CreatedAt)
        VALUES (@UserID, @Type, @Title, @Message, @RelatedID, @RelatedType, GETDATE())
      `);
    }

    res.json({
      success: true,
      requestId: newRequest.RequestID,
      conversationId: conversationId,
      expiresAt: newRequest.ExpiresAt,
      message: 'Request sent successfully'
    });

  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create request',
      error: err.message 
    });
  }
});

// Vendor approves a request
router.post('/requests/:requestId/approve', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { vendorProfileId, responseMessage } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({ 
        success: false,
        message: 'Vendor Profile ID is required' 
      });
    }

    const pool = await poolPromise;
    
    // Update request status
    const updateResult = await pool.request()
      .input('RequestID', sql.Int, requestId)
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .input('Status', sql.NVarChar(50), 'approved')
      .input('ResponseMessage', sql.NVarChar(sql.MAX), responseMessage || null)
      .input('RespondedAt', sql.DateTime, new Date())
      .query(`
        UPDATE BookingRequests 
        SET Status = @Status, ResponseMessage = @ResponseMessage, RespondedAt = @RespondedAt
        OUTPUT INSERTED.UserID, INSERTED.RequestID
        WHERE RequestID = @RequestID AND VendorProfileID = @VendorProfileID AND Status IN ('pending','expired')
      `);

    if (updateResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Request not found or already responded to' 
      });
    }

    const userId = updateResult.recordset[0].UserID;

    // Create notification for user
    const notificationRequest = pool.request();
    notificationRequest.input('UserID', sql.Int, userId);
    notificationRequest.input('Type', sql.NVarChar(50), 'request_approved');
    notificationRequest.input('Title', sql.NVarChar(255), 'Request Approved!');
    notificationRequest.input('Message', sql.NVarChar(sql.MAX), 'Your booking request has been approved. You can now proceed to payment.');
    notificationRequest.input('RelatedID', sql.Int, requestId);
    notificationRequest.input('RelatedType', sql.NVarChar(50), 'request');

    await notificationRequest.query(`
      INSERT INTO Notifications (UserID, Type, Title, Message, RelatedID, RelatedType, CreatedAt)
      VALUES (@UserID, @Type, @Title, @Message, @RelatedID, @RelatedType, GETDATE())
    `);

    // Ensure conversation exists and send auto-approval message
    // 1) Find/Create conversation for this user/vendor pair
    let conversationId = null;
    const convLookup = await pool.request()
      .input('UserID', sql.Int, userId)
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .query(`
        SELECT TOP 1 ConversationID FROM Conversations 
        WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
        ORDER BY CreatedAt DESC
      `);

    if (convLookup.recordset.length > 0) {
      conversationId = convLookup.recordset[0].ConversationID;
    } else {
      const convCreate = await pool.request()
        .input('UserID', sql.Int, userId)
        .input('VendorProfileID', sql.Int, vendorProfileId)
        .input('Subject', sql.NVarChar(255), 'Request Approved')
        .query(`
          INSERT INTO Conversations (UserID, VendorProfileID, Subject, CreatedAt)
          OUTPUT INSERTED.ConversationID
          VALUES (@UserID, @VendorProfileID, @Subject, GETDATE())
        `);
      conversationId = convCreate.recordset[0].ConversationID;
    }

    // 2) Find vendor's UserID (sender)
    let vendorUserId = null;
    const vendorUserRes = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .query('SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID');
    if (vendorUserRes.recordset.length > 0) {
      vendorUserId = vendorUserRes.recordset[0].UserID;
    }

    // 3) Insert the auto-approval message
    if (conversationId && vendorUserId) {
      await pool.request()
        .input('ConversationID', sql.Int, conversationId)
        .input('SenderID', sql.Int, vendorUserId)
        .input('Content', sql.NVarChar(sql.MAX), 'Hello! Your booking request has been approved. Feel free to ask any questions about your upcoming event.')
        .query(`
          INSERT INTO Messages (ConversationID, SenderID, Content, CreatedAt)
          VALUES (@ConversationID, @SenderID, @Content, GETDATE())
        `);
    }

    res.json({
      success: true,
      message: 'Request approved successfully',
      userId: userId,
      requestId: requestId,
      vendorProfileId: vendorProfileId,
      conversationId: conversationId || null
    });

  } catch (err) {
    console.error('Approve request error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to approve request',
      error: err.message 
    });
  }
});

// Vendor declines a request
router.post('/requests/:requestId/decline', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { vendorProfileId, responseMessage } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({ 
        success: false,
        message: 'Vendor Profile ID is required' 
      });
    }

    const pool = await poolPromise;
    
    // Update request status
    const updateResult = await pool.request()
      .input('RequestID', sql.Int, requestId)
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .input('Status', sql.NVarChar(50), 'declined')
      .input('ResponseMessage', sql.NVarChar(sql.MAX), responseMessage || null)
      .input('RespondedAt', sql.DateTime, new Date())
      .query(`
        UPDATE BookingRequests 
        SET Status = @Status, ResponseMessage = @ResponseMessage, RespondedAt = @RespondedAt
        OUTPUT INSERTED.UserID, INSERTED.RequestID
        WHERE RequestID = @RequestID AND VendorProfileID = @VendorProfileID AND Status = 'pending'
      `);

    if (updateResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Request not found or already responded to' 
      });
    }

    const userId = updateResult.recordset[0].UserID;

    // Create notification for user
    const notificationRequest = pool.request();
    notificationRequest.input('UserID', sql.Int, userId);
    notificationRequest.input('Type', sql.NVarChar(50), 'request_declined');
    notificationRequest.input('Title', sql.NVarChar(255), 'Request Declined');
    notificationRequest.input('Message', sql.NVarChar(sql.MAX), 'Your booking request was declined. You can select another vendor.');
    notificationRequest.input('RelatedID', sql.Int, requestId);
    notificationRequest.input('RelatedType', sql.NVarChar(50), 'request');

    await notificationRequest.query(`
      INSERT INTO Notifications (UserID, Type, Title, Message, RelatedID, RelatedType, CreatedAt)
      VALUES (@UserID, @Type, @Title, @Message, @RelatedID, @RelatedType, GETDATE())
    `);

    res.json({
      success: true,
      message: 'Request declined successfully'
    });

  } catch (err) {
    console.error('Decline request error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to decline request',
      error: err.message 
    });
  }
});

// User cancels their own request
router.post('/requests/:requestId/cancel', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required' 
      });
    }

    const pool = await poolPromise;
    
    // Update request status
    const updateResult = await pool.request()
      .input('RequestID', sql.Int, requestId)
      .input('UserID', sql.Int, userId)
      .input('Status', sql.NVarChar(50), 'cancelled')
      .input('RespondedAt', sql.DateTime, new Date())
      .query(`
        UPDATE BookingRequests 
        SET Status = @Status, RespondedAt = @RespondedAt
        OUTPUT INSERTED.VendorProfileID
        WHERE RequestID = @RequestID AND UserID = @UserID AND Status IN ('pending', 'approved')
      `);

    if (updateResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Request not found or cannot be cancelled' 
      });
    }

    res.json({
      success: true,
      message: 'Request cancelled successfully'
    });

  } catch (err) {
    console.error('Cancel request error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to cancel request',
      error: err.message 
    });
  }
});

// Create confirmed booking record
router.post('/confirmed', async (req, res) => {
  try {
    const { requestId, status, approvedAt, userId, vendorProfileId } = req.body;

    if (!requestId || !userId || !vendorProfileId) {
      return res.status(400).json({ 
        success: false,
        message: 'RequestId, userId, and vendorProfileId are required' 
      });
    }

    const pool = await poolPromise;
    
    // Get request details to create booking
    const requestDetails = await pool.request()
      .input('RequestID', sql.Int, requestId)
      .query(`
        SELECT EventDate, EventTime, EventLocation, AttendeeCount, Budget, Services, SpecialRequests
        FROM BookingRequests 
        WHERE RequestID = @RequestID
      `);

    if (requestDetails.recordset.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking request not found' 
      });
    }

    const requestData = requestDetails.recordset[0];
    
    // Create booking in Bookings table
    const request = pool.request();
    request.input('UserID', sql.Int, userId);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('ServiceID', sql.Int, 1); // Default service ID
    request.input('EventDate', sql.DateTime, requestData.EventDate || new Date());
    request.input('Status', sql.NVarChar(20), 'confirmed');
    request.input('AttendeeCount', sql.Int, requestData.AttendeeCount || 1);
    request.input('SpecialRequests', sql.NVarChar(sql.MAX), requestData.SpecialRequests);
    request.input('TotalAmount', sql.Decimal(10, 2), requestData.Budget || 0);

    const result = await request.query(`
      INSERT INTO Bookings (UserID, VendorProfileID, ServiceID, EventDate, Status, AttendeeCount, SpecialRequests, TotalAmount)
      OUTPUT INSERTED.BookingID
      VALUES (@UserID, @VendorProfileID, @ServiceID, @EventDate, @Status, @AttendeeCount, @SpecialRequests, @TotalAmount)
    `);

    const bookingId = result.recordset && result.recordset[0] ? result.recordset[0].BookingID : null;

    // Ensure a conversation exists for this request/user/vendor
    let conversationId = null;
    const convLookup2 = await pool.request()
      .input('UserID', sql.Int, userId)
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .query(`
        SELECT TOP 1 ConversationID FROM Conversations 
        WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
        ORDER BY CreatedAt DESC
      `);

    if (convLookup2.recordset.length > 0) {
      conversationId = convLookup2.recordset[0].ConversationID;
    } else {
      const convCreate2 = await pool.request()
        .input('UserID', sql.Int, userId)
        .input('VendorProfileID', sql.Int, vendorProfileId)
        .input('Subject', sql.NVarChar(255), 'Booking Confirmed')
        .query(`
          INSERT INTO Conversations (UserID, VendorProfileID, Subject, CreatedAt)
          OUTPUT INSERTED.ConversationID
          VALUES (@UserID, @VendorProfileID, @Subject, GETDATE())
        `);
      conversationId = convCreate2.recordset[0].ConversationID;
    }

    // (Removed) Do not auto-insert a system message on booking confirmation

    // Find vendor's actual UserID from VendorProfiles
    let vendorUserId = null;
    const vendorUserRes = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .query('SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID');
    if (vendorUserRes.recordset.length > 0) {
      vendorUserId = vendorUserRes.recordset[0].UserID;
    }

    // Create notifications for both parties
    if (bookingId) {
      // Notify user
      await pool.request()
        .input('UserID', sql.Int, userId)
        .input('Type', sql.NVarChar(50), 'booking_confirmed')
        .input('Title', sql.NVarChar(255), 'Booking Confirmed')
        .input('Message', sql.NVarChar(sql.MAX), 'Your booking has been confirmed.')
        .input('RelatedID', sql.Int, bookingId)
        .input('RelatedType', sql.NVarChar(50), 'booking')
        .query(`
          INSERT INTO Notifications (UserID, Type, Title, Message, RelatedID, RelatedType, CreatedAt)
          VALUES (@UserID, @Type, @Title, @Message, @RelatedID, @RelatedType, GETDATE())
        `);

      // Notify vendor
      if (vendorUserId) {
        await pool.request()
          .input('UserID', sql.Int, vendorUserId)
          .input('Type', sql.NVarChar(50), 'booking_confirmed')
          .input('Title', sql.NVarChar(255), 'New Confirmed Booking')
          .input('Message', sql.NVarChar(sql.MAX), 'A user has confirmed a booking with you.')
          .input('RelatedID', sql.Int, bookingId)
          .input('RelatedType', sql.NVarChar(50), 'booking')
          .query(`
            INSERT INTO Notifications (UserID, Type, Title, Message, RelatedID, RelatedType, CreatedAt)
            VALUES (@UserID, @Type, @Title, @Message, @RelatedID, @RelatedType, GETDATE())
          `);
      }
    }

    res.json({
      success: true,
      message: 'Confirmed booking created successfully',
      bookingId: bookingId || null,
      conversationId: conversationId || null
    });

  } catch (err) {
    console.error('Create confirmed booking error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create confirmed booking',
      error: err.message 
    });
  }
});

// Build and return invoice JSON for a booking
router.get('/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;
    const requesterUserId = parseInt(req.query.userId || req.query.viewerUserId || req.query.requesterUserId || 0, 10);
    if (!id) return res.status(400).json({ success: false, message: 'Booking ID is required' });
    if (!requesterUserId) return res.status(400).json({ success: false, message: 'userId is required' });

    const pool = await poolPromise;
    const bookingInfoRes = await pool.request()
      .input('BookingID', sql.Int, parseInt(id))
      .query(`
        SELECT b.BookingID, b.UserID AS ClientUserID, b.VendorProfileID, b.EventDate, b.EndDate, b.Status,
               b.TotalAmount, b.DepositAmount, b.DepositPaid, b.FullAmountPaid, b.StripePaymentIntentID,
               u.Name AS ClientName, u.Email AS ClientEmail, u.Phone AS ClientPhone,
               vp.BusinessName AS VendorName, vp.BusinessEmail AS VendorEmail, vp.BusinessPhone AS VendorPhone,
               vp.UserID AS VendorUserID
        FROM Bookings b
        JOIN Users u ON b.UserID = u.UserID
        JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
        WHERE b.BookingID = @BookingID
      `);

    if (bookingInfoRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const b = bookingInfoRes.recordset[0];
    // Access control: only client or vendor user can view
    if (requesterUserId !== b.ClientUserID && requesterUserId !== b.VendorUserID) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Load services
    const servicesRes = await pool.request()
      .input('BookingID', sql.Int, parseInt(id))
      .query(`
        SELECT bs.BookingServiceID, bs.ServiceID, s.Name AS ServiceName,
               bs.AddOnID, sa.Name AS AddOnName, bs.Quantity, bs.PriceAtBooking
        FROM BookingServices bs
        LEFT JOIN Services s ON bs.ServiceID = s.ServiceID
        LEFT JOIN ServiceAddOns sa ON bs.AddOnID = sa.AddOnID
        WHERE bs.BookingID = @BookingID
      `);

    // Load expenses (vendor-added)
    const expensesRes = await pool.request()
      .input('BookingID', sql.Int, parseInt(id))
      .query(`SELECT BookingExpenseID, Title, Amount, Notes, CreatedAt FROM BookingExpenses WHERE BookingID = @BookingID ORDER BY CreatedAt`);

    // Load transactions (payments)
    const txRes = await pool.request()
      .input('BookingID', sql.Int, parseInt(id))
      .query(`SELECT Amount, FeeAmount, NetAmount, Currency, CreatedAt FROM Transactions WHERE BookingID = @BookingID ORDER BY CreatedAt`);

    // Compute totals
    const serviceItems = servicesRes.recordset.map(row => {
      const name = row.ServiceName || 'Service';
      const addOn = row.AddOnName ? ` + ${row.AddOnName}` : '';
      const quantity = Number(row.Quantity || 1);
      const unit = Number(row.PriceAtBooking || 0);
      const lineTotal = +(quantity * unit).toFixed(2);
      return { type: 'service', name: name + addOn, quantity, unitPrice: unit, lineTotal };
    });
    const servicesSubtotal = +serviceItems.reduce((sum, it) => sum + it.lineTotal, 0).toFixed(2);

    const expenseItems = expensesRes.recordset.map(row => ({
      type: 'expense',
      name: row.Title,
      quantity: 1,
      unitPrice: +Number(row.Amount || 0).toFixed(2),
      lineTotal: +Number(row.Amount || 0).toFixed(2),
      notes: row.Notes || null,
      createdAt: row.CreatedAt
    }));
    const expensesTotal = +expenseItems.reduce((sum, it) => sum + it.lineTotal, 0).toFixed(2);

    const subtotal = +(servicesSubtotal + expensesTotal).toFixed(2);

    // Fees: platform and processing
    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '5');
    const platformFee = +((subtotal * (isFinite(platformFeePercent) ? platformFeePercent : 0)) / 100).toFixed(2);

    const recordedProcessingFees = +txRes.recordset.reduce((sum, r) => sum + Number(r.FeeAmount || 0), 0).toFixed(2);
    const stripePercent = parseFloat(process.env.STRIPE_PROC_FEE_PERCENT || '2.9');
    const stripeFixed = parseFloat(process.env.STRIPE_PROC_FEE_FIXED || '0.30');
    const estimatedProcessingFees = +((subtotal * (isFinite(stripePercent) ? stripePercent : 0) / 100) + (isFinite(stripeFixed) ? stripeFixed : 0)).toFixed(2);
    const processingFees = recordedProcessingFees > 0 ? recordedProcessingFees : estimatedProcessingFees;

    const grandTotal = +(subtotal + platformFee + processingFees).toFixed(2);
    const totalPaid = +txRes.recordset.reduce((sum, r) => sum + Number(r.Amount || 0), 0).toFixed(2);
    const balanceDue = Math.max(0, +(grandTotal - totalPaid).toFixed(2));

    // Prepare invoice payload
    const issuedAt = new Date();
    const invoiceNumber = `INV-${b.BookingID}-${issuedAt.getFullYear()}${String(issuedAt.getMonth()+1).padStart(2,'0')}${String(issuedAt.getDate()).padStart(2,'0')}`;
    const viewerRole = requesterUserId === b.VendorUserID ? 'vendor' : 'client';

    const lineItems = [...serviceItems, ...expenseItems];

    res.json({
      success: true,
      invoice: {
        invoiceNumber,
        issuedAt,
        bookingId: b.BookingID,
        eventDate: b.EventDate,
        status: b.Status,
        currency: (txRes.recordset[0]?.Currency) || 'USD',
        viewerRole,
        billFrom: { name: b.VendorName, email: b.VendorEmail, phone: b.VendorPhone },
        billTo: { name: b.ClientName, email: b.ClientEmail, phone: b.ClientPhone },
        client: { id: b.ClientUserID, name: b.ClientName, email: b.ClientEmail },
        vendor: { vendorProfileId: b.VendorProfileID, name: b.VendorName, email: b.VendorEmail },
        lineItems,
        totals: {
          servicesSubtotal,
          expensesTotal,
          subtotal,
          platformFeePercent,
          platformFee,
          processingFees,
          processingFeesSource: recordedProcessingFees > 0 ? 'recorded' : 'estimated',
          grandTotal,
          totalPaid,
          balanceDue
        },
        payments: txRes.recordset
      }
    });
  } catch (err) {
    console.error('Invoice build error:', err);
    res.status(500).json({ success: false, message: 'Failed to build invoice', error: err.message });
  }
});

// List expenses for a booking (client or vendor can view)
router.get('/:id/expenses', async (req, res) => {
  try {
    const { id } = req.params;
    const requesterUserId = parseInt(req.query.userId || 0, 10);
    if (!id) return res.status(400).json({ success: false, message: 'Booking ID is required' });
    if (!requesterUserId) return res.status(400).json({ success: false, message: 'userId is required' });

    const pool = await poolPromise;
    const bres = await pool.request()
      .input('BookingID', sql.Int, parseInt(id))
      .query(`SELECT UserID AS ClientUserID, VendorProfileID FROM Bookings WHERE BookingID = @BookingID`);
    if (bres.recordset.length === 0) return res.status(404).json({ success: false, message: 'Booking not found' });
    const clientId = bres.recordset[0].ClientUserID;
    const vpid = bres.recordset[0].VendorProfileID;
    const vuserRes = await pool.request().input('VendorProfileID', sql.Int, vpid).query(`SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID`);
    const vendorUserId = vuserRes.recordset[0]?.UserID || 0;
    if (requesterUserId !== clientId && requesterUserId !== vendorUserId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const exRes = await pool.request().input('BookingID', sql.Int, parseInt(id)).query(`SELECT BookingExpenseID, Title, Amount, Notes, CreatedAt FROM BookingExpenses WHERE BookingID = @BookingID ORDER BY CreatedAt`);
    res.json({ success: true, expenses: exRes.recordset });
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ success: false, message: 'Failed to get expenses', error: err.message });
  }
});

// Add an expense (vendor-only)
router.post('/:id/expenses', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, title, amount, notes } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Booking ID is required' });
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
    if (!title || typeof title !== 'string') return res.status(400).json({ success: false, message: 'Valid title required' });
    const amt = parseFloat(amount);
    if (!isFinite(amt) || amt <= 0) return res.status(400).json({ success: false, message: 'Valid amount required' });

    const pool = await poolPromise;
    const bres = await pool.request()
      .input('BookingID', sql.Int, parseInt(id))
      .query(`SELECT VendorProfileID FROM Bookings WHERE BookingID = @BookingID`);
    if (bres.recordset.length === 0) return res.status(404).json({ success: false, message: 'Booking not found' });
    const vendorProfileId = bres.recordset[0].VendorProfileID;
    const vuserRes = await pool.request().input('VendorProfileID', sql.Int, vendorProfileId).query(`SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID`);
    const vendorUserId = vuserRes.recordset[0]?.UserID || 0;
    if (userId !== vendorUserId) return res.status(403).json({ success: false, message: 'Only vendor can add expenses' });

    const insertRes = await pool.request()
      .input('BookingID', sql.Int, parseInt(id))
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .input('Title', sql.NVarChar(255), title.trim())
      .input('Amount', sql.Decimal(10, 2), amt)
      .input('Notes', sql.NVarChar(sql.MAX), notes || null)
      .query(`
        INSERT INTO BookingExpenses (BookingID, VendorProfileID, Title, Amount, Notes, CreatedAt)
        OUTPUT INSERTED.BookingExpenseID, INSERTED.Title, INSERTED.Amount, INSERTED.Notes, INSERTED.CreatedAt
        VALUES (@BookingID, @VendorProfileID, @Title, @Amount, @Notes, GETDATE())
      `);

    res.json({ success: true, expense: insertRes.recordset[0] });
  } catch (err) {
    console.error('Add expense error:', err);
    res.status(500).json({ success: false, message: 'Failed to add expense', error: err.message });
  }
});

module.exports = router;
