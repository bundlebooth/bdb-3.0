const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const { serializeDates, serializeRecords } = require('../utils/helpers');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const invoicesRouter = require('./invoices');
const { decodeBookingId, decodeVendorId, isPublicId } = require('../utils/hashIds');
const { 
  notifyVendorOfNewRequest, 
  notifyClientOfApproval, 
  notifyClientOfRejection,
  notifyOfBookingCancellation
} = require('../services/emailService');
const { 
  getProvinceFromLocation, 
  getTaxInfoForProvince 
} = require('../utils/taxCalculations');

// Helper to resolve booking ID (handles both public ID and numeric ID)
function resolveBookingId(idParam) {
  if (!idParam) return null;
  if (isPublicId(idParam)) {
    return decodeBookingId(idParam);
  }
  const parsed = parseInt(idParam, 10);
  return isNaN(parsed) ? null : parsed;
}

// Create a new booking
router.post('/', async (req, res) => {
  try {
    const { 
      userId, 
      vendorProfileId, 
      eventDate, 
      eventTime,
      eventEndTime,
      endDate, 
      attendeeCount, 
      specialRequests,
      specialRequestText,
      services,
      paymentIntentId,
      eventName,
      eventType,
      eventLocation,
      packageId,
      packageName,
      packagePrice,
      budget,
      timeZone,
      isInstantBooking,
      // Financial details for instant booking
      subtotal,
      platformFee,
      taxAmount,
      taxPercent,
      taxLabel,
      processingFee,
      grandTotal
    } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    // Build start datetime from eventDate + eventTime
    let startDateTime = new Date(eventDate);
    if (eventTime) {
      const [hours, minutes] = eventTime.split(':');
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    
    // Build end datetime from eventDate + eventEndTime (or use endDate if provided)
    let endDateTime;
    if (endDate) {
      endDateTime = new Date(endDate);
    } else if (eventEndTime) {
      endDateTime = new Date(eventDate);
      const [hours, minutes] = eventEndTime.split(':');
      endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      // Default to same as start if no end time provided
      endDateTime = new Date(startDateTime);
    }
    
    request.input('UserID', sql.Int, userId);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('EventDate', sql.DateTime, startDateTime);
    request.input('EndDate', sql.DateTime, endDateTime);
    request.input('AttendeeCount', sql.Int, attendeeCount || 1);
    request.input('SpecialRequests', sql.NVarChar(sql.MAX), specialRequests || specialRequestText || null);
    request.input('ServicesJSON', sql.NVarChar(sql.MAX), JSON.stringify(services || []));
    request.input('PaymentIntentID', sql.NVarChar(100), paymentIntentId || null);
    request.input('EventLocation', sql.NVarChar(500), eventLocation || null);
    request.input('EventName', sql.NVarChar(255), eventName || null);
    request.input('EventType', sql.NVarChar(100), eventType || null);
    request.input('TimeZone', sql.NVarChar(100), timeZone || null);
    request.input('IsInstantBooking', sql.Bit, isInstantBooking ? 1 : 0);
    request.input('TotalAmount', sql.Decimal(10, 2), grandTotal || budget || packagePrice || 0);
    // Financial details
    request.input('Subtotal', sql.Decimal(10, 2), subtotal || 0);
    request.input('PlatformFee', sql.Decimal(10, 2), platformFee || 0);
    request.input('TaxAmount', sql.Decimal(10, 2), taxAmount || 0);
    request.input('TaxPercent', sql.Decimal(5, 3), taxPercent || 0);
    request.input('TaxLabel', sql.NVarChar(50), taxLabel || null);
    request.input('ProcessingFee', sql.Decimal(10, 2), processingFee || 0);
    request.input('GrandTotal', sql.Decimal(10, 2), grandTotal || 0);

    const result = await request.execute('bookings.sp_CreateWithServices');
    
    const bookingId = result.recordset[0].BookingID;
    const conversationId = result.recordset[0].ConversationID;

    // For instant bookings, generate invoice automatically
    if (isInstantBooking && bookingId) {
      try {
        const invoiceRequest = new sql.Request(pool);
        invoiceRequest.input('BookingID', sql.Int, bookingId);
        invoiceRequest.input('Subtotal', sql.Decimal(10, 2), subtotal || 0);
        invoiceRequest.input('PlatformFee', sql.Decimal(10, 2), platformFee || 0);
        invoiceRequest.input('TaxAmount', sql.Decimal(10, 2), taxAmount || 0);
        invoiceRequest.input('TaxPercent', sql.Decimal(5, 3), taxPercent || 0);
        invoiceRequest.input('TaxLabel', sql.NVarChar(50), taxLabel || 'HST 13%');
        invoiceRequest.input('ProcessingFee', sql.Decimal(10, 2), processingFee || 0);
        invoiceRequest.input('GrandTotal', sql.Decimal(10, 2), grandTotal || 0);
        invoiceRequest.input('PaymentIntentID', sql.NVarChar(100), paymentIntentId || null);
        
        await invoiceRequest.execute('invoices.sp_CreateInstantBookingInvoice');
        console.log(`Invoice created for instant booking ${bookingId}`);
      } catch (invoiceErr) {
        console.error('Failed to create invoice for instant booking:', invoiceErr.message);
        // Don't fail the booking creation if invoice fails
      }
    }

    res.json({
      success: true,
      bookingId,
      conversationId,
      data: {
        BookingID: bookingId,
        ConversationID: conversationId,
        EventName: eventName,
        EventDate: eventDate,
        TotalAmount: grandTotal || budget || packagePrice || 0,
        isInstantBooking: isInstantBooking || false
      }
    });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

// Get bookings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, parseInt(userId));
    
    const result = await request.execute('bookings.sp_GetUserBookings');
    
    res.json({ success: true, bookings: result.recordset || [] });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Failed to get user bookings', error: err.message });
  }
});

// Get bookings for a vendor
router.get('/vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('VendorProfileID', sql.Int, parseInt(vendorId));
    
    const result = await request.execute('bookings.sp_GetVendorBookings');
    
    // Convert date objects to ISO strings for proper JSON serialization
    const bookings = (result.recordset || []).map(booking => {
      // Format time fields as HH:MM strings
      let eventTimeStr = null;
      let eventEndTimeStr = null;
      
      if (booking.EventTime) {
        if (booking.EventTime instanceof Date) {
          // SQL Server time comes as Date object - extract hours and minutes
          const hours = booking.EventTime.getUTCHours().toString().padStart(2, '0');
          const mins = booking.EventTime.getUTCMinutes().toString().padStart(2, '0');
          eventTimeStr = `${hours}:${mins}`;
        } else if (typeof booking.EventTime === 'string') {
          eventTimeStr = booking.EventTime.substring(0, 5);
        }
      }
      
      if (booking.EventEndTime) {
        if (booking.EventEndTime instanceof Date) {
          // SQL Server time comes as Date object - extract hours and minutes
          const hours = booking.EventEndTime.getUTCHours().toString().padStart(2, '0');
          const mins = booking.EventEndTime.getUTCMinutes().toString().padStart(2, '0');
          eventEndTimeStr = `${hours}:${mins}`;
        } else if (typeof booking.EventEndTime === 'string') {
          eventEndTimeStr = booking.EventEndTime.substring(0, 5);
        }
      }
      
      return {
        ...booking,
        EventDate: booking.EventDate ? new Date(booking.EventDate).toISOString() : null,
        EndDate: booking.EndDate ? new Date(booking.EndDate).toISOString() : null,
        BookingDate: booking.BookingDate ? new Date(booking.BookingDate).toISOString() : null,
        CreatedAt: booking.CreatedAt ? new Date(booking.CreatedAt).toISOString() : null,
        UpdatedAt: booking.UpdatedAt ? new Date(booking.UpdatedAt).toISOString() : null,
        CancellationDate: booking.CancellationDate ? new Date(booking.CancellationDate).toISOString() : null,
        EventTime: eventTimeStr,
        EventEndTime: eventEndTimeStr
      };
    });
    
    res.json({ success: true, bookings });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Failed to get vendor bookings', error: err.message });
  }
});

