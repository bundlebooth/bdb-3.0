const nodemailer = require('nodemailer');
const { poolPromise, sql } = require('../config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

let transporter = null;

// Generate unsubscribe token for a user
function generateUnsubscribeToken(userId, email) {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const payload = { userId, email, purpose: 'unsubscribe' };
  return jwt.sign(payload, secret, { expiresIn: '30d' });
}

// Generate unsubscribe URL
function getUnsubscribeUrl(userId, email, category = null) {
  const token = generateUnsubscribeToken(userId, email);
  const apiUrl = process.env.API_BASE_URL || 'http://localhost:5000';
  let url = `${apiUrl}/users/unsubscribe/${token}`;
  if (category) {
    url += `?category=${category}`;
  }
  return url;
}

// Email sender configuration based on email type/category
// Maps template keys and categories to specific sender addresses
const EMAIL_SENDER_CONFIG = {
  // Authentication & Security emails
  'auth_2fa': process.env.EMAIL_NOTIFICATIONS || 'notifications@planbeau.com',
  '2fa': process.env.EMAIL_NOTIFICATIONS || 'notifications@planbeau.com',
  
  // Booking-related emails
  'booking_request_vendor': process.env.EMAIL_BOOKINGS || 'bookings@planbeau.com',
  'booking_accepted_client': process.env.EMAIL_BOOKINGS || 'bookings@planbeau.com',
  'booking_rejected_client': process.env.EMAIL_BOOKINGS || 'bookings@planbeau.com',
  'bookingUpdates': process.env.EMAIL_BOOKINGS || 'bookings@planbeau.com',
  
  // Message notifications
  'message_vendor_to_client': process.env.EMAIL_NOTIFICATIONS || 'notifications@planbeau.com',
  'message_client_to_vendor': process.env.EMAIL_NOTIFICATIONS || 'notifications@planbeau.com',
  'messages': process.env.EMAIL_NOTIFICATIONS || 'notifications@planbeau.com',
  
  // Payment emails
  'payment_received_vendor': process.env.EMAIL_BOOKINGS || 'bookings@planbeau.com',
  'payments': process.env.EMAIL_BOOKINGS || 'bookings@planbeau.com',
  
  // Support emails
  'support': process.env.EMAIL_SUPPORT || 'support@planbeau.com',
  
  // Admin/Operator emails
  'admin': process.env.EMAIL_ADMIN || 'admin@planbeau.com',
  'operators': process.env.EMAIL_OPERATORS || 'operators@planbeau.com',
  
  // General/Welcome emails
  'welcome': process.env.EMAIL_HELLO || 'hello@planbeau.com',
  'hello': process.env.EMAIL_HELLO || 'hello@planbeau.com',
  
  // Default fallback
  'default': process.env.SMTP_FROM || process.env.EMAIL_NOTIFICATIONS || 'notifications@planbeau.com'
};

// Get sender email based on template key or category
function getSenderEmail(templateKey, emailCategory) {
  // First try template key
  if (templateKey && EMAIL_SENDER_CONFIG[templateKey]) {
    return EMAIL_SENDER_CONFIG[templateKey];
  }
  // Then try category
  if (emailCategory && EMAIL_SENDER_CONFIG[emailCategory]) {
    return EMAIL_SENDER_CONFIG[emailCategory];
  }
  // Fallback to default
  return EMAIL_SENDER_CONFIG['default'];
}

// Send email via Brevo REST API (fallback if SMTP fails)
// Now accepts senderEmail parameter and automatically BCCs to sender
// additionalBcc parameter allows adding extra BCC recipients (e.g., admin email)
// attachments parameter allows adding file attachments [{name: 'file.pdf', content: base64String}]
async function sendViaBrevoAPI(to, subject, htmlContent, textContent, senderEmail = null, additionalBcc = null, attachments = null) {
  // Try multiple env var names for Brevo API key
  const apiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS;
  if (!apiKey) {
    throw new Error('Brevo API key not configured (need BREVO_API_KEY or SMTP_PASS)');
  }

  const fromEmail = senderEmail || process.env.SMTP_FROM || process.env.FROM_EMAIL || 'notifications@planbeau.com';
  const fromName = process.env.FROM_NAME || process.env.PLATFORM_NAME || 'PlanBeau';

  // Build BCC list - always include sender, optionally include additional BCCs
  const bccList = [{ email: fromEmail }];
  if (additionalBcc) {
    // additionalBcc can be a string or array of strings
    const bccEmails = Array.isArray(additionalBcc) ? additionalBcc : [additionalBcc];
    bccEmails.forEach(email => {
      if (email && email !== fromEmail && email !== to) {
        bccList.push({ email });
      }
    });
  }

  // Build email payload with BCC to sender (matching Brevo API format exactly)
  const emailPayload = {
    sender: { 
      email: fromEmail,
      name: fromName 
    },
    to: [{ email: to }],
    bcc: bccList,
    subject: subject,
    htmlContent: htmlContent
  };
  
  // Only add textContent if provided (some Brevo plans may not support both)
  if (textContent) {
    emailPayload.textContent = textContent;
  }

  // Add attachments if provided
  if (attachments && attachments.length > 0) {
    emailPayload.attachment = attachments.map(att => ({
      name: att.name,
      content: att.content // Base64 encoded content
    }));
  }

  console.log(`📧 [BREVO API] Sending email from: ${fromEmail} to: ${to} with BCC: ${bccList.map(b => b.email).join(', ')}${attachments ? ` with ${attachments.length} attachment(s)` : ''}`);

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(emailPayload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Brevo API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
  }

  return await response.json();
}

// Create Brevo SMTP transporter (primary method)
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.FROM_EMAIL;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  
  // Only use SMTP if credentials are explicitly set
  if (!host || !user || !pass) return null;
  
  return nodemailer.createTransport({ 
    host, 
    port, 
    secure, 
    auth: { user, pass },
    connectionTimeout: 5000, // 5 second timeout
    greetingTimeout: 5000
  });
}

