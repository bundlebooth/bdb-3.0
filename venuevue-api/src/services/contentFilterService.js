/**
 * Content Filter Service
 * High-performance message content scanning for chat moderation
 * Detects: emails, phone numbers, profanity, racism, solicitation attempts
 * 
 * Performance optimized with:
 * - Pre-compiled regex patterns
 * - Async non-blocking processing
 * - Efficient word matching using Sets
 */

const { poolPromise, sql } = require('../config/db');

// Pre-compiled regex patterns for performance
const PATTERNS = {
  // Email pattern - matches common email formats
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  
  // Phone patterns - matches various formats
  phone: [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,           // 123-456-7890, 123.456.7890, 123 456 7890
    /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/g,               // (123) 456-7890
    /\b\d{10,11}\b/g,                                // 1234567890 or 11234567890
    /\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g // +1-123-456-7890
  ],
  
  // Obfuscation patterns - people trying to hide contact info
  obfuscated: [
    /\b\d+\s*[-.\s]*\d+\s*[-.\s]*\d+\s*[-.\s]*\d+\b/g, // Spaced out numbers
    /[a-zA-Z0-9]+\s*[@aA][tT]\s*[a-zA-Z0-9]+\s*[dD][oO][tT]\s*[a-zA-Z]+/gi, // "email at domain dot com"
    /[a-zA-Z0-9]+\s*\[\s*@\s*\]\s*[a-zA-Z0-9]+/gi // "email [ @ ] domain"
  ]
};

// Solicitation phrases that indicate contact exchange attempts
const SOLICITATION_PHRASES = new Set([
  'my number is',
  'my phone is',
  'call me at',
  'text me at',
  'reach me at',
  'contact me at',
  'email me at',
  'my email is',
  'send me an email',
  'whatsapp me',
  'add me on',
  'find me on',
  'message me on',
  'dm me on',
  'hit me up',
  'hmu at',
  'lets talk off',
  'talk outside',
  'continue outside',
  'pay outside',
  'pay directly',
  'pay me directly',
  'avoid the fee',
  'skip the platform',
  'off platform',
  'off the platform',
  'outside the app',
  'outside planbeau',
  'venmo me',
  'cashapp me',
  'zelle me',
  'paypal me'
]);

// Profanity word list (common terms - can be extended)
const PROFANITY_WORDS = new Set([
  'fuck', 'fucking', 'fucked', 'fucker', 'fucks',
  'shit', 'shitting', 'shitty', 'bullshit',
  'ass', 'asshole', 'assholes',
  'bitch', 'bitches', 'bitching',
  'damn', 'damned', 'dammit',
  'crap', 'crappy',
  'bastard', 'bastards',
  'dick', 'dicks',
  'piss', 'pissed', 'pissing',
  'cunt', 'cunts',
  'cock', 'cocks',
  'whore', 'whores',
  'slut', 'sluts'
]);

// Racist/hate speech terms (common terms - can be extended)
const RACIST_WORDS = new Set([
  'nigger', 'nigga', 'niggas',
  'chink', 'chinks',
  'spic', 'spics',
  'wetback', 'wetbacks',
  'kike', 'kikes',
  'gook', 'gooks',
  'beaner', 'beaners',
  'cracker', 'crackers',
  'honky', 'honkies',
  'towelhead', 'towelheads',
  'raghead', 'ragheads',
  'camel jockey',
  'sand nigger'
]);

// Severity levels
const SEVERITY = {
  WARNING: 1,    // Minor violation, just log
  MODERATE: 2,   // Moderate violation, warn user
  SEVERE: 3      // Severe violation, may lock account
};

// Violation thresholds for auto-lock
const VIOLATION_THRESHOLDS = {
  LOCK_AFTER_SEVERE: 1,      // Lock after 1 severe violation
  LOCK_AFTER_MODERATE: 3,    // Lock after 3 moderate violations in 24h
  LOCK_AFTER_WARNING: 5      // Lock after 5 warnings in 24h
};

/**
 * Scan message content for violations
 * @param {string} content - The message content to scan
 * @returns {Object} - Scan results with violations array
 */
