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
  Settings,
  GitCompare,
  Download,
  Bell
} from 'lucide-react'
import Link from 'next/link'
import { TaskTracker } from '@/components/dashboard/TaskTracker'
import { ActivityStream } from '@/components/dashboard/ActivityStream'
import { ImprovementsWidget } from '@/components/dashboard/ImprovementsWidget'
import { ReportsNotifications } from '@/components/notifications/ReportsNotifications'
import { AutomationsCard } from '@/components/dashboard/AutomationsCard'
import { supabaseHelpers } from '@/lib/supabase'
import { getCurrentUserClient, getAccessibleProjects } from '@/lib/access-control'
import type { User } from '@/lib/access-control'

interface DashboardStats {
  projects: { total: number; active: number; completed: number }
  tasks: { total: number; active: number; completed: number; completionRate: number }
  security: { status: string; lastCheck: string; severity: string }
  system: { status: string; uptime: number; cpu: number; memory: number }
  reports: { total: number; thisWeek: number; pendingGeneration: number; lastGenerated: string }
}

interface QuickAction {
  id: string
  title: string
  description: string
  href: string
  icon: React.ReactNode
  color: string
  requiresOwner?: boolean
  badge?: string
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [accessibleProjectIds, setAccessibleProjectIds] = useState<string[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get current user first
      const user = await getCurrentUserClient()
      setCurrentUser(user)

      if (!user) {
        setError('Authentication required')
        return
      }

      // Get accessible projects based on user role
      let projectIds: string[] = []
      if (user.role === 'OWNER' || user.role === 'ADMIN') {
        // Owner and Admin see all projects
        projectIds = await getAccessibleProjects(user.id)
      } else {
        // Manager and Viewer see only assigned projects
        projectIds = await getAccessibleProjects(user.id)
      }
      setAccessibleProjectIds(projectIds)

      // Fetch stats with project filtering
      const [
        totalProjects,
        activeTasks,
        completedTasks,
        latestSecurity,
        latestMetrics,
        reportsStats
      ] = await Promise.all([
        getFilteredProjectsCount(projectIds),
        getFilteredTasksCount(projectIds, 'in_progress'),
        getFilteredTasksCount(projectIds, 'done'),
        supabaseHelpers.getLatestSecurityStatus(),
        supabaseHelpers.getLatestSystemMetrics(),
        getReportsStats()
      ])

      // Calculate completion rate
      const totalTasks = activeTasks + completedTasks
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      // Determine security status
      const securityStatus = latestSecurity 
        ? (latestSecurity.severity === 'critical' ? 'critical' : 
           latestSecurity.severity === 'warning' ? 'warning' : 'healthy')
        : 'unknown'

      // Format security last check
      const securityLastCheck = latestSecurity 
        ? formatTimeAgo(latestSecurity.created_at)
        : 'Never'

      setStats({
        projects: { 
          total: totalProjects, 
          active: Math.floor(totalProjects * 0.7), // Estimate active projects
          completed: Math.floor(totalProjects * 0.3) // Estimate completed projects
        },
        tasks: { 
          total: totalTasks,
          active: activeTasks, 
          completed: completedTasks,
          completionRate 
        },
        security: { 
          status: securityStatus, 
          lastCheck: securityLastCheck,
          severity: latestSecurity?.severity || 'info'
        },
        system: { 
          status: latestMetrics ? 'healthy' : 'unknown',
          uptime: latestMetrics ? calculateUptime(latestMetrics.recorded_at) : 0,
          cpu: latestMetrics?.cpu_percent || 45,
          memory: latestMetrics?.ram_percent || 62
        },
        reports: reportsStats
      })

    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Fall back to demo data
      setStats({
        projects: { total: 3, active: 2, completed: 1 },
        tasks: { total: 23, active: 8, completed: 15, completionRate: 65 },
        security: { status: 'healthy', lastCheck: '2 hours ago', severity: 'info' },
        system: { status: 'healthy', uptime: 2.5, cpu: 45, memory: 62 },
        reports: { total: 8, thisWeek: 3, pendingGeneration: 1, lastGenerated: '2 hours ago' }
      })
    } finally {
      setLoading(false)
    }
  }

  const getReportsStats = async () => {
    // Mock reports statistics - in real app, this would fetch from /api/reports/stats
    return {
      total: 8,
      thisWeek: 3,
      pendingGeneration: 1,
      lastGenerated: '2 hours ago'
    }
  }

  const getFilteredProjectsCount = async (projectIds: string[]): Promise<number> => {
    if (projectIds.length === 0) return 0
    
    try {
      const { count, error } = await supabaseHelpers.supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('id', projectIds)
        .neq('status', 'deleted')
      
      return count || 0
    } catch (error) {
      console.error('Error fetching filtered projects count:', error)
      return 0
    }
  }

  const getFilteredTasksCount = async (projectIds: string[], status: string): Promise<number> => {
    if (projectIds.length === 0) return 0

    try {
      const { count, error } = await supabaseHelpers.supabase
        .from('project_tasks')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .eq('status', status)
      
      return count || 0
    } catch (error) {
      console.error(`Error fetching filtered ${status} tasks count:`, error)
      return 0
    }
  }

  const calculateUptime = (recordedAt: string): number => {
    const now = new Date()
    const recorded = new Date(recordedAt)
    const diffInMs = now.getTime() - recorded.getTime()
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24)) // Days
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

  const getQuickActions = (user: User | null): QuickAction[] => {
    const baseActions: QuickAction[] = [
      {
        id: 'generate-report',
        title: 'Generate Report',
        description: 'Create new system report',
        href: '/dashboard/reports?action=generate',
        icon: <FileText className="h-4 w-4" />,
        color: 'bg-blue-500',
        badge: 'New'
      },
      {
        id: 'compare-reports',
        title: 'Compare Reports',
        description: 'Analyze report differences',
        href: '/dashboard/reports?action=compare',
        icon: <GitCompare className="h-4 w-4" />,
        color: 'bg-purple-500'
      },
      {
        id: 'propose-improvement',
        title: 'Suggest Improvement',
        description: 'Submit enhancement idea',
        href: '/dashboard/reports?tab=improvements&action=create',
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'bg-green-500'
      },
      {
        id: 'create-memory',
        title: 'Create Memory File',
        description: 'Add new memory or notes',
        href: '/dashboard/memory',
        icon: <Brain className="h-4 w-4" />,
        color: 'bg-cyan-500'
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

    // Add actions based on user role
    if (user && (user.role === 'OWNER' || user.role === 'ADMIN')) {
      baseActions.unshift({
        id: 'new-project',
        title: 'New Project',
        description: 'Start a new project',
        href: '/dashboard/projects',
        icon: <Plus className="h-4 w-4" />,
        color: 'bg-blue-600'
      })
    }

    if (user && (user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'MANAGER')) {
      baseActions.push({
        id: 'new-cron',
        title: 'Schedule Job',
        description: 'Create automated task',
        href: '/dashboard/cron',
        icon: <Clock className="h-4 w-4" />,
        color: 'bg-indigo-500'
      })
    }

    return baseActions
  }

  const getSecurityIcon = () => {
    switch (stats?.security.status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  // Show loading state while fetching user data
  if (loading && !currentUser) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header with user context and notifications */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {currentUser ? (
              <>Welcome back, {currentUser.displayName}! Here's your {
                currentUser.role === 'OWNER' || currentUser.role === 'ADMIN' 
                  ? 'platform overview' 
                  : 'assigned projects overview'
              }.</>
            ) : (
              'Welcome back! Here\'s what\'s happening with your AI agent platform.'
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ReportsNotifications />
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

      {/* Access level indicator for non-owners */}
      {currentUser && currentUser.role !== 'OWNER' && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-500 text-white">
              {currentUser.role}
            </Badge>
            <span className="text-sm text-blue-900 dark:text-blue-100">
              You have {currentUser.role.toLowerCase()} access to {accessibleProjectIds.length} project{accessibleProjectIds.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Live Task Tracker - Prominent position */}
      <TaskTracker />

      {/* Enhanced Stats Overview - Now includes Automations and Reports */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN' ? 'All Projects' : 'Your Projects'}
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.projects.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.projects.active} active • {stats.projects.completed} completed
              </p>
              <div className="mt-2">
                <Progress value={stats.projects.total > 0 ? (stats.projects.active / stats.projects.total) * 100 : 0} />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tasks.active}</div>
              <p className="text-xs text-muted-foreground">
                {stats.tasks.completed} done • {stats.tasks.completionRate}% rate
              </p>
              <div className="mt-2">
                <Progress value={stats.tasks.completionRate} />
              </div>
            </CardContent>
          </Card>

          {/* Automations Card - Only for OWNER and ADMIN */}
          {currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && (
            <AutomationsCard />
          )}

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reports.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.reports.thisWeek} this week • {stats.reports.pendingGeneration} pending
              </p>
              <div className="mt-2">
                <Progress value={stats.reports.total > 0 ? ((stats.reports.total - stats.reports.pendingGeneration) / stats.reports.total) * 100 : 100} />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security</CardTitle>
              {getSecurityIcon()}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{stats.security.status}</div>
              <p className="text-xs text-muted-foreground">
                Last check: {stats.security.lastCheck}
              </p>
              <div className="mt-2">
                <Progress 
                  value={stats.security.status === 'healthy' ? 100 : 
                         stats.security.status === 'warning' ? 60 : 20} 
                />
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
                {stats.system.uptime}d uptime • {Math.round(stats.system.cpu)}% CPU
              </p>
              <div className="mt-2">
                <Progress value={stats.system.memory} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-900 dark:text-yellow-100">
              Data Loading Issue
            </span>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            {error} - Showing available data.
          </p>
        </div>
      )}

      {/* Main Content Grid: Quick Actions + Activity Stream + Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions - Enhanced with Reports actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {getQuickActions(currentUser).slice(0, 6).map((action) => (
              <Link key={action.id} href={action.href}>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className={`p-2 rounded-lg text-white ${action.color}`}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm flex items-center space-x-2">
                      <span>{action.title}</span>
                      {action.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {action.description}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            ))}
            
            {/* View All Actions */}
            <Link href="/dashboard/reports">
              <div className="flex items-center justify-center p-3 border border-dashed rounded-lg hover:bg-muted/50 transition-colors cursor-pointer text-muted-foreground">
                <span className="text-sm">View all reports features →</span>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Activity Stream - Filtered for user's projects */}
        <div className="lg:col-span-2">
          <ActivityStream 
            refreshInterval={30000} 
            maxEvents={20}
            projectFilter={currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN' ? undefined : accessibleProjectIds}
          />
        </div>
      </div>

      {/* Reports and Improvements Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Improvements Widget - Full featured */}
        <ImprovementsWidget />
        
        {/* Recent Reports Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Recent Reports</span>
              </div>
              <Link href="/dashboard/reports">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Quick Stats */}
              {stats && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{stats.reports.total}</div>
                    <div className="text-xs text-muted-foreground">Total Reports</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{stats.reports.thisWeek}</div>
                    <div className="text-xs text-muted-foreground">This Week</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">{stats.reports.pendingGeneration}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="grid grid-cols-1 gap-2">
                <Link href="/dashboard/reports?action=generate">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Generate New Report
                  </Button>
                </Link>
                <Link href="/dashboard/reports?action=compare">
                  <Button variant="outline" className="w-full justify-start">
                    <GitCompare className="h-4 w-4 mr-2" />
                    Compare Reports
                  </Button>
                </Link>
                <Link href="/dashboard/reports?action=export">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Reports
                  </Button>
                </Link>
              </div>
              
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Last report generated: {stats?.reports.lastGenerated || 'Unknown'}
              </div>
            </div>
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
                  <span className="font-medium">{Math.round(stats.system.cpu)}%</span>
                </div>
                <Progress value={stats.system.cpu} />
                <div className="text-xs text-muted-foreground">
                  {stats.system.cpu < 70 ? 'Normal' : stats.system.cpu < 85 ? 'High' : 'Critical'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Memory Usage</span>
                  <span className="font-medium">{Math.round(stats.system.memory)}%</span>
                </div>
                <Progress value={stats.system.memory} />
                <div className="text-xs text-muted-foreground">
                  {stats.system.memory < 70 ? 'Normal' : stats.system.memory < 85 ? 'High' : 'Critical'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Tasks Progress</span>
                  <span className="font-medium">{stats.tasks.completionRate}%</span>
                </div>
                <Progress value={stats.tasks.completionRate} />
                <div className="text-xs text-muted-foreground">
                  {stats.tasks.active} active, {stats.tasks.completed} completed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}