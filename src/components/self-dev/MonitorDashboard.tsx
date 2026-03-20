'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, CheckCircle, XCircle, AlertTriangle, Clock, 
  Zap, Shield, RefreshCw, TrendingUp, AlertCircle 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface MonitorData {
  status: string;
  health: {
    overall: 'healthy' | 'warning' | 'critical';
    tasksHealth: 'excellent' | 'good' | 'needs_attention';
    lastCheck: string;
  };
  stats: {
    totalMicroTasks: number;
    completedMicroTasks: number;
    failedMicroTasks: number;
    executingMicroTasks: number;
    pendingApproval: number;
    successRate: number;
    totalTasksCompleted: number;
    totalTasksFailed: number;
    totalBuildsSuccessful: number;
    totalBuildsFailed: number;
  };
  activeProjects: string[];
  recentActivity: any[];
  lastActivity: string;
  activeSince: string;
}

export function MonitorDashboard() {
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMonitorData();
    
    if (autoRefresh) {
      const interval = setInterval(loadMonitorData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadMonitorData = async () => {
    try {
      const response = await fetch('/api/self-dev/monitor');
      if (response.ok) {
        const data = await response.json();
        setMonitorData(data);
      }
    } catch (error) {
      console.error('Failed to load monitor data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !monitorData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
      case 'excellent':
        return 'text-green-400 bg-green-900/20';
      case 'good':
        return 'text-blue-400 bg-blue-900/20';
      case 'warning':
      case 'needs_attention':
        return 'text-amber-400 bg-amber-900/20';
      case 'critical':
        return 'text-red-400 bg-red-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_complete':
        return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'task_failed':
        return <XCircle className="h-3 w-3 text-red-400" />;
      case 'build_success':
        return <Zap className="h-3 w-3 text-green-400" />;
      case 'build_failed':
        return <AlertTriangle className="h-3 w-3 text-red-400" />;
      case 'review_passed':
        return <Shield className="h-3 w-3 text-green-400" />;
      case 'review_failed':
        return <AlertCircle className="h-3 w-3 text-amber-400" />;
      default:
        return <Activity className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Health Status Header */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold">Self-Dev Monitor</h3>
            <Badge className={cn("text-xs", getHealthColor(monitorData.health.overall))}>
              {monitorData.health.overall.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Auto-refresh</span>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-600"
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-900/50 rounded p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Success Rate</span>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold">{monitorData.stats.successRate}%</span>
              <Progress 
                value={monitorData.stats.successRate} 
                className="h-1 mt-1"
              />
            </div>
          </div>

          <div className="bg-gray-900/50 rounded p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Executing</span>
              <Zap className="h-4 w-4 text-blue-400" />
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold">{monitorData.stats.executingMicroTasks}</span>
              <p className="text-xs text-gray-500 mt-1">active tasks</p>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Pending Review</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold">{monitorData.stats.pendingApproval}</span>
              <p className="text-xs text-gray-500 mt-1">await approval</p>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Failed Tasks</span>
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold">{monitorData.stats.failedMicroTasks}</span>
              <p className="text-xs text-gray-500 mt-1">need attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Completion Stats */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h4 className="font-medium mb-3">Overall Progress</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Micro-tasks Completed</span>
              <span>{monitorData.stats.completedMicroTasks} / {monitorData.stats.totalMicroTasks}</span>
            </div>
            <Progress 
              value={monitorData.stats.totalMicroTasks > 0 
                ? (monitorData.stats.completedMicroTasks / monitorData.stats.totalMicroTasks) * 100 
                : 0} 
              className="h-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <p className="text-xs text-gray-400">Total Builds</p>
              <p className="text-lg font-bold text-green-400">
                {monitorData.stats.totalBuildsSuccessful}
                <span className="text-xs text-gray-400 font-normal"> successful</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Build Failures</p>
              <p className="text-lg font-bold text-red-400">
                {monitorData.stats.totalBuildsFailed}
                <span className="text-xs text-gray-400 font-normal"> failed</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Projects */}
      {monitorData.activeProjects.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h4 className="font-medium mb-3">Active Projects</h4>
          <div className="flex flex-wrap gap-2">
            {monitorData.activeProjects.map((project, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {project}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h4 className="font-medium mb-3">Recent Activity</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {monitorData.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
          ) : (
            monitorData.recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                {getActivityIcon(activity.type)}
                <div className="flex-1">
                  <p className="text-gray-300">{activity.details}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* System Info */}
      <div className="text-xs text-gray-500 text-center">
        Active since: {new Date(monitorData.activeSince).toLocaleString()} | 
        Last activity: {new Date(monitorData.lastActivity).toLocaleTimeString()}
      </div>
    </div>
  );
}