function getTransporter() {
  if (transporter) return transporter;
  transporter = createTransporter();
  return transporter;
}

// Replace {{variables}} in template
function replaceVariables(content, variables) {
  if (!content) return content;
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

// Fetch template from database and merge components
async function getEmailTemplate(templateKey) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('TemplateKey', sql.NVarChar(50), templateKey)
      .execute('admin.sp_GetEmailTemplate');
    
    if (result.recordset.length === 0) {
      throw new Error(`Email template not found: ${templateKey}`);
    }
    
    const template = result.recordset[0];
    
    // Merge header + body + footer
    const htmlContent = (template.HeaderHtml || '') + (template.BodyHtml || '') + (template.FooterHtml || '');
    const textContent = (template.HeaderText || '') + '\n\n' + (template.BodyText || '') + '\n\n' + (template.FooterText || '');
    
    return {
      subject: template.Subject,
      htmlContent,
      textContent,
      templateName: template.TemplateName
    };
  } catch (error) {
    console.error('Error fetching email template:', error);
    throw error;
  }
}

// Get user notification preferences
async function getUserPreferences(userId) {
  try {
    if (!userId) return null;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .query('SELECT NotificationPreferences FROM users.Users WHERE UserID = @UserID');
    
    if (result.recordset.length === 0) return null;
    
    const prefs = result.recordset[0].NotificationPreferences;
    return prefs ? JSON.parse(prefs) : null;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
}

// Check if user has enabled this email type
async function canSendEmail(userId, emailCategory) {
  // Always allow 2FA emails (security critical)
  if (emailCategory === '2fa') return true;
  
  // Always allow admin emails
  if (emailCategory === 'admin') return true;
  
  // Always allow vendor-related emails (approval, rejection, welcome)
  if (emailCategory === 'vendor' || emailCategory === 'welcome') return true;
  
  if (!userId) return true; // If no userId, send (e.g., to vendors not logged in)
  
  const prefs = await getUserPreferences(userId);
  if (!prefs || !prefs.email) return true; // Default to sending if no preferences
  
  // Map email categories to preference keys
  const categoryMap = {
    'bookingConfirmations': prefs.email.bookingConfirmations !== false,
    'bookingReminders': prefs.email.bookingReminders !== false,
    'bookingUpdates': prefs.email.bookingUpdates !== false,
    'messages': prefs.email.messages !== false,
    'payments': prefs.email.payments !== false,
    'promotions': prefs.email.promotions === true,
    'newsletter': prefs.email.newsletter === true,
    'marketing': prefs.email.promotions === true // Alias for promotions
  };
  
  // If category not in map, default to allow
  if (!(emailCategory in categoryMap)) return true;
  
  return categoryMap[emailCategory];
}

// Log email to database
async function logEmail(templateKey, recipientEmail, recipientName, subject, status, errorMessage = null, userId = null, bookingId = null, metadata = null, htmlBody = null) {
  try {
    const pool = await poolPromise;
    if (!pool) {
      return;
    }
    await pool.request()
      .input('TemplateKey', sql.NVarChar(50), templateKey)
      .input('RecipientEmail', sql.NVarChar(255), recipientEmail)
      .input('RecipientName', sql.NVarChar(100), recipientName)
      .input('Subject', sql.NVarChar(255), subject)
      .input('Status', sql.NVarChar(20), status)
      .input('ErrorMessage', sql.NVarChar(sql.MAX), errorMessage)
      .input('UserID', sql.Int, userId)
      .input('BookingID', sql.Int, bookingId)
      .input('Metadata', sql.NVarChar(sql.MAX), metadata ? JSON.stringify(metadata) : null)
      .input('HtmlBody', sql.NVarChar(sql.MAX), htmlBody)
      .execute('admin.sp_LogEmail');
  } catch (error) {
    console.error('Error logging email:', error);
  }
}

// Send email using template
// adminBcc parameter allows adding admin email as BCC recipient
// attachments parameter allows adding file attachments [{name: 'file.pdf', content: base64String}]
async function sendTemplatedEmail(templateKey, recipientEmail, recipientName, variables, userId = null, bookingId = null, metadata = null, emailCategory = null, adminBcc = null, attachments = null) {
  try {
    // Check user preferences before sending
    if (emailCategory && userId) {
      const canSend = await canSendEmail(userId, emailCategory);
      if (!canSend) {
        await logEmail(templateKey, recipientEmail, recipientName, 'Blocked by preferences', 'pending', 'User disabled this email type', userId, bookingId, metadata);
        return;
      }
    }

    // Auto-inject platform variables
    const frontendUrl = process.env.FRONTEND_URL || `https://${process.env.PLATFORM_URL || 'venuevue.com'}`;
    
    // Generate unsubscribe URL if we have userId
    let unsubscribeUrl = `${frontendUrl}/dashboard/settings`;
    if (userId && recipientEmail) {
      unsubscribeUrl = getUnsubscribeUrl(userId, recipientEmail, emailCategory);
    }
    
    const platformVars = {
      platformName: process.env.PLATFORM_NAME || 'PlanBeau',
      platformUrl: process.env.PLATFORM_URL || 'planbeau.com',
      frontendUrl: frontendUrl,
      logoUrl: `${frontendUrl}/images/logo.png`,
      currentYear: new Date().getFullYear().toString(),
      recipientEmail,
      unsubscribeUrl,
      preferencesUrl: `${frontendUrl}/dashboard/settings`,
      ...variables
    };

    // Get template from database
    const template = await getEmailTemplate(templateKey);
    
    // Replace variables in subject, HTML, and text
    const subject = replaceVariables(template.subject, platformVars);
    const html = replaceVariables(template.htmlContent, platformVars);
    const text = replaceVariables(template.textContent, platformVars);

    // Get the appropriate sender email based on template key or category
    const senderEmail = getSenderEmail(templateKey, emailCategory);
    
    // Use Brevo API first (better BCC support), fallback to SMTP
    let emailSent = false;
    let lastError = null;

    // Try Brevo REST API first (proper BCC support)
    try {
      await sendViaBrevoAPI(recipientEmail, subject, html, text, senderEmail, adminBcc, attachments);
      emailSent = true;
    } catch (apiError) {
      console.error('Brevo API failed, trying SMTP fallback:', apiError.message);
      lastError = apiError;
    }

    // Fallback to SMTP if Brevo API failed
    if (!emailSent) {
      const t = getTransporter();
      if (t) {
        try {
          // Build BCC list for SMTP
          const bccList = [senderEmail];
          if (adminBcc) {
            const bccEmails = Array.isArray(adminBcc) ? adminBcc : [adminBcc];
            bccEmails.forEach(email => {
              if (email && email !== senderEmail && email !== recipientEmail) {
                bccList.push(email);
              }
            });
          }
          console.log(`📧 [SMTP] Sending email from: ${senderEmail} to: ${recipientEmail} with BCC: ${bccList.join(', ')}${attachments ? ` with ${attachments.length} attachment(s)` : ''}`);
          const mailOptions = { 
            from: senderEmail, 
            to: recipientEmail, 
            bcc: bccList.join(', '),
            subject, 
            text, 
            html 
          };
          // Add attachments for SMTP
          if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments.map(att => ({
              filename: att.name,
              content: Buffer.from(att.content, 'base64')
            }));
          }
          await t.sendMail(mailOptions);
          emailSent = true;
        } catch (smtpError) {
          console.error('SMTP also failed:', smtpError.message);
          lastError = smtpError;
        }
      }
    }

    if (emailSent) {
      console.log(`✅ [EMAIL SENT] Template: ${templateKey} | To: ${recipientEmail} | Subject: ${subject}`);
      await logEmail(templateKey, recipientEmail, recipientName, subject, 'sent', null, userId, bookingId, metadata, html);
    } else {
      console.log(`❌ [EMAIL FAILED] Template: ${templateKey} | To: ${recipientEmail} | Error: ${lastError?.message}`);
      await logEmail(templateKey, recipientEmail, recipientName, subject, 'failed', lastError?.message || 'Email sending failed', userId, bookingId, metadata, html);
      throw lastError || new Error('Email sending failed');
    }
  } catch (error) {
    console.error('Error sending templated email:', error);
    await logEmail(templateKey, recipientEmail, recipientName, 'Error', 'failed', error.message, userId, bookingId, metadata, null);
    throw error;
  }
}

