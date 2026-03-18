"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Users,
  AlertTriangle,
  Clock,
  Zap,
  Database,
  Shield,
  Server,
  BarChart3,
  FileText,
  Star,
  ArrowRight
} from 'lucide-react'

interface DailyReportData {
  reportDate: string
  generatedAt: string
  reportId: string
  
  // System Overview
  systemHealth: {
    overall: number
    uptime: string
    responseTime: number
    errorRate: number
    status: 'excellent' | 'good' | 'warning' | 'critical'
  }
  
  // Project Metrics
  projects: {
    total: number
    active: number
    completed: number
    paused: number
    newlyCreated: number
    topProjects: Array<{
      name: string
      progress: number
      status: string
      tasksCompleted: number
    }>
  }
  
  // Task Performance
  tasks: {
    total: number
    completed: number
    inProgress: number
    overdue: number
    averageCompletionTime: number
    productivityScore: number
    topPerformers: string[]
  }
  
  // User Activity
  users: {
    totalActive: number
    newRegistrations: number
    sessionsToday: number
    averageSessionDuration: number
    mostActiveUsers: string[]
  }
  
  // Security & Alerts
  security: {
    securityEvents: number
    loginAttempts: number
    failedLogins: number
    suspiciousActivity: number
    alertsGenerated: number
  }
  
  // Key Insights
  insights: Array<{
    type: 'positive' | 'neutral' | 'warning' | 'critical'
    title: string
    description: string
    metric?: string
  }>
  
  // Recommendations
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    category: string
    title: string
    description: string
    estimatedImpact: string
  }>
}

interface DailyReportTemplateProps {
  data: DailyReportData
  className?: string
}

