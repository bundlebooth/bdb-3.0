const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendTwoFactorCode, sendTemplatedEmail } = require('../services/email');

// Helper function to validate email
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// In-memory rate limiting for 2FA resend (2 minute cooldown)
const twoFAResendRateLimit = new Map();
const TWO_FA_RESEND_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

// POST /auth/resend-2fa - Resend 2FA code using email (no token required)
router.post('/resend-2fa', async (req, res) => {
  try {
    const { email, tempToken } = req.body;
    
    // Support both email-based and token-based resend
    let userId, userEmail;
    
    if (tempToken) {
      // Token-based resend (existing flow)
      try {
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        if (decoded.purpose !== 'login_2fa') {
          return res.status(400).json({ success: false, message: 'Invalid token purpose' });
        }
        userId = decoded.id;
        userEmail = decoded.email;
      } catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }
    } else if (email) {
      // Email-based resend (new flow)
      if (!validateEmail(email)) {
        return res.status(400).json({ success: false, message: 'Valid email is required' });
      }
      
      const pool = await poolPromise;
      const userResult = await pool.request()
        .input('Email', sql.NVarChar(100), email.toLowerCase().trim())
        .query('SELECT UserID, Email FROM users.Users WHERE Email = @Email AND IsActive = 1');
      
      if (userResult.recordset.length === 0) {
        // Don't reveal if email exists
        return res.json({ success: true, message: 'If an account exists, a verification code will be sent.' });
      }
      
      userId = userResult.recordset[0].UserID;
      userEmail = userResult.recordset[0].Email;
    } else {
      return res.status(400).json({ success: false, message: 'Email or tempToken is required' });
    }
    
    // Check rate limiting (2 minute cooldown)
    const rateLimitKey = userEmail.toLowerCase();
    const lastRequest = twoFAResendRateLimit.get(rateLimitKey);
    if (lastRequest) {
      const timeSinceLastRequest = Date.now() - lastRequest;
      if (timeSinceLastRequest < TWO_FA_RESEND_COOLDOWN_MS) {
        const secondsRemaining = Math.ceil((TWO_FA_RESEND_COOLDOWN_MS - timeSinceLastRequest) / 1000);
        return res.status(429).json({ 
          success: false, 
          message: `Please wait ${secondsRemaining} seconds before requesting another code.`,
          retryAfter: secondsRemaining
        });
      }
    }
    
    const pool = await poolPromise;
    
    // Generate new 2FA code
    const raw = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(raw, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Insert new 2FA code
    await pool.request()
      .input('UserID', sql.Int, userId)
      .input('CodeHash', sql.NVarChar(255), codeHash)
      .input('Purpose', sql.NVarChar(50), 'login')
      .input('ExpiresAt', sql.DateTime, expiresAt)
      .execute('users.sp_Insert2FACode');
    
    // Send the code via email
    try {
      await sendTwoFactorCode(userEmail, raw);
    } catch (emailErr) {
      console.error('2FA email error:', emailErr.message);
    }
    
    // Set rate limit after successful request
    twoFAResendRateLimit.set(rateLimitKey, Date.now());
    
    // Generate new temp token if using email-based flow
    let newTempToken = tempToken;
    if (!tempToken) {
      newTempToken = jwt.sign(
        { id: userId, email: userEmail, purpose: 'login_2fa' },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Verification code sent',
      tempToken: newTempToken
    });
  } catch (err) {
    console.error('Resend 2FA error:', err);
    res.status(500).json({ success: false, message: 'Failed to resend verification code', error: err.message });
  }
});

// POST /auth/verify-2fa - Verify 2FA code
router.post('/verify-2fa', async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ success: false, message: 'Missing token or code' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    if (decoded.purpose !== 'login_2fa') {
      return res.status(400).json({ success: false, message: 'Invalid token purpose' });
    }
    
    const pool = await poolPromise;
    const now = new Date();
    
    const rec = await pool.request()
      .input('UserID', sql.Int, decoded.id)
      .input('Purpose', sql.NVarChar(50), 'login')
      .execute('users.sp_Get2FACode');
    
    if (rec.recordset.length === 0) {
      return res.status(400).json({ success: false, message: 'No verification code found' });
    }
    
    const row = rec.recordset[0];
    if (new Date(row.ExpiresAt) < now) {
      return res.status(400).json({ success: false, message: 'Code expired' });
    }
    if (row.Attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many attempts' });
    }
    
    const ok = await bcrypt.compare(String(code).trim(), row.CodeHash);
    if (!ok) {
      await pool.request()
        .input('CodeID', sql.Int, row.CodeID)
        .execute('users.sp_Increment2FAAttempts');
      return res.status(400).json({ success: false, message: 'Invalid code' });
    }
    
    await pool.request()
      .input('CodeID', sql.Int, row.CodeID)
      .execute('users.sp_Mark2FAUsed');
    
    const ures = await pool.request()
      .input('UserID', sql.Int, decoded.id)
      .execute('users.sp_GetById');
    
    if (ures.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const u = ures.recordset[0];
    
    // Get session timeout from security settings
    let sessionTimeoutMinutes = 60;
    try {
      const timeoutResult = await pool.request().execute('users.sp_CheckSecuritySettings');
      if (timeoutResult.recordset && timeoutResult.recordset.length > 0) {
        const timeoutSetting = timeoutResult.recordset.find(s => s.SettingKey === 'session_timeout_minutes');
        if (timeoutSetting) {
          sessionTimeoutMinutes = parseInt(timeoutSetting.SettingValue) || 60;
        }
      }
    } catch (e) { /* use default */ }
    
    const token = jwt.sign(
      { id: u.UserID, email: u.Email, isVendor: u.IsVendor, isAdmin: u.IsAdmin },
      process.env.JWT_SECRET,
      { expiresIn: `${sessionTimeoutMinutes}m` }
    );
    
    res.json({ 
      success: true, 
      userId: u.UserID, 
      name: u.Name, 
      email: u.Email, 
      isVendor: u.IsVendor, 
      isAdmin: u.IsAdmin, 
      vendorProfileId: u.VendorProfileID || null, 
      token 
    });
  } catch (err) {
    console.error('Verify 2FA error:', err);
    res.status(500).json({ success: false, message: 'Verification failed', error: err.message });
  }
});

module.exports = router;
