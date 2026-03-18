import { NextRequest, NextResponse } from 'next/server'
import { exec as execCallback } from 'child_process'
import { promisify } from 'util'

const exec = promisify(execCallback)

interface NetworkCheck {
  target: string
  type: 'ping' | 'http' | 'https' | 'dns' | 'port'
  status: 'online' | 'offline' | 'slow' | 'error'
  responseTime?: number
  errorMessage?: string
  details?: any
}

interface NetworkStatus {
  internet: NetworkCheck
  dns: NetworkCheck
  gateway: NetworkCheck
  services: NetworkCheck[]
  summary: {
    total: number
    online: number
    offline: number
    slow: number
  }
}

const DEFAULT_CHECKS = [
  { target: '8.8.8.8', type: 'ping', name: 'Google DNS' },
  { target: 'google.com', type: 'ping', name: 'Internet Connectivity' },
  { target: 'google.com', type: 'dns', name: 'DNS Resolution' },
  { target: 'https://api.github.com/zen', type: 'https', name: 'GitHub API' },
  { target: 'https://httpbin.org/get', type: 'https', name: 'HTTP Service' }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeServices = searchParams.get('services') === 'true'
    
    const checks: NetworkCheck[] = []
    
    // Basic connectivity checks
    const [internetCheck, dnsCheck, gatewayCheck] = await Promise.allSettled([
      checkInternetConnectivity(),
      checkDNSResolution(),
      checkGatewayConnectivity()
    ])

    const internet: NetworkCheck = internetCheck.status === 'fulfilled' 
      ? internetCheck.value 
      : { target: 'internet', type: 'ping', status: 'error', errorMessage: 'Check failed' }

    const dns: NetworkCheck = dnsCheck.status === 'fulfilled' 
      ? dnsCheck.value 
      : { target: 'dns', type: 'dns', status: 'error', errorMessage: 'Check failed' }

    const gateway: NetworkCheck = gatewayCheck.status === 'fulfilled' 
      ? gatewayCheck.value 
      : { target: 'gateway', type: 'ping', status: 'error', errorMessage: 'Check failed' }

    // Service checks if requested
    const services: NetworkCheck[] = []
    if (includeServices) {
      const serviceChecks = await Promise.allSettled(
        DEFAULT_CHECKS.map(check => performNetworkCheck(check.target, check.type as any))
      )
      
      serviceChecks.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          services.push({
            ...result.value,
            target: DEFAULT_CHECKS[index].name
          })
        } else {
          services.push({
            target: DEFAULT_CHECKS[index].name,
            type: DEFAULT_CHECKS[index].type as any,
            status: 'error',
            errorMessage: 'Check failed'
          })
        }
      })
    }

    const allChecks = [internet, dns, gateway, ...services]
    const summary = {
      total: allChecks.length,
      online: allChecks.filter(c => c.status === 'online').length,
      offline: allChecks.filter(c => c.status === 'offline').length,
      slow: allChecks.filter(c => c.status === 'slow').length
    }

    const networkStatus: NetworkStatus = {
      internet,
      dns,
      gateway,
      services,
      summary
    }

    return NextResponse.json({
      network: networkStatus,
      timestamp: new Date().toISOString(),
      hostname: process.env.HOSTNAME || 'localhost'
    })

  } catch (error) {
    console.error('Network check error:', error)
    return NextResponse.json(
      { error: 'Failed to check network connectivity' },
      { status: 500 }
    )
  }
}

async function checkInternetConnectivity(): Promise<NetworkCheck> {
  try {
    const start = Date.now()
    const { stdout, stderr } = await exec('ping -c 1 -W 5 8.8.8.8')
    const responseTime = Date.now() - start

    if (stderr) {
      return {
        target: '8.8.8.8',
        type: 'ping',
        status: 'offline',
        errorMessage: stderr
      }
    }

    // Extract ping time from output
    const timeMatch = stdout.match(/time=([0-9.]+)\s*ms/)
    const pingTime = timeMatch ? parseFloat(timeMatch[1]) : responseTime

    const status = pingTime > 500 ? 'slow' : 'online'

    return {
      target: '8.8.8.8',
      type: 'ping',
      status,
      responseTime: pingTime
    }

  } catch (error) {
    return {
      target: '8.8.8.8',
      type: 'ping',
      status: 'offline',
      errorMessage: error instanceof Error ? error.message : 'Ping failed'
    }
  }
}

async function checkDNSResolution(): Promise<NetworkCheck> {
  try {
    const start = Date.now()
    const { stdout } = await exec('nslookup google.com')
    const responseTime = Date.now() - start

    if (stdout.includes('NXDOMAIN') || stdout.includes('server can\'t find')) {
      return {
        target: 'google.com',
        type: 'dns',
        status: 'offline',
        errorMessage: 'DNS resolution failed'
      }
    }

    const status = responseTime > 2000 ? 'slow' : 'online'

    return {
      target: 'google.com',
      type: 'dns',
      status,
      responseTime
    }

  } catch (error) {
    return {
      target: 'google.com',
      type: 'dns',
      status: 'offline',
      errorMessage: error instanceof Error ? error.message : 'DNS lookup failed'
    }
  }
}

