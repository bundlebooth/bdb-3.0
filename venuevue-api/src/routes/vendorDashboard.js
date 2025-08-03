const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Get vendor dashboard data
router.get('/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, id);

    const result = await request.execute('sp_GetVendorDashboard');
    
    const dashboard = {
      profile: result.recordsets[0][0],
      recentBookings: result.recordsets[1],
      recentReviews: result.recordsets[2],
      unreadMessages: result.recordsets[3][0].UnreadMessages,
      unreadNotifications: result.recordsets[4][0].UnreadNotifications,
      stats: result.recordsets[5][0]
    };

    res.json(dashboard);

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

// Get vendor analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('VendorProfileID', sql.Int, id);
    request.input('StartDate', sql.Date, startDate || null);
    request.input('EndDate', sql.Date, endDate || null);

    const result = await request.execute('sp_GetVendorAnalytics');
    
    const analytics = {
      bookingStats: result.recordsets[0][0],
      revenueByService: result.recordsets[1],
      revenueByMonth: result.recordsets[2],
      reviewStats: result.recordsets[3][0]
    };

    res.json(analytics);

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

module.exports = router;
