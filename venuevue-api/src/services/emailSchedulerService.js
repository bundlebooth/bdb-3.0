/**
 * Email Scheduler Service
 * All database operations use stored procedures - no inline SQL.
 */

const { poolPromise, sql } = require('../config/db');
const { sendTemplatedEmail } = require('./email');

const REMINDER_INTERVALS = {
  EVENT_REMINDERS: [1, 3, 7],
  PENDING_APPROVAL_REMINDER: 1,
  PENDING_PAYMENT_REMINDER: 1
};

async function queueEmail(templateKey, recipientEmail, recipientName, variables, scheduledAt, userId, bookingId, emailCategory, priority, metadata) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('TemplateKey', sql.NVarChar(50), templateKey)
      .input('RecipientEmail', sql.NVarChar(255), recipientEmail)
      .input('RecipientName', sql.NVarChar(255), recipientName)
      .input('Variables', sql.NVarChar(sql.MAX), JSON.stringify(variables))
      .input('ScheduledAt', sql.DateTime2, scheduledAt)
      .input('Priority', sql.Int, priority || 5)
      .input('UserID', sql.Int, userId || null)
      .input('BookingID', sql.Int, bookingId || null)
      .input('EmailCategory', sql.NVarChar(50), emailCategory || null)
      .input('Metadata', sql.NVarChar(sql.MAX), metadata ? JSON.stringify(metadata) : null)
      .execute('admin.sp_QueueEmail');
    return result.recordset && result.recordset[0] ? result.recordset[0].QueueID : null;
  } catch (error) {
    console.error('[QUEUE] Error queuing email:', error.message);
    throw error;
  }
}

async function processEmailQueue() {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('BatchSize', sql.Int, 50)
      .execute('admin.sp_GetPendingEmails');
    const emails = result.recordset || [];
    if (emails.length === 0) return { processed: 0, sent: 0, failed: 0 };
    console.log('[QUEUE] Processing ' + emails.length + ' queued emails...');
    let sent = 0, failed = 0;
    for (const email of emails) {
      try {
        const variables = email.Variables ? JSON.parse(email.Variables) : {};
        await sendTemplatedEmail(email.TemplateKey, email.RecipientEmail, email.RecipientName, variables, email.UserID, email.BookingID, email.Metadata ? JSON.parse(email.Metadata) : null, email.EmailCategory);
        await pool.request().input('QueueID', sql.Int, email.QueueID).execute('admin.sp_MarkEmailSent');
        sent++;
      } catch (err) {
        await pool.request().input('QueueID', sql.Int, email.QueueID).input('ErrorMessage', sql.NVarChar(sql.MAX), err.message).execute('admin.sp_MarkEmailFailed');
        failed++;
      }
    }
    return { processed: emails.length, sent, failed };
  } catch (error) {
    console.error('[QUEUE] Error processing queue:', error.message);
    return { processed: 0, sent: 0, failed: 0 };
  }
}

async function getQueueStats() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('admin.sp_GetEmailQueueStats');
    return result.recordset || [];
  } catch (error) {
    console.error('[QUEUE] Error getting stats:', error.message);
    return [];
  }
}

async function getQueueItems(status, page, pageSize) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Status', sql.NVarChar(20), status || null)
      .input('PageNumber', sql.Int, page || 1)
      .input('PageSize', sql.Int, pageSize || 50)
      .execute('admin.sp_GetEmailQueueItems');
    return { items: result.recordsets[0] || [], total: result.recordsets[1] && result.recordsets[1][0] ? result.recordsets[1][0].TotalCount : 0 };
  } catch (error) {
    console.error('[QUEUE] Error getting items:', error.message);
    return { items: [], total: 0 };
  }
}

async function cancelQueuedEmail(queueId, cancelledBy, reason) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('QueueID', sql.Int, queueId)
      .input('CancelledBy', sql.Int, cancelledBy || null)
      .input('CancelReason', sql.NVarChar(500), reason || null)
      .execute('admin.sp_CancelQueuedEmail');
    return result.recordset && result.recordset[0] ? result.recordset[0].RowsAffected > 0 : false;
  } catch (error) {
    console.error('[QUEUE] Error cancelling email:', error.message);
    return false;
  }
}

