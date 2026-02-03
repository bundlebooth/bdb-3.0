/**
 * Rate Limiting Middleware
 * Protects against flood attacks and excessive API requests
 * Tracks requests per IP and per user, blocks suspicious activity
 */

const { poolPromise, sql } = require('../config/db');

// In-memory rate limit tracking (for performance)
const rateLimitStore = new Map();

// Rate limit configurations by endpoint type
const RATE_LIMITS = {
  // Authentication endpoints (strict limits)
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 10,           // 10 requests per window
    blockDurationMs: 30 * 60 * 1000  // 30 min block if exceeded
  },
  
  // API endpoints (moderate limits)
  api: {
    windowMs: 1 * 60 * 1000,   // 1 minute
    maxRequests: 100,          // 100 requests per minute
    blockDurationMs: 5 * 60 * 1000   // 5 min block if exceeded
  },
  
  // Chat/messaging (higher limits for real-time)
  chat: {
    windowMs: 1 * 60 * 1000,   // 1 minute
    maxRequests: 60,           // 60 messages per minute
    blockDurationMs: 5 * 60 * 1000   // 5 min block if exceeded
  },
  
  // Forum posts (moderate limits)
  forum: {
    windowMs: 1 * 60 * 1000,   // 1 minute
    maxRequests: 30,           // 30 posts/comments per minute
    blockDurationMs: 10 * 60 * 1000  // 10 min block if exceeded
  },
  
  // File uploads (strict limits)
  upload: {
    windowMs: 5 * 60 * 1000,   // 5 minutes
    maxRequests: 20,           // 20 uploads per 5 minutes
    blockDurationMs: 15 * 60 * 1000  // 15 min block if exceeded
  },
  
  // Default
  default: {
    windowMs: 1 * 60 * 1000,   // 1 minute
    maxRequests: 100,          // 100 requests per minute
    blockDurationMs: 5 * 60 * 1000   // 5 min block if exceeded
  }
};

// Suspicious activity thresholds
const SUSPICIOUS_THRESHOLDS = {
  rapidRequests: 20,           // 20+ requests in 5 seconds = suspicious
  rapidWindowMs: 5 * 1000,     // 5 second window for rapid detection
  failedAuthAttempts: 5,       // 5 failed auth attempts = suspicious
  lockAccountAfter: 10         // Lock account after 10 suspicious events
};

/**
 * Get rate limit key for tracking
 */
function getRateLimitKey(req, type) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userId = req.user?.userId || 'anonymous';
  return `${type}:${ip}:${userId}`;
}

/**
 * Check if request should be rate limited
 */
function checkRateLimit(key, config) {
  const now = Date.now();
  let record = rateLimitStore.get(key);
  
  if (!record) {
    record = {
      requests: [],
      blocked: false,
      blockedUntil: 0,
      suspiciousCount: 0
    };
    rateLimitStore.set(key, record);
  }
  
  // Check if currently blocked
  if (record.blocked && now < record.blockedUntil) {
    const remainingMs = record.blockedUntil - now;
    return {
      allowed: false,
      blocked: true,
      remainingMs,
      reason: 'rate_limit_exceeded'
    };
  }
  
  // Unblock if block period has passed
  if (record.blocked && now >= record.blockedUntil) {
    record.blocked = false;
    record.blockedUntil = 0;
  }
  
  // Clean old requests outside the window
  record.requests = record.requests.filter(time => now - time < config.windowMs);
  
  // Check if over limit
  if (record.requests.length >= config.maxRequests) {
    record.blocked = true;
    record.blockedUntil = now + config.blockDurationMs;
    record.suspiciousCount++;
    
    return {
      allowed: false,
      blocked: true,
      remainingMs: config.blockDurationMs,
      reason: 'rate_limit_exceeded',
      suspiciousCount: record.suspiciousCount
    };
  }
  
  // Check for rapid requests (potential attack)
  const recentRequests = record.requests.filter(time => now - time < SUSPICIOUS_THRESHOLDS.rapidWindowMs);
  if (recentRequests.length >= SUSPICIOUS_THRESHOLDS.rapidRequests) {
    record.suspiciousCount++;
    return {
      allowed: true, // Still allow but flag as suspicious
      suspicious: true,
      suspiciousCount: record.suspiciousCount
    };
  }
  
  // Add current request
  record.requests.push(now);
  
  return {
    allowed: true,
    remaining: config.maxRequests - record.requests.length
  };
}

