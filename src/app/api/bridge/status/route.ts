import { NextResponse } from "next/server"

const BRIDGE_URL = process.env.BRIDGE_API_URL || "http://localhost:3010"

export async function GET() {
  try {
    // Try to connect to the actual bridge API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${BRIDGE_URL}/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      cache: "no-store"
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        gateway: {
          status: "running",
          url: BRIDGE_URL,
          ...data
        },
        services: data.services || [],
        timestamp: new Date().toISOString()
      })
    }

    // Bridge responded but with error status
    return NextResponse.json({
      gateway: {
        status: "error",
        url: BRIDGE_URL,
        error: `Bridge returned status ${response.status}`
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    // Check if the bridge is running on a different endpoint
    try {
      // Try health endpoint as fallback
      const healthResponse = await fetch(`${BRIDGE_URL}/health`, {
        method: "GET",
        cache: "no-store"
      })
      
      if (healthResponse.ok) {
        return NextResponse.json({
          gateway: {
            status: "running",
            url: BRIDGE_URL
          },
          timestamp: new Date().toISOString()
        })
      }
    } catch {
      // Health check also failed
    }

    // Try to detect if gateway is running via pm2 or other means
    // For now, return offline status
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json({
      gateway: {
        status: "offline",
        url: BRIDGE_URL,
        error: errorMessage
      },
      timestamp: new Date().toISOString()
    }, { status: 200 }) // Return 200 so frontend can parse the response
  }
}
