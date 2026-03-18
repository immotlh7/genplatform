"use client"

import { useState, useEffect, createContext, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Settings
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
  read: boolean
  actions?: Array<{
    label: string
    action: () => void
    variant?: 'default' | 'destructive'
  }>
  persistent?: boolean
  source?: string
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Load initial notifications
  useEffect(() => {
    // In production, load from localStorage or API
    const stored = localStorage.getItem('genplatform-notifications')
    if (stored) {
      try {
        setNotifications(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to load notifications:', error)
      }
    }

    // Add some demo notifications
    const demoNotifications: Notification[] = [
      {
        id: 'demo-1',
        title: 'System Updated',
        message: 'GenPlatform.ai has been updated to version 2.1.0 with new features and improvements.',
        type: 'success',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        read: false,
        source: 'System',
        actions: [
          { label: 'View Changes', action: () => console.log('View changes') },
          { label: 'Dismiss', action: () => removeNotification('demo-1') }
        ]
      },
      {
        id: 'demo-2',
        title: 'High CPU Usage Detected',
        message: 'CPU usage has been above 85% for the past 10 minutes. Consider checking running processes.',
        type: 'warning',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        read: false,
        source: 'System Monitor',
        persistent: true,
        actions: [
          { label: 'View Details', action: () => console.log('View CPU details') },
          { label: 'Acknowledge', action: () => markAsRead('demo-2') }
        ]
      },
      {
        id: 'demo-3',
        title: 'Skill Update Available',
        message: 'Weather skill has an update available with improved accuracy.',
        type: 'info',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: true,
        source: 'Skills Manager'
      },
      {
        id: 'demo-4',
        title: 'Backup Completed',
        message: 'Weekly memory backup completed successfully. 156 files backed up.',
        type: 'success',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        source: 'Backup Service'
      }
    ]

    setNotifications(prev => prev.length === 0 ? demoNotifications : prev)
  }, [])

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('genplatform-notifications', JSON.stringify(notifications))
  }, [notifications])

  // Auto-remove old notifications (older than 7 days)
  useEffect(() => {
    const interval = setInterval(() => {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      setNotifications(prev => prev.filter(n => 
        n.persistent || new Date(n.timestamp).getTime() > sevenDaysAgo
      ))
    }, 60 * 60 * 1000) // Check every hour

    return () => clearInterval(interval)
  }, [])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev])

    // Auto-remove non-persistent notifications after 5 minutes
    if (!notification.persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
      }, 5 * 60 * 1000)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function NotificationBell() {
  const { notifications, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications()
  
  const unreadCount = notifications.filter(n => !n.read).length
  const hasUnread = unreadCount > 0

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <DropdownMenu>
      <Button variant="ghost" size="sm" className="relative">
        <Bell className="h-4 w-4" />
        {hasUnread && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex space-x-1">
            {hasUnread && (
              <Button size="sm" variant="ghost" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={clearAll}>
              Clear all
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    notification.read 
                      ? 'bg-background hover:bg-muted/50' 
                      : 'bg-muted/30 hover:bg-muted/50 border-primary/20'
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getNotificationIcon(notification.type)}
                      <span className="font-medium text-sm">{notification.title}</span>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(notification.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{formatTimeAgo(notification.timestamp)}</span>
                      {notification.source && (
                        <>
                          <span>•</span>
                          <span>{notification.source}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {notification.actions && notification.actions.length > 0 && (
                    <div className="flex space-x-2 mt-2">
                      {notification.actions.map((action, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant={action.variant || "outline"}
                          onClick={(e) => {
                            e.stopPropagation()
                            action.action()
                          }}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Notification Settings
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Toast notifications component
export function NotificationToast() {
  const { notifications, removeNotification } = useNotifications()
  
  // Show only unread notifications as toasts for 5 seconds
  const [visibleToasts, setVisibleToasts] = useState<string[]>([])

  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read && !visibleToasts.includes(n.id))
    
    unreadNotifications.forEach(notification => {
      setVisibleToasts(prev => [...prev, notification.id])
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setVisibleToasts(prev => prev.filter(id => id !== notification.id))
      }, 5000)
    })
  }, [notifications, visibleToasts])

  const toastNotifications = notifications.filter(n => visibleToasts.includes(n.id))

  if (toastNotifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toastNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-background border rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-right ${
            notification.type === 'error' ? 'border-red-200 bg-red-50' :
            notification.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
            notification.type === 'success' ? 'border-green-200 bg-green-50' :
            'border-blue-200 bg-blue-50'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getNotificationIcon(notification.type)}
              <span className="font-medium text-sm">{notification.title}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => {
                setVisibleToasts(prev => prev.filter(id => id !== notification.id))
                removeNotification(notification.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
        </div>
      ))}
    </div>
  )

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Info className="h-4 w-4 text-blue-600" />
    }
  }
}