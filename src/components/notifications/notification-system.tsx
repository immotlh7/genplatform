"use client"

import { useEffect, useState, useCallback } from "react"
import { Bell, X, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react"
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
  type: "warning" | "error" | "success" | "info"
  title: string
  message: string
  timestamp: Date
  read: boolean
  source: "gateway" | "metrics" | "deploy" | "system"
}

interface GatewayStatus {
  gateway?: {
    status: string
    pid?: number
  }
  services?: Array<{
    name: string
    status: string
  }>
  error?: string
}

interface MetricsData {
  cpu?: number
  memory?: number
  error?: string
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [gatewayChecking, setGatewayChecking] = useState(true)

  // Check gateway status
  const checkGatewayStatus = useCallback(async () => {
    try {
      setGatewayChecking(true)
      const response = await fetch("/api/bridge/status", {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        // API returned error status
        throw new Error(`HTTP ${response.status}`)
      }

      const data: GatewayStatus = await response.json()

      // Check if gateway is running
      const gatewayRunning =
        data.gateway?.status === "running" ||
        data.gateway?.status === "online" ||
        (data.services &&
          data.services.some(
            (s) =>
              s.name.toLowerCase().includes("gateway") &&
              (s.status === "running" || s.status === "online")
          ))

      // Remove any existing gateway notifications
      setNotifications((prev) =>
        prev.filter((n) => n.source !== "gateway")
      )

      // Only add warning if gateway is NOT running
      if (!gatewayRunning && !data.error) {
        setNotifications((prev) => {
          // Don't add duplicate
          if (prev.some((n) => n.source === "gateway" && n.type === "warning")) {
            return prev
          }
          return [
            ...prev,
            {
              id: `gateway-offline-${Date.now()}`,
              type: "warning",
              title: "Gateway Offline",
              message: "The AI Gateway is not running. Some features may be unavailable.",
              timestamp: new Date(),
              read: false,
              source: "gateway",
            },
          ]
        })
      }
    } catch (error) {
      // Network error or bridge not reachable - show connecting status, not offline
      console.log("Gateway check failed:", error)
      
      setNotifications((prev) => {
        // Remove old gateway notifications
        const filtered = prev.filter((n) => n.source !== "gateway")
        
        // Add "connecting" info notification instead of error
        return [
          ...filtered,
          {
            id: `gateway-connecting-${Date.now()}`,
            type: "info",
            title: "Connecting to Gateway",
            message: "Attempting to connect to the AI Gateway...",
            timestamp: new Date(),
            read: false,
            source: "gateway",
          },
        ]
      })
    } finally {
      setGatewayChecking(false)
    }
  }, [])

  // Check metrics for real CPU alerts
  const checkMetrics = useCallback(async () => {
    try {
      const response = await fetch("/api/bridge/metrics", {
        method: "GET",
        cache: "no-store",
      })

      if (!response.ok) {
        return // Silently fail - metrics are optional
      }

      const data: MetricsData = await response.json()

      // Remove old metrics notifications
      setNotifications((prev) => prev.filter((n) => n.source !== "metrics"))

      // Only add CPU alert if REAL data shows > 85%
      if (data.cpu && typeof data.cpu === "number" && data.cpu > 85) {
        setNotifications((prev) => [
          ...prev,
          {
            id: `cpu-high-${Date.now()}`,
            type: "warning",
            title: "High CPU Usage",
            message: `CPU usage is at ${Math.round(data.cpu)}%`,
            timestamp: new Date(),
            read: false,
            source: "metrics",
          },
        ])
      }
    } catch (error) {
      // Silently fail - metrics are optional
      console.log("Metrics check failed:", error)
    }
  }, [])

  // Initial check and periodic refresh
  useEffect(() => {
    // Initial checks
    checkGatewayStatus()
    checkMetrics()

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      checkGatewayStatus()
      checkMetrics()
    }, 30000)

    return () => clearInterval(interval)
  }, [checkGatewayStatus, checkMetrics])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {gatewayChecking ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && !gatewayChecking && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              All systems operational
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 border-b p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                  !notification.read && "bg-muted/30"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                {getIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
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
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Export a hook for other components to add notifications
export function useNotifications() {
  // This would be connected to a context in a real implementation
  return {
    addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      console.log("Add notification:", notification)
    },
  }
}
