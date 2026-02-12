/**
 * Centralized Email Service
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
  sendPaymentReceivedToVendor,
  sendPaymentConfirmationToClient,
  sendBookingCancelledToClient,
  sendBookingCancelledToVendor,
  sendVendorApplicationToAdmin,
  sendVendorWelcome,
  sendBookingConfirmedToClient,
  sendBookingConfirmedToVendor,
  sendVendorApproved,
  sendVendorRejected,
  sendClientWelcome,
  sendClientToVendorWelcome,
  sendBookingRescheduled,
  sendBookingReminder,
  sendEventReminder,
  sendBookingActionReminder,
  sendBookingDepositDue,
  sendFinalPaymentDue,
  sendInvoice,
  sendRefundProcessed,
  sendPayoutProcessed,
  sendPaymentFailed,
  sendQuoteReceived,
  sendNewReviewReceived,
  sendReviewRequest,
  sendVendorFeatured,
  sendVendorProfileIncomplete,
  sendSupportTicketOpened,
  sendSupportTicketReply,
  sendSupportTicketClosed,
  sendAccountUnlockedEmail
} = require('./email');
const pushService = require('./pushNotificationService');
const { encodeBookingId } = require('../utils/hashIds');

// ALWAYS use production URL for email links - never localhost
const FRONTEND_URL = 'https://www.planbeau.com';

/**
 * Get user info for notifications using stored procedure
 * @param {number} userId - The user ID
 * @returns {Object|null} - User info with Email, FirstName, LastName, FullName
 */
async function getUserForNotification(userId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .execute('notifications.sp_GetUserForNotification');
    
    if (result.recordset.length === 0) return null;
    return result.recordset[0];
  } catch (error) {
    console.error('[NotificationService] Failed to get user for notification:', error.message);
    return null;
  }
}

/**
 * Create an in-app notification for a user
 * @param {number} userId - The user ID to notify
 * @param {string} type - Notification type (message, booking, payment, etc.)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {number} relatedId - Optional related entity ID (bookingId, conversationId, etc.)
 */
async function createInAppNotification(userId, type, title, message, relatedId = null) {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('UserID', sql.Int, userId)
      .input('Type', sql.NVarChar(50), type)
      .input('Title', sql.NVarChar(255), title)
      .input('Message', sql.NVarChar(sql.MAX), message)
      .input('RelatedID', sql.Int, relatedId)
      .execute('notifications.sp_Create');
    console.log(`[NotificationService] Created in-app notification for user ${userId}: ${title}`);
  } catch (error) {
    console.error('[NotificationService] Failed to create in-app notification:', error.message);
  }
}

/**
 * Send email notification when a new booking request is created
 * @param {number} requestId - The booking request ID
 * @param {number} userId - The client's user ID
 * @param {number} vendorProfileId - The vendor profile ID
 * @param {object} eventDetails - Event details (date, location, budget, services)
 */
async function notifyVendorOfNewRequest(requestId, userId, vendorProfileId, eventDetails = {}) {
  try {
    console.log(`[NotificationService] notifyVendorOfNewRequest called - requestId: ${requestId}, userId: ${userId}, vendorProfileId: ${vendorProfileId}`);
    const pool = await poolPromise;
    
    // Get vendor and client details via stored procedure
    const result = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .input('UserID', sql.Int, userId)
      .execute('email.sp_GetVendorForNewRequest');
    
    if (result.recordset.length === 0) {
      console.log(`[NotificationService] No vendor/client data found for vendorProfileId: ${vendorProfileId}, userId: ${userId} - email NOT sent`);
      return;
    }
    const data = result.recordset[0];
    
    // Format event date
    const eventDate = eventDetails.eventDate 
      ? new Date(eventDetails.eventDate).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
      : 'Not specified';
    
    // Format total (was budget)
    const total = eventDetails.budget 
      ? `$${Number(eventDetails.budget).toFixed(2)}`
      : 'Not specified';
    
    // Get service name
    const serviceName = eventDetails.serviceName || 'Service';
    
    // Format event time with timezone
    let eventTime = null;
    if (eventDetails.startTime) {
      eventTime = eventDetails.startTime;
      if (eventDetails.endTime) {
        eventTime += ` - ${eventDetails.endTime}`;
      }
    }
    const timezone = eventDetails.timezone || null;
    
    console.log(`[NotificationService] Sending booking request email to vendor: ${data.VendorEmail}`);
    await sendBookingRequestToVendor(
      data.VendorEmail,
      data.VendorBusinessName || data.VendorName,
      data.ClientName,
      serviceName,
      eventDate,
      eventDetails.location || 'Not specified',
      total,
      `${FRONTEND_URL}/link/vendor-request/${encodeBookingId(requestId)}`,
      data.VendorUserID,
      requestId,
      eventTime,
      null,
      timezone
    );
    console.log(`[NotificationService] Booking request email sent successfully to ${data.VendorEmail}`);
    
    // Send push notification to vendor
    await pushService.notifyNewBookingRequest(data.VendorUserID, data.ClientName, serviceName);
    
    // Create in-app notification for vendor
    await createInAppNotification(
      data.VendorUserID,
      'booking_request',
      'New Booking Request',
      `${data.ClientName} wants to book ${serviceName}`,
      requestId
    );
  } catch (error) {
    console.error('[NotificationService] Failed to notify vendor of new request:', error.message);
    console.error('[NotificationService] Full error:', error);
  }
}

