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
  sendVendorRejected
} = require('./email');
const { generateInvoicePDF, formatInvoiceData } = require('./invoiceService');
const pushService = require('./pushNotificationService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

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
      `${FRONTEND_URL}/dashboard`,
      data.VendorUserID,
      null
    );
    
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
      `${FRONTEND_URL}/dashboard`,
      data.UserID,
      null
    );
    
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
      // Vendor sending to client
      await sendMessageFromVendor(
        conv.ClientEmail,
        conv.ClientName,
        conv.VendorName,
        messagePreview,
        dashboardUrl,
        conv.UserID
      );
      
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
    
    // Generate invoice PDF
    let invoiceAttachment = null;
    try {
      const invoiceData = formatInvoiceData({
        bookingId,
        vendorName: data.VendorName,
        vendorEmail: data.VendorEmail,
        vendorPhone: data.VendorPhone || '',
        clientName: data.ClientName,
        clientEmail: data.ClientEmail,
        clientPhone: data.ClientPhone || '',
        serviceName: data.ServiceName,
        eventDate,
        eventLocation: data.EventLocation || '',
        amount: totalAmount,
        taxRate: 0.13,
        transactionId: transactionId || `TXN-${bookingId}-${Date.now()}`
      });
      
      const pdfBuffer = await generateInvoicePDF(invoiceData);
      invoiceAttachment = {
        name: `Invoice-${invoiceData.invoiceNumber}.pdf`,
        content: pdfBuffer.toString('base64')
      };
      console.log(`[NotificationService] Generated invoice PDF: ${invoiceAttachment.name}`);
    } catch (pdfError) {
      console.error('[NotificationService] Failed to generate invoice PDF:', pdfError.message);
      // Continue without attachment
    }
    
    await sendPaymentReceivedToVendor(
      data.VendorEmail,
      data.VendorName,
      data.ClientName,
      amount,
      data.ServiceName,
      eventDate,
      `${FRONTEND_URL}/dashboard`,
      data.VendorUserID,
      bookingId,
      invoiceAttachment
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
        `${FRONTEND_URL}/dashboard`,
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
    
    // Generate invoice PDF for client
    let invoiceAttachment = null;
    try {
      const invoiceData = formatInvoiceData({
        bookingId,
        vendorName: data.VendorName,
        vendorEmail: data.VendorEmail,
        vendorPhone: data.VendorPhone || '',
        clientName: data.ClientName,
        clientEmail: data.ClientEmail,
        clientPhone: data.ClientPhone || '',
        serviceName: data.ServiceName || 'Service',
        eventDate,
        eventLocation: data.EventLocation || '',
        amount: totalAmount,
        taxRate: 0.13,
        transactionId: transactionId || `TXN-${bookingId}-${Date.now()}`
      });
      
      const pdfBuffer = await generateInvoicePDF(invoiceData);
      invoiceAttachment = {
        name: `Invoice-${invoiceData.invoiceNumber}.pdf`,
        content: pdfBuffer.toString('base64')
      };
      console.log(`[NotificationService] Generated invoice PDF for client: ${invoiceAttachment.name}`);
    } catch (pdfError) {
      console.error('[NotificationService] Failed to generate invoice PDF for client:', pdfError.message);
      // Continue without attachment
    }
    
    await sendPaymentConfirmationToClient(
      data.ClientEmail,
      data.ClientName,
      data.VendorName,
      amount,
      data.ServiceName || 'Service',
      eventDate,
      `${FRONTEND_URL}/dashboard`,
      data.ClientUserID,
      bookingId,
      invoiceAttachment
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
    
    // Get applicant details
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .execute('email.sp_GetUserForVendorApplication');
    
    let applicantName = 'New Applicant';
    let applicantEmail = '';
    
    if (result.recordset.length > 0) {
      applicantName = result.recordset[0].Name || 'New Applicant';
      applicantEmail = result.recordset[0].Email || '';
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
      await sendVendorWelcome(
        applicantEmail,
        applicantName,
        businessDetails.businessName || 'Your Business',
        `${FRONTEND_URL}/become-a-vendor`,
        userId
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
      `${FRONTEND_URL}/dashboard`,
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
      `${FRONTEND_URL}/dashboard`,
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
    
    await sendVendorApproved(
      data.Email,
      vendorName,
      businessName,
      `${FRONTEND_URL}/dashboard`,
      data.UserID
    );
    console.log(`[NotificationService] Vendor approval email sent successfully to ${data.Email}`);
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
    
    await sendVendorRejected(
      data.Email,
      vendorName,
      businessName,
      rejectionReason || 'Your profile did not meet our requirements.',
      `${FRONTEND_URL}/become-a-vendor`,
      data.UserID
    );
    console.log(`[NotificationService] Vendor rejection email sent successfully to ${data.Email}`);
  } catch (error) {
    console.error('[NotificationService] Failed to notify vendor of rejection:', error.message);
    console.error('[NotificationService] Full error:', error);
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
  notifyVendorOfRejection
};
