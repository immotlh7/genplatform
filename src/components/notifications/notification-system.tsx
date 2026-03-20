"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, X, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "warning" | "error" | "success" | "info"
  title: string
  message: string
  timestamp: Date
  read: boolean
  source: "gateway" | "system" | "build" | "deploy"
}

interface GatewayStatus {
  gateway?: {
    status?: string
    running?: boolean
  }
  services?: Array<{
    name: string
    status: string
  }>
  status?: string
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [gatewayChecking, setGatewayChecking] = useState(true)
  const [lastGatewayStatus, setLastGatewayStatus] = useState<"online" | "offline" | "checking">("checking")

  const checkGatewayStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/bridge/status", {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (!response.ok) {
        // API returned error status
        setLastGatewayStatus("offline")
        return false
      }

      const data: GatewayStatus = await response.json()

      // Check multiple conditions for gateway being online
      const isGatewayRunning = 
        // Direct gateway status check
        data.gateway?.status === "running" ||
        data.gateway?.running === true ||
        // Overall status check
        data.status === "running" ||
        data.status === "online" ||
        data.status === "healthy" ||
        // Services array check
        (data.services && data.services.some(
          (s) => s.name?.toLowerCase().includes("gateway") && 
                 (s.status === "running" || s.status === "online" || s.status === "healthy")
        ))

      setLastGatewayStatus(isGatewayRunning ? "online" : "offline")
      return isGatewayRunning
    } catch (error) {
      // Network error or timeout - gateway might be starting
      console.log("Gateway check error:", error)
      setLastGatewayStatus("checking")
      return null // Unknown state
    } finally {
      setGatewayChecking(false)
    }
  }, [])

  const checkMetrics = useCallback(async () => {
    try {
      const response = await fetch("/api/bridge/metrics", {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) return null

      const data = await response.json()
      return data
    } catch {
      return null
    }
  }, [])

  const updateNotifications = useCallback(async () => {
    const newNotifications: Notification[] = []

    // Check gateway status
    const gatewayOnline = await checkGatewayStatus()

    // Only add gateway offline notification if we confirmed it's offline
    if (gatewayOnline === false) {
      newNotifications.push({
        id: "gateway-offline",
        type: "warning",
        title: "Gateway Offline",
        message: "The AI Gateway is not running. Some features may be unavailable.",
        timestamp: new Date(),
        read: false,
        source: "gateway",
      })
    }

    // Check real CPU metrics only if gateway is online
    if (gatewayOnline === true) {
      const metrics = await checkMetrics()
      if (metrics && typeof metrics.cpu === "number" && metrics.cpu > 85) {
        newNotifications.push({
          id: `cpu-alert-${Date.now()}`,
          type: "warning",
          title: "High CPU Usage",
          message: `CPU usage is at ${metrics.cpu.toFixed(1)}%. Consider scaling resources.`,
          timestamp: new Date(),
          read: false,
          source: "system",
        })
      }
    }

    // Only update if there are real notifications or to clear old ones
    setNotifications((prev) => {
      // Keep any build/deploy notifications that are still relevant
      const buildDeployNotifications = prev.filter(
        (n) => (n.source === "build" || n.source === "deploy") && !n.read
      )
      
      // Combine with new system notifications
      const combined = [...newNotifications, ...buildDeployNotifications]
      
      // Deduplicate by id
      const unique = combined.filter(
        (n, index, self) => index === self.findIndex((t) => t.id === n.id)
      )
      
      return unique
    })
  }, [checkGatewayStatus, checkMetrics])

  useEffect(() => {
    // Initial check
    updateNotifications()

    // Check every 30 seconds
    const interval = setInterval(updateNotifications, 30000)

    return () => clearInterval(interval)
  }, [updateNotifications])

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
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {gatewayChecking ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && !gatewayChecking && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">All systems operational</p>
              <p className="text-xs mt-1">No alerts at this time</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors",
                  !notification.read && "bg-muted/30"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Export a hook for other components to add notifications
export function useNotificationSystem() {
  // This would typically use a context, but for now returns a simple interface
  return {
    addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      // In a real implementation, this would update the context
      console.log("Adding notification:", notification)
    },
  }
}
