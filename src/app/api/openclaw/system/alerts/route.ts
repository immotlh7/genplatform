import { NextRequest, NextResponse } from 'next/server'

interface SystemAlert {
  id: string
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
  category: 'cpu' | 'memory' | 'disk' | 'network' | 'service' | 'security'
  title: string
  message: string
  source?: string
  resolved?: boolean
  resolvedAt?: string
  metadata?: Record<string, any>
}

interface AlertThresholds {
  cpu: {
    warning: number
    critical: number
  }
  memory: {
    warning: number
    critical: number
  }
  disk: {
    warning: number
    critical: number
  }
  responseTime: {
    warning: number // ms
    critical: number // ms
  }
  errorRate: {
    warning: number // percentage
    critical: number // percentage
  }
}

// Default thresholds
const DEFAULT_THRESHOLDS: AlertThresholds = {
  cpu: {
    warning: 70,
    critical: 90
  },
  memory: {
    warning: 80,
    critical: 95
  },
  disk: {
    warning: 85,
    critical: 95
  },
  responseTime: {
    warning: 3000, // 3 seconds
    critical: 5000 // 5 seconds
  },
  errorRate: {
    warning: 5, // 5%
    critical: 10 // 10%
  }
}

// In-memory alert storage (in production, use a database)
let alerts: SystemAlert[] = []
let alertThresholds: AlertThresholds = DEFAULT_THRESHOLDS

// Generate demo alerts
function generateDemoAlerts(): SystemAlert[] {
  const now = new Date()
  const demoAlerts: SystemAlert[] = [
    {
      id: '1',
      timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      severity: 'warning',
      category: 'memory',
      title: 'High Memory Usage',
      message: 'Memory usage has exceeded 80% threshold',
      source: 'System Monitor',
      metadata: {
        currentUsage: 82,
        threshold: 80
      }
    },
    {
      id: '2',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      severity: 'info',
      category: 'service',
      title: 'Service Restarted',
      message: 'OpenClaw Gateway service was restarted successfully',
      source: 'Service Manager',
      resolved: true,
      resolvedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 60000).toISOString(),
      metadata: {
        service: 'openclaw-gateway',
        reason: 'Manual restart'
      }
    },
    {
      id: '3',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      severity: 'critical',
      category: 'disk',
      title: 'Low Disk Space',
      message: 'Disk usage has exceeded 95% threshold on /var',
      source: 'Disk Monitor',
      resolved: true,
      resolvedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      metadata: {
        mount: '/var',
        currentUsage: 96,
        threshold: 95
      }
    }
  ]

  return demoAlerts
}

// GET /api/bridge/system/alerts
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const severity = url.searchParams.get('severity')
    const category = url.searchParams.get('category')
    const resolved = url.searchParams.get('resolved')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Initialize with demo alerts if empty
    if (alerts.length === 0) {
      alerts = generateDemoAlerts()
    }

    // Filter alerts based on query parameters
    let filteredAlerts = [...alerts]

    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity)
    }

    if (category) {
      filteredAlerts = filteredAlerts.filter(alert => alert.category === category)
    }

    if (resolved !== null) {
      const isResolved = resolved === 'true'
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === isResolved)
    }

    // Sort by timestamp (newest first)
    filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const paginatedAlerts = filteredAlerts.slice(offset, offset + limit)

    return NextResponse.json({
      alerts: paginatedAlerts,
      total: filteredAlerts.length,
      offset,
      limit,
      hasMore: offset + limit < filteredAlerts.length
    })
  } catch (error) {
    console.error('Failed to get alerts:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve system alerts' },
      { status: 500 }
    )
  }
}

// POST /api/bridge/system/alerts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.severity || !body.category || !body.title || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: severity, category, title, message' },
        { status: 400 }
      )
    }

    // Create new alert
    const newAlert: SystemAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      severity: body.severity,
      category: body.category,
      title: body.title,
      message: body.message,
      source: body.source || 'System',
      resolved: false,
      metadata: body.metadata || {}
    }

    // Add to alerts array
    alerts.push(newAlert)

    // Keep only last 1000 alerts in memory
    if (alerts.length > 1000) {
      alerts = alerts.slice(-1000)
    }

    return NextResponse.json({
      alert: newAlert
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create alert:', error)
    return NextResponse.json(
      { error: 'Failed to create system alert' },
      { status: 500 }
    )
  }
}

