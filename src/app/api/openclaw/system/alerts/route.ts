import { NextRequest, NextResponse } from 'next/server'

interface Alert {
  id: string
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'service' | 'security'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: string
  acknowledged: boolean
  source: string
  value?: number
  threshold?: number
  metadata?: Record<string, any>
}

interface AlertRule {
  id: string
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'service'
  metric: string
  operator: '>' | '<' | '==' | '!='
  threshold: number
  duration: number // seconds
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  title: string
  message: string
}

interface PerformanceMetrics {
  cpu: {
    usage: number
    loadAverage: number[]
    temperature?: number
  }
  memory: {
    usage: number
    available: number
  }
  disk: {
    usage: number
    ioWait?: number
  }
  network: {
    packetsDropped: number
    errors: number
    bandwidth?: number
  }
  timestamp: string
}

// Default alert rules
const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'cpu-high',
    type: 'cpu',
    metric: 'usage',
    operator: '>',
    threshold: 85,
    duration: 300, // 5 minutes
    severity: 'high',
    enabled: true,
    title: 'High CPU Usage',
    message: 'CPU usage has been above 85% for more than 5 minutes'
  },
  {
    id: 'cpu-critical',
    type: 'cpu',
    metric: 'usage',
    operator: '>',
    threshold: 95,
    duration: 60, // 1 minute
    severity: 'critical',
    enabled: true,
    title: 'Critical CPU Usage',
    message: 'CPU usage has reached critical levels (>95%)'
  },
  {
    id: 'memory-high',
    type: 'memory',
    metric: 'usage',
    operator: '>',
    threshold: 85,
    duration: 300,
    severity: 'high',
    enabled: true,
    title: 'High Memory Usage',
    message: 'Memory usage has been above 85% for more than 5 minutes'
  },
  {
    id: 'memory-critical',
    type: 'memory',
    metric: 'usage',
    operator: '>',
    threshold: 95,
    duration: 60,
    severity: 'critical',
    enabled: true,
    title: 'Critical Memory Usage',
    message: 'Memory usage has reached critical levels (>95%)'
  },
  {
    id: 'disk-high',
    type: 'disk',
    metric: 'usage',
    operator: '>',
    threshold: 85,
    duration: 600, // 10 minutes
    severity: 'medium',
    enabled: true,
    title: 'High Disk Usage',
    message: 'Disk usage has been above 85% for more than 10 minutes'
  },
  {
    id: 'disk-critical',
    type: 'disk',
    metric: 'usage',
    operator: '>',
    threshold: 95,
    duration: 60,
    severity: 'critical',
    enabled: true,
    title: 'Critical Disk Usage',
    message: 'Disk usage has reached critical levels (>95%)'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'alerts' | 'rules' | 'metrics'
    const acknowledged = searchParams.get('acknowledged')
    const severity = searchParams.get('severity')

    switch (type) {
      case 'rules':
        return NextResponse.json({
          rules: DEFAULT_RULES,
          total: DEFAULT_RULES.length,
          enabled: DEFAULT_RULES.filter(r => r.enabled).length
        })

      case 'metrics':
        const metrics = await getCurrentMetrics()
        return NextResponse.json({
          metrics,
          timestamp: new Date().toISOString()
        })

      default: // alerts
        const alerts = await getAlerts(acknowledged, severity)
        return NextResponse.json({
          alerts,
          total: alerts.length,
          unacknowledged: alerts.filter(a => !a.acknowledged).length,
          critical: alerts.filter(a => a.severity === 'critical').length
        })
    }

  } catch (error) {
    console.error('Alerts API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve alerts data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, alertId, ruleId, rule } = await request.json()

    switch (action) {
      case 'acknowledge':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          )
        }
        
        // In production, update alert in database
        console.log(`Acknowledging alert: ${alertId}`)
        
        return NextResponse.json({
          success: true,
          message: 'Alert acknowledged',
          alertId
        })

      case 'dismiss':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          )
        }
        
        console.log(`Dismissing alert: ${alertId}`)
        
        return NextResponse.json({
          success: true,
          message: 'Alert dismissed',
          alertId
        })

      case 'create_rule':
        if (!rule) {
          return NextResponse.json(
            { error: 'Rule data is required' },
            { status: 400 }
          )
        }
        
        console.log('Creating new alert rule:', rule)
        
        return NextResponse.json({
          success: true,
          message: 'Alert rule created',
          ruleId: `rule-${Date.now()}`
        })

      case 'update_rule':
        if (!ruleId || !rule) {
          return NextResponse.json(
            { error: 'Rule ID and rule data are required' },
            { status: 400 }
          )
        }
        
        console.log(`Updating rule: ${ruleId}`, rule)
        
        return NextResponse.json({
          success: true,
          message: 'Alert rule updated',
          ruleId
        })

      case 'delete_rule':
        if (!ruleId) {
          return NextResponse.json(
            { error: 'Rule ID is required' },
            { status: 400 }
          )
        }
        
        console.log(`Deleting rule: ${ruleId}`)
        
        return NextResponse.json({
          success: true,
          message: 'Alert rule deleted',
          ruleId
        })

      case 'test_metrics':
        // Force generate some test alerts based on current metrics
        const testAlerts = await generateTestAlerts()
        
        return NextResponse.json({
          success: true,
          message: 'Test alerts generated',
          alerts: testAlerts
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Alerts action error:', error)
    return NextResponse.json(
      { error: 'Failed to perform alert action' },
      { status: 500 }
    )
  }
}

