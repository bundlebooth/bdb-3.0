const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const { decodeBookingId, encodeBookingId } = require('../utils/hashIds');

/**
 * Reviews Routes
 * Handles review validation and related endpoints for the review deeplink system
 */

// GET /api/reviews/validate/:bookingId - Validate a review request
// Used by the ReviewPage to check if a booking can be reviewed
// bookingId can be either a numeric ID or an encoded hash ID
router.get('/validate/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({
        valid: false,
        errorTitle: 'Invalid Request',
        errorMessage: 'Booking ID is required.'
      });
    }

    // Try to decode if it's a hash ID, otherwise use as numeric ID
    let numericBookingId = parseInt(bookingId, 10);
    if (isNaN(numericBookingId)) {
      // It's an encoded hash ID, decode it
      numericBookingId = decodeBookingId(bookingId);
      if (!numericBookingId) {
        return res.status(400).json({
          valid: false,
          errorTitle: 'Invalid Link',
          errorMessage: 'This review link is not valid.'
        });
      }
    }

    const pool = await poolPromise;
    const request = pool.request();
    request.input('BookingID', sql.Int, numericBookingId);
    
    // Call stored procedure to validate the review request
    const result = await request.execute('vendors.sp_ValidateReviewRequest');
    
    if (!result.recordset || result.recordset.length === 0) {
      return res.json({
        valid: false,
        errorTitle: 'Booking Not Found',
        errorMessage: 'This booking could not be found.'
      });
    }

    const data = result.recordset[0];
    
    // Check various validation states
    if (data.AlreadyReviewed) {
      return res.json({
        valid: false,
        alreadyReviewed: true,
        errorTitle: 'Already Reviewed',
        errorMessage: 'You have already submitted a review for this booking.'
      });
    }

    if (data.Expired) {
      return res.json({
        valid: false,
        expired: true,
        errorTitle: 'Review Link Expired',
        errorMessage: 'This review link has expired. Review requests are valid for 30 days after your event.'
      });
    }

    if (!data.IsCompleted) {
      return res.json({
        valid: false,
        errorTitle: 'Event Not Completed',
        errorMessage: 'Reviews can only be submitted after your event has taken place.'
      });
    }

    if (!data.IsPaid) {
      return res.json({
        valid: false,
        errorTitle: 'Payment Required',
        errorMessage: 'Reviews can only be submitted for paid bookings.'
      });
    }

    // Valid - return booking details for the review form
    res.json({
      valid: true,
      booking: {
        BookingID: data.BookingID,
        bookingPublicId: encodeBookingId(data.BookingID),
        VendorProfileID: data.VendorProfileID,
        VendorName: data.VendorName,
        VendorLogo: data.VendorLogo,
        ServiceName: data.ServiceName,
        EventDate: data.EventDate,
        EventLocation: data.EventLocation,
        TotalAmount: data.TotalAmount
      }
    });

  } catch (err) {
    console.error('Review validation error:', err);
    res.status(500).json({
      valid: false,
      errorTitle: 'Server Error',
      errorMessage: 'Failed to validate review request. Please try again.'
    });
  }
});

module.exports = router;