// PUT /api/bridge/system/alerts/thresholds
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    
    if (url.pathname.endsWith('/thresholds')) {
      const body = await request.json()
      
      // Update thresholds
      alertThresholds = {
        ...alertThresholds,
        ...body
      }

      return NextResponse.json({
        thresholds: alertThresholds
      })
    }

    // Update alert (mark as resolved)
    const alertId = url.pathname.split('/').pop()
    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    const alertIndex = alerts.findIndex(a => a.id === alertId)
    if (alertIndex === -1) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    // Mark as resolved
    alerts[alertIndex] = {
      ...alerts[alertIndex],
      resolved: true,
      resolvedAt: new Date().toISOString()
    }

    return NextResponse.json({
      alert: alerts[alertIndex]
    })
  } catch (error) {
    console.error('Failed to update alert/thresholds:', error)
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    )
  }
}

// DELETE /api/bridge/system/alerts/:id
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const alertId = url.pathname.split('/').pop()
    
    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    const alertIndex = alerts.findIndex(a => a.id === alertId)
    if (alertIndex === -1) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    // Remove alert
    alerts.splice(alertIndex, 1)

    return NextResponse.json({
      success: true,
      deletedId: alertId
    })
  } catch (error) {
    console.error('Failed to delete alert:', error)
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    )
  }
}

// Monitoring function to generate alerts based on metrics
interface PerformanceMetrics {
  cpu?: {
    usage: number
  }
  memory?: {
    usagePercent: number
  }
  disk?: {
    usagePercent: number
  }
  responseTime?: number
  errorRate?: number
}

async function getCurrentMetrics(): Promise<PerformanceMetrics> {
  try {
    // Fetch current metrics from Bridge API
    const response = await fetch('http://localhost:3001/api/bridge/metrics')
    const data = await response.json()
    
    if (data) {
      return {
        cpu: {
          usage: data.cpu?.percent || 0
        },
        memory: {
          usagePercent: data.memory ? (data.memory.used / data.memory.total) * 100 : 0
        },
        disk: {
          usagePercent: data.disk ? (data.disk.used / data.disk.total) * 100 : 0
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch metrics:', error)
  }
  
  // Return empty metrics on error
  return {}
}

// Check metrics and generate alerts
export async function checkMetricsAndGenerateAlerts() {
  const metrics = await getCurrentMetrics()
  const now = new Date().toISOString()

  // Check CPU
  if (metrics.cpu?.usage) {
    if (metrics.cpu.usage >= alertThresholds.cpu.critical) {
      alerts.push({
        id: `cpu-critical-${Date.now()}`,
        timestamp: now,
        severity: 'critical',
        category: 'cpu',
        title: 'Critical CPU Usage',
        message: `CPU usage is at ${metrics.cpu.usage}%, exceeding critical threshold of ${alertThresholds.cpu.critical}%`,
        source: 'Metrics Monitor',
        metadata: { currentUsage: metrics.cpu.usage, threshold: alertThresholds.cpu.critical }
      })
    } else if (metrics.cpu.usage >= alertThresholds.cpu.warning) {
      alerts.push({
        id: `cpu-warning-${Date.now()}`,
        timestamp: now,
        severity: 'warning',
        category: 'cpu',
        title: 'High CPU Usage',
        message: `CPU usage is at ${metrics.cpu.usage}%, exceeding warning threshold of ${alertThresholds.cpu.warning}%`,
        source: 'Metrics Monitor',
        metadata: { currentUsage: metrics.cpu.usage, threshold: alertThresholds.cpu.warning }
      })
    }
  }

  // Check Memory
  if (metrics.memory?.usagePercent) {
    if (metrics.memory.usagePercent >= alertThresholds.memory.critical) {
      alerts.push({
        id: `memory-critical-${Date.now()}`,
        timestamp: now,
        severity: 'critical',
        category: 'memory',
        title: 'Critical Memory Usage',
        message: `Memory usage is at ${metrics.memory.usagePercent.toFixed(1)}%, exceeding critical threshold of ${alertThresholds.memory.critical}%`,
        source: 'Metrics Monitor',
        metadata: { currentUsage: metrics.memory.usagePercent, threshold: alertThresholds.memory.critical }
      })
    } else if (metrics.memory.usagePercent >= alertThresholds.memory.warning) {
      alerts.push({
        id: `memory-warning-${Date.now()}`,
        timestamp: now,
        severity: 'warning',
        category: 'memory',
        title: 'High Memory Usage',
        message: `Memory usage is at ${metrics.memory.usagePercent.toFixed(1)}%, exceeding warning threshold of ${alertThresholds.memory.warning}%`,
        source: 'Metrics Monitor',
        metadata: { currentUsage: metrics.memory.usagePercent, threshold: alertThresholds.memory.warning }
      })
    }
  }

  // Keep only last 1000 alerts
  if (alerts.length > 1000) {
    alerts = alerts.slice(-1000)
  }
}