/**
 * Send email notification when a booking request is approved
 * @param {number} requestId - The booking request ID
 */
async function notifyClientOfApproval(requestId) {
  try {
    console.log(`[NotificationService] notifyClientOfApproval called for requestId: ${requestId}`);
    const pool = await poolPromise;
    
    // Get request details via stored procedure
    const result = await pool.request()
      .input('RequestID', sql.Int, requestId)
      .execute('email.sp_GetRequestForApproval');
    
    if (result.recordset.length === 0) {
      console.log(`[NotificationService] No request found for requestId: ${requestId}`);
      return;
    }
    const data = result.recordset[0];
    console.log(`[NotificationService] Found request data:`, { 
      ClientEmail: data.ClientEmail, 
      ClientName: data.ClientName, 
      VendorName: data.VendorName,
      EventLocation: data.EventLocation,
      EventTime: data.EventTime,
      TimeZone: data.TimeZone
    });
    
    // Generate encoded booking ID for payment URL
    const encodedBookingId = encodeBookingId(requestId);
    const paymentUrl = `${FRONTEND_URL}/link/payment/${encodedBookingId}`;
    const dashboardUrl = `${FRONTEND_URL}/link/booking/${encodedBookingId}`;
    
    // Format event date if available
    const eventDate = data.EventDate 
      ? new Date(data.EventDate).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
      : null;
    
    // Get location and time from database
    const eventLocation = data.EventLocation || null;
    const eventTime = data.EventTime || null;
    const timezone = data.TimeZone || null;
    const amount = data.TotalAmount ? `$${Number(data.TotalAmount).toFixed(2)}` : null;
    
    console.log(`[NotificationService] Sending booking accepted email to ${data.ClientEmail}`);
    await sendBookingAcceptedToClient(
      data.ClientEmail,
      data.ClientName,
      data.VendorName,
      data.ServiceName,
      dashboardUrl,
      data.UserID,
      requestId,
      eventDate,
      eventTime,
      eventLocation,
      amount,
      timezone,
      null, // vendorProfilePic
      paymentUrl
    );
    console.log(`[NotificationService] Booking accepted email sent successfully`);
    
    // Send push notification to client
    await pushService.notifyBookingUpdate(data.UserID, 'accepted', data.VendorName);
    
    // Create in-app notification for client
    await createInAppNotification(
      data.UserID,
      'booking_accepted',
      'Booking Request Accepted!',
      `${data.VendorName} accepted your booking request for ${data.ServiceName}`,
      requestId
    );
  } catch (error) {
    console.error('[NotificationService] Failed to notify client of approval:', error.message);
    console.error('[NotificationService] Full error:', error);
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
    
    // Send push notification to client
    await pushService.notifyBookingUpdate(data.UserID, 'rejected', data.VendorName);
    
    // Create in-app notification for client
    await createInAppNotification(
      data.UserID,
      'booking_rejected',
      'Booking Request Declined',
      `${data.VendorName} couldn't accept your booking request for ${data.ServiceName}`,
      requestId
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
    console.log(`[NotificationService] notifyOfNewMessage called - conversationId: ${conversationId}, senderId: ${senderId}`);
    const pool = await poolPromise;
    
    // Get conversation details via stored procedure
    const result = await pool.request()
      .input('ConversationID', sql.Int, conversationId)
      .execute('email.sp_GetConversationForMessage');
    
    if (result.recordset.length === 0) {
      console.log(`[NotificationService] No conversation data found for conversationId: ${conversationId} - email NOT sent`);
      return;
    }
    const conv = result.recordset[0];
    
    // Truncate message for preview
    const messagePreview = content.length > 200 ? content.substring(0, 200) + '...' : content;
    const dashboardUrl = `${FRONTEND_URL}/link/message/${conversationId}`;
    
    // Determine sender and recipient
    if (senderId === conv.UserID) {
      // Client sending to vendor - use client's profile pic
      const senderProfilePic = conv.ClientProfilePic || null;
      console.log(`[NotificationService] Sending message notification email to vendor: ${conv.VendorEmail}`);
      await sendMessageFromClient(
        conv.VendorEmail,
        conv.VendorName,
        conv.ClientName,
        messagePreview,
        dashboardUrl,
        conv.VendorUserID,
        senderProfilePic
      );
      console.log(`[NotificationService] Message notification email sent to ${conv.VendorEmail}`);
      
      // Send push notification to vendor
      await pushService.notifyNewMessage(conv.VendorUserID, conv.ClientName, messagePreview);
      
      // Create in-app notification for vendor
      await createInAppNotification(
        conv.VendorUserID,
        'message',
        `New message from ${conv.ClientName}`,
        messagePreview,
        conversationId
      );
    } else {
      // Vendor sending to client - use vendor's logo or profile pic
      const senderProfilePic = conv.VendorLogoUrl || conv.VendorProfilePic || null;
      console.log(`[NotificationService] Sending message notification email to client: ${conv.ClientEmail}`);
      await sendMessageFromVendor(
        conv.ClientEmail,
        conv.ClientName,
        conv.VendorName,
        messagePreview,
        dashboardUrl,
        conv.UserID,
        senderProfilePic
      );
      console.log(`[NotificationService] Message notification email sent to ${conv.ClientEmail}`);
      
      // Send push notification to client
      await pushService.notifyNewMessage(conv.UserID, conv.VendorName, messagePreview);
      
      // Create in-app notification for client
      await createInAppNotification(
        conv.UserID,
        'message',
        `New message from ${conv.VendorName}`,
        messagePreview,
        conversationId
      );
    }
  } catch (error) {
    console.error('[NotificationService] Failed to notify of new message:', error.message);
    console.error('[NotificationService] Full error:', error);
  }
}

/**
 * Send email notification when payment is received
 * @param {number} bookingId - The booking ID
 * @param {number} amountCents - The amount in cents
 * @param {string} currency - The currency code
 * @param {string} transactionId - Optional Stripe transaction ID
 */
async function notifyVendorOfPayment(bookingId, amountCents, currency = 'CAD', transactionId = null) {
  try {
    const pool = await poolPromise;
    
    // Get booking details via stored procedure
    const result = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('email.sp_GetBookingForPayment');
    
    if (result.recordset.length === 0) return;
    const data = result.recordset[0];
    
    const totalAmount = amountCents ? amountCents / 100 : parseFloat(data.TotalAmount) || 0;
    const amount = `$${totalAmount.toFixed(2)} ${currency.toUpperCase()}`;
    const eventDate = data.EventDate 
      ? new Date(data.EventDate).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
      : 'Upcoming event';
    
    // Generate invoice URL - user can view/download pixel-perfect invoice on frontend
    const invoiceUrl = `${FRONTEND_URL}/link/invoice/${encodeBookingId(bookingId)}`;
    const dashboardUrl = `${FRONTEND_URL}/link/payment/${encodeBookingId(bookingId)}`;
    
    await sendPaymentReceivedToVendor(
      data.VendorEmail,
      data.VendorName,
      data.ClientName,
      amount,
      data.ServiceName,
      eventDate,
      dashboardUrl,
      data.VendorUserID,
      bookingId,
      invoiceUrl
    );
    
    // Send push notification to vendor
    await pushService.notifyPaymentReceived(data.VendorUserID, amount, data.ClientName);
    
    // Create in-app notification for vendor
    await createInAppNotification(
      data.VendorUserID,
      'payment',
      'Payment Received',
      `You received ${amount} from ${data.ClientName} for ${data.ServiceName}`,
      bookingId
    );
  } catch (error) {
    console.error('[NotificationService] Failed to notify vendor of payment:', error.message);
  }
}

/**
 * Send email notification when a booking is cancelled
 * @param {number} bookingId - The booking ID
 * @param {string} cancelledBy - Who cancelled: 'client' or 'vendor'
 * @param {string} reason - Cancellation reason
 * @param {number} refundAmount - Refund amount (if any)
 */
async function notifyOfBookingCancellation(bookingId, cancelledBy, reason = null, refundAmount = 0) {
  try {
    const pool = await poolPromise;
    
    // Get booking details via stored procedure
    const result = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('email.sp_GetBookingForCancellation');
    
    if (result.recordset.length === 0) return;
    const data = result.recordset[0];
    
    const eventDate = data.EventDate 
      ? new Date(data.EventDate).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
      : 'your event';
    
    const refundAmountFormatted = refundAmount > 0 ? `$${Number(refundAmount).toFixed(2)}` : '$0.00';
    
    if (cancelledBy === 'vendor') {
      // Notify client that vendor cancelled
      await sendBookingCancelledToClient(
        data.ClientEmail,
        data.ClientName,
        data.VendorName,
        data.ServiceName || 'Service',
        eventDate,
        reason,
        refundAmountFormatted,
        `${FRONTEND_URL}/search`,
        data.ClientUserID,
        bookingId
      );
      
      // Send push notification to client
      await pushService.notifyBookingUpdate(data.ClientUserID, 'cancelled', data.VendorName);
      
      // Create in-app notification for client
      await createInAppNotification(
        data.ClientUserID,
        'booking_cancelled',
        'Booking Cancelled',
        `${data.VendorName} cancelled your booking for ${data.ServiceName || 'Service'}`,
        bookingId
      );
    } else if (cancelledBy === 'client') {
      // Notify vendor that client cancelled
      await sendBookingCancelledToVendor(
        data.VendorEmail,
        data.VendorName,
        data.ClientName,
        data.ServiceName || 'Service',
        eventDate,
        reason,
        `${FRONTEND_URL}/link/vendor-request/${encodeBookingId(bookingId)}`,
        data.VendorUserID,
        bookingId
      );
      
      // Send push notification to vendor
      await pushService.sendToUser(data.VendorUserID, {
        title: 'Booking Cancelled',
        body: `${data.ClientName} cancelled their booking`,
        url: '/dashboard?tab=bookings',
        tag: 'booking-cancelled'
      });
      
      // Create in-app notification for vendor
      await createInAppNotification(
        data.VendorUserID,
        'booking_cancelled',
        'Booking Cancelled',
        `${data.ClientName} cancelled their booking for ${data.ServiceName || 'Service'}`,
        bookingId
      );
    }
  } catch (error) {
    console.error('[NotificationService] Failed to notify of booking cancellation:', error.message);
  }
}

/**
 * Send email notification when payment is completed (to client)
 * @param {number} bookingId - The booking ID
 * @param {number} amountCents - The amount in cents
 * @param {string} currency - The currency code
 * @param {string} transactionId - Optional Stripe transaction ID
 */
async function notifyClientOfPayment(bookingId, amountCents, currency = 'CAD', transactionId = null) {
  try {
    const pool = await poolPromise;
    
    // Get booking details via stored procedure
    const result = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('email.sp_GetBookingForPayment');
    
    if (result.recordset.length === 0) return;
    const data = result.recordset[0];
    
    const totalAmount = amountCents ? amountCents / 100 : parseFloat(data.TotalAmount) || 0;
    const amount = `$${totalAmount.toFixed(2)} ${currency.toUpperCase()}`;
    const eventDate = data.EventDate 
      ? new Date(data.EventDate).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
      : 'Upcoming event';
    
    // Generate invoice URL - user can view/download pixel-perfect invoice on frontend
    const invoiceUrl = `${FRONTEND_URL}/link/invoice/${encodeBookingId(bookingId)}`;
    const dashboardUrl = `${FRONTEND_URL}/link/payment/${encodeBookingId(bookingId)}`;
    
    await sendPaymentConfirmationToClient(
      data.ClientEmail,
      data.ClientName,
      data.VendorName,
      amount,
      data.ServiceName || 'Service',
      eventDate,
      dashboardUrl,
      data.ClientUserID,
      bookingId,
      invoiceUrl
    );
  } catch (error) {
    console.error('[NotificationService] Failed to notify client of payment:', error.message);
  }
}

/**
 * Send email notification to admin when a vendor application is submitted
 * @param {number} userId - The applicant's user ID
 * @param {number} vendorProfileId - The new vendor profile ID
 * @param {object} businessDetails - Business details (name, email, phone, category)
 */
async function notifyAdminOfVendorApplication(userId, vendorProfileId, businessDetails = {}) {
  try {
    console.log(`[NotificationService] Starting vendor application notification for userId: ${userId}, vendorProfileId: ${vendorProfileId}`);
    
    const pool = await poolPromise;
    
    // Get applicant details - use direct query as fallback if stored procedure doesn't exist
    let applicantName = 'New Applicant';
    let applicantEmail = '';
    
    try {
      const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .execute('email.sp_GetUserForVendorApplication');
      
      if (result.recordset.length > 0) {
        applicantName = result.recordset[0].Name || 'New Applicant';
        applicantEmail = result.recordset[0].Email || '';
      }
    } catch (spError) {
      console.log(`[NotificationService] Stored procedure not found, using direct query. Error: ${spError.message}`);
      // Fallback to direct query
      const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .query('SELECT Name, Email FROM users.Users WHERE UserID = @UserID');
      
      if (result.recordset.length > 0) {
        applicantName = result.recordset[0].Name || 'New Applicant';
        applicantEmail = result.recordset[0].Email || '';
      }
    }
    
    if (applicantEmail) {
      console.log(`[NotificationService] Found applicant: ${applicantName} (${applicantEmail})`);
    } else {
      console.log(`[NotificationService] No user found for userId: ${userId}`);
    }
    
    // Get admin email from environment or use default
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_ADMIN || 'admin@planbeau.com';
    console.log(`[NotificationService] Sending admin notification to: ${adminEmail}`);
    
    await sendVendorApplicationToAdmin(
      adminEmail,
      applicantName,
      businessDetails.businessName || 'New Business',
      businessDetails.businessEmail || applicantEmail,
      businessDetails.businessPhone || 'Not provided',
      businessDetails.category || 'Not specified',
      `${FRONTEND_URL}/admin/vendors`
    );
    console.log(`[NotificationService] Admin notification sent successfully`);
    
    // Also send welcome email to the new vendor
    if (applicantEmail) {
      console.log(`[NotificationService] Sending welcome email to vendor: ${applicantEmail}`);
      
      // Use the pre-calculated incomplete sections list if provided (from submit-for-review)
      // This matches the exact same logic as SetupIncompleteBanner on the main page
      const incompleteSections = businessDetails.incompleteSectionsList || [];
      
      console.log(`[NotificationService] Incomplete sections for email: ${incompleteSections.join(', ') || 'None'}`);
      
      await sendVendorWelcome(
        applicantEmail,
        applicantName,
        businessDetails.businessName || 'Your Business',
        `${FRONTEND_URL}/dashboard`,
        userId,
        incompleteSections
      );
      console.log(`[NotificationService] Vendor welcome email sent successfully`);
    } else {
      console.log(`[NotificationService] No applicant email found, skipping welcome email`);
    }
  } catch (error) {
    console.error('[NotificationService] Failed to notify admin of vendor application:', error.message);
    console.error('[NotificationService] Full error:', error);
  }
}

/**
 * Send email notifications when booking is confirmed (after payment)
 * @param {number} bookingId - The booking ID
 */
async function notifyOfBookingConfirmation(bookingId) {
  try {
    const pool = await poolPromise;
    
    // Get booking details
    const result = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .execute('email.sp_GetBookingForPayment');
    
    if (result.recordset.length === 0) return;
    const data = result.recordset[0];
    
    const eventDate = data.EventDate 
      ? new Date(data.EventDate).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
      : 'Upcoming event';
    
    // Notify client
    await sendBookingConfirmedToClient(
      data.ClientEmail,
      data.ClientName,
      data.VendorName,
      data.ServiceName || 'Service',
      eventDate,
      data.EventLocation || 'TBD',
      `${FRONTEND_URL}/link/booking/${encodeBookingId(bookingId)}`,
      data.ClientUserID,
      bookingId
    );
    
    // Send push notification to client
    await pushService.sendToUser(data.ClientUserID, {
      title: 'Booking Confirmed!',
      body: `Your booking with ${data.VendorName} is confirmed`,
      url: '/dashboard?tab=bookings',
      tag: 'booking-confirmed'
    });
    
    // Create in-app notification for client
    await createInAppNotification(
      data.ClientUserID,
      'booking_confirmed',
      'Booking Confirmed!',
      `Your booking with ${data.VendorName} for ${data.ServiceName || 'Service'} is confirmed`,
      bookingId
    );
    
    // Notify vendor
    await sendBookingConfirmedToVendor(
      data.VendorEmail,
      data.VendorName,
      data.ClientName,
      data.ServiceName || 'Service',
      eventDate,
      data.EventLocation || 'TBD',
      `${FRONTEND_URL}/link/vendor-request/${encodeBookingId(bookingId)}`,
      data.VendorUserID,
      bookingId
    );
    
    // Send push notification to vendor
    await pushService.sendToUser(data.VendorUserID, {
      title: 'Booking Confirmed!',
      body: `Booking with ${data.ClientName} is confirmed`,
      url: '/dashboard?tab=bookings',
      tag: 'booking-confirmed'
    });
    
    // Create in-app notification for vendor
    await createInAppNotification(
      data.VendorUserID,
      'booking_confirmed',
      'Booking Confirmed!',
      `Booking with ${data.ClientName} for ${data.ServiceName || 'Service'} is confirmed`,
      bookingId
    );
  } catch (error) {
    console.error('[NotificationService] Failed to notify of booking confirmation:', error.message);
  }
}

/**
 * Send email notification when vendor profile is approved
 * @param {number} vendorProfileId - The vendor profile ID
 */
async function notifyVendorOfApproval(vendorProfileId) {
  try {
    console.log(`[NotificationService] Starting vendor approval notification for vendorProfileId: ${vendorProfileId}`);
    
    const pool = await poolPromise;
    
    // Get vendor details via stored procedure
    const result = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .execute('email.sp_GetVendorForApproval');
    
    if (result.recordset.length === 0) {
      console.log(`[NotificationService] No vendor found for vendorProfileId: ${vendorProfileId}`);
      return;
    }
    const data = result.recordset[0];
    console.log(`[NotificationService] Found vendor: ${data.DisplayName || data.Name} (${data.Email})`);
    
    const vendorName = data.DisplayName || data.Name || 'Vendor';
    const businessName = data.BusinessName || 'Your Business';
    
    // Email
    await sendVendorApproved(
      data.Email,
      vendorName,
      businessName,
      `${FRONTEND_URL}/dashboard`,
      data.UserID
    );
    console.log(`[NotificationService] Vendor approval email sent successfully to ${data.Email}`);
    
    // Push notification
    await pushService.notifyVendorApproved(data.UserID, businessName);
    
    // In-App notification
    await createInAppNotification(
      data.UserID,
      'vendor_approved',
      'Profile Approved!',
      `Congratulations! Your vendor profile for ${businessName} has been approved. You can now receive bookings.`
    );
  } catch (error) {
    console.error('[NotificationService] Failed to notify vendor of approval:', error.message);
    console.error('[NotificationService] Full error:', error);
  }
}

/**
 * Send email notification when vendor profile is rejected
 * @param {number} vendorProfileId - The vendor profile ID
 * @param {string} rejectionReason - The reason for rejection
 */
async function notifyVendorOfRejection(vendorProfileId, rejectionReason) {
  try {
    console.log(`[NotificationService] Starting vendor rejection notification for vendorProfileId: ${vendorProfileId}`);
    
    const pool = await poolPromise;
    
    // Get vendor details via stored procedure
    const result = await pool.request()
      .input('VendorProfileID', sql.Int, vendorProfileId)
      .execute('email.sp_GetVendorForApproval');
    
    if (result.recordset.length === 0) {
      console.log(`[NotificationService] No vendor found for vendorProfileId: ${vendorProfileId}`);
      return;
    }
    const data = result.recordset[0];
    console.log(`[NotificationService] Found vendor: ${data.DisplayName || data.Name} (${data.Email})`);
    
    const vendorName = data.DisplayName || data.Name || 'Vendor';
    const businessName = data.BusinessName || 'Your Business';
    
    // Email
    await sendVendorRejected(
      data.Email,
      vendorName,
      businessName,
      rejectionReason || 'Your profile did not meet our requirements.',
      `${FRONTEND_URL}/become-a-vendor`,
      data.UserID
    );
    console.log(`[NotificationService] Vendor rejection email sent successfully to ${data.Email}`);
    
    // Push notification
    await pushService.notifyVendorRejected(data.UserID);
    
    // In-App notification
    await createInAppNotification(
      data.UserID,
      'vendor_rejected',
      'Profile Review Update',
      'Your vendor profile was not approved. Please review the feedback and resubmit.'
    );
  } catch (error) {
    console.error('[NotificationService] Failed to notify vendor of rejection:', error.message);
    console.error('[NotificationService] Full error:', error);
  }
}

/**
 * Send welcome email to new client after registration
 * @param {number} userId - The user ID
 */
async function notifyClientOfRegistration(userId) {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .query('SELECT Name, Email FROM users.Users WHERE UserID = @UserID');
    
    if (result.recordset.length === 0) return;
    const data = result.recordset[0];
    
    await sendClientWelcome(
      data.Email,
      data.Name || 'there',
      `${FRONTEND_URL}/search`,
      `${FRONTEND_URL}/dashboard`,
      userId
    );
  } catch (error) {
    console.error('[NotificationService] Failed to send client welcome email:', error.message);
  }
}

