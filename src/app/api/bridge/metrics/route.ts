import { NextResponse } from "next/server"
import os from "os"

const BRIDGE_URL = process.env.BRIDGE_API_URL || "http://localhost:3010"

export async function GET() {
  try {
    // Try to get metrics from bridge
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${BRIDGE_URL}/metrics`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      cache: "no-store"
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    }
  } catch (error) {
    // Bridge metrics not available, return system metrics
  }

  // Return system-level metrics as fallback
  const cpus = os.cpus()
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const usedMemory = totalMemory - freeMemory
  const memoryUsagePercent = (usedMemory / totalMemory) * 100

  // Calculate CPU usage (simplified)
  const cpuUsage = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0)
    const idle = cpu.times.idle
    return acc + ((total - idle) / total) * 100
  }, 0) / cpus.length

  return NextResponse.json({
    cpu: cpuUsage,
    memory: memoryUsagePercent,
    totalMemory: totalMemory,
    freeMemory: freeMemory,
    uptime: os.uptime(),
    timestamp: new Date().toISOString()
  })
}
