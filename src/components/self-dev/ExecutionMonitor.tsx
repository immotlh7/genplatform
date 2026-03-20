'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Square, CheckCircle, XCircle, Clock, AlertCircle, FileText, Loader2, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ExecutionMonitorProps {
  onRefresh?: () => void;
}

interface ExecutingTask {
  fileId: string;
  messageNumber: number;
  taskNumber: number;
  taskDescription: string;
  currentMicroTask: number;
  totalMicroTasks: number;
  microTaskDescription: string;
  startedAt: string;
}

export function ExecutionMonitor({ onRefresh }: ExecutionMonitorProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<any>({});
  const [queues, setQueues] = useState<any[]>([]);
  const [executingTasks, setExecutingTasks] = useState<ExecutingTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadStatus();
    loadQueues();
    const interval = setInterval(() => {
      loadStatus();
      loadQueues();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/self-dev/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data || {});
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error('Failed to load status:', error);
      setError('Failed to load status');
    }
  };

  const loadQueues = async () => {
    try {
      const response = await fetch('/api/self-dev/queues');
      if (response.ok) {
        const data = await response.json();
        
        // Ensure data is an array before processing
        if (!Array.isArray(data)) {
          console.error('Queues data is not an array:', data);
          setQueues([]);
          return;
        }
        
        setQueues(data);
        
        // Extract currently executing tasks
        const executing: ExecutingTask[] = [];
        data.forEach((queue: any) => {
          if (!queue.messages || !Array.isArray(queue.messages)) return;
          
          queue.messages.forEach((msg: any) => {
            if (!msg.tasks || !Array.isArray(msg.tasks)) return;
            
            msg.tasks.forEach((task: any) => {
              if (task.status === 'executing' && task.microTasks && Array.isArray(task.microTasks)) {
                const executingMicroTaskIndex = task.microTasks.findIndex((mt: any) => mt.status === 'executing');
                if (executingMicroTaskIndex >= 0) {
                  executing.push({
                    fileId: queue.fileId,
                    messageNumber: msg.messageNumber,
                    taskNumber: task.taskNumber,
                    taskDescription: task.originalDescription || '',
                    currentMicroTask: executingMicroTaskIndex + 1,
                    totalMicroTasks: task.microTasks.length,
                    microTaskDescription: task.microTasks[executingMicroTaskIndex]?.change || '',
                    startedAt: new Date().toISOString()
                  });
                }
              }
            });
          });
        });
        setExecutingTasks(executing);
        
        // Update logs
        const newLogs: string[] = [];
        executing.forEach(task => {
          newLogs.push(`[EXECUTING] Task ${task.taskNumber}: ${task.microTaskDescription} (${task.currentMicroTask}/${task.totalMicroTasks})`);
        });
        if (newLogs.length > 0) {
          setLogs(prev => [...newLogs, ...prev].slice(0, 100)); // Keep last 100 logs
        }
        
        setError(null);
      } else {
        console.error('Failed to fetch queues:', response.status);
        setQueues([]);
      }
    } catch (error) {
      console.error('Failed to load queues:', error);
      setQueues([]);
      setError('Failed to load task queues');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate review status with better error handling
  const calculateReviewStatus = () => {
    let totalTasks = 0;
    let rewrittenTasks = 0;
    let approvedTasks = 0;
    let pendingReview = 0;
    let executingCount = 0;
    let doneCount = 0;
    let failedCount = 0;
    
    if (Array.isArray(queues)) {
      queues.forEach(queue => {
        if (queue.messages && Array.isArray(queue.messages)) {
          queue.messages.forEach((msg: any) => {
            if (msg.tasks && Array.isArray(msg.tasks)) {
              msg.tasks.forEach((task: any) => {
                totalTasks++;
                if (task.rewritten) {
                  rewrittenTasks++;
                  if (task.approved) {
                    approvedTasks++;
                  } else {
                    pendingReview++;
                  }
                }
                if (task.status === 'executing') executingCount++;
                if (task.status === 'done') doneCount++;
                if (task.status === 'failed') failedCount++;
              });
            }
          });
        }
      });
    }
    
    return { totalTasks, rewrittenTasks, approvedTasks, pendingReview, executingCount, doneCount, failedCount };
  };

  const reviewStatus = calculateReviewStatus();
  const isInReviewMode = reviewStatus.pendingReview > 0 || (reviewStatus.rewrittenTasks > 0 && reviewStatus.approvedTasks === 0);
  const isExecuting = reviewStatus.executingCount > 0;

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400">
        <XCircle className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg mb-2">{error}</p>
        <button 
          onClick={() => {
            setError(null);
            loadQueues();
          }}
          className="text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (status.status === 'idle' && queues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg mb-2">Upload a task file to begin</p>
        <p className="text-sm opacity-75">The execution monitor will show progress here</p>
      </div>
    );
  }

  // Review mode
  if (isInReviewMode && !isExecuting) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-yellow-400">📝 Review Mode</h3>
          <Badge variant="default" className="bg-yellow-600">
            {reviewStatus.pendingReview} tasks pending review
          </Badge>
        </div>
        
        <div className="space-y-4">
          {/* Review Status Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Tasks</span>
                <span className="text-2xl font-bold">{reviewStatus.totalTasks}</span>
              </div>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Rewritten</span>
                <span className="text-2xl font-bold text-amber-400">{reviewStatus.rewrittenTasks}</span>
              </div>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Approved</span>
                <span className="text-2xl font-bold text-green-400">{reviewStatus.approvedTasks}</span>
              </div>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Pending Review</span>
                <span className="text-2xl font-bold text-yellow-400">{reviewStatus.pendingReview}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Review Progress</span>
              <span className="text-gray-300">
                {reviewStatus.rewrittenTasks > 0 
                  ? Math.round((reviewStatus.approvedTasks / reviewStatus.rewrittenTasks) * 100) 
                  : 0}%
              </span>
            </div>
            <Progress 
              value={reviewStatus.rewrittenTasks > 0 
                ? (reviewStatus.approvedTasks / reviewStatus.rewrittenTasks) * 100 
                : 0} 
              className="h-2" 
            />
          </div>

          {/* Workflow Steps */}
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h4 className="font-medium mb-3 text-white">Workflow Status</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-300">1. File uploaded and analyzed</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-300">2. Tasks rewritten as micro-tasks</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-400 font-medium">3. Awaiting your approval</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-400">4. Execution will begin after approval</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Review Required</p>
                <p>Please review the rewritten micro-tasks in the Task Files panel. Click "Approve" on each message or use "Approve All" to proceed with execution.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Execution mode display (when tasks are running or complete)
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {isExecuting ? '⚡ Execution Progress' : '📊 Execution Summary'}
        </h3>
        <div className="flex items-center gap-2">
          {isExecuting && (
            <Badge variant="default" className="bg-blue-600 animate-pulse">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {reviewStatus.executingCount} Executing
            </Badge>
          )}
          {status.elapsedTime > 0 && (
            <span className="text-sm text-gray-400">
              {formatTime(status.elapsedTime)}
            </span>
          )}
        </div>
      </div>

      {/* Execution Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Completed</span>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-lg font-bold text-green-400">{reviewStatus.doneCount}</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Executing</span>
            <div className="flex items-center gap-1">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              <span className="text-lg font-bold text-blue-400">{reviewStatus.executingCount}</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Failed</span>
            <div className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-lg font-bold text-red-400">{reviewStatus.failedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Currently Executing Tasks */}
      {executingTasks.length > 0 && (
        <div className="mb-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-400">Currently Executing:</h4>
          {executingTasks.map((task, idx) => (
            <div key={idx} className="bg-blue-900/20 p-3 rounded-lg border border-blue-700/50">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-300">
                    Task {task.taskNumber}: {task.taskDescription}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Micro-task {task.currentMicroTask}/{task.totalMicroTasks}: {task.microTaskDescription}
                  </p>
                  <div className="mt-2">
                    <Progress 
                      value={(task.currentMicroTask / task.totalMicroTasks) * 100} 
                      className="h-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Execution Log */}
      <ScrollArea className="flex-1 rounded-lg bg-gray-900/50 border border-gray-700 p-4">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{isExecuting ? 'Waiting for task updates...' : 'No recent execution activity'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="text-xs font-mono text-gray-300 break-all">
                <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Overall Progress */}
      {reviewStatus.totalTasks > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Overall Progress</span>
            <span className="text-gray-300">
              {reviewStatus.doneCount} / {reviewStatus.totalTasks} tasks 
              ({Math.round((reviewStatus.doneCount / reviewStatus.totalTasks) * 100)}%)
            </span>
          </div>
          <Progress value={(reviewStatus.doneCount / reviewStatus.totalTasks) * 100} className="h-2" />
        </div>
      )}
    </div>
  );
}