function scanContent(content) {
  if (!content || typeof content !== 'string') {
    return { hasViolations: false, violations: [] };
  }

  const violations = [];
  const lowerContent = content.toLowerCase();
  const words = lowerContent.split(/\s+/);

  // Check for email addresses
  const emailMatches = content.match(PATTERNS.email);
  if (emailMatches && emailMatches.length > 0) {
    violations.push({
      type: 'email',
      severity: SEVERITY.MODERATE,
      detected: emailMatches.slice(0, 3).join(', '), // Limit to first 3
      message: 'Email address detected'
    });
  }

  // Check for phone numbers
  for (const phonePattern of PATTERNS.phone) {
    const phoneMatches = content.match(phonePattern);
    if (phoneMatches && phoneMatches.length > 0) {
      // Filter out numbers that are clearly not phone numbers (like years, prices)
      const validPhones = phoneMatches.filter(match => {
        const digits = match.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 11;
      });
      
      if (validPhones.length > 0) {
        violations.push({
          type: 'phone',
          severity: SEVERITY.MODERATE,
          detected: validPhones.slice(0, 3).join(', '),
          message: 'Phone number detected'
        });
        break; // Only add one phone violation
      }
    }
  }

  // Check for obfuscated contact info
  for (const obfPattern of PATTERNS.obfuscated) {
    const obfMatches = content.match(obfPattern);
    if (obfMatches && obfMatches.length > 0) {
      violations.push({
        type: 'solicitation',
        severity: SEVERITY.MODERATE,
        detected: obfMatches[0].substring(0, 50),
        message: 'Obfuscated contact information detected'
      });
      break;
    }
  }

  // Check for solicitation phrases
  for (const phrase of SOLICITATION_PHRASES) {
    if (lowerContent.includes(phrase)) {
      violations.push({
        type: 'solicitation',
        severity: SEVERITY.MODERATE,
        detected: phrase,
        message: 'Solicitation phrase detected'
      });
      break; // Only add one solicitation violation
    }
  }

  // Check for profanity
  const profanityFound = [];
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (PROFANITY_WORDS.has(cleanWord)) {
      profanityFound.push(cleanWord);
    }
  }
  if (profanityFound.length > 0) {
    violations.push({
      type: 'profanity',
      severity: SEVERITY.WARNING,
      detected: profanityFound.slice(0, 5).join(', '),
      message: 'Profanity detected'
    });
  }

  // Check for racist/hate speech
  const racistFound = [];
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (RACIST_WORDS.has(cleanWord)) {
      racistFound.push(cleanWord);
    }
  }
  // Also check for multi-word racist phrases
  for (const term of RACIST_WORDS) {
    if (term.includes(' ') && lowerContent.includes(term)) {
      racistFound.push(term);
    }
  }
  if (racistFound.length > 0) {
    violations.push({
      type: 'racism',
      severity: SEVERITY.SEVERE,
      detected: '[redacted]', // Don't store the actual words
      message: 'Racist/hate speech detected'
    });
  }

  return {
    hasViolations: violations.length > 0,
    violations,
    highestSeverity: violations.length > 0 
      ? Math.max(...violations.map(v => v.severity))
      : 0
  };
}

/**
 * Process a message and log any violations
 * @param {number} userId - The sender's user ID
 * @param {number} messageId - The message ID (can be null for pre-send check)
 * @param {number} conversationId - The conversation ID
 * @param {string} content - The message content
 * @returns {Object} - Processing result with shouldBlock flag
 */
