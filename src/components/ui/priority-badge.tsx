"use client"

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Circle, ArrowUp } from 'lucide-react'

interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export function PriorityBadge({ priority, size = 'md', showIcon = false, className }: PriorityBadgeProps) {
  const priorityConfig = {
    high: {
      icon: AlertTriangle,
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-500',
      borderColor: 'border-red-500/30',
      label: 'High Priority'
    },
    medium: {
      icon: Circle,
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-500',
      borderColor: 'border-yellow-500/30',
      label: 'Medium Priority'
    },
    low: {
      icon: ArrowUp,
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-500',
      borderColor: 'border-green-500/30',
      label: 'Low Priority'
    }
  }

  const config = priorityConfig[priority]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        config.bgColor,
        config.textColor,
        'border',
        config.borderColor,
        'uppercase font-medium',
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(iconSizes[size], 'mr-1')} />
      )}
      {priority}
    </Badge>
  )
}

export function PriorityIndicator({ priority, className }: { priority: 'high' | 'medium' | 'low', className?: string }) {
  const config = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  }

  return (
    <div className={cn('w-2 h-2 rounded-full', config[priority], className)} />
  )
}