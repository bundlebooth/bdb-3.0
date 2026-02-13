/**
 * Unsubscribe Service
 * Handles email unsubscribe functionality including token generation,
 * URL creation, and preference updates.
 */

const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/db');
require('dotenv').config();

// Default preferences structure
const DEFAULT_PREFERENCES = {
  email: {
    bookingConfirmations: true,
    bookingReminders: true,
    bookingUpdates: true,
    messages: true,
    payments: true,
    promotions: true,
    newsletter: true
  },
  push: {
    bookingUpdates: true,
    messages: true,
    promotions: false
  }
};

/**
 * Generate a JWT token for unsubscribe functionality
 * @param {number} userId - User ID
 * @param {string} email - User email
 * @returns {string} JWT token
 */
function generateUnsubscribeToken(userId, email) {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const payload = { userId, email, purpose: 'unsubscribe' };
  return jwt.sign(payload, secret, { expiresIn: '30d' });
}

/**
 * Verify an unsubscribe token
 * @param {string} token - JWT token to verify
 * @returns {object|null} Decoded payload or null if invalid
 */
function verifyUnsubscribeToken(token) {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret);
    if (decoded.purpose !== 'unsubscribe') {
      return null;
    }
    return decoded;
  } catch (error) {
    console.error('[UnsubscribeService] Token verification failed:', error.message);
    return null;
  }
}

/**
 * Generate unsubscribe URL for a user
 * @param {number} userId - User ID
 * @param {string} email - User email
 * @param {string} category - Optional email category to unsubscribe from
 * @returns {string} Full unsubscribe URL
 */
function getUnsubscribeUrl(userId, email, category = null) {
  const token = generateUnsubscribeToken(userId, email);
  // ALWAYS use production URL for email links - never localhost
  const frontendUrl = 'https://www.planbeau.com';
  let url = `${frontendUrl}/unsubscribe/${token}`;
  if (category) {
    url += `?category=${category}`;
  }
  return url;
}

/**
 * Generate preferences management URL
 * @param {number} userId - User ID
 * @param {string} email - User email
 * @returns {string} Full preferences URL
 */
function getPreferencesUrl(userId, email) {
  const token = generateUnsubscribeToken(userId, email);
  // ALWAYS use production URL for email links - never localhost
  const frontendUrl = 'https://www.planbeau.com';
  return `${frontendUrl}/email-preferences/${token}`;
}

/**
 * Get user's current notification preferences
 * @param {number} userId - User ID
 * @returns {object} User preferences or defaults
 */
async function getUserPreferences(userId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT NotificationPreferences FROM users.Users WHERE UserID = @userId');
    
    if (result.recordset.length === 0) {
      return DEFAULT_PREFERENCES;
    }
    
    const prefsString = result.recordset[0].NotificationPreferences;
    if (!prefsString) {
      return DEFAULT_PREFERENCES;
    }
    
    try {
      const prefs = JSON.parse(prefsString);
      // Merge with defaults to ensure all keys exist
      return {
        email: { ...DEFAULT_PREFERENCES.email, ...(prefs.email || {}) },
        push: { ...DEFAULT_PREFERENCES.push, ...(prefs.push || {}) }
      };
    } catch (parseError) {
      return DEFAULT_PREFERENCES;
    }
  } catch (error) {
    console.error('[UnsubscribeService] Error getting preferences:', error.message);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Update user's notification preferences
 * @param {number} userId - User ID
 * @param {object} preferences - New preferences object
 * @returns {boolean} Success status
 */
async function updateUserPreferences(userId, preferences) {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('preferences', sql.NVarChar(sql.MAX), JSON.stringify(preferences))
      .query('UPDATE users.Users SET NotificationPreferences = @preferences WHERE UserID = @userId');
    return true;
  } catch (error) {
    console.error('[UnsubscribeService] Error updating preferences:', error.message);
    return false;
  }
}

/**
 * Unsubscribe user from a specific category or all emails
 * @param {number} userId - User ID
 * @param {string} category - Optional category to unsubscribe from (null = all)
 * @returns {object} Result with success status and updated preferences
 */