/**
 * Send welcome email to existing client who becomes a vendor
 * @param {number} userId - The user ID
 * @param {string} businessName - The business name
 */
async function notifyClientToVendor(userId, businessName) {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .query('SELECT Name, Email FROM users.Users WHERE UserID = @UserID');
    
    if (result.recordset.length === 0) return;
    const data = result.recordset[0];
    
    await sendClientToVendorWelcome(
      data.Email,
      data.Name || 'there',
      businessName || 'Your Business',
      `${FRONTEND_URL}/become-a-vendor`,
      userId
    );
  } catch (error) {
    console.error('[NotificationService] Failed to send client-to-vendor welcome email:', error.message);
  }
}

// ============================================
// NEW UNIFIED NOTIFICATION FUNCTIONS
// These send Email + Push + In-App simultaneously
// ============================================

/**
 * Notify user of booking rescheduled (Email + Push + In-App)
 */
async function notifyOfBookingRescheduled(userId, serviceName, originalDate, newDate, dashboardUrl) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendBookingRescheduled(user.Email, userName, serviceName, originalDate, null, newDate, null, dashboardUrl || `${FRONTEND_URL}/dashboard?tab=bookings`, userId);
    
    // Push
    await pushService.notifyBookingRescheduled(userId, serviceName, newDate);
    
    // In-App
    await createInAppNotification(userId, 'booking_rescheduled', 'Booking Rescheduled', `Your booking for ${serviceName} has been rescheduled to ${newDate}`);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of booking rescheduled:', error.message);
  }
}

