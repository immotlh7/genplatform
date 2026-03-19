import { NextRequest, NextResponse } from 'next/server'

// GET /api/bridge/health - Check Bridge API health
export async function GET(request: NextRequest) {
  try {
    // Try to fetch the Bridge API status
    const bridgeUrl = process.env.BRIDGE_API_URL || 'http://localhost:3002'
    
    const response = await fetch(`${bridgeUrl}/api/bridge/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Short timeout for health checks
      signal: AbortSignal.timeout(5000)
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        status: 'healthy',
        bridge: 'connected',
        timestamp: new Date().toISOString(),
        bridgeStatus: data
      })
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        bridge: 'error',
        error: `Bridge API returned ${response.status}`,
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }
  } catch (error) {
    console.error('Bridge health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      bridge: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}