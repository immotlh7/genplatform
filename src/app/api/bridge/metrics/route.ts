import { NextResponse } from "next/server"

const BRIDGE_URL = process.env.BRIDGE_API_URL || "http://localhost:3456"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${BRIDGE_URL}/metrics`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Bridge returned ${response.status}` },
        { status: 200 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Metrics not available" },
      { status: 200 }
    )
  }
}
