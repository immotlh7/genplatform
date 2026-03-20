'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, CheckCircle, XCircle, Clock, AlertCircle, FileText, Loader2, Zap, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ExecutionMonitorProps {
  onRefresh?: () => void;
}

interface ExecutionLog {
  timestamp: string;
  type: string;
  message: string;
  taskId?: string;
}

export function ExecutionMonitor({ onRefresh }: ExecutionMonitorProps) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (autoScroll && !userScrolled && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, userScrolled]);

  const loadData = async () => {
    try {
      // Load status including current task
      const statusResponse = await fetch('/api/self-dev/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStatus(statusData);
        setError(null);
        setIsLoading(false);
        if (onRefresh) onRefresh();
      }

      // Load logs
      const logsResponse = await fetch('/api/self-dev/logs');
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        if (Array.isArray(logsData)) {
          setLogs(logsData);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load execution data');
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'task_sent': return <Zap className="h-3 w-3 text-blue-400" />;
      case 'task_done': return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'task_failed': return <XCircle className="h-3 w-3 text-red-400" />;
      case 'build': return <RefreshCw className="h-3 w-3 text-yellow-400" />;
      case 'reset': return <AlertCircle className="h-3 w-3 text-purple-400" />;
      case 'error': return <XCircle className="h-3 w-3 text-red-400" />;
      case 'api_limit': return <Clock className="h-3 w-3 text-orange-400" />;
      case 'developer_message': return <FileText className="h-3 w-3 text-purple-400" />;
      default: return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'task_sent': return 'text-blue-300';
      case 'task_done': return 'text-green-300';
      case 'task_failed': return 'text-red-300';
      case 'build': return 'text-yellow-300';
      case 'reset': return 'text-purple-300';
      case 'error': return 'text-red-300';
      case 'api_limit': return 'text-orange-300';
      case 'developer_message': return 'text-purple-300';
      default: return 'text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const stats = status?.stats || {
    totalTasks: 0,
    completedTasks: 0,
    executingTasks: 0,
    approvedTasks: 0,
    pendingTasks: 0,
    skippedTasks: 0
  };
  
  const currentTask = status?.currentTask;
  const isExecuting = stats.executingTasks > 0;

  // Empty queue state
  if (stats.totalTasks === 0 && !stats.approvedTasks && !stats.executingTasks) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Zap className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No Approved Tasks</p>
          <p className="text-sm text-gray-500">Approve tasks in the Task Queue to begin execution</p>
        </div>
      </div>
    );
  }

  // Execution display
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {isExecuting ? '🔨 Execution in Progress' : '📊 Execution Log'}
        </h3>
        <div className="flex items-center gap-2">
          {isExecuting && (
            <Badge variant="default" className="bg-blue-600 animate-pulse">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Executing
            </Badge>
          )}
          {status?.config?.autoMode && (
            <Badge variant="outline" className="text-xs">Auto-mode</Badge>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-400">Total</div>
          <div className="text-lg font-bold">{stats.totalTasks}</div>
        </div>
        <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-400">Done</div>
          <div className="text-lg font-bold text-green-400">{stats.completedTasks}</div>
        </div>
        <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-400">Running</div>
          <div className="text-lg font-bold text-blue-400">{stats.executingTasks}</div>
        </div>
        <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-400">Pending</div>
          <div className="text-lg font-bold text-gray-400">{stats.totalTasks - stats.completedTasks - stats.executingTasks}</div>
        </div>
      </div>

      {/* Current Task */}
      {currentTask && currentTask.task?.status === 'executing' && (
        <div className="mb-4">
          <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-700/50">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-300">
                  Task {currentTask.task.taskNumber}: {currentTask.task.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Message: {currentTask.messageTitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-400">Live Logs</h4>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-xs px-2 py-1 rounded ${
              autoScroll ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            Auto-scroll {autoScroll ? 'ON' : 'OFF'}
          </button>
        </div>
        <div
          ref={logsContainerRef}
          className="h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
          onScroll={(e) => {
            const el = e.currentTarget;
            const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
            setUserScrolled(!atBottom);
            if (atBottom) setAutoScroll(true);
          }}
        >
          <div className="space-y-1 pr-2">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No execution logs yet. Approve tasks to begin.
              </p>
            ) : (
              [...logs].reverse().map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 py-1 px-2 hover:bg-gray-800/30 rounded text-xs"
                >
                  <span className="text-gray-500 font-mono flex-shrink-0 w-16">
                    {formatTime(log.timestamp)}
                  </span>
                  {getLogIcon(log.type)}
                  <span className={`flex-1 break-all ${getLogColor(log.type)}`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {stats.totalTasks > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Overall Progress</span>
            <span className="text-gray-300">
              {stats.completedTasks} / {stats.totalTasks} tasks 
              ({Math.round((stats.completedTasks / stats.totalTasks) * 100)}%)
            </span>
          </div>
          <Progress 
            value={(stats.completedTasks / stats.totalTasks) * 100} 
            className="h-2" 
          />
        </div>
      )}
    </div>
  );
}