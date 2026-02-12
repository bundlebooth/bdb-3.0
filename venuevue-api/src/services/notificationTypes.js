/**
 * Notification Types Enum
 * Centralized list of all notification types that maps to emails, in-app notifications, and push.
 * 
 * Usage:
 *   const NotificationTypes = require('./notificationTypes');
 *   await notificationService.send(NotificationTypes.BOOKING_REQUEST, userId, data);
 */

const NotificationTypes = {
  // Booking Events
  BOOKING_REQUEST: 'booking_request',
  BOOKING_APPROVED: 'booking_approved',
  BOOKING_REJECTED: 'booking_rejected',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_RESCHEDULED: 'booking_rescheduled',
  BOOKING_REMINDER_24H: 'booking_reminder_24h',
  BOOKING_REMINDER_1_WEEK: 'booking_reminder_1_week',
  BOOKING_UPDATE: 'booking_update',
  
  // Message Events
  MESSAGE_RECEIVED: 'message',
  NEW_MESSAGE: 'new_message',
  UNREAD_MESSAGES_REMINDER: 'unread_messages_reminder',
  
  // Payment Events
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  PAYMENT_FAILED: 'payment_failed',
  INVOICE_SENT: 'invoice_sent',
  REFUND_PROCESSED: 'refund_processed',
  PAYOUT_PROCESSED: 'payout_processed',
  DEPOSIT_DUE: 'deposit_due',
  FINAL_PAYMENT_DUE: 'final_payment_due',
  RECEIPT: 'receipt',
  
  // Review Events
  REVIEW_REQUEST: 'review_request',
  REVIEW_RECEIVED: 'review',
  NEW_REVIEW: 'new_review',
  
  // Account Events
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',
  ACCOUNT_SUSPENDED: 'account_suspended',
  ACCOUNT_REACTIVATED: 'account_reactivated',
  ACCOUNT_DELETION_REQUESTED: 'account_deletion_requested',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGED: 'password_changed',
  EMAIL_VERIFICATION: 'email_verification',
  LOGIN_NEW_DEVICE: 'login_new_device',
  AUTH_2FA: 'auth_2fa',
  
  // Vendor Events
  VENDOR_APPROVED: 'vendor_approved',
  VENDOR_REJECTED: 'vendor_rejected',
  VENDOR_FEATURED: 'vendor_featured',
  VENDOR_PROFILE_INCOMPLETE: 'vendor_profile_incomplete',
  VENDOR_WELCOME: 'vendor_welcome',
  VENDOR_INACTIVITY: 'vendor_inactivity',
  VENDOR_APPLICATION_ADMIN: 'vendor_application_admin',
  
  // Client Events
  CLIENT_WELCOME: 'client_welcome',
  CLIENT_TO_VENDOR_WELCOME: 'client_to_vendor_welcome',
  USER_INACTIVITY: 'user_inactivity',
  FAVORITE_VENDOR_AVAILABLE: 'favorite_vendor_available',
  
  // Support Events
  SUPPORT_TICKET_OPENED: 'support_ticket_opened',
  SUPPORT_TICKET_IN_PROGRESS: 'support_ticket_in_progress',
  SUPPORT_TICKET_CLOSED: 'support_ticket_closed',
  SUPPORT_TICKET_REPLY: 'support_ticket_reply',
  SUPPORT_MESSAGE_RECEIVED: 'support_message_received',
  NEW_SUPPORT_MESSAGE: 'new_support_message',
  SUPPORT_TICKET_CONFIRMATION: 'support_ticket_confirmation',
  SUPPORT_TICKET_ADMIN: 'support_ticket_admin',
  CHAT_SUMMARY: 'chat_summary',
  
  // Dispute Events
  DISPUTE_OPENED: 'dispute_opened',
  DISPUTE_RESOLVED: 'dispute_resolved',
  
  // Marketing Events
  PROMOTIONAL_OFFER: 'promotional_offer',
  NEWSLETTER: 'newsletter',
  ANNOUNCEMENT: 'announcement',
  
  // Referral Events
  REFERRAL_INVITATION: 'referral_invitation',
  REFERRAL_REWARD: 'referral_reward',
  
  // Subscription Events
  SUBSCRIPTION_RENEWAL_REMINDER: 'subscription_renewal_reminder',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  
  // Quote Events
  QUOTE_RECEIVED: 'quote_received',
  
  // Reminder Events
  EVENT_REMINDER: 'event_reminder',
  BOOKING_ACTION_REMINDER: 'booking_action_reminder',
  PAYMENT_REMINDER: 'payment_reminder',
  
  // Analytics Events
  ANALYTICS_SUMMARY: 'analytics_summary',
  
  // Policy Events
  POLICY_WARNING: 'policy_warning',
  
  // General
  GENERAL: 'general',
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

module.exports = NotificationTypes;
