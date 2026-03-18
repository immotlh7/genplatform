"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Calendar,
  Clock,
  GitCommit,
  Zap,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Code,
  Database,
  Shield,
  Activity
} from 'lucide-react'

export interface DailyReportData {
  date: string
  tasks: {
    completed: number
    total: number
    details: Array<{
      id: string
      title: string
      status: 'completed' | 'in-progress' | 'blocked'
      project: string
      sprint: string
    }>
  }
  development: {
    commits: number
    linesAdded: number
    linesRemoved: number
    filesChanged: number
    pullRequests: number
    deployments: number
  }
  performance: {
    score: number
    loadTime: number
    errorRate: number
    uptime: number
  }
  security: {
    vulnerabilities: number
    securityScore: number
    lastScan: string
  }
  system: {
    cpu: number
    memory: number
    disk: number
    apiCalls: number
    responseTime: number
  }
  insights: Array<{
    type: 'success' | 'warning' | 'info' | 'error'
    title: string
    description: string
    action?: string
  }>
}

interface DailyReportTemplateProps {
  data?: DailyReportData
  loading?: boolean
}

// Mock data for development
const MOCK_DAILY_DATA: DailyReportData = {
  date: '2026-03-18',
  tasks: {
    completed: 12,
    total: 15,
    details: [
      {
        id: '1',
        title: 'Implement project switcher in header',
        status: 'completed',
        project: 'GenPlatform.ai',
        sprint: 'Sprint 2C'
      },
      {
        id: '2',
        title: 'Create report generation system',
        status: 'completed',
        project: 'GenPlatform.ai', 
        sprint: 'Sprint 5A'
      },
      {
        id: '3',
        title: 'Add Arabic chat translation',
        status: 'completed',
        project: 'GenPlatform.ai',
        sprint: 'Sprint 1C'
      },
      {
        id: '4',
        title: 'Database optimization',
        status: 'in-progress',
        project: 'GenPlatform.ai',
        sprint: 'Sprint 6A'
      },
      {
        id: '5',
        title: 'Mobile app integration',
        status: 'blocked',
        project: 'Mobile App',
        sprint: 'Sprint 3A'
      }
    ]
  },
  development: {
    commits: 8,
    linesAdded: 1247,
    linesRemoved: 342,
    filesChanged: 23,
    pullRequests: 3,
    deployments: 2
  },
  performance: {
    score: 96,
    loadTime: 1.2,
    errorRate: 0.02,
    uptime: 99.9
  },
  security: {
    vulnerabilities: 0,
    securityScore: 98,
    lastScan: '2026-03-18T22:00:00Z'
  },
  system: {
    cpu: 45,
    memory: 62,
    disk: 78,
    apiCalls: 2341,
    responseTime: 234
  },
  insights: [
    {
      type: 'success',
      title: 'Excellent Sprint Progress',
      description: 'Completed 80% of planned tasks with high quality standards maintained.',
      action: 'Continue current velocity'
    },
    {
      type: 'warning',
      title: 'Disk Usage Trending Up',
      description: 'Disk usage at 78%. Consider cleanup or expansion within next week.',
      action: 'Schedule maintenance'
    },
    {
      type: 'info',
      title: 'Performance Optimization',
      description: 'Load times improved by 15% compared to last week.',
      action: 'Document optimizations'
    }
  ]
}

