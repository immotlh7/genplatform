import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/login', '/_next', '/favicon.ico']
  
  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Check for session cookie
  const sessionCookie = request.cookies.get('session')
  
  if (!sessionCookie || sessionCookie.value !== 'authenticated') {
    // Redirect to login if no valid session
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // Allow access if authenticated
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/login (authentication endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth/login|_next/static|_next/image|favicon.ico).*)',
  ],
}