/**
 * Notification Configuration
 * Maps each notification type to its email template, icon, and message templates.
 * 
 * Each config entry contains:
 * - emailTemplate: Key from EmailTemplates table
 * - icon: Unified SVG icon filename from /images/planbeau-platform-assets/icons/notification/
 * - pushTitle: Title for push notification (supports {{variable}} placeholders)
 * - pushBody: Body for push notification (supports {{variable}} placeholders)
 * - inAppTitle: Title for in-app notification
 * - inAppMessage: Message for in-app notification
 * - channels: Array of channels to use ['email', 'notification', 'push']
 */

const NotificationConfig = {
  // ============================================
  // BOOKING EVENTS
  // ============================================
  'booking_request': {
    emailTemplate: 'booking_request_vendor',
    icon: 'notif-booking-request.svg',
    pushTitle: 'New Booking Request',
    pushBody: 'You have a new booking request from {{clientName}}',
    inAppTitle: 'New Booking Request',
    inAppMessage: 'You have a new booking request for {{eventDate}}',
    channels: ['email', 'notification', 'push'],
  },
  'booking_approved': {
    emailTemplate: 'booking_accepted_client',
    icon: 'notif-booking-approved.svg',
    pushTitle: 'Booking Approved!',
    pushBody: '{{vendorName}} accepted your booking',
    inAppTitle: 'Booking Request Approved!',
    inAppMessage: 'Your booking request has been approved by the vendor. You can now proceed with payment.',
    channels: ['email', 'notification', 'push'],
  },
  'booking_rejected': {
    emailTemplate: 'booking_rejected_client',
    icon: 'notif-booking-declined.svg',
    pushTitle: 'Booking Update',
    pushBody: '{{vendorName}} could not accept your booking',
    inAppTitle: 'Booking Request Declined',
    inAppMessage: 'Unfortunately, your booking request was declined by {{vendorName}}.',
    channels: ['email', 'notification', 'push'],
  },
  'booking_confirmed': {
    emailTemplate: 'booking_confirmed_client',
    icon: 'notif-booking-approved.svg',
    pushTitle: 'Booking Confirmed!',
    pushBody: 'Your booking with {{vendorName}} is confirmed',
    inAppTitle: 'Booking Confirmed',
    inAppMessage: 'Your booking with {{vendorName}} has been confirmed!',
    channels: ['email', 'notification', 'push'],
  },
  'booking_cancelled': {
    emailTemplate: 'booking_cancelled_client',
    icon: 'notif-booking-declined.svg',
    pushTitle: 'Booking Cancelled',
    pushBody: 'Your booking has been cancelled',
    inAppTitle: 'Booking Cancelled',
    inAppMessage: 'Your booking for {{serviceName}} has been cancelled.',
    channels: ['email', 'notification', 'push'],
  },
  'booking_rescheduled': {
    emailTemplate: 'booking_rescheduled',
    icon: 'notif-booking-request.svg',
    pushTitle: 'Booking Rescheduled',
    pushBody: 'Your booking has been rescheduled to {{newDate}}',
    inAppTitle: 'Booking Rescheduled',
    inAppMessage: 'Your booking for {{serviceName}} has been rescheduled from {{originalDate}} to {{newDate}}.',
    channels: ['email', 'notification', 'push'],
  },
  'booking_reminder_24h': {
    emailTemplate: 'booking_reminder_24h',
    icon: 'notif-reminder.svg',
    pushTitle: 'Event Tomorrow!',
    pushBody: 'Your event with {{vendorName}} is tomorrow',
    inAppTitle: 'Event Tomorrow!',
    inAppMessage: 'Reminder: Your event for {{serviceName}} is tomorrow at {{eventTime}}.',
    channels: ['email', 'notification', 'push'],
  },
  'booking_reminder_1_week': {
    emailTemplate: 'booking_reminder_1_week',
    icon: 'notif-reminder.svg',
    pushTitle: 'Event in 1 Week',
    pushBody: 'Your event with {{vendorName}} is in 1 week',
    inAppTitle: 'Event in 1 Week',
    inAppMessage: 'Reminder: Your event for {{serviceName}} is in 1 week on {{eventDate}}.',
    channels: ['email', 'notification', 'push'],
  },
  'booking_update': {
    emailTemplate: null,
    icon: 'notif-booking-request.svg',
    pushTitle: 'Booking Updated',
    pushBody: 'Your booking details have been updated',
    inAppTitle: 'Booking Updated',
    inAppMessage: 'Your booking details have been updated.',
    channels: ['notification', 'push'],
  },

  // ============================================
  // MESSAGE EVENTS
  // ============================================
  'message': {
    emailTemplate: 'message_vendor_to_client',
    icon: 'notif-message.svg',
    pushTitle: 'New Message',
    pushBody: 'You have a new message from {{senderName}}',
    inAppTitle: 'New Message',
    inAppMessage: 'You have a new message from {{senderName}}',
    channels: ['email', 'notification', 'push'],
  },
  'new_message': {
    emailTemplate: 'message_client_to_vendor',
    icon: 'notif-message.svg',
    pushTitle: 'New Message',
    pushBody: 'You have a new message from {{senderName}}',
    inAppTitle: 'New Message',
    inAppMessage: 'You have a new message from {{senderName}}',
    channels: ['email', 'notification', 'push'],
  },
  'unread_messages_reminder': {
    emailTemplate: 'unread_messages_reminder',
    icon: 'notif-message.svg',
    pushTitle: 'Unread Messages',
    pushBody: 'You have {{unreadCount}} unread message(s)',
    inAppTitle: 'Unread Messages',
    inAppMessage: 'You have {{unreadCount}} unread message(s) waiting for you.',
    channels: ['email', 'notification', 'push'],
  },

  // ============================================
  // PAYMENT EVENTS
  // ============================================
  'payment_received': {
    emailTemplate: 'payment_received_vendor',
    icon: 'notif-payment.svg',
    pushTitle: 'Payment Received',
    pushBody: 'You received {{amount}} from {{clientName}}',
    inAppTitle: 'Payment Received',
    inAppMessage: 'You received a payment of {{amount}} from {{clientName}}.',
    channels: ['email', 'notification', 'push'],
  },
  'payment_confirmation': {
    emailTemplate: 'payment_confirmation_client',
    icon: 'notif-payment.svg',
    pushTitle: 'Payment Confirmed',
    pushBody: 'Your payment of {{amount}} was successful',
    inAppTitle: 'Payment Confirmed',
    inAppMessage: 'Your payment of {{amount}} to {{vendorName}} was successful.',
    channels: ['email', 'notification', 'push'],
  },
  'payment_failed': {
    emailTemplate: 'payment_failed',
    icon: 'notif-warning.svg',
    pushTitle: 'Payment Failed',
    pushBody: 'Your payment could not be processed',
    inAppTitle: 'Payment Failed',
    inAppMessage: 'Your payment for {{serviceName}} could not be processed. Please try again.',
    channels: ['email', 'notification', 'push'],
  },
  'payment_reminder': {
    emailTemplate: null,
    icon: 'notif-warning.svg',
    pushTitle: 'Payment Reminder',
    pushBody: 'You have a pending payment of {{amount}}',
    inAppTitle: 'Payment Reminder',
    inAppMessage: 'Reminder: You have a pending payment of {{amount}} due {{dueDate}}.',
    channels: ['notification', 'push'],
  },
  'invoice_sent': {
    emailTemplate: 'invoice_sent',
    icon: 'notif-invoice.svg',
    pushTitle: 'Invoice Received',
    pushBody: 'New invoice from {{vendorName}} for {{amount}}',
    inAppTitle: 'Invoice Received',
    inAppMessage: 'You received an invoice from {{vendorName}} for {{amount}}.',
    channels: ['email', 'notification', 'push'],
  },
  'refund_processed': {
    emailTemplate: 'refund_processed',
    icon: 'notif-payment.svg',
    pushTitle: 'Refund Processed',
    pushBody: 'Your refund of {{refundAmount}} has been processed',
    inAppTitle: 'Refund Processed',
    inAppMessage: 'Your refund of {{refundAmount}} for {{serviceName}} has been processed.',
    channels: ['email', 'notification', 'push'],
  },
  'payout_processed': {
    emailTemplate: 'payout_processed',
    icon: 'notif-payment.svg',
    pushTitle: 'Payout Sent',
    pushBody: 'Your payout of {{payoutAmount}} is on its way',
    inAppTitle: 'Payout Processed',
    inAppMessage: 'Your payout of {{payoutAmount}} has been sent to your account ending in {{lastFourDigits}}.',
    channels: ['email', 'notification', 'push'],
  },
  'deposit_due': {
    emailTemplate: 'booking_deposit_due',
    icon: 'notif-warning.svg',
    pushTitle: 'Deposit Due',
    pushBody: 'Deposit of {{depositAmount}} due for your booking',
    inAppTitle: 'Deposit Due',
    inAppMessage: 'Deposit of {{depositAmount}} is due by {{dueDate}} for your booking with {{vendorName}}.',
    channels: ['email', 'notification', 'push'],
  },
  'final_payment_due': {
    emailTemplate: 'final_payment_due',
    icon: 'notif-warning.svg',
    pushTitle: 'Final Payment Due',
    pushBody: 'Final payment of {{amountDue}} due for your event',
    inAppTitle: 'Final Payment Due',
    inAppMessage: 'Final payment of {{amountDue}} is due by {{dueDate}} for your event with {{vendorName}}.',
    channels: ['email', 'notification', 'push'],
  },
  'receipt': {
    emailTemplate: 'receipt',
    icon: 'notif-invoice.svg',
    pushTitle: 'Receipt Available',
    pushBody: 'Your receipt for {{amount}} is ready',
    inAppTitle: 'Receipt Available',
    inAppMessage: 'Your receipt #{{receiptNumber}} for {{amount}} is now available.',
    channels: ['email', 'notification', 'push'],
  },

  // ============================================
  // REVIEW EVENTS
  // ============================================
  'review_request': {
    emailTemplate: 'review_request',
    icon: 'notif-review.svg',
    pushTitle: 'Share Your Experience',
    pushBody: 'How was your experience with {{vendorName}}?',
    inAppTitle: 'Share Your Experience',
    inAppMessage: 'How was your experience with {{vendorName}}? Leave a review!',
    channels: ['email', 'notification', 'push'],
  },
  'review': {
    emailTemplate: 'new_review_received',
    icon: 'notif-review.svg',
    pushTitle: 'New Review!',
    pushBody: '{{clientName}} left you a {{rating}}-star review',
    inAppTitle: 'New Review',
    inAppMessage: 'You have received a new {{rating}} star review from {{clientName}}.',
    channels: ['email', 'notification', 'push'],
  },
  'new_review': {
    emailTemplate: 'new_review_received',
    icon: 'notif-review.svg',
    pushTitle: 'New Review!',
    pushBody: '{{clientName}} left you a {{rating}}-star review',
    inAppTitle: 'New Review',
    inAppMessage: 'You have received a new {{rating}} star review.',
    channels: ['email', 'notification', 'push'],
  },

  // ============================================
  // ACCOUNT EVENTS
  // ============================================
  'account_locked': {
    emailTemplate: 'account_locked',
    icon: 'notif-lock.svg',
    pushTitle: 'Account Locked',
    pushBody: 'Your account has been locked',
    inAppTitle: 'Account Locked',
    inAppMessage: 'Your account has been locked. Please contact support for assistance.',
    channels: ['email', 'notification'],
  },
  'account_unlocked': {
    emailTemplate: 'account_unlocked',
    icon: 'notif-lock.svg',
    pushTitle: 'Account Unlocked',
    pushBody: 'Your account has been unlocked',
    inAppTitle: 'Account Unlocked',
    inAppMessage: 'Your account has been unlocked. You can now access all features.',
    channels: ['email', 'notification', 'push'],
  },
  'account_suspended': {
    emailTemplate: 'account_suspended',
    icon: 'notif-warning.svg',
    pushTitle: 'Account Suspended',
    pushBody: 'Your account has been suspended',
    inAppTitle: 'Account Suspended',
    inAppMessage: 'Your account has been suspended. Please contact support.',
    channels: ['email', 'notification'],
  },
  'account_reactivated': {
    emailTemplate: 'account_reactivated',
    icon: 'notif-booking-approved.svg',
    pushTitle: 'Account Reactivated',
    pushBody: 'Your account has been reactivated',
    inAppTitle: 'Account Reactivated',
    inAppMessage: 'Your account has been reactivated. Welcome back!',
    channels: ['email', 'notification', 'push'],
  },
  'account_deletion_requested': {
    emailTemplate: 'account_deletion_requested',
    icon: 'notif-warning.svg',
    pushTitle: 'Account Deletion Request',
    pushBody: 'Please confirm your account deletion request',
    inAppTitle: 'Account Deletion Requested',
    inAppMessage: 'You have requested to delete your account. Please check your email to confirm.',
    channels: ['email', 'notification'],
  },
  'password_reset': {
    emailTemplate: 'password_reset',
    icon: 'notif-lock.svg',
    pushTitle: null,
    pushBody: null,
    inAppTitle: null,
    inAppMessage: null,
    channels: ['email'],
  },
  'password_changed': {
    emailTemplate: 'password_changed',
    icon: 'notif-lock.svg',
    pushTitle: 'Password Changed',
    pushBody: 'Your password has been changed',
    inAppTitle: 'Password Changed',
    inAppMessage: 'Your password has been successfully changed.',
    channels: ['email', 'notification'],
  },
  'email_verification': {
    emailTemplate: 'email_verification',
    icon: 'notif-message.svg',
    pushTitle: null,
    pushBody: null,
    inAppTitle: null,
    inAppMessage: null,
    channels: ['email'],
  },
  'login_new_device': {
    emailTemplate: 'login_new_device',
    icon: 'notif-lock.svg',
    pushTitle: 'New Login Detected',
    pushBody: 'New login from {{deviceName}} in {{location}}',
    inAppTitle: 'New Login Detected',
    inAppMessage: 'A new login was detected from {{deviceName}} in {{location}}.',
    channels: ['email', 'notification', 'push'],
  },
  'auth_2fa': {
    emailTemplate: 'auth_2fa',
    icon: 'notif-lock.svg',
    pushTitle: null,
    pushBody: null,
    inAppTitle: null,
    inAppMessage: null,
    channels: ['email'],
  },

  // ============================================
  // VENDOR EVENTS
  // ============================================
  'vendor_approved': {
    emailTemplate: 'vendor_approved',
    icon: 'notif-booking-approved.svg',
    pushTitle: 'Profile Approved!',
    pushBody: 'Your vendor profile has been approved',
    inAppTitle: 'Profile Approved!',
    inAppMessage: 'Congratulations! Your vendor profile has been approved. You can now receive bookings.',
    channels: ['email', 'notification', 'push'],
  },
  'vendor_rejected': {
    emailTemplate: 'vendor_rejected',
    icon: 'notif-booking-declined.svg',
    pushTitle: 'Profile Review Update',
    pushBody: 'Your vendor profile needs attention',
    inAppTitle: 'Profile Review Update',
    inAppMessage: 'Your vendor profile was not approved. Please review the feedback and resubmit.',
    channels: ['email', 'notification', 'push'],
  },
  'vendor_featured': {
    emailTemplate: 'vendor_featured',
    icon: 'notif-gift.svg',
    pushTitle: 'You\'re Featured!',
    pushBody: 'Congratulations! You are now a featured vendor',
    inAppTitle: 'You\'re Featured!',
    inAppMessage: 'Congratulations! You have been selected as a featured vendor.',
    channels: ['email', 'notification', 'push'],
  },
  'vendor_profile_incomplete': {
    emailTemplate: 'vendor_profile_incomplete',
    icon: 'notif-warning.svg',
    pushTitle: 'Complete Your Profile',
    pushBody: 'Your profile is {{completionPercentage}}% complete',
    inAppTitle: 'Complete Your Profile',
    inAppMessage: 'Your profile is {{completionPercentage}}% complete. Complete it to start receiving bookings.',
    channels: ['email', 'notification', 'push'],
  },
  'vendor_welcome': {
    emailTemplate: 'vendor_welcome',
    icon: 'notif-user.svg',
    pushTitle: 'Welcome to PlanBeau!',
    pushBody: 'Your vendor account is ready',
    inAppTitle: 'Welcome to PlanBeau!',
    inAppMessage: 'Welcome to PlanBeau! Complete your profile to start receiving bookings.',
    channels: ['email', 'notification', 'push'],
  },
  'vendor_inactivity': {
    emailTemplate: 'vendor_inactivity',
    icon: 'notif-warning.svg',
    pushTitle: 'We Miss You!',
    pushBody: 'Your profile needs attention',
    inAppTitle: 'We Miss You!',
    inAppMessage: 'Your profile has been inactive. Update it to stay visible to clients.',
    channels: ['email', 'notification', 'push'],
  },
  'vendor_application_admin': {
    emailTemplate: 'vendor_application_admin',
    icon: 'notif-user.svg',
    pushTitle: 'New Vendor Application',
    pushBody: 'New application from {{businessName}}',
    inAppTitle: 'New Vendor Application',
    inAppMessage: 'New vendor application received from {{businessName}}.',
    channels: ['email', 'notification', 'push'],
  },
  'vendor_badge_granted': {
    emailTemplate: 'vendor_badge_granted',
    icon: 'notif-gift.svg',
    pushTitle: 'Congratulations! New Badge Earned!',
    pushBody: 'You\'ve earned the {{badgeName}} badge',
    inAppTitle: 'New Badge Earned!',
    inAppMessage: 'Congratulations! You\'ve earned the {{badgeName}} badge for {{businessName}}.',
    channels: ['email', 'notification', 'push'],
  },
  'vendor_badge_revoked': {
    emailTemplate: null,
    icon: 'notif-warning.svg',
    pushTitle: 'Badge Status Update',
    pushBody: 'Your {{badgeName}} badge has been updated',
    inAppTitle: 'Badge Status Update',
    inAppMessage: 'Your {{badgeName}} badge status has been updated.',
    channels: ['notification'],
  },

  // ============================================
  // CLIENT EVENTS
  // ============================================
  'client_welcome': {
    emailTemplate: 'client_welcome',
    icon: 'notif-user.svg',
    pushTitle: 'Welcome to PlanBeau!',
    pushBody: 'Start exploring vendors for your event',
    inAppTitle: 'Welcome to PlanBeau!',
    inAppMessage: 'Welcome to PlanBeau! Start exploring vendors for your perfect event.',
    channels: ['email', 'notification', 'push'],
  },
  'client_to_vendor_welcome': {
    emailTemplate: 'client_to_vendor_welcome',
    icon: 'notif-user.svg',
    pushTitle: 'Welcome as a Vendor!',
    pushBody: 'Your vendor account is ready',
    inAppTitle: 'Welcome as a Vendor!',
    inAppMessage: 'Welcome to PlanBeau as a vendor! Complete your profile to start receiving bookings.',
    channels: ['email', 'notification', 'push'],
  },
  'user_inactivity': {
    emailTemplate: 'user_inactivity',
    icon: 'notif-heart.svg',
    pushTitle: 'We Miss You!',
    pushBody: 'Come back and explore new vendors',
    inAppTitle: 'We Miss You!',
    inAppMessage: 'We miss you! Come back and explore new vendors for your event.',
    channels: ['email', 'notification', 'push'],
  },
  'favorite_vendor_available': {
    emailTemplate: 'favorite_vendor_available',
    icon: 'notif-heart.svg',
    pushTitle: 'Favorite Vendor Available!',
    pushBody: '{{vendorName}} has new availability',
    inAppTitle: 'Favorite Vendor Available!',
    inAppMessage: '{{vendorName}} has new availability. Book now!',
    channels: ['email', 'notification', 'push'],
  },

  // ============================================
  // SUPPORT EVENTS
  // ============================================
  'support_ticket_opened': {
    emailTemplate: 'support_ticket_opened',
    icon: 'notif-support.svg',
    pushTitle: 'Ticket Received',
    pushBody: 'Support ticket #{{ticketId}} has been created',
    inAppTitle: 'Support Ticket Created',
    inAppMessage: 'Your support ticket #{{ticketId}} has been created. We\'ll respond shortly.',
    channels: ['email', 'notification', 'push'],
  },
  'support_ticket_in_progress': {
    emailTemplate: 'support_ticket_in_progress',
    icon: 'notif-support.svg',
    pushTitle: 'Ticket In Progress',
    pushBody: 'Support ticket #{{ticketId}} is being worked on',
    inAppTitle: 'Ticket In Progress',
    inAppMessage: 'Your support ticket #{{ticketId}} is now being worked on.',
    channels: ['email', 'notification', 'push'],
  },
  'support_ticket_closed': {
    emailTemplate: 'support_ticket_closed',
    icon: 'notif-booking-approved.svg',
    pushTitle: 'Ticket Resolved',
    pushBody: 'Support ticket #{{ticketId}} has been resolved',
    inAppTitle: 'Ticket Resolved',
    inAppMessage: 'Your support ticket #{{ticketId}} has been resolved.',
    channels: ['email', 'notification', 'push'],
  },
  'support_ticket_reply': {
    emailTemplate: 'support_ticket_reply',
    icon: 'notif-support.svg',
    pushTitle: 'New Reply',
    pushBody: 'New reply on ticket #{{ticketId}}',
    inAppTitle: 'New Reply on Ticket',
    inAppMessage: 'You have a new reply on support ticket #{{ticketId}}.',
    channels: ['email', 'notification', 'push'],
  },
  'support_message_received': {
    emailTemplate: 'support_message_received',
    icon: 'notif-support.svg',
    pushTitle: 'Support Message',
    pushBody: 'New message from PlanBeau Support',
    inAppTitle: 'Support Message',
    inAppMessage: 'You have a new message from PlanBeau Support.',
    channels: ['email', 'notification', 'push'],
  },
  'new_support_message': {
    emailTemplate: 'new_support_message',
    icon: 'notif-support.svg',
    pushTitle: 'New Support Message',
    pushBody: 'New message from {{userName}}',
    inAppTitle: 'New Support Message',
    inAppMessage: 'New support message from {{userName}}.',
    channels: ['email', 'notification', 'push'],
  },
  'support_ticket_confirmation': {
    emailTemplate: 'support_ticket_confirmation',
    icon: 'notif-support.svg',
    pushTitle: 'Ticket Confirmed',
    pushBody: 'Support ticket {{ticketNumber}} confirmed',
    inAppTitle: 'Ticket Confirmed',
    inAppMessage: 'Your support ticket {{ticketNumber}} has been confirmed.',
    channels: ['email', 'notification', 'push'],
  },
  'support_ticket_admin': {
    emailTemplate: 'support_ticket_admin',
    icon: 'notif-support.svg',
    pushTitle: 'New Support Ticket',
    pushBody: 'New ticket: {{ticketNumber}} - {{ticketSubject}}',
    inAppTitle: 'New Support Ticket',
    inAppMessage: 'New support ticket: {{ticketNumber}} - {{ticketSubject}}',
    channels: ['email', 'notification', 'push'],
  },
  'chat_summary': {
    emailTemplate: 'chat_summary',
    icon: 'notif-support.svg',
    pushTitle: 'Chat Summary',
    pushBody: 'Your support chat summary is ready',
    inAppTitle: 'Chat Summary',
    inAppMessage: 'Your support chat summary for reference #{{referenceNumber}} is ready.',
    channels: ['email', 'notification'],
  },

  // ============================================
  // DISPUTE EVENTS
  // ============================================
  'dispute_opened': {
    emailTemplate: 'dispute_opened',
    icon: 'notif-warning.svg',
    pushTitle: 'Dispute Opened',
    pushBody: 'A dispute has been opened for booking #{{bookingId}}',
    inAppTitle: 'Dispute Opened',
    inAppMessage: 'A dispute has been opened for booking #{{bookingId}}.',
    channels: ['email', 'notification', 'push'],
  },
  'dispute_resolved': {
    emailTemplate: 'dispute_resolved',
    icon: 'notif-booking-approved.svg',
    pushTitle: 'Dispute Resolved',
    pushBody: 'Dispute for booking #{{bookingId}} has been resolved',
    inAppTitle: 'Dispute Resolved',
    inAppMessage: 'The dispute for booking #{{bookingId}} has been resolved.',
    channels: ['email', 'notification', 'push'],
  },

  // ============================================
  // MARKETING EVENTS
  // ============================================
  'promotional_offer': {
    emailTemplate: 'promotional_offer',
    icon: 'notif-gift.svg',
    pushTitle: '{{offerTitle}}',
    pushBody: '{{offerDescription}}',
    inAppTitle: 'Special Offer!',
    inAppMessage: '{{offerTitle}} - {{offerDescription}}',
    channels: ['email', 'notification', 'push'],
  },
  'newsletter': {
    emailTemplate: 'newsletter',
    icon: 'notif-message.svg',
    pushTitle: '{{newsletterTitle}}',
    pushBody: 'New newsletter from PlanBeau',
    inAppTitle: 'Newsletter',
    inAppMessage: '{{newsletterTitle}}',
    channels: ['email', 'notification', 'push'],
  },
  'announcement': {
    emailTemplate: null,
    icon: 'notif-reminder.svg',
    pushTitle: 'Announcement',
    pushBody: '{{announcementMessage}}',
    inAppTitle: 'Announcement',
    inAppMessage: '{{announcementMessage}}',
    channels: ['notification', 'push'],
  },

  // ============================================
  // REFERRAL EVENTS
  // ============================================
  'referral_invitation': {
    emailTemplate: 'referral_invitation',
    icon: 'notif-gift.svg',
    pushTitle: 'You\'re Invited!',
    pushBody: '{{referrerName}} invited you to PlanBeau',
    inAppTitle: 'Referral Invitation',
    inAppMessage: '{{referrerName}} invited you to PlanBeau! Sign up and get {{referralBonus}}.',
    channels: ['email'],
  },
  'referral_reward': {
    emailTemplate: 'referral_reward',
    icon: 'notif-gift.svg',
    pushTitle: 'Referral Reward!',
    pushBody: 'You earned {{rewardAmount}} from a referral',
    inAppTitle: 'Referral Reward!',
    inAppMessage: 'You earned {{rewardAmount}} because {{referredName}} signed up!',
    channels: ['email', 'notification', 'push'],
  },

  // ============================================
  // SUBSCRIPTION EVENTS
  // ============================================
  'subscription_renewal_reminder': {
    emailTemplate: 'subscription_renewal_reminder',
    icon: 'notif-booking-request.svg',
    pushTitle: 'Subscription Renewal',
    pushBody: 'Your {{planName}} subscription renews on {{renewalDate}}',
    inAppTitle: 'Subscription Renewal Reminder',
    inAppMessage: 'Your {{planName}} subscription renews on {{renewalDate}} for {{amount}}.',
    channels: ['email', 'notification', 'push'],
  },
  'subscription_cancelled': {
    emailTemplate: 'subscription_cancelled',
    icon: 'notif-warning.svg',
    pushTitle: 'Subscription Cancelled',
    pushBody: 'Your {{planName}} subscription has been cancelled',
    inAppTitle: 'Subscription Cancelled',
    inAppMessage: 'Your {{planName}} subscription has been cancelled. Access ends on {{accessEndDate}}.',
    channels: ['email', 'notification', 'push'],
  },

  // ============================================
  // QUOTE EVENTS
  // ============================================
  'quote_received': {
    emailTemplate: 'quote_received',
    icon: 'notif-invoice.svg',
    pushTitle: 'New Quote',
    pushBody: 'New quote from {{vendorName}} for {{quoteAmount}}',
    inAppTitle: 'New Quote Received',
    inAppMessage: 'You received a quote from {{vendorName}} for {{quoteAmount}}. Valid until {{validUntil}}.',
    channels: ['email', 'notification', 'push'],
  },

  // ============================================
  // REMINDER EVENTS
  // ============================================
  'event_reminder': {
    emailTemplate: 'event_reminder',
    icon: 'notif-reminder.svg',
    pushTitle: 'Event Reminder',
    pushBody: 'Your event is in {{daysUntilEvent}}',
    inAppTitle: 'Event Reminder',
    inAppMessage: 'Reminder: Your event for {{serviceName}} is in {{daysUntilEvent}}.',
    channels: ['email', 'notification', 'push'],
  },
  'booking_action_reminder': {
    emailTemplate: 'booking_action_reminder',
    icon: 'notif-reminder.svg',
    pushTitle: 'Action Required',
    pushBody: '{{actionSubject}}',
    inAppTitle: 'Action Required',
    inAppMessage: '{{actionMessage}}',
    channels: ['email', 'notification', 'push'],
  },

  // ============================================
  // ANALYTICS EVENTS
  // ============================================
  'analytics_summary': {
    emailTemplate: 'analytics_summary',
    icon: 'notif-message.svg',
    pushTitle: 'Performance Summary',
    pushBody: 'Your {{periodLabel}} performance summary is ready',
    inAppTitle: 'Performance Summary',
    inAppMessage: 'Your {{periodLabel}} performance summary is ready. Check your dashboard!',
    channels: ['email', 'notification', 'push'],
  },

  // ============================================
  // POLICY EVENTS
  // ============================================
  'policy_warning': {
    emailTemplate: 'policy_warning',
    icon: 'notif-warning.svg',
    pushTitle: 'Policy Warning',
    pushBody: 'Your message was blocked',
    inAppTitle: 'Policy Warning',
    inAppMessage: 'Your message was blocked due to {{violationType}}. Please review our policies.',
    channels: ['email', 'notification'],
  },

  // ============================================
  // GENERAL EVENTS
  // ============================================
  'general': {
    emailTemplate: null,
    icon: 'notif-reminder.svg',
    pushTitle: 'Notification',
    pushBody: '{{message}}',
    inAppTitle: 'Notification',
    inAppMessage: '{{message}}',
    channels: ['notification', 'push'],
  },
  'info': {
    emailTemplate: null,
    icon: 'notif-message.svg',
    pushTitle: 'Information',
    pushBody: '{{message}}',
    inAppTitle: 'Information',
    inAppMessage: '{{message}}',
    channels: ['notification', 'push'],
  },
  'success': {
    emailTemplate: null,
    icon: 'notif-booking-approved.svg',
    pushTitle: 'Success',
    pushBody: '{{message}}',
    inAppTitle: 'Success',
    inAppMessage: '{{message}}',
    channels: ['notification', 'push'],
  },
  'warning': {
    emailTemplate: null,
    icon: 'notif-warning.svg',
    pushTitle: 'Warning',
    pushBody: '{{message}}',
    inAppTitle: 'Warning',
    inAppMessage: '{{message}}',
    channels: ['notification', 'push'],
  },
  'error': {
    emailTemplate: null,
    icon: 'notif-booking-declined.svg',
    pushTitle: 'Error',
    pushBody: '{{message}}',
    inAppTitle: 'Error',
    inAppMessage: '{{message}}',
    channels: ['notification', 'push'],
  },
};

module.exports = NotificationConfig;
