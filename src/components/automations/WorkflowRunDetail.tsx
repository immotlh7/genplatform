"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Activity,
  User,
  Calendar,
  Timer
} from 'lucide-react'

interface WorkflowLog {
  timestamp: string
  level: 'info' | 'error' | 'warning'
  message: string
  step: string
}

interface WorkflowStep {
  order: number
  name: string
  description: string
  type: 'action' | 'approval' | 'loop'
  icon: string
  status: 'completed' | 'running' | 'waiting' | 'failed' | 'pending'
  duration?: number
  logs?: WorkflowLog[]
}

interface WorkflowRun {
  id: string
  workflow_id: string
  project_id?: string
  status: 'running' | 'completed' | 'failed' | 'waiting_approval'
  current_step: string
  steps_completed: number
  steps_total: number
  logs: WorkflowLog[]
  started_at: string
  completed_at?: string
  workflow: {
    name: string
    description: string
    template_type: string
    config: {
      steps: any[]
    }
  }
}

interface WorkflowRunDetailProps {
  runId: string
  isOpen: boolean
  onClose: () => void
  onApprove?: () => void
  onReject?: () => void
}

export function WorkflowRunDetail({ runId, isOpen, onClose, onApprove, onReject }: WorkflowRunDetailProps) {
  const [workflowRun, setWorkflowRun] = useState<WorkflowRun | null>(null)
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    if (isOpen && runId) {
      loadWorkflowRun()
      // Set up real-time updates
      const interval = setInterval(loadWorkflowRun, 3000)
      return () => clearInterval(interval)
    }
  }, [isOpen, runId])

  const loadWorkflowRun = async () => {
    setLoading(true)
    try {
      // Mock API call - replace with real API
      const mockWorkflowRun: WorkflowRun = {
        id: runId,
        workflow_id: 'wf-1',
        project_id: 'proj-1',
        status: 'waiting_approval',
        current_step: 'Wait for Owner Approval',
        steps_completed: 2,
        steps_total: 8,
        started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        logs: [
          {
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            level: 'info',
            message: 'Workflow started by manual trigger',
            step: 'initialization'
          },
          {
            timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
            level: 'info',
            message: 'Starting step: Research & Analyze',
            step: 'Research & Analyze'
          },
          {
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            level: 'info',
            message: 'Action completed: Research & Analyze',
            step: 'Research & Analyze'
          },
          {
            timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
            level: 'info',
            message: 'Starting step: Generate Master Plan',
            step: 'Generate Master Plan'
          },
          {
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            level: 'info',
            message: 'Action completed: Generate Master Plan',
            step: 'Generate Master Plan'
          },
          {
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            level: 'info',
            message: 'Waiting for approval: Master plan is ready for your review. Approve to proceed with task breakdown?',
            step: 'Wait for Owner Approval'
          }
        ],
        workflow: {
          name: 'Idea to MVP',
          description: 'Complete pipeline from idea submission to deployed MVP',
          template_type: 'idea_to_mvp',
          config: {
            steps: [
              { order: 1, name: 'Research & Analyze', description: 'Investigate market and competitors', type: 'action', icon: '🔬' },
              { order: 2, name: 'Generate Master Plan', description: 'Create comprehensive project plan', type: 'action', icon: '📋' },
              { order: 3, name: 'Wait for Owner Approval', description: 'Pause for owner review', type: 'approval', icon: '⏸️' },
              { order: 4, name: 'Create Task Breakdown', description: 'Convert plan into tasks', type: 'action', icon: '📊' },
              { order: 5, name: 'Development Loop', description: 'Code and review cycle', type: 'loop', icon: '🔄' },
              { order: 6, name: 'Final Security Scan', description: 'Security audit', type: 'action', icon: '🛡️' },
              { order: 7, name: 'Deploy to Preview', description: 'Deploy to staging', type: 'action', icon: '🚀' },
              { order: 8, name: 'Notify Owner', description: 'Send completion notification', type: 'action', icon: '🔔' }
            ]
          }
        }
      }

      setWorkflowRun(mockWorkflowRun)

      // Transform steps with status
      const processedSteps: WorkflowStep[] = mockWorkflowRun.workflow.config.steps.map((step, index) => {
        let status: 'completed' | 'running' | 'waiting' | 'failed' | 'pending' = 'pending'
        
        if (index < mockWorkflowRun.steps_completed) {
          status = 'completed'
        } else if (step.name === mockWorkflowRun.current_step) {
          if (mockWorkflowRun.status === 'waiting_approval') {
            status = 'waiting'
          } else {
            status = 'running'
          }
        }

        return {
          ...step,
          status,
          duration: status === 'completed' ? Math.floor(Math.random() * 300) + 30 : undefined, // Mock duration
          logs: mockWorkflowRun.logs.filter(log => log.step === step.name)
        }
      })

      setSteps(processedSteps)

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load workflow run:', error);
      }
    } finally {
      setLoading(false)
    }
  }

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case 'waiting':
        return <Pause className="h-5 w-5 text-amber-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500 bg-green-50'
      case 'running': return 'border-blue-500 bg-blue-50'
      case 'waiting': return 'border-amber-500 bg-amber-50'
      case 'failed': return 'border-red-500 bg-red-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const hours = Math.floor(diffInMinutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getTotalDuration = () => {
    if (!workflowRun?.started_at) return null
    
    const startTime = new Date(workflowRun.started_at)
    const endTime = workflowRun.completed_at ? new Date(workflowRun.completed_at) : new Date()
    const durationMs = endTime.getTime() - startTime.getTime()
    
    return Math.floor(durationMs / 1000)
  }

  const getProgressPercentage = () => {
    if (!workflowRun) return 0
    return Math.round((workflowRun.steps_completed / workflowRun.steps_total) * 100)
  }

  const handleApproval = async (action: 'approve' | 'reject') => {
    setApprovalAction(action)
    try {
      if (action === 'approve') {
        onApprove?.()
      } else {
        onReject?.()
      }
      // Refresh data
      await loadWorkflowRun()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Failed to ${action} workflow:`, error);
      }
    } finally {
      setApprovalAction(null)
    }
  }

  if (loading || !workflowRun) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const currentStep = steps.find(s => s.name === workflowRun.current_step)
  const isWaitingApproval = workflowRun.status === 'waiting_approval' && currentStep?.type === 'approval'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>{workflowRun.workflow.name} - Run Details</span>
            <Badge variant={workflowRun.status === 'completed' ? 'default' : 'secondary'}>
              {workflowRun.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Started {formatTimeAgo(workflowRun.started_at)} • {getProgressPercentage()}% complete
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Progress Overview</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {workflowRun.steps_completed}/{workflowRun.steps_total} steps
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={getProgressPercentage()} className="mb-3" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Started: {new Date(workflowRun.started_at).toLocaleString()}</span>
                </div>
                {getTotalDuration() && (
                  <div className="flex items-center space-x-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span>Duration: {formatDuration(getTotalDuration()!)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Approval Section */}
          {isWaitingApproval && (
            <Card className="border-amber-500 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Approval Required</span>
                </CardTitle>
                <CardDescription className="text-amber-700">
                  {currentStep?.description || 'This workflow step requires your approval to continue.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Button 
                    onClick={() => handleApproval('approve')}
                    disabled={approvalAction === 'approve'}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {approvalAction === 'approve' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    ✅ Approve & Continue
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleApproval('reject')}
                    disabled={approvalAction === 'reject'}
                  >
                    {approvalAction === 'reject' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    ❌ Reject & Stop
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Steps List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workflow Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div 
                      key={step.order}
                      className={`border rounded-lg p-4 transition-all ${getStepStatusColor(step.status)} ${
                        step.status === 'running' ? 'animate-pulse' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="mt-0.5">
                            {getStepIcon(step)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">
                                {step.icon} Step {step.order}: {step.name}
                              </h4>
                              {step.duration && (
                                <Badge variant="outline" className="text-xs">
                                  {formatDuration(step.duration)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {step.description}
                            </p>
                            
                            {/* Step Logs */}
                            {step.logs && step.logs.length > 0 && (
                              <div className="mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedStep(
                                    expandedStep === step.name ? null : step.name
                                  )}
                                  className="text-xs p-0 h-auto"
                                >
                                  {expandedStep === step.name ? (
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 mr-1" />
                                  )}
                                  {step.logs.length} log{step.logs.length !== 1 ? 's' : ''}
                                </Button>
                                
                                {expandedStep === step.name && (
                                  <div className="mt-2 space-y-1">
                                    {step.logs.map((log, logIndex) => (
                                      <div 
                                        key={logIndex} 
                                        className="text-xs p-2 rounded bg-white/50 border"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className={`font-medium ${
                                            log.level === 'error' ? 'text-red-600' : 
                                            log.level === 'warning' ? 'text-amber-600' : 
                                            'text-green-600'
                                          }`}>
                                            {log.level.toUpperCase()}
                                          </span>
                                          <span className="text-muted-foreground">
                                            {formatTimeAgo(log.timestamp)}
                                          </span>
                                        </div>
                                        <p className="mt-1">{log.message}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}