'use client';

import { useState, useEffect, useRef } from 'react';
import { Hammer, Send, FileText, Settings, CheckCircle, XCircle, RefreshCw, Package, Brain, Clock, AlertCircle } from 'lucide-react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 1000); // Refresh every second
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

  const estimateRemaining = () => {
    if (!status || status.overallProgress.tasksDone === 0) return null;
    const rate = status.overallProgress.tasksDone / status.elapsedTime;
    const remaining = (status.overallProgress.tasksTotal - status.overallProgress.tasksDone) / rate;
    return formatTime(Math.round(remaining));
  };

  if (!status) {
    return (
      <div className="flex items-center justify-center h-96">
        <Clock className="h-8 w-8 text-gray-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Task Card */}
      {status.currentTask && (
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hammer className="h-6 w-6 text-blue-600" />
                <CardTitle>
                  Task {status.currentTask.number}/{status.overallProgress.tasksTotal}
                </CardTitle>
              </div>
              <Badge variant={status.status === 'executing' ? 'default' : 'secondary'}>
                {status.status === 'executing' ? 'Developer working...' : status.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-lg">{status.currentTask.description}</p>
              </div>
              
              {status.currentFile && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">File:</span> {status.currentFile.name}
                </div>
              )}
              
              {status.currentMessage && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Message {status.currentMessage.number}:</span> {status.currentMessage.title}
                </div>
              )}
              
              {status.currentBatch && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Execution Log</CardTitle>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={autoscroll}
                  onCheckedChange={setAutoscroll}
                />
                Auto-scroll
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full rounded-md border p-4" ref={scrollRef}>
            <div className="space-y-2 font-mono text-xs">
              {status.log.length === 0 ? (
                <p className="text-gray-500">No log entries yet</p>
              ) : (
                status.log.map((entry, index) => {
                  const [timestamp, ...rest] = entry.split(' | ');
                  const message = rest.join(' | ');
                  
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-gray-500 whitespace-nowrap">{timestamp}</span>
                      {getLogIcon(message)}
                      <span className="flex-1">{message}</span>
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