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

// Icon base URL for notifications - use email-icons for consistency across all channels
const ICON_BASE_URL = process.env.ICON_BASE_URL || 'https://www.planbeau.com/images/email-icons/';

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
}

module.exports = new PushNotificationService();
