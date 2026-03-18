"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Zap, 
  Terminal, 
  RefreshCw, 
  Play, 
  Pause,
  Square,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Database,
  Server,
  Network,
  HardDrive,
  Users,
  FileText,
  Download,
  Upload,
  Trash2,
  Edit,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react'

interface QuickAction {
  id: string
  title: string
  description: string
  category: 'system' | 'skills' | 'memory' | 'monitoring' | 'maintenance'
  icon: React.ReactNode
  command?: string
  status: 'available' | 'running' | 'disabled'
  lastUsed?: string
  shortcut?: string
  dangerous?: boolean
}

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical'
  services: Array<{
    name: string
    status: 'active' | 'inactive' | 'failed'
    uptime?: string
  }>
  resources: {
    cpu: number
    memory: number
    disk: number
  }
  activeUsers: number
  activeTasks: number
}

export default function CommandCenterPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [commandInput, setCommandInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [commandOutput, setCommandOutput] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSystemStatus()
    loadQuickActions()
  }, [])

  const loadSystemStatus = async () => {
    try {
      // In production, fetch from system APIs
      setSystemStatus({
        overall: 'healthy',
        services: [
          { name: 'OpenClaw Core', status: 'active', uptime: '2d 14h 30m' },
          { name: 'Gateway Service', status: 'active', uptime: '2d 14h 25m' },
          { name: 'Database', status: 'active', uptime: '15d 8h 45m' },
          { name: 'Cache Service', status: 'active', uptime: '7d 12h 15m' }
        ],
        resources: {
          cpu: 45,
          memory: 62,
          disk: 73
        },
        activeUsers: 12,
        activeTasks: 8
      })
    } catch (error) {
      console.error('Failed to load system status:', error)
    }
  }

  const loadQuickActions = async () => {
    setLoading(true)
    try {
      // In production, fetch from API
      setQuickActions([
        {
          id: 'restart-services',
          title: 'Restart Core Services',
          description: 'Restart OpenClaw core services',
          category: 'system',
          icon: <RefreshCw className="h-4 w-4" />,
          command: 'systemctl restart openclaw',
          status: 'available',
          shortcut: 'Ctrl+R',
          dangerous: true
        },
        {
          id: 'health-check',
          title: 'System Health Check',
          description: 'Run comprehensive system diagnostics',
          category: 'monitoring',
          icon: <Activity className="h-4 w-4" />,
          command: 'openclaw status --health-check',
          status: 'available',
          shortcut: 'Ctrl+H'
        },
        {
          id: 'clear-cache',
          title: 'Clear System Cache',
          description: 'Clear all cached data and temporary files',
          category: 'maintenance',
          icon: <Trash2 className="h-4 w-4" />,
          command: 'openclaw cache clear --all',
          status: 'available'
        },
        {
          id: 'backup-memory',
          title: 'Backup Memory Files',
          description: 'Create backup of all memory files',
          category: 'memory',
          icon: <Download className="h-4 w-4" />,
          command: 'openclaw backup memory',
          status: 'available',
          shortcut: 'Ctrl+B'
        },
        {
          id: 'update-skills',
          title: 'Update All Skills',
          description: 'Check and update all installed skills',
          category: 'skills',
          icon: <Zap className="h-4 w-4" />,
          command: 'openclaw skills update --all',
          status: 'available'
        },
        {
          id: 'optimize-db',
          title: 'Optimize Database',
          description: 'Run database optimization and cleanup',
          category: 'maintenance',
          icon: <Database className="h-4 w-4" />,
          command: 'openclaw db optimize',
          status: 'available',
          dangerous: true
        },
        {
          id: 'export-logs',
          title: 'Export System Logs',
          description: 'Export and compress system logs',
          category: 'monitoring',
          icon: <FileText className="h-4 w-4" />,
          command: 'openclaw logs export',
          status: 'available'
        },
        {
          id: 'network-test',
          title: 'Network Connectivity Test',
          description: 'Test all network connections and endpoints',
          category: 'monitoring',
          icon: <Network className="h-4 w-4" />,
          command: 'openclaw network test',
          status: 'available'
        },
        {
          id: 'disk-cleanup',
          title: 'Disk Space Cleanup',
          description: 'Clean up temporary files and logs',
          category: 'maintenance',
          icon: <HardDrive className="h-4 w-4" />,
          command: 'openclaw cleanup --disk',
          status: 'available'
        },
        {
          id: 'reset-config',
          title: 'Reset Configuration',
          description: 'Reset system configuration to defaults',
          category: 'system',
          icon: <Settings className="h-4 w-4" />,
          command: 'openclaw config reset',
          status: 'available',
          dangerous: true
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const executeAction = async (action: QuickAction) => {
    if (action.dangerous && !confirm(`Are you sure you want to execute "${action.title}"? This action cannot be undone.`)) {
      return
    }

    // Update action status to running
    setQuickActions(prev => prev.map(a => 
      a.id === action.id ? { ...a, status: 'running' } : a
    ))

    try {
      // In production, execute the actual command
      console.log(`Executing: ${action.command}`)
      
      // Add to command output
      setCommandOutput(prev => [...prev, `> ${action.command}`, `Executing ${action.title}...`])
      
      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setCommandOutput(prev => [...prev, `✓ ${action.title} completed successfully`])
      
      // Update last used time
      setQuickActions(prev => prev.map(a => 
        a.id === action.id ? { 
          ...a, 
          status: 'available',
          lastUsed: new Date().toISOString() 
        } : a
      ))

      // Refresh system status if it's a system action
      if (action.category === 'system' || action.category === 'monitoring') {
        await loadSystemStatus()
      }

    } catch (error) {
      console.error('Action execution failed:', error)
      setCommandOutput(prev => [...prev, `✗ ${action.title} failed: ${error}`])
      
      setQuickActions(prev => prev.map(a => 
        a.id === action.id ? { ...a, status: 'available' } : a
      ))
    }
  }

  const executeCommand = async (command: string) => {
    if (!command.trim()) return

    setCommandHistory(prev => [command, ...prev.slice(0, 9)]) // Keep last 10 commands
    setCommandOutput(prev => [...prev, `> ${command}`])
    setCommandInput('')

    try {
      // In production, execute via secure command API
      console.log(`Executing command: ${command}`)
      
      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock output based on command
      let output = ''
      if (command.includes('status')) {
        output = 'OpenClaw Status: All systems operational\nGateway: Active\nMemory: 62% used\nCPU: 45% used'
      } else if (command.includes('ls')) {
        output = 'projects/\nareas/\nresources/\narchive/\ndaily/'
      } else if (command.includes('help')) {
        output = 'Available commands:\n  status - System status\n  ls - List files\n  clear - Clear output\n  help - Show this help'
      } else if (command === 'clear') {
        setCommandOutput([])
        return
      } else {
        output = `Command executed: ${command}\nResult: Success`
      }
      
      setCommandOutput(prev => [...prev, output])

    } catch (error) {
      setCommandOutput(prev => [...prev, `Error: ${error}`])
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'inactive': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionStatusBadge = (status: string) => {
    switch (status) {
      case 'running': return <Badge className="bg-blue-100 text-blue-800">Running</Badge>
      case 'disabled': return <Badge variant="secondary">Disabled</Badge>
      default: return <Badge className="bg-green-100 text-green-800">Available</Badge>
    }
  }

  const categories = ['all', 'system', 'skills', 'memory', 'monitoring', 'maintenance']
  const filteredActions = selectedCategory === 'all' 
    ? quickActions 
    : quickActions.filter(action => action.category === selectedCategory)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="text-muted-foreground">
            System operations and quick actions dashboard
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadSystemStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              {systemStatus.overall === 'healthy' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{systemStatus.overall}</div>
              <p className="text-xs text-muted-foreground">
                {systemStatus.services.filter(s => s.status === 'active').length} services active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resource Usage</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>CPU</span>
                  <span>{systemStatus.resources.cpu}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Memory</span>
                  <span>{systemStatus.resources.memory}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Disk</span>
                  <span>{systemStatus.resources.disk}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                {systemStatus.activeTasks} active tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Services Status</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {systemStatus.services.slice(0, 2).map((service, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(service.status)}
                      <span>{service.name}</span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="actions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="terminal">Terminal</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex space-x-1">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Actions Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse">
                      <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
                      <div className="h-4 bg-muted rounded mb-3 w-full"></div>
                      <div className="h-8 bg-muted rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActions.map((action) => (
                <Card key={action.id} className={`hover:shadow-md transition-shadow ${action.dangerous ? 'border-red-200' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {action.icon}
                        <h3 className="font-semibold">{action.title}</h3>
                      </div>
                      {getActionStatusBadge(action.status)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {action.shortcut && <span>Shortcut: {action.shortcut}</span>}
                        {action.lastUsed && (
                          <span className="block">
                            Last used: {new Date(action.lastUsed).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => executeAction(action)}
                        disabled={action.status === 'running' || action.status === 'disabled'}
                        variant={action.dangerous ? "destructive" : "default"}
                      >
                        {action.status === 'running' ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        {action.status === 'running' ? 'Running...' : 'Execute'}
                      </Button>
                    </div>

                    {action.dangerous && (
                      <div className="mt-2 text-xs text-red-600 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        This action requires confirmation
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="terminal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Terminal className="h-5 w-5" />
                <span>Command Terminal</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Command Output */}
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                {commandOutput.length === 0 ? (
                  <div className="text-gray-600">
                    OpenClaw Command Terminal v2.0<br />
                    Type 'help' for available commands.
                  </div>
                ) : (
                  commandOutput.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))
                )}
              </div>

              {/* Command Input */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter command..."
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      executeCommand(commandInput)
                    } else if (e.key === 'ArrowUp' && commandHistory.length > 0) {
                      setCommandInput(commandHistory[0])
                    }
                  }}
                  className="flex-1 font-mono"
                />
                <Button onClick={() => executeCommand(commandInput)}>
                  Execute
                </Button>
                <Button variant="outline" onClick={() => setCommandOutput([])}>
                  Clear
                </Button>
              </div>

              {/* Command History */}
              {commandHistory.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recent Commands</h4>
                  <div className="flex flex-wrap gap-1">
                    {commandHistory.slice(0, 5).map((cmd, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setCommandInput(cmd)}
                        className="text-xs"
                      >
                        {cmd}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          {systemStatus && (
            <Card>
              <CardHeader>
                <CardTitle>System Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemStatus.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(service.status)}
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.uptime && (
                            <div className="text-sm text-muted-foreground">
                              Uptime: {service.uptime}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Badge 
                          variant={service.status === 'active' ? 'default' : 'secondary'}
                        >
                          {service.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Restart
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}