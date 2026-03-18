import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    if (password === 'admin123') {
      // Create response with success
      const response = NextResponse.json({ success: true })
      
      // Set httpOnly cookie for authentication
      response.cookies.set({
        name: 'session',
        value: 'authenticated',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400, // 24 hours
        path: '/'
      })
      
      return response
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}