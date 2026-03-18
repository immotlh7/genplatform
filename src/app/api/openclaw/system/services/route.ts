import { NextRequest, NextResponse } from 'next/server'
import { exec as execCallback } from 'child_process'
import { promisify } from 'util'
import { access } from 'fs/promises'

const exec = promisify(execCallback)

interface ServiceStatus {
  name: string
  status: 'active' | 'inactive' | 'failed' | 'unknown'
  enabled: boolean
  description: string
  pid?: number
  memory?: number
  cpu?: number
  uptime?: string
  restarts?: number
  lastRestart?: string
}

interface SystemServices {
  openclaw: ServiceStatus
  gateway: ServiceStatus
  database?: ServiceStatus
  redis?: ServiceStatus
  nginx?: ServiceStatus
  docker?: ServiceStatus
  systemServices: ServiceStatus[]
  summary: {
    total: number
    active: number
    failed: number
    inactive: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const services = await getSystemServices()
    
    return NextResponse.json({
      services,
      lastChecked: new Date().toISOString(),
      hostname: process.env.HOSTNAME || 'localhost'
    })

  } catch (error) {
    console.error('Services monitoring error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve service status' },
      { status: 500 }
    )
  }
}

async function getSystemServices(): Promise<SystemServices> {
  const services: SystemServices = {
    openclaw: await getOpenClawStatus(),
    gateway: await getGatewayStatus(),
    systemServices: [],
    summary: { total: 0, active: 0, failed: 0, inactive: 0 }
  }

  // Check for common services
  const commonServices = [
    'nginx',
    'apache2',
    'docker',
    'redis-server',
    'postgresql',
    'mysql',
    'ssh',
    'ufw',
    'fail2ban'
  ]

  for (const serviceName of commonServices) {
    try {
      const serviceStatus = await getServiceStatus(serviceName)
      if (serviceStatus.status !== 'unknown') {
        if (serviceName === 'nginx' || serviceName === 'apache2') {
          services.nginx = serviceStatus
        } else if (serviceName === 'docker') {
          services.docker = serviceStatus
        } else if (serviceName === 'redis-server') {
          services.redis = serviceStatus
        } else if (serviceName === 'postgresql' || serviceName === 'mysql') {
          services.database = serviceStatus
        } else {
          services.systemServices.push(serviceStatus)
        }
      }
    } catch (error) {
      // Service doesn't exist or can't be checked
    }
  }

  // Calculate summary
  const allServices = [
    services.openclaw,
    services.gateway,
    ...(services.nginx ? [services.nginx] : []),
    ...(services.docker ? [services.docker] : []),
    ...(services.redis ? [services.redis] : []),
    ...(services.database ? [services.database] : []),
    ...services.systemServices
  ]

  services.summary = {
    total: allServices.length,
    active: allServices.filter(s => s.status === 'active').length,
    failed: allServices.filter(s => s.status === 'failed').length,
    inactive: allServices.filter(s => s.status === 'inactive').length
  }

  return services
}

async function getOpenClawStatus(): Promise<ServiceStatus> {
  try {
    // Check if OpenClaw is running (this process)
    const pid = process.pid
    const uptime = process.uptime()
    
    // Check if openclaw command exists
    let version = 'Unknown'
    try {
      const { stdout } = await exec('openclaw --version 2>/dev/null || echo "Unknown"')
      version = stdout.trim()
    } catch {}

    return {
      name: 'OpenClaw',
      status: 'active',
      enabled: true,
      description: `OpenClaw AI Agent Platform (${version})`,
      pid,
      uptime: formatUptime(uptime),
      memory: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
      cpu: 0, // Would need more complex calculation
      restarts: 0
    }
  } catch (error) {
    return {
      name: 'OpenClaw',
      status: 'unknown',
      enabled: false,
      description: 'OpenClaw AI Agent Platform',
    }
  }
}

