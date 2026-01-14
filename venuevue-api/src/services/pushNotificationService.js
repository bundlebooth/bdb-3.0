/**
 * Push Notification Service
 * Handles server-side push notification sending via Web Push
 */

const webpush = require('web-push');
const { poolPromise, sql } = require('../config/db');
require('dotenv').config();

// Initialize web-push with VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

// Only configure if keys exist
if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    `mailto:${process.env.ADMIN_EMAIL || 'admin@planbeau.com'}`,
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log('[PushService] Web Push configured with VAPID keys');
} else {
  console.warn('[PushService] VAPID keys not configured - push notifications disabled');
}

/**
 * Save push subscription for a user
 */
async function saveSubscription(userId, subscription) {
  try {
    const pool = await poolPromise;
    
    // Store subscription as JSON in user record or separate table
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('subscription', sql.NVarChar(sql.MAX), JSON.stringify(subscription))
      .input('endpoint', sql.NVarChar(500), subscription.endpoint)
      .query(`
        MERGE users.PushSubscriptions AS target
        USING (SELECT @userId AS UserID, @endpoint AS Endpoint) AS source
        ON target.UserID = source.UserID AND target.Endpoint = source.Endpoint
        WHEN MATCHED THEN
          UPDATE SET Subscription = @subscription, UpdatedAt = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (UserID, Endpoint, Subscription, CreatedAt, UpdatedAt)
          VALUES (@userId, @endpoint, @subscription, GETDATE(), GETDATE());
      `);
    
    console.log(`[PushService] Saved subscription for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('[PushService] Failed to save subscription:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Remove push subscription for a user
 */
async function removeSubscription(userId, endpoint = null) {
  try {
    const pool = await poolPromise;
    
    if (endpoint) {
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('endpoint', sql.NVarChar(500), endpoint)
        .query('DELETE FROM users.PushSubscriptions WHERE UserID = @userId AND Endpoint = @endpoint');
    } else {
      await pool.request()
        .input('userId', sql.Int, userId)
        .query('DELETE FROM users.PushSubscriptions WHERE UserID = @userId');
    }
    
    console.log(`[PushService] Removed subscription(s) for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('[PushService] Failed to remove subscription:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get all subscriptions for a user
 */
async function getSubscriptions(userId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT Subscription FROM users.PushSubscriptions WHERE UserID = @userId');
    
    return result.recordset.map(row => JSON.parse(row.Subscription));
  } catch (error) {
    console.error('[PushService] Failed to get subscriptions:', error.message);
    return [];
  }
}

/**
 * Send push notification to a specific user
 */
async function sendToUser(userId, payload) {
  if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    console.warn('[PushService] Cannot send push - VAPID keys not configured');
    return { success: false, error: 'Push notifications not configured' };
  }
  
  try {
    const subscriptions = await getSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      console.log(`[PushService] No subscriptions found for user ${userId}`);
      return { success: false, error: 'No subscriptions found' };
    }
    
    const notificationPayload = JSON.stringify({
      title: payload.title || 'PlanBeau',
      body: payload.body || payload.message,
      url: payload.url || '/',
      tag: payload.tag || 'planbeau-notification',
      ...payload
    });
    
    const results = await Promise.allSettled(
      subscriptions.map(subscription => 
        webpush.sendNotification(subscription, notificationPayload)
          .catch(async (error) => {
            // If subscription is invalid, remove it
            if (error.statusCode === 410 || error.statusCode === 404) {
              console.log(`[PushService] Removing invalid subscription for user ${userId}`);
              await removeSubscription(userId, subscription.endpoint);
            }
            throw error;
          })
      )
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[PushService] Sent ${successful}/${subscriptions.length} notifications to user ${userId}`);
    
    return { success: successful > 0, sent: successful, total: subscriptions.length };
  } catch (error) {
    console.error('[PushService] Failed to send notification:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send push notification for a new message
 */
async function notifyNewMessage(userId, senderName, messagePreview) {
  return sendToUser(userId, {
    title: `New message from ${senderName}`,
    body: messagePreview.substring(0, 100) + (messagePreview.length > 100 ? '...' : ''),
    url: '/dashboard?tab=messages',
    tag: 'new-message'
  });
}

/**
 * Send push notification for booking update
 */
async function notifyBookingUpdate(userId, bookingStatus, vendorName) {
  const statusMessages = {
    'accepted': `${vendorName} accepted your booking request!`,
    'rejected': `${vendorName} couldn't accept your booking`,
    'cancelled': `Booking with ${vendorName} was cancelled`,
    'completed': `Your booking with ${vendorName} is complete`
  };
  
  return sendToUser(userId, {
    title: 'Booking Update',
    body: statusMessages[bookingStatus] || `Your booking status changed to ${bookingStatus}`,
    url: '/dashboard?tab=bookings',
    tag: 'booking-update'
  });
}

/**
 * Send push notification for new booking request (to vendor)
 */
async function notifyNewBookingRequest(vendorUserId, clientName, serviceName) {
  return sendToUser(vendorUserId, {
    title: 'New Booking Request',
    body: `${clientName} wants to book ${serviceName}`,
    url: '/dashboard?tab=bookings',
    tag: 'new-booking'
  });
}

/**
 * Send push notification for payment received (to vendor)
 */
async function notifyPaymentReceived(vendorUserId, amount, clientName) {
  return sendToUser(vendorUserId, {
    title: 'Payment Received',
    body: `You received ${amount} from ${clientName}`,
    url: '/dashboard?tab=payments',
    tag: 'payment-received'
  });
}

/**
 * Get VAPID public key for client subscription
 */
function getVapidPublicKey() {
  return vapidKeys.publicKey || null;
}

module.exports = {
  saveSubscription,
  removeSubscription,
  getSubscriptions,
  sendToUser,
  notifyNewMessage,
  notifyBookingUpdate,
  notifyNewBookingRequest,
  notifyPaymentReceived,
  getVapidPublicKey
};
