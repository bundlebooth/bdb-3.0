const nodemailer = require('nodemailer');
const sql = require('mssql');
require('dotenv').config();

let transporter = null;

// Create Brevo SMTP transporter
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
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
    const pool = await sql.connect();
    const result = await pool.request()
      .input('TemplateKey', sql.NVarChar(50), templateKey)
      .execute('sp_GetEmailTemplate');
    
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
    const pool = await sql.connect();
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .query('SELECT NotificationPreferences FROM Users WHERE UserID = @UserID');
    
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
  
  if (!userId) return true; // If no userId, send (e.g., to vendors not logged in)
  
  const prefs = await getUserPreferences(userId);
  if (!prefs || !prefs.email) return true; // Default to sending if no preferences
  
  // Map email categories to preference keys
  const categoryMap = {
    'bookingUpdates': prefs.email.bookingUpdates !== false,
    'messages': prefs.email.messages !== false,
    'payments': prefs.email.payments !== false,
    'marketing': prefs.email.marketing === true
  };
  
  return categoryMap[emailCategory] !== false;
}

// Log email to database
async function logEmail(templateKey, recipientEmail, recipientName, subject, status, errorMessage = null, userId = null, bookingId = null, metadata = null) {
  try {
    const pool = await sql.connect();
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
      .execute('sp_LogEmail');
  } catch (error) {
    console.error('Error logging email:', error);
  }
}

// Send email using template
async function sendTemplatedEmail(templateKey, recipientEmail, recipientName, variables, userId = null, bookingId = null, metadata = null, emailCategory = null) {
  try {
    // Check user preferences before sending
    if (emailCategory && userId) {
      const canSend = await canSendEmail(userId, emailCategory);
      if (!canSend) {
        console.log(`📧 Email blocked by user preferences: ${templateKey} to ${recipientEmail} (category: ${emailCategory})`);
        await logEmail(templateKey, recipientEmail, recipientName, 'Blocked by preferences', 'pending', 'User disabled this email type', userId, bookingId, metadata);
        return;
      }
    }

    // Auto-inject platform variables
    const platformVars = {
      platformName: process.env.PLATFORM_NAME || 'VenueVue',
      platformUrl: process.env.PLATFORM_URL || 'venuevue.com',
      currentYear: new Date().getFullYear().toString(),
      recipientEmail,
      ...variables
    };

    // Get template from database
    const template = await getEmailTemplate(templateKey);
    
    // Replace variables in subject, HTML, and text
    const subject = replaceVariables(template.subject, platformVars);
    const html = replaceVariables(template.htmlContent, platformVars);
    const text = replaceVariables(template.textContent, platformVars);

    // Send via Brevo
    const t = getTransporter();
    if (!t) {
      console.log('Email not configured; would send:', { to: recipientEmail, subject, templateKey });
      await logEmail(templateKey, recipientEmail, recipientName, subject, 'failed', 'SMTP not configured', userId, bookingId, metadata);
      return;
    }

    const fromAddr = process.env.SMTP_FROM || 'no-reply@venuevue.com';
    await t.sendMail({ from: fromAddr, to: recipientEmail, subject, text, html });
    
    // Log success
    await logEmail(templateKey, recipientEmail, recipientName, subject, 'sent', null, userId, bookingId, metadata);
    
    console.log(`✅ Email sent: ${templateKey} to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending templated email:', error);
    await logEmail(templateKey, recipientEmail, recipientName, 'Error', 'failed', error.message, userId, bookingId, metadata);
    throw error;
  }
}

// Direct send (for non-templated emails)
async function sendEmail({ to, subject, text, html, from }) {
  const t = getTransporter();
  if (!t) {
    console.log('Email not configured; would send:', { to, subject, text });
    return;
  }
  const fromAddr = from || process.env.SMTP_FROM || 'no-reply@venuevue.com';
  await t.sendMail({ from: fromAddr, to, subject, text, html });
}

// =============================================
// HELPER FUNCTIONS FOR COMMON EMAIL TYPES
// =============================================

async function sendTwoFactorCode(email, code, userName = 'User', userId = null) {
  return sendTemplatedEmail('auth_2fa', email, userName, { code, userName }, userId, null, null, '2fa');
}

async function sendBookingRequestToVendor(vendorEmail, vendorName, clientName, serviceName, eventDate, location, budget, dashboardUrl, vendorUserId = null, bookingId = null) {
  return sendTemplatedEmail('booking_request_vendor', vendorEmail, vendorName, {
    vendorName, clientName, serviceName, eventDate, location, budget, dashboardUrl
  }, vendorUserId, bookingId, null, 'bookingUpdates');
}

async function sendBookingAcceptedToClient(clientEmail, clientName, vendorName, serviceName, dashboardUrl, userId = null, bookingId = null) {
  return sendTemplatedEmail('booking_accepted_client', clientEmail, clientName, {
    clientName, vendorName, serviceName, dashboardUrl
  }, userId, bookingId, null, 'bookingUpdates');
}

async function sendBookingRejectedToClient(clientEmail, clientName, vendorName, serviceName, eventDate, searchUrl, userId = null, bookingId = null) {
  return sendTemplatedEmail('booking_rejected_client', clientEmail, clientName, {
    clientName, vendorName, serviceName, eventDate, searchUrl
  }, userId, bookingId, null, 'bookingUpdates');
}

async function sendMessageFromVendor(clientEmail, clientName, vendorName, messageContent, dashboardUrl, userId = null) {
  return sendTemplatedEmail('message_vendor_to_client', clientEmail, clientName, {
    clientName, vendorName, messageContent, dashboardUrl
  }, userId, null, null, 'messages');
}

async function sendMessageFromClient(vendorEmail, vendorName, clientName, messageContent, dashboardUrl, vendorUserId = null) {
  return sendTemplatedEmail('message_client_to_vendor', vendorEmail, vendorName, {
    vendorName, clientName, messageContent, dashboardUrl
  }, vendorUserId, null, null, 'messages');
}

async function sendPaymentReceivedToVendor(vendorEmail, vendorName, clientName, amount, serviceName, eventDate, dashboardUrl, vendorUserId = null, bookingId = null) {
  return sendTemplatedEmail('payment_received_vendor', vendorEmail, vendorName, {
    vendorName, clientName, amount, serviceName, eventDate, dashboardUrl
  }, vendorUserId, bookingId, null, 'payments');
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
  sendPaymentReceivedToVendor
};
