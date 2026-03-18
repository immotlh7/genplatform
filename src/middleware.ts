import { NextRequest, NextResponse } from 'next/server'
import { requireCSRF } from '@/lib/csrf'

/**
 * Next.js Middleware for Security
 * Applies CSRF protection and security headers
 */

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // Apply security headers to all responses
  const response = await applySecurityHeaders(req)
  
  // Skip CSRF protection for certain paths
  const skipCSRF = shouldSkipCSRF(pathname)
  
  if (!skipCSRF) {
    // Apply CSRF protection to API routes
    if (pathname.startsWith('/api/')) {
      const csrfResult = await requireCSRF(req)
      
      if (!csrfResult.valid && csrfResult.response) {
        return csrfResult.response
      }
    }
  }
  
  return response
}

/**
 * Apply security headers to response
 */
async function applySecurityHeaders(req: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next()
  
  // Security headers (Task 9-04)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy (basic)
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://zvhtlsrcfvlmbhexuumf.supabase.co wss://zvhtlsrcfvlmbhexuumf.supabase.co; " +
    "frame-ancestors 'none';"
  )
  
  // Additional security headers
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  
  return response
}

/**
 * Determine if CSRF protection should be skipped for this path
 */
function shouldSkipCSRF(pathname: string): boolean {
  const skipPaths = [
    '/api/csrf-token', // CSRF token endpoint itself
    '/api/health', // Health check
    '/api/webhook/', // Webhooks (external calls)
    '/api/test-', // Test endpoints during development
  ]
  
  const skipMethods = ['GET', 'HEAD', 'OPTIONS']
  
  return skipPaths.some(path => pathname.startsWith(path))
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}