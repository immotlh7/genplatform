import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { config } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwtSecret) as any

    return NextResponse.json({
      valid: true,
      decoded
    })

  } catch (error) {
    return NextResponse.json(
      { valid: false, error: 'Invalid token' },
      { status: 401 }
    )
  }
}