async function getAlerts(acknowledged?: string, severity?: string): Promise<Alert[]> {
  // In production, fetch from database
  // For demo, generate some sample alerts
  const now = new Date()
  const alerts: Alert[] = []

  // Simulate some current alerts
  const sampleAlerts = [
    {
      id: 'alert-1',
      type: 'cpu' as const,
      severity: 'high' as const,
      title: 'High CPU Usage Detected',
      message: 'CPU usage has been consistently above 85% for the past 8 minutes',
      timestamp: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
      acknowledged: false,
      source: 'System Monitor',
      value: 87.5,
      threshold: 85
    },
    {
      id: 'alert-2',
      type: 'memory' as const,
      severity: 'medium' as const,
      title: 'Memory Usage Warning',
      message: 'Memory usage is approaching high levels (78%)',
      timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      acknowledged: true,
      source: 'System Monitor',
      value: 78.2,
      threshold: 75
    },
    {
      id: 'alert-3',
      type: 'service' as const,
      severity: 'critical' as const,
      title: 'Service Down',
      message: 'Redis service appears to be offline or unresponsive',
      timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      acknowledged: false,
      source: 'Service Monitor',
      metadata: { service: 'redis' }
    },
    {
      id: 'alert-4',
      type: 'disk' as const,
      severity: 'low' as const,
      title: 'Disk Space Notice',
      message: 'Root partition is 68% full - consider cleanup',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      acknowledged: false,
      source: 'System Monitor',
      value: 68,
      threshold: 65
    },
    {
      id: 'alert-5',
      type: 'network' as const,
      severity: 'medium' as const,
      title: 'Network Latency',
      message: 'High latency detected on external connections (>500ms)',
      timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      acknowledged: true,
      source: 'Network Monitor',
      value: 523,
      threshold: 500
    }
  ]

  // Apply filters
  let filteredAlerts = sampleAlerts

  if (acknowledged === 'false') {
    filteredAlerts = filteredAlerts.filter(a => !a.acknowledged)
  } else if (acknowledged === 'true') {
    filteredAlerts = filteredAlerts.filter(a => a.acknowledged)
  }

  if (severity) {
    filteredAlerts = filteredAlerts.filter(a => a.severity === severity)
  }

  return filteredAlerts
}

async function getCurrentMetrics(): Promise<PerformanceMetrics> {
  try {
    // Fetch current metrics from system resources API
    const response = await fetch('http://localhost:3000/api/openclaw/system/resources?detailed=true')
    const data = await response.json()
    
    if (data.resources) {
      return {
        cpu: {
          usage: data.resources.cpu.usage,
          loadAverage: data.resources.loadAverage,
          temperature: data.resources.cpu.temperature
        },
        memory: {
          usage: data.resources.memory.usage,
          available: data.resources.memory.available
        },
        disk: {
          usage: data.resources.disk.usage
        },
        network: {
          packetsDropped: 0, // Would need to calculate from network interfaces
          errors: 0
        },
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    // Fallback to mock data if API not available
  }

  // Fallback mock metrics
  return {
    cpu: {
      usage: Math.floor(Math.random() * 40) + 20, // 20-60%
      loadAverage: [0.5, 0.7, 0.8]
    },
    memory: {
      usage: Math.floor(Math.random() * 30) + 40, // 40-70%
      available: 4 * 1024 * 1024 * 1024 // 4GB
    },
    disk: {
      usage: Math.floor(Math.random() * 20) + 50 // 50-70%
    },
    network: {
      packetsDropped: 0,
      errors: 0
    },
    timestamp: new Date().toISOString()
  }
}

async function generateTestAlerts(): Promise<Alert[]> {
  const now = new Date()
  
  return [
    {
      id: `test-${Date.now()}`,
      type: 'cpu',
      severity: 'critical',
      title: 'TEST: Critical CPU Alert',
      message: 'This is a test alert for demonstration purposes',
      timestamp: now.toISOString(),
      acknowledged: false,
      source: 'Test Generator',
      value: 98,
      threshold: 95
    }
  ]
}