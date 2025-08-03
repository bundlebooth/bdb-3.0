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
      services 
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

    const result = await request.execute('sp_CreateBookingWithServices');
    
    const bookingId = result.recordset[0].BookingID;
    const conversationId = result.recordset[0].ConversationID;

    // Create Stripe payment intent
    const totalAmount = services.reduce((sum, service) => sum + (service.price * service.quantity), 0);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // in cents
      currency: 'usd',
      metadata: { bookingId: bookingId.toString() }
    });

    res.json({
      bookingId,
      conversationId,
      paymentIntent: paymentIntent.client_secret
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

module.exports = router;
