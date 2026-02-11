const nodemailer = require('nodemailer');
const { poolPromise, sql } = require('../config/db');
const { getUnsubscribeUrl, getPreferencesUrl } = require('./unsubscribeService');
require('dotenv').config();

let transporter = null;

// Email deduplication cooldowns (in minutes) - prevents flooding same email type to same user
const EMAIL_COOLDOWN_MINUTES = {
  // High-velocity emails (2 min cooldown)
  'auth_2fa': 2,
  '2fa': 2,
  'password_reset': 2,
  'message_vendor_to_client': 2,
  'message_client_to_vendor': 2,
  'booking_request_vendor': 2,
  'booking_accepted_client': 2,
  'booking_rejected_client': 2,
  'booking_confirmed_client': 2,
  'booking_confirmed_vendor': 2,
  'booking_cancelled_client': 2,
  'booking_cancelled_vendor': 2,
  'new_support_message': 2,
  'support_message_reply': 2,
  
  // Warning emails (5 min cooldown)
  'policy_warning': 5,
  'violation_warning': 5,
  
  // Account action emails (1 hour cooldown)
  'account_locked': 60,
  'account_unlocked': 60,
  'account_cooldown': 60,
  'account_suspended': 60,
  'account_reactivated': 60,
  
  // Default cooldown
  'default': 2
};

/**
 * Check if an email of this type was recently sent to this recipient
 * @param {string} templateKey - The email template key
 * @param {string} recipientEmail - The recipient's email
 * @param {number} userId - Optional user ID
 * @returns {Object} - { canSend: boolean, lastSentAt: Date|null, cooldownRemaining: number }
 */
