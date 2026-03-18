import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Supabase Auth Callback Handler
 * Handles the OAuth callback and email confirmation flows
 */
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  
  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_failed`)
      }
      
      if (data.user) {
        // Verify user is in team_members table
        const { data: teamMember, error: memberError } = await supabase
          .from('team_members')
          .select('id, email, status, role')
          .eq('email', data.user.email)
          .single()
        
        if (memberError || !teamMember) {
          console.error('User not found in team_members:', memberError)
          await supabase.auth.signOut()
          return NextResponse.redirect(`${requestUrl.origin}/login?error=unauthorized`)
        }
        
        if (teamMember.status !== 'active') {
          console.error('User account not active:', teamMember.status)
          await supabase.auth.signOut()
          return NextResponse.redirect(`${requestUrl.origin}/login?error=account_inactive`)
        }
        
        // Success - redirect to intended destination
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_error`)
    }
  }
  
  // No code parameter or other error
  return NextResponse.redirect(`${requestUrl.origin}/login?error=missing_code`)
}