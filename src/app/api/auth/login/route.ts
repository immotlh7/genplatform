import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { config } from '@/lib/config'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)
  
  // Rate limiting: 5 attempts per 15 minutes per IP
  const { success, remaining, resetTime } = rateLimit(`login:${clientIp}`, 5)
  
  if (!success) {
    return NextResponse.json(
      { 
        error: 'Too many login attempts. Please try again later.',
        resetTime: new Date(resetTime).toISOString()
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString()
        }
      }
    )
  }

  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { 
          status: 400,
          headers: {
            'X-RateLimit-Remaining': remaining.toString()
          }
        }
      )
    }

    // Validate password
    if (password !== config.dashboardPassword) {
      // Log failed attempt
      console.warn(`Failed login attempt from IP: ${clientIp}`)
      
      return NextResponse.json(
        { error: 'Invalid password' },
        { 
          status: 401,
          headers: {
            'X-RateLimit-Remaining': remaining.toString()
          }
        }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        authenticated: true,
        timestamp: Date.now(),
        ip: clientIp
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    )

    console.log(`Successful login from IP: ${clientIp}`)

    return NextResponse.json({
      success: true,
      token,
      message: 'Authentication successful'
    }, {
      headers: {
        'X-RateLimit-Remaining': remaining.toString()
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'X-RateLimit-Remaining': remaining.toString()
        }
      }
    )
  }
}