/**
 * Notify user of booking reminder 24h (Email + Push + In-App)
 */
async function notifyOfBookingReminder24h(userId, vendorName, serviceName, eventDate, eventTime, location, dashboardUrl) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendBookingReminder(user.Email, userName, serviceName, eventDate, eventTime, location, vendorName, 'Vendor', dashboardUrl || `${FRONTEND_URL}/dashboard?tab=bookings`, '24h', userId);
    
    // Push
    await pushService.notifyBookingReminder24h(userId, vendorName, serviceName);
    
    // In-App
    await createInAppNotification(userId, 'booking_reminder_24h', 'Event Tomorrow!', `Your event with ${vendorName} is tomorrow`);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of booking reminder 24h:', error.message);
  }
}

/**
 * Notify user of booking reminder 1 week (Email + Push + In-App)
 */
async function notifyOfBookingReminder1Week(userId, vendorName, serviceName, eventDate, eventTime, location, dashboardUrl) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendBookingReminder(user.Email, userName, serviceName, eventDate, eventTime, location, vendorName, 'Vendor', dashboardUrl || `${FRONTEND_URL}/dashboard?tab=bookings`, '1_week', userId);
    
    // Push
    await pushService.notifyBookingReminder1Week(userId, vendorName, serviceName);
    
    // In-App
    await createInAppNotification(userId, 'booking_reminder_1_week', 'Event in 1 Week', `Your event with ${vendorName} is in 1 week`);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of booking reminder 1 week:', error.message);
  }
}

