/**
 * Push Notification Service
 * Handles web push notifications using VAPID and stored procedures
 */

const webpush = require('web-push');
const { sql, poolPromise } = require('../config/db');

// VAPID configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@planbeau.com';

// Configure web-push if VAPID keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[PushService] VAPID configured successfully');
} else {
  console.warn('[PushService] VAPID keys not configured - push notifications disabled');
}

// Icon base URL for notifications
const ICON_BASE_URL = process.env.ICON_BASE_URL || 'https://www.planbeau.com/images/planbeau-platform-assets/icons/notification/';

class PushNotificationService {
  
  /**
   * Get VAPID public key for client subscription
   */
  getVapidPublicKey() {
    return VAPID_PUBLIC_KEY || null;
  }

  /**
   * Save push subscription for a user
   */
  async saveSubscription(userId, subscription) {
    try {
      const pool = await poolPromise;
      
      const endpoint = subscription.endpoint;
      const p256dhKey = subscription.keys?.p256dh || '';
      const authKey = subscription.keys?.auth || '';
      
      const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .input('Endpoint', sql.NVarChar(500), endpoint)
        .input('P256dhKey', sql.NVarChar(500), p256dhKey)
        .input('AuthKey', sql.NVarChar(500), authKey)
        .input('Subscription', sql.NVarChar(sql.MAX), JSON.stringify(subscription))
        .input('DeviceName', sql.NVarChar(255), null)
        .execute('[users].[sp_PushSubscription_Upsert]');
      
      const subscriptionResult = result.recordset[0];
      
      return {
        success: true,
        subscriptionId: subscriptionResult?.SubscriptionID,
        action: subscriptionResult?.Action || 'created'
      };
    } catch (error) {
      console.error('[PushService] saveSubscription error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove/deactivate push subscription
   */
  async removeSubscription(userId, endpoint) {
    try {
      const pool = await poolPromise;
      
      if (endpoint) {
        await pool.request()
          .input('UserID', sql.Int, userId)
          .input('Endpoint', sql.NVarChar(500), endpoint)
          .execute('[users].[sp_PushSubscription_Deactivate]');
      }
      
      return { success: true, message: 'Subscription removed' };
    } catch (error) {
      console.error('[PushService] removeSubscription error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all active subscriptions for a user
   */
  async getSubscriptions(userId) {
    try {
      const pool = await poolPromise;
      
      const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .execute('[users].[sp_PushSubscription_GetActiveByUser]');
      
      return result.recordset;
    } catch (error) {
      console.error('[PushService] getSubscriptions error:', error.message);
      return [];
    }
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId, notification) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return { success: false, error: 'VAPID keys not configured', sent: 0 };
    }

    try {
      const subscriptions = await this.getSubscriptions(userId);
      
      if (subscriptions.length === 0) {
        return { success: true, sent: 0, message: 'No active subscriptions' };
      }

      const payload = JSON.stringify({
        title: notification.title || 'PlanBeau Notification',
        body: notification.body || '',
        icon: notification.icon || ICON_BASE_URL + 'notif-general.svg',
        badge: '/images/planbeau-platform-assets/branding/badge-72.png',
        data: {
          url: notification.url || '/dashboard',
          type: notification.type || 'general'
        }
      });

      let sent = 0;
      let failed = 0;

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification({
            endpoint: sub.Endpoint,
            keys: {
              p256dh: sub.P256dhKey,
              auth: sub.AuthKey
            }
          }, payload);
          sent++;
        } catch (err) {
          console.error(`[PushService] Push to subscription ${sub.SubscriptionID} failed:`, err.message);
          failed++;
          
          // Deactivate expired subscriptions (410 Gone)
          if (err.statusCode === 410) {
            await this.deactivateSubscriptionById(sub.SubscriptionID);
          }
        }
      }

      return { success: true, sent, failed, total: subscriptions.length };
    } catch (error) {
      console.error('[PushService] sendToUser error:', error.message);
      return { success: false, error: error.message, sent: 0 };
    }
  }

  /**
   * Deactivate subscription by ID (for expired subscriptions)
   */
  async deactivateSubscriptionById(subscriptionId) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input('SubscriptionID', sql.Int, subscriptionId)
        .execute('[users].[sp_PushSubscription_DeactivateById]');
    } catch (error) {
      console.error('[PushService] deactivateSubscriptionById error:', error.message);
    }
  }

  /**
   * Send push notification with unified icon
   */
  async sendWithIcon(userId, type, title, body, url) {
    const NotificationConfig = require('./notificationConfig');
    const config = NotificationConfig[type] || {};
    
    return await this.sendToUser(userId, {
      title,
      body,
      icon: config.icon ? ICON_BASE_URL + config.icon : undefined,
      url,
      type
    });
  }

