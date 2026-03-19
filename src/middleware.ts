import { NextRequest, NextResponse } from 'next/server'
import { requireCSRF } from '@/lib/csrf'
import { createClient } from '@supabase/supabase-js'

/**
 * Next.js Middleware for Security and Authentication
 * Handles dual auth system: Owner (cookie-based) + Team Members (Supabase)
 */

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/projects',
  '/chat',
  '/ideas',
  '/reports',
  '/team'
]

// Routes that require owner access specifically
const OWNER_ONLY_ROUTES = [
  '/team'
]

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/auth/callback', // Supabase auth callback
  '/auth/reset-password'
]

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // Apply security headers to all responses first
  const response = await handleAuthentication(req)
  
  // Apply security headers
  applySecurityHeaders(response, req)
  
  // Apply CSRF protection to API routes
  if (pathname.startsWith('/api/') && !shouldSkipCSRF(pathname)) {
    const csrfResult = await requireCSRF(req)
    
    if (!csrfResult.valid && csrfResult.response) {
      return csrfResult.response
    }
  }
  
  return response
}

/**
 * Handle authentication checks
 */
async function handleAuthentication(req: NextRequest): Promise<NextResponse> {
  const pathname = req.nextUrl.pathname
  const url = req.nextUrl.clone()
  
  // Skip authentication for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }
  
  // Skip authentication for API routes (handled in API handlers)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Check if route requires authentication
  if (isProtectedRoute(pathname)) {
    const authResult = await checkAuthentication(req)
    
    if (!authResult.authenticated) {
      // Redirect to login if not authenticated
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    
    // Check if route requires owner access
    if (isOwnerOnlyRoute(pathname) && authResult.userType !== 'owner') {
      // Redirect to dashboard if not owner
      url.pathname = '/dashboard'
      url.searchParams.set('error', 'access_denied')
      return NextResponse.redirect(url)
    }
  }
  
  return NextResponse.next()
}

/**
 * Check authentication from both owner cookies and Supabase session
 */
async function checkAuthentication(req: NextRequest): Promise<{
  authenticated: boolean
  userType: 'owner' | 'team_member' | null
  userId?: string
  email?: string
}> {
  // Check owner authentication first (cookie-based)
  const ownerAuth = checkOwnerAuthentication(req)
  if (ownerAuth.authenticated) {
    return ownerAuth
  }
  
  // Check Supabase authentication for team members
  const supabaseAuth = await checkSupabaseAuthentication(req)
  return supabaseAuth
}

/**
 * Check owner authentication via cookie
 */
function checkOwnerAuthentication(req: NextRequest): {
  authenticated: boolean
  userType: 'owner' | null
  userId?: string
  email?: string
} {
  const authCookie = req.cookies.get('auth-token')
  
  if (!authCookie) {
    return { authenticated: false, userType: null }
  }
  
  try {
    const sessionData = JSON.parse(Buffer.from(authCookie.value, 'base64').toString())
    
    // Validate session
    if (sessionData.role === 'OWNER' && sessionData.exp > Math.floor(Date.now() / 1000)) {
      return {
        authenticated: true,
        userType: 'owner',
        userId: sessionData.userId,
        email: sessionData.email
      }
    }
  } catch (error) {
    console.error('Invalid owner auth cookie:', error)
  }
  
  return { authenticated: false, userType: null }
}

/**
 * Check Supabase authentication for team members
 */
async function checkSupabaseAuthentication(req: NextRequest): Promise<{
  authenticated: boolean
  userType: 'team_member' | null
  userId?: string
  email?: string
}> {
  try {
    // Get Supabase auth from cookies
    const accessToken = req.cookies.get('sb-access-token')
    const refreshToken = req.cookies.get('sb-refresh-token')
    
    if (!accessToken || !refreshToken) {
      return { authenticated: false, userType: null }
    }
    
    // Create Supabase client for server-side validation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase configuration missing in middleware')
      return { authenticated: false, userType: null }
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify the access token
    const { data: { user }, error } = await supabase.auth.getUser(accessToken.value)
    
    if (error || !user) {
      return { authenticated: false, userType: null }
    }
    
    // Check if user is in team_members table and active
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select('id, email, status, role')
      .eq('email', user.email)
      .eq('status', 'active')
      .single()
    
    if (memberError || !teamMember) {
      return { authenticated: false, userType: null }
    }
    
    return {
      authenticated: true,
      userType: 'team_member',
      userId: user.id,
      email: user.email
    }
    
  } catch (error) {
    console.error('Supabase auth check failed:', error)
    return { authenticated: false, userType: null }
  }
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse, req: NextRequest): void {
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'", 
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://zvhtlsrcfvlmbhexuumf.supabase.co wss://zvhtlsrcfvlmbhexuumf.supabase.co",
    "frame-ancestors 'none'"
  ]
  
  response.headers.set('Content-Security-Policy', cspDirectives.join('; ') + ';')
  
  // Additional security headers
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
}

/**
 * Route classification helpers
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(route)
  })
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

function isOwnerOnlyRoute(pathname: string): boolean {
  return OWNER_ONLY_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Determine if CSRF protection should be skipped for this path
 */
function shouldSkipCSRF(pathname: string): boolean {
  const skipPaths = [
    '/api/csrf-token',
    '/api/health', 
    '/api/webhook/',
    '/api/test-',
    '/api/auth/callback', // Supabase auth callback
    '/api/auth/login',   // Owner login (no token yet)
    '/api/auth/check',   // Session check
    '/api/bridge/',      // Bridge API data routes
    '/api/team',         // Team data
    '/api/workflows',    // Workflows data
    '/api/projects',     // Projects data
    '/api/tasks'         // Tasks data
  ]
  
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