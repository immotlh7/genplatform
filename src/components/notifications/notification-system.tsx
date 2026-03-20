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
  source: "gateway" | "metrics" | "build" | "system"
}

interface GatewayStatus {
  gateway: {
    status: string
    url?: string
    version?: string
  }
  services?: Array<{
    name: string
    status: string
  }>
}

interface MetricsData {
  cpu?: number
  memory?: number
  uptime?: number
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [gatewayStatus, setGatewayStatus] = useState<"checking" | "online" | "offline" | "error">("checking")
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  // Check gateway status from the real API
  const checkGatewayStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/bridge/status", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store"
      })

      if (!response.ok) {
        // API endpoint exists but returned error
        setGatewayStatus("error")
        return "error"
      }

      const data: GatewayStatus = await response.json()
      
      // Check if gateway is running - multiple ways to detect
      const isRunning = 
        data?.gateway?.status === "running" ||
        data?.gateway?.status === "online" ||
        data?.gateway?.status === "connected" ||
        data?.services?.some(s => 
          s.name?.toLowerCase().includes("gateway") && 
          (s.status === "running" || s.status === "online")
        )

      if (isRunning) {
        setGatewayStatus("online")
        return "online"
      } else {
        setGatewayStatus("offline")
        return "offline"
      }
    } catch (error) {
      // Network error or API not reachable - show as "checking" not "offline"
      console.error("Failed to check gateway status:", error)
      setGatewayStatus("error")
      return "error"
    }
  }, [])

  // Check metrics for real CPU alerts
  const checkMetrics = useCallback(async (): Promise<MetricsData | null> => {
    try {
      const response = await fetch("/api/bridge/metrics", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store"
      })

      if (!response.ok) return null

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
      return null
    }
  }, [])

  // Generate real notifications based on actual status
  const updateNotifications = useCallback(async () => {
    const newNotifications: Notification[] = []
    
    // Check gateway status
    const gwStatus = await checkGatewayStatus()
    setLastCheck(new Date())
    
    if (gwStatus === "offline") {
      newNotifications.push({
        id: "gateway-offline",
        type: "warning",
        title: "Gateway Offline",
        message: "The AI Gateway is not running. Some features may be unavailable.",
        timestamp: new Date(),
        read: false,
        source: "gateway"
      })
    } else if (gwStatus === "error") {
      // Don't show error as "offline" - it might just be API issue
      newNotifications.push({
        id: "gateway-checking",
        type: "info",
        title: "Gateway Status Unknown",
        message: "Unable to verify gateway status. Connection may be unstable.",
        timestamp: new Date(),
        read: false,
        source: "gateway"
      })
    }

    // Check real metrics for CPU alerts
    const metrics = await checkMetrics()
    if (metrics && metrics.cpu && metrics.cpu > 85) {
      newNotifications.push({
        id: "cpu-high",
        type: "warning",
        title: "High CPU Usage",
        message: `CPU usage is at ${metrics.cpu.toFixed(1)}%. Consider scaling resources.`,
        timestamp: new Date(),
        read: false,
        source: "metrics"
      })
    }

    if (metrics && metrics.memory && metrics.memory > 90) {
      newNotifications.push({
        id: "memory-high",
        type: "warning",
        title: "High Memory Usage",
        message: `Memory usage is at ${metrics.memory.toFixed(1)}%. Consider scaling resources.`,
        timestamp: new Date(),
        read: false,
        source: "metrics"
      })
    }

    setNotifications(newNotifications)
  }, [checkGatewayStatus, checkMetrics])

  // Initial check and periodic updates
  useEffect(() => {
    // Initial check
    updateNotifications()

    // Check every 30 seconds
    const interval = setInterval(updateNotifications, 30000)

    return () => clearInterval(interval)
  }, [updateNotifications])

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
          {gatewayStatus === "checking" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
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
              {lastCheck && (
                <p className="text-xs mt-1">
                  Last checked: {lastCheck.toLocaleTimeString()}
                </p>
              )}
            </div>
          ) : (
            notifications.map(notification => (
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
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
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
        {lastCheck && notifications.length > 0 && (
          <div className="p-2 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Last checked: {lastCheck.toLocaleTimeString()}
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Export a simpler status indicator for inline use
export function GatewayStatusIndicator() {
  const [status, setStatus] = useState<"checking" | "online" | "offline" | "error">("checking")

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/bridge/status", {
          method: "GET",
          cache: "no-store"
        })

        if (!response.ok) {
          setStatus("error")
          return
        }

        const data = await response.json()
        const isRunning = 
          data?.gateway?.status === "running" ||
          data?.gateway?.status === "online" ||
          data?.gateway?.status === "connected" ||
          data?.services?.some((s: { name: string; status: string }) => 
            s.name?.toLowerCase().includes("gateway") && 
            (s.status === "running" || s.status === "online")
          )

        setStatus(isRunning ? "online" : "offline")
      } catch {
        setStatus("error")
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking gateway...</span>
      </div>
    )
  }

  if (status === "online") {
    return null // Don't show anything when online
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 text-xs text-yellow-600">
        <Info className="h-3 w-3" />
        <span>Gateway status unknown</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-yellow-600">
      <AlertTriangle className="h-3 w-3" />
      <span>Gateway offline</span>
    </div>
  )
}