// Direct send (for non-templated emails)
async function sendEmail({ to, subject, text, html, from, templateKey = null, emailCategory = null }) {
  // Get the appropriate sender email
  const senderEmail = from || getSenderEmail(templateKey, emailCategory);
  
  let emailSent = false;

  // Try Brevo REST API first (proper BCC support)
  try {
    await sendViaBrevoAPI(to, subject, html, text, senderEmail);
    emailSent = true;
    return;
  } catch (apiError) {
    console.error('Brevo API failed, trying SMTP fallback:', apiError.message);
  }

  // Fallback to SMTP if Brevo API failed
  if (!emailSent) {
    const t = getTransporter();
    if (t) {
      try {
        console.log(`📧 [SMTP] Sending email from: ${senderEmail} to: ${to} with BCC: ${senderEmail}`);
        await t.sendMail({ 
          from: senderEmail, 
          to, 
          bcc: senderEmail, // BCC to sender so it appears in Zoho inbox
          subject, 
          text, 
          html 
        });
        return;
      } catch (smtpError) {
        console.error('SMTP also failed:', smtpError.message);
        throw smtpError;
      }
    }
  }
}

// =============================================
// HELPER FUNCTIONS FOR COMMON EMAIL TYPES
// =============================================

async function sendTwoFactorCode(email, code, userName = 'User', userId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('auth_2fa', email, userName, { code, userName }, userId, null, null, '2fa', adminEmail);
}

