import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST() {
  try {
    // Clear the auth session cookie
    cookies().delete('auth-session')
    
    // Also clear Supabase session if present
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.signOut()

    return NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}