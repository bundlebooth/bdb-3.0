/**
 * Unified Notification Service
 * 
 * Sends notifications across all configured channels (email, in-app, push)
 * for a given notification type.
 * 
 * Usage:
 *   const notificationService = require('./services/unifiedNotificationService');
 *   const NotificationTypes = require('./services/notificationTypes');
 *   
 *   await notificationService.send(NotificationTypes.BOOKING_REQUEST, userId, {
 *     clientName: 'John Doe',
 *     eventDate: 'March 15, 2026',
 *     relatedId: bookingId,
 *     relatedType: 'booking',
 *     actionUrl: '/vendor/bookings/123'
 *   });
 */

const sql = require('mssql');
const webpush = require('web-push');
const NotificationConfig = require('./notificationConfig');

// VAPID keys for push notifications - should be moved to environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@planbeau.com';

// Configure web-push if VAPID keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Base URL for icons
const ICON_BASE_URL = process.env.ICON_BASE_URL || 'https://www.planbeau.com/images/planbeau-platform-assets/icons/notification/';

class UnifiedNotificationService {
  constructor() {
    this.pool = null;
  }

  /**
   * Get database connection pool
   */
  async getPool() {
    if (!this.pool) {
      const { poolPromise } = require('../config/db');
      this.pool = await poolPromise;
    }
    return this.pool;
  }

  /**
   * Send notification across all configured channels
   * @param {string} type - Notification type from NotificationTypes
   * @param {number} userId - Target user ID
   * @param {object} data - Variable data for templates
   * @param {object} options - Override options (channels, skipEmail, etc.)
   * @returns {object} Results from each channel
   */
  async send(type, userId, data = {}, options = {}) {
    const config = NotificationConfig[type];
    
    if (!config) {
      console.error(`[UnifiedNotificationService] Unknown notification type: ${type}`);
      return { success: false, error: `Unknown notification type: ${type}` };
    }

    const channels = options.channels || config.channels || [];
    const results = {
      type,
      userId,
      channels: {},
      success: true,
    };

    try {
      // Get user info for email
      const userInfo = await this.getUserInfo(userId);
      if (!userInfo) {
        console.error(`[UnifiedNotificationService] User not found: ${userId}`);
        return { success: false, error: `User not found: ${userId}` };
      }

      // Merge user info into data
      const mergedData = {
        ...data,
        userName: userInfo.FirstName || userInfo.Username,
        userEmail: userInfo.Email,
        platformName: 'PlanBeau',
        platformUrl: 'https://www.planbeau.com',
        currentYear: new Date().getFullYear().toString(),
      };

      // 1. Send Email
      if (channels.includes('email') && config.emailTemplate && !options.skipEmail) {
        try {
          results.channels.email = await this.sendEmail(config.emailTemplate, userInfo.Email, mergedData);
        } catch (err) {
          console.error(`[UnifiedNotificationService] Email failed:`, err.message);
          results.channels.email = { success: false, error: err.message };
        }
      }

      // 2. Create In-App Notification
      if (channels.includes('notification') && config.inAppTitle && !options.skipNotification) {
        try {
          results.channels.notification = await this.createNotification(type, userId, mergedData, config);
        } catch (err) {
          console.error(`[UnifiedNotificationService] Notification failed:`, err.message);
          results.channels.notification = { success: false, error: err.message };
        }
      }

      // 3. Send Push Notification
      if (channels.includes('push') && config.pushTitle && !options.skipPush) {
        try {
          results.channels.push = await this.sendPush(userId, mergedData, config);
        } catch (err) {
          console.error(`[UnifiedNotificationService] Push failed:`, err.message);
          results.channels.push = { success: false, error: err.message };
        }
      }

    } catch (err) {
      console.error(`[UnifiedNotificationService] Error:`, err.message);
      results.success = false;
      results.error = err.message;
    }

    return results;
  }

  /**
   * Get user info by ID
   */
  async getUserInfo(userId) {
    try {
      const pool = await this.getPool();
      const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .execute('[users].[sp_User_GetById]');
      return result.recordset[0] || null;
    } catch (err) {
      console.error(`[UnifiedNotificationService] getUserInfo error:`, err.message);
      return null;
    }
  }

