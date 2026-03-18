"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Play,
  Settings,
  BarChart3,
  MoreHorizontal,
  Clock,
  Lightbulb,
  Bug,
  Wrench,
  Rocket,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity
} from 'lucide-react'

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
  onToggle: (id: string, isActive: boolean) => void
  onRun: (id: string) => void
  onConfigure?: (id: string) => void
  onViewRuns?: (id: string) => void
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
      case 'idea_to_mvp': return <Lightbulb className="h-5 w-5 text-purple-600" />
      case 'bug_fix': return <Bug className="h-5 w-5 text-red-600" />
      case 'new_feature': return <Wrench className="h-5 w-5 text-blue-600" />
      case 'deploy_pipeline': return <Rocket className="h-5 w-5 text-green-600" />
      case 'nightly_maintenance': return <Shield className="h-5 w-5 text-amber-600" />
      default: return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getTriggerBadge = (triggerType: string) => {
    const configs = {
      manual: { label: 'Manual', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      new_idea: { label: 'New Idea', className: 'bg-purple-50 text-purple-700 border-purple-200' },
      task_complete: { label: 'Task Complete', className: 'bg-green-50 text-green-700 border-green-200' },
      schedule: { label: 'Scheduled', className: 'bg-amber-50 text-amber-700 border-amber-200' }
    }
    
    const config = configs[triggerType as keyof typeof configs] || configs.manual
    return (
      <Badge variant="outline" className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    )
  }

  const getLastRunStatus = () => {
    if (!workflow.last_run_at) {
      return {
        text: 'Never run',
        icon: <Clock className="h-3 w-3 text-gray-500" />,
        className: 'text-gray-500'
      }
    }

    const timeAgo = formatTimeAgo(workflow.last_run_at)
    
    switch (workflow.last_run_status) {
      case 'completed':
        return {
          text: `Last run: ${timeAgo} ✅`,
          icon: <CheckCircle className="h-3 w-3 text-green-600" />,
          className: 'text-green-600'
        }
      case 'failed':
        return {
          text: `Failed: ${timeAgo} ❌`,
          icon: <XCircle className="h-3 w-3 text-red-600" />,
          className: 'text-red-600'
        }
      case 'waiting_approval':
        return {
          text: `Waiting approval: ${timeAgo} ⏳`,
          icon: <AlertTriangle className="h-3 w-3 text-amber-600" />,
          className: 'text-amber-600'
        }
      case 'running':
        return {
          text: `Running: ${timeAgo} 🔄`,
          icon: <Activity className="h-3 w-3 text-blue-600 animate-pulse" />,
          className: 'text-blue-600'
        }
      default:
        return {
          text: `Last run: ${timeAgo}`,
          icon: <Clock className="h-3 w-3 text-gray-500" />,
          className: 'text-gray-500'
        }
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`
    }
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return diffInDays === 1 ? '1d ago' : `${diffInDays}d ago`
  }

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true)
    try {
      await onToggle(workflow.id, checked)
    } finally {
      setIsToggling(false)
    }
  }

  const statusInfo = getLastRunStatus()

  return (
    <Card className={`transition-all hover:shadow-md ${
      workflow.is_active 
        ? 'border-l-4 border-l-green-500 bg-green-50/30' 
        : 'border-l-4 border-l-gray-300'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getWorkflowIcon(workflow.template_type)}
            <div>
              <CardTitle className="text-base">{workflow.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                {getTriggerBadge(workflow.trigger_type)}
                {workflow.schedule && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Scheduled
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Switch
                checked={workflow.is_active}
                onCheckedChange={handleToggle}
                disabled={isToggling}
                className="data-[state=checked]:bg-green-600"
              />
              <span className="text-xs text-muted-foreground">
                {workflow.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRun(workflow.id)} disabled={!workflow.is_active}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Now
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onConfigure?.(workflow.id)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewRuns?.(workflow.id)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Runs
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <CardDescription className="text-sm">
          {workflow.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Status Line */}
          <div className={`flex items-center space-x-2 text-xs ${statusInfo.className}`}>
            {statusInfo.icon}
            <span>{statusInfo.text}</span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={() => onRun(workflow.id)}
                disabled={!workflow.is_active}
                className="h-8"
              >
                <Play className="h-3 w-3 mr-1" />
                ▶️ Run Now
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConfigure?.(workflow.id)}
                className="h-8"
              >
                <Settings className="h-3 w-3 mr-1" />
                ⚙️ Configure
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewRuns?.(workflow.id)}
              className="h-8 text-xs"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              📋 View Runs
            </Button>
          </div>

          {/* Schedule Info */}
          {workflow.trigger_type === 'schedule' && workflow.schedule && (
            <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-800">
              <Clock className="h-3 w-3 inline mr-1" />
              Next run: Daily at 2:00 AM (Africa/Casablanca)
            </div>
          )}

          {/* Trigger Info */}
          {workflow.trigger_type === 'new_idea' && (
            <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-purple-800">
              <Lightbulb className="h-3 w-3 inline mr-1" />
              Auto-triggers when new ideas are submitted
            </div>
          )}

          {workflow.trigger_type === 'task_complete' && (
            <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-800">
              <CheckCircle className="h-3 w-3 inline mr-1" />
              Auto-triggers when tasks are completed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}