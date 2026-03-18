"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Play,
  Settings,
  BarChart3,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Target,
  Calendar,
  Workflow,
  Bot,
  Wrench,
  Rocket,
  Moon,
  AlertTriangle
} from 'lucide-react'

interface Workflow {
  id: string
  name: string
  description: string
  template_type: string
  is_active: boolean
  trigger_type: 'manual' | 'new_idea' | 'task_complete' | 'schedule'
  schedule?: string
  config: any
  last_run_at?: string
  last_run_status?: string
  created_at: string
}

interface WorkflowCardProps {
  workflow: Workflow
  onToggle: (id: string, active: boolean) => void
  onRun: (id: string) => void
  onConfigure: (id: string) => void
  onViewRuns: (id: string) => void
}

export function WorkflowCard({ 
  workflow, 
  onToggle, 
  onRun, 
  onConfigure, 
  onViewRuns 
}: WorkflowCardProps) {
  const [isToggling, setIsToggling] = useState(false)

  const getWorkflowIcon = (templateType: string) => {
    switch (templateType) {
      case 'idea_to_mvp': return <Target className="h-6 w-6" />
      case 'bug_fix': return <Wrench className="h-6 w-6" />
      case 'new_feature': return <Zap className="h-6 w-6" />
      case 'deploy_pipeline': return <Rocket className="h-6 w-6" />
      case 'nightly_maintenance': return <Moon className="h-6 w-6" />
      default: return <Bot className="h-6 w-6" />
    }
  }

  const getWorkflowIconColor = (templateType: string) => {
    switch (templateType) {
      case 'idea_to_mvp': return 'text-blue-600'
      case 'bug_fix': return 'text-red-600'
      case 'new_feature': return 'text-green-600'
      case 'deploy_pipeline': return 'text-purple-600'
      case 'nightly_maintenance': return 'text-indigo-600'
      default: return 'text-gray-600'
    }
  }

  const getTriggerTypeBadge = (triggerType: string) => {
    switch (triggerType) {
      case 'manual':
        return <Badge variant="outline" className="text-xs">
          <Play className="h-3 w-3 mr-1" />
          Manual
        </Badge>
      case 'new_idea':
        return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          <Target className="h-3 w-3 mr-1" />
          New Idea
        </Badge>
      case 'task_complete':
        return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Task Complete
        </Badge>
      case 'schedule':
        return <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
          <Calendar className="h-3 w-3 mr-1" />
          Scheduled
        </Badge>
      default:
        return <Badge variant="outline" className="text-xs">
          {triggerType}
        </Badge>
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status || status === 'never') {
      return <Badge variant="outline" className="text-xs">
        Never run
      </Badge>
    }

    switch (status) {
      case 'running':
        return <Badge className="text-xs bg-blue-500 text-white animate-pulse">
          <Clock className="h-3 w-3 mr-1" />
          Running
        </Badge>
      case 'completed':
        return <Badge className="text-xs bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      case 'failed':
        return <Badge className="text-xs bg-red-500 text-white">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      case 'waiting_approval':
        return <Badge className="text-xs bg-yellow-500 text-white">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Needs Approval
        </Badge>
      default:
        return <Badge variant="outline" className="text-xs">
          {status}
        </Badge>
    }
  }

  const formatLastRun = (timestamp?: string) => {
    if (!timestamp) return 'Never run'

    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Less than 1h ago'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
      onToggle(workflow.id, checked)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <Card className={`hover:shadow-md transition-all duration-200 ${
      workflow.is_active 
        ? 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20' 
        : 'border-gray-200'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-background border ${getWorkflowIconColor(workflow.template_type)}`}>
              {getWorkflowIcon(workflow.template_type)}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{workflow.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {workflow.description}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRun(workflow.id)}>
                <Play className="h-4 w-4 mr-2" />
                Run Now
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onConfigure(workflow.id)}>
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewRuns(workflow.id)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Runs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trigger Type and Status */}
        <div className="flex items-center justify-between">
          {getTriggerTypeBadge(workflow.trigger_type)}
          {getStatusBadge(workflow.last_run_status)}
        </div>

        {/* Schedule info for scheduled workflows */}
        {workflow.trigger_type === 'schedule' && workflow.schedule && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Schedule: {workflow.schedule}</span>
          </div>
        )}

        {/* Last Run Info */}
        <div className="text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last run:</span>
            <span className="font-medium">
              {formatLastRun(workflow.last_run_at)}
              {workflow.last_run_status === 'completed' && (
                <CheckCircle className="h-3 w-3 inline ml-1 text-green-600" />
              )}
            </span>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Switch
              id={`active-${workflow.id}`}
              checked={workflow.is_active}
              onCheckedChange={handleToggle}
              disabled={isToggling}
            />
            <label 
              htmlFor={`active-${workflow.id}`} 
              className="text-sm font-medium cursor-pointer"
            >
              {workflow.is_active ? 'Active' : 'Inactive'}
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-1">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onRun(workflow.id)}
              disabled={isToggling}
            >
              <Play className="h-3 w-3 mr-1" />
              Run Now
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onConfigure(workflow.id)}
            >
              <Settings className="h-3 w-3 mr-1" />
              Configure
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onViewRuns(workflow.id)}
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              View Runs
            </Button>
          </div>
        </div>

        {/* Status indicator at bottom */}
        {workflow.is_active && (
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-green-700 dark:text-green-400 font-medium">
              Workflow is active and monitoring for triggers
            </span>
          </div>
        )}

        {!workflow.is_active && (
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Workflow is inactive
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}