/**
 * Log suspicious activity to admin notifications
 */
async function logSuspiciousActivity(req, type, details) {
  try {
    const pool = await poolPromise;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = req.user?.userId || null;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const path = req.originalUrl || req.path;
    
    await pool.request()
      .input('NotificationType', sql.VarChar(50), 'suspicious_activity')
      .input('Priority', sql.Int, 4) // High priority
      .input('Title', sql.NVarChar(200), `Suspicious Activity Detected: ${type}`)
      .input('Message', sql.NVarChar(sql.MAX), `
IP: ${ip}
User ID: ${userId || 'Anonymous'}
Path: ${path}
User Agent: ${userAgent}
Details: ${JSON.stringify(details)}
      `.trim())
      .input('RelatedUserID', sql.Int, userId)
      .input('RelatedViolationID', sql.Int, null)
      .input('RelatedMessageID', sql.Int, null)
      .input('RelatedConversationID', sql.Int, null)
      .input('ActionRequired', sql.Bit, 1)
      .input('ActionUrl', sql.NVarChar(500), userId ? `/admin/users/${userId}` : '/admin/security')
      .execute('admin.sp_CreateAdminNotification');
      
    console.log(`[RateLimit] Suspicious activity logged: ${type} from IP ${ip}`);
  } catch (error) {
    console.error('[RateLimit] Error logging suspicious activity:', error.message);
  }
}

/**
 * Create rate limit middleware for a specific type
 */
function createRateLimiter(type = 'default') {
  const config = RATE_LIMITS[type] || RATE_LIMITS.default;
  
  return async (req, res, next) => {
    const key = getRateLimitKey(req, type);
    const result = checkRateLimit(key, config);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining || 0);
    
    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil(result.remainingMs / 1000));
      
      // Log suspicious activity if this is a repeated offense
      if (result.suspiciousCount >= 3) {
        await logSuspiciousActivity(req, 'rate_limit_abuse', {
          type,
          suspiciousCount: result.suspiciousCount,
          blockedFor: result.remainingMs
        });
      }
      
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: Math.ceil(result.remainingMs / 1000)
      });
    }
    
    // Log if suspicious but still allowed
    if (result.suspicious) {
      console.log(`[RateLimit] Suspicious rapid requests detected for ${key}`);
      
      if (result.suspiciousCount >= 5) {
        await logSuspiciousActivity(req, 'rapid_requests', {
          type,
          suspiciousCount: result.suspiciousCount
        });
      }
    }
    
    next();
  };
}

/**
 * Middleware for auth endpoints (stricter limits)
 */
const authRateLimiter = createRateLimiter('auth');

/**
 * Middleware for general API endpoints
 */
const apiRateLimiter = createRateLimiter('api');

/**
 * Middleware for chat/messaging
 */
const chatRateLimiter = createRateLimiter('chat');

/**
 * Middleware for forum posts
 */
const forumRateLimiter = createRateLimiter('forum');

/**
 * Middleware for file uploads
 */
const uploadRateLimiter = createRateLimiter('upload');

/**
 * Clean up old entries periodically (every 10 minutes)
 */
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, record] of rateLimitStore.entries()) {
    // Remove entries with no recent requests and not blocked
    if (!record.blocked && record.requests.length === 0) {
      rateLimitStore.delete(key);
      cleaned++;
    }
    // Clean old requests
    record.requests = record.requests.filter(time => now - time < 15 * 60 * 1000);
  }
  
  if (cleaned > 0) {
    console.log(`[RateLimit] Cleaned ${cleaned} stale entries`);
  }
}, 10 * 60 * 1000);

module.exports = {
  createRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  chatRateLimiter,
  forumRateLimiter,
  uploadRateLimiter,
  RATE_LIMITS,
  checkRateLimit,
  logSuspiciousActivity
};