// Get service categories for booking modal (MUST be before /:id route)
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

// ============================================================
// VALIDATE BOOKING - For deep link validation from email buttons
// MUST be before /:id route to avoid route conflict
// ============================================================
router.get('/validate/:bookingId', async (req, res) => {
  try {
    const bookingId = resolveBookingId(req.params.bookingId);
    if (!bookingId) {
      return res.status(404).json({ 
        valid: false, 
        errorTitle: 'Invalid Link',
        errorMessage: 'This booking link is not valid.' 
      });
    }

    const userId = req.user?.id;
    
    const pool = await poolPromise;
    const result = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .query(`
        SELECT 
          b.BookingID,
          b.UserID,
          b.VendorProfileID,
          b.Status,
          b.EventDate,
          b.CreatedAt,
          b.CancelledAt,
          vp.UserID AS VendorUserID
        FROM bookings.Bookings b
        LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
        WHERE b.BookingID = @BookingID
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        valid: false,
        errorTitle: 'Booking Not Found',
        errorMessage: 'This booking could not be found. It may have been deleted.'
      });
    }

    const booking = result.recordset[0];
    
    // Check if user has access (is client or vendor)
    if (userId) {
      const isClient = booking.UserID === userId;
      const isVendor = booking.VendorUserID === userId;
      
      if (!isClient && !isVendor) {
        return res.status(403).json({ 
          valid: false,
          errorTitle: 'Access Denied',
          errorMessage: 'You do not have permission to view this booking.'
        });
      }
    }

    // Check if booking is cancelled
    if (booking.Status === 'cancelled' || booking.CancelledAt) {
      return res.json({ 
        valid: true,
        status: 'cancelled',
        bookingId: booking.BookingID,
        warning: 'This booking has been cancelled.'
      });
    }

    // Check if event has passed (expired)
    const eventDate = booking.EventDate ? new Date(booking.EventDate) : null;
    const now = new Date();
    const isExpired = eventDate && eventDate < now;

    return res.json({ 
      valid: true,
      status: booking.Status,
      bookingId: booking.BookingID,
      isExpired,
      eventDate: booking.EventDate
    });

  } catch (err) {
    console.error('Validate booking error:', err);
    res.status(500).json({ 
      valid: false, 
      errorTitle: 'Something Went Wrong',
      errorMessage: 'We couldn\'t validate this booking. Please try again.'
    });
  }
});

// Get booking details
router.get('/:id', async (req, res) => {
  try {
    const bookingId = resolveBookingId(req.params.id);
    if (!bookingId) return res.status(400).json({ message: 'Invalid booking ID' });
    const { userId } = req.query;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('BookingID', sql.Int, bookingId);
    request.input('UserID', sql.Int, userId || null);

    const result = await request.execute('bookings.sp_GetBookingDetails');
    
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
    const bookingId = resolveBookingId(req.params.id);
    if (!bookingId) return res.status(400).json({ message: 'Invalid booking ID' });
    const { paymentIntentId, amount, chargeId } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('BookingID', sql.Int, bookingId);
    request.input('PaymentIntentID', sql.NVarChar(100), paymentIntentId);
    request.input('Amount', sql.Decimal(10, 2), amount);
    request.input('ChargeID', sql.NVarChar(100), chargeId);

    await request.execute('bookings.sp_ConfirmBookingPayment');
    
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
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    // Resolve vendor profile ID from request or booking
    let resolvedVendorProfileId = vendorProfileId || null;
    if (!resolvedVendorProfileId && bookingId) {
      try {
        const pool = await poolPromise;
        const result = await pool.request()
          .input('BookingID', sql.Int, bookingId)
          .execute('bookings.sp_GetVendorFromBooking');
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
        .execute('bookings.sp_GetVendorStripeAccount');
      const vendorStripeAccountId = accRes.recordset.length > 0 ? accRes.recordset[0].StripeAccountID : null;

      if (!vendorStripeAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Vendor is not connected to Stripe'
        });
      }

      // Ensure invoice exists and compute totals (subtotal + platform + tax)
      try { if (invoicesRouter && typeof invoicesRouter.upsertInvoiceForBooking === 'function') { await invoicesRouter.upsertInvoiceForBooking(pool, bookingId, { forceRegenerate: true }); } } catch (_) {}
      const invRes = await pool.request().input('BookingID', sql.Int, bookingId)
        .execute('bookings.sp_GetInvoiceTotals');
      const invRow = invRes.recordset[0] || {};
      const amountCents = Math.round(Number(invRow.TotalAmount != null ? invRow.TotalAmount : amount) * 100);
      const platformFee = Math.round(Number(invRow.PlatformFee || 0) * 100);

      paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: currency,
        description: description || (bookingId ? `Booking Payment #${bookingId}` : undefined),
        application_fee_amount: platformFee,
        transfer_data: {
          destination: vendorStripeAccountId,
        },
        metadata: {
          booking_id: bookingId || null,
          vendor_profile_id: resolvedVendorProfileId,
          invoice_id: invRow.InvoiceID || '',
          subtotal_cents: String(Math.round(Number(invRow.Subtotal || 0) * 100)),
          platform_fee_cents: String(platformFee),
          tax_cents: String(Math.round(Number(invRow.TaxAmount || 0) * 100)),
          total_cents: String(amountCents)
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

    // Require essential event details
    if (!eventDetails.name || eventDetails.name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Event name is required'
      });
    }

    if (!eventDetails.type || eventDetails.type.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Event type is required'
      });
    }

    if (!eventDetails.location || eventDetails.location.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Event location is required'
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
        request.input('EventEndTime', sql.VarChar(8), formattedEndTime || '');
        request.input('EventLocation', sql.NVarChar(500), eventDetails.location || '');
        request.input('AttendeeCount', sql.Int, eventDetails.attendeeCount || 50);
        request.input('Budget', sql.Decimal(10, 2), budget);
        request.input('SpecialRequests', sql.NVarChar(sql.MAX), eventDetails.specialRequests || '');
        request.input('EventName', sql.NVarChar(255), eventDetails.name || 'Booking');
        request.input('EventType', sql.NVarChar(100), eventDetails.type || '');
        request.input('TimeZone', sql.NVarChar(100), eventDetails.timezone || 'America/Toronto');
        request.input('Status', sql.NVarChar(50), 'pending');
        
        // Set expiry to 24 hours from now
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        request.input('ExpiresAt', sql.DateTime, expiresAt);

        const result = await request.execute('bookings.sp_InsertRequest');

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
    
    const result = await request.execute('bookings.sp_GetVendorsByCategory');

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
    
    const result = await request.execute('bookings.sp_GetUserRequests');

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

    const result = await request.execute('bookings.sp_RespondToRequest');

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
    const direction = (req.query.direction || 'inbound').toString().toLowerCase();

    const pool = await poolPromise;

    // Resolve vendor's UserID (for outbound queries)
    let vendorUserId = null;
    if (direction === 'outbound') {
      const vu = await pool.request()
        .input('VendorProfileID', sql.Int, parseInt(vendorId))
        .execute('bookings.sp_GetVendorUserId');
      vendorUserId = vu.recordset[0]?.UserID || null;
      if (!vendorUserId) {
        return res.json({ success: true, requests: [] });
      }
    }

    const result = await pool.request()
      .input('VendorProfileID', sql.Int, parseInt(vendorId))
      .input('VendorUserID', sql.Int, vendorUserId)
      .input('Status', sql.NVarChar(50), rawStatus)
      .input('Direction', sql.NVarChar(20), direction)
      .execute('bookings.sp_GetVendorRequests');

    res.json({
      success: true,
      requests: result.recordset || []
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
      timeZone,
      packageId,
      packageName,
      packagePrice,
      // Frontend-calculated values - use these directly, NO backend calculation
      subtotal: frontendSubtotal,
      platformFee: frontendPlatformFee,
      taxAmount: frontendTaxAmount,
      taxPercent: frontendTaxPercent,
      taxLabel: frontendTaxLabel,
      processingFee: frontendProcessingFee,
      grandTotal: frontendGrandTotal
    } = req.body;

    // Validation - require all essential booking data
    if (!userId || !vendorProfileId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID and Vendor Profile ID are required' 
      });
    }

    if (!eventDate) {
      return res.status(400).json({ 
        success: false,
        message: 'Event date is required' 
      });
    }

    if (!eventTime) {
      return res.status(400).json({ 
        success: false,
        message: 'Event time is required' 
      });
    }

    if (!eventName || eventName.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Event name is required' 
      });
    }

    if (!eventType || eventType.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Event type is required' 
      });
    }

    if (!eventLocation || eventLocation.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Event location is required' 
      });
    }

    const pool = await poolPromise;
    const request = pool.request();
    
    // Set expiry to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Build services JSON - include both services and package if selected
    // IMPORTANT: Preserve calculatedPrice to avoid double-counting hourly rates
    let allItems = [];
    if (services && Array.isArray(services) && services.length > 0) {
      allItems = services.map(s => ({
        type: 'service',
        id: s.VendorServiceID || s.ServiceID || s.id,
        name: s.ServiceName || s.name,
        price: s.VendorPrice || s.Price || s.price || 0,
        calculatedPrice: s.calculatedPrice || null,
        hours: s.hours || null,
        pricingModel: s.PricingModel || s.pricingModel || null
      }));
    }
    if (packageId && packageName) {
      allItems.push({
        type: 'package',
        id: packageId,
        name: packageName,
        price: packagePrice,
        calculatedPrice: packagePrice // packagePrice from frontend is already the calculated total
      });
    }
    const servicesJson = allItems.length > 0 ? JSON.stringify(allItems) : null;

    // USE FRONTEND-CALCULATED VALUES DIRECTLY - NO BACKEND CALCULATION
    // Frontend has already calculated everything correctly, just use those values
    const subtotal = parseFloat(frontendSubtotal) || parseFloat(budget) || 0;
    const platformFee = parseFloat(frontendPlatformFee) || 0;
    const taxAmount = parseFloat(frontendTaxAmount) || 0;
    const taxPercent = parseFloat(frontendTaxPercent) || 13; // Default to Ontario HST
    const taxLabel = frontendTaxLabel || 'HST 13%';
    const processingFee = parseFloat(frontendProcessingFee) || 0;
    const grandTotal = parseFloat(frontendGrandTotal) || (subtotal + platformFee + taxAmount + processingFee);

    console.log(`[BookingRequest] Using frontend values: subtotal=$${subtotal}, platformFee=$${platformFee}, tax=$${taxAmount} (${taxLabel}), processing=$${processingFee}, total=$${grandTotal}`);

    request.input('UserID', sql.Int, userId);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('EventDate', sql.VarChar(10), eventDate || '');
    request.input('EventTime', sql.VarChar(8), eventTime || '09:00:00');
    request.input('EventEndTime', sql.VarChar(8), eventEndTime || '');
    request.input('EventLocation', sql.NVarChar(500), eventLocation || '');
    request.input('AttendeeCount', sql.Int, attendeeCount || 1);
    request.input('Budget', sql.Decimal(10, 2), subtotal);
    request.input('Services', sql.NVarChar(sql.MAX), servicesJson || '[]');
    request.input('EventName', sql.NVarChar(255), eventName || 'Booking');
    request.input('EventType', sql.NVarChar(100), eventType || '');
    request.input('TimeZone', sql.NVarChar(100), timeZone || 'America/Toronto');
    request.input('Status', sql.NVarChar(50), 'pending');
    request.input('ExpiresAt', sql.DateTime, expiresAt);
    request.input('SpecialRequests', sql.NVarChar(sql.MAX), specialRequestText || '');
    request.input('Subtotal', sql.Decimal(10, 2), subtotal);
    request.input('PlatformFee', sql.Decimal(10, 2), platformFee);
    request.input('TaxAmount', sql.Decimal(10, 2), taxAmount);
    request.input('TaxPercent', sql.Decimal(5, 3), taxPercent);
    request.input('TaxLabel', sql.NVarChar(50), taxLabel);
    request.input('ProcessingFee', sql.Decimal(10, 2), processingFee);
    request.input('GrandTotal', sql.Decimal(10, 2), grandTotal);

    const result = await request.execute('bookings.sp_InsertRequest');

    if (result.recordset.length === 0) {
      throw new Error('Failed to create request');
    }

    const newRequest = result.recordset[0];

    // Check for existing conversation or create a new one
    let conversationId;
    const convLookupRequest = pool.request();
    convLookupRequest.input('UserID', sql.Int, userId);
    convLookupRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    const convLookup = await convLookupRequest.execute('messages.sp_CheckExistingConversation');

    if (convLookup.recordset.length > 0) {
      // Use existing conversation
      conversationId = convLookup.recordset[0].ConversationID;
    } else {
      // Create a new conversation
      const conversationRequest = pool.request();
      conversationRequest.input('UserID', sql.Int, userId);
      conversationRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      conversationRequest.input('Subject', sql.NVarChar(255), 'New Booking Request');

      const conversationResult = await conversationRequest.execute('bookings.sp_InsertConversation');
      conversationId = conversationResult.recordset[0].ConversationID;
    }

    // Send initial message if special request text exists
    if (specialRequestText) {
      const messageRequest = pool.request();
      messageRequest.input('ConversationID', sql.Int, conversationId);
      messageRequest.input('SenderID', sql.Int, userId);
      messageRequest.input('Content', sql.NVarChar(sql.MAX), specialRequestText);

      await messageRequest.execute('bookings.sp_InsertMessage');
    }

    // Create notification for vendor
    const vendorUserResult = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .execute('bookings.sp_GetVendorUserId');

    if (vendorUserResult.recordset.length > 0) {
      const vendorUserId = vendorUserResult.recordset[0].UserID;
      
      const notificationRequest = pool.request();
      notificationRequest.input('UserID', sql.Int, vendorUserId);
      notificationRequest.input('Type', sql.NVarChar(50), 'new_request');
      notificationRequest.input('Title', sql.NVarChar(255), 'New Booking Request');
      notificationRequest.input('Message', sql.NVarChar(sql.MAX), 'You have received a new booking request. You have 24 hours to respond.');
      notificationRequest.input('RelatedID', sql.Int, newRequest.RequestID);
      notificationRequest.input('RelatedType', sql.NVarChar(50), 'request');

      await notificationRequest.execute('bookings.sp_InsertNotification');

      // Send email notification to vendor (using centralized notification service)
      const serviceName = allItems.length > 0 ? allItems.map(s => s.name).join(', ') : 'Service';
      notifyVendorOfNewRequest(newRequest.RequestID, userId, vendorProfileId, {
        eventDate,
        location: eventLocation,
        budget: subtotal,
        serviceName,
        startTime: eventTime,
        endTime: eventEndTime,
        timezone: timeZone
      });
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
      .execute('bookings.sp_ApproveRequest');

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

    await notificationRequest.execute('bookings.sp_InsertNotification');

    // Ensure conversation exists and send auto-approval message
    // 1) Find/Create conversation for this user/vendor pair
    let conversationId = null;
    const convLookup = await pool.request()
      .input('UserID', sql.Int, userId)
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .execute('bookings.sp_GetConversation');

    if (convLookup.recordset.length > 0) {
      conversationId = convLookup.recordset[0].ConversationID;
    } else {
      const convCreate = await pool.request()
        .input('UserID', sql.Int, userId)
        .input('VendorProfileID', sql.Int, vendorProfileId)
        .input('Subject', sql.NVarChar(255), 'Request Approved')
        .execute('bookings.sp_InsertConversation');
      conversationId = convCreate.recordset[0].ConversationID;
    }

    // 2) Find vendor's UserID (sender)
    let vendorUserId = null;
    const vendorUserRes = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .execute('bookings.sp_GetVendorUserId');
    if (vendorUserRes.recordset.length > 0) {
      vendorUserId = vendorUserRes.recordset[0].UserID;
    }

    // 3) Insert the auto-approval message
    if (conversationId && vendorUserId) {
      await pool.request()
        .input('ConversationID', sql.Int, conversationId)
        .input('SenderID', sql.Int, vendorUserId)
        .input('Content', sql.NVarChar(sql.MAX), 'Hello! Your booking request has been approved. Feel free to ask any questions about your upcoming event.')
        .execute('bookings.sp_InsertMessage');
    }

    // Send email notification to client (using centralized notification service)
    notifyClientOfApproval(requestId);

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
      .execute('bookings.sp_DeclineRequest');

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

    await notificationRequest.execute('bookings.sp_InsertNotification');

    // Send email notification to client (using centralized notification service)
    notifyClientOfRejection(requestId);

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
      .execute('bookings.sp_CancelRequest');

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
      .execute('bookings.sp_GetRequestDetails');

    if (requestDetails.recordset.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking request not found' 
      });
    }

    const requestData = requestDetails.recordset[0];
    
    // Parse services from request to get actual service info
    let services = [];
    let primaryServiceId = null;
    let subtotal = 0;
    
    // Calculate hours from event times
    let totalHours = 0;
    if (requestData.EventTime && requestData.EventEndTime) {
      const startParts = requestData.EventTime.toString().split(':');
      const endParts = requestData.EventEndTime.toString().split(':');
      const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1] || 0);
      const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1] || 0);
      totalHours = (endMinutes - startMinutes) / 60;
      if (totalHours < 0) totalHours += 24; // Handle overnight events
    }
    
    try {
      if (requestData.Services) {
        services = typeof requestData.Services === 'string' 
          ? JSON.parse(requestData.Services) 
          : requestData.Services;
        
        if (Array.isArray(services) && services.length > 0) {
          // Get the first service as primary
          const primaryService = services[0];
          primaryServiceId = primaryService.serviceId || primaryService.ServiceID || primaryService.id || null;
          
          // Calculate subtotal with hourly pricing support
          for (const svc of services) {
            const basePrice = parseFloat(svc.price || svc.Price || svc.BasePrice || svc.baseRate || 0);
            let pricingType = svc.pricingType || svc.PricingType || svc.pricingModel || svc.priceType || '';
            
            // Look up package pricing type if not in JSON
            if (!pricingType && svc.type === 'package' && svc.id) {
              try {
                const pkgRequest = pool.request();
                pkgRequest.input('PackageID', sql.Int, svc.id);
                const pkgRes = await pkgRequest.query('SELECT PriceType FROM vendors.Packages WHERE PackageID = @PackageID');
                if (pkgRes.recordset.length > 0) {
                  pricingType = pkgRes.recordset[0].PriceType || '';
                }
              } catch (pkgErr) {
                console.warn('[Booking] Could not fetch package pricing type:', pkgErr.message);
              }
            }
            
            const isHourly = pricingType === 'hourly' || pricingType === 'time_based';
            if (isHourly && totalHours > 0) {
              subtotal += basePrice * totalHours;
            } else {
              subtotal += basePrice;
            }
          }
        }
      }
    } catch (parseErr) {
      console.warn('Could not parse services JSON:', parseErr.message);
    }
    
    // Fall back to Budget if no subtotal calculated
    if (subtotal === 0) {
      subtotal = parseFloat(requestData.Budget) || 0;
    }
    
    // Calculate fee breakdown
    const platformFeePercent = 0.05; // 5% platform fee
    const stripeFeePercent = 0.029; // 2.9% Stripe fee
    const stripeFeeFixed = 0.30; // $0.30 Stripe fixed fee
    
    // Get tax info from event location
    const eventLocation = requestData.EventLocation || '';
    const province = getProvinceFromLocation(eventLocation);
    const taxInfo = getTaxInfoForProvince(province);
    const taxPercent = taxInfo.rate;
    
    // Calculate fees
    const platformFee = Math.round(subtotal * platformFeePercent * 100) / 100;
    const taxableAmount = subtotal + platformFee;
    const taxAmount = Math.round(taxableAmount * (taxPercent / 100) * 100) / 100;
    const processingFee = Math.round((subtotal * stripeFeePercent + stripeFeeFixed) * 100) / 100;
    const grandTotal = Math.round((subtotal + platformFee + taxAmount + processingFee) * 100) / 100;
    
    console.log(`[Booking] Fee breakdown: subtotal=$${subtotal}, platformFee=$${platformFee}, tax=$${taxAmount} (${taxInfo.label}), processing=$${processingFee}, total=$${grandTotal}`);
    
    // Create booking in Bookings table
    const request = pool.request();
    request.input('UserID', sql.Int, userId);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('ServiceID', sql.Int, primaryServiceId || 1);
    request.input('EventDate', sql.DateTime, requestData.EventDate || new Date());
    request.input('Status', sql.NVarChar(20), 'confirmed');
    request.input('AttendeeCount', sql.Int, requestData.AttendeeCount || 1);
    request.input('SpecialRequests', sql.NVarChar(sql.MAX), requestData.SpecialRequests);
    request.input('TotalAmount', sql.Decimal(10, 2), subtotal); // Base subtotal for backward compatibility
    request.input('Subtotal', sql.Decimal(10, 2), subtotal);
    request.input('PlatformFee', sql.Decimal(10, 2), platformFee);
    request.input('TaxAmount', sql.Decimal(10, 2), taxAmount);
    request.input('TaxPercent', sql.Decimal(5, 3), taxPercent);
    request.input('TaxLabel', sql.NVarChar(50), taxInfo.label);
    request.input('ProcessingFee', sql.Decimal(10, 2), processingFee);
    request.input('GrandTotal', sql.Decimal(10, 2), grandTotal);

    const result = await request.execute('bookings.sp_InsertConfirmedBooking');

    const bookingId = result.recordset && result.recordset[0] ? result.recordset[0].BookingID : null;
    
    // Create BookingServices records for each service
    if (bookingId && services.length > 0) {
      for (const svc of services) {
        const svcId = svc.serviceId || svc.ServiceID || svc.id || null;
        const price = parseFloat(svc.price || svc.Price || svc.BasePrice || 0);
        const qty = parseInt(svc.quantity || svc.Quantity || 1, 10);
        const notes = svc.notes || svc.Notes || null;
        
        if (svcId || price > 0) {
          try {
            await pool.request()
              .input('BookingID', sql.Int, bookingId)
              .input('ServiceID', sql.Int, svcId)
              .input('Quantity', sql.Int, qty)
              .input('PriceAtBooking', sql.Decimal(10, 2), price)
              .input('Notes', sql.NVarChar(sql.MAX), notes)
              .execute('bookings.sp_InsertBookingService');
          } catch (bsErr) {
            console.warn('Could not insert booking service:', bsErr.message);
          }
        }
      }
    }

    // Ensure a conversation exists for this request/user/vendor
    let conversationId = null;
    const convLookup2 = await pool.request()
      .input('UserID', sql.Int, userId)
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .execute('bookings.sp_GetConversation');

    if (convLookup2.recordset.length > 0) {
      conversationId = convLookup2.recordset[0].ConversationID;
    } else {
      const convCreate2 = await pool.request()
        .input('UserID', sql.Int, userId)
        .input('VendorProfileID', sql.Int, vendorProfileId)
        .input('Subject', sql.NVarChar(255), 'Booking Confirmed')
        .execute('bookings.sp_InsertConversation');
      conversationId = convCreate2.recordset[0].ConversationID;
    }

    // (Removed) Do not auto-insert a system message on booking confirmation

    // Find vendor's actual UserID from VendorProfiles
    let vendorUserId = null;
    const vendorUserRes = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .execute('bookings.sp_GetVendorUserId');
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
        .execute('bookings.sp_InsertNotification');

      // Notify vendor
      if (vendorUserId) {
        await pool.request()
          .input('UserID', sql.Int, vendorUserId)
          .input('Type', sql.NVarChar(50), 'booking_confirmed')
          .input('Title', sql.NVarChar(255), 'New Confirmed Booking')
          .input('Message', sql.NVarChar(sql.MAX), 'A user has confirmed a booking with you.')
          .input('RelatedID', sql.Int, bookingId)
          .input('RelatedType', sql.NVarChar(50), 'booking')
          .execute('bookings.sp_InsertNotification');
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
      .execute('bookings.sp_GetBookingInfo');

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
      .execute('bookings.sp_GetBookingServices');

    // Load expenses (vendor-added)
    const expensesRes = await pool.request()
      .input('BookingID', sql.Int, parseInt(id))
      .execute('bookings.sp_GetBookingExpenses');

    // Load transactions (payments)
    const txRes = await pool.request()
      .input('BookingID', sql.Int, parseInt(id))
      .execute('bookings.sp_GetTransactions');

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
      .execute('bookings.sp_GetBookingClientVendor');
    if (bres.recordset.length === 0) return res.status(404).json({ success: false, message: 'Booking not found' });
    const clientId = bres.recordset[0].ClientUserID;
    const vpid = bres.recordset[0].VendorProfileID;
    const vuserRes = await pool.request().input('VendorProfileID', sql.Int, vpid).execute('bookings.sp_GetVendorUserId');
    const vendorUserId = vuserRes.recordset[0]?.UserID || 0;
    if (requesterUserId !== clientId && requesterUserId !== vendorUserId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const exRes = await pool.request().input('BookingID', sql.Int, parseInt(id)).execute('bookings.sp_GetBookingExpenses');
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
      .execute('bookings.sp_GetVendorFromBooking');
    if (bres.recordset.length === 0) return res.status(404).json({ success: false, message: 'Booking not found' });
    const vendorProfileId = bres.recordset[0].VendorProfileID;
    const vuserRes = await pool.request().input('VendorProfileID', sql.Int, vendorProfileId).execute('bookings.sp_GetVendorUserId');
    const vendorUserId = vuserRes.recordset[0]?.UserID || 0;
    if (userId !== vendorUserId) return res.status(403).json({ success: false, message: 'Only vendor can add expenses' });

    const insertRes = await pool.request()
      .input('BookingID', sql.Int, parseInt(id))
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .input('Title', sql.NVarChar(255), title.trim())
      .input('Amount', sql.Decimal(10, 2), amt)
      .input('Notes', sql.NVarChar(sql.MAX), notes || null)
      .execute('bookings.sp_InsertExpense');

    res.json({ success: true, expense: insertRes.recordset[0] });
  } catch (err) {
    console.error('Add expense error:', err);
    res.status(500).json({ success: false, message: 'Failed to add expense', error: err.message });
  }
});

