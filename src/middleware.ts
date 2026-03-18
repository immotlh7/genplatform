import { NextRequest, NextResponse } from 'next/server'

// Rate limiting store (in production, use Redis)
const loginAttempts = new Map<string, { attempts: number; resetTime: number }>()

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Rate limiting for login endpoints
  if (pathname.includes('/api/auth/login')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const rateLimitWindow = 15 * 60 * 1000 // 15 minutes
    const maxAttempts = 5
    
    const record = loginAttempts.get(ip)
    
    if (record) {
      if (now < record.resetTime) {
        if (record.attempts >= maxAttempts) {
          return NextResponse.json(
            { 
              error: `Too many login attempts. Try again in ${Math.ceil((record.resetTime - now) / 60000)} minutes.` 
            },
            { status: 429 }
          )
        }
      } else {
        // Reset window expired
        loginAttempts.set(ip, { attempts: 1, resetTime: now + rateLimitWindow })
      }
    } else {
      // First attempt
      loginAttempts.set(ip, { attempts: 1, resetTime: now + rateLimitWindow })
    }
    
    // Increment attempt count
    const currentRecord = loginAttempts.get(ip)!
    currentRecord.attempts++
    
    // Log failed attempts to security_events (will be implemented in Task 9-08)
    if (currentRecord.attempts > 1) {
      // Log suspicious activity
      console.log(`Multiple login attempts from IP: ${ip}`)
    }
  }

  // CSRF protection (Task 9-02)
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token')
    const csrfCookie = request.cookies.get('csrf-token')
    
    if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie.value) {
      // Allow API routes to handle their own CSRF if needed
      if (!pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }
    }
  }

  // Security headers (Task 9-04)
  const response = NextResponse.next()
  
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}