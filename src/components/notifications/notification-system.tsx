"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, X, AlertTriangle, CheckCircle, Info, Wifi, WifiOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "success" | "warning" | "error" | "info"
  title: string
  message: string
  timestamp: Date
  read: boolean
  persistent?: boolean
}

interface GatewayStatus {
  status: "running" | "stopped" | "error" | "connecting"
  lastChecked: Date
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>({
    status: "connecting",
    lastChecked: new Date()
  })
  const [isOpen, setIsOpen] = useState(false)

  // Check gateway status from the Bridge API
  const checkGatewayStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/bridge/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })

      if (!response.ok) {
        // API endpoint exists but returned error
        setGatewayStatus({ status: "error", lastChecked: new Date() })
        return
      }

      const data = await response.json()
      
      // Check multiple ways the gateway could be reported as running
      let isRunning = false
      
      // Method 1: Direct gateway status
      if (data.gateway?.status === 'running' || data.gateway?.status === 'online') {
        isRunning = true
      }
      
      // Method 2: Check services array for running gateway
      if (data.services && Array.isArray(data.services)) {
        const gatewayService = data.services.find((s: any) => 
          s.name?.toLowerCase().includes('gateway') || 
          s.type?.toLowerCase().includes('gateway')
        )
        if (gatewayService && (gatewayService.status === 'running' || gatewayService.status === 'online')) {
          isRunning = true
        }
      }
      
      // Method 3: Check if bridge itself reports connected status
      if (data.connected === true || data.status === 'connected' || data.status === 'running') {
        isRunning = true
      }
      
      // Method 4: Check for any running services (indicates gateway is working)
      if (data.services && Array.isArray(data.services) && data.services.length > 0) {
        const hasRunningService = data.services.some((s: any) => 
          s.status === 'running' || s.status === 'online'
        )
        if (hasRunningService) {
          isRunning = true
        }
      }

      setGatewayStatus({
        status: isRunning ? "running" : "stopped",
        lastChecked: new Date()
      })

    } catch (error) {
      // Network error or API not available - show connecting, not offline
      console.log('Gateway status check failed:', error)
      setGatewayStatus({ status: "connecting", lastChecked: new Date() })
    }
  }, [])

  // Check for real CPU alerts from metrics
  const checkMetricsAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/bridge/metrics', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })

      if (!response.ok) return

      const data = await response.json()
      
      // Only add CPU alert if it's actually above 85%
      if (data.cpu && typeof data.cpu === 'number' && data.cpu > 85) {
        const existingAlert = notifications.find(n => n.id === 'cpu-high-alert')
        if (!existingAlert) {
          addNotification({
            id: 'cpu-high-alert',
            type: 'warning',
            title: 'High CPU Usage',
            message: `CPU usage is at ${Math.round(data.cpu)}%`,
            persistent: false
          })
        }
      } else {
        // Remove CPU alert if CPU is back to normal
        setNotifications(prev => prev.filter(n => n.id !== 'cpu-high-alert'))
      }

    } catch (error) {
      // Silently fail - metrics not critical
      console.log('Metrics check failed:', error)
    }
  }, [notifications])

  // Add a notification
  const addNotification = useCallback((notif: Omit<Notification, 'timestamp' | 'read'>) => {
    setNotifications(prev => {
      // Don't add duplicates
      if (prev.some(n => n.id === notif.id)) {
        return prev
      }
      return [{
        ...notif,
        timestamp: new Date(),
        read: false
      }, ...prev].slice(0, 20) // Keep max 20 notifications
    })
  }, [])

  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Mark all as read
  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  // Initial check and polling
  useEffect(() => {
    // Initial checks
    checkGatewayStatus()
    checkMetricsAlerts()

    // Poll every 30 seconds
    const statusInterval = setInterval(checkGatewayStatus, 30000)
    const metricsInterval = setInterval(checkMetricsAlerts, 60000)

    return () => {
      clearInterval(statusInterval)
      clearInterval(metricsInterval)
    }
  }, [checkGatewayStatus, checkMetricsAlerts])

  // Count unread notifications (excluding gateway status which is shown separately)
  const unreadCount = notifications.filter(n => !n.read).length

  // Only show badge if there are real unread notifications
  const showBadge = unreadCount > 0

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getGatewayStatusDisplay = () => {
    switch (gatewayStatus.status) {
      case 'running':
        return {
          icon: <Wifi className="h-4 w-4 text-green-500" />,
          text: 'Gateway Online',
          className: 'text-green-600 bg-green-50'
        }
      case 'stopped':
        return {
          icon: <WifiOff className="h-4 w-4 text-red-500" />,
          text: 'Gateway Offline',
          className: 'text-red-600 bg-red-50'
        }
      case 'connecting':
        return {
          icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
          text: 'Connecting...',
          className: 'text-blue-600 bg-blue-50'
        }
      case 'error':
        return {
          icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
          text: 'Status Unknown',
          className: 'text-yellow-600 bg-yellow-50'
        }
    }
  }

  const gatewayDisplay = getGatewayStatusDisplay()

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {showBadge && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        
        {/* Gateway Status - Always shown at top */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-3 border-b",
          gatewayDisplay.className
        )}>
          {gatewayDisplay.icon}
          <span className="text-sm font-medium">{gatewayDisplay.text}</span>
        </div>

        {/* Notifications List */}
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notifications
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start gap-3 p-4 border-b hover:bg-muted/50 transition-colors",
                  !notif.read && "bg-muted/30"
                )}
              >
                {getIcon(notif.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{notif.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(notif.timestamp)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => removeNotification(notif.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// Export a hook for other components to add notifications
export function useNotifications() {
  // This would need a context provider for full implementation
  // For now, this is a placeholder
  return {
    addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      console.log('Notification:', notif)
    }
  }
}