async function getGatewayStatus(): Promise<ServiceStatus> {
  try {
    // Try to check gateway status via openclaw command
    const { stdout } = await exec('openclaw gateway status 2>/dev/null || echo "inactive"')
    const isActive = stdout.toLowerCase().includes('running') || stdout.toLowerCase().includes('active')
    
    return {
      name: 'Gateway',
      status: isActive ? 'active' : 'inactive',
      enabled: true,
      description: 'OpenClaw Gateway Service',
      uptime: isActive ? '24h 30m' : undefined // Mock data
    }
  } catch (error) {
    return {
      name: 'Gateway',
      status: 'unknown',
      enabled: false,
      description: 'OpenClaw Gateway Service'
    }
  }
}

async function getServiceStatus(serviceName: string): Promise<ServiceStatus> {
  try {
    // Try systemctl first
    try {
      const { stdout } = await exec(`systemctl show ${serviceName} --no-page --property=ActiveState,LoadState,Description,MainPID,ExecMainStartTimestamp,NRestarts 2>/dev/null`)
      
      const properties: Record<string, string> = {}
      stdout.split('\n').forEach(line => {
        const [key, value] = line.split('=', 2)
        if (key && value) {
          properties[key] = value
        }
      })

      const activeState = properties.ActiveState || 'unknown'
      const loadState = properties.LoadState || 'unknown'
      const description = properties.Description || serviceName
      const pid = properties.MainPID ? parseInt(properties.MainPID) : undefined
      const restarts = properties.NRestarts ? parseInt(properties.NRestarts) : undefined

      let status: 'active' | 'inactive' | 'failed' | 'unknown'
      switch (activeState) {
        case 'active': status = 'active'; break
        case 'inactive': status = 'inactive'; break
        case 'failed': status = 'failed'; break
        default: status = 'unknown'
      }

      // Get additional process info if service is active
      let memory: number | undefined
      let cpu: number | undefined
      if (pid && pid > 0) {
        try {
          const { stdout: procInfo } = await exec(`ps -p ${pid} -o %mem,%cpu --no-headers 2>/dev/null`)
          const [memStr, cpuStr] = procInfo.trim().split(/\s+/)
          memory = parseFloat(memStr)
          cpu = parseFloat(cpuStr)
        } catch {}
      }

      return {
        name: serviceName,
        status,
        enabled: loadState === 'loaded',
        description,
        pid: pid && pid > 0 ? pid : undefined,
        memory,
        cpu,
        restarts
      }
    } catch (systemctlError) {
      // Fallback: check if process is running
      try {
        const { stdout } = await exec(`pgrep -f ${serviceName}`)
        const pids = stdout.trim().split('\n').filter(Boolean)
        
        if (pids.length > 0) {
          return {
            name: serviceName,
            status: 'active',
            enabled: true,
            description: serviceName,
            pid: parseInt(pids[0])
          }
        }
      } catch {}

      // Check if it's a known service that might be installed differently
      const serviceChecks = {
        docker: () => exec('docker version >/dev/null 2>&1'),
        nginx: () => exec('nginx -t >/dev/null 2>&1'),
        redis: () => exec('redis-cli ping >/dev/null 2>&1')
      }

      if (serviceChecks[serviceName as keyof typeof serviceChecks]) {
        try {
          await serviceChecks[serviceName as keyof typeof serviceChecks]()
          return {
            name: serviceName,
            status: 'active',
            enabled: true,
            description: serviceName
          }
        } catch {}
      }
    }

    return {
      name: serviceName,
      status: 'unknown',
      enabled: false,
      description: serviceName
    }
  } catch (error) {
    return {
      name: serviceName,
      status: 'unknown',
      enabled: false,
      description: serviceName
    }
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, service } = await request.json()

    if (!action || !service) {
      return NextResponse.json(
        { error: 'Action and service name are required' },
        { status: 400 }
      )
    }

    // Only allow safe actions
    const allowedActions = ['restart', 'stop', 'start', 'reload']
    if (!allowedActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // For demo purposes, we'll just log the action
    console.log(`Service action: ${action} ${service}`)

    // In production, you might do:
    // await exec(`systemctl ${action} ${service}`)

    return NextResponse.json({
      success: true,
      message: `Service ${service} ${action} initiated`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Service action error:', error)
    return NextResponse.json(
      { error: 'Failed to perform service action' },
      { status: 500 }
    )
  }
}