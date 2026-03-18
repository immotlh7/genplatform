'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Play,
  Pause,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowRun {
  id: string
  workflow_id: string
  project_id?: string
  status: 'running' | 'completed' | 'failed' | 'waiting_approval'
  current_step?: string
  steps_completed: number
  steps_total: number
  logs: any[]
  started_at: string
  completed_at?: string
}

interface WorkflowStep {
  id: string
  name: string
  type: 'action' | 'approval' | 'loop' | 'notification'
  description: string
  estimatedMinutes?: number
}

export default function WorkflowRunDetailPage() {
  const params = useParams()
  const router = useRouter()
  const runId = params.id as string

  const [workflowRun, setWorkflowRun] = useState<WorkflowRun | null>(null)
  const [workflow, setWorkflow] = useState<any>(null)
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    if (runId) {
      fetchWorkflowRun()
      
      // Poll for updates every 5 seconds for running workflows
      const interval = setInterval(() => {
        if (workflowRun?.status === 'running' || workflowRun?.status === 'waiting_approval') {
          fetchWorkflowRun()
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [runId, workflowRun?.status])

  const fetchWorkflowRun = async () => {
    try {
      const response = await fetch(`/api/workflows/runs/${runId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflow run')
      }
      
      const data = await response.json()
      setWorkflowRun(data.run)
      setWorkflow(data.workflow)
      setSteps(data.workflow?.config?.steps || [])
    } catch (error) {
      console.error('Error fetching workflow run:', error)
      setError('Failed to load workflow run')
    } finally {
      setLoading(false)
    }
  }

  const getStepStatus = (stepIndex: number) => {
    if (!workflowRun) return 'pending'
    
    if (stepIndex < workflowRun.steps_completed) {
      return 'completed'
    } else if (stepIndex === workflowRun.steps_completed) {
      if (workflowRun.status === 'waiting_approval') {
        return 'waiting_approval'
      } else if (workflowRun.status === 'running') {
        return 'running'
      } else if (workflowRun.status === 'failed') {
        return 'failed'
      }
    }
    
    return 'pending'
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case 'waiting_approval':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepDuration = (stepName: string) => {
    if (!workflowRun?.logs) return null
    
    const stepLogs = workflowRun.logs.filter(log => log.step === stepName)
    if (stepLogs.length < 2) return null
    
    const startLog = stepLogs.find(log => log.message.includes('Starting'))
    const endLog = stepLogs.find(log => log.message.includes('Completed'))
    
    if (!startLog || !endLog) return null
    
    const duration = new Date(endLog.timestamp).getTime() - new Date(startLog.timestamp).getTime()
    return formatDuration(duration)
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const getStepLogs = (stepName: string) => {
    if (!workflowRun?.logs) return []
    return workflowRun.logs.filter(log => log.step === stepName)
  }

  const handleApproval = async (approved: boolean) => {
    try {
      setApproving(true)
      
      const response = await fetch('/api/workflows/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          runId: workflowRun?.id,
          approved 
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process approval')
      }

      // Refresh data
      await fetchWorkflowRun()
    } catch (error) {
      console.error('Error processing approval:', error)
      setError('Failed to process approval')
    } finally {
      setApproving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading workflow run...</p>
        </div>
      </div>
    )
  }

  if (error || !workflowRun) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Workflow run not found'}</p>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">
              {workflow?.name} - Run #{workflowRun.id.slice(-8)}
            </h1>
            <p className="text-muted-foreground">
              Started {new Date(workflowRun.started_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant={
            workflowRun.status === 'completed' ? 'default' :
            workflowRun.status === 'running' ? 'secondary' :
            workflowRun.status === 'waiting_approval' ? 'outline' :
            'destructive'
          }>
            {workflowRun.status.replace('_', ' ').toUpperCase()}
          </Badge>
          
          <div className="text-sm text-muted-foreground">
            {workflowRun.steps_completed}/{workflowRun.steps_total} steps completed
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(index)
              const duration = getStepDuration(step.name)
              const logs = getStepLogs(step.name)
              const isExpanded = expandedStep === step.id
              const isCurrentStep = index === workflowRun.steps_completed

              return (
                <div key={step.id} className="space-y-2">
                  <div 
                    className={cn(
                      'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors',
                      status === 'completed' && 'bg-green-50 border-green-200',
                      status === 'running' && 'bg-blue-50 border-blue-200',
                      status === 'waiting_approval' && 'bg-yellow-50 border-yellow-200',
                      status === 'failed' && 'bg-red-50 border-red-200',
                      status === 'pending' && 'bg-gray-50 border-gray-200'
                    )}
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  >
                    <div className="flex items-center gap-3">
                      {getStepIcon(status)}
                      <div>
                        <h4 className="font-medium">
                          Step {index + 1}: {step.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                        {step.type === 'approval' && status === 'waiting_approval' && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApproval(true)
                              }}
                              disabled={approving}
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Approve & Continue
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApproval(false)
                              }}
                              disabled={approving}
                            >
                              <ThumbsDown className="h-4 w-4 mr-1" />
                              Reject & Stop
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {duration && (
                        <span className="text-sm text-muted-foreground">
                          {duration}
                        </span>
                      )}
                      {status === 'completed' && (
                        <Badge variant="outline" className="text-green-600">
                          {status}
                        </Badge>
                      )}
                      {logs.length > 0 && (
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Step Details */}
                  {isExpanded && logs.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Step Logs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {logs.map((log, logIndex) => (
                            <div 
                              key={logIndex}
                              className={cn(
                                'text-sm p-2 rounded',
                                log.level === 'error' && 'bg-red-50 text-red-800',
                                log.level === 'warning' && 'bg-yellow-50 text-yellow-800',
                                log.level === 'success' && 'bg-green-50 text-green-800',
                                log.level === 'info' && 'bg-blue-50 text-blue-800'
                              )}
                            >
                              <div className="flex justify-between items-start">
                                <span>{log.message}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              {log.error && (
                                <div className="mt-1 text-xs opacity-75">
                                  Error: {log.error}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Run Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{workflowRun.steps_completed}</p>
                <p className="text-sm text-muted-foreground">Steps Completed</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{workflowRun.steps_total}</p>
                <p className="text-sm text-muted-foreground">Total Steps</p>
              </div>
              <Play className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {workflowRun.completed_at 
                    ? formatDuration(new Date(workflowRun.completed_at).getTime() - new Date(workflowRun.started_at).getTime())
                    : formatDuration(new Date().getTime() - new Date(workflowRun.started_at).getTime())
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {workflowRun.completed_at ? 'Total Duration' : 'Elapsed Time'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}