// ==================== BOOKING CANCELLATION ====================

// POST /bookings/:id/cancel - Cancel booking (for client or vendor)
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, reason, cancelledBy } = req.body; // cancelledBy: 'client' or 'vendor'
    
    const bookingId = resolveBookingId(id);
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    if (!cancelledBy || !['client', 'vendor'].includes(cancelledBy)) {
      return res.status(400).json({ success: false, message: 'cancelledBy must be "client" or "vendor"' });
    }

    const pool = await poolPromise;

    // Verify the user has permission to cancel
    const bookingRes = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('bookings.sp_GetBookingForCancellation');

    if (bookingRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookingRes.recordset[0];

    // Check if already cancelled
    if (['cancelled', 'cancelled_by_client', 'cancelled_by_vendor', 'cancelled_by_admin', 'refunded'].includes(booking.Status?.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    // Verify user permission
    if (cancelledBy === 'client' && booking.UserID !== userId) {
      return res.status(403).json({ success: false, message: 'Only the booking client can cancel as client' });
    }

    if (cancelledBy === 'vendor') {
      // Get vendor's user ID
      const vendorUserRes = await pool.request()
        .input('VendorProfileID', sql.Int, booking.VendorProfileID)
        .execute('bookings.sp_GetVendorUserId');
      
      if (vendorUserRes.recordset.length === 0 || vendorUserRes.recordset[0].UserID !== userId) {
        return res.status(403).json({ success: false, message: 'Only the vendor can cancel as vendor' });
      }
    }

    // Check cancellation policy permissions
    if (cancelledBy === 'client' && booking.AllowClientCancellation === false) {
      return res.status(403).json({ success: false, message: 'Client cancellation is not allowed for this vendor' });
    }
    if (cancelledBy === 'vendor' && booking.AllowVendorCancellation === false) {
      return res.status(403).json({ success: false, message: 'Vendor cancellation is not allowed' });
    }

    // Calculate refund based on policy
    const hoursUntilEvent = booking.HoursUntilEvent || 0;
    let refundPercent = 0;

    if (booking.PolicyID) {
      if (hoursUntilEvent >= (booking.FullRefundHours || 168)) {
        refundPercent = booking.FullRefundPercent || 100;
      } else if (hoursUntilEvent >= (booking.PartialRefundHours || 48)) {
        refundPercent = booking.PartialRefundPercent || 50;
      }
    } else {
      // Default policy
      if (hoursUntilEvent >= 168) refundPercent = 100;
      else if (hoursUntilEvent >= 48) refundPercent = 50;
    }

    // Process Stripe refund if payment was made
    let refundAmount = 0;
    let applicationFeeRetained = 0;
    let stripeRefundId = null;
    let stripeRefundStatus = 'none';

    if (booking.StripePaymentIntentID && booking.FullAmountPaid && refundPercent > 0) {
      try {
        const pi = await stripe.paymentIntents.retrieve(booking.StripePaymentIntentID);
        const chargeId = pi.latest_charge;
        
        if (chargeId) {
          const charge = await stripe.charges.retrieve(chargeId);
          const originalAmount = charge.amount;
          const applicationFee = pi.application_fee_amount || 0;
          
          const refundableAmount = originalAmount - applicationFee;
          const refundAmountCents = Math.round(refundableAmount * (refundPercent / 100));
          
          applicationFeeRetained = applicationFee / 100;
          refundAmount = refundAmountCents / 100;

          if (refundAmountCents > 0) {
            const refund = await stripe.refunds.create({
              charge: chargeId,
              amount: refundAmountCents,
              reason: 'requested_by_customer',
              metadata: {
                booking_id: String(bookingId),
                cancelled_by: cancelledBy,
                refund_percent: String(refundPercent)
              }
            });

            stripeRefundId = refund.id;
            stripeRefundStatus = refund.status;
          }
        }
      } catch (stripeErr) {
        console.error('Stripe refund error:', stripeErr);
        stripeRefundStatus = 'failed';
      }
    }

    // Record cancellation in database
    const cancelResult = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .input('CancelledBy', sql.NVarChar(20), cancelledBy)
      .input('CancelledByUserID', sql.Int, userId)
      .input('CancellationReason', sql.NVarChar(sql.MAX), reason || null)
      .input('RefundAmount', sql.Decimal(10,2), refundAmount)
      .input('RefundPercent', sql.Decimal(5,2), refundPercent)
      .input('ApplicationFeeRetained', sql.Decimal(10,2), applicationFeeRetained)
      .input('PolicyID', sql.Int, booking.PolicyID || null)
      .input('HoursBeforeEvent', sql.Int, hoursUntilEvent)
      .execute('bookings.sp_CancelBookingWithRefund');

    const cancellationId = cancelResult.recordset[0]?.CancellationID;

    // Update with Stripe refund details
    if (stripeRefundId) {
      await pool.request()
        .input('CancellationID', sql.Int, cancellationId)
        .input('StripeRefundID', sql.NVarChar(100), stripeRefundId)
        .input('StripeRefundStatus', sql.NVarChar(50), stripeRefundStatus)
        .input('RefundStatus', sql.NVarChar(50), stripeRefundStatus === 'succeeded' ? 'completed' : 'processing')
        .execute('bookings.sp_UpdateCancellationRefund');
    }

    // Send email notification about the cancellation
    try {
      notifyOfBookingCancellation(bookingId, cancelledBy, reason, refundAmount);
    } catch (emailErr) {
      console.error('Failed to send cancellation notification:', emailErr.message);
      // Don't fail the cancellation if email fails
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      cancellationId,
      bookingId,
      cancelledBy,
      refund: {
        amount: refundAmount,
        percent: refundPercent,
        applicationFeeRetained,
        stripeRefundId,
        status: stripeRefundStatus
      }
    });

  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel booking', error: err.message });
  }
});

