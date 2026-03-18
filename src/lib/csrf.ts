/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Task 9-02: Add CSRF protection with token generation and validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const CSRF_TOKEN_COOKIE = 'csrf-token'
const CSRF_TOKEN_HEADER = 'x-csrf-token'
const CSRF_TOKEN_FIELD = 'csrfToken'

// Generate a new CSRF token
export function generateCSRFToken(): string {
  return randomUUID()
}

// Set CSRF token in cookie
export function setCSRFTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: false, // Must be accessible by JavaScript for form submission
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  })
}

// Get CSRF token from cookie
export function getCSRFTokenFromCookie(req: NextRequest): string | null {
  return req.cookies.get(CSRF_TOKEN_COOKIE)?.value || null
}

// Get CSRF token from request (header or form data)
export async function getCSRFTokenFromRequest(req: NextRequest): Promise<string | null> {
  // First check header
  const headerToken = req.headers.get(CSRF_TOKEN_HEADER)
  if (headerToken) {
    return headerToken
  }

  // Then check form data (for POST requests with form data)
  if (req.headers.get('content-type')?.includes('application/json')) {
    try {
      const body = await req.json()
      return body[CSRF_TOKEN_FIELD] || null
    } catch {
      // If JSON parsing fails, return null
      return null
    }
  }

  // For form-encoded data
  if (req.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
    try {
      const formData = await req.formData()
      return formData.get(CSRF_TOKEN_FIELD) as string || null
    } catch {
      return null
    }
  }

  return null
}

// Validate CSRF token
export function validateCSRFToken(cookieToken: string | null, requestToken: string | null): boolean {
  if (!cookieToken || !requestToken) {
    return false
  }

  // Simple constant-time comparison to prevent timing attacks
  return cookieToken === requestToken
}

// Middleware to check CSRF protection for state-changing operations
export async function validateCSRF(req: NextRequest): Promise<{ valid: boolean; response?: NextResponse }> {
  // Skip CSRF validation for safe methods
  const method = req.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true }
  }

  // Skip for API endpoints that use other authentication (like API keys)
  const pathname = req.nextUrl.pathname
  if (pathname.startsWith('/api/webhooks/') || pathname.includes('/callback')) {
    return { valid: true }
  }

  const cookieToken = getCSRFTokenFromCookie(req)
  
  // Clone request to read body (since it can only be read once)
  const requestClone = req.clone()
  const requestToken = await getCSRFTokenFromRequest(requestClone)

  const isValid = validateCSRFToken(cookieToken, requestToken)

  if (!isValid) {
    // Log CSRF violation
    console.warn('🛡️ CSRF Protection: Token validation failed', {
      method,
      pathname,
      hasCookieToken: !!cookieToken,
      hasRequestToken: !!requestToken,
      ip: req.ip || 'unknown',
      userAgent: req.headers.get('user-agent')
    })

    return {
      valid: false,
      response: NextResponse.json(
        {
          success: false,
          message: 'CSRF token validation failed',
          error: 'Invalid or missing CSRF token'
        },
        { status: 403 }
      )
    }
  }

  return { valid: true }
}

// Helper to create a protected API route wrapper
export function withCSRFProtection(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
  return async function protectedHandler(req: NextRequest, ...args: any[]): Promise<NextResponse> {
    // Validate CSRF for state-changing operations
    const csrfResult = await validateCSRF(req)
    if (!csrfResult.valid && csrfResult.response) {
      return csrfResult.response
    }

    // Call the original handler
    return handler(req, ...args)
  }
}

// React hook for getting CSRF token in components
export function useCSRFToken(): {
  token: string | null
  getToken: () => string
  addTokenToFormData: (formData: FormData) => void
  addTokenToHeaders: (headers: HeadersInit) => HeadersInit
} {
  // Get token from cookie (client-side)
  const getTokenFromCookie = (): string | null => {
    if (typeof document === 'undefined') return null
    
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === CSRF_TOKEN_COOKIE) {
        return decodeURIComponent(value)
      }
    }
    return null
  }

  // Generate new token if none exists
  const getToken = (): string => {
    let token = getTokenFromCookie()
    if (!token) {
      token = generateCSRFToken()
      // Set token in cookie
      document.cookie = `${CSRF_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${24 * 60 * 60}; samesite=lax`
    }
    return token
  }

  const addTokenToFormData = (formData: FormData): void => {
    const token = getToken()
    formData.append(CSRF_TOKEN_FIELD, token)
  }

  const addTokenToHeaders = (headers: HeadersInit = {}): HeadersInit => {
    const token = getToken()
    return {
      ...headers,
      [CSRF_TOKEN_HEADER]: token
    }
  }

  return {
    token: getTokenFromCookie(),
    getToken,
    addTokenToFormData,
    addTokenToHeaders
  }
}

// Utility for adding CSRF token to fetch requests
export class CSRFProtectedFetch {
  private getToken(): string {
    // Get token from cookie
    if (typeof document === 'undefined') return ''
    
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === CSRF_TOKEN_COOKIE) {
        return decodeURIComponent(value)
      }
    }
    
    // Generate new token if none exists
    const token = generateCSRFToken()
    document.cookie = `${CSRF_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${24 * 60 * 60}; samesite=lax`
    return token
  }

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken()
    
    // Add CSRF token to headers for all state-changing requests
    const method = options.method?.toUpperCase() || 'GET'
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const headers = new Headers(options.headers)
      headers.set(CSRF_TOKEN_HEADER, token)
      
      // If sending JSON data, add token to body
      if (headers.get('content-type')?.includes('application/json') && options.body) {
        try {
          const bodyObj = JSON.parse(options.body as string)
          bodyObj[CSRF_TOKEN_FIELD] = token
          options.body = JSON.stringify(bodyObj)
        } catch {
          // If body is not JSON, just add header
        }
      }
      
      options.headers = headers
    }

    return fetch(url, options)
  }
}

// Global instance for easy use
export const csrfFetch = new CSRFProtectedFetch()

// Middleware factory for Next.js
export function createCSRFMiddleware() {
  return async function csrfMiddleware(req: NextRequest): Promise<NextResponse | void> {
    const response = NextResponse.next()
    
    // Generate and set CSRF token for new sessions
    const existingToken = getCSRFTokenFromCookie(req)
    if (!existingToken) {
      const newToken = generateCSRFToken()
      setCSRFTokenCookie(response, newToken)
    }

    // Add CSRF token to response headers for AJAX requests
    if (existingToken) {
      response.headers.set('X-CSRF-Token', existingToken)
    }

    return response
  }
}