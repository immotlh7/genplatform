"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  AlertTriangle,
  Flag,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  MoreHorizontal,
  Zap,
  Star,
  Target
} from 'lucide-react'

export type ProjectPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface PriorityConfig {
  level: ProjectPriority
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
  urgencyScore: number
  recommendedActions: string[]
}

export const PRIORITY_CONFIG: Record<ProjectPriority, PriorityConfig> = {
  HIGH: {
    level: 'HIGH',
    label: 'High Priority',
    description: 'Critical project requiring immediate attention and resources',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: <AlertTriangle className="h-4 w-4" />,
    urgencyScore: 100,
    recommendedActions: [
      'Daily progress reviews',
      'Priority resource allocation', 
      'Regular stakeholder updates',
      'Risk monitoring'
    ]
  },
  MEDIUM: {
    level: 'MEDIUM',
    label: 'Medium Priority',
    description: 'Important project with moderate timeline requirements',
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: <Flag className="h-4 w-4" />,
    urgencyScore: 50,
    recommendedActions: [
      'Weekly progress reviews',
      'Balanced resource allocation',
      'Monthly stakeholder updates',
      'Standard monitoring'
    ]
  },
  LOW: {
    level: 'LOW',
    label: 'Low Priority',
    description: 'Future-focused project with flexible timeline',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: <Minus className="h-4 w-4" />,
    urgencyScore: 25,
    recommendedActions: [
      'Monthly progress reviews',
      'Minimal resource allocation',
      'Quarterly updates',
      'Basic monitoring'
    ]
  }
}

interface ProjectPriorityBadgeProps {
  priority: ProjectPriority
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showLabel?: boolean
  interactive?: boolean
  onPriorityChange?: (priority: ProjectPriority) => void
  className?: string
}