async function checkGatewayConnectivity(): Promise<NetworkCheck> {
  try {
    // Get default gateway
    const { stdout: routeOutput } = await exec('ip route | grep default | head -1')
    const gatewayMatch = routeOutput.match(/via\s+([0-9.]+)/)
    
    if (!gatewayMatch) {
      return {
        target: 'gateway',
        type: 'ping',
        status: 'offline',
        errorMessage: 'No default gateway found'
      }
    }

    const gateway = gatewayMatch[1]
    const start = Date.now()
    const { stdout, stderr } = await exec(`ping -c 1 -W 3 ${gateway}`)
    const responseTime = Date.now() - start

    if (stderr) {
      return {
        target: gateway,
        type: 'ping',
        status: 'offline',
        errorMessage: stderr
      }
    }

    const timeMatch = stdout.match(/time=([0-9.]+)\s*ms/)
    const pingTime = timeMatch ? parseFloat(timeMatch[1]) : responseTime

    return {
      target: gateway,
      type: 'ping',
      status: 'online',
      responseTime: pingTime
    }

  } catch (error) {
    return {
      target: 'gateway',
      type: 'ping',
      status: 'offline',
      errorMessage: error instanceof Error ? error.message : 'Gateway check failed'
    }
  }
}

async function performNetworkCheck(target: string, type: 'ping' | 'http' | 'https' | 'dns' | 'port'): Promise<NetworkCheck> {
  const start = Date.now()

  try {
    switch (type) {
      case 'ping':
        return await pingCheck(target, start)
      
      case 'http':
      case 'https':
        return await httpCheck(target, start)
      
      case 'dns':
        return await dnsCheck(target, start)
      
      case 'port':
        return await portCheck(target, start)
      
      default:
        throw new Error(`Unknown check type: ${type}`)
    }

  } catch (error) {
    return {
      target,
      type,
      status: 'error',
      responseTime: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Check failed'
    }
  }
}

async function pingCheck(target: string, start: number): Promise<NetworkCheck> {
  const { stdout, stderr } = await exec(`ping -c 1 -W 5 ${target}`)
  
  if (stderr) {
    throw new Error(stderr)
  }

  const timeMatch = stdout.match(/time=([0-9.]+)\s*ms/)
  const responseTime = timeMatch ? parseFloat(timeMatch[1]) : Date.now() - start

  return {
    target,
    type: 'ping',
    status: responseTime > 500 ? 'slow' : 'online',
    responseTime
  }
}

async function httpCheck(target: string, start: number): Promise<NetworkCheck> {
  const { stdout } = await exec(`curl -s -o /dev/null -w "%{http_code},%{time_total}" -m 10 "${target}"`)
  const [statusCode, totalTime] = stdout.trim().split(',')
  
  const responseTime = Math.round(parseFloat(totalTime) * 1000)
  const status = parseInt(statusCode) >= 200 && parseInt(statusCode) < 400 ? 
    (responseTime > 3000 ? 'slow' : 'online') : 'offline'

  return {
    target,
    type: target.startsWith('https') ? 'https' : 'http',
    status,
    responseTime,
    details: { statusCode: parseInt(statusCode) }
  }
}

async function dnsCheck(target: string, start: number): Promise<NetworkCheck> {
  const { stdout } = await exec(`nslookup ${target}`)
  const responseTime = Date.now() - start

  if (stdout.includes('NXDOMAIN') || stdout.includes('server can\'t find')) {
    throw new Error('DNS resolution failed')
  }

  return {
    target,
    type: 'dns',
    status: responseTime > 2000 ? 'slow' : 'online',
    responseTime
  }
}

async function portCheck(target: string, start: number): Promise<NetworkCheck> {
  // Assume target is in format "host:port"
  const [host, port] = target.split(':')
  const { stdout } = await exec(`timeout 5 bash -c "cat < /dev/null > /dev/tcp/${host}/${port}"`)
  const responseTime = Date.now() - start

  return {
    target,
    type: 'port',
    status: 'online',
    responseTime
  }
}

export async function POST(request: NextRequest) {
  try {
    const { target, type = 'ping' } = await request.json()

    if (!target) {
      return NextResponse.json(
        { error: 'Target is required' },
        { status: 400 }
      )
    }

    const result = await performNetworkCheck(target, type)

    return NextResponse.json({
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Manual network check error:', error)
    return NextResponse.json(
      { error: 'Network check failed' },
      { status: 500 }
    )
  }
}