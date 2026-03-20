"use client"

import { useState, useEffect, useCallback } from "react"
import { NotificationBell, Notification } from "./NotificationBell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, X, Wifi, WifiOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GatewayStatus {
  status: 'running' | 'stopped' | 'error' | 'unknown' | 'connecting'
  message?: string
}

interface BridgeStatusResponse {
  gateway?: {
    status: string
    port?: number
  }
  services?: Array<{
    name: string
    status: string
  }>
  status?: string
}

interface BridgeMetricsResponse {
  cpu?: number
  memory?: number
  uptime?: number
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>({ status: 'connecting' })
  const [showBanner, setShowBanner] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check gateway status
  const checkGatewayStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/bridge/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })

      if (!response.ok) {
        // API returned error - might be connecting or bridge issue
        if (response.status === 503 || response.status === 502) {
          setGatewayStatus({ status: 'connecting', message: 'Connecting to gateway...' })
          setShowBanner(false)
        } else {
          setGatewayStatus({ status: 'error', message: 'Unable to check gateway status' })
          setShowBanner(true)
        }
        return
      }

      const data: BridgeStatusResponse = await response.json()
      
      // Check if gateway is running - multiple ways to determine this
      const isGatewayRunning = 
        // Direct gateway status check
        data.gateway?.status === 'running' ||
        data.gateway?.status === 'online' ||
        // Overall status check
        data.status === 'running' ||
        data.status === 'online' ||
        data.status === 'ok' ||
        // Check services array for running gateway
        data.services?.some(s => 
          (s.name === 'gateway' || s.name === 'bridge' || s.name === 'local-gateway') && 
          (s.status === 'running' || s.status === 'online' || s.status === 'active')
        ) ||
        // If we got a successful response with gateway info, assume it's running
        (data.gateway && data.gateway.port)

      if (isGatewayRunning) {
        setGatewayStatus({ status: 'running', message: 'Gateway is online' })
        setShowBanner(false)
      } else {
        setGatewayStatus({ status: 'stopped', message: 'Gateway is offline' })
        setShowBanner(true)
      }
    } catch (error) {
      // Network error - likely connecting or bridge not reachable
      console.error('Failed to check gateway status:', error)
      setGatewayStatus({ status: 'connecting', message: 'Connecting to services...' })
      // Don't show banner for connection issues - might just be loading
      setShowBanner(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check for real CPU alerts from metrics
  const checkMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/bridge/metrics', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })

      if (!response.ok) return

      const data: BridgeMetricsResponse = await response.json()
      
      // Only add CPU alert if CPU is actually above 85%
      if (data.cpu && data.cpu > 85) {
        const existingCpuAlert = notifications.find(n => n.id === 'cpu-high')
        if (!existingCpuAlert) {
          addNotification({
            id: 'cpu-high',
            title: 'High CPU Usage',
            message: `CPU usage is at ${data.cpu.toFixed(1)}%`,
            type: 'warning',
            read: false,
            timestamp: new Date()
          })
        }
      } else {
        // Remove CPU alert if CPU is back to normal
        setNotifications(prev => prev.filter(n => n.id !== 'cpu-high'))
      }
    } catch (error) {
      // Silently fail - metrics endpoint might not be available
      console.debug('Metrics check failed:', error)
    }
  }, [notifications])

  // Add notification helper
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => {
      // Don't add duplicate notifications
      if (prev.find(n => n.id === notification.id)) {
        return prev
      }
      return [notification, ...prev].slice(0, 20) // Keep max 20 notifications
    })
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  // Dismiss notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Initial check and polling
  useEffect(() => {
    // Initial check
    checkGatewayStatus()
    checkMetrics()

    // Poll every 30 seconds
    const statusInterval = setInterval(checkGatewayStatus, 30000)
    const metricsInterval = setInterval(checkMetrics, 60000)

    return () => {
      clearInterval(statusInterval)
      clearInterval(metricsInterval)
    }
  }, [checkGatewayStatus, checkMetrics])

  // Update notifications based on gateway status
  useEffect(() => {
    if (gatewayStatus.status === 'stopped' || gatewayStatus.status === 'error') {
      addNotification({
        id: 'gateway-offline',
        title: 'Gateway Offline',
        message: gatewayStatus.message || 'The local gateway is not running',
        type: 'error',
        read: false,
        timestamp: new Date()
      })
    } else if (gatewayStatus.status === 'running') {
      // Remove gateway offline notification when it comes back online
      setNotifications(prev => prev.filter(n => n.id !== 'gateway-offline'))
    }
  }, [gatewayStatus, addNotification])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      {/* Banner for gateway offline - only show if truly offline */}
      {showBanner && gatewayStatus.status !== 'connecting' && !isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 text-black px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">
              {gatewayStatus.message || 'Gateway is offline. Some features may be unavailable.'}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover:bg-yellow-600/50"
            onClick={() => setShowBanner(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Connecting indicator - subtle, not alarming */}
      {gatewayStatus.status === 'connecting' && isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500/80 text-white px-4 py-1 flex items-center justify-center">
          <Loader2 className="h-3 w-3 animate-spin mr-2" />
          <span className="text-xs">Connecting to services...</span>
        </div>
      )}

      {/* Notification Bell */}
      <NotificationBell
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDismiss={dismissNotification}
      />
    </>
  )
}

// Export for direct use in navbar if needed
export { NotificationBell } from "./NotificationBell"
export type { Notification } from "./NotificationBell"
