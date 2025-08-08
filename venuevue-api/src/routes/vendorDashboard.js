const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

// Get vendor dashboard data (summary)
router.get('/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params; // This 'id' is UserID for sp_GetVendorDashboard

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    
    request.input('UserID', sql.Int, id);

    const result = await request.execute('sp_GetVendorDashboard');
    
    // Handle case when no data is returned
    const profile = result.recordsets[0] && result.recordsets[0][0] ? result.recordsets[0][0] : null;
    const recentBookings = result.recordsets[1] || [];
    const recentReviews = result.recordsets[2] || [];
    const unreadMessages = (result.recordsets[3] && result.recordsets[3][0]) ? result.recordsets[3][0].UnreadMessages : 0;
    const unreadNotifications = (result.recordsets[4] && result.recordsets[4][0]) ? result.recordsets[4][0].UnreadNotifications : 0;
    const stats = result.recordsets[5] && result.recordsets[5][0] ? result.recordsets[5][0] : {
      totalBookings: 0,
      totalRevenue: 0,
      averageRating: 0,
      totalReviews: 0
    };

    const dashboard = {
      success: true,
      profile: profile,
      recentBookings: recentBookings,
      recentReviews: recentReviews,
      unreadMessages: unreadMessages,
      unreadNotifications: unreadNotifications,
      stats: stats
    };

    res.json(dashboard);

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Database operation failed',
      error: err.message 
    });
  }
});

// Get vendor analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params; // This 'id' is VendorProfileID for sp_GetVendorAnalytics
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

// Get all bookings for a specific vendor
router.get('/:id/bookings/all', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetVendorBookingsAll');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get all vendor bookings error:', err);
    res.status(500).json({ message: 'Failed to get vendor bookings', error: err.message });
  }
});

// Get all services for a specific vendor
router.get('/:id/services', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetVendorServices');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get vendor services error:', err);
    res.status(500).json({ message: 'Failed to get vendor services', error: err.message });
  }
});

// Add or Update a vendor service
router.post('/:id/services/upsert', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const { serviceId, categoryName, serviceName, serviceDescription, price, durationMinutes, maxAttendees, isActive, requiresDeposit, depositPercentage, cancellationPolicy } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('ServiceID', sql.Int, serviceId || null);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('CategoryName', sql.NVarChar(100), categoryName);
    request.input('ServiceName', sql.NVarChar(100), serviceName);
    request.input('ServiceDescription', sql.NVarChar(sql.MAX), serviceDescription || null);
    request.input('Price', sql.Decimal(10, 2), price);
    request.input('DurationMinutes', sql.Int, durationMinutes || null);
    request.input('MaxAttendees', sql.Int, maxAttendees || null);
    request.input('IsActive', sql.Bit, isActive);
    request.input('RequiresDeposit', sql.Bit, requiresDeposit);
    request.input('DepositPercentage', sql.Decimal(5,2), depositPercentage);
    request.input('CancellationPolicy', sql.NVarChar(sql.MAX), cancellationPolicy || null);

    const result = await request.execute('sp_UpsertVendorService');
    res.json({ success: true, serviceId: result.recordset[0].ServiceID });
  } catch (err) {
    console.error('Upsert vendor service error:', err);
    res.status(500).json({ message: 'Failed to upsert vendor service', error: err.message });
  }
});

// Delete a vendor service
router.delete('/:id/services/:serviceId', async (req, res) => {
  try {
    const { id, serviceId } = req.params; // VendorProfileID, ServiceID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('ServiceID', sql.Int, parseInt(serviceId));
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_DeleteVendorService');
    if (result.recordset[0].Success) {
      res.json({ success: true, message: 'Service deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Service not found or could not be deleted' });
    }
  } catch (err) {
    console.error('Delete vendor service error:', err);
    res.status(500).json({ message: 'Failed to delete vendor service', error: err.message });
  }
});

// Get all reviews for a specific vendor
router.get('/:id/reviews/all', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetVendorReviewsAll');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get all vendor reviews error:', err);
    res.status(500).json({ message: 'Failed to get vendor reviews', error: err.message });
  }
});

// Get vendor profile details for editing
router.get('/:id/profile-details', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetVendorProfileDetails');
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ message: 'Vendor profile not found' });
    }
  } catch (err) {
    console.error('Get vendor profile details error:', err);
    res.status(500).json({ message: 'Failed to get vendor profile details', error: err.message });
  }
});

// Get vendor images
router.get('/:id/images', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetVendorImages');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get vendor images error:', err);
    res.status(500).json({ message: 'Failed to get vendor images', error: err.message });
  }
});