/**
 * Notify user of event reminder (Email + Push + In-App)
 */
async function notifyOfEventReminder(userId, serviceName, daysUntilEvent, eventDate, eventTime, location, otherPartyName, otherPartyLabel, bookingId) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendEventReminder(user.Email, userName, daysUntilEvent, serviceName, eventDate, eventTime, location, otherPartyLabel, otherPartyName, userId, bookingId);
    
    // Push
    await pushService.notifyEventReminder(userId, serviceName, daysUntilEvent);
    
    // In-App
    await createInAppNotification(userId, 'event_reminder', 'Event Reminder', `Your event for ${serviceName} is in ${daysUntilEvent}`, bookingId);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of event reminder:', error.message);
  }
}

/**
 * Notify user of booking action reminder (Email + Push + In-App)
 */
async function notifyOfBookingActionReminder(userId, actionMessage, actionSubject, serviceName, eventDate, otherPartyName, otherPartyLabel, actionUrl, actionButtonText, bookingId) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendBookingActionReminder(user.Email, userName, actionMessage, actionSubject, serviceName, eventDate, otherPartyLabel, otherPartyName, actionUrl, actionButtonText, userId, bookingId);
    
    // Push
    await pushService.notifyBookingActionReminder(userId, actionSubject);
    
    // In-App
    await createInAppNotification(userId, 'booking_action_reminder', 'Action Required', actionMessage, bookingId);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of booking action reminder:', error.message);
  }
}