  /**
   * Send email via Brevo API
   */
  async sendEmail(templateKey, toEmail, data) {
    if (!BREVO_API_KEY) {
      console.warn('[UnifiedNotificationService] BREVO_API_KEY not configured, skipping email');
      return { success: false, error: 'BREVO_API_KEY not configured' };
    }

    try {
      const pool = await this.getPool();
      
      // Get email template from database
      const templateResult = await pool.request()
        .input('TemplateKey', sql.NVarChar, templateKey)
        .execute('[admin].[sp_EmailTemplate_GetByKey]');

      if (templateResult.recordset.length === 0) {
        return { success: false, error: `Email template not found: ${templateKey}` };
      }

      const template = templateResult.recordset[0];
      
      // Build HTML and text content
      const html = this.replaceVariables(
        (template.HeaderHtml || '') + (template.BodyHtml || '') + (template.FooterHtml || ''),
        data
      );
      const text = this.replaceVariables(
        (template.HeaderText || '') + '\n' + (template.BodyText || '') + '\n' + (template.FooterText || ''),
        data
      );
      const subject = this.replaceVariables(template.Subject || template.TemplateName, data);

      // Send via Brevo API
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'PlanBeau', email: 'notifications@planbeau.com' },
          to: [{ email: toEmail }],
          subject: subject,
          htmlContent: html,
          textContent: text
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Brevo API error: ${response.status} - ${err.message || 'Unknown'}`);
      }

      return { success: true, templateKey, subject };
    } catch (err) {
      console.error(`[UnifiedNotificationService] sendEmail error:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Create in-app notification
   */
  async createNotification(type, userId, data, config) {
    try {
      const pool = await this.getPool();
      
      const title = this.replaceVariables(config.inAppTitle, data);
      const message = this.replaceVariables(config.inAppMessage, data);

      const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .input('Title', sql.NVarChar(255), title)
        .input('Message', sql.NVarChar(sql.MAX), message)
        .input('Type', sql.NVarChar(50), type)
        .input('IconType', sql.NVarChar(100), config.icon || null)
        .input('RelatedID', sql.Int, data.relatedId || null)
        .input('RelatedType', sql.NVarChar(50), data.relatedType || null)
        .input('ActionURL', sql.NVarChar(500), data.actionUrl || null)
        .execute('[notifications].[sp_Notification_CreateUnified]');

      const notificationId = result.recordset[0]?.NotificationID;
      return { success: true, notificationId, title, message };
    } catch (err) {
      console.error(`[UnifiedNotificationService] createNotification error:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send push notification
   */
  async sendPush(userId, data, config) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.warn('[UnifiedNotificationService] VAPID keys not configured, skipping push');
      return { success: false, error: 'VAPID keys not configured', sent: 0 };
    }

    try {
      const pool = await this.getPool();
      
      // Get user's push subscriptions
      const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .execute('[users].[sp_PushSubscription_GetActiveByUser]');

      if (result.recordset.length === 0) {
        return { success: true, sent: 0, message: 'No active push subscriptions' };
      }

      const title = this.replaceVariables(config.pushTitle, data);
      const body = this.replaceVariables(config.pushBody, data);
      const iconUrl = ICON_BASE_URL + config.icon;

      const payload = JSON.stringify({
        title,
        body,
        icon: iconUrl,
        badge: '/images/planbeau-platform-assets/branding/badge-72.png',
        data: {
          url: data.actionUrl || '/dashboard',
          type: config.type,
        }
      });

      let sent = 0;
      let failed = 0;
      
      for (const sub of result.recordset) {
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
          console.error(`[UnifiedNotificationService] Push to ${sub.SubscriptionID} failed:`, err.message);
          failed++;
          
          // Mark subscription as inactive if expired (410 Gone)
          if (err.statusCode === 410) {
            await this.deactivateSubscription(sub.SubscriptionID);
          }
        }
      }

      return { success: true, sent, failed, total: result.recordset.length };
    } catch (err) {
      console.error(`[UnifiedNotificationService] sendPush error:`, err.message);
      return { success: false, error: err.message, sent: 0 };
    }
  }

  /**
   * Deactivate expired push subscription
   */
  async deactivateSubscription(subscriptionId) {
    try {
      const pool = await this.getPool();
      await pool.request()
        .input('SubscriptionID', sql.Int, subscriptionId)
        .execute('[users].[sp_PushSubscription_DeactivateById]');
    } catch (err) {
      console.error(`[UnifiedNotificationService] deactivateSubscription error:`, err.message);
    }
  }

  /**
   * Replace {{variable}} placeholders in template
   */
  replaceVariables(template, data) {
    if (!template) return template;
    
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value != null ? String(value) : '');
    }
    return result;
  }

  /**
   * Send notification to multiple users
   */
  async sendToMany(type, userIds, data = {}, options = {}) {
    const results = [];
    for (const userId of userIds) {
      const result = await this.send(type, userId, data, options);
      results.push({ userId, ...result });
    }
    return results;
  }

  /**
   * Send notification to all users with a specific role
   */
  async sendToRole(type, role, data = {}, options = {}) {
    try {
      const pool = await this.getPool();
      const result = await pool.request()
        .input('IsVendor', sql.Bit, role === 'vendor' ? 1 : null)
        .input('IsAdmin', sql.Bit, role === 'admin' ? 1 : null)
        .execute('[users].[sp_User_GetByRole]');
      
      const userIds = result.recordset.map(r => r.UserID);
      return await this.sendToMany(type, userIds, data, options);
    } catch (err) {
      console.error(`[UnifiedNotificationService] sendToRole error:`, err.message);
      return { success: false, error: err.message };
    }
  }
}

// Export singleton instance
module.exports = new UnifiedNotificationService();
