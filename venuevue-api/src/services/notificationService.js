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

// Always use production URL for emails in production
const FRONTEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://www.planbeau.com' 
  : (process.env.FRONTEND_URL || 'http://localhost:3000');

/**
 * Send email notification when a new booking request is created
 * @param {number} requestId - The booking request ID
 * @param {number} userId - The client's user ID
 * @param {number} vendorProfileId - The vendor profile ID
 * @param {object} eventDetails - Event details (date, location, budget, services)
 */
async function notifyVendorOfNewRequest(requestId, userId, vendorProfileId, eventDetails = {}) {
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
    
    await sendBookingRequestToVendor(
      data.VendorEmail,
      data.VendorBusinessName || data.VendorName,
      data.ClientName,
      serviceName,
      eventDate,
      eventDetails.location || 'Not specified',
      budget,
      `${FRONTEND_URL}/dashboard/booking/${requestId}`,
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
    
    await sendBookingAcceptedToClient(
      data.ClientEmail,
      data.ClientName,
      data.VendorName,
      data.ServiceName,
      `${FRONTEND_URL}/dashboard/booking/${requestId}`,
      data.UserID,
      requestId
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
