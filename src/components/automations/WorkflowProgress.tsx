'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Play,
  Pause,
  X,
  ChevronRight,
  Loader2,
  Activity,
  Timer,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowStep {
  id: string
  name: string
  description?: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting' | 'paused'
  started_at?: string
  completed_at?: string
  duration?: number
  logs?: Array<{
    timestamp: string
    level: string
    message: string
  }>
  error_message?: string
}

interface WorkflowRun {
  id: string
  workflow_id: string
  status: 'running' | 'completed' | 'failed' | 'waiting_approval' | 'paused'
  current_step: string
  steps_completed: number
  steps_total: number
  started_at: string
  completed_at?: string
  logs?: Array<any>
  steps?: WorkflowStep[]
}

interface WorkflowProgressProps {
  workflowRun: WorkflowRun
  onRefresh?: () => void
  showLogs?: boolean
  compact?: boolean
}

export default function WorkflowProgress({ 
  workflowRun, 
  onRefresh,
  showLogs = false,
  compact = false 
}: WorkflowProgressProps) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  const [animationPhase, setAnimationPhase] = useState(0)

  // Animation for step transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 3)
    }, 1500)
    
    return () => clearInterval(interval)
  }, [])

  const getStepIcon = (step: WorkflowStep, index: number) => {
    const isCurrentStep = step.name === workflowRun.current_step || 
                         index === workflowRun.steps_completed

    switch (step.status) {
      case 'completed':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white">
            <CheckCircle className="w-5 h-5" />
          </div>
        )
      
      case 'running':
        return (
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white",
            "animate-pulse"
          )}>
            <Activity className="w-5 h-5 animate-spin" />
          </div>
        )
      
      case 'waiting':
        return (
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white",
            animationPhase === 0 && "animate-bounce"
          )}>
            <Pause className="w-5 h-5" />
          </div>
        )
      
      case 'failed':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white">
            <X className="w-5 h-5" />
          </div>
        )
      
      case 'paused':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-500 text-white">
            <Pause className="w-5 h-5" />
          </div>
        )
      
      default: // pending
        if (isCurrentStep && workflowRun.status === 'running') {
          return (
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 border-blue-500",
              "bg-blue-50 text-blue-600",
              animationPhase === 1 && "scale-110 transition-transform duration-300"
            )}>
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )
        }
        
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 bg-gray-100 text-gray-400">
            <span className="text-sm font-medium">{index + 1}</span>
          </div>
        )
    }
  }

  const getStepDuration = (step: WorkflowStep) => {
    if (step.duration) {
      return formatDuration(step.duration)
    }
    
    if (step.started_at && step.completed_at) {
      const duration = new Date(step.completed_at).getTime() - new Date(step.started_at).getTime()
      return formatDuration(duration)
    }
    
    if (step.started_at && step.status === 'running') {
      const duration = Date.now() - new Date(step.started_at).getTime()
      return formatDuration(duration)
    }
    
    return null
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${seconds}s`
  }

  const getOverallProgress = () => {
    if (workflowRun.steps_total === 0) return 0
    return Math.round((workflowRun.steps_completed / workflowRun.steps_total) * 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'running': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      case 'waiting_approval': return 'bg-amber-500'
      case 'paused': return 'bg-gray-500'
      default: return 'bg-gray-300'
    }
  }

  // Generate mock steps if not provided
  const steps: WorkflowStep[] = workflowRun.steps || generateMockSteps()

  function generateMockSteps(): WorkflowStep[] {
    const totalSteps = workflowRun.steps_total || 8
    const completedSteps = workflowRun.steps_completed || 0
    
    const stepNames = [
      'Initialize Workflow',
      'Validate Input',
      'Research & Analysis',
      'Generate Plan',
      'Wait for Approval',
      'Create Tasks',
      'Execute Code',
      'Deploy & Notify'
    ]

    return Array.from({ length: totalSteps }, (_, index) => {
      let status: WorkflowStep['status'] = 'pending'
      
      if (index < completedSteps) {
        status = 'completed'
      } else if (index === completedSteps && workflowRun.status === 'running') {
        status = 'running'
      } else if (index === completedSteps && workflowRun.status === 'waiting_approval') {
        status = 'waiting'
      } else if (index === completedSteps && workflowRun.status === 'failed') {
        status = 'failed'
      }

      return {
        id: `step-${index}`,
        name: stepNames[index] || `Step ${index + 1}`,
        status,
        started_at: index < completedSteps ? new Date(Date.now() - (totalSteps - index) * 120000).toISOString() : undefined,
        completed_at: index < completedSteps ? new Date(Date.now() - (totalSteps - index - 1) * 120000).toISOString() : undefined
      }
    })
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">
              {workflowRun.steps_completed}/{workflowRun.steps_total} steps ({getOverallProgress()}%)
            </span>
          </div>
          <Progress value={getOverallProgress()} className="h-2" />
        </div>

        {/* Current step */}
        <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
          {steps[workflowRun.steps_completed] && (
            <>
              {getStepIcon(steps[workflowRun.steps_completed], workflowRun.steps_completed)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {steps[workflowRun.steps_completed].name}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {steps[workflowRun.steps_completed].status}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Workflow Progress</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className={cn('text-white', getStatusColor(workflowRun.status))}
            >
              {workflowRun.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <Loader2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {workflowRun.steps_completed}/{workflowRun.steps_total} steps ({getOverallProgress()}%)
            </span>
          </div>
          <Progress 
            value={getOverallProgress()} 
            className={cn(
              "h-3 transition-all duration-500",
              workflowRun.status === 'running' && "animate-pulse"
            )}
          />
        </div>

        {/* Steps Timeline */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center space-x-2">
            <Timer className="h-4 w-4" />
            <span>Step Timeline</span>
          </h4>
          
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-start space-x-4 p-3 rounded-lg transition-all duration-300",
                  step.status === 'running' && "bg-blue-50 border border-blue-200",
                  step.status === 'completed' && "bg-green-50",
                  step.status === 'failed' && "bg-red-50 border border-red-200",
                  step.status === 'waiting' && "bg-amber-50 border border-amber-200",
                  step.status === 'pending' && "bg-gray-50",
                  selectedStep === step.id && "ring-2 ring-blue-500/20",
                  "hover:shadow-sm cursor-pointer"
                )}
                onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
              >
                {/* Step Icon */}
                <div className="flex-shrink-0">
                  {getStepIcon(step, index)}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {step.name}
                        {step.status === 'running' && (
                          <span className="ml-2 inline-flex items-center">
                            <Zap className="h-3 w-3 text-blue-500 animate-pulse" />
                          </span>
                        )}
                      </div>
                      {step.description && (
                        <div className="text-xs text-muted-foreground">
                          {step.description}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      {getStepDuration(step) && (
                        <span className="flex items-center space-x-1">
                          <Timer className="h-3 w-3" />
                          <span>{getStepDuration(step)}</span>
                        </span>
                      )}
                      {selectedStep !== step.id && step.logs && (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </div>
                  </div>

                  {/* Error Message */}
                  {step.status === 'failed' && step.error_message && (
                    <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded border border-red-200">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      {step.error_message}
                    </div>
                  )}

                  {/* Expanded Logs */}
                  {selectedStep === step.id && step.logs && showLogs && (
                    <div className="mt-3 space-y-2 border-t pt-3">
                      <div className="text-xs font-medium text-muted-foreground">Execution Logs</div>
                      <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                        {step.logs.map((log, logIndex) => (
                          <div key={logIndex} className="flex space-x-2">
                            <span className="text-gray-400">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className={cn(
                              log.level === 'error' && 'text-red-400',
                              log.level === 'warn' && 'text-yellow-400',
                              log.level === 'info' && 'text-blue-400',
                              log.level === 'success' && 'text-green-400'
                            )}>
                              [{log.level.toUpperCase()}]
                            </span>
                            <span>{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Runtime Info */}
        <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
          <div>Started: {new Date(workflowRun.started_at).toLocaleString()}</div>
          {workflowRun.completed_at && (
            <div>Completed: {new Date(workflowRun.completed_at).toLocaleString()}</div>
          )}
          <div>Run ID: {workflowRun.id}</div>
        </div>
      </CardContent>
    </Card>
  )
}