// GET /bookings/:id/cancel-preview - Get refund preview for client cancellation
router.get('/:id/cancel-preview', async (req, res) => {
  try {
    const { id } = req.params;
    const bookingId = resolveBookingId(id);
    
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('bookings.sp_GetBookingForCancellation');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = result.recordset[0];
    const hoursUntilEvent = booking.HoursUntilEvent || 0;
    const totalAmount = booking.TotalAmount || 0;

    // Calculate refund based on policy
    let refundPercent = 0;
    let policyType = 'default';

    if (booking.PolicyType) {
      policyType = booking.PolicyType;
      const fullRefundDays = booking.FullRefundDays || 7;
      const partialRefundDays = booking.PartialRefundDays || 3;
      const partialRefundPct = booking.PartialRefundPercent || 50;
      const noRefundDays = booking.NoRefundDays || 1;

      const daysUntilEvent = hoursUntilEvent / 24;

      if (daysUntilEvent >= fullRefundDays) {
        refundPercent = 100;
      } else if (daysUntilEvent >= partialRefundDays) {
        refundPercent = partialRefundPct;
      } else if (daysUntilEvent < noRefundDays) {
        refundPercent = 0;
      }
    } else {
      // Default policy: full refund 7+ days, 50% 3-7 days, no refund <1 day
      const daysUntilEvent = hoursUntilEvent / 24;
      if (daysUntilEvent >= 7) refundPercent = 100;
      else if (daysUntilEvent >= 3) refundPercent = 50;
      else refundPercent = 0;
    }

    const refundAmount = (totalAmount * refundPercent) / 100;

    res.json({
      success: true,
      bookingId,
      totalAmount,
      refundPercent,
      refundAmount,
      policyType,
      hoursUntilEvent,
      daysUntilEvent: Math.floor(hoursUntilEvent / 24),
      isPaid: booking.FullAmountPaid || false
    });

  } catch (err) {
    console.error('Cancel preview error:', err);
    res.status(500).json({ success: false, message: 'Failed to get cancellation preview', error: err.message });
  }
});