async function queueUpcomingEventReminders() {
  try {
    const pool = await poolPromise;
    let queued = 0;
    for (const daysAhead of REMINDER_INTERVALS.EVENT_REMINDERS) {
      const result = await pool.request().input('DaysAhead', sql.Int, daysAhead).execute('admin.sp_GetUpcomingEventReminders');
      for (const booking of (result.recordset || [])) {
        const eventTime = booking.StartTime ? booking.StartTime + ' - ' + (booking.EndTime || '') : 'TBD';
        const daysText = daysAhead === 1 ? '1 day' : daysAhead + ' days';
        const eventDate = new Date(booking.EventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const scheduledAt = new Date(); scheduledAt.setHours(9, 0, 0, 0);
        await queueEmail('event_reminder', booking.ClientEmail, booking.ClientName, { recipientName: booking.ClientName, daysUntilEvent: daysText, serviceName: booking.ServiceName, eventDate, eventTime, location: booking.EventLocation || 'TBD', otherPartyLabel: 'Vendor', otherPartyName: booking.VendorName }, scheduledAt, booking.ClientUserID, booking.BookingID, 'bookingReminders', 3, { daysAhead });
        await queueEmail('event_reminder', booking.VendorEmail, booking.VendorName, { recipientName: booking.VendorName, daysUntilEvent: daysText, serviceName: booking.ServiceName, eventDate, eventTime, location: booking.EventLocation || 'TBD', otherPartyLabel: 'Client', otherPartyName: booking.ClientName }, scheduledAt, booking.VendorUserID, booking.BookingID, 'bookingReminders', 3, { daysAhead });
        queued += 2;
      }
    }
    if (queued > 0) console.log('[SCHEDULER] Queued ' + queued + ' event reminders');
    return queued;
  } catch (error) {
    console.error('[SCHEDULER] Error queuing event reminders:', error.message);
    return 0;
  }
}

async function sendPendingApprovalReminders() {
  try {
    const pool = await poolPromise;
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.planbeau.com';
    const result = await pool.request().input('DaysOld', sql.Int, REMINDER_INTERVALS.PENDING_APPROVAL_REMINDER).execute('admin.sp_GetPendingApprovalReminders');
    for (const booking of (result.recordset || [])) {
      try {
        await sendTemplatedEmail('booking_action_reminder', booking.VendorEmail, booking.VendorName, { recipientName: booking.VendorName, actionMessage: 'You have a pending booking request from ' + booking.ClientName + ' that requires your response.', actionSubject: 'Pending Booking Request', serviceName: booking.ServiceName, eventDate: new Date(booking.EventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), otherPartyLabel: 'Client', otherPartyName: booking.ClientName, actionUrl: frontendUrl + '/dashboard?tab=bookings', actionButtonText: 'Review Request' }, booking.VendorUserID, booking.BookingID);
        console.log('[SCHEDULER] Sent pending approval reminder for booking ' + booking.BookingID);
      } catch (err) { console.error('Failed to send approval reminder:', err.message); }
    }
  } catch (error) { console.error('[SCHEDULER] Error sending pending approval reminders:', error.message); }
}

async function sendPendingPaymentReminders() {
  try {
    const pool = await poolPromise;
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.planbeau.com';
    const result = await pool.request().input('DaysOld', sql.Int, REMINDER_INTERVALS.PENDING_PAYMENT_REMINDER).execute('admin.sp_GetPendingPaymentReminders');
    for (const booking of (result.recordset || [])) {
      try {
        await sendTemplatedEmail('booking_action_reminder', booking.ClientEmail, booking.ClientName, { recipientName: booking.ClientName, actionMessage: 'Your booking with ' + booking.VendorName + ' has been accepted! Complete your payment to confirm.', actionSubject: 'Payment Required', serviceName: booking.ServiceName, eventDate: new Date(booking.EventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), otherPartyLabel: 'Vendor', otherPartyName: booking.VendorName, actionUrl: frontendUrl + '/dashboard?tab=bookings', actionButtonText: 'Complete Payment' }, booking.ClientUserID, booking.BookingID);
        console.log('[SCHEDULER] Sent pending payment reminder for booking ' + booking.BookingID);
      } catch (err) { console.error('Failed to send payment reminder:', err.message); }
    }
  } catch (error) { console.error('[SCHEDULER] Error sending pending payment reminders:', error.message); }
}

/**
 * Send review request emails the morning after the event date
 * Only sends to clients who have completed (paid) bookings where the event has passed
 */
async function sendPostEventReviewRequests() {
  try {
    const pool = await poolPromise;
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.planbeau.com';
    const platformName = process.env.PLATFORM_NAME || 'Planbeau';
    
    // Get bookings where event was yesterday and payment is complete
    const result = await pool.request().execute('admin.sp_GetPostEventReviewRequests');
    const bookings = result.recordset || [];
    
    if (bookings.length === 0) {
      console.log('[SCHEDULER] No post-event review requests to send');
      return 0;
    }
    
    let sent = 0;
    for (const booking of bookings) {
      try {
        const eventDate = new Date(booking.EventDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        const reviewUrl = `${frontendUrl}/review/${booking.BookingID}`;
        
        await sendTemplatedEmail(
          'review_request',
          booking.ClientEmail,
          booking.ClientName,
          {
            clientName: booking.ClientName,
            vendorName: booking.VendorName,
            serviceName: booking.ServiceName || 'Service',
            eventDate: eventDate,
            reviewUrl: reviewUrl,
            platformName: platformName,
            platformUrl: frontendUrl
          },
          booking.ClientUserID,
          booking.BookingID,
          null,
          'reviewRequests'
        );
        
        console.log('[SCHEDULER] Sent review request for booking ' + booking.BookingID + ' to ' + booking.ClientEmail);
        sent++;
      } catch (err) {
        console.error('[SCHEDULER] Failed to send review request for booking ' + booking.BookingID + ':', err.message);
      }
    }
    
    console.log('[SCHEDULER] Sent ' + sent + ' post-event review requests');
    return sent;
  } catch (error) {
    console.error('[SCHEDULER] Error sending post-event review requests:', error.message);
    return 0;
  }
}

async function runScheduledEmails() {
  console.log('[SCHEDULER] Running scheduled email tasks...');
  await queueUpcomingEventReminders();
  await sendPendingApprovalReminders();
  await sendPendingPaymentReminders();
  await sendPostEventReviewRequests();
  const result = await processEmailQueue();
  console.log('[SCHEDULER] Queue processed: ' + result.sent + ' sent, ' + result.failed + ' failed');
}

function startEmailScheduler() {
  console.log('[SCHEDULER] Email scheduler initialized');
  if (process.env.RUN_SCHEDULER_ON_STARTUP === 'true') { setTimeout(runScheduledEmails, 5000); }
  const scheduleHour = parseInt(process.env.SCHEDULER_HOUR || '9', 10);
  const now = new Date();
  let nextRun = new Date(now);
  nextRun.setHours(scheduleHour, 0, 0, 0);
  if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);
  console.log('[SCHEDULER] Email scheduler will run at ' + nextRun.toLocaleString());
  setTimeout(function() { runScheduledEmails(); setInterval(runScheduledEmails, 24 * 60 * 60 * 1000); }, nextRun - now);
  setInterval(processEmailQueue, 5 * 60 * 1000);
}

module.exports = { queueEmail, processEmailQueue, getQueueStats, getQueueItems, cancelQueuedEmail, runScheduledEmails, startEmailScheduler, queueUpcomingEventReminders, sendPendingApprovalReminders, sendPendingPaymentReminders, sendPostEventReviewRequests };
