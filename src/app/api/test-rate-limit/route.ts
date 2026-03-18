import { NextRequest, NextResponse } from 'next/server'
import { isRateLimited, recordLoginAttempt, getRateLimitStats } from '@/lib/rate-limiter'

/**
 * Test endpoint for rate limiting functionality
 * GET /api/test-rate-limit - Get current rate limit status
 * POST /api/test-rate-limit - Simulate login attempts
 */

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || 
         req.headers.get('x-real-ip') || 
         req.ip || 
         '127.0.0.1'
}

export async function GET(req: NextRequest) {
  const ip = getClientIP(req)
  
  try {
    const rateLimitStatus = isRateLimited(ip, 'owner')
    const globalStats = getRateLimitStats()
    
    return NextResponse.json({
      success: true,
      ip,
      rateLimitStatus,
      globalStats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const { success = false, count = 1 } = await req.json()
  
  try {
    // Simulate multiple login attempts
    for (let i = 0; i < count; i++) {
      recordLoginAttempt(ip, success, 'owner', {
        userAgent: req.headers.get('user-agent'),
        email: 'test@example.com',
        testAttempt: i + 1
      })
    }
    
    // Check current status
    const rateLimitStatus = isRateLimited(ip, 'owner')
    
    return NextResponse.json({
      success: true,
      message: `Recorded ${count} ${success ? 'successful' : 'failed'} login attempts`,
      ip,
      rateLimitStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}