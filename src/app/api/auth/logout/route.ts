import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Get the cookies instance
    const cookieStore = await cookies()
    
    // Clear the auth session cookie
    cookieStore.delete('auth-session')
    
    // Clear any other auth-related cookies
    cookieStore.delete('sb-access-token')
    cookieStore.delete('sb-refresh-token')

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