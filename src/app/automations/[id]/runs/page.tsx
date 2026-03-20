"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  CheckCircle, 
  Clock, 
  XCircle, 
  Pause,
  Play,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Eye,
  CheckSquare,
  X,
  RotateCcw
} from 'lucide-react'
import { getCurrentUserClient, getUserPermissionSummary } from '@/lib/access-control'
import type { User } from '@/lib/access-control'

interface WorkflowRun {
  id: string
  workflow_id: string
  project_id?: string
  status: 'running' | 'completed' | 'failed' | 'waiting_approval'
  current_step?: string
  steps_completed: number
  steps_total: number
  logs: Array<{
    step_id?: string
    step_name?: string
    timestamp: string
    type: string
    status: string
    duration?: number
    result?: any
    error?: string
  }>
  error_message?: string
  started_at: string
  completed_at?: string
  started_by?: string
  approved_by?: string
  approved_at?: string
}

interface WorkflowStep {
  id: string
  name: string
  type: 'action' | 'approval' | 'loop' | 'notification'
  description: string
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'waiting'
  duration?: string
  logs?: any
}

export default function WorkflowRunDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workflowId = params.id as string
  
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userPermissions, setUserPermissions] = useState<any>(null)
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null)
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkUserAccess()
  }, [])

  useEffect(() => {
    if (currentUser && userPermissions?.canView) {
      loadWorkflowRuns()
    }
  }, [currentUser, userPermissions, workflowId])

  const checkUserAccess = async () => {
    try {
      const user = await getCurrentUserClient()
      setCurrentUser(user)

      if (user) {
        const permissions = getUserPermissionSummary(user)
        setUserPermissions({
          canView: permissions.isAdmin, // Only ADMIN+ can view workflow details
          canApprove: permissions.isAdmin, // Only ADMIN+ can approve workflows
          canManage: permissions.isAdmin
        })
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking user access:', error);
      }
      setError('Failed to verify permissions')
    } finally {
      setLoading(false)
    }
  }

  const loadWorkflowRuns = async () => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/runs`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setRuns(data.runs || [])
        
        // Select most recent run by default
        if (data.runs && data.runs.length > 0) {
          setSelectedRun(data.runs[0])
          generateWorkflowSteps(data.runs[0])
        }
      } else {
        // Demo data for development
        const demoRuns: WorkflowRun[] = [
          {
            id: 'run-001',
            workflow_id: workflowId,
            status: 'waiting_approval',
            current_step: 'Wait for Owner Approval',
            steps_completed: 3,
            steps_total: 8,
            logs: [
              {
                step_name: 'Research & Analyze',
                timestamp: '2026-03-18T16:30:00Z',
                type: 'action',
                status: 'completed',
                duration: 180
              },
              {
                step_name: 'Generate Master Plan',
                timestamp: '2026-03-18T16:33:00Z',
                type: 'action',
                status: 'completed',
                duration: 240
              },
              {
                step_name: 'Create Task Breakdown',
                timestamp: '2026-03-18T16:37:00Z',
                type: 'action',
                status: 'completed',
                duration: 120
              },
              {
                step_name: 'Wait for Owner Approval',
                timestamp: '2026-03-18T16:39:00Z',
                type: 'approval',
                status: 'waiting'
              }
            ],
            started_at: '2026-03-18T16:30:00Z',
            started_by: 'system'
          }
        ]
        setRuns(demoRuns)
        setSelectedRun(demoRuns[0])
        generateWorkflowSteps(demoRuns[0])
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading workflow runs:', err);
      }
      setError('Failed to load workflow runs')
    }
  }

  const generateWorkflowSteps = (run: WorkflowRun) => {
    // Generate steps based on workflow type and logs
    const steps: WorkflowStep[] = [
      {
        id: 'research',
        name: 'Research & Analyze',
        type: 'action',
        description: 'Analyze the idea and research market/technical requirements',
        status: run.steps_completed >= 1 ? 'completed' : 'pending',
        duration: run.steps_completed >= 1 ? '3m 0s' : undefined
      },
      {
        id: 'plan',
        name: 'Generate Master Plan',
        type: 'action',
        description: 'Create comprehensive project plan and architecture',
        status: run.steps_completed >= 2 ? 'completed' : run.steps_completed === 1 ? 'running' : 'pending',
        duration: run.steps_completed >= 2 ? '4m 0s' : undefined
      },
      {
        id: 'tasks',
        name: 'Create Task Breakdown',
        type: 'action',
        description: 'Break down the master plan into specific development tasks',
        status: run.steps_completed >= 3 ? 'completed' : run.steps_completed === 2 ? 'running' : 'pending',
        duration: run.steps_completed >= 3 ? '2m 0s' : undefined
      },
      {
        id: 'approval',
        name: 'Wait for Owner Approval',
        type: 'approval',
        description: 'Owner review and approval before proceeding with development',
        status: run.status === 'waiting_approval' ? 'waiting' : run.steps_completed >= 4 ? 'completed' : 'pending'
      },
      {
        id: 'development',
        name: 'Development Loop',
        type: 'loop',
        description: 'For each task: Code → Self-Review → Integration',
        status: run.steps_completed >= 5 ? 'completed' : 'pending'
      },
      {
        id: 'security',
        name: 'Final Security Scan',
        type: 'action',
        description: 'Comprehensive security audit of the complete MVP',
        status: run.steps_completed >= 6 ? 'completed' : 'pending'
      },
      {
        id: 'deploy',
        name: 'Deploy to Preview',
        type: 'action',
        description: 'Deploy MVP to staging/preview environment',
        status: run.steps_completed >= 7 ? 'completed' : 'pending'
      },
      {
        id: 'notify',
        name: 'Notify Owner: Project Ready',
        type: 'notification',
        description: 'Notify owner that MVP is complete and ready for review',
        status: run.steps_completed >= 8 ? 'completed' : 'pending'
      }
    ]

    setWorkflowSteps(steps)
  }

  const handleApprove = async () => {
    if (!selectedRun || !userPermissions?.canApprove) return

    try {
      const response = await fetch('/api/workflows/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ runId: selectedRun.id })
      })

      if (response.ok) {
        // Refresh the data
        await loadWorkflowRuns()
      } else {
        setError('Failed to approve workflow')
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error approving workflow:', err);
      }
      setError('Failed to approve workflow')
    }
  }

  const handleReject = async () => {
    if (!selectedRun || !userPermissions?.canApprove) return

    try {
      const response = await fetch('/api/workflows/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ runId: selectedRun.id })
      })

      if (response.ok) {
        await loadWorkflowRuns()
      } else {
        setError('Failed to reject workflow')
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error rejecting workflow:', err);
      }
      setError('Failed to reject workflow')
    }
  }

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
      case 'waiting':
        return <Pause className="h-5 w-5 text-yellow-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStepBadge = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 animate-pulse">Running</Badge>
      case 'waiting':
        return <Badge className="bg-yellow-100 text-yellow-800">Waiting Approval</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
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

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !userPermissions?.canView) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="p-12 text-center">
          <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            {error || 'You need ADMIN access to view workflow details.'}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Automations
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Workflow Runs</h1>
        </div>
        <Button variant="outline" onClick={() => loadWorkflowRuns()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Run List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {runs.map((run) => (
              <div
                key={run.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedRun?.id === run.id 
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                  setSelectedRun(run)
                  generateWorkflowSteps(run)
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{run.id}</span>
                  {run.status === 'running' && (
                    <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />
                  )}
                  {run.status === 'completed' && (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  )}
                  {run.status === 'waiting_approval' && (
                    <Pause className="h-3 w-3 text-yellow-600" />
                  )}
                  {run.status === 'failed' && (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDuration(run.started_at, run.completed_at)} • {run.steps_completed}/{run.steps_total} steps
                </div>
                <Progress 
                  value={run.steps_total > 0 ? (run.steps_completed / run.steps_total) * 100 : 0} 
                  className="mt-2 h-1" 
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Run Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>Run Details</span>
                  {selectedRun && (
                    <Badge variant="outline">
                      {selectedRun.steps_completed}/{selectedRun.steps_total} steps
                    </Badge>
                  )}
                </CardTitle>
                {selectedRun && (
                  <p className="text-sm text-muted-foreground">
                    Started {formatDuration(selectedRun.started_at)} ago
                  </p>
                )}
              </div>
              {selectedRun?.status === 'waiting_approval' && userPermissions?.canApprove && (
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                  >
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Approve & Continue
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700"
                    onClick={handleReject}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject & Stop
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedRun ? (
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{selectedRun.steps_completed}/{selectedRun.steps_total} steps ({Math.round((selectedRun.steps_completed / selectedRun.steps_total) * 100)}%)</span>
                  </div>
                  <Progress value={(selectedRun.steps_completed / selectedRun.steps_total) * 100} className="h-2" />
                </div>

                {/* Steps List */}
                <div className="space-y-3">
                  {workflowSteps.map((step, index) => (
                    <div key={step.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                      {getStepIcon(step)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{step.name}</h4>
                          {getStepBadge(step)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {step.description}
                        </p>
                        {step.duration && (
                          <p className="text-xs text-green-600">
                            Completed in {step.duration}
                          </p>
                        )}
                        {step.status === 'waiting' && step.type === 'approval' && (
                          <div className="mt-2 text-xs bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-200">
                            ⏸️ Waiting for owner approval to proceed with development
                          </div>
                        )}
                      </div>
                      {step.status === 'completed' && (
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          Logs
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Error Message */}
                {selectedRun.error_message && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Workflow Failed</span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {selectedRun.error_message}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a workflow run to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}