export function DailyReportTemplate({ data = MOCK_DAILY_DATA, loading = false }: DailyReportTemplateProps) {
  const [reportData, setReportData] = useState<DailyReportData>(data)

  useEffect(() => {
    if (data) {
      setReportData(data)
    }
  }, [data])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500 border-green-500/30'
      case 'in-progress': return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
      case 'blocked': return 'bg-red-500/20 text-red-500 border-red-500/30'
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500/10 border-green-500/20 text-green-700'
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700'
      case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-700'
      case 'error': return 'bg-red-500/10 border-red-500/20 text-red-700'
      default: return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-700'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle
      case 'warning': return AlertTriangle
      case 'info': return TrendingUp
      case 'error': return AlertTriangle
      default: return Activity
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  const taskCompletionRate = Math.round((reportData.tasks.completed / reportData.tasks.total) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Daily Development Report</h1>
        <p className="text-xl text-muted-foreground">{formatDate(reportData.date)}</p>
        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>Generated at {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Daily Report</span>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Executive Summary
          </CardTitle>
          <CardDescription>
            Key metrics and highlights for {formatDate(reportData.date)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-green-600">{reportData.tasks.completed}/{reportData.tasks.total}</div>
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
              <Progress value={taskCompletionRate} className="h-2" />
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-blue-600">{reportData.development.commits}</div>
              <div className="text-sm text-muted-foreground">Code Commits</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-purple-600">{reportData.performance.score}%</div>
              <div className="text-sm text-muted-foreground">Performance Score</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-orange-600">{reportData.development.deployments}</div>
              <div className="text-sm text-muted-foreground">Deployments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Task Progress
          </CardTitle>
          <CardDescription>
            Breakdown of completed and ongoing tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Overall Progress</h4>
            <Badge variant="outline" className="bg-green-500/20 text-green-500">
              {taskCompletionRate}% Complete
            </Badge>
          </div>
          <Progress value={taskCompletionRate} className="h-3" />
          
          <div className="space-y-3">
            {reportData.tasks.details.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1 flex-1">
                  <h5 className="font-medium text-sm">{task.title}</h5>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{task.project}</span>
                    <span>•</span>
                    <span>{task.sprint}</span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                  {task.status.replace('-', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Development Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code className="h-5 w-5 mr-2" />
            Development Activity
          </CardTitle>
          <CardDescription>
            Code changes and development metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Git Commits</span>
                <span className="font-medium">{reportData.development.commits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lines Added</span>
                <span className="font-medium text-green-600">+{reportData.development.linesAdded.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lines Removed</span>
                <span className="font-medium text-red-600">-{reportData.development.linesRemoved.toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Files Changed</span>
                <span className="font-medium">{reportData.development.filesChanged}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pull Requests</span>
                <span className="font-medium">{reportData.development.pullRequests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deployments</span>
                <span className="font-medium">{reportData.development.deployments}</span>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center space-y-1">
                <GitCommit className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Code Quality</div>
                <div className="text-lg font-bold">Excellent</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Performance Score</span>
                <span className="font-medium">{reportData.performance.score}%</span>
              </div>
              <Progress value={reportData.performance.score} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Load Time</div>
                <div className="font-medium">{reportData.performance.loadTime}s</div>
              </div>
              <div>
                <div className="text-muted-foreground">Error Rate</div>
                <div className="font-medium">{reportData.performance.errorRate}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Uptime</div>
                <div className="font-medium">{reportData.performance.uptime}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">API Calls</div>
                <div className="font-medium">{reportData.system.apiCalls.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security & System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Security Score</span>
                <span className="font-medium">{reportData.security.securityScore}%</span>
              </div>
              <Progress value={reportData.security.securityScore} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Vulnerabilities</div>
                <div className="font-medium text-green-600">{reportData.security.vulnerabilities}</div>
              </div>
              <div>
                <div className="text-muted-foreground">CPU Usage</div>
                <div className="font-medium">{reportData.system.cpu}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Memory Usage</div>
                <div className="font-medium">{reportData.system.memory}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Disk Usage</div>
                <div className="font-medium">{reportData.system.disk}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            AI-Generated Insights
          </CardTitle>
          <CardDescription>
            Automated analysis and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reportData.insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.type)
            return (
              <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                <div className="flex items-start space-x-3">
                  <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1 flex-1">
                    <h4 className="font-medium">{insight.title}</h4>
                    <p className="text-sm opacity-80">{insight.description}</p>
                    {insight.action && (
                      <Button variant="outline" size="sm" className="mt-2">
                        {insight.action}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground border-t pt-4">
        <p>Report generated by GenPlatform.ai Mission Control Dashboard</p>
        <p>Data collected from {formatDate(reportData.date)} • Next report: {formatDate(new Date(new Date(reportData.date).getTime() + 24 * 60 * 60 * 1000).toISOString())}</p>
      </div>
    </div>
  )
}