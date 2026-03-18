"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  ExternalLink,
  RefreshCw,
  Send,
  Lightbulb,
  Target,
  Clock,
  Zap,
  Languages,
  Archive,
  Bell,
  BellOff
} from 'lucide-react'

interface ChatNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'commander' | 'system'
  title: string
  message: string
  timestamp: string
  duration?: number // Auto-dismiss after milliseconds
  persistent?: boolean // Don't auto-dismiss
  actions?: NotificationAction[]
  metadata?: {
    projectId?: string
    taskId?: string
    ideaId?: string
    commandText?: string
  }
}

interface NotificationAction {
  id: string
  label: string
  variant?: 'default' | 'outline' | 'ghost'
  icon?: React.ReactNode
  onClick: () => void
}

interface ChatNotificationsProps {
  notifications: ChatNotification[]
  onDismiss: (id: string) => void
  onActionClick?: (notificationId: string, actionId: string) => void
  className?: string
  position?: 'top' | 'bottom'
  maxVisible?: number
}

export function ChatNotifications({ 
  notifications, 
  onDismiss,
  onActionClick,
  className = "",
  position = 'top',
  maxVisible = 3
}: ChatNotificationsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Auto-dismiss notifications with duration
    const timers: NodeJS.Timeout[] = []
    
    notifications.forEach(notification => {
      if (notification.duration && !notification.persistent && !dismissedIds.has(notification.id)) {
        const timer = setTimeout(() => {
          handleDismiss(notification.id)
        }, notification.duration)
        timers.push(timer)
      }
    })

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [notifications, dismissedIds])

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
    onDismiss(id)
  }

  const handleActionClick = (notificationId: string, actionId: string) => {
    const notification = notifications.find(n => n.id === notificationId)
    const action = notification?.actions?.find(a => a.id === actionId)
    
    if (action?.onClick) {
      action.onClick()
    }
    
    onActionClick?.(notificationId, actionId)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'info': return <Info className="h-4 w-4 text-blue-600" />
      case 'commander': return <Languages className="h-4 w-4 text-orange-600" />
      case 'system': return <Zap className="h-4 w-4 text-purple-600" />
      default: return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'success': 
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
      case 'error': 
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
      case 'warning': 
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20'
      case 'info': 
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20'
      case 'commander': 
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20'
      case 'system': 
        return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20'
      default: 
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'success': return 'Success'
      case 'error': return 'Error'
      case 'warning': return 'Warning'
      case 'info': return 'Info'
      case 'commander': return 'Commander'
      case 'system': return 'System'
      default: return 'Notification'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    return `${Math.floor(diffInSeconds / 3600)}h ago`
  }

  // Filter out dismissed notifications and limit visible count
  const visibleNotifications = notifications
    .filter(notification => !dismissedIds.has(notification.id))
    .slice(0, maxVisible)

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {visibleNotifications.map((notification, index) => (
        <Card 
          key={notification.id}
          className={`border ${getNotificationStyle(notification.type)} transition-all duration-300 animate-in slide-in-from-top-2`}
          style={{
            animationDelay: `${index * 100}ms`,
            animationFillMode: 'backwards'
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium">{notification.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(notification.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(notification.timestamp)}
                    </span>
                    {!notification.persistent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(notification.id)}
                        className="h-6 w-6 p-0 hover:bg-black/5"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                  {notification.message}
                </p>

                {/* Actions */}
                {notification.actions && notification.actions.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {notification.actions.map((action) => (
                      <Button
                        key={action.id}
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={() => handleActionClick(notification.id, action.id)}
                        className="text-xs h-7"
                      >
                        {action.icon && <span className="mr-1">{action.icon}</span>}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                {notification.metadata && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {notification.metadata.projectId && (
                      <div className="flex items-center space-x-1">
                        <Target className="h-3 w-3" />
                        <span>Project: {notification.metadata.projectId}</span>
                      </div>
                    )}
                    {notification.metadata.commandText && (
                      <div className="flex items-center space-x-1">
                        <Languages className="h-3 w-3" />
                        <span>Command: "{notification.metadata.commandText}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Hook for managing chat notifications
export function useChatNotifications() {
  const [notifications, setNotifications] = useState<ChatNotification[]>([])

  const addNotification = (notification: Omit<ChatNotification, 'id' | 'timestamp'>) => {
    const newNotification: ChatNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      duration: notification.duration || 5000 // Default 5 seconds
    }

    setNotifications(prev => [newNotification, ...prev])
    return newNotification.id
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  // Predefined notification creators
  const showSuccess = (title: string, message: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'success',
      title,
      message,
      actions,
      duration: 4000
    })
  }

  const showError = (title: string, message: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'error',
      title,
      message,
      actions,
      persistent: true // Errors don't auto-dismiss
    })
  }

  const showWarning = (title: string, message: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      actions,
      duration: 6000
    })
  }

  const showInfo = (title: string, message: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'info',
      title,
      message,
      actions,
      duration: 5000
    })
  }

  const showCommanderSuccess = (originalText: string, translatedText: string, projectId?: string) => {
    return addNotification({
      type: 'commander',
      title: 'Command Translated',
      message: `"${originalText}" → "${translatedText}"`,
      metadata: {
        commandText: originalText,
        projectId
      },
      actions: [
        {
          id: 'send-to-project',
          label: 'Send to Project',
          icon: <Send className="h-3 w-3" />,
          onClick: () => console.log('Send to project clicked')
        },
        {
          id: 'save-as-idea',
          label: 'Save as Idea',
          icon: <Lightbulb className="h-3 w-3" />,
          variant: 'outline',
          onClick: () => console.log('Save as idea clicked')
        }
      ],
      duration: 8000
    })
  }

  const showTaskCreated = (taskTitle: string, projectName: string, taskId: string) => {
    return addNotification({
      type: 'success',
      title: 'Task Created',
      message: `"${taskTitle}" added to ${projectName}`,
      metadata: {
        taskId,
        projectId: projectName
      },
      actions: [
        {
          id: 'view-task',
          label: 'View Task',
          icon: <ExternalLink className="h-3 w-3" />,
          onClick: () => console.log('View task clicked', taskId)
        }
      ],
      duration: 6000
    })
  }

  const showIdeaSaved = (ideaTitle: string, ideaId: string) => {
    return addNotification({
      type: 'success',
      title: 'Idea Saved',
      message: `"${ideaTitle}" captured successfully`,
      metadata: {
        ideaId
      },
      actions: [
        {
          id: 'view-idea',
          label: 'View Ideas',
          icon: <Lightbulb className="h-3 w-3" />,
          onClick: () => console.log('View idea clicked', ideaId)
        }
      ],
      duration: 5000
    })
  }

  const showSystemUpdate = (message: string) => {
    return addNotification({
      type: 'system',
      title: 'System Update',
      message,
      duration: 3000
    })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showCommanderSuccess,
    showTaskCreated,
    showIdeaSaved,
    showSystemUpdate
  }
}