/**
 * Rate Limiter for Login Attempts
 * Implements IP-based rate limiting with configurable rules
 */

interface RateLimitRule {
  windowMs: number
  maxAttempts: number
  blockDurationMs: number
}

interface LoginAttempt {
  ip: string
  timestamp: number
  successful: boolean
  userAgent?: string
  email?: string
}

interface RateLimitState {
  attempts: LoginAttempt[]
  blockedUntil?: number
}

// Rate limiting rules
const LOGIN_RATE_LIMITS = {
  owner: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    blockDurationMs: 15 * 60 * 1000 // 15 minutes block
  },
  team: {
    windowMs: 15 * 60 * 1000, // 15 minutes  
    maxAttempts: 5,
    blockDurationMs: 15 * 60 * 1000 // 15 minutes block
  }
} as const

// In-memory store (in production, use Redis or database)
const rateLimitStore = new Map<string, RateLimitState>()

/**
 * Check if IP is currently rate limited
 */
export function isRateLimited(ip: string, type: 'owner' | 'team' = 'owner'): {
  blocked: boolean
  attemptsRemaining: number
  resetTime: number
  blockReason?: string
} {
  const key = `${type}:${ip}`
  const rule = LOGIN_RATE_LIMITS[type]
  const now = Date.now()
  
  // Get or create rate limit state for this IP
  let state = rateLimitStore.get(key)
  if (!state) {
    state = { attempts: [] }
    rateLimitStore.set(key, state)
  }

  // Check if currently blocked
  if (state.blockedUntil && now < state.blockedUntil) {
    return {
      blocked: true,
      attemptsRemaining: 0,
      resetTime: state.blockedUntil,
      blockReason: `Too many failed login attempts. Try again in ${Math.ceil((state.blockedUntil - now) / (1000 * 60))} minutes.`
    }
  }

  // Clean old attempts outside the window
  const windowStart = now - rule.windowMs
  state.attempts = state.attempts.filter(attempt => attempt.timestamp > windowStart)

  // Count failed attempts in current window
  const failedAttempts = state.attempts.filter(attempt => !attempt.successful)
  const attemptsRemaining = Math.max(0, rule.maxAttempts - failedAttempts.length)

  // Check if should be blocked
  if (failedAttempts.length >= rule.maxAttempts) {
    state.blockedUntil = now + rule.blockDurationMs
    const resetTime = state.blockedUntil
    
    return {
      blocked: true,
      attemptsRemaining: 0,
      resetTime,
      blockReason: `Too many failed login attempts. Try again in ${Math.ceil(rule.blockDurationMs / (1000 * 60))} minutes.`
    }
  }

  return {
    blocked: false,
    attemptsRemaining,
    resetTime: now + rule.windowMs
  }
}

/**
 * Record a login attempt
 */
export function recordLoginAttempt(
  ip: string, 
  successful: boolean, 
  type: 'owner' | 'team' = 'owner',
  metadata?: {
    userAgent?: string
    email?: string
    userId?: string
  }
): void {
  const key = `${type}:${ip}`
  const now = Date.now()
  
  // Get or create state
  let state = rateLimitStore.get(key)
  if (!state) {
    state = { attempts: [] }
    rateLimitStore.set(key, state)
  }

  // Add new attempt
  const attempt: LoginAttempt = {
    ip,
    timestamp: now,
    successful,
    userAgent: metadata?.userAgent,
    email: metadata?.email
  }

  state.attempts.push(attempt)

  // Clear blocked status on successful login
  if (successful && state.blockedUntil) {
    delete state.blockedUntil
  }

  // Clean old attempts to prevent memory buildup
  const rule = LOGIN_RATE_LIMITS[type]
  const windowStart = now - rule.windowMs
  state.attempts = state.attempts.filter(a => a.timestamp > windowStart)
}

/**
 * Get recent login attempts for an IP (for security logging)
 */
export function getRecentAttempts(ip: string, type: 'owner' | 'team' = 'owner'): LoginAttempt[] {
  const key = `${type}:${ip}`
  const state = rateLimitStore.get(key)
  
  if (!state) return []
  
  const now = Date.now()
  const rule = LOGIN_RATE_LIMITS[type]
  const windowStart = now - rule.windowMs
  
  return state.attempts.filter(attempt => attempt.timestamp > windowStart)
}

/**
 * Clear rate limit for an IP (admin override)
 */
export function clearRateLimit(ip: string, type: 'owner' | 'team' = 'owner'): void {
  const key = `${type}:${ip}`
  rateLimitStore.delete(key)
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats(): {
  totalIPs: number
  blockedIPs: number
  recentAttempts: number
} {
  const now = Date.now()
  let totalIPs = 0
  let blockedIPs = 0
  let recentAttempts = 0

  for (const [key, state] of rateLimitStore) {
    totalIPs++
    
    if (state.blockedUntil && now < state.blockedUntil) {
      blockedIPs++
    }
    
    // Count attempts in last hour
    const hourAgo = now - (60 * 60 * 1000)
    const recentForThisIP = state.attempts.filter(a => a.timestamp > hourAgo).length
    recentAttempts += recentForThisIP
  }

  return {
    totalIPs,
    blockedIPs,
    recentAttempts
  }
}

/**
 * Format time remaining until unblock
 */
export function formatTimeRemaining(resetTime: number): string {
  const now = Date.now()
  const remaining = Math.max(0, resetTime - now)
  
  if (remaining === 0) return 'now'
  
  const minutes = Math.ceil(remaining / (1000 * 60))
  if (minutes === 1) return '1 minute'
  if (minutes < 60) return `${minutes} minutes`
  
  const hours = Math.ceil(minutes / 60)
  if (hours === 1) return '1 hour'
  return `${hours} hours`
}