  // ============================================
  // BOOKING & EVENT NOTIFICATIONS
  // ============================================

  /**
   * Notify user of booking rescheduled
   */
  async notifyBookingRescheduled(userId, serviceName, newDate) {
    return await this.sendWithIcon(userId, 'booking_rescheduled', 
      'Booking Rescheduled', 
      `Your booking for ${serviceName} has been rescheduled to ${newDate}`,
      '/dashboard?tab=bookings'
    );
  }

  /**
   * Notify user of 24h booking reminder
   */
  async notifyBookingReminder24h(userId, vendorName, serviceName) {
    return await this.sendWithIcon(userId, 'booking_reminder_24h',
      'Event Tomorrow!',
      `Your event with ${vendorName} is tomorrow`,
      '/dashboard?tab=bookings'
    );
  }

  /**
   * Notify user of 1 week booking reminder
   */
  async notifyBookingReminder1Week(userId, vendorName, serviceName) {
    return await this.sendWithIcon(userId, 'booking_reminder_1_week',
      'Event in 1 Week',
      `Your event with ${vendorName} is in 1 week`,
      '/dashboard?tab=bookings'
    );
  }

  /**
   * Notify user of event reminder
   */
  async notifyEventReminder(userId, serviceName, daysUntilEvent) {
    return await this.sendWithIcon(userId, 'event_reminder',
      'Event Reminder',
      `Your event for ${serviceName} is in ${daysUntilEvent}`,
      '/dashboard?tab=bookings'
    );
  }

  /**
   * Notify user of booking action required
   */
  async notifyBookingActionReminder(userId, actionSubject) {
    return await this.sendWithIcon(userId, 'booking_action_reminder',
      'Action Required',
      actionSubject,
      '/dashboard?tab=bookings'
    );
  }

  /**
   * Notify user of deposit due
   */
  async notifyDepositDue(userId, vendorName, depositAmount, dueDate) {
    return await this.sendWithIcon(userId, 'deposit_due',
      'Deposit Due',
      `Deposit of ${depositAmount} due for your booking with ${vendorName}`,
      '/dashboard?tab=bookings'
    );
  }

  /**
   * Notify user of final payment due
   */
  async notifyFinalPaymentDue(userId, vendorName, amountDue, dueDate) {
    return await this.sendWithIcon(userId, 'final_payment_due',
      'Final Payment Due',
      `Final payment of ${amountDue} due for your event with ${vendorName}`,
      '/dashboard?tab=bookings'
    );
  }

  // ============================================
  // PAYMENT & FINANCIAL NOTIFICATIONS
  // ============================================

  /**
   * Notify user of invoice received
   */
  async notifyInvoiceReceived(userId, vendorName, amount) {
    return await this.sendWithIcon(userId, 'invoice_sent',
      'Invoice Received',
      `New invoice from ${vendorName} for ${amount}`,
      '/dashboard?tab=bookings'
    );
  }

  /**
   * Notify user of refund processed
   */
  async notifyRefundProcessed(userId, refundAmount, serviceName) {
    return await this.sendWithIcon(userId, 'refund_processed',
      'Refund Processed',
      `Your refund of ${refundAmount} for ${serviceName} has been processed`,
      '/dashboard?tab=bookings'
    );
  }

  /**
   * Notify vendor of payout processed
   */
  async notifyPayoutProcessed(userId, payoutAmount) {
    return await this.sendWithIcon(userId, 'payout_processed',
      'Payout Sent',
      `Your payout of ${payoutAmount} is on its way`,
      '/dashboard?tab=earnings'
    );
  }

  /**
   * Notify user of payment failed
   */
  async notifyPaymentFailed(userId, vendorName) {
    return await this.sendWithIcon(userId, 'payment_failed',
      'Payment Failed',
      `Your payment to ${vendorName} could not be processed`,
      '/dashboard?tab=bookings'
    );
  }

  /**
   * Notify user of quote received
   */
  async notifyQuoteReceived(userId, vendorName, quoteAmount) {
    return await this.sendWithIcon(userId, 'quote_received',
      'New Quote',
      `New quote from ${vendorName} for ${quoteAmount}`,
      '/dashboard?tab=bookings'
    );
  }

  // ============================================
  // REVIEW NOTIFICATIONS
  // ============================================

  /**
   * Notify vendor of new review received
   */
  async notifyNewReviewReceived(userId, clientName, rating) {
    return await this.sendWithIcon(userId, 'new_review',
      'New Review!',
      `${clientName} left you a ${rating}-star review`,
      '/dashboard?tab=reviews'
    );
  }

