"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  TrendingUp,
  Download,
  Eye,
  X,
  Settings,
  Volume2,
  VolumeX,
  Trash2,
  MarkAsRead
} from 'lucide-react'

export type NotificationType = 
  | 'report_completed' 
  | 'report_failed' 
  | 'improvement_approved' 
  | 'improvement_rejected' 
  | 'improvement_assigned' 
  | 'improvement_voted'
  | 'report_scheduled'
  | 'improvement_commented'

export interface NotificationData {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  isRead: boolean
  isImportant: boolean
  relatedId?: string
  relatedType?: 'report' | 'improvement'
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

interface ReportsNotificationsProps {
  className?: string
}

export function ReportsNotifications({ className = "" }: ReportsNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    loadNotifications()
    
    // Set up real-time notification listener
    const interval = setInterval(() => {
      checkForNewNotifications()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      // Mock API call - in real app, this would call /api/notifications
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockNotifications: NotificationData[] = [
        {
          id: 'notif-1',
          type: 'report_completed',
          title: 'Daily System Report Ready',
          message: 'Your daily system report has been generated and is ready for download.',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          isRead: false,
          isImportant: false,
          relatedId: 'report-1',
          relatedType: 'report',
          actionUrl: '/dashboard/reports/report-1',
          actionLabel: 'View Report',
          metadata: {
            reportType: 'daily',
            fileSize: '2.4 MB'
          }
        },
        {
          id: 'notif-2',
          type: 'improvement_approved',
          title: 'Improvement Proposal Approved',
          message: 'Your improvement "Add Dark Mode Support for PDF Reports" has been approved and assigned to Claude Agent.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          isImportant: true,
          relatedId: 'imp-1',
          relatedType: 'improvement',
          actionUrl: '/dashboard/reports?tab=improvements&id=imp-1',
          actionLabel: 'View Details',
          metadata: {
            approvedBy: 'System Admin',
            assignedTo: 'Claude Agent'
          }
        },
        {
          id: 'notif-3',
          type: 'improvement_voted',
          title: 'New Vote on Your Proposal',
          message: 'Someone upvoted your improvement "Fix Memory Leak in Chart Rendering".',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          isImportant: false,
          relatedId: 'imp-3',
          relatedType: 'improvement',
          actionUrl: '/dashboard/reports?tab=improvements&id=imp-3',
          actionLabel: 'View Proposal',
          metadata: {
            totalVotes: 7,
            voteType: 'upvote'
          }
        },
        {
          id: 'notif-4',
          type: 'report_failed',
          title: 'Report Generation Failed',
          message: 'Weekly performance report generation failed due to data source timeout.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          isImportant: true,
          relatedId: 'report-2',
          relatedType: 'report',
          actionUrl: '/dashboard/reports/report-2',
          actionLabel: 'Retry',
          metadata: {
            error: 'Database timeout',
            retryCount: 1
          }
        },
        {
          id: 'notif-5',
          type: 'improvement_assigned',
          title: 'New Assignment',
          message: 'You have been assigned to work on "Improve Report Generation Performance".',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          isImportant: false,
          relatedId: 'imp-2',
          relatedType: 'improvement',
          actionUrl: '/dashboard/reports?tab=improvements&id=imp-2',
          actionLabel: 'View Assignment'
        }
      ]
      
      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkForNewNotifications = async () => {
    try {
      // Mock checking for new notifications
      // In real app, this would call /api/notifications/check
      const hasNew = Math.random() > 0.9 // 10% chance of new notification
      
      if (hasNew) {
        const newNotification: NotificationData = {
          id: `notif-${Date.now()}`,
          type: 'report_completed',
          title: 'Report Generation Complete',
          message: 'Your weekly report has been generated successfully.',
          timestamp: new Date().toISOString(),
          isRead: false,
          isImportant: false,
          relatedType: 'report',
          actionLabel: 'View Report'
        }
        
        setNotifications(prev => [newNotification, ...prev])
        
        if (soundEnabled) {
          playNotificationSound()
        }
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error)
    }
  }

  const playNotificationSound = () => {
    // In a real app, this would play an actual notification sound
    console.log('🔊 Notification sound played')
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'report_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'report_failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'report_scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'improvement_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'improvement_rejected':
        return <X className="h-4 w-4 text-red-600" />
      case 'improvement_assigned':
        return <TrendingUp className="h-4 w-4 text-purple-600" />
      case 'improvement_voted':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'improvement_commented':
        return <TrendingUp className="h-4 w-4 text-orange-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, isRead: true }
          : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    )
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    )
  }

  const deleteAllRead = () => {
    setNotifications(prev =>
      prev.filter(notif => !notif.isRead)
    )
  }

  const formatTimestamp = (timestamp: string) => {
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

  const unreadCount = notifications.filter(n => !n.isRead).length
  const importantCount = notifications.filter(n => !n.isRead && n.isImportant).length

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`relative ${className}`}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <>
                <Badge
                  variant={importantCount > 0 ? "destructive" : "default"}
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
                {importantCount > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-6 w-6 p-0"
              >
                <Settings className="h-3 w-3" />
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-6 px-2 text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </DropdownMenuLabel>
          
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex items-start space-x-3 p-3 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    markAsRead(notification.id)
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl
                    }
                  }}
                >
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                      {notification.isImportant && (
                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      {notification.actionLabel && (
                        <span className="text-xs text-blue-600 font-medium">
                          {notification.actionLabel} →
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notification.id)
                    }}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </DropdownMenuItem>
              ))}
              
              {notifications.some(n => n.isRead) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={deleteAllRead}
                    className="text-center text-muted-foreground text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Clear read notifications
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notification Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Notification Settings</span>
            </DialogTitle>
            <DialogDescription>
              Configure how you receive reports and improvements notifications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h4 className="font-medium">Sound</h4>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="flex items-center space-x-2"
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <span>{soundEnabled ? 'Sound Enabled' : 'Sound Disabled'}</span>
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Notification Types</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Report completion</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Report failures</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Improvement approvals</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Improvement assignments</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Votes and comments</span>
                </label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowSettings(false)}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Load initial notifications
    loadNotifications()
    
    // Set up real-time updates
    const interval = setInterval(checkForUpdates, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    // Mock implementation
    const mockNotifications: NotificationData[] = []
    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.isRead).length)
  }

  const checkForUpdates = async () => {
    // Mock implementation
    console.log('Checking for notification updates...')
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
    setUnreadCount(prev => prev - 1)
  }

  const addNotification = (notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false
    }
    
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    addNotification,
    loadNotifications
  }
}