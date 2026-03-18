import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Clear the auth session cookie
    cookies().delete('auth-session')
    
    // Clear any other auth-related cookies
    cookies().delete('sb-access-token')
    cookies().delete('sb-refresh-token')

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