  /**
   * Notify client to leave a review
   */
  async notifyReviewRequest(userId, vendorName) {
    return await this.sendWithIcon(userId, 'review_request',
      'Share Your Experience',
      `How was your experience with ${vendorName}?`,
      '/dashboard?tab=bookings'
    );
  }

  // ============================================
  // VENDOR STATUS NOTIFICATIONS
  // ============================================

  /**
   * Notify vendor of profile approval
   */
  async notifyVendorApproved(userId, businessName) {
    return await this.sendWithIcon(userId, 'vendor_approved',
      'Profile Approved!',
      `Your vendor profile for ${businessName} has been approved`,
      '/dashboard'
    );
  }

  /**
   * Notify vendor of profile rejection
   */
  async notifyVendorRejected(userId) {
    return await this.sendWithIcon(userId, 'vendor_rejected',
      'Profile Review Update',
      'Your vendor profile needs attention',
      '/dashboard'
    );
  }

  /**
   * Notify vendor of being featured
   */
  async notifyVendorFeatured(userId) {
    return await this.sendWithIcon(userId, 'vendor_featured',
      "You're Featured!",
      'Congratulations! You are now a featured vendor',
      '/dashboard'
    );
  }

  /**
   * Notify vendor of incomplete profile
   */
  async notifyVendorProfileIncomplete(userId, completionPercentage) {
    return await this.sendWithIcon(userId, 'vendor_profile_incomplete',
      'Complete Your Profile',
      `Your profile is ${completionPercentage}% complete`,
      '/dashboard'
    );
  }

  // ============================================
  // SUPPORT NOTIFICATIONS
  // ============================================

  /**
   * Notify user of support ticket opened
   */
  async notifySupportTicketOpened(userId, ticketId) {
    return await this.sendWithIcon(userId, 'support_ticket_opened',
      'Ticket Received',
      `Support ticket #${ticketId} has been created`,
      '/dashboard?tab=support'
    );
  }

  /**
   * Notify user of support ticket reply
   */
  async notifySupportTicketReply(userId, ticketId) {
    return await this.sendWithIcon(userId, 'support_ticket_reply',
      'New Reply',
      `New reply on ticket #${ticketId}`,
      '/dashboard?tab=support'
    );
  }

  /**
   * Notify user of support ticket closed
   */
  async notifySupportTicketClosed(userId, ticketId) {
    return await this.sendWithIcon(userId, 'support_ticket_closed',
      'Ticket Resolved',
      `Support ticket #${ticketId} has been resolved`,
      '/dashboard?tab=support'
    );
  }

  // ============================================
  // ACCOUNT NOTIFICATIONS
  // ============================================

  /**
   * Notify user of account unlocked
   */
  async notifyAccountUnlocked(userId) {
    return await this.sendWithIcon(userId, 'account_unlocked',
      'Account Unlocked',
      'Your account has been unlocked',
      '/dashboard'
    );
  }

  // ============================================
  // EXISTING METHODS (for reference - already in emailService.js)
  // ============================================

  /**
   * Notify vendor of new booking request
   */
  async notifyNewBookingRequest(userId, clientName, serviceName) {
    return await this.sendWithIcon(userId, 'booking_request',
      'New Booking Request',
      `You have a new booking request from ${clientName}`,
      '/dashboard?tab=bookings'
    );
  }

  /**
   * Notify user of booking status update
   */
  async notifyBookingUpdate(userId, status, vendorName) {
    const titles = {
      'accepted': 'Booking Approved!',
      'rejected': 'Booking Update',
      'cancelled': 'Booking Cancelled'
    };
    const bodies = {
      'accepted': `${vendorName} accepted your booking`,
      'rejected': `${vendorName} could not accept your booking`,
      'cancelled': `Your booking with ${vendorName} has been cancelled`
    };
    return await this.sendWithIcon(userId, `booking_${status}`,
      titles[status] || 'Booking Update',
      bodies[status] || 'Your booking has been updated',
      '/dashboard?tab=bookings'
    );
  }

  /**
   * Notify user of new message
   */
  async notifyNewMessage(userId, senderName, messagePreview) {
    const preview = messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview;
    return await this.sendWithIcon(userId, 'message',
      'New Message',
      `${senderName}: ${preview}`,
      '/dashboard?tab=messages'
    );
  }

  /**
   * Notify vendor of payment received
   */
  async notifyPaymentReceived(userId, amount, clientName) {
    return await this.sendWithIcon(userId, 'payment_received',
      'Payment Received',
      `You received ${amount} from ${clientName}`,
      '/dashboard?tab=earnings'
    );
  }
}

module.exports = new PushNotificationService();
