'use client'

import { NotificationBell as SystemNotificationBell } from '@/components/notifications/notification-system'

// Re-export the notification bell from the notification system
export function NotificationBell() {
  return <SystemNotificationBell />
}