async function processMessage(userId, messageId, conversationId, content) {
  const scanResult = scanContent(content);
  
  if (!scanResult.hasViolations) {
    return {
      shouldBlock: false,
      violations: [],
      userLocked: false
    };
  }

  const result = {
    shouldBlock: false,
    violations: scanResult.violations,
    userLocked: false,
    lockReason: null
  };

  try {
    const pool = await poolPromise;
    
    // Log each violation
    let totalViolationCount = 0;
    let recentViolationCount = 0;
    const violationIds = [];

    for (const violation of scanResult.violations) {
      const logResult = await pool.request()
        .input('UserID', sql.Int, userId)
        .input('MessageID', sql.Int, messageId)
        .input('ConversationID', sql.Int, conversationId)
        .input('ViolationType', sql.VarChar(50), violation.type)
        .input('DetectedContent', sql.NVarChar(500), violation.detected)
        .input('OriginalMessage', sql.NVarChar(sql.MAX), content.substring(0, 1000))
        .input('Severity', sql.Int, violation.severity)
        .input('IsBlocked', sql.Bit, scanResult.highestSeverity >= SEVERITY.MODERATE)
        .execute('admin.sp_LogViolation');

      if (logResult.recordset && logResult.recordset[0]) {
        violationIds.push(logResult.recordset[0].ViolationID);
        totalViolationCount = logResult.recordset[0].TotalViolationCount;
        recentViolationCount = logResult.recordset[0].RecentViolationCount;
      }
    }

    // Determine if message should be blocked
    result.shouldBlock = scanResult.highestSeverity >= SEVERITY.MODERATE;

    // Check if user should be locked
    const shouldLock = 
      (scanResult.highestSeverity >= SEVERITY.SEVERE && recentViolationCount >= VIOLATION_THRESHOLDS.LOCK_AFTER_SEVERE) ||
      (scanResult.highestSeverity >= SEVERITY.MODERATE && recentViolationCount >= VIOLATION_THRESHOLDS.LOCK_AFTER_MODERATE) ||
      (recentViolationCount >= VIOLATION_THRESHOLDS.LOCK_AFTER_WARNING);

    if (shouldLock) {
      // Lock the user account
      const lockReason = generateLockReason(scanResult.violations, recentViolationCount);
      
      const lockResult = await pool.request()
        .input('UserID', sql.Int, userId)
        .input('LockType', sql.VarChar(50), 'chat_violation')
        .input('LockReason', sql.NVarChar(500), lockReason)
        .input('ViolationCount', sql.Int, recentViolationCount)
        .input('RelatedViolationIDs', sql.NVarChar(500), violationIds.join(','))
        .input('LockedByAdminID', sql.Int, null)
        .input('LockDuration', sql.Int, null) // Permanent until admin review
        .execute('admin.sp_LockUserAccount');

      result.userLocked = true;
      result.lockReason = lockReason;
      result.lockInfo = lockResult.recordset[0];
    }

    // Create admin notification
    const notificationTitle = result.userLocked 
      ? `Account Locked: User violated chat policy`
      : `Chat Violation Detected`;
    
    const notificationMessage = generateAdminNotificationMessage(
      scanResult.violations, 
      content.substring(0, 200),
      result.userLocked
    );

    await pool.request()
      .input('NotificationType', sql.VarChar(50), result.userLocked ? 'account_locked' : 'chat_violation')
      .input('Priority', sql.Int, result.userLocked ? 4 : scanResult.highestSeverity + 1)
      .input('Title', sql.NVarChar(200), notificationTitle)
      .input('Message', sql.NVarChar(sql.MAX), notificationMessage)
      .input('RelatedUserID', sql.Int, userId)
      .input('RelatedViolationID', sql.Int, violationIds[0] || null)
      .input('RelatedMessageID', sql.Int, messageId)
      .input('RelatedConversationID', sql.Int, conversationId)
      .input('ActionRequired', sql.Bit, 1)
      .input('ActionUrl', sql.NVarChar(500), `/admin/chat?userId=${userId}`)
      .execute('admin.sp_CreateAdminNotification');

  } catch (error) {
    console.error('[ContentFilter] Error processing message:', error.message);
    // Don't block on error - let the message through but log the issue
    result.shouldBlock = false;
  }

  return result;
}

/**
 * Generate a human-readable lock reason
 */
function generateLockReason(violations, violationCount) {
  const types = [...new Set(violations.map(v => v.type))];
  const typeDescriptions = {
    email: 'sharing email addresses',
    phone: 'sharing phone numbers',
    solicitation: 'attempting to conduct business outside the platform',
    profanity: 'using inappropriate language',
    racism: 'using racist or hateful language'
  };

  const reasons = types.map(t => typeDescriptions[t] || t).join(', ');
  return `Your account has been locked due to ${reasons}. You have had ${violationCount} violation(s) in the last 24 hours. Please contact support if you believe this is an error.`;
}

/**
 * Generate admin notification message
 */
function generateAdminNotificationMessage(violations, contentPreview, wasLocked) {
  const types = violations.map(v => `${v.type} (${v.message})`).join(', ');
  let message = `Violation types: ${types}\n\nMessage preview: "${contentPreview}..."`;
  
  if (wasLocked) {
    message += '\n\n⚠️ User account has been automatically locked.';
  }
  
  return message;
}

/**
 * Quick check if content has violations (for pre-send validation)
 * This is a synchronous, fast check that doesn't log to database
 */
function quickCheck(content) {
  return scanContent(content);
}

/**
 * Get user's violation history
 */
async function getUserViolationHistory(userId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .query(`
        SELECT 
          ViolationID, ViolationType, DetectedContent, Severity,
          IsReviewed, ActionTaken, CreatedAt
        FROM moderation.ChatViolations
        WHERE UserID = @UserID
        ORDER BY CreatedAt DESC
      `);
    
    return result.recordset;
  } catch (error) {
    console.error('[ContentFilter] Error getting violation history:', error.message);
    return [];
  }
}

module.exports = {
  scanContent,
  processMessage,
  quickCheck,
  getUserViolationHistory,
  SEVERITY,
  VIOLATION_THRESHOLDS
};
