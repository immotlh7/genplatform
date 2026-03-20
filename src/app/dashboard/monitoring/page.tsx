"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Database, 
  HardDrive, 
  MemoryStick, 
  Network, 
  RefreshCw, 
  Server, 
  Terminal, 
  Wifi, 
  WifiOff,
  Pause,
  Play,
  XCircle
} from 'lucide-react'

interface SystemResource {
  name: string
  value: number
  max: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  trend?: 'up' | 'down' | 'stable'
}

interface SystemService {
  name: string
  status: 'running' | 'stopped' | 'failed'
  uptime?: string
  cpu?: number
  memory?: number
  pid?: number
  autoRestart?: boolean
}

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  source: string
  message: string
  details?: any
}

export default function MonitoringPage() {
  const [resources, setResources] = useState<SystemResource[]>([])
  const [services, setServices] = useState<SystemService[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('all')
  const [selectedService, setSelectedService] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5000) // 5 seconds
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const loadSystemData = useCallback(async () => {
    try {
      // Fetch real metrics from Bridge API
      const metricsResponse = await fetch('/api/bridge/metrics')
      const metricsData = await metricsResponse.json()
      
      // Fetch real status from Bridge API
      const statusResponse = await fetch('/api/bridge/status')
      const statusData = await statusResponse.json()

      // Transform metrics to resources format
      const resourcesList: SystemResource[] = []
      
      if (metricsData.cpu) {
        resourcesList.push({
          name: 'CPU Usage',
          value: metricsData.cpu.percent || 0,
          max: 100,
          unit: '%',
          status: metricsData.cpu.percent > 80 ? 'critical' : metricsData.cpu.percent > 60 ? 'warning' : 'healthy',
          trend: 'stable'
        })
      }
      
      if (metricsData.memory) {
        const memoryPercent = (metricsData.memory.used / metricsData.memory.total) * 100
        resourcesList.push({
          name: 'Memory Usage',
          value: memoryPercent,
          max: 100,
          unit: '%',
          status: memoryPercent > 85 ? 'critical' : memoryPercent > 70 ? 'warning' : 'healthy',
          trend: 'stable'
        })
      }
      
      if (metricsData.disk) {
        const diskPercent = (metricsData.disk.used / metricsData.disk.total) * 100
        resourcesList.push({
          name: 'Disk Usage',
          value: diskPercent,
          max: 100,
          unit: '%',
          status: diskPercent > 90 ? 'critical' : diskPercent > 75 ? 'warning' : 'healthy',
          trend: 'stable'
        })
      }
      
      setResources(resourcesList)
      
      // Transform status to services format
      const servicesList: SystemService[] = [
        {
          name: 'OpenClaw Core',
          status: statusData.status === 'running' ? 'running' : 'stopped',
          uptime: statusData.uptime || '0s',
          cpu: metricsData.cpu?.percent || 0,
          memory: metricsData.memory ? (metricsData.memory.used / metricsData.memory.total) * 100 : 0,
          pid: statusData.pid || 0,
          autoRestart: true
        },
        {
          name: 'Gateway Service',
          status: statusData.gateway?.status === 'running' ? 'running' : 'stopped',
          uptime: statusData.uptime || '0s',
          autoRestart: true
        }
      ]
      
      setServices(servicesList)
      setLastUpdated(new Date().toLocaleTimeString())
      
      // Fetch logs
      const logsResponse = await fetch('/api/bridge/logs')
      const logsData = await logsResponse.json()
      
      if (logsData.logs) {
        const formattedLogs = logsData.logs.map((log: any, index: number) => ({
          id: `log-${index}`,
          timestamp: log.timestamp || new Date().toISOString(),
          level: log.level || 'info',
          source: log.source || 'System',
          message: log.message || ''
        }))
        setLogs(formattedLogs)
      }
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load system data:', error);
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSystemData()

    if (autoRefresh) {
      const interval = setInterval(loadSystemData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [loadSystemData, autoRefresh, refreshInterval])

  const restartService = async (serviceName: string) => {
    try {
      if (serviceName === 'Gateway Service') {
        const response = await fetch('/api/bridge/gateway', {
          method: 'POST'
        })
        
        if (!response.ok) {
          throw new Error('Failed to restart service')
        }
      }
      
      // Reload data after restart
      setTimeout(loadSystemData, 1000)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Failed to restart ${serviceName}:`, error);
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'stopped': return <XCircle className="h-4 w-4 text-gray-600" />
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getResourceIcon = (name: string) => {
    switch (name) {
      case 'CPU Usage': return <Cpu className="h-4 w-4" />
      case 'Memory Usage': return <MemoryStick className="h-4 w-4" />
      case 'Disk Usage': return <HardDrive className="h-4 w-4" />
      case 'Network': return <Network className="h-4 w-4" />
      default: return <Server className="h-4 w-4" />
    }
  }

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'debug': return <Terminal className="h-4 w-4 text-gray-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredLogs = logs.filter(log => {
    if (selectedLogLevel !== 'all' && log.level !== selectedLogLevel) return false
    if (selectedService !== 'all' && log.source !== selectedService) return false
    return true
  })

  const overallHealth = resources.every(r => r.status === 'healthy') && 
                       services.every(s => s.status === 'running') 
                       ? 'healthy' : 'warning'

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system performance and health monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </span>
          <Select 
            value={refreshInterval.toString()} 
            onValueChange={(value) => setRefreshInterval(Number(value))}
            disabled={!autoRefresh}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5000">5 seconds</SelectItem>
              <SelectItem value="10000">10 seconds</SelectItem>
              <SelectItem value="30000">30 seconds</SelectItem>
              <SelectItem value="60000">1 minute</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <><Pause className="h-4 w-4 mr-2" /> Pause</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Resume</>
            )}
          </Button>
          <Button variant="outline" onClick={loadSystemData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Health</span>
            <Badge 
              variant={overallHealth === 'healthy' ? 'default' : 'destructive'}
              className={overallHealth === 'healthy' ? 'bg-green-100 text-green-800' : ''}
            >
              {overallHealth === 'healthy' ? 'All Systems Operational' : 'Issues Detected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Services</span>
                <span className="text-sm text-muted-foreground">
                  {services.filter(s => s.status === 'running').length} / {services.length} running
                </span>
              </div>
              <Progress 
                value={(services.filter(s => s.status === 'running').length / services.length) * 100} 
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Resources</span>
                <span className="text-sm text-muted-foreground">
                  {resources.filter(r => r.status === 'healthy').length} / {resources.length} healthy
                </span>
              </div>
              <Progress 
                value={(resources.filter(r => r.status === 'healthy').length / resources.length) * 100} 
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network</span>
                <span className="text-sm text-muted-foreground flex items-center">
                  <Wifi className="h-3 w-3 mr-1 text-green-600" />
                  Connected
                </span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="resources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <>
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-6 bg-muted rounded mb-4 w-1/3"></div>
                        <div className="h-8 bg-muted rounded mb-2"></div>
                        <div className="h-2 bg-muted rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              resources.map((resource, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getResourceIcon(resource.name)}
                        <span>{resource.name}</span>
                      </div>
                      <Badge 
                        variant={resource.status === 'healthy' ? 'secondary' : resource.status === 'warning' ? 'outline' : 'destructive'}
                        className={resource.status === 'healthy' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {resource.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-bold">{resource.value.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">{resource.unit}</span>
                      </div>
                      <Progress 
                        value={(resource.value / resource.max) * 100} 
                        className={`h-2 ${
                          resource.status === 'critical' ? 'bg-red-100' :
                          resource.status === 'warning' ? 'bg-yellow-100' : ''
                        }`}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>{resource.max}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Services</CardTitle>
              <CardDescription>
                Monitor and manage critical system services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-muted-foreground space-x-3">
                          {service.uptime && <span>Uptime: {service.uptime}</span>}
                          {service.pid && <span>PID: {service.pid}</span>}
                          {service.cpu !== undefined && <span>CPU: {service.cpu.toFixed(1)}%</span>}
                          {service.memory !== undefined && <span>Memory: {service.memory.toFixed(1)}%</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={service.status === 'running' ? 'default' : 'secondary'}
                      >
                        {service.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restartService(service.name)}
                        disabled={loading}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Restart
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Select value={selectedLogLevel} onValueChange={setSelectedLogLevel}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Errors</SelectItem>
                    <SelectItem value="warning">Warnings</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {services.map(service => (
                      <SelectItem key={service.name} value={service.name}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.slice(0, 100).map(log => (
                      <div key={log.id} className="flex items-start space-x-2 p-2 hover:bg-muted/50 rounded">
                        {getLogIcon(log.level)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.source}
                            </Badge>
                          </div>
                          <p className="text-sm mt-1">{log.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No logs to display
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}