const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const { authenticate } = require('../middlewares/auth');
const sql = require('mssql');  

// Create a booking
router.post('/', authenticate, async (req, res) => {
  try {
    const { eventTypeId, eventName, eventDate, startTime, endTime, guestCount, providerDetails } = req.body;
    const userId = req.user.id;
    
    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .input('EventTypeID', sql.Int, eventTypeId)
      .input('EventName', sql.NVarChar(255), eventName)
      .input('EventDate', sql.Date, eventDate)
      .input('StartTime', sql.Time, startTime)
      .input('EndTime', sql.Time, endTime)
      .input('GuestCount', sql.Int, guestCount)
      .input('ProviderDetails', sql.NVarChar(sql.MAX), JSON.stringify(providerDetails))
      .output('BookingID', sql.Int)
      .execute('sp_Booking_Create');
      
    const bookingId = result.output.BookingID;
    
    res.status(201).json({ bookingId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user bookings
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, req.params.userId)
      .execute('sp_Booking_GetByUser');
      
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check availability
router.post('/availability', async (req, res) => {
  try {
    const { providerIds, eventDate, startTime, endTime, guestCount } = req.body;
    
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ProviderIDs', sql.NVarChar(sql.MAX), JSON.stringify(providerIds))
      .input('EventDate', sql.Date, eventDate)
      .input('StartTime', sql.Time, startTime)
      .input('EndTime', sql.Time, endTime)
      .input('GuestCount', sql.Int, guestCount || null)
      .execute('sp_Booking_CheckAvailability');
      
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