// Add or Update a vendor image
router.post('/:id/images/upsert', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const { imageId, imageUrl, isPrimary, caption, displayOrder } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('ImageID', sql.Int, imageId || null);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('ImageURL', sql.NVarChar(255), imageUrl);
    request.input('IsPrimary', sql.Bit, isPrimary);
    request.input('Caption', sql.NVarChar(255), caption || null);
    request.input('DisplayOrder', sql.Int, displayOrder || 0);

    const result = await request.execute('sp_UpsertVendorImage');
    res.json({ success: true, imageId: result.recordset[0].ImageID });
  } catch (err) {
    console.error('Upsert vendor image error:', err);
    res.status(500).json({ message: 'Failed to upsert vendor image', error: err.message });
  }
});

// Delete a vendor image
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const { id, imageId } = req.params; // VendorProfileID, ImageID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('ImageID', sql.Int, parseInt(imageId));
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_DeleteVendorImage');
    if (result.recordset[0].Success) {
      res.json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Image not found or could not be deleted' });
    }
  } catch (err) {
    console.error('Delete vendor image error:', err);
    res.status(500).json({ message: 'Failed to delete vendor image', error: err.message });
  }
});

// Get vendor availability (business hours and exceptions)
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_GetVendorAvailability');
    res.json({
      businessHours: result.recordsets[0],
      availabilityExceptions: result.recordsets[1]
    });
  } catch (err) {
    console.error('Get vendor availability error:', err);
    res.status(500).json({ message: 'Failed to get vendor availability', error: err.message });
  }
});

// Add or Update a vendor business hour
router.post('/:id/business-hours/upsert', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const { hoursId, dayOfWeek, openTime, closeTime, isAvailable } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('HoursID', sql.Int, hoursId || null);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('DayOfWeek', sql.TinyInt, dayOfWeek);
    request.input('OpenTime', sql.Time, openTime || null);
    request.input('CloseTime', sql.Time, closeTime || null);
    request.input('IsAvailable', sql.Bit, isAvailable);

    const result = await request.execute('sp_UpsertVendorBusinessHour');
    res.json({ success: true, hoursId: result.recordset[0].HoursID });
  } catch (err) {
    console.error('Upsert vendor business hour error:', err);
    res.status(500).json({ message: 'Failed to upsert vendor business hour', error: err.message });
  }
});

// Delete a vendor business hour
router.delete('/:id/business-hours/:hoursId', async (req, res) => {
  try {
    const { id, hoursId } = req.params; // VendorProfileID, HoursID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('HoursID', sql.Int, parseInt(hoursId));
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_DeleteVendorBusinessHour');
    if (result.recordset[0].Success) {
      res.json({ success: true, message: 'Business hour deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Business hour not found or could not be deleted' });
    }
  } catch (err) {
    console.error('Delete vendor business hour error:', err);
    res.status(500).json({ message: 'Failed to delete vendor business hour', error: err.message });
  }
});

// Add or Update a vendor availability exception
router.post('/:id/availability-exceptions/upsert', async (req, res) => {
  try {
    const { id } = req.params; // VendorProfileID
    const { exceptionId, startDate, endDate, startTime, endTime, isAvailable, reason } = req.body;

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('ExceptionID', sql.Int, exceptionId || null);
    request.input('VendorProfileID', sql.Int, parseInt(id));
    request.input('StartDate', sql.Date, startDate);
    request.input('EndDate', sql.Date, endDate);
    request.input('StartTime', sql.Time, startTime || null);
    request.input('EndTime', sql.Time, endTime || null);
    request.input('IsAvailable', sql.Bit, isAvailable);
    request.input('Reason', sql.NVarChar(255), reason || null);

    const result = await request.execute('sp_UpsertVendorAvailabilityException');
    res.json({ success: true, exceptionId: result.recordset[0].ExceptionID });
  } catch (err) {
    console.error('Upsert vendor availability exception error:', err);
    res.status(500).json({ message: 'Failed to upsert vendor availability exception', error: err.message });
  }
});

// Delete a vendor availability exception
router.delete('/:id/availability-exceptions/:exceptionId', async (req, res) => {
  try {
    const { id, exceptionId } = req.params; // VendorProfileID, ExceptionID
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('ExceptionID', sql.Int, parseInt(exceptionId));
    request.input('VendorProfileID', sql.Int, parseInt(id));
    const result = await request.execute('sp_DeleteVendorAvailabilityException');
    if (result.recordset[0].Success) {
      res.json({ success: true, message: 'Availability exception deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Availability exception not found or could not be deleted' });
    }
  } catch (err) {
    console.error('Delete vendor availability exception error:', err);
    res.status(500).json({ message: 'Failed to delete vendor availability exception', error: err.message });
  }
});

module.exports = router;
