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

interface TaskQueue {
  fileName: string;
  autoMode: boolean;
  batches?: {
    id: string;
    tasks: {
      id: string;
      description: string;
      status?: string;
      approved?: boolean;
      retryCount?: number;
    }[];
  }[];
}

export function ExecutionMonitor({ onRefresh }: ExecutionMonitorProps) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [queue, setQueue] = useState<TaskQueue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (autoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  const loadData = async () => {
    try {
      // Load status/queue
      const statusResponse = await fetch('/api/self-dev/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setQueue(statusData.queue);
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

  const calculateStats = () => {
    let totalTasks = 0;
    let approvedTasks = 0;
    let executingTasks = 0;
    let doneTasks = 0;
    let failedTasks = 0;
    let currentExecutingTask = null;

    if (queue?.batches) {
      queue.batches.forEach(batch => {
        batch.tasks.forEach(task => {
          totalTasks++;
          if (task.approved) approvedTasks++;
          if (task.status === 'executing') {
            executingTasks++;
            currentExecutingTask = task;
          }
          if (task.status === 'done') doneTasks++;
          if (task.status === 'failed' || task.status === 'skipped') failedTasks++;
        });
      });
    }

    return { totalTasks, approvedTasks, executingTasks, doneTasks, failedTasks, currentExecutingTask };
  };

  const stats = calculateStats();
  const isExecuting = stats.executingTasks > 0;
  const isReviewMode = stats.approvedTasks > 0 && stats.executingTasks === 0 && stats.doneTasks < stats.approvedTasks;

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
      case 'developer_message': return 'text-gray-300';
      default: return 'text-gray-400';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400">
        <XCircle className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg mb-2">{error}</p>
        <button 
          onClick={loadData}
          className="text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (!queue) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg mb-2">No active execution</p>
        <p className="text-sm opacity-75">Upload and analyze a task file to begin</p>
      </div>
    );
  }

  // Review mode
  if (isReviewMode) {
    const pendingTasks = stats.approvedTasks - stats.doneTasks;
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-yellow-400">✅ Ready to Execute</h3>
          <Badge variant="default" className="bg-green-600">
            {pendingTasks} tasks approved
          </Badge>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="bg-green-900/20 p-8 rounded-lg border border-green-700/50">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-green-300 mb-2">
                {pendingTasks} tasks approved and ready
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Click the "Start Execution" button above to begin processing
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                  <div className="text-gray-400">Total Tasks</div>
                  <div className="text-xl font-bold">{stats.totalTasks}</div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                  <div className="text-gray-400">Approved</div>
                  <div className="text-xl font-bold text-green-400">{stats.approvedTasks}</div>
                </div>
              </div>
            </div>
            
            {queue.autoMode && (
              <Badge variant="outline" className="border-blue-600 text-blue-400">
                Auto-mode enabled - will process continuously
              </Badge>
            )}
          </div>
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
          {queue.autoMode && (
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
          <div className="text-lg font-bold text-green-400">{stats.doneTasks}</div>
        </div>
        <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-400">Running</div>
          <div className="text-lg font-bold text-blue-400">{stats.executingTasks}</div>
        </div>
        <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-400">Failed</div>
          <div className="text-lg font-bold text-red-400">{stats.failedTasks}</div>
        </div>
      </div>

      {/* Current Task */}
      {stats.currentExecutingTask && (
        <div className="mb-4">
          <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-700/50">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-300">
                  Executing: {stats.currentExecutingTask.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Task ID: {stats.currentExecutingTask.id}
                  {stats.currentExecutingTask.retryCount && stats.currentExecutingTask.retryCount > 0 && (
                    <span className="ml-2 text-yellow-400">
                      (Retry {stats.currentExecutingTask.retryCount}/3)
                    </span>
                  )}
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
        
        <ScrollArea ref={scrollAreaRef} className="h-full rounded-lg bg-gray-900/50 border border-gray-700">
          <div className="p-4 space-y-1">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs yet</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <span className="text-gray-500 font-mono whitespace-nowrap">
                    {formatTime(log.timestamp)}
                  </span>
                  {getLogIcon(log.type)}
                  <span className={`flex-1 break-words ${getLogColor(log.type)}`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Progress Bar */}
      {stats.totalTasks > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Overall Progress</span>
            <span className="text-gray-300">
              {stats.doneTasks} / {stats.approvedTasks} tasks 
              ({stats.approvedTasks > 0 ? Math.round((stats.doneTasks / stats.approvedTasks) * 100) : 0}%)
            </span>
          </div>
          <Progress 
            value={stats.approvedTasks > 0 ? (stats.doneTasks / stats.approvedTasks) * 100 : 0} 
            className="h-2" 
          />
        </div>
      )}
    </div>
  );
}