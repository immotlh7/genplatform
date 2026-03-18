import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('session')

    // Check owner authentication (cookie-based)
    if (sessionCookie && sessionCookie.value === 'authenticated') {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: 'owner',
          email: 'medtlh1@example.com', // Replace with actual owner email
          displayName: 'Med', // Replace with actual owner name
          role: 'OWNER',
          isOwner: true,
          authMethod: 'cookie'
        }
      })
    }

    // No valid authentication found
    return NextResponse.json({
      authenticated: false,
      user: null
    })
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { 
        authenticated: false, 
        user: null,
        error: 'Verification failed'
      },
      { status: 500 }
    )
  }
}