async function checkEmailCooldown(templateKey, recipientEmail, userId = null) {
  try {
    const pool = await poolPromise;
    const cooldownMinutes = EMAIL_COOLDOWN_MINUTES[templateKey] || EMAIL_COOLDOWN_MINUTES['default'];
    
    const result = await pool.request()
      .input('TemplateKey', sql.NVarChar(50), templateKey)
      .input('RecipientEmail', sql.NVarChar(255), recipientEmail)
      .input('CooldownMinutes', sql.Int, cooldownMinutes)
      .query(`
        SELECT TOP 1 SentAt 
        FROM admin.EmailLogs 
        WHERE TemplateKey = @TemplateKey 
          AND RecipientEmail = @RecipientEmail 
          AND Status = 'sent'
          AND SentAt > DATEADD(MINUTE, -@CooldownMinutes, GETDATE())
        ORDER BY SentAt DESC
      `);
    
    if (result.recordset.length > 0) {
      const lastSentAt = result.recordset[0].SentAt;
      const cooldownEnd = new Date(lastSentAt.getTime() + cooldownMinutes * 60 * 1000);
      const cooldownRemaining = Math.ceil((cooldownEnd - new Date()) / 1000);
      
      console.log(`[Email] Cooldown active for ${templateKey} to ${recipientEmail}: ${cooldownRemaining}s remaining`);
      return {
        canSend: false,
        lastSentAt,
        cooldownRemaining: Math.max(0, cooldownRemaining)
      };
    }
    
    return { canSend: true, lastSentAt: null, cooldownRemaining: 0 };
  } catch (error) {
    console.error('[Email] Error checking cooldown:', error.message);
    // On error, allow sending to avoid blocking important emails
    return { canSend: true, lastSentAt: null, cooldownRemaining: 0 };
  }
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
    // ALWAYS use production URL for email links - never localhost
    const frontendUrl = 'https://www.planbeau.com';
    
    // Generate unsubscribe and preferences URLs if we have userId
    let unsubscribeUrl = `${frontendUrl}/dashboard/settings`;
    let preferencesUrl = `${frontendUrl}/dashboard/settings`;
    if (userId && recipientEmail) {
      unsubscribeUrl = getUnsubscribeUrl(userId, recipientEmail, emailCategory);
      preferencesUrl = getPreferencesUrl(userId, recipientEmail);
    }
    
    // Always use production URL for logo in emails (email clients need absolute public URLs)
    const productionUrl = 'https://www.planbeau.com';
    
    const platformVars = {
      platformName: process.env.PLATFORM_NAME || 'PlanBeau',
      platformUrl: process.env.PLATFORM_URL || 'planbeau.com',
      frontendUrl: frontendUrl,
      logoUrl: `${productionUrl}/images/logo.png`,
      faviconUrl: `${productionUrl}/planbeau_fav_icon.png`,
      currentYear: new Date().getFullYear().toString(),
      recipientEmail,
      unsubscribeUrl,
      preferencesUrl,
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
async function sendEmail({ to, subject, text, html, from, templateKey = null, emailCategory = null, attachments = null }) {
  // Get the appropriate sender email
  const senderEmail = from || getSenderEmail(templateKey, emailCategory);
  
  let emailSent = false;

  // Try Brevo REST API first (proper BCC support)
  try {
    await sendViaBrevoAPI(to, subject, html, text, senderEmail, null, attachments);
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
        const mailOptions = { 
          from: senderEmail, 
          to, 
          bcc: senderEmail, // BCC to sender so it appears in Zoho inbox
          subject, 
          text, 
          html 
        };
        // Add attachments for SMTP (nodemailer format)
        if (attachments && attachments.length > 0) {
          mailOptions.attachments = attachments.map(att => ({
            filename: att.name,
            content: Buffer.from(att.content, 'base64')
          }));
        }
        await t.sendMail(mailOptions);
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

async function sendBookingRequestToVendor(vendorEmail, vendorName, clientName, serviceName, eventDate, location, total, dashboardUrl, vendorUserId = null, bookingId = null, eventTime = null, requestedAt = null, timezone = null, clientProfilePic = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  const requestedAtFormatted = requestedAt || new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  const timezoneDisplay = timezone || 'Local Time';
  const clientInitial = clientName ? clientName.charAt(0).toUpperCase() : 'C';
  const clientAvatarHtml = clientProfilePic 
    ? `<img src="${clientProfilePic}" alt="${clientName}" style="width:48px;height:48px;border-radius:50%;object-fit:cover">`
    : `<div style="width:48px;height:48px;background-color:#222222;border-radius:50%;text-align:center;line-height:48px;color:#ffffff;font-weight:600;font-size:18px">${clientInitial}</div>`;
  return sendTemplatedEmail('booking_request_vendor', vendorEmail, vendorName, {
    vendorName, clientName, serviceName, eventDate, eventTime: eventTime ? `${eventTime} (${timezoneDisplay})` : 'TBD', location: location || 'TBD', budget: total, dashboardUrl, requestedAt: requestedAtFormatted, timezone: timezoneDisplay, clientAvatarHtml
  }, vendorUserId, bookingId, null, 'bookingUpdates', adminEmail);
}

async function sendBookingAcceptedToClient(clientEmail, clientName, vendorName, serviceName, dashboardUrl, userId = null, bookingId = null, eventDate = null, eventTime = null, location = null, amount = null, timezone = null, vendorProfilePic = null, paymentUrl = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  const timezoneDisplay = timezone || 'Local Time';
  const vendorInitial = vendorName ? vendorName.charAt(0).toUpperCase() : 'V';
  const vendorAvatarHtml = vendorProfilePic 
    ? `<img src="${vendorProfilePic}" alt="${vendorName}" style="width:48px;height:48px;border-radius:50%;object-fit:cover">`
    : `<div style="width:48px;height:48px;background-color:#222222;border-radius:50%;text-align:center;line-height:48px;color:#ffffff;font-weight:600;font-size:18px">${vendorInitial}</div>`;
  
  // Generate payment button HTML if payment URL is provided
  const paymentButtonHtml = paymentUrl 
    ? `<div style="text-align:center;margin:24px 0"><a href="${paymentUrl}" style="display:inline-block;background:#222222;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Pay Now</a></div>`
    : '';
  
  return sendTemplatedEmail('booking_accepted_client', clientEmail, clientName, {
    clientName, vendorName, serviceName, dashboardUrl, bookingId, eventDate: eventDate || 'TBD', eventTime: eventTime ? `${eventTime} (${timezoneDisplay})` : 'TBD', location: location || 'TBD', amount: amount || 'TBD', timezone: timezoneDisplay, vendorAvatarHtml, paymentUrl: paymentUrl || dashboardUrl, paymentButtonHtml
  }, userId, bookingId, null, 'bookingUpdates', adminEmail);
}

async function sendBookingRejectedToClient(clientEmail, clientName, vendorName, serviceName, eventDate, searchUrl, userId = null, bookingId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('booking_rejected_client', clientEmail, clientName, {
    clientName, vendorName, serviceName, eventDate, searchUrl
  }, userId, bookingId, null, 'bookingUpdates', adminEmail);
}

async function sendMessageFromVendor(clientEmail, clientName, vendorName, messageContent, dashboardUrl, userId = null, senderProfilePic = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  const vendorInitial = vendorName ? vendorName.charAt(0).toUpperCase() : 'V';
  const messageTime = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  // Generate avatar HTML - use profile pic if available, otherwise use initial
  const senderAvatarHtml = senderProfilePic 
    ? `<img src="${senderProfilePic}" alt="${vendorName}" style="width:48px;height:48px;border-radius:50%;object-fit:cover">`
    : `<div style="width:48px;height:48px;background-color:#222222;border-radius:50%;text-align:center;line-height:48px;color:#ffffff;font-weight:600;font-size:18px">${vendorInitial}</div>`;
  return sendTemplatedEmail('message_vendor_to_client', clientEmail, clientName, {
    clientName, vendorName, messageContent, dashboardUrl, vendorInitial, messageTime, senderAvatarHtml
  }, userId, null, null, 'messages', adminEmail);
}

async function sendMessageFromClient(vendorEmail, vendorName, clientName, messageContent, dashboardUrl, vendorUserId = null, senderProfilePic = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  const clientInitial = clientName ? clientName.charAt(0).toUpperCase() : 'C';
  const messageTime = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  // Generate avatar HTML - use profile pic if available, otherwise use initial
  const senderAvatarHtml = senderProfilePic 
    ? `<img src="${senderProfilePic}" alt="${clientName}" style="width:48px;height:48px;border-radius:50%;object-fit:cover">`
    : `<div style="width:48px;height:48px;background-color:#222222;border-radius:50%;text-align:center;line-height:48px;color:#ffffff;font-weight:600;font-size:18px">${clientInitial}</div>`;
  return sendTemplatedEmail('message_client_to_vendor', vendorEmail, vendorName, {
    vendorName, clientName, messageContent, dashboardUrl, clientInitial, messageTime, senderAvatarHtml
  }, vendorUserId, null, null, 'messages', adminEmail);
}

async function sendPaymentReceivedToVendor(vendorEmail, vendorName, clientName, amount, serviceName, eventDate, dashboardUrl, vendorUserId = null, bookingId = null, invoiceUrl = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('payment_received_vendor', vendorEmail, vendorName, {
    vendorName, clientName, amount, serviceName, eventDate, dashboardUrl, invoiceUrl: invoiceUrl || dashboardUrl
  }, vendorUserId, bookingId, null, 'payments', adminEmail, null);
}

// Send payment confirmation to client with invoice URL link
async function sendPaymentConfirmationToClient(clientEmail, clientName, vendorName, amount, serviceName, eventDate, dashboardUrl, userId = null, bookingId = null, invoiceUrl = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('payment_confirmation_client', clientEmail, clientName, {
    clientName, vendorName, amount, serviceName, eventDate, dashboardUrl, invoiceUrl: invoiceUrl || dashboardUrl
  }, userId, bookingId, null, 'payments', adminEmail, null);
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
// incompleteSections is an array of section names that are still incomplete
async function sendVendorWelcome(vendorEmail, vendorName, businessName, dashboardUrl, userId = null, incompleteSections = []) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  
  // Format incomplete sections for email - clean white background with subtle styling
  let incompleteMessage = '';
  if (incompleteSections && incompleteSections.length > 0) {
    incompleteMessage = `<div style="background:#f8f9fa;padding:20px;border-radius:8px;border:1px solid #e9ecef;margin:20px 0 0 0"><p style="color:#495057;margin:0 0 12px;font-weight:600;font-size:14px">To complete your profile:</p>${incompleteSections.map(s => `<p style="color:#6c757d;margin:4px 0;font-size:14px">• ${s}</p>`).join('')}</div>`;
  }
  
  return sendTemplatedEmail('vendor_welcome', vendorEmail, vendorName, {
    vendorName, businessName, dashboardUrl, incompleteMessage
  }, userId, null, null, 'welcome', adminEmail);
}

// Send booking confirmed notification to client (after payment)
async function sendBookingConfirmedToClient(clientEmail, clientName, vendorName, serviceName, eventDate, eventLocation, dashboardUrl, userId = null, bookingId = null, eventTime = null, timezone = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  const timezoneDisplay = timezone || 'Local Time';
  return sendTemplatedEmail('booking_confirmed_client', clientEmail, clientName, {
    clientName, vendorName, serviceName, eventDate, eventTime: eventTime ? `${eventTime} (${timezoneDisplay})` : 'TBD', location: eventLocation || 'TBD', dashboardUrl, timezone: timezoneDisplay
  }, userId, bookingId, null, 'bookingUpdates', adminEmail);
}

// Send booking confirmed notification to vendor (after payment)
async function sendBookingConfirmedToVendor(vendorEmail, vendorName, clientName, serviceName, eventDate, eventLocation, dashboardUrl, vendorUserId = null, bookingId = null, eventTime = null, timezone = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  const timezoneDisplay = timezone || 'Local Time';
  return sendTemplatedEmail('booking_confirmed_vendor', vendorEmail, vendorName, {
    vendorName, clientName, serviceName, eventDate, eventTime: eventTime ? `${eventTime} (${timezoneDisplay})` : 'TBD', location: eventLocation || 'TBD', dashboardUrl, timezone: timezoneDisplay
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

// Send welcome email to new client after registration
async function sendClientWelcome(clientEmail, clientName, searchUrl, dashboardUrl, userId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('client_welcome', clientEmail, clientName, {
    clientName, searchUrl, dashboardUrl
  }, userId, null, null, 'welcome', adminEmail);
}

// Send welcome email to existing client who becomes a vendor
async function sendClientToVendorWelcome(vendorEmail, vendorName, businessName, dashboardUrl, userId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('client_to_vendor', vendorEmail, vendorName, {
    vendorName, businessName, dashboardUrl
  }, userId, null, null, 'welcome', adminEmail);
}

// Send event reminder email (for upcoming bookings)
async function sendEventReminder(recipientEmail, recipientName, daysUntilEvent, serviceName, eventDate, eventTime, location, otherPartyLabel, otherPartyName, userId = null, bookingId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('event_reminder', recipientEmail, recipientName, {
    recipientName, daysUntilEvent, serviceName, eventDate, eventTime: eventTime || 'TBD', location: location || 'TBD', otherPartyLabel, otherPartyName
  }, userId, bookingId, null, 'bookingReminders', adminEmail);
}

// Send booking action reminder (for pending approvals, payments, etc)
async function sendBookingActionReminder(recipientEmail, recipientName, actionMessage, actionSubject, serviceName, eventDate, otherPartyLabel, otherPartyName, actionUrl, actionButtonText, userId = null, bookingId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('booking_action_reminder', recipientEmail, recipientName, {
    recipientName, actionMessage, actionSubject, serviceName, eventDate, otherPartyLabel, otherPartyName, actionUrl, actionButtonText
  }, userId, bookingId, null, 'bookingReminders', adminEmail);
}

// Send analytics summary email to vendor
async function sendAnalyticsSummary(vendorEmail, vendorName, periodLabel, periodRange, profileViews, profileViewsChange, totalBookings, bookingsChange, totalRevenue, revenueChange, conversionRate, userId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('analytics_summary', vendorEmail, vendorName, {
    vendorName, periodLabel, periodRange, profileViews, profileViewsChange, totalBookings, bookingsChange, totalRevenue, revenueChange, conversionRate
  }, userId, null, null, 'promotions', adminEmail);
}

// Send account suspended notification
async function sendAccountSuspended(userEmail, userName, suspensionReason, userId = null) {
  return sendTemplatedEmail('account_suspended', userEmail, userName, {
    userName, suspensionReason
  }, userId, null, null, 'admin', null);
}

// Send account reactivated notification
async function sendAccountReactivated(userEmail, userName, userId = null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@planbeau.com';
  return sendTemplatedEmail('account_reactivated', userEmail, userName, {
    userName
  }, userId, null, null, 'admin', adminEmail);
}

// Send support message notification to user (when support team replies)
// BCC to admin@planbeau.com for all support emails
async function sendSupportMessageToUser(userEmail, userName, messagePreview, dashboardUrl, userId = null) {
  const adminBcc = 'admin@planbeau.com';
  return sendTemplatedEmail('support_message_received', userEmail, userName, {
    userName, messagePreview, dashboardUrl
  }, userId, null, null, 'support', adminBcc);
}

// Send new support message notification to support team (when user sends message)
// BCC to admin@planbeau.com for all support emails
async function sendNewSupportMessageToTeam(supportEmail, userName, userEmail, conversationId, messagePreview, adminUrl) {
  const adminBcc = 'admin@planbeau.com';
  return sendTemplatedEmail('new_support_message', supportEmail, 'Support Team', {
    userName, userEmail, conversationId, messagePreview, adminUrl
  }, null, null, null, 'support', adminBcc);
}

// Send account locked notification due to chat violations
async function sendAccountLockedEmail(userEmail, userName, lockReason, lockType, userId = null) {
  // Check cooldown before sending
  const cooldownCheck = await checkEmailCooldown('account_locked', userEmail, userId);
  if (!cooldownCheck.canSend) {
    console.log(`[Email] Skipping account locked email - cooldown active (${cooldownCheck.cooldownRemaining}s remaining)`);
    return { skipped: true, reason: 'cooldown', cooldownRemaining: cooldownCheck.cooldownRemaining };
  }
  
  const supportEmail = process.env.EMAIL_SUPPORT || 'support@planbeau.com';
  const adminBcc = 'admin@planbeau.com';
  
  // Format lock type for display
  const lockTypeDisplay = {
    'chat_violation': 'Chat Policy Violation',
    'failed_login': 'Security - Failed Login Attempts',
    'admin_manual': 'Administrative Action',
    'suspicious_activity': 'Suspicious Activity Detected'
  };
  
  const lockTypeText = lockTypeDisplay[lockType] || 'Policy Violation';
  
  return sendTemplatedEmail('account_locked', userEmail, userName, {
    userName,
    lockReason,
    lockType: lockTypeText,
    supportEmail,
    supportUrl: 'https://www.planbeau.com/support'
  }, userId, null, null, 'admin', adminBcc);
}

// Send account unlocked notification
async function sendAccountUnlockedEmail(userEmail, userName, unlockReason, userId = null) {
  const adminBcc = 'admin@planbeau.com';
  return sendTemplatedEmail('account_unlocked', userEmail, userName, {
    userName,
    unlockReason: unlockReason || 'Your account has been reviewed and unlocked.',
    dashboardUrl: 'https://www.planbeau.com/dashboard'
  }, userId, null, null, 'admin', adminBcc);
}

// Send policy warning email for chat violations (before account lock)
async function sendPolicyWarningEmail(userEmail, userName, violationType, violationCount, userId = null) {
  // Check cooldown before sending
  const cooldownCheck = await checkEmailCooldown('policy_warning', userEmail, userId);
  if (!cooldownCheck.canSend) {
    console.log(`[Email] Skipping policy warning email - cooldown active (${cooldownCheck.cooldownRemaining}s remaining)`);
    return { skipped: true, reason: 'cooldown', cooldownRemaining: cooldownCheck.cooldownRemaining };
  }
  
  const supportEmail = process.env.EMAIL_SUPPORT || 'support@planbeau.com';
  const adminBcc = 'admin@planbeau.com';
  
  // Format violation type for display
  const violationTypeDisplay = {
    'profanity': 'Use of inappropriate language',
    'email': 'Sharing contact information (email)',
    'phone': 'Sharing contact information (phone number)',
    'solicitation': 'Attempting to conduct business outside the platform',
    'racism': 'Use of discriminatory language'
  };
  
  const violationText = violationTypeDisplay[violationType] || 'Policy violation';
  
  // Determine warning level based on violation count
  const isSecondWarning = violationCount >= 2;
  const subject = isSecondWarning 
    ? 'Second Warning: Your Message Was Blocked - Planbeau'
    : 'Warning: Your Message Was Blocked - Planbeau';
  
  const warningMessage = isSecondWarning
    ? `This is your second warning. Your account will be locked if you continue to violate our community guidelines.`
    : `This is a warning. Continued violations may result in your account being suspended.`;
  
  // Build HTML content using existing email patterns
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #D4A574 0%, #C4956A 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Message Blocked</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #333;">Hi ${userName},</p>
        <p style="font-size: 16px; color: #333;">Your recent message could not be sent because it violated our community guidelines.</p>
        
        <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold; color: #856404;">Violation Type: ${violationText}</p>
          <p style="margin: 10px 0 0 0; color: #856404;">${warningMessage}</p>
        </div>
        
        <p style="font-size: 16px; color: #333;">At Planbeau, we're committed to maintaining a safe and professional environment for all users. Please review our <a href="https://www.planbeau.com/community-guidelines" style="color: #D4A574;">Community Guidelines</a> to ensure your future messages comply with our policies.</p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">If you believe this was a mistake, please contact our support team at <a href="mailto:${supportEmail}" style="color: #D4A574;">${supportEmail}</a>.</p>
        
        <p style="font-size: 16px; color: #333; margin-top: 20px;">Thank you for your understanding,<br><strong>The Planbeau Team</strong></p>
      </div>
    </div>
  `;
  
  const textContent = `
Hi ${userName},

Your recent message could not be sent because it violated our community guidelines.

Violation Type: ${violationText}
${warningMessage}

At Planbeau, we're committed to maintaining a safe and professional environment for all users. Please review our Community Guidelines at https://www.planbeau.com/community-guidelines.

If you believe this was a mistake, please contact our support team at ${supportEmail}.

Thank you for your understanding,
The Planbeau Team
  `;
  
  // Log the email before sending
  await logEmail('policy_warning', userEmail, userName, subject, 'pending', null, userId, null, { violationType, violationCount });
  
  try {
    await sendEmail({ 
      to: userEmail, 
      subject, 
      html: htmlContent, 
      text: textContent,
      templateKey: 'policy_warning',
      emailCategory: 'admin'
    });
    
    // Update log to sent
    await logEmail('policy_warning', userEmail, userName, subject, 'sent', null, userId, null, { violationType, violationCount }, htmlContent);
    console.log(`[Email] Policy warning email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error(`[Email] Failed to send policy warning email to ${userEmail}:`, error.message);
    await logEmail('policy_warning', userEmail, userName, subject, 'failed', error.message, userId, null, { violationType, violationCount });
    return { success: false, error: error.message };
  }
}

/**
 * Send chat summary email when support chat ends
 * @param {string} recipientEmail - Email to send summary to
 * @param {string} recipientName - Name of the recipient
 * @param {string} referenceNumber - Chat reference number
 * @param {string} subject - Chat subject
 * @param {string} category - Support category
 * @param {Array} messages - Array of chat messages
 * @param {boolean} isGuest - Whether this is a guest user
 */
async function sendChatSummaryEmail(recipientEmail, recipientName, referenceNumber, subject, category, messages, isGuest = false) {
  if (!recipientEmail) {
    console.log('[Email] No recipient email provided for chat summary');
    return { success: false, error: 'No email provided' };
  }
  
  const supportEmail = process.env.EMAIL_SUPPORT || 'support@planbeau.com';
  const emailSubject = `Your Support Chat Summary - ${referenceNumber}`;
  
  // Format messages for email
  const formattedMessages = messages.map(msg => {
    const senderName = msg.SenderType === 'support' ? 'Planbeau Support' : 
                       msg.SenderType === 'guest' ? recipientName : 
                       msg.SenderName || 'You';
    const time = new Date(msg.CreatedAt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    });
    const isSupport = msg.SenderType === 'support';
    
    return `
      <div style="margin-bottom: 16px; padding: 12px; background: ${isSupport ? '#f0f4ff' : '#f9fafb'}; border-radius: 8px; border-left: 3px solid ${isSupport ? '#5e72e4' : '#d1d5db'};">
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
          <strong>${senderName}</strong> • ${time}
        </div>
        <div style="font-size: 14px; color: #374151; white-space: pre-wrap;">${msg.Content}</div>
      </div>
    `;
  }).join('');
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #5e72e4 0%, #4c63d2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">💬 Chat Summary</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Reference: ${referenceNumber}</p>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #333;">Hi ${recipientName},</p>
        <p style="font-size: 16px; color: #333;">Thank you for contacting Planbeau Support. Here's a summary of your conversation:</p>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Subject:</strong> ${subject}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Category:</strong> ${category}</p>
          <p style="margin: 0; font-size: 14px;"><strong>Reference:</strong> ${referenceNumber}</p>
        </div>
        
        <h3 style="font-size: 16px; color: #111; margin: 24px 0 16px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Conversation</h3>
        ${formattedMessages}
        
        <div style="background: #FFF9E6; border-left: 4px solid #F59E0B; padding: 15px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #92400E;">
            <strong>Need more help?</strong><br>
            Reply to this email or start a new chat at <a href="https://www.planbeau.com" style="color: #5e72e4;">planbeau.com</a>. 
            Use your reference number <strong>${referenceNumber}</strong> to continue this conversation.
          </p>
        </div>
        
        <p style="font-size: 16px; color: #333; margin-top: 20px;">Thank you for choosing Planbeau!<br><strong>The Planbeau Support Team</strong></p>
      </div>
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Planbeau. All rights reserved.</p>
      </div>
    </div>
  `;
  
  const textContent = `
Hi ${recipientName},

Thank you for contacting Planbeau Support. Here's a summary of your conversation:

Subject: ${subject}
Category: ${category}
Reference: ${referenceNumber}

--- Conversation ---
${messages.map(msg => {
  const senderName = msg.SenderType === 'support' ? 'Planbeau Support' : 
                     msg.SenderType === 'guest' ? recipientName : 
                     msg.SenderName || 'You';
  const time = new Date(msg.CreatedAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
  });
  return `[${senderName} - ${time}]\n${msg.Content}\n`;
}).join('\n')}

Need more help? Reply to this email or start a new chat at planbeau.com.
Use your reference number ${referenceNumber} to continue this conversation.

Thank you for choosing Planbeau!
The Planbeau Support Team
  `;
  
  // Create text file attachment with full conversation transcript
  const transcriptContent = `PLANBEAU SUPPORT CHAT TRANSCRIPT
================================
Reference: ${referenceNumber}
Subject: ${subject}
Category: ${category}
Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Recipient: ${recipientName} (${recipientEmail})

================================
CONVERSATION
================================

${messages.map(msg => {
  const senderName = msg.SenderType === 'support' ? 'Planbeau Support' : 
                     msg.SenderType === 'guest' ? recipientName : 
                     msg.SenderName || 'User';
  const time = new Date(msg.CreatedAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
  });
  return `[${time}] ${senderName}:\n${msg.Content}\n`;
}).join('\n---\n\n')}

================================
END OF TRANSCRIPT
================================

Need more help? Reply to this email or start a new chat at planbeau.com.
Use your reference number ${referenceNumber} to continue this conversation.

Thank you for choosing Planbeau!
`;

  // Base64 encode the transcript for Brevo API
  const transcriptBase64 = Buffer.from(transcriptContent).toString('base64');
  const attachments = [{
    name: `chat-transcript-${referenceNumber}.txt`,
    content: transcriptBase64
  }];
  
  try {
    await sendEmail({ 
      to: recipientEmail, 
      subject: emailSubject, 
      html: htmlContent, 
      text: textContent,
      templateKey: 'chat_summary',
      emailCategory: 'support',
      attachments
    });
    
    console.log(`[Email] Chat summary email sent to ${recipientEmail} with transcript attachment`);
    return { success: true };
  } catch (error) {
    console.error(`[Email] Failed to send chat summary email to ${recipientEmail}:`, error.message);
    return { success: false, error: error.message };
  }
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
  sendVendorRejected,
  sendClientWelcome,
  sendClientToVendorWelcome,
  sendEventReminder,
  sendBookingActionReminder,
  sendAnalyticsSummary,
  sendAccountSuspended,
  sendAccountReactivated,
  sendSupportMessageToUser,
  sendNewSupportMessageToTeam,
  sendAccountLockedEmail,
  sendAccountUnlockedEmail,
  sendPolicyWarningEmail,
  sendChatSummaryEmail,
  checkEmailCooldown,
  renderEmailPreview
};

// Render email preview without sending - for admin preview functionality
async function renderEmailPreview(templateKey, variables = {}) {
  try {
    // Auto-inject platform variables
    const frontendUrl = 'https://www.planbeau.com';
    const productionUrl = 'https://www.planbeau.com';
    
    const platformVars = {
      platformName: process.env.PLATFORM_NAME || 'PlanBeau',
      platformUrl: process.env.PLATFORM_URL || 'planbeau.com',
      frontendUrl: frontendUrl,
      logoUrl: `${productionUrl}/images/logo.png`,
      faviconUrl: `${productionUrl}/planbeau_fav_icon.png`,
      currentYear: new Date().getFullYear().toString(),
      unsubscribeUrl: '#',
      preferencesUrl: '#',
      ...variables
    };

    // Get template from database
    const template = await getEmailTemplate(templateKey);
    
    // Replace variables in subject and HTML
    const subject = replaceVariables(template.subject, platformVars);
    const html = replaceVariables(template.htmlContent, platformVars);

    return {
      subject,
      htmlBody: html,
      templateName: template.templateName
    };
  } catch (error) {
    console.error('Error rendering email preview:', error);
    throw error;
  }
}
