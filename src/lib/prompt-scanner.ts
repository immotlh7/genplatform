/**
 * Prompt injection scanner for chat messages
 * Detects common injection patterns and malicious attempts
 */

interface ScanResult {
  safe: boolean;
  threats: string[];
}

const INJECTION_PATTERNS = [
  // Instruction override attempts
  {
    pattern: /ignore\s+previous\s+instructions?/i,
    threat: 'Attempted to override instructions',
  },
  {
    pattern: /forget\s+(your\s+)?rules?/i,
    threat: 'Attempted to bypass rules',
  },
  {
    pattern: /reveal\s+system\s+prompt/i,
    threat: 'Attempted to reveal system prompt',
  },
  {
    pattern: /show\s+(me\s+)?(the\s+)?api\s+keys?/i,
    threat: 'Attempted to access API keys',
  },
  {
    pattern: /act\s+as\s+(an?\s+)?admin(istrator)?/i,
    threat: 'Attempted privilege escalation',
  },
  {
    pattern: /pretend\s+(you('re|re)|to\s+be)\s+(an?\s+)?(admin|root|superuser)/i,
    threat: 'Attempted role impersonation',
  },
  
  // System file access attempts
  {
    pattern: /\/etc\/passwd/i,
    threat: 'Attempted to access system files',
  },
  {
    pattern: /~\/\.ssh/i,
    threat: 'Attempted to access SSH keys',
  },
  {
    pattern: /\/root\//i,
    threat: 'Attempted to access root directory',
  },
  {
    pattern: /(cat|type|more|less|head|tail)\s+[\/~]/i,
    threat: 'Attempted file system command',
  },
  
  // Code injection attempts
  {
    pattern: /<script[\s>]/i,
    threat: 'Attempted script injection',
  },
  {
    pattern: /javascript:/i,
    threat: 'Attempted JavaScript protocol injection',
  },
  {
    pattern: /\$\{[^}]+\}/,
    threat: 'Attempted template injection',
  },
  {
    pattern: /{{[^}]+}}/,
    threat: 'Attempted template injection',
  },
  {
    pattern: /<%[^%]+%>/,
    threat: 'Attempted template injection',
  },
  
  // SQL injection patterns
  {
    pattern: /(\b(union|select|insert|update|delete|drop|create)\b.*\b(from|where|table|database)\b)|(\b(or|and)\b.*=.*)/i,
    threat: 'Possible SQL injection attempt',
  },
  {
    pattern: /--\s*$|;\s*--/,
    threat: 'SQL comment injection attempt',
  },
  
  // Command injection patterns
  {
    pattern: /[;&|]\s*(rm|del|format|fdisk|dd|wget|curl|nc|netcat)/i,
    threat: 'Attempted command injection',
  },
  {
    pattern: /\$\([^)]+\)/,
    threat: 'Attempted command substitution',
  },
  {
    pattern: /`[^`]+`/,
    threat: 'Attempted command substitution',
  },
  
  // Bypass attempts
  {
    pattern: /bypass\s+(the\s+)?(security|filter|validation)/i,
    threat: 'Attempted security bypass',
  },
  {
    pattern: /disable\s+(the\s+)?(security|filter|validation)/i,
    threat: 'Attempted to disable security',
  },
];

/**
 * Scan a message for prompt injection attempts
 * @param message The message to scan
 * @returns ScanResult with safety status and detected threats
 */
export function scanForInjection(message: string): ScanResult {
  const threats: string[] = [];
  
  // Check against all patterns
  for (const { pattern, threat } of INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      threats.push(threat);
    }
  }
  
  // Check for suspicious Unicode characters (zero-width, RTL override, etc.)
  const suspiciousUnicode = /[\u200B-\u200D\u202A-\u202E\uFEFF]/;
  if (suspiciousUnicode.test(message)) {
    threats.push('Suspicious Unicode characters detected');
  }
  
  // Check for excessive special characters that might indicate obfuscation
  const specialCharRatio = (message.match(/[^a-zA-Z0-9\s]/g) || []).length / message.length;
  if (specialCharRatio > 0.5 && message.length > 20) {
    threats.push('Excessive special characters detected');
  }
  
  return {
    safe: threats.length === 0,
    threats,
  };
}

/**
 * Sanitize a message by removing detected threats
 * @param message The message to sanitize
 * @returns Sanitized message
 */
export function sanitizeMessage(message: string): string {
  // Remove suspicious Unicode characters
  let sanitized = message.replace(/[\u200B-\u200D\u202A-\u202E\uFEFF]/g, '');
  
  // Remove potential command injections
  sanitized = sanitized.replace(/\$\([^)]+\)/g, '[REMOVED]');
  sanitized = sanitized.replace(/`[^`]+`/g, '[REMOVED]');
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, '[REMOVED]');
  
  return sanitized;
}