// POST /bookings/:id/client-cancel - Client cancels their own booking
router.post('/:id/client-cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id || req.body.userId;
    
    const bookingId = resolveBookingId(id);
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const pool = await poolPromise;

    // Get booking details
    const bookingRes = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('bookings.sp_GetBookingForCancellation');

    if (bookingRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookingRes.recordset[0];

    // CHECK: Event must not have already passed
    const hoursUntilEvent = booking.HoursUntilEvent || 0;
    if (hoursUntilEvent < 0) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a booking after the event date has passed' });
    }

    // Verify user owns this booking
    if (userId && booking.UserID !== userId) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own bookings' });
    }

    // Check if already cancelled or completed
    if (['cancelled', 'cancelled_by_client', 'cancelled_by_vendor', 'cancelled_by_admin', 'refunded', 'completed'].includes(booking.Status?.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'This booking cannot be cancelled' });
    }

    // Calculate refund based on cancellation policy
    const totalAmount = booking.TotalAmount || 0;
    let refundPercent = 0;

    if (booking.PolicyType) {
      const fullRefundDays = booking.FullRefundDays || 7;
      const partialRefundDays = booking.PartialRefundDays || 3;
      const partialRefundPct = booking.PartialRefundPercent || 50;
      const noRefundDays = booking.NoRefundDays || 1;
      const daysUntilEvent = hoursUntilEvent / 24;

      if (daysUntilEvent >= fullRefundDays) refundPercent = 100;
      else if (daysUntilEvent >= partialRefundDays) refundPercent = partialRefundPct;
      else if (daysUntilEvent < noRefundDays) refundPercent = 0;
    } else {
      const daysUntilEvent = hoursUntilEvent / 24;
      if (daysUntilEvent >= 7) refundPercent = 100;
      else if (daysUntilEvent >= 3) refundPercent = 50;
    }

    // Process Stripe refund if payment was made
    let refundAmount = 0;
    let applicationFeeRetained = 0;
    let stripeRefundId = null;
    let stripeRefundStatus = 'none';

    if (booking.StripePaymentIntentID && booking.FullAmountPaid && refundPercent > 0) {
      try {
        const pi = await stripe.paymentIntents.retrieve(booking.StripePaymentIntentID);
        const chargeId = pi.latest_charge;
        
        if (chargeId) {
          const charge = await stripe.charges.retrieve(chargeId);
          const originalAmount = charge.amount;
          const applicationFee = pi.application_fee_amount || 0;
          
          const refundableAmount = originalAmount - applicationFee;
          const refundAmountCents = Math.round(refundableAmount * (refundPercent / 100));
          
          applicationFeeRetained = applicationFee / 100;
          refundAmount = refundAmountCents / 100;

          if (refundAmountCents > 0) {
            const refund = await stripe.refunds.create({
              charge: chargeId,
              amount: refundAmountCents,
              reason: 'requested_by_customer',
              metadata: {
                booking_id: String(bookingId),
                cancelled_by: 'client',
                refund_percent: String(refundPercent)
              }
            });

            stripeRefundId = refund.id;
            stripeRefundStatus = refund.status;
          }
        }
      } catch (stripeErr) {
        console.error('Stripe refund error:', stripeErr);
        stripeRefundStatus = 'failed';
      }
    } else {
      refundAmount = (totalAmount * refundPercent) / 100;
    }

    // Record cancellation in database
    const cancelResult = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .input('CancelledBy', sql.NVarChar(20), 'client')
      .input('CancelledByUserID', sql.Int, userId || booking.UserID)
      .input('CancellationReason', sql.NVarChar(sql.MAX), reason || null)
      .input('RefundAmount', sql.Decimal(10,2), refundAmount)
      .input('RefundPercent', sql.Decimal(5,2), refundPercent)
      .input('ApplicationFeeRetained', sql.Decimal(10,2), applicationFeeRetained)
      .input('PolicyID', sql.Int, booking.PolicyID || null)
      .input('HoursBeforeEvent', sql.Int, hoursUntilEvent)
      .execute('bookings.sp_CancelBookingWithRefund');

    const cancellationId = cancelResult.recordset[0]?.CancellationID;

    // Update with Stripe refund details
    if (stripeRefundId) {
      await pool.request()
        .input('CancellationID', sql.Int, cancellationId)
        .input('StripeRefundID', sql.NVarChar(100), stripeRefundId)
        .input('StripeRefundStatus', sql.NVarChar(50), stripeRefundStatus)
        .input('RefundStatus', sql.NVarChar(50), stripeRefundStatus === 'succeeded' ? 'completed' : 'processing')
        .execute('bookings.sp_UpdateCancellationRefund');
    }

    // Update invoice status if exists
    try {
      const invoiceRequest = pool.request();
      invoiceRequest.input('BookingID', sql.Int, bookingId);
      invoiceRequest.input('Status', sql.NVarChar(50), 'cancelled');
      await invoiceRequest.execute('bookings.sp_UpdateInvoiceStatus');
    } catch (invoiceErr) {
      console.error('Invoice update error:', invoiceErr);
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      cancellationId,
      bookingId,
      refund: {
        amount: refundAmount,
        percent: refundPercent,
        applicationFeeRetained,
        stripeRefundId,
        status: stripeRefundStatus
      }
    });

  } catch (err) {
    console.error('Client cancel booking error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel booking', error: err.message });
  }
});

