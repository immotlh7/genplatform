/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Generates and validates CSRF tokens to prevent CSRF attacks
 */

import { NextRequest } from 'next/server'
import { logCSRFViolation } from './security-logger'

interface CSRFToken {
  token: string
  timestamp: number
  sessionId?: string
}

// In-memory token store (in production, use Redis or database)
const tokenStore = new Map<string, CSRFToken>()

// CSRF configuration
const CSRF_CONFIG = {
  tokenLength: 32,
  expiryMs: 24 * 60 * 60 * 1000, // 24 hours
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  formFieldName: 'csrfToken'
}

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(sessionId?: string): string {
  const crypto = require('crypto')
  const token = crypto.randomBytes(CSRF_CONFIG.tokenLength).toString('hex')
  const timestamp = Date.now()
  
  // Store token with metadata
  tokenStore.set(token, {
    token,
    timestamp,
    sessionId
  })
  
  // Clean expired tokens to prevent memory buildup
  cleanExpiredTokens()
  
  return token
}

/**
 * Validate CSRF token from request
 */
export async function validateCSRFToken(req: NextRequest): Promise<{
  valid: boolean
  token?: string
  error?: string
}> {
  try {
    // Get token from header or form data
    const tokenFromHeader = req.headers.get(CSRF_CONFIG.headerName)
    const tokenFromCookie = req.cookies.get(CSRF_CONFIG.cookieName)?.value
    
    let tokenFromBody: string | undefined
    
    // Try to get token from form data for POST requests
    try {
      const contentType = req.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const body = await req.json()
        tokenFromBody = body[CSRF_CONFIG.formFieldName]
        // Reset request body for further processing
        Object.defineProperty(req, 'json', {
          value: () => Promise.resolve(body)
        })
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await req.formData()
        tokenFromBody = formData.get(CSRF_CONFIG.formFieldName) as string
        // Reset form data for further processing
        Object.defineProperty(req, 'formData', {
          value: () => Promise.resolve(formData)
        })
      }
    } catch (error) {
      // Body parsing failed, continue with header/cookie validation
    }
    
    // Use token from header first, then body, then cookie
    const submittedToken = tokenFromHeader || tokenFromBody || tokenFromCookie
    
    if (!submittedToken) {
      return {
        valid: false,
        error: 'CSRF token missing from request'
      }
    }
    
    // Validate token
    const storedToken = tokenStore.get(submittedToken)
    
    if (!storedToken) {
      return {
        valid: false,
        token: submittedToken,
        error: 'Invalid or expired CSRF token'
      }
    }
    
    // Check if token is expired
    const now = Date.now()
    if (now - storedToken.timestamp > CSRF_CONFIG.expiryMs) {
      tokenStore.delete(submittedToken)
      return {
        valid: false,
        token: submittedToken,
        error: 'CSRF token expired'
      }
    }
    
    // Token is valid
    return {
      valid: true,
      token: submittedToken
    }
    
  } catch (error) {
    console.error('CSRF validation error:', error)
    return {
      valid: false,
      error: 'CSRF validation failed'
    }
  }
}

/**
 * CSRF middleware for API routes
 * Use this to protect all POST/PUT/DELETE endpoints
 */
export async function requireCSRF(req: NextRequest): Promise<{
  valid: boolean
  response?: Response
}> {
  const method = req.method
  
  // Only check CSRF for state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return { valid: true }
  }
  
  const validation = await validateCSRFToken(req)
  
  if (!validation.valid) {
    // Log CSRF violation
    const ip = getClientIP(req)
    const userAgent = req.headers.get('user-agent')
    const endpoint = req.nextUrl.pathname
    
    await logCSRFViolation(ip, endpoint, userAgent)
    
    const response = new Response(
      JSON.stringify({
        success: false,
        error: 'CSRF protection failed',
        message: validation.error || 'Invalid CSRF token',
        code: 'CSRF_VIOLATION'
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    
    return {
      valid: false,
      response
    }
  }
  
  return { valid: true }
}

/**
 * Get CSRF token for client-side use
 */
export function getCSRFTokenForClient(req: NextRequest): string {
  const existingToken = req.cookies.get(CSRF_CONFIG.cookieName)?.value
  
  if (existingToken && tokenStore.has(existingToken)) {
    const stored = tokenStore.get(existingToken)!
    const now = Date.now()
    
    // Return existing token if still valid
    if (now - stored.timestamp < CSRF_CONFIG.expiryMs) {
      return existingToken
    }
    
    // Clean expired token
    tokenStore.delete(existingToken)
  }
  
  // Generate new token
  return generateCSRFToken()
}

/**
 * Clean expired tokens from memory
 */
function cleanExpiredTokens(): void {
  const now = Date.now()
  const expiredTokens: string[] = []
  
  for (const [token, data] of tokenStore.entries()) {
    if (now - data.timestamp > CSRF_CONFIG.expiryMs) {
      expiredTokens.push(token)
    }
  }
  
  expiredTokens.forEach(token => tokenStore.delete(token))
}

/**
 * Get client IP for logging
 */
function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ||
         req.headers.get('x-real-ip') ||
         req.ip ||
         'unknown'
}

/**
 * Get CSRF configuration for client use
 */
export function getCSRFConfig() {
  return {
    cookieName: CSRF_CONFIG.cookieName,
    headerName: CSRF_CONFIG.headerName,
    formFieldName: CSRF_CONFIG.formFieldName
  }
}

/**
 * Create CSRF-protected fetch wrapper
 */
export function createProtectedFetch(csrfToken: string) {
  return async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers)
    
    // Add CSRF token to headers
    headers.set(CSRF_CONFIG.headerName, csrfToken)
    
    // For form submissions, add token to body
    if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
      if (options.body instanceof FormData) {
        options.body.append(CSRF_CONFIG.formFieldName, csrfToken)
      } else if (typeof options.body === 'string') {
        try {
          const data = JSON.parse(options.body)
          data[CSRF_CONFIG.formFieldName] = csrfToken
          options.body = JSON.stringify(data)
        } catch {
          // Body is not JSON, leave as is
        }
      }
    }
    
    return fetch(url, {
      ...options,
      headers
    })
  }
}

/**
 * Get CSRF statistics for monitoring
 */
export function getCSRFStats(): {
  activeTokens: number
  oldestToken: number | null
  newestToken: number | null
} {
  const now = Date.now()
  const timestamps = Array.from(tokenStore.values()).map(t => t.timestamp)
  
  return {
    activeTokens: tokenStore.size,
    oldestToken: timestamps.length > 0 ? Math.min(...timestamps) : null,
    newestToken: timestamps.length > 0 ? Math.max(...timestamps) : null
  }
}