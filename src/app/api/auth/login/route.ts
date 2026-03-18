import { NextRequest, NextResponse } from 'next/server'
import { isRateLimited, recordLoginAttempt, formatTimeRemaining } from '@/lib/rate-limiter'
import { logLoginAttempt, logRateLimitEvent } from '@/lib/security-logger'

// Configuration
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin123'

/**
 * Get client IP address from request
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP.trim()
  }
  
  return req.ip || 'unknown'
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  try {
    // Check rate limiting BEFORE processing the request
    const rateLimitCheck = isRateLimited(ip, 'owner')
    
    if (rateLimitCheck.blocked) {
      // Log rate limit event
      await logRateLimitEvent(ip, 5, 15, userAgent)
      
      const remainingSeconds = Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
      
      return NextResponse.json(
        {
          success: false,
          message: rateLimitCheck.blockReason,
          rateLimitExceeded: true,
          retryAfter: remainingSeconds,
          remainingAttempts: 0
        },
        {
          status: 429,
          headers: {
            'Retry-After': remainingSeconds.toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimitCheck.resetTime / 1000).toString()
          }
        }
      )
    }

    // Parse request body
    const { password } = await req.json()

    if (!password) {
      // Record failed attempt
      recordLoginAttempt(ip, false, 'owner', { userAgent })
      
      // Log security event
      await logLoginAttempt(ip, false, 'owner@genplatform.ai', userAgent, {
        reason: 'missing_password',
        remainingAttempts: rateLimitCheck.attemptsRemaining - 1
      })

      return NextResponse.json(
        { 
          success: false, 
          message: 'Password is required',
          remainingAttempts: Math.max(0, rateLimitCheck.attemptsRemaining - 1)
        },
        { status: 400 }
      )
    }

    // Verify password
    const isValid = password === DASHBOARD_PASSWORD

    if (!isValid) {
      // Record failed attempt
      recordLoginAttempt(ip, false, 'owner', { userAgent, email: 'owner@genplatform.ai' })
      
      // Log security event
      await logLoginAttempt(ip, false, 'owner@genplatform.ai', userAgent, {
        reason: 'invalid_password',
        remainingAttempts: Math.max(0, rateLimitCheck.attemptsRemaining - 1)
      })

      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid password. ${Math.max(0, rateLimitCheck.attemptsRemaining - 1)} attempts remaining.`,
          remainingAttempts: Math.max(0, rateLimitCheck.attemptsRemaining - 1)
        },
        { status: 401 }
      )
    }

    // Successful login
    recordLoginAttempt(ip, true, 'owner', { userAgent, email: 'owner@genplatform.ai' })
    
    // Log successful login
    await logLoginAttempt(ip, true, 'owner@genplatform.ai', userAgent, {
      role: 'OWNER',
      loginTime: new Date().toISOString()
    })

    // Create session payload
    const sessionPayload = {
      role: 'OWNER',
      userId: 'owner',
      email: 'owner@genplatform.ai',
      displayName: 'Platform Owner',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }

    // Create simple token (in production, use proper JWT with signing)
    const token = Buffer.from(JSON.stringify(sessionPayload)).toString('base64')

    // Set response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: 'owner',
        role: 'OWNER',
        email: 'owner@genplatform.ai',
        displayName: 'Platform Owner'
      }
    })

    // Set secure HttpOnly cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: '/'
    })

    // Set CSRF token cookie for subsequent requests (Task 9-02)
    const csrfToken = generateCSRFToken()
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false, // Client needs to read this for forms
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    
    // Record failed attempt on error
    recordLoginAttempt(ip, false, 'owner', { 
      userAgent, 
      error: error instanceof Error ? error.message : 'unknown_error'
    })
    
    // Log security event
    await logLoginAttempt(ip, false, 'owner@genplatform.ai', userAgent, {
      reason: 'system_error',
      error: error instanceof Error ? error.message : 'unknown_error'
    })

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate CSRF token (Task 9-02 preparation)
 */
function generateCSRFToken(): string {
  return require('crypto').randomUUID()
}