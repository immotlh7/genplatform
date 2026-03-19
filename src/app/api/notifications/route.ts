import { NextResponse } from 'next/server';

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  source?: string;
}

export async function GET() {
  try {
    const notifications: SystemNotification[] = [];
    const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';
    
    // Check system metrics
    try {
      const metricsRes = await fetch(`${BRIDGE_URL}/api/metrics`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });
      
      if (metricsRes.ok) {
        const metrics = await metricsRes.json();
        
        // CPU warning
        if (metrics.cpu?.usage > 80) {
          notifications.push({
            id: `cpu-high-${Date.now()}`,
            title: 'High CPU Usage',
            message: `System CPU usage is at ${metrics.cpu.usage.toFixed(1)}%`,
            type: 'warning',
            timestamp: new Date().toISOString(),
            read: false,
            source: 'System Monitor'
          });
        }
        
        // Memory warning
        if (metrics.memory?.usagePercent > 85) {
          notifications.push({
            id: `mem-high-${Date.now()}`,
            title: 'High Memory Usage',
            message: `Memory usage is at ${metrics.memory.usagePercent.toFixed(1)}%`,
            type: 'warning',
            timestamp: new Date().toISOString(),
            read: false,
            source: 'System Monitor'
          });
        }
        
        // Disk warning
        if (metrics.disk?.usagePercent > 90) {
          notifications.push({
            id: `disk-high-${Date.now()}`,
            title: 'Disk Space Low',
            message: `Disk usage is at ${metrics.disk.usagePercent.toFixed(1)}%`,
            type: 'error',
            timestamp: new Date().toISOString(),
            read: false,
            source: 'System Monitor'
          });
        }
      }
    } catch (metricsError) {
      console.error('Failed to fetch metrics:', metricsError);
    }
    
    // Check gateway status
    try {
      const statusRes = await fetch(`${BRIDGE_URL}/api/status`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });
      
      if (statusRes.ok) {
        const status = await statusRes.json();
        
        if (status.gateway?.running) {
          notifications.push({
            id: `gateway-online-${Date.now()}`,
            title: 'System Online',
            message: `Gateway running with ${status.gateway.sessions?.active || 0} active sessions • Model: ${status.gateway.model || 'default'}`,
            type: 'success',
            timestamp: new Date().toISOString(),
            read: false,
            source: 'OpenClaw Gateway'
          });
        } else {
          notifications.push({
            id: `gateway-offline-${Date.now()}`,
            title: 'Gateway Offline',
            message: 'OpenClaw gateway is not running. Some features may be limited.',
            type: 'warning',
            timestamp: new Date().toISOString(),
            read: false,
            source: 'OpenClaw Gateway'
          });
        }
      } else {
        throw new Error('Status check failed');
      }
    } catch (statusError) {
      notifications.push({
        id: `bridge-error-${Date.now()}`,
        title: 'Bridge API Connection Issue',
        message: 'Unable to connect to Bridge API. Check if the service is running.',
        type: 'error',
        timestamp: new Date().toISOString(),
        read: false,
        source: 'System'
      });
    }
    
    // Check for tasks needing review
    try {
      const tasksRes = await fetch(`${BRIDGE_URL}/api/tasks?status=review`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });
      
      if (tasksRes.ok) {
        const { tasks = [] } = await tasksRes.json();
        const reviewCount = tasks.length;
        
        if (reviewCount > 0) {
          notifications.push({
            id: `tasks-review-${Date.now()}`,
            title: 'Tasks Need Review',
            message: `${reviewCount} task${reviewCount > 1 ? 's are' : ' is'} ready for review`,
            type: 'info',
            timestamp: new Date().toISOString(),
            read: false,
            source: 'Task Manager'
          });
        }
      }
    } catch (tasksError) {
      console.error('Failed to fetch tasks:', tasksError);
    }
    
    // Check active agents
    try {
      const agentsRes = await fetch(`${BRIDGE_URL}/api/agents/status`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });
      
      if (agentsRes.ok) {
        const { activeDepartments = 0, departments = [] } = await agentsRes.json();
        
        if (activeDepartments > 0) {
          const activeNames = departments
            .filter((d: any) => d.status === 'active')
            .map((d: any) => d.name)
            .slice(0, 3)
            .join(', ');
          
          notifications.push({
            id: `agents-active-${Date.now()}`,
            title: 'Agents Working',
            message: `${activeDepartments} department${activeDepartments > 1 ? 's' : ''} active: ${activeNames}`,
            type: 'info',
            timestamp: new Date().toISOString(),
            read: false,
            source: 'Agent System'
          });
        }
      }
    } catch (agentsError) {
      console.error('Failed to fetch agents:', agentsError);
    }
    
    // Sort notifications by timestamp (newest first)
    notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return NextResponse.json({ 
      notifications,
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length
    });
  } catch (error: any) {
    console.error('Notifications error:', error);
    return NextResponse.json(
      { 
        notifications: [],
        total: 0,
        unread: 0,
        error: error.message 
      },
      { status: 500 }
    );
  }
}