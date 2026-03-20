'use client';

import { useState, useEffect, useRef } from 'react';
import { Hammer, Send, FileText, Settings, CheckCircle, XCircle, RefreshCw, Package, Brain, Clock, AlertCircle, Upload, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExecutionStatus {
  currentFile?: { id: string; name: string; progress: number };
  currentMessage?: { number: number; title: string };
  currentTask?: { number: number; description: string; status: string };
  currentBatch?: { position: number; total: number };
  log: string[];
  overallProgress: {
    filesTotal: number;
    filesDone: number;
    messagesTotal: number;
    messagesDone: number;
    tasksTotal: number;
    tasksDone: number;
    percentage: number;
  };
  contextEstimate: number;
  status: 'idle' | 'analyzing' | 'executing' | 'building' | 'paused' | 'error';
  elapsedTime: number;
}

interface ExecutionMonitorProps {
  onRefresh?: () => void;
}

export function ExecutionMonitor({ onRefresh }: ExecutionMonitorProps) {
  const [status, setStatus] = useState<ExecutionStatus | null>(null);
  const [autoscroll, setAutoscroll] = useState(true);
  const [queues, setQueues] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoscroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [status?.log, autoscroll]);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/self-dev/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        
        // Also load queue data to check for review mode
        if (data.overallProgress.filesTotal > 0) {
          const queueResponse = await fetch('/api/self-dev/queues').catch(() => null);
          if (queueResponse && queueResponse.ok) {
            const queuesData = await queueResponse.json();
            setQueues(queuesData);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const getLogIcon = (entry: string) => {
    if (entry.includes('📤')) return <Send className="h-4 w-4 text-blue-500" />;
    if (entry.includes('📝')) return <FileText className="h-4 w-4 text-gray-500" />;
    if (entry.includes('⚙️')) return <Settings className="h-4 w-4 text-purple-500 animate-spin" />;
    if (entry.includes('✅')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (entry.includes('❌')) return <XCircle className="h-4 w-4 text-red-500" />;
    if (entry.includes('🔄')) return <RefreshCw className="h-4 w-4 text-orange-500" />;
    if (entry.includes('📦')) return <Package className="h-4 w-4 text-indigo-500" />;
    if (entry.includes('🧠')) return <Brain className="h-4 w-4 text-pink-500" />;
    if (entry.includes('⏸️')) return <Clock className="h-4 w-4 text-gray-400" />;
    return <AlertCircle className="h-4 w-4 text-gray-400" />;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0 
      ? `${hours}h ${minutes}m`
      : minutes > 0 
      ? `${minutes}m ${secs}s`
      : `${secs}s`;
  };

  if (!status) {
    return (
      <div className="flex items-center justify-center h-full">
        <Clock className="h-8 w-8 text-gray-400 animate-pulse" />
      </div>
    );
  }

  // Check if in review mode (has rewritten tasks but not executing)
  const hasRewrittenTasks = queues.some(q => 
    q.messages?.some((m: any) => m.tasks?.some((t: any) => t.rewritten))
  );
  const hasApprovedTasks = queues.some(q => 
    q.messages?.some((m: any) => m.tasks?.some((t: any) => t.approved))
  );
  const isInReviewMode = hasRewrittenTasks && status.status === 'idle' && !hasApprovedTasks;

  // Idle state (no files)
  if (status.status === 'idle' && status.overallProgress.tasksTotal === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <Upload className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
        <h3 className="text-lg font-medium mb-2">Upload a task file to begin</h3>
        <p className="text-sm text-center max-w-md">
          Drop a .md file in the left panel to start the self-development process.
          The Orchestrator will analyze it and break it down into micro-tasks.
        </p>
      </div>
    );
  }

  // Review mode
  if (isInReviewMode) {
    return (
      <div className="space-y-4 h-full flex flex-col">
        <Card className="border-2 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-base">Review Mode</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">
                Awaiting Approval
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The Orchestrator has rewritten tasks as ultra-precise micro-tasks.
              Review the rewritten tasks in the left panel and approve them to begin execution.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Step 1:</span>
                <span className="text-green-600">✓ File uploaded and analyzed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Step 2:</span>
                <span className="text-green-600">✓ Tasks rewritten as micro-tasks</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Step 3:</span>
                <span className="text-amber-600">⚠ Awaiting your approval</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="font-medium">Step 4:</span>
                <span>Execution will begin after approval</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base">How to Proceed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Review Micro-Tasks</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Check the left panel to see how each original task has been broken down into specific file changes.
                  Each micro-task shows exactly which file to edit and what to change.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">Approve or Reject</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click "Approve" on individual messages or "Approve All Messages" to accept the rewritten tasks.
                  You can also reject and request a new rewrite if needed.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">Start Execution</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Once approved, the Start button will activate. Click it to begin sending micro-tasks to the Developer agent.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Normal execution mode
  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Current Task Card */}
      {status.currentTask && status.status !== 'idle' && (
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hammer className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">
                  Task {status.currentTask.number}/{status.overallProgress.tasksTotal}
                </CardTitle>
              </div>
              <Badge variant={status.status === 'executing' ? 'default' : 'secondary'} className="text-xs">
                {status.status === 'executing' ? 'Developer working...' : status.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="font-medium text-sm mb-2">{status.currentTask.description}</p>
            
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              {status.currentFile && (
                <div><span className="font-medium">File:</span> {status.currentFile.name}</div>
              )}
              {status.currentMessage && (
                <div><span className="font-medium">Message {status.currentMessage.number}:</span> {status.currentMessage.title}</div>
              )}
              {status.currentBatch && (
                <div>
                  <span className="font-medium">Batch:</span> {status.currentBatch.position}/{status.currentBatch.total}
                  {status.currentBatch.position === status.currentBatch.total && 
                    <span className="ml-2 text-purple-600">(build after this task)</span>
                  }
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Log */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Log</CardTitle>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs">
                <Switch
                  checked={autoscroll}
                  onCheckedChange={setAutoscroll}
                  className="scale-75"
                />
                Auto-scroll
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full w-full p-4" ref={scrollRef}>
            <div className="space-y-1.5 font-mono text-xs">
              {status.log.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  {hasApprovedTasks ? 'Click Start to begin execution' : 'No log entries yet'}
                </p>
              ) : (
                status.log.map((entry, index) => {
                  const [timestamp, ...rest] = entry.split(' | ');
                  const message = rest.join(' | ');
                  
                  return (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-gray-400 whitespace-nowrap text-[10px]">
                        {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
                      </span>
                      {getLogIcon(message)}
                      <span className="flex-1 break-all">{message}</span>
                    </div>
                  );
                })
              )}
              <div ref={logEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}