/**
 * Notify user of deposit due (Email + Push + In-App)
 */
async function notifyOfDepositDue(userId, vendorName, serviceName, eventDate, depositAmount, dueDate, paymentUrl, bookingId) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendBookingDepositDue(user.Email, userName, vendorName, serviceName, eventDate, depositAmount, dueDate, paymentUrl, userId);
    
    // Push
    await pushService.notifyDepositDue(userId, vendorName, depositAmount, dueDate);
    
    // In-App
    await createInAppNotification(userId, 'deposit_due', 'Deposit Due', `Deposit of ${depositAmount} is due by ${dueDate} for your booking with ${vendorName}`, bookingId);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of deposit due:', error.message);
  }
}

/**
 * Notify user of final payment due (Email + Push + In-App)
 */
async function notifyOfFinalPaymentDue(userId, vendorName, serviceName, eventDate, amountDue, dueDate, paymentUrl, bookingId) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendFinalPaymentDue(user.Email, userName, vendorName, serviceName, eventDate, amountDue, dueDate, paymentUrl, userId);
    
    // Push
    await pushService.notifyFinalPaymentDue(userId, vendorName, amountDue, dueDate);
    
    // In-App
    await createInAppNotification(userId, 'final_payment_due', 'Final Payment Due', `Final payment of ${amountDue} is due by ${dueDate} for your event with ${vendorName}`, bookingId);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of final payment due:', error.message);
  }
}