export function DailyReportTemplate({ data, className = "" }: DailyReportTemplateProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  const getHealthColor = (score: number) => {
    if (score >= 95) return 'text-green-600'
    if (score >= 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthBadge = (status: string) => {
    const configs = {
      excellent: { label: 'Excellent', className: 'bg-green-50 text-green-700 border-green-200' },
      good: { label: 'Good', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      warning: { label: 'Warning', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      critical: { label: 'Critical', className: 'bg-red-50 text-red-700 border-red-200' }
    }
    const config = configs[status as keyof typeof configs] || configs.good
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-blue-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className={`space-y-6 max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center space-x-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          <span>Daily System Report</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          {formatDate(data.reportDate)}
        </p>
        <p className="text-sm text-muted-foreground">
          Generated at {formatTime(data.generatedAt)} • Report ID: {data.reportId}
        </p>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Executive Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getHealthColor(data.systemHealth.overall)}`}>
                {data.systemHealth.overall}%
              </div>
              <p className="text-sm text-muted-foreground">System Health</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {data.projects.active}
              </div>
              <p className="text-sm text-muted-foreground">Active Projects</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {data.tasks.completed}
              </div>
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {data.users.totalActive}
              </div>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Health</span>
            </div>
            {getHealthBadge(data.systemHealth.status)}
          </CardTitle>
          <CardDescription>
            Overall system performance and availability metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Health</span>
                <span className={`text-sm font-bold ${getHealthColor(data.systemHealth.overall)}`}>
                  {data.systemHealth.overall}%
                </span>
              </div>
              <Progress value={data.systemHealth.overall} className="h-2" />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.systemHealth.uptime}
              </div>
              <p className="text-xs text-muted-foreground">Uptime</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.systemHealth.responseTime}ms
              </div>
              <p className="text-xs text-muted-foreground">Avg Response</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {data.systemHealth.errorRate}%
              </div>
              <p className="text-xs text-muted-foreground">Error Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Project Overview</span>
          </CardTitle>
          <CardDescription>
            Project status and progress across all active initiatives
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.projects.total}</div>
              <p className="text-xs text-muted-foreground">Total Projects</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.projects.active}</div>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.projects.completed}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{data.projects.paused}</div>
              <p className="text-xs text-muted-foreground">Paused</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.projects.newlyCreated}</div>
              <p className="text-xs text-muted-foreground">New Today</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>Top Performing Projects</span>
            </h4>
            {data.projects.topProjects.map((project, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h5 className="font-medium">{project.name}</h5>
                    <Badge variant="outline" className="text-xs capitalize">
                      {project.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1">
                      <Progress value={project.progress} className="w-20 h-1.5" />
                      <span className="text-xs text-muted-foreground">{project.progress}%</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {project.tasksCompleted} tasks completed
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Task Performance</span>
          </CardTitle>
          <CardDescription>
            Task completion metrics and productivity insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.tasks.total}</div>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.tasks.completed}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{data.tasks.inProgress}</div>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{data.tasks.overdue}</div>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {data.tasks.averageCompletionTime}h
              </div>
              <p className="text-sm text-muted-foreground">Avg Completion Time</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {data.tasks.productivityScore}%
              </div>
              <p className="text-sm text-muted-foreground">Productivity Score</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">
                {data.tasks.topPerformers.length}
              </div>
              <p className="text-sm text-muted-foreground">Top Performers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>User Activity</span>
          </CardTitle>
          <CardDescription>
            User engagement and activity patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.users.totalActive}</div>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.users.newRegistrations}</div>
              <p className="text-xs text-muted-foreground">New Signups</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.users.sessionsToday}</div>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.users.averageSessionDuration}m</div>
              <p className="text-xs text-muted-foreground">Avg Session</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security & Alerts</span>
          </CardTitle>
          <CardDescription>
            Security events and system alerts summary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.security.securityEvents}</div>
              <p className="text-xs text-muted-foreground">Security Events</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.security.loginAttempts}</div>
              <p className="text-xs text-muted-foreground">Login Attempts</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{data.security.failedLogins}</div>
              <p className="text-xs text-muted-foreground">Failed Logins</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.security.suspiciousActivity}</div>
              <p className="text-xs text-muted-foreground">Suspicious</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{data.security.alertsGenerated}</div>
              <p className="text-xs text-muted-foreground">Alerts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Key Insights</span>
          </CardTitle>
          <CardDescription>
            AI-generated insights and notable patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.insights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
              {getInsightIcon(insight.type)}
              <div className="flex-1">
                <h5 className="font-medium">{insight.title}</h5>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                {insight.metric && (
                  <span className="text-xs text-blue-600 font-mono">{insight.metric}</span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowRight className="h-5 w-5" />
            <span>Recommendations</span>
          </CardTitle>
          <CardDescription>
            Actionable recommendations for improvement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
              <div className={`text-xs font-medium px-2 py-1 rounded ${
                rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {rec.priority.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h5 className="font-medium">{rec.title}</h5>
                  <Badge variant="secondary" className="text-xs">{rec.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{rec.description}</p>
                <p className="text-xs text-blue-600">
                  Estimated impact: {rec.estimatedImpact}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground border-t pt-4">
        <p>
          This report was automatically generated by GenPlatform.ai Mission Control Dashboard
        </p>
        <p>
          Report ID: {data.reportId} • Generated: {formatTime(data.generatedAt)}
        </p>
      </div>
    </div>
  )
}

// Mock data generator for testing
export function generateMockDailyReportData(): DailyReportData {
  return {
    reportDate: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
    reportId: `daily-${Date.now()}`,
    
    systemHealth: {
      overall: 96,
      uptime: '99.8%',
      responseTime: 145,
      errorRate: 0.2,
      status: 'excellent'
    },
    
    projects: {
      total: 6,
      active: 4,
      completed: 1,
      paused: 1,
      newlyCreated: 0,
      topProjects: [
        {
          name: 'GenPlatform.ai',
          progress: 85,
          status: 'active',
          tasksCompleted: 15
        },
        {
          name: 'Commander Enhancement',
          progress: 75,
          status: 'active',
          tasksCompleted: 6
        }
      ]
    },
    
    tasks: {
      total: 47,
      completed: 23,
      inProgress: 18,
      overdue: 6,
      averageCompletionTime: 4.2,
      productivityScore: 88,
      topPerformers: ['Claude', 'System', 'Agent']
    },
    
    users: {
      totalActive: 3,
      newRegistrations: 0,
      sessionsToday: 12,
      averageSessionDuration: 45,
      mostActiveUsers: ['Med', 'Admin', 'Developer']
    },
    
    security: {
      securityEvents: 2,
      loginAttempts: 18,
      failedLogins: 1,
      suspiciousActivity: 0,
      alertsGenerated: 0
    },
    
    insights: [
      {
        type: 'positive',
        title: 'High System Performance',
        description: 'System health maintained at 96% with excellent response times.',
        metric: '145ms avg response'
      },
      {
        type: 'neutral',
        title: 'Steady Project Progress',
        description: 'Active projects showing consistent completion rates.',
        metric: '88% productivity score'
      },
      {
        type: 'warning',
        title: 'Some Overdue Tasks',
        description: '6 tasks are currently overdue and need attention.',
        metric: '12.8% overdue rate'
      }
    ],
    
    recommendations: [
      {
        priority: 'medium',
        category: 'Performance',
        title: 'Address Overdue Tasks',
        description: 'Review and reschedule the 6 overdue tasks to improve completion rates.',
        estimatedImpact: '+5% productivity'
      },
      {
        priority: 'low',
        category: 'Monitoring',
        title: 'Implement Automated Alerts',
        description: 'Set up proactive alerts for task deadlines and system thresholds.',
        estimatedImpact: 'Reduced incidents'
      }
    ]
  }
}