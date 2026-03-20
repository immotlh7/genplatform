import { NextResponse } from "next/server"

const BRIDGE_URL = process.env.BRIDGE_API_URL || "http://localhost:3456"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    // Try to reach the bridge
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${BRIDGE_URL}/status`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json(
        {
          gateway: { status: "offline" },
          services: [],
          error: `Bridge returned ${response.status}`,
        },
        { status: 200 } // Return 200 so client can handle
      )
    }

    const data = await response.json()

    // Normalize the response
    return NextResponse.json({
      gateway: data.gateway || { status: data.status || "unknown" },
      services: data.services || [],
      uptime: data.uptime,
      version: data.version,
    })
  } catch (error) {
    // Bridge not reachable
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    // Check if it's a connection refused error
    if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("fetch failed")) {
      return NextResponse.json(
        {
          gateway: { status: "offline" },
          services: [],
          error: "Bridge service not reachable",
          connecting: true,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        gateway: { status: "unknown" },
        services: [],
        error: errorMessage,
      },
      { status: 200 }
    )
  }
}
