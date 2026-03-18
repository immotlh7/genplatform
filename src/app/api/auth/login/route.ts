import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { config } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Simple password check (hardcoded for now)
    if (password !== config.dashboardPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        authenticated: true,
        timestamp: Date.now()
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      success: true,
      token,
      message: 'Authentication successful'
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}