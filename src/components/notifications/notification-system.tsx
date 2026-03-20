"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, X, AlertTriangle, CheckCircle, Info, Wifi, WifiOff, Loader2 } from "lucide-react"
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
  type: "info" | "warning" | "success" | "error"
  title: string
  message: string
  timestamp: Date
  read: boolean
  persistent?: boolean
}

type GatewayStatus = "online" | "offline" | "connecting"

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>("connecting")
  const [isOpen, setIsOpen] = useState(false)

  // Check gateway status
  const checkGatewayStatus = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch("/api/bridge/status", {
        signal: controller.signal,
        cache: "no-store"
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        setGatewayStatus("offline")
        return
      }
      
      const data = await response.json()
      
      // Check multiple ways gateway could be running
      const isGatewayRunning = 
        // Check direct gateway status
        data?.gateway?.status === "running" ||
        data?.gateway?.running === true ||
        // Check services array for running gateway
        data?.services?.some((s: any) => 
          (s.name === "gateway" || s.name?.includes("gateway")) && 
          (s.status === "running" || s.running === true)
        ) ||
        // Check if bridge itself reports gateway
        data?.status === "running" ||
        data?.running === true

      setGatewayStatus(isGatewayRunning ? "online" : "offline")
    } catch (error) {
      // If fetch fails (network error, timeout, etc.), show connecting
      if (error instanceof Error && error.name === "AbortError") {
        setGatewayStatus("connecting")
      } else {
        setGatewayStatus("offline")
      }
    }
  }, [])

  // Check for real CPU alerts from metrics
  const checkMetricsAlerts = useCallback(async () => {
    try {
      const response = await fetch("/api/bridge/metrics", {
        cache: "no-store"
      })
      
      if (!response.ok) return
      
      const data = await response.json()
      
      // Only add CPU alert if actually high
      const cpuUsage = data?.cpu?.usage || data?.cpuUsage || data?.cpu || 0
      
      if (cpuUsage > 85) {
        setNotifications(prev => {
          // Check if we already have a CPU alert
          const existingCpuAlert = prev.find(n => n.id === "cpu-high-alert")
          if (existingCpuAlert) return prev
          
          return [{
            id: "cpu-high-alert",
            type: "warning",
            title: "High CPU Usage",
            message: `CPU usage is at ${Math.round(cpuUsage)}%`,
            timestamp: new Date(),
            read: false,
            persistent: true
          }, ...prev]
        })
      } else {
        // Remove CPU alert if CPU is back to normal
        setNotifications(prev => prev.filter(n => n.id !== "cpu-high-alert"))
      }
    } catch {
      // Silently fail - metrics not available
    }
  }, [])

  // Initial check and polling
  useEffect(() => {
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

  // Generate gateway notification based on status
  const getGatewayNotification = (): Notification | null => {
    if (gatewayStatus === "online") return null
    
    if (gatewayStatus === "connecting") {
      return {
        id: "gateway-connecting",
        type: "info",
        title: "Connecting to Gateway",
        message: "Establishing connection to the gateway...",
        timestamp: new Date(),
        read: false,
        persistent: true
      }
    }
    
    return {
      id: "gateway-offline",
      type: "warning",
      title: "Gateway Offline",
      message: "The gateway service is not running. Some features may be unavailable.",
      timestamp: new Date(),
      read: false,
      persistent: true
    }
  }

  // Combine real notifications
  const allNotifications = (() => {
    const gatewayNotif = getGatewayNotification()
    const combined = [...notifications]
    
    if (gatewayNotif) {
      // Add gateway notification at the top if not already present
      const hasGatewayNotif = combined.some(n => 
        n.id === "gateway-offline" || n.id === "gateway-connecting"
      )
      if (!hasGatewayNotif) {
        combined.unshift(gatewayNotif)
      }
    } else {
      // Remove gateway notifications if gateway is online
      return combined.filter(n => 
        n.id !== "gateway-offline" && n.id !== "gateway-connecting"
      )
    }
    
    return combined
  })()

  const unreadCount = allNotifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
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
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusIcon = () => {
    switch (gatewayStatus) {
      case "online":
        return <Wifi className="h-3 w-3 text-green-500" />
      case "connecting":
        return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
      default:
        return <WifiOff className="h-3 w-3 text-yellow-500" />
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Notifications</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getStatusIcon()}
              <span className="capitalize">{gatewayStatus}</span>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {allNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            allNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors",
                  !notification.read && "bg-muted/30"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {!notification.persistent && (
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
                  )}
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
export function useNotifications() {
  // This could be expanded with a context if needed
  return {
    addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      // Would need context to implement fully
      console.log("Add notification:", notification)
    }
  }
}