/**
 * Notify user of invoice received (Email + Push + In-App)
 */
async function notifyOfInvoiceReceived(userId, vendorName, invoiceNumber, serviceName, eventDate, amount, dueDate, paymentUrl, bookingId) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendInvoice(user.Email, userName, vendorName, invoiceNumber, serviceName, eventDate, amount, dueDate, paymentUrl, userId);
    
    // Push
    await pushService.notifyInvoiceReceived(userId, vendorName, amount);
    
    // In-App
    await createInAppNotification(userId, 'invoice_sent', 'Invoice Received', `You received an invoice from ${vendorName} for ${amount}`, bookingId);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of invoice received:', error.message);
  }
}

/**
 * Notify user of refund processed (Email + Push + In-App)
 */
async function notifyOfRefundProcessed(userId, refundAmount, serviceName, refundMethod, dashboardUrl, bookingId) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendRefundProcessed(user.Email, userName, refundAmount, serviceName, refundMethod, dashboardUrl || `${FRONTEND_URL}/dashboard?tab=bookings`, userId);
    
    // Push
    await pushService.notifyRefundProcessed(userId, refundAmount, serviceName);
    
    // In-App
    await createInAppNotification(userId, 'refund_processed', 'Refund Processed', `Your refund of ${refundAmount} for ${serviceName} has been processed`, bookingId);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of refund processed:', error.message);
  }
}

/**
 * Notify vendor of payout processed (Email + Push + In-App)
 */
async function notifyOfPayoutProcessed(userId, payoutAmount, lastFourDigits, arrivalDate, dashboardUrl) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendPayoutProcessed(user.Email, userName, payoutAmount, lastFourDigits, arrivalDate, dashboardUrl || `${FRONTEND_URL}/dashboard?tab=earnings`, userId);
    
    // Push
    await pushService.notifyPayoutProcessed(userId, payoutAmount);
    
    // In-App
    await createInAppNotification(userId, 'payout_processed', 'Payout Processed', `Your payout of ${payoutAmount} has been sent to your account ending in ${lastFourDigits}`);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of payout processed:', error.message);
  }
}

/**
 * Notify user of payment failed (Email + Push + In-App)
 */
async function notifyOfPaymentFailed(userId, amount, vendorName, retryUrl, bookingId) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendPaymentFailed(user.Email, userName, amount, vendorName, retryUrl, userId);
    
    // Push
    await pushService.notifyPaymentFailed(userId, vendorName);
    
    // In-App
    await createInAppNotification(userId, 'payment_failed', 'Payment Failed', `Your payment to ${vendorName} could not be processed. Please try again.`, bookingId);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of payment failed:', error.message);
  }
}

/**
 * Notify user of quote received (Email + Push + In-App)
 */
async function notifyOfQuoteReceived(userId, vendorName, serviceName, eventDate, quoteAmount, validUntil, quoteUrl, bookingId) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendQuoteReceived(user.Email, userName, vendorName, serviceName, eventDate, quoteAmount, validUntil, quoteUrl, userId);
    
    // Push
    await pushService.notifyQuoteReceived(userId, vendorName, quoteAmount);
    
    // In-App
    await createInAppNotification(userId, 'quote_received', 'New Quote Received', `You received a quote from ${vendorName} for ${quoteAmount}. Valid until ${validUntil}.`, bookingId);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of quote received:', error.message);
  }
}

/**
 * Notify vendor of new review received (Email + Push + In-App)
 */
async function notifyOfNewReviewReceived(userId, clientName, rating, reviewPreview, reviewUrl) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendNewReviewReceived(user.Email, userName, clientName, rating, reviewPreview, reviewUrl || `${FRONTEND_URL}/dashboard?tab=reviews`, userId);
    
    // Push
    await pushService.notifyNewReviewReceived(userId, clientName, rating);
    
    // In-App
    await createInAppNotification(userId, 'new_review', 'New Review!', `${clientName} left you a ${rating}-star review`);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of new review received:', error.message);
  }
}

/**
 * Notify client to leave a review (Email + Push + In-App)
 */
async function notifyOfReviewRequest(userId, vendorName, serviceName, eventDate, reviewUrl, bookingId) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendReviewRequest(user.Email, userName, vendorName, serviceName, eventDate, reviewUrl || `${FRONTEND_URL}/dashboard?tab=bookings`, userId);
    
    // Push
    await pushService.notifyReviewRequest(userId, vendorName);
    
    // In-App
    await createInAppNotification(userId, 'review_request', 'Share Your Experience', `How was your experience with ${vendorName}? Leave a review!`, bookingId);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of review request:', error.message);
  }
}

/**
 * Notify vendor of being featured (Email + Push + In-App)
 */