// POST /bookings/:id/vendor-cancel - Vendor cancels a booking (FULL refund to client)
router.post('/:id/vendor-cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, vendorProfileId } = req.body;
    
    const bookingId = resolveBookingId(id);
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const pool = await poolPromise;

    // Get booking details
    const bookingRes = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('bookings.sp_GetBookingForCancellation');

    if (bookingRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookingRes.recordset[0];

    // CHECK: Event must not have already passed
    const hoursUntilEvent = booking.HoursUntilEvent || 0;
    if (hoursUntilEvent < 0) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a booking after the event date has passed' });
    }

    // Verify vendor owns this booking
    if (vendorProfileId && booking.VendorProfileID !== parseInt(vendorProfileId)) {
      return res.status(403).json({ success: false, message: 'You can only cancel bookings for your own services' });
    }

    // Check if already cancelled or completed
    if (['cancelled', 'cancelled_by_client', 'cancelled_by_vendor', 'cancelled_by_admin', 'refunded', 'completed'].includes(booking.Status?.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'This booking cannot be cancelled' });
    }

    // VENDOR CANCELLATION = FULL REFUND (100%)
    const refundPercent = 100;
    const totalAmount = booking.TotalAmount || 0;

    // Process Stripe refund if payment was made
    let refundAmount = 0;
    let applicationFeeRetained = 0;
    let stripeRefundId = null;
    let stripeRefundStatus = 'none';

    if (booking.StripePaymentIntentID && booking.FullAmountPaid) {
      try {
        const pi = await stripe.paymentIntents.retrieve(booking.StripePaymentIntentID);
        const chargeId = pi.latest_charge;
        
        if (chargeId) {
          const charge = await stripe.charges.retrieve(chargeId);
          const originalAmount = charge.amount;
          const applicationFee = pi.application_fee_amount || 0;
          
          // Full refund of customer payment (excluding platform fee which is retained)
          const refundableAmount = originalAmount - applicationFee;
          const refundAmountCents = refundableAmount; // 100% refund
          
          applicationFeeRetained = applicationFee / 100;
          refundAmount = refundAmountCents / 100;

          if (refundAmountCents > 0) {
            const refund = await stripe.refunds.create({
              charge: chargeId,
              amount: refundAmountCents,
              reason: 'requested_by_customer',
              metadata: {
                booking_id: String(bookingId),
                cancelled_by: 'vendor',
                refund_percent: '100'
              }
            });

            stripeRefundId = refund.id;
            stripeRefundStatus = refund.status;
          }
        }
      } catch (stripeErr) {
        console.error('Stripe refund error:', stripeErr);
        stripeRefundStatus = 'failed';
      }
    } else {
      refundAmount = totalAmount; // Full refund amount
    }

    // Record cancellation in database
    const cancelResult = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .input('CancelledBy', sql.NVarChar(20), 'vendor')
      .input('CancelledByUserID', sql.Int, null)
      .input('CancellationReason', sql.NVarChar(sql.MAX), reason || 'Cancelled by vendor')
      .input('RefundAmount', sql.Decimal(10,2), refundAmount)
      .input('RefundPercent', sql.Decimal(5,2), refundPercent)
      .input('ApplicationFeeRetained', sql.Decimal(10,2), applicationFeeRetained)
      .input('PolicyID', sql.Int, booking.PolicyID || null)
      .input('HoursBeforeEvent', sql.Int, hoursUntilEvent)
      .execute('bookings.sp_CancelBookingWithRefund');

    const cancellationId = cancelResult.recordset[0]?.CancellationID;

    // Update with Stripe refund details
    if (stripeRefundId) {
      await pool.request()
        .input('CancellationID', sql.Int, cancellationId)
        .input('StripeRefundID', sql.NVarChar(100), stripeRefundId)
        .input('StripeRefundStatus', sql.NVarChar(50), stripeRefundStatus)
        .input('RefundStatus', sql.NVarChar(50), stripeRefundStatus === 'succeeded' ? 'completed' : 'processing')
        .execute('bookings.sp_UpdateCancellationRefund');
    }

    // Update invoice status
    try {
      const invoiceUpdateRequest = pool.request();
      invoiceUpdateRequest.input('BookingID', sql.Int, bookingId);
      invoiceUpdateRequest.input('Status', sql.NVarChar(50), 'cancelled');
      await invoiceUpdateRequest.execute('bookings.sp_UpdateInvoiceStatus');
    } catch (invoiceErr) {
      console.error('Invoice update error:', invoiceErr);
    }

    res.json({
      success: true,
      message: 'Booking cancelled by vendor. Full refund issued to client.',
      cancellationId,
      bookingId,
      refund: {
        amount: refundAmount,
        percent: refundPercent,
        applicationFeeRetained,
        stripeRefundId,
        status: stripeRefundStatus
      }
    });

  } catch (err) {
    console.error('Vendor cancel booking error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel booking', error: err.message });
  }
});

