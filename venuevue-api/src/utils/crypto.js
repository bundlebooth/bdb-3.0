/**
 * Server-side credential decryption utility
 * Decrypts sensitive data sent from the frontend
 */

const crypto = require('crypto');

// AES-GCM encryption key (shared secret - must match frontend)
const ENCRYPTION_KEY = process.env.AUTH_ENCRYPTION_KEY || 'planbeau-secure-auth-key-2026!!';
const SALT = 'planbeau-salt';

/**
 * Derive encryption key from shared secret using PBKDF2
 */
function deriveKey() {
  return crypto.pbkdf2Sync(
    ENCRYPTION_KEY,
    SALT,
    100000,
    32,
    'sha256'
  );
}

/**
 * Decrypt credentials encrypted by the frontend
 * @param {string} encryptedBase64 - Base64 encoded encrypted payload (IV + ciphertext)
 * @returns {Object} Decrypted credentials { email, password, timestamp }
 */
function decryptCredentials(encryptedBase64) {
  try {
    const combined = Buffer.from(encryptedBase64, 'base64');
    
    // Extract IV (first 12 bytes) and ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12, combined.length - 16);
    const authTag = combined.slice(combined.length - 16);
    
    const key = deriveKey();
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    const data = JSON.parse(decrypted);
    
    // Validate timestamp (reject if older than 5 minutes)
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    if (data.timestamp && (now - data.timestamp) > maxAge) {
      throw new Error('Encrypted payload has expired');
    }
    
    return data;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt credentials');
  }
}

/**
 * Check if request body contains encrypted credentials
 * @param {Object} body - Request body
 * @returns {boolean}
 */
function isEncrypted(body) {
  return body && typeof body.encrypted === 'string' && body.encrypted.length > 0;
}

/**
 * Middleware to decrypt credentials if encrypted
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function decryptMiddleware(req, res, next) {
  if (isEncrypted(req.body)) {
    try {
      const decrypted = decryptCredentials(req.body.encrypted);
      // Merge decrypted data into request body
      req.body = { ...req.body, ...decrypted };
      delete req.body.encrypted;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid encrypted payload'
      });
    }
  }
  next();
}

module.exports = {
  decryptCredentials,
  isEncrypted,
  decryptMiddleware
};
