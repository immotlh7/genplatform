'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Info, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  gatewayStatus: 'online' | 'offline' | 'connecting' | 'unknown';
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<'online' | 'offline' | 'connecting' | 'unknown'>('connecting');
  const [lastGatewayCheck, setLastGatewayCheck] = useState<number>(0);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => {
      // Don't add duplicate notifications with same title
      const exists = prev.some(n => n.title === notification.title && !n.read);
      if (exists) return prev;
      return [newNotification, ...prev].slice(0, 50); // Keep max 50 notifications
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Check gateway status from Bridge API
  const checkGatewayStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/bridge/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        // API returned error status
        setGatewayStatus('offline');
        return;
      }

      const data = await response.json();
      
      // Check multiple conditions for gateway being online
      let isOnline = false;
      
      // Check if gateway object exists and has running status
      if (data.gateway?.status === 'running' || data.gateway?.status === 'online') {
        isOnline = true;
      }
      
      // Check services array for running gateway
      if (data.services && Array.isArray(data.services)) {
        const gatewayService = data.services.find((s: any) => 
          s.name?.toLowerCase().includes('gateway') || s.type?.toLowerCase().includes('gateway')
        );
        if (gatewayService && (gatewayService.status === 'running' || gatewayService.status === 'online')) {
          isOnline = true;
        }
      }
      
      // Check if overall status indicates running
      if (data.status === 'running' || data.status === 'online' || data.status === 'healthy') {
        isOnline = true;
      }
      
      // Check if connected flag exists
      if (data.connected === true) {
        isOnline = true;
      }

      setGatewayStatus(isOnline ? 'online' : 'offline');
      setLastGatewayCheck(Date.now());
      
    } catch (error) {
      // Network error or Bridge API is down
      console.error('Gateway status check failed:', error);
      setGatewayStatus('connecting');
    }
  }, []);

  // Check real metrics for CPU alerts
  const checkMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/bridge/metrics', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) return;

      const data = await response.json();
      
      // Only add CPU alert if real data shows high usage
      if (data.cpu && typeof data.cpu === 'number' && data.cpu > 85) {
        addNotification({
          type: 'warning',
          title: 'High CPU Usage',
          message: `CPU usage is at ${Math.round(data.cpu)}%. Consider scaling resources.`,
          persistent: false,
        });
      }
    } catch (error) {
      // Silently fail - metrics are optional
      console.debug('Metrics check failed:', error);
    }
  }, [addNotification]);

  // Initial check and periodic refresh
  useEffect(() => {
    // Immediate check
    checkGatewayStatus();
    
    // Check every 30 seconds
    const statusInterval = setInterval(checkGatewayStatus, 30000);
    
    // Check metrics every 2 minutes
    const metricsInterval = setInterval(checkMetrics, 120000);
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(metricsInterval);
    };
  }, [checkGatewayStatus, checkMetrics]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        gatewayStatus,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Notification Bell Component
export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, gatewayStatus } = useNotifications();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        
        {/* Gateway Status Banner */}
        {gatewayStatus === 'connecting' && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950 border-b flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm text-blue-700 dark:text-blue-300">Connecting to gateway...</span>
          </div>
        )}
        {gatewayStatus === 'offline' && (
          <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-950 border-b flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">Gateway offline</span>
          </div>
        )}
        
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={cn(
                  'px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors',
                  !notification.read && 'bg-muted/30'
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
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Gateway Status Banner (for pages that want to show inline)
export function GatewayStatusBanner() {
  const { gatewayStatus } = useNotifications();

  if (gatewayStatus === 'online' || gatewayStatus === 'unknown') {
    return null;
  }

  if (gatewayStatus === 'connecting') {
    return (
      <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Connecting to gateway...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm">Gateway is offline. Some features may be unavailable.</span>
      </div>
    </div>
  );
}

// Export individual components
export default NotificationProvider;