async function sendBookingRequestToVendor(vendorEmail, vendorName, clientName, serviceName, eventDate, location, budget, dashboardUrl, vendorUserId = null, bookingId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('booking_request_vendor', vendorEmail, vendorName, {
    vendorName, clientName, serviceName, eventDate, location, budget, dashboardUrl
  }, vendorUserId, bookingId, null, 'bookingUpdates', adminEmail);
}

async function sendBookingAcceptedToClient(clientEmail, clientName, vendorName, serviceName, dashboardUrl, userId = null, bookingId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('booking_accepted_client', clientEmail, clientName, {
    clientName, vendorName, serviceName, dashboardUrl
  }, userId, bookingId, null, 'bookingUpdates', adminEmail);
}

async function sendBookingRejectedToClient(clientEmail, clientName, vendorName, serviceName, eventDate, searchUrl, userId = null, bookingId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('booking_rejected_client', clientEmail, clientName, {
    clientName, vendorName, serviceName, eventDate, searchUrl
  }, userId, bookingId, null, 'bookingUpdates', adminEmail);
}

async function sendMessageFromVendor(clientEmail, clientName, vendorName, messageContent, dashboardUrl, userId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('message_vendor_to_client', clientEmail, clientName, {
    clientName, vendorName, messageContent, dashboardUrl
  }, userId, null, null, 'messages', adminEmail);
}

async function sendMessageFromClient(vendorEmail, vendorName, clientName, messageContent, dashboardUrl, vendorUserId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('message_client_to_vendor', vendorEmail, vendorName, {
    vendorName, clientName, messageContent, dashboardUrl
  }, vendorUserId, null, null, 'messages', adminEmail);
}