export function ProjectPriorityBadge({ 
  priority, 
  size = 'md',
  showIcon = true,
  showLabel = true,
  interactive = false,
  onPriorityChange,
  className = ""
}: ProjectPriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority]
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5', 
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  if (interactive && onPriorityChange) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`${config.color} ${config.bgColor} ${config.borderColor} ${sizeClasses[size]} hover:opacity-80 ${className}`}
          >
            {showIcon && (
              <span className={`${iconSizes[size]} mr-1`}>
                {config.icon}
              </span>
            )}
            {showLabel && config.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Change Priority</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.values(PRIORITY_CONFIG).map((priorityConfig) => (
            <DropdownMenuItem
              key={priorityConfig.level}
              onClick={() => onPriorityChange(priorityConfig.level)}
              className="flex items-center space-x-2"
            >
              <span className={priorityConfig.color}>
                {priorityConfig.icon}
              </span>
              <span>{priorityConfig.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge
            variant="outline"
            className={`${config.color} ${config.bgColor} ${config.borderColor} ${sizeClasses[size]} ${className}`}
          >
            {showIcon && (
              <span className={`${iconSizes[size]} ${showLabel ? 'mr-1' : ''}`}>
                {config.icon}
              </span>
            )}
            {showLabel && config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <div className="font-semibold">{config.label}</div>
            <div className="text-xs text-muted-foreground">{config.description}</div>
            <div className="text-xs mt-1">Urgency Score: {config.urgencyScore}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface PrioritySelectProps {
  value: ProjectPriority
  onValueChange: (priority: ProjectPriority) => void
  disabled?: boolean
  className?: string
}

export function PrioritySelect({ value, onValueChange, disabled = false, className = "" }: PrioritySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue>
          <div className="flex items-center space-x-2">
            <span className={PRIORITY_CONFIG[value].color}>
              {PRIORITY_CONFIG[value].icon}
            </span>
            <span>{PRIORITY_CONFIG[value].label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.values(PRIORITY_CONFIG).map((config) => (
          <SelectItem key={config.level} value={config.level}>
            <div className="flex items-center space-x-3">
              <span className={config.color}>
                {config.icon}
              </span>
              <div>
                <div className="font-medium">{config.label}</div>
                <div className="text-xs text-muted-foreground">{config.description}</div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface PriorityDistributionProps {
  projects: Array<{ priority: ProjectPriority; name: string }>
  className?: string
}

export function PriorityDistribution({ projects, className = "" }: PriorityDistributionProps) {
  const distribution = projects.reduce((acc, project) => {
    acc[project.priority] = (acc[project.priority] || 0) + 1
    return acc
  }, {} as Record<ProjectPriority, number>)

  const total = projects.length
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <TrendingUp className="h-4 w-4" />
          <span>Priority Distribution</span>
        </CardTitle>
        <CardDescription>
          Project breakdown by priority level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.values(PRIORITY_CONFIG).map((config) => {
            const count = distribution[config.level] || 0
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0
            
            return (
              <div key={config.level} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={config.color}>
                    {config.icon}
                  </span>
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-muted-foreground">
                    {count} project{count !== 1 ? 's' : ''}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {percentage}%
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
        
        {total === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No projects to analyze</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface PriorityRecommendationsProps {
  priority: ProjectPriority
  className?: string
}

export function PriorityRecommendations({ priority, className = "" }: PriorityRecommendationsProps) {
  const config = PRIORITY_CONFIG[priority]
  
  return (
    <Card className={`${config.bgColor} ${config.borderColor} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-base flex items-center space-x-2 ${config.color}`}>
          {config.icon}
          <span>{config.label} Recommendations</span>
        </CardTitle>
        <CardDescription>
          Best practices for {config.label.toLowerCase()} projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {config.recommendedActions.map((action, index) => (
            <div key={index} className="flex items-center space-x-2">
              <CheckCircle className={`h-3 w-3 ${config.color} flex-shrink-0`} />
              <span className="text-sm">{action}</span>
            </div>
          ))}
        </div>
        
        <div className={`mt-4 p-3 rounded-lg border ${config.borderColor} bg-white/50 dark:bg-black/20`}>
          <div className="flex items-center space-x-2 mb-1">
            <Zap className={`h-3 w-3 ${config.color}`} />
            <span className="text-xs font-medium">Urgency Score</span>
          </div>
          <div className="text-2xl font-bold">{config.urgencyScore}</div>
          <div className="text-xs text-muted-foreground">
            {config.urgencyScore >= 75 ? 'Immediate action required' :
             config.urgencyScore >= 50 ? 'Moderate attention needed' :
             'Standard monitoring sufficient'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface PriorityActionsProps {
  currentPriority: ProjectPriority
  onPriorityChange: (priority: ProjectPriority) => void
  canEdit?: boolean
  className?: string
}

export function PriorityActions({ 
  currentPriority, 
  onPriorityChange, 
  canEdit = true,
  className = "" 
}: PriorityActionsProps) {
  const priorities: ProjectPriority[] = ['HIGH', 'MEDIUM', 'LOW']
  const currentIndex = priorities.indexOf(currentPriority)
  
  const canIncrease = currentIndex > 0
  const canDecrease = currentIndex < priorities.length - 1
  
  const increasePriority = () => {
    if (canIncrease) {
      onPriorityChange(priorities[currentIndex - 1])
    }
  }
  
  const decreasePriority = () => {
    if (canDecrease) {
      onPriorityChange(priorities[currentIndex + 1])
    }
  }
  
  if (!canEdit) {
    return (
      <div className={className}>
        <ProjectPriorityBadge priority={currentPriority} />
      </div>
    )
  }
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={increasePriority}
              disabled={!canIncrease}
              className="h-8 w-8 p-0"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Increase Priority</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <ProjectPriorityBadge 
        priority={currentPriority}
        interactive={true}
        onPriorityChange={onPriorityChange}
      />
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={decreasePriority}
              disabled={!canDecrease}
              className="h-8 w-8 p-0"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Decrease Priority</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

// Utility functions
export function sortProjectsByPriority<T extends { priority: ProjectPriority }>(projects: T[]): T[] {
  return [...projects].sort((a, b) => 
    PRIORITY_CONFIG[b.priority].urgencyScore - PRIORITY_CONFIG[a.priority].urgencyScore
  )
}

export function getHighPriorityProjects<T extends { priority: ProjectPriority }>(projects: T[]): T[] {
  return projects.filter(project => project.priority === 'HIGH')
}

export function getPriorityColor(priority: ProjectPriority): string {
  return PRIORITY_CONFIG[priority].color
}

export function getPriorityIcon(priority: ProjectPriority): React.ReactNode {
  return PRIORITY_CONFIG[priority].icon
}

export function calculatePriorityMetrics(projects: Array<{ priority: ProjectPriority; status: string }>) {
  const total = projects.length
  const highPriority = projects.filter(p => p.priority === 'HIGH')
  const completedHighPriority = highPriority.filter(p => p.status === 'completed')
  
  return {
    total,
    highPriorityCount: highPriority.length,
    highPriorityPercentage: total > 0 ? Math.round((highPriority.length / total) * 100) : 0,
    completedHighPriorityPercentage: highPriority.length > 0 
      ? Math.round((completedHighPriority.length / highPriority.length) * 100) 
      : 0,
    averageUrgencyScore: total > 0 
      ? Math.round(projects.reduce((sum, p) => sum + PRIORITY_CONFIG[p.priority].urgencyScore, 0) / total)
      : 0
  }
}