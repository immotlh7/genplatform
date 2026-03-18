"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Server, 
  HardDrive, 
  Cpu, 
  MemoryStick,
  Network,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Thermometer,
  Clock,
  Users
} from 'lucide-react'

interface SystemResources {
  cpu: {
    usage: number
    cores: number
    model: string
    frequency: number
    temperature?: number
  }
  memory: {
    total: number
    used: number
    free: number
    available: number
    usage: number
    swap: {
      total: number
      used: number
      free: number
    }
  }
  disk: {
    total: number
    used: number
    free: number
    usage: number
    mounts: Array<{
      filesystem: string
      mountpoint: string
      total: number
      used: number
      available: number
      usage: number
    }>
  }
  network: {
    interfaces: Array<{
      name: string
      bytesReceived: number
      bytesTransmitted: number
      packetsReceived: number
      packetsTransmitted: number
      errors: number
    }>
  }
  uptime: number
  loadAverage: number[]
  processes: {
    total: number
    running: number
    sleeping: number
    zombie: number
  }
}

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

export default function MonitoringPage() {
  const [resources, setResources] = useState<SystemResources | null>(null)
  const [services, setServices] = useState<SystemServices | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5000) // 5 seconds
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const loadSystemData = useCallback(async () => {
    try {
      const [resourcesResponse, servicesResponse] = await Promise.all([
        fetch('/api/openclaw/system/resources?detailed=true'),
        fetch('/api/openclaw/system/services')
      ])

      const resourcesData = await resourcesResponse.json()
      const servicesData = await servicesResponse.json()

      setResources(resourcesData.resources)
      setServices(servicesData.services)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Failed to load system data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSystemData()
  }, [loadSystemData])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(loadSystemData, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loadSystemData])

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'inactive': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      case 'inactive': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const getUsageColor = (usage: number) => {
    if (usage > 90) return 'text-red-600'
    if (usage > 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  const handleServiceAction = async (service: string, action: string) => {
    try {
      const response = await fetch('/api/openclaw/system/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, action })
      })

      if (response.ok) {
        // Refresh services after action
        setTimeout(loadSystemData, 1000)
      }
    } catch (error) {
      console.error('Failed to perform service action:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Monitoring</h1>
            <p className="text-muted-foreground">Loading system status...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-muted rounded mb-4 w-2/3"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system resource and service monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={autoRefresh ? "default" : "secondary"}>
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={loadSystemData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {resources && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{resources.cpu.usage}%</div>
                <Progress value={resources.cpu.usage} className="mb-2" />
                <p className="text-xs text-muted-foreground">
                  {resources.cpu.cores} cores @ {(resources.cpu.frequency / 1000).toFixed(1)}GHz
                  {resources.cpu.temperature && (
                    <span className="ml-2">
                      <Thermometer className="h-3 w-3 inline mr-1" />
                      {resources.cpu.temperature}°C
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{resources.memory.usage}%</div>
                <Progress value={resources.memory.usage} className="mb-2" />
                <p className="text-xs text-muted-foreground">
                  {formatBytes(resources.memory.used)} / {formatBytes(resources.memory.total)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{resources.disk.usage}%</div>
                <Progress value={resources.disk.usage} className="mb-2" />
                <p className="text-xs text-muted-foreground">
                  {formatBytes(resources.disk.used)} / {formatBytes(resources.disk.total)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{formatUptime(resources.uptime)}</div>
                <p className="text-xs text-muted-foreground">
                  Load: {resources.loadAverage.map(avg => avg.toFixed(2)).join(', ')}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Detailed Monitoring */}
      <Tabs defaultValue="resources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="processes">Processes</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-4">
          {resources && (
            <>
              {/* Disk Mounts */}
              <Card>
                <CardHeader>
                  <CardTitle>Disk Usage by Mount Point</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {resources.disk.mounts.map((mount, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{mount.mountpoint}</span>
                          <span className={`text-sm ${getUsageColor(mount.usage)}`}>
                            {mount.usage}%
                          </span>
                        </div>
                        <Progress value={mount.usage} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{mount.filesystem}</span>
                          <span>{formatBytes(mount.used)} / {formatBytes(mount.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Memory Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Memory Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Used</span>
                        <span>{formatBytes(resources.memory.used)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available</span>
                        <span>{formatBytes(resources.memory.available)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span>{formatBytes(resources.memory.total)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Swap Usage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resources.memory.swap.total > 0 ? (
                      <>
                        <Progress value={(resources.memory.swap.used / resources.memory.swap.total) * 100} />
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Used</span>
                            <span>{formatBytes(resources.memory.swap.used)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Free</span>
                            <span>{formatBytes(resources.memory.swap.free)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total</span>
                            <span>{formatBytes(resources.memory.swap.total)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No swap space configured</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          {services && (
            <>
              {/* Service Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{services.summary.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{services.summary.active}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Failed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{services.summary.failed}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{services.summary.inactive}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Core Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Core Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[services.openclaw, services.gateway, services.database, services.redis, services.nginx, services.docker]
                      .filter(Boolean)
                      .map((service, index) => service && (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(service.status)}
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-muted-foreground">{service.description}</div>
                            {service.uptime && (
                              <div className="text-xs text-muted-foreground">Uptime: {service.uptime}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(service.status)}
                          >
                            {service.status}
                          </Badge>
                          {service.status === 'active' && (
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleServiceAction(service.name.toLowerCase(), 'restart')}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Restart
                              </Button>
                            </div>
                          )}
                          {service.status === 'inactive' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleServiceAction(service.name.toLowerCase(), 'start')}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Services */}
              {services.systemServices.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>System Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {services.systemServices.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(service.status)}
                            <div>
                              <div className="font-medium">{service.name}</div>
                              {service.pid && (
                                <div className="text-xs text-muted-foreground">PID: {service.pid}</div>
                              )}
                            </div>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(service.status)}
                          >
                            {service.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="processes" className="space-y-4">
          {resources && (
            <Card>
              <CardHeader>
                <CardTitle>Process Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-blue-600">{resources.processes.total}</div>
                    <div className="text-sm text-muted-foreground">Total Processes</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-green-600">{resources.processes.running}</div>
                    <div className="text-sm text-muted-foreground">Running</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-yellow-600">{resources.processes.sleeping}</div>
                    <div className="text-sm text-muted-foreground">Sleeping</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-red-600">{resources.processes.zombie}</div>
                    <div className="text-sm text-muted-foreground">Zombie</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          {resources && (
            <Card>
              <CardHeader>
                <CardTitle>Network Interfaces</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources.network.interfaces.length > 0 ? (
                    resources.network.interfaces.map((iface, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="font-medium mb-2">{iface.name}</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Received</div>
                            <div>{formatBytes(iface.bytesReceived)}</div>
                            <div className="text-xs">{iface.packetsReceived.toLocaleString()} packets</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Transmitted</div>
                            <div>{formatBytes(iface.bytesTransmitted)}</div>
                            <div className="text-xs">{iface.packetsTransmitted.toLocaleString()} packets</div>
                          </div>
                        </div>
                        {iface.errors > 0 && (
                          <div className="text-sm text-red-600 mt-2">
                            {iface.errors} errors detected
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No network interfaces found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Status Bar */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {lastUpdated} | Auto-refresh: {autoRefresh ? `${refreshInterval/1000}s` : 'OFF'}
      </div>
    </div>
  )
}