async function unsubscribeUser(userId, category = null) {
  try {
    const currentPrefs = await getUserPreferences(userId);
    const pool = await poolPromise;
    
    if (category) {
      // Unsubscribe from specific category
      const categoryMap = {
        'booking': ['bookingConfirmations', 'bookingReminders', 'bookingUpdates'],
        'bookingConfirmations': ['bookingConfirmations'],
        'bookingReminders': ['bookingReminders'],
        'bookingUpdates': ['bookingUpdates'],
        'messages': ['messages'],
        'payments': ['payments'],
        'promotions': ['promotions'],
        'newsletter': ['newsletter'],
        'marketing': ['promotions', 'newsletter'],
        'all': Object.keys(currentPrefs.email)
      };
      
      const keysToDisable = categoryMap[category] || [category];
      keysToDisable.forEach(key => {
        if (currentPrefs.email.hasOwnProperty(key)) {
          currentPrefs.email[key] = false;
        }
      });
      
      // If unsubscribing from all, mark in database
      if (category === 'all') {
        await pool.request()
          .input('userId', sql.Int, userId)
          .query('UPDATE users.Users SET UnsubscribedFromAll = 1, UnsubscribedAt = GETUTCDATE() WHERE UserID = @userId');
      }
    } else {
      // Unsubscribe from all marketing/promotional emails
      currentPrefs.email.promotions = false;
      currentPrefs.email.newsletter = false;
    }
    
    const success = await updateUserPreferences(userId, currentPrefs);
    return { success, preferences: currentPrefs };
  } catch (error) {
    console.error('[UnsubscribeService] Error unsubscribing user:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Resubscribe user to emails
 * @param {number} userId - User ID
 * @returns {object} Result with success status
 */
async function resubscribeUser(userId) {
  try {
    const pool = await poolPromise;
    
    // Reset to default preferences
    await updateUserPreferences(userId, DEFAULT_PREFERENCES);
    
    // Clear unsubscribe flags
    await pool.request()
      .input('userId', sql.Int, userId)
      .query('UPDATE users.Users SET UnsubscribedFromAll = 0, UnsubscribedAt = NULL WHERE UserID = @userId');
    
    return { success: true, preferences: DEFAULT_PREFERENCES };
  } catch (error) {
    console.error('[UnsubscribeService] Error resubscribing user:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Process unsubscribe request from token
 * @param {string} token - Unsubscribe token
 * @param {string} category - Optional category
 * @returns {object} Result with success, user info, and preferences
 */
async function processUnsubscribe(token, category = null) {
  const decoded = verifyUnsubscribeToken(token);
  if (!decoded) {
    return { success: false, error: 'Invalid or expired token' };
  }
  
  const result = await unsubscribeUser(decoded.userId, category);
  return {
    ...result,
    userId: decoded.userId,
    email: decoded.email
  };
}

/**
 * Generate HTML page for unsubscribe confirmation
 * @param {boolean} success - Whether unsubscribe was successful
 * @param {string} email - User email
 * @param {string} category - Category unsubscribed from
 * @returns {string} HTML content
 */
function generateUnsubscribeHtml(success, email, category = null) {
  const platformName = process.env.PLATFORM_NAME || 'PlanBeau';
  // Use environment variable for frontend URL with production fallback
  const frontendUrl = process.env.FRONTEND_URL || 'https://www.planbeau.com';
  
  if (success) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribed - ${platformName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { background: white; border-radius: 16px; padding: 48px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .icon { width: 80px; height: 80px; background: #d4edda; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
    .icon svg { width: 40px; height: 40px; color: #28a745; }
    h1 { color: #333; font-size: 24px; margin-bottom: 16px; }
    p { color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
    .email { background: #f8f9fa; padding: 12px 20px; border-radius: 8px; font-family: monospace; color: #333; margin-bottom: 24px; display: inline-block; }
    .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4); }
    .link { color: #667eea; text-decoration: none; font-size: 14px; }
    .link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
    </div>
    <h1>You've Been Unsubscribed</h1>
    <p>We've updated your email preferences${category ? ` for ${category} emails` : ''}. You will no longer receive ${category || 'promotional'} emails at:</p>
    <div class="email">${email}</div>
    <p style="margin-bottom: 32px;">Changed your mind? You can update your preferences anytime.</p>
    <a href="${frontendUrl}/dashboard/settings" class="btn">Manage Preferences</a>
    <br><br>
    <a href="${frontendUrl}" class="link">Return to ${platformName}</a>
  </div>
</body>
</html>`;
  } else {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Error - ${platformName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { background: white; border-radius: 16px; padding: 48px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .icon { width: 80px; height: 80px; background: #f8d7da; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
    .icon svg { width: 40px; height: 40px; color: #dc3545; }
    h1 { color: #333; font-size: 24px; margin-bottom: 16px; }
    p { color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </div>
    <h1>Link Expired or Invalid</h1>
    <p>This unsubscribe link has expired or is invalid. Please log in to manage your email preferences.</p>
    <a href="${frontendUrl}/dashboard/settings" class="btn">Manage Preferences</a>
  </div>
</body>
</html>`;
  }
}

module.exports = {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  getUnsubscribeUrl,
  getPreferencesUrl,
  getUserPreferences,
  updateUserPreferences,
  unsubscribeUser,
  resubscribeUser,
  processUnsubscribe,
  generateUnsubscribeHtml,
  DEFAULT_PREFERENCES
};