async function sendPaymentReceivedToVendor(vendorEmail, vendorName, clientName, amount, serviceName, eventDate, dashboardUrl, vendorUserId = null, bookingId = null, invoiceAttachment = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('payment_received_vendor', vendorEmail, vendorName, {
    vendorName, clientName, amount, serviceName, eventDate, dashboardUrl
  }, vendorUserId, bookingId, null, 'payments', adminEmail, invoiceAttachment ? [invoiceAttachment] : null);
}

// Send payment confirmation to client with optional invoice attachment
async function sendPaymentConfirmationToClient(clientEmail, clientName, vendorName, amount, serviceName, eventDate, dashboardUrl, userId = null, bookingId = null, invoiceAttachment = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('payment_confirmation_client', clientEmail, clientName, {
    clientName, vendorName, amount, serviceName, eventDate, dashboardUrl
  }, userId, bookingId, null, 'payments', adminEmail, invoiceAttachment ? [invoiceAttachment] : null);
}

// Send booking cancellation notification to client (when vendor cancels)
async function sendBookingCancelledToClient(clientEmail, clientName, vendorName, serviceName, eventDate, reason, refundAmount, searchUrl, userId = null, bookingId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('booking_cancelled_client', clientEmail, clientName, {
    clientName, vendorName, serviceName, eventDate, reason: reason || 'No reason provided', refundAmount: refundAmount || '$0.00', searchUrl
  }, userId, bookingId, null, 'bookingUpdates', adminEmail);
}

// Send booking cancellation notification to vendor (when client cancels)
async function sendBookingCancelledToVendor(vendorEmail, vendorName, clientName, serviceName, eventDate, reason, dashboardUrl, vendorUserId = null, bookingId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('booking_cancelled_vendor', vendorEmail, vendorName, {
    vendorName, clientName, serviceName, eventDate, reason: reason || 'No reason provided', dashboardUrl
  }, vendorUserId, bookingId, null, 'bookingUpdates', adminEmail);
}

// Send vendor application notification to admin
// Also BCC to SMTP_FROM so it appears in the notifications inbox
async function sendVendorApplicationToAdmin(adminEmail, applicantName, businessName, businessEmail, businessPhone, category, dashboardUrl) {
  const smtpFrom = process.env.SMTP_FROM || 'notifications@planbeau.com';
  return sendTemplatedEmail('vendor_application_admin', adminEmail, 'Admin', {
    applicantName, businessName, businessEmail, businessPhone, category, dashboardUrl
  }, null, null, null, 'admin', smtpFrom);
}

// Send welcome email to new vendor after application
// BCC to admin so they know about new vendor applications
async function sendVendorWelcome(vendorEmail, vendorName, businessName, dashboardUrl, userId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('vendor_welcome', vendorEmail, vendorName, {
    vendorName, businessName, dashboardUrl
  }, userId, null, null, 'welcome', adminEmail);
}

// Send booking confirmed notification to client (after payment)
async function sendBookingConfirmedToClient(clientEmail, clientName, vendorName, serviceName, eventDate, eventLocation, dashboardUrl, userId = null, bookingId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('booking_confirmed_client', clientEmail, clientName, {
    clientName, vendorName, serviceName, eventDate, eventLocation: eventLocation || 'TBD', dashboardUrl
  }, userId, bookingId, null, 'bookingUpdates', adminEmail);
}

// Send booking confirmed notification to vendor (after payment)
async function sendBookingConfirmedToVendor(vendorEmail, vendorName, clientName, serviceName, eventDate, eventLocation, dashboardUrl, vendorUserId = null, bookingId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('booking_confirmed_vendor', vendorEmail, vendorName, {
    vendorName, clientName, serviceName, eventDate, eventLocation: eventLocation || 'TBD', dashboardUrl
  }, vendorUserId, bookingId, null, 'bookingUpdates', adminEmail);
}

// Send vendor profile approved notification
async function sendVendorApproved(vendorEmail, vendorName, businessName, dashboardUrl, userId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('vendor_approved', vendorEmail, vendorName, {
    vendorName, businessName, dashboardUrl
  }, userId, null, null, 'vendor', adminEmail);
}

// Send vendor profile rejected notification
async function sendVendorRejected(vendorEmail, vendorName, businessName, rejectionReason, dashboardUrl, userId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('vendor_rejected', vendorEmail, vendorName, {
    vendorName, businessName, rejectionReason, dashboardUrl
  }, userId, null, null, 'vendor', adminEmail);
}

module.exports = {
  sendEmail,
  sendTemplatedEmail,
  sendTwoFactorCode,
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
};