async function notifyOfVendorFeatured(userId, dashboardUrl) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendVendorFeatured(user.Email, userName, dashboardUrl || `${FRONTEND_URL}/dashboard`, userId);
    
    // Push
    await pushService.notifyVendorFeatured(userId);
    
    // In-App
    await createInAppNotification(userId, 'vendor_featured', "You're Featured!", 'Congratulations! You have been selected as a featured vendor.');
  } catch (error) {
    console.error('[NotificationService] Failed to notify of vendor featured:', error.message);
  }
}

/**
 * Notify vendor of incomplete profile (Email + Push + In-App)
 */
async function notifyOfVendorProfileIncomplete(userId, completionPercentage, incompleteSectionsHtml, dashboardUrl) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendVendorProfileIncomplete(user.Email, userName, completionPercentage, incompleteSectionsHtml, dashboardUrl || `${FRONTEND_URL}/dashboard`, userId);
    
    // Push
    await pushService.notifyVendorProfileIncomplete(userId, completionPercentage);
    
    // In-App
    await createInAppNotification(userId, 'vendor_profile_incomplete', 'Complete Your Profile', `Your profile is ${completionPercentage}% complete. Complete it to start receiving bookings.`);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of vendor profile incomplete:', error.message);
  }
}

/**
 * Notify user of support ticket opened (Email + Push + In-App)
 */
async function notifyOfSupportTicketOpened(userId, ticketId, ticketSubject, ticketCategory, dashboardUrl) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendSupportTicketOpened(user.Email, userName, ticketId, ticketSubject, ticketCategory, dashboardUrl || `${FRONTEND_URL}/dashboard?tab=support`, userId);
    
    // Push
    await pushService.notifySupportTicketOpened(userId, ticketId);
    
    // In-App
    await createInAppNotification(userId, 'support_ticket_opened', 'Support Ticket Created', `Your support ticket #${ticketId} has been created. We'll respond shortly.`);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of support ticket opened:', error.message);
  }
}

/**
 * Notify user of support ticket reply (Email + Push + In-App)
 */
async function notifyOfSupportTicketReply(userId, ticketId, ticketSubject, replyContent, dashboardUrl) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendSupportTicketReply(user.Email, userName, ticketId, ticketSubject, replyContent, dashboardUrl || `${FRONTEND_URL}/dashboard?tab=support`, userId);
    
    // Push
    await pushService.notifySupportTicketReply(userId, ticketId);
    
    // In-App
    await createInAppNotification(userId, 'support_ticket_reply', 'New Reply on Ticket', `You have a new reply on support ticket #${ticketId}.`);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of support ticket reply:', error.message);
  }
}

/**
 * Notify user of support ticket closed (Email + Push + In-App)
 */
async function notifyOfSupportTicketClosed(userId, ticketId, ticketSubject, resolution, dashboardUrl) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendSupportTicketClosed(user.Email, userName, ticketId, ticketSubject, resolution, dashboardUrl || `${FRONTEND_URL}/dashboard?tab=support`, userId);
    
    // Push
    await pushService.notifySupportTicketClosed(userId, ticketId);
    
    // In-App
    await createInAppNotification(userId, 'support_ticket_closed', 'Ticket Resolved', `Your support ticket #${ticketId} has been resolved.`);
  } catch (error) {
    console.error('[NotificationService] Failed to notify of support ticket closed:', error.message);
  }
}

/**
 * Notify user of account unlocked (Email + Push + In-App)
 */
async function notifyOfAccountUnlocked(userId, unlockReason) {
  try {
    const user = await getUserForNotification(userId);
    if (!user) return;
    const userName = user.FullName || 'there';
    
    // Email
    await sendAccountUnlockedEmail(user.Email, userName, unlockReason, userId);
    
    // Push
    await pushService.notifyAccountUnlocked(userId);
    
    // In-App
    await createInAppNotification(userId, 'account_unlocked', 'Account Unlocked', 'Your account has been unlocked. You can now access all features.');
  } catch (error) {
    console.error('[NotificationService] Failed to notify of account unlocked:', error.message);
  }
}

module.exports = {
  notifyVendorOfNewRequest,
  notifyClientOfApproval,
  notifyClientOfRejection,
  notifyOfNewMessage,
  notifyVendorOfPayment,
  notifyClientOfPayment,
  notifyOfBookingCancellation,
  notifyAdminOfVendorApplication,
  notifyOfBookingConfirmation,
  notifyVendorOfApproval,
  notifyVendorOfRejection,
  notifyClientOfRegistration,
  notifyClientToVendor,
  // New unified notification functions (Email + Push + In-App)
  notifyOfBookingRescheduled,
  notifyOfBookingReminder24h,
  notifyOfBookingReminder1Week,
  notifyOfEventReminder,
  notifyOfBookingActionReminder,
  notifyOfDepositDue,
  notifyOfFinalPaymentDue,
  notifyOfInvoiceReceived,
  notifyOfRefundProcessed,
  notifyOfPayoutProcessed,
  notifyOfPaymentFailed,
  notifyOfQuoteReceived,
  notifyOfNewReviewReceived,
  notifyOfReviewRequest,
  notifyOfVendorFeatured,
  notifyOfVendorProfileIncomplete,
  notifyOfSupportTicketOpened,
  notifyOfSupportTicketReply,
  notifyOfSupportTicketClosed,
  notifyOfAccountUnlocked
};
