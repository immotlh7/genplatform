'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Play, 
  Settings, 
  BarChart3, 
  Clock, 
  Zap,
  Calendar,
  Target,
  Activity,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Workflow {
  id: string
  name: string
  description: string
  template_type: string
  is_active: boolean
  trigger_type: 'manual' | 'new_idea' | 'task_complete' | 'schedule'
  schedule?: string
  last_run_at?: string
  last_run_status?: string
  created_at: string
}

interface WorkflowCardProps {
  workflow: Workflow
  onUpdate: () => void
}

export default function WorkflowCard({ workflow, onUpdate }: WorkflowCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  // Get workflow icon based on template type
  const getWorkflowIcon = (templateType: string) => {
    switch (templateType) {
      case 'idea_to_mvp':
        return <Target className="h-6 w-6" />
      case 'bug_fix':
        return <AlertCircle className="h-6 w-6" />
      case 'new_feature':
        return <Zap className="h-6 w-6" />
      case 'deploy_pipeline':
        return <Activity className="h-6 w-6" />
      case 'nightly_maintenance':
        return <Clock className="h-6 w-6" />
      default:
        return <Settings className="h-6 w-6" />
    }
  }

  // Get trigger type badge
  const getTriggerBadge = (triggerType: string) => {
    const badges = {
      manual: { label: 'Manual', variant: 'outline' as const, color: 'text-blue-600' },
      new_idea: { label: 'New Idea', variant: 'secondary' as const, color: 'text-purple-600' },
      task_complete: { label: 'Task Complete', variant: 'default' as const, color: 'text-green-600' },
      schedule: { label: 'Scheduled', variant: 'outline' as const, color: 'text-orange-600' }
    }
    
    const badge = badges[triggerType as keyof typeof badges] || badges.manual
    
    return (
      <Badge variant={badge.variant} className={cn('text-xs', badge.color)}>
        {badge.label}
      </Badge>
    )
  }

  // Get last run status
  const getLastRunStatus = () => {
    if (!workflow.last_run_at) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Never run</span>
        </div>
      )
    }

    const timeAgo = getTimeAgo(workflow.last_run_at)
    const status = workflow.last_run_status

    const statusConfig = {
      completed: { icon: CheckCircle, color: 'text-green-600', label: 'Completed' },
      running: { icon: Loader2, color: 'text-blue-600', label: 'Running' },
      failed: { icon: AlertCircle, color: 'text-red-600', label: 'Failed' },
      waiting_approval: { icon: Clock, color: 'text-yellow-600', label: 'Waiting Approval' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed
    const Icon = config.icon

    return (
      <div className="flex items-center gap-2 text-sm">
        <Icon className={cn('h-4 w-4', config.color)} />
        <span className="text-muted-foreground">
          Last run: {timeAgo}
        </span>
      </div>
    )
  }

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    }
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  // Handle toggle active state
  const handleToggleActive = async (checked: boolean) => {
    try {
      setIsUpdating(true)
      
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: checked })
      })

      if (!response.ok) {
        throw new Error('Failed to update workflow')
      }

      onUpdate()
    } catch (error) {
      console.error('Error updating workflow:', error)
      // TODO: Show error toast
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle run workflow
  const handleRunWorkflow = async () => {
    try {
      setIsRunning(true)
      
      const response = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workflowId: workflow.id,
          projectId: null // Will be determined by workflow logic
        })
      })

      if (!response.ok) {
        throw new Error('Failed to run workflow')
      }

      const data = await response.json()
      console.log('Workflow started:', data)
      
      onUpdate()
      // TODO: Show success toast
    } catch (error) {
      console.error('Error running workflow:', error)
      // TODO: Show error toast
    } finally {
      setIsRunning(false)
    }
  }

  // Handle configure workflow
  const handleConfigureWorkflow = () => {
    // TODO: Open configuration modal or navigate to config page
    console.log('Configure workflow:', workflow.id)
  }

  // Handle view runs
  const handleViewRuns = () => {
    // TODO: Navigate to workflow runs page
    console.log('View runs for workflow:', workflow.id)
  }

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      workflow.is_active ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              workflow.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            )}>
              {getWorkflowIcon(workflow.template_type)}
            </div>
            <div>
              <CardTitle className="text-lg">{workflow.name}</CardTitle>
              {workflow.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {workflow.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getTriggerBadge(workflow.trigger_type)}
            <Switch
              checked={workflow.is_active}
              onCheckedChange={handleToggleActive}
              disabled={isUpdating}
              className={cn(
                'data-[state=checked]:bg-green-600',
                isUpdating && 'opacity-50 cursor-not-allowed'
              )}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Status */}
          {getLastRunStatus()}

          {/* Schedule info for scheduled workflows */}
          {workflow.trigger_type === 'schedule' && workflow.schedule && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Schedule: {workflow.schedule}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleRunWorkflow}
              disabled={isRunning || !workflow.is_active}
              className="flex-1"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Now
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleConfigureWorkflow}
              disabled={isUpdating}
            >
              <Settings className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleViewRuns}
              disabled={isUpdating}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}