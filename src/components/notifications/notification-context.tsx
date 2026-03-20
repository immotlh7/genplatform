"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

export interface Notification {
  id: string
  type: "info" | "warning" | "error" | "success"
  title: string
  message: string
  timestamp: Date
  read: boolean
  source: "gateway" | "system" | "build" | "deploy"
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  removeNotification: (id: string) => void
  removeBySource: (source: string, type?: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `${notification.source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    }

    setNotifications(prev => {
      // Check for existing notification from same source with same type
      const existingIndex = prev.findIndex(
        n => n.source === notification.source && n.type === notification.type
      )

      if (existingIndex >= 0) {
        // Update existing instead of duplicating
        const updated = [...prev]
        updated[existingIndex] = newNotification
        return updated
      }

      // Add new, keep max 20
      return [newNotification, ...prev].slice(0, 20)
    })
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const removeBySource = useCallback((source: string, type?: string) => {
    setNotifications(prev =>
      prev.filter(n => !(n.source === source && (type ? n.type === type : true)))
    )
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        removeBySource,
        markAsRead,
        markAllAsRead,
        clearAll,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotificationContext must be used within NotificationProvider")
  }
  return context
}