// GET /bookings/:id/cancellation-policy - Get cancellation policy preview for a booking
router.get('/:id/cancellation-policy', async (req, res) => {
  try {
    const { id } = req.params;
    const bookingId = resolveBookingId(id);
    
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('bookings.sp_GetBookingForCancellation');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = result.recordset[0];
    const hoursUntilEvent = booking.HoursUntilEvent || 0;

    // Calculate what refund would be
    let refundPercent = 0;
    let refundTier = 'no_refund';

    if (booking.PolicyID) {
      if (hoursUntilEvent >= (booking.FullRefundHours || 168)) {
        refundPercent = booking.FullRefundPercent || 100;
        refundTier = 'full';
      } else if (hoursUntilEvent >= (booking.PartialRefundHours || 48)) {
        refundPercent = booking.PartialRefundPercent || 50;
        refundTier = 'partial';
      }
    } else {
      if (hoursUntilEvent >= 168) { refundPercent = 100; refundTier = 'full'; }
      else if (hoursUntilEvent >= 48) { refundPercent = 50; refundTier = 'partial'; }
    }

    res.json({
      success: true,
      policy: {
        hoursUntilEvent,
        refundPercent,
        refundTier,
        allowClientCancellation: booking.AllowClientCancellation !== false,
        allowVendorCancellation: booking.AllowVendorCancellation !== false,
        fullRefundHours: booking.FullRefundHours || 168,
        partialRefundHours: booking.PartialRefundHours || 48,
        noRefundHours: booking.NoRefundHours || 24
      }
    });

  } catch (err) {
    console.error('Get cancellation policy error:', err);
    res.status(500).json({ success: false, message: 'Failed to get cancellation policy', error: err.message });
  }
});

module.exports = router;
