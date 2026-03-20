"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Pause,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Eye,
  Play,
  BarChart3
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WorkflowRun {
  id: string
  workflow_id: string
  workflow_name: string
  status: 'running' | 'completed' | 'failed' | 'waiting_approval'
  current_step?: string
  steps_completed: number
  steps_total: number
  started_at: string
  completed_at?: string
  duration?: string
  progress?: number
}

interface WorkflowStats {
  totalWorkflows: number
  activeWorkflows: number
  totalRuns: number
  runningRuns: number
  completedRuns: number
  failedRuns: number
  waitingApprovalRuns: number
  successRate: number
}

export function WorkflowStatusCard() {
  const router = useRouter()
  const [activeRuns, setActiveRuns] = useState<WorkflowRun[]>([])
  const [recentRuns, setRecentRuns] = useState<WorkflowRun[]>([])
  const [stats, setStats] = useState<WorkflowStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWorkflowData()
    
    // Set up polling for real-time updates
    const interval = setInterval(loadWorkflowData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadWorkflowData = async () => {
    try {
      const [workflowsResponse] = await Promise.all([
        fetch('/api/workflows', { credentials: 'include' })
      ])

      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json()
        
        if (workflowsData.success) {
          // Extract active and recent runs
          const allRuns: WorkflowRun[] = []
          
          workflowsData.data.workflows.forEach((workflow: any) => {
            if (workflow.latestRun) {
              const run = {
                id: workflow.latestRun.id,
                workflow_id: workflow.id,
                workflow_name: workflow.name,
                status: workflow.latestRun.status,
                current_step: workflow.latestRun.current_step,
                steps_completed: workflow.latestRun.steps_completed,
                steps_total: workflow.latestRun.steps_total,
                started_at: workflow.latestRun.started_at,
                completed_at: workflow.latestRun.completed_at,
                duration: formatDuration(workflow.latestRun.started_at, workflow.latestRun.completed_at),
                progress: Math.round((workflow.latestRun.steps_completed / workflow.latestRun.steps_total) * 100)
              }
              allRuns.push(run)
            }
          })

          // Separate active and recent runs
          const active = allRuns.filter(run => 
            run.status === 'running' || run.status === 'waiting_approval'
          )
          const recent = allRuns.filter(run => 
            run.status === 'completed' || run.status === 'failed'
          ).slice(0, 5)

          setActiveRuns(active)
          setRecentRuns(recent)
          setStats(workflowsData.data.statistics)
        }
      } else {
        // Demo data for development
        setActiveRuns([
          {
            id: 'run-001',
            workflow_id: 'wf-001',
            workflow_name: 'Idea to MVP',
            status: 'waiting_approval',
            current_step: 'Wait for Owner Approval',
            steps_completed: 3,
            steps_total: 8,
            started_at: '2026-03-18T16:30:00Z',
            duration: '10m 15s',
            progress: 38
          },
          {
            id: 'run-002',
            workflow_id: 'wf-002',
            workflow_name: 'Bug Fix',
            status: 'running',
            current_step: 'Running Tests',
            steps_completed: 2,
            steps_total: 5,
            started_at: '2026-03-18T16:45:00Z',
            duration: '5m 30s',
            progress: 40
          }
        ])

        setRecentRuns([
          {
            id: 'run-003',
            workflow_id: 'wf-003',
            workflow_name: 'Deploy Pipeline',
            status: 'completed',
            steps_completed: 6,
            steps_total: 6,
            started_at: '2026-03-18T15:30:00Z',
            completed_at: '2026-03-18T15:45:00Z',
            duration: '15m 0s',
            progress: 100
          },
          {
            id: 'run-004',
            workflow_id: 'wf-004',
            workflow_name: 'New Feature',
            status: 'failed',
            steps_completed: 4,
            steps_total: 7,
            started_at: '2026-03-18T14:00:00Z',
            completed_at: '2026-03-18T14:20:00Z',
            duration: '20m 0s',
            progress: 57
          }
        ])

        setStats({
          totalWorkflows: 5,
          activeWorkflows: 5,
          totalRuns: 15,
          runningRuns: 1,
          completedRuns: 12,
          failedRuns: 1,
          waitingApprovalRuns: 1,
          successRate: 85
        })
      }

    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading workflow data:', err);
      }
      setError('Failed to load workflow data')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const minutes = Math.floor(diffMs / 60000)
    const seconds = Math.floor((diffMs % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'waiting_approval':
        return <Pause className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'waiting_approval':
        return <Badge className="bg-yellow-100 text-yellow-800">Waiting Approval</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <CardTitle>⚡ Workflows</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <CardTitle>⚡ Workflows</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <CardTitle>⚡ Workflows</CardTitle>
            {stats && (
              <Badge variant="outline" className="ml-2">
                {stats.runningRuns + stats.waitingApprovalRuns} active
              </Badge>
            )}
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/automations')}
            >
              <Eye className="h-3 w-3 mr-1" />
              View All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadWorkflowData()}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold text-green-600">{stats.successRate}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">{stats.totalRuns}</div>
              <div className="text-xs text-muted-foreground">Total Runs</div>
            </div>
          </div>
        )}

        {/* Active Workflows */}
        {activeRuns.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">🔄 Active Workflows</h4>
              {stats && stats.waitingApprovalRuns > 0 && (
                <Button
                  variant="ghost" 
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => router.push('/dashboard/automations')}
                >
                  {stats.waitingApprovalRuns} need approval
                </Button>
              )}
            </div>
            
            {activeRuns.slice(0, 3).map((run) => (
              <div 
                key={run.id} 
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/automations/${run.workflow_id}/runs`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(run.status)}
                    <span className="font-medium text-sm">{run.workflow_name}</span>
                  </div>
                  {getStatusBadge(run.status)}
                </div>
                
                {run.current_step && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {run.current_step}
                  </p>
                )}
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Progress</span>
                    <span>{run.steps_completed}/{run.steps_total} steps</span>
                  </div>
                  <Progress value={run.progress} className="h-1" />
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                  <span>{run.duration}</span>
                  <span>{run.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Workflows */}
        {recentRuns.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">📋 Recent Completed</h4>
            
            {recentRuns.slice(0, 3).map((run) => (
              <div 
                key={run.id} 
                className="p-2 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/automations/${run.workflow_id}/runs`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(run.status)}
                    <span className="text-sm">{run.workflow_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">{run.duration}</span>
                    {getStatusBadge(run.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {activeRuns.length === 0 && recentRuns.length === 0 && (
          <div className="text-center py-6">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">No workflows running</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/automations')}
            >
              <Play className="h-3 w-3 mr-1" />
              Start Workflow
            </Button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/automations')}
              className="flex items-center space-x-1"
            >
              <BarChart3 className="h-3 w-3" />
              <span>Full Dashboard</span>
            </Button>
            
            {stats && stats.successRate < 80 && (
              <div className="flex items-center space-x-1 text-xs text-yellow-600">
                <TrendingUp className="h-3 w-3" />
                <span>Low success rate</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}