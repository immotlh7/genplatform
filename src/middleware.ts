import { NextRequest, NextResponse } from 'next/server'
import { createCSRFMiddleware } from '@/lib/csrf'

// Create CSRF middleware
const csrfMiddleware = createCSRFMiddleware()

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Apply CSRF protection to all routes except excluded ones
  const excludedPaths = [
    '/_next',
    '/api/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/api/webhooks', // Webhook endpoints use other auth methods
    '/api/auth/callback', // OAuth callbacks
    '/static',
    '/images'
  ]

  const shouldApplyCSRF = !excludedPaths.some(path => pathname.startsWith(path))

  if (shouldApplyCSRF) {
    // Apply CSRF protection
    const csrfResponse = await csrfMiddleware(req)
    if (csrfResponse) {
      return csrfResponse
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next()

  // Security headers (Task 9-04 preview)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // CSP header for additional XSS protection
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.supabase.co https://*.supabase.co"
  )

  return response
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/webhooks (webhook endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}