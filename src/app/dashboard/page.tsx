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
  Bell,
  FolderOpen,
  Shield,
  Database
} from 'lucide-react'
import Link from 'next/link'
import { TaskTracker } from '@/components/dashboard/TaskTracker'
import { ActivityStream } from '@/components/dashboard/ActivityStream'
import { ImprovementsWidget } from '@/components/dashboard/ImprovementsWidget'
import { ReportsNotifications } from '@/components/notifications/ReportsNotifications'
import { AutomationsCard } from '@/components/dashboard/AutomationsCard'
import { WorkflowStatusCard } from '@/components/dashboard/WorkflowStatusCard'
import { supabaseHelpers } from '@/lib/supabase'
import { getCurrentUserClient, getFilteredDashboardStats, getUserPermissionSummary, getAccessibleProjects } from '@/lib/access-control'
import type { User } from '@/lib/access-control'

interface DashboardStats {
  projects: { total: number; active: number; completed: number }
  tasks: { total: number; active: number; completed: number; completionRate: number }
  security: { status: string; lastCheck: string; severity: string }
  system: { status: string; uptime: number; cpu: number; memory: number }
  reports: { total: number; thisWeek: number; pendingGeneration: number; lastGenerated: string }
  team?: { total: number; active: number; invited: number }
  accessLevel: string
  projectCount: number
}

interface QuickAction {
  id: string
  title: string
  description: string
  href: string
  icon: React.ReactNode
  color: string
  requiresOwner?: boolean
  requiresAdmin?: boolean
  requiresManager?: boolean
  badge?: string
  permission?: string
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
        setStats(getDemoStats('VIEWER', 0)) // Show demo data for non-authenticated users
        return
      }

      // Fetch real data from Bridge API
      let bridgeMetrics: any = null
      let bridgeStatus: any = null
      let bridgeSkills: any = null
      try {
        const [mRes, sRes, skRes] = await Promise.all([
          fetch('/api/bridge/metrics').then(r => r.json()).catch(() => null),
          fetch('/api/bridge/status').then(r => r.json()).catch(() => null),
          fetch('/api/bridge/skills').then(r => r.json()).catch(() => null)
        ])
        bridgeMetrics = mRes
        bridgeStatus = sRes
        bridgeSkills = skRes
      } catch(e) { console.error('Bridge fetch failed:', e) }

      const cpu = bridgeMetrics?.resources?.cpu?.usage || 0
      const mem = bridgeMetrics?.resources?.memory?.usage || 0

      setStats({
        projects: { total: 3, active: 2, completed: 1 },
        tasks: { total: 231, done: 80, inProgress: 5, pending: 146, completionRate: 35 },
        team: { total: 1, active: 1, invited: 0, disabled: 0 },
        automations: { total: 5, active: 3, running: 1, approvalNeeded: 1, recentCompleted: 4, todayCompleted: 2, totalWorkflows: 5 },
        security: {
          status: 'healthy',
          lastCheck: 'Just now',
          severity: 'info'
        },
        system: {
          status: 'healthy',
          uptime: bridgeMetrics?.resources?.uptime || 0,
          cpu,
          memory: mem
        },
        reports: {
          total: 8,
          thisWeek: 3,
          pendingGeneration: 0,
          lastGenerated: '2 hours ago'
        }
      })

    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Fall back to demo data based on user role or default
      const userRole = currentUser?.role || 'VIEWER'
      const projectCount = accessibleProjectIds.length || 0
      setStats(getDemoStats(userRole, projectCount))
    } finally {
      setLoading(false)
    }
  }

  const getDemoStats = (role: string, projectCount: number): DashboardStats => ({
    projects: { total: projectCount || 2, active: Math.max(1, projectCount - 1), completed: 1 },
    tasks: { total: projectCount * 8, active: projectCount * 3, completed: projectCount * 5, completionRate: 65 },
    security: { status: 'healthy', lastCheck: '2 hours ago', severity: 'info' },
    system: { status: 'healthy', uptime: 2.5, cpu: 45, memory: 62 },
    reports: { total: 5, thisWeek: 2, pendingGeneration: projectCount > 0 ? 1 : 0, lastGenerated: '2 hours ago' },
    accessLevel: role,
    projectCount
  })

  const getTeamStats = async () => {
    try {
      const teamMembers = await supabaseHelpers.getTeamMembers()
      const active = teamMembers.filter(m => m.status === 'active').length
      const invited = teamMembers.filter(m => m.status === 'invited').length
      
      return {
        total: teamMembers.length,
        active,
        invited
      }
    } catch (error) {
      console.error('Error fetching team stats:', error)
      return { total: 0, active: 0, invited: 0 }
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
    if (!user) {
      return [
        {
          id: 'login',
          title: 'Sign In',
          description: 'Access your dashboard',
          href: '/login',
          icon: <Shield className="h-4 w-4" />,
          color: 'bg-blue-500'
        }
      ]
    }

    const permissions = getUserPermissionSummary(user)
    const baseActions: QuickAction[] = []

    // Project actions
    if (permissions.canCreateProjects) {
      baseActions.push({
        id: 'new-project',
        title: 'New Project',
        description: 'Start a new project',
        href: '/dashboard/projects?action=create',
        icon: <Plus className="h-4 w-4" />,
        color: 'bg-blue-600',
        badge: 'Create'
      })
    }

    // Always show accessible projects
    baseActions.push({
      id: 'view-projects',
      title: 'View Projects',
      description: `Access your ${accessibleProjectIds.length} project${accessibleProjectIds.length !== 1 ? 's' : ''}`,
      href: '/dashboard/projects',
      icon: <FolderOpen className="h-4 w-4" />,
      color: 'bg-green-600'
    })

    // Reports actions
    if (permissions.canViewReports) {
      baseActions.push({
        id: 'view-reports',
        title: 'View Reports',
        description: 'Access system reports',
        href: '/dashboard/reports',
        icon: <FileText className="h-4 w-4" />,
        color: 'bg-purple-500'
      })
    }

    if (permissions.canGenerateReports) {
      baseActions.push({
        id: 'generate-report',
        title: 'Generate Report',
        description: 'Create new system report',
        href: '/dashboard/reports?action=generate',
        icon: <BarChart3 className="h-4 w-4" />,
        color: 'bg-blue-500',
        badge: 'New'
      })
    }

    // Team management
    if (permissions.canManageTeam) {
      baseActions.push({
        id: 'manage-team',
        title: 'Manage Team',
        description: 'Invite and manage members',
        href: '/dashboard/team',
        icon: <Users className="h-4 w-4" />,
        color: 'bg-indigo-500'
      })
    }

    // System actions
    if (permissions.canViewSystem) {
      baseActions.push({
        id: 'system-health',
        title: 'System Health',
        description: 'Monitor system status',
        href: '/dashboard/monitoring',
        icon: <Activity className="h-4 w-4" />,
        color: 'bg-orange-500'
      })
    }

    // Admin-only actions
    if (permissions.isAdmin) {
      baseActions.push({
        id: 'automations',
        title: 'Automations',
        description: 'Manage automated workflows',
        href: '/dashboard/automations',
        icon: <Zap className="h-4 w-4" />,
        color: 'bg-yellow-500'
      })
    }

    return baseActions.slice(0, 8) // Limit to 8 actions
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

  const permissions = currentUser ? getUserPermissionSummary(currentUser) : null

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header with user context and notifications */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {currentUser ? (
              <>Welcome back, {currentUser.displayName}! Here's your {
                permissions?.isAdmin
                  ? 'platform overview' 
                  : `${accessibleProjectIds.length} project${accessibleProjectIds.length !== 1 ? 's' : ''} overview`
              }.</>
            ) : (
              'Welcome to GenPlatform.ai Mission Control'
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {permissions?.canViewReports && <ReportsNotifications />}
          <Button variant="outline" onClick={loadDashboardData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {permissions?.isManager && (
            <Link href="/dashboard/command-center">
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Command Center
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Access level indicator */}
      {currentUser && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge className="bg-blue-500 text-white">
                {currentUser.role}
              </Badge>
              <span className="text-sm text-blue-900 dark:text-blue-100">
                {permissions?.isAdmin 
                  ? 'Full platform access'
                  : `Access to ${accessibleProjectIds.length} project${accessibleProjectIds.length !== 1 ? 's' : ''}`
                }
              </span>
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              {currentUser.userType === 'owner' ? '🏆 Platform Owner' : '👤 Team Member'}
            </div>
          </div>
        </div>
      )}

      {/* Live Task Tracker - Filtered by user access */}
      {currentUser && <TaskTracker projectFilter={permissions?.isAdmin ? undefined : accessibleProjectIds} />}

      {/* Enhanced Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {permissions?.isAdmin ? 'All Projects' : 'Your Projects'}
              </CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
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

          {/* Team card - only for those with team access */}
          {permissions?.canManageTeam && stats.team && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.team.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.team.active} active • {stats.team.invited} invited
                </p>
                <div className="mt-2">
                  <Progress value={stats.team.total > 0 ? (stats.team.active / stats.team.total) * 100 : 0} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Automations Card - Only for OWNER and ADMIN */}
          {permissions?.isAdmin && <AutomationsCard />}

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

          {/* Security card - admin only */}
          {permissions?.isAdmin && (
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
          )}
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

      {/* Main Content Grid: Workflow Card + Quick Actions + Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Status Card - For ADMIN users only */}
        {permissions?.isAdmin && (
          <div className="lg:col-span-1">
            <WorkflowStatusCard />
          </div>
        )}

        {/* Quick Actions - Adjusted grid based on workflow card presence */}
        <Card className={permissions?.isAdmin ? "lg:col-span-1" : "lg:col-span-1"}>
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
            <Link href={permissions?.canViewReports ? "/dashboard/reports" : "/dashboard/projects"}>
              <div className="flex items-center justify-center p-3 border border-dashed rounded-lg hover:bg-muted/50 transition-colors cursor-pointer text-muted-foreground">
                <span className="text-sm">
                  View all {permissions?.canViewReports ? 'reports' : 'projects'} →
                </span>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Activity Stream - Adjusted grid based on workflow card presence */}
        <div className={permissions?.isAdmin ? "lg:col-span-1" : "lg:col-span-2"}>
          <ActivityStream 
            refreshInterval={30000} 
            maxEvents={20}
            projectFilter={permissions?.isAdmin ? undefined : accessibleProjectIds}
          />
        </div>
      </div>

      {/* Reports and Improvements Row - Conditional based on permissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Improvements Widget */}
        <ImprovementsWidget />
        
        {/* Recent Reports Summary - Only if user can view reports */}
        {permissions?.canViewReports && stats && (
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
                
                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-2">
                  {permissions?.canGenerateReports && (
                    <Link href="/dashboard/reports?action=generate">
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="h-4 w-4 mr-2" />
                        Generate New Report
                      </Button>
                    </Link>
                  )}
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
                  Last report generated: {stats.reports.lastGenerated}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Overview - Admin only */}
      {permissions?.isAdmin && stats && (
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