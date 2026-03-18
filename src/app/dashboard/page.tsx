"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Zap, 
  Brain, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Play,
  BarChart3,
  FileText,
  Settings
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  skills: { total: number; active: number; executions: number }
  memory: { files: number; size: number; searches: number }
  cron: { total: number; active: number; running: number }
  system: { status: string; uptime: number; cpu: number; memory: number }
}

interface RecentActivity {
  id: string
  type: 'skill' | 'memory' | 'cron' | 'system'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
}

interface QuickAction {
  id: string
  title: string
  description: string
  href: string
  icon: React.ReactNode
  color: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStats({
        skills: { total: 27, active: 23, executions: 1247 },
        memory: { files: 156, size: 2.4, searches: 89 },
        cron: { total: 8, active: 6, running: 2 },
        system: { status: 'healthy', uptime: 2.5, cpu: 45, memory: 62 }
      })

      setRecentActivity([
        {
          id: '1',
          type: 'skill',
          title: 'Weather skill executed',
          description: 'Retrieved weather data for San Francisco',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'memory',
          title: 'Memory file created',
          description: 'Created new project notes in projects/genplatform.md',
          timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          status: 'info'
        },
        {
          id: '3',
          type: 'cron',
          title: 'Backup job completed',
          description: 'Weekly memory backup finished successfully',
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          status: 'success'
        },
        {
          id: '4',
          type: 'system',
          title: 'High CPU usage detected',
          description: 'CPU usage spiked to 89% for 5 minutes',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          status: 'warning'
        }
      ])

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: 'new-skill',
      title: 'Add New Skill',
      description: 'Install or create a new skill',
      href: '/dashboard/skills',
      icon: <Plus className="h-4 w-4" />,
      color: 'bg-blue-500'
    },
    {
      id: 'create-memory',
      title: 'Create Memory File',
      description: 'Add new memory or notes',
      href: '/dashboard/memory',
      icon: <FileText className="h-4 w-4" />,
      color: 'bg-green-500'
    },
    {
      id: 'new-cron',
      title: 'Schedule Job',
      description: 'Create automated task',
      href: '/dashboard/cron',
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-purple-500'
    },
    {
      id: 'system-check',
      title: 'Health Check',
      description: 'Run system diagnostics',
      href: '/dashboard/monitoring',
      icon: <Activity className="h-4 w-4" />,
      color: 'bg-orange-500'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-blue-600" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your AI agent platform.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadDashboardData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/dashboard/command-center">
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Command Center
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skills</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.skills.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.skills.active} active • {stats.skills.executions} executions
              </p>
              <div className="mt-2">
                <Progress value={(stats.skills.active / stats.skills.total) * 100} />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.memory.files}</div>
              <p className="text-xs text-muted-foreground">
                {stats.memory.size} GB • {stats.memory.searches} searches
              </p>
              <div className="mt-2">
                <Progress value={65} />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cron Jobs</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cron.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.cron.active} active • {stats.cron.running} running
              </p>
              <div className="mt-2">
                <Progress value={(stats.cron.active / stats.cron.total) * 100} />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              {stats.system.status === 'healthy' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{stats.system.status}</div>
              <p className="text-xs text-muted-foreground">
                {stats.system.uptime}d uptime • {stats.system.cpu}% CPU
              </p>
              <div className="mt-2">
                <Progress value={stats.system.memory} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.id} href={action.href}>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className={`p-2 rounded-lg text-white ${action.color}`}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {action.description}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <Link href="/dashboard/analytics">
              <Button variant="ghost" size="sm">
                <BarChart3 className="h-4 w-4 mr-1" />
                View Analytics
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(activity.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{activity.title}</div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {activity.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.timestamp)}
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2 capitalize text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>System Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>CPU Usage</span>
                  <span className="font-medium">{stats.system.cpu}%</span>
                </div>
                <Progress value={stats.system.cpu} />
                <div className="text-xs text-muted-foreground">
                  {stats.system.cpu < 70 ? 'Normal' : stats.system.cpu < 85 ? 'High' : 'Critical'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Memory Usage</span>
                  <span className="font-medium">{stats.system.memory}%</span>
                </div>
                <Progress value={stats.system.memory} />
                <div className="text-xs text-muted-foreground">
                  {stats.system.memory < 70 ? 'Normal' : stats.system.memory < 85 ? 'High' : 'Critical'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Active Tasks</span>
                  <span className="font-medium">{stats.cron.running}</span>
                </div>
                <Progress value={25} />
                <div className="text-xs text-muted-foreground">
                  {stats.cron.running} of {stats.cron.total} jobs running
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}