import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle auth errors
  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent(error_description || error), request.url))
  }

  // Handle auth success
  if (code) {
    try {
      // Exchange the auth code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
      }

      if (data.user) {
        // Verify user is in team_members table and active
        const { data: teamMember, error: memberError } = await supabase
          .from('team_members')
          .select('id, email, display_name, role, is_active')
          .eq('email', data.user.email)
          .eq('is_active', true)
          .single()

        if (memberError || !teamMember) {
          console.error('Team member verification failed:', memberError)
          await supabase.auth.signOut()
          return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
        }

        // Success - redirect to dashboard
        const response = NextResponse.redirect(new URL('/dashboard', request.url))
        
        // Set Supabase session cookies
        if (data.session) {
          response.cookies.set('sb-access-token', data.session.access_token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: data.session.expires_in
          })
          
          response.cookies.set('sb-refresh-token', data.session.refresh_token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 days
          })
        }

        return response
      }
    } catch (error) {
      console.error('Auth callback processing error:', error)
      return NextResponse.redirect(new URL('/login?error=processing_failed', request.url))
    }
  }

  // No code or error - redirect to login
  return NextResponse.redirect(new URL('/login', request.url))
}