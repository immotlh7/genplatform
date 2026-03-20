'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'warning' | 'error' | 'success' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  source: 'gateway' | 'system' | 'build' | 'deploy'
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [gatewayChecked, setGatewayChecked] = useState(false)

  // Check gateway status from real API
  const checkGatewayStatus = useCallback(async (): Promise<boolean | null> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('/api/bridge/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      
      // Handle various response formats from the bridge API
      // Check if gateway/bridge is connected/running
      if (data.connected === true) return true
      if (data.online === true) return true
      if (data.status === 'running') return true
      if (data.status === 'connected') return true
      if (data.gateway?.status === 'running') return true
      if (data.gateway?.connected === true) return true
      if (data.bridge?.status === 'running') return true
      if (data.bridge?.connected === true) return true
      
      // Check services array
      if (Array.isArray(data.services)) {
        const gatewayService = data.services.find((s: { name?: string; type?: string; status?: string }) => 
          s.name?.toLowerCase().includes('gateway') || 
          s.type?.toLowerCase().includes('gateway')
        )
        if (gatewayService?.status === 'running') return true
      }
      
      // If we got a valid response but no clear "running" indicator, 
      // check if there's any error status
      if (data.error || data.status === 'error' || data.status === 'offline') {
        return false
      }
      
      // If we got a 200 response with data, assume it's working
      // (the API is responding, so bridge is functional)
      return true
      
    } catch (error) {
      // Network error, timeout, or API not reachable
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Gateway status check timed out')
      }
      return null // null = couldn't determine, don't show warning
    }
  }, [])

  // Check for real CPU alerts from metrics
  const checkMetrics = useCallback(async (): Promise<Notification | null> => {
    try {
      const response = await fetch('/api/bridge/metrics', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      })

      if (!response.ok) return null

      const data = await response.json()
      
      // Only return CPU alert if it's actually above 85%
      const cpuValue = data.cpu ?? data.cpuUsage ?? data.metrics?.cpu
      if (typeof cpuValue === 'number' && cpuValue > 85) {
        return {
          id: 'cpu-alert-' + Date.now(),
          type: 'warning' as const,
          title: 'High CPU Usage',
          message: `CPU usage is at ${cpuValue.toFixed(1)}%`,
          timestamp: new Date(),
          read: false,
          source: 'system' as const,
        }
      }
      
      return null
    } catch {
      return null
    }
  }, [])

  // Build real notifications based on actual status
  const buildNotifications = useCallback(async () => {
    setIsLoading(true)
    const newNotifications: Notification[] = []

    // Check gateway status
    const gatewayRunning = await checkGatewayStatus()
    setGatewayChecked(true)
    
    // Only add gateway notification if it's definitively offline (returned false)
    // Don't add if null (couldn't determine) or true (running)
    if (gatewayRunning === false) {
      newNotifications.push({
        id: 'gateway-offline',
        type: 'warning',
        title: 'Gateway Offline',
        message: 'Local gateway is not running. Some features may be limited.',
        timestamp: new Date(),
        read: false,
        source: 'gateway',
      })
    }

    // Check for real CPU alerts
    const cpuAlert = await checkMetrics()
    if (cpuAlert) {
      newNotifications.push(cpuAlert)
    }

    setNotifications(newNotifications)
    setIsLoading(false)
  }, [checkGatewayStatus, checkMetrics])

  // Initial check and periodic refresh
  useEffect(() => {
    buildNotifications()
    
    // Refresh every 60 seconds (not too frequent)
    const interval = setInterval(buildNotifications, 60000)
    
    return () => clearInterval(interval)
  }, [buildNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {isLoading && !gatewayChecked ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && gatewayChecked && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading && !gatewayChecked ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Checking status...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">All systems operational</p>
              <p className="text-xs mt-1">No notifications</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={cn(
                  'p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer',
                  !notification.read && 'bg-muted/30'
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      dismissNotification(notification.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Export a banner component for page-level warnings (only when truly offline)
export function GatewayStatusBanner() {
  const [status, setStatus] = useState<'running' | 'offline' | 'checking'>('checking')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let mounted = true
    
    const checkStatus = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch('/api/bridge/status', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)

        if (!mounted) return

        if (!response.ok) {
          setStatus('offline')
          return
        }

        const data = await response.json()
        
        // Check for any indication that gateway is running
        const isRunning = 
          data.connected === true ||
          data.online === true ||
          data.status === 'running' ||
          data.status === 'connected' ||
          data.gateway?.status === 'running' ||
          data.gateway?.connected === true ||
          data.bridge?.status === 'running' ||
          // If we got a successful response without error, assume it's working
          (!data.error && !data.offline && response.ok)

        if (mounted) {
          setStatus(isRunning ? 'running' : 'offline')
        }
      } catch {
        // Network error - don't immediately show offline
        // Keep checking status instead
        if (mounted) {
          setStatus('checking')
        }
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 60000)
    
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  // Don't show banner if running, checking, or dismissed
  if (status === 'running' || status === 'checking' || dismissed) {
    return null
  }

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span>Local gateway is offline. Some features may be limited.</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDismissed(true)}
        className="h-6 px-2"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
