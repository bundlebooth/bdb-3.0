/**
 * Centralized Notification Service
 * Handles all email notifications triggered by various events in the application.
 * This service fetches necessary data via stored procedures and sends emails.
 */

const { poolPromise, sql } = require('../config/db');
const {
  sendBookingRequestToVendor,
  sendBookingAcceptedToClient,
  sendBookingRejectedToClient,
  sendMessageFromVendor,
  sendMessageFromClient,
  sendPaymentReceivedToVendor
} = require('./email');

// Use environment variable for frontend URL with production fallback
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.planbeau.com';

/**
 * Send email notification when a new booking request is created
 * @param {number} vendorProfileId - The vendor's profile ID
 * @param {number} userId - The client's user ID
 * @param {number} requestId - The booking request ID
 * @param {object} eventDetails - Event details (date, location, budget, etc.)
 */
async function notifyVendorOfNewRequest(vendorProfileId, userId, requestId, eventDetails = {}) {
  try {
    const pool = await poolPromise;
    
    // Get vendor and client details via stored procedure
    const result = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .input('UserID', sql.Int, userId)
      .execute('email.sp_GetVendorForNewRequest');
    
    if (result.recordset.length === 0) return;
    const data = result.recordset[0];
    
    // Format event date
    const eventDate = eventDetails.eventDate 
      ? new Date(eventDetails.eventDate).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
      : 'Not specified';
    
    // Format budget
    const budget = eventDetails.budget 
      ? `$${Number(eventDetails.budget).toFixed(2)}`
      : 'Not specified';
    
    // Get service name
    const serviceName = eventDetails.serviceName || 'Service';
    
    // Generate encoded booking ID for deep link URL
    const Hashids = require('hashids');
    const BASE_SALT = process.env.HASHID_SALT || 'd4f1b8c0e7a24f56a9c3e1b77f08d92c4eb1a6f53d7e9c0fa2b14ce8f937ab10';
    const bookingHashids = new Hashids(`${BASE_SALT}_booking`, 8, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    const encodedRequestId = bookingHashids.encode(requestId);
    
    // Use deep link format that works with ProtectedDeepLink component
    const dashboardUrl = `${FRONTEND_URL}/dashboard/booking/${encodedRequestId}`;
    
    await sendBookingRequestToVendor(
      data.VendorEmail,
      data.VendorBusinessName || data.VendorName,
      data.ClientName,
      serviceName,
      eventDate,
      eventDetails.location || 'Not specified',
      budget,
      dashboardUrl,
      data.VendorUserID,
      requestId
    );
  } catch (error) {
    console.error('[NotificationService] Failed to notify vendor of new request:', error.message);
  }
}

/**
 * Send email notification when a booking request is approved
 * @param {number} requestId - The booking request ID
 */
async function notifyClientOfApproval(requestId) {
  try {
    const pool = await poolPromise;
    
    // Get request details via stored procedure
    const result = await pool.request()
      .input('RequestID', sql.Int, requestId)
      .execute('email.sp_GetRequestForApproval');
    
    if (result.recordset.length === 0) return;
    const data = result.recordset[0];
    
    // Generate encoded booking ID for payment URL
    const Hashids = require('hashids');
    const BASE_SALT = process.env.HASHID_SALT || 'd4f1b8c0e7a24f56a9c3e1b77f08d92c4eb1a6f53d7e9c0fa2b14ce8f937ab10';
    const bookingHashids = new Hashids(`${BASE_SALT}_booking`, 8, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    const encodedBookingId = bookingHashids.encode(requestId);
    
    // Generate payment URL with encoded booking ID
    const paymentUrl = `${FRONTEND_URL}/payment/${encodedBookingId}`;
    const dashboardUrl = `${FRONTEND_URL}/dashboard?section=bookings&itemId=${encodedBookingId}`;
    
    // Format event date if available
    const eventDate = data.EventDate 
      ? new Date(data.EventDate).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
      : null;
    
    // Format amount if available
    const amount = data.TotalAmount ? `$${Number(data.TotalAmount).toFixed(2)}` : null;
    
    await sendBookingAcceptedToClient(
      data.ClientEmail,
      data.ClientName,
      data.VendorName,
      data.ServiceName,
      dashboardUrl,
      data.UserID,
      requestId,
      eventDate,
      data.EventTime || null,
      data.EventLocation || null,
      amount,
      data.TimeZone || null,
      data.VendorLogoUrl || null,
      paymentUrl
    );
  } catch (error) {
    console.error('[NotificationService] Failed to notify client of approval:', error.message);
  }
}

/**
 * Send email notification when a booking request is declined
 * @param {number} requestId - The booking request ID
 */
async function notifyClientOfRejection(requestId) {
  try {
    const pool = await poolPromise;
    
    // Get request details via stored procedure
    const result = await pool.request()
      .input('RequestID', sql.Int, requestId)
      .execute('email.sp_GetRequestForRejection');
    
    if (result.recordset.length === 0) return;
    const data = result.recordset[0];
    
    const eventDate = data.EventDate 
      ? new Date(data.EventDate).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
      : 'your event';
    
    await sendBookingRejectedToClient(
      data.ClientEmail,
      data.ClientName,
      data.VendorName,
      data.ServiceName,
      eventDate,
      `${FRONTEND_URL}/search`,
      data.UserID,
      null
    );
  } catch (error) {
    console.error('[NotificationService] Failed to notify client of rejection:', error.message);
  }
}

/**
 * Send email notification when a message is sent
 * @param {number} conversationId - The conversation ID
 * @param {number} senderId - The sender's user ID
 * @param {string} content - The message content
 */
async function notifyOfNewMessage(conversationId, senderId, content) {
  try {
    const pool = await poolPromise;
    
    // Get conversation details via stored procedure
    const result = await pool.request()
      .input('ConversationID', sql.Int, conversationId)
      .execute('email.sp_GetConversationForMessage');
    
    if (result.recordset.length === 0) return;
    const conv = result.recordset[0];
    
    // Truncate message for preview
    const messagePreview = content.length > 200 ? content.substring(0, 200) + '...' : content;
    const dashboardUrl = `${FRONTEND_URL}/dashboard`;
    
    // Determine sender and recipient
    if (senderId === conv.UserID) {
      // Client sending to vendor
      await sendMessageFromClient(
        conv.VendorEmail,
        conv.VendorName,
        conv.ClientName,
        messagePreview,
        dashboardUrl,
        conv.VendorUserID
      );
    } else {
      // Vendor sending to client
      await sendMessageFromVendor(
        conv.ClientEmail,
        conv.ClientName,
        conv.VendorName,
        messagePreview,
        dashboardUrl,
        conv.UserID
      );
    }
  } catch (error) {
    console.error('[NotificationService] Failed to notify of new message:', error.message);
  }
}

/**
 * Send email notification when payment is received
 * @param {number} bookingId - The booking ID
 * @param {number} amountCents - The amount in cents
 * @param {string} currency - The currency code
 */
async function notifyVendorOfPayment(bookingId, amountCents, currency = 'CAD') {
  try {
    const pool = await poolPromise;
    
    // Get booking details via stored procedure
    const result = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('email.sp_GetBookingForPayment');
    
    if (result.recordset.length === 0) return;
    const data = result.recordset[0];
    
    const amount = amountCents ? `$${(amountCents / 100).toFixed(2)} ${currency.toUpperCase()}` : `$${data.TotalAmount}`;
    const eventDate = data.EventDate 
      ? new Date(data.EventDate).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
      : 'Upcoming event';
    
    await sendPaymentReceivedToVendor(
      data.VendorEmail,
      data.VendorName,
      data.ClientName,
      amount,
      data.ServiceName,
      eventDate,
      `${FRONTEND_URL}/dashboard`,
      data.VendorUserID,
      bookingId
    );
  } catch (error) {
    console.error('[NotificationService] Failed to notify vendor of payment:', error.message);
  }
}

module.exports = {
  notifyVendorOfNewRequest,
  notifyClientOfApproval,
  notifyClientOfRejection,
  notifyOfNewMessage,
  notifyVendorOfPayment
};
