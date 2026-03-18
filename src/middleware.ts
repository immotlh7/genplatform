import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function middleware(request: NextRequest) {
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/login', '/auth/callback', '/_next', '/favicon.ico']
  
  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  if (isPublicRoute) {
    return NextResponse.next()
  }

  let userInfo = null
  let response = NextResponse.next()

  try {
    // Check 1: Owner login (session cookie)
    const sessionCookie = request.cookies.get('session')
    
    if (sessionCookie && sessionCookie.value === 'authenticated') {
      // Owner is authenticated via cookie
      userInfo = {
        id: 'owner',
        email: 'medtlh1@example.com', // Replace with actual owner email
        displayName: 'Med', // Replace with actual owner name
        role: 'OWNER',
        isOwner: true,
        authMethod: 'cookie'
      }
    } else {
      // Check 2: Team member login (Supabase Auth session)
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // Get session from Supabase Auth (check cookies/headers)
      const authToken = request.cookies.get('sb-access-token')?.value ||
                       request.cookies.get('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token')?.value

      if (authToken) {
        try {
          // Verify the session with Supabase
          const { data: { user }, error } = await supabase.auth.getUser(authToken)
          
          if (user && !error) {
            // Get team member details from database
            const { data: teamMember, error: memberError } = await supabase
              .from('team_members')
              .select('id, email, display_name, role, is_active')
              .eq('email', user.email)
              .eq('is_active', true)
              .single()

            if (teamMember && !memberError) {
              userInfo = {
                id: teamMember.id,
                email: teamMember.email,
                displayName: teamMember.display_name,
                role: teamMember.role,
                isOwner: teamMember.role === 'OWNER',
                authMethod: 'supabase'
              }
            }
          }
        } catch (supabaseError) {
          console.error('Supabase auth verification failed:', supabaseError)
        }
      }
    }

    // If no valid authentication found, redirect to login
    if (!userInfo) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Attach user info to request headers for downstream use
    response.headers.set('x-user-id', userInfo.id)
    response.headers.set('x-user-email', userInfo.email)
    response.headers.set('x-user-name', userInfo.displayName)
    response.headers.set('x-user-role', userInfo.role)
    response.headers.set('x-user-is-owner', userInfo.isOwner.toString())
    response.headers.set('x-auth-method', userInfo.authMethod)

    return response

  } catch (error) {
    console.error('Middleware authentication error:', error)
    
    // On error, redirect to login for security
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/login (authentication endpoint)
     * - auth/callback (Supabase auth callback)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth/login|auth/callback|_next/static|_next/image|favicon.ico).*)',
  ],
}