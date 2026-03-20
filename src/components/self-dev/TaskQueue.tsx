'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FileText, CheckCircle, XCircle, Clock, AlertCircle, SkipForward } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TaskQueue {
  fileId: string;
  fileName: string;
  totalMessages: number;
  totalMicroTasks: number;
  messages: Array<{
    messageNumber: number;
    summary: string;
    microTasks: Array<{
      taskId: string;
      status: 'pending' | 'executing' | 'done' | 'failed' | 'skipped';
      description: string;
      filePath: string;
      specificChanges?: string;
    }>;
  }>;
}

interface TaskQueueProps {
  onTaskSelect?: (task: any) => void;
}

export function TaskQueue({ onTaskSelect }: TaskQueueProps) {
  const [queues, setQueues] = useState<TaskQueue[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueues();
    const interval = setInterval(loadQueues, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const loadQueues = async () => {
    try {
      const response = await fetch('/api/self-dev/status');
      if (response.ok) {
        const data = await response.json();
        // In a real implementation, we'd fetch actual queue data
        // For now, using mock data structure
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load queues:', error);
      setLoading(false);
    }
  };

  const toggleFile = (fileId: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedFiles(newExpanded);
  };

  const toggleMessage = (messageId: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'executing':
        return <Clock className="h-4 w-4 text-amber-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTaskColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      case 'executing':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200';
      case 'failed':
        return 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      case 'skipped':
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const calculateProgress = (tasks: any[]) => {
    const done = tasks.filter(t => t.status === 'done').length;
    return (done / tasks.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Clock className="h-8 w-8 text-gray-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {queues.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No task files uploaded yet</p>
        </div>
      ) : (
        queues.map(queue => {
          const fileProgress = calculateProgress(
            queue.messages.flatMap(m => m.microTasks)
          );
          const isExpanded = expandedFiles.has(queue.fileId);

          return (
            <div key={queue.fileId} className="border border-gray-200 dark:border-gray-700 rounded-lg">
              {/* File Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => toggleFile(queue.fileId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <FileText className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold">{queue.fileName}</h3>
                    <span className="text-sm text-gray-500">
                      {queue.totalMessages} messages · {queue.totalMicroTasks} tasks
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Progress value={fileProgress} className="w-32" />
                    <span className="text-sm font-medium">{Math.round(fileProgress)}%</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {queue.messages.map(message => {
                    const messageId = `${queue.fileId}-${message.messageNumber}`;
                    const messageProgress = calculateProgress(message.microTasks);
                    const isMessageExpanded = expandedMessages.has(messageId);

                    return (
                      <div key={messageId} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                        {/* Message Header */}
                        <div
                          className="px-8 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => toggleMessage(messageId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isMessageExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="font-medium">Message #{message.messageNumber}</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{message.summary}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Progress value={messageProgress} className="w-24" />
                              <span className="text-xs text-gray-500">
                                {message.microTasks.filter(t => t.status === 'done').length}/{message.microTasks.length}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tasks */}
                        {isMessageExpanded && (
                          <div className="px-12 py-2 space-y-1">
                            {message.microTasks.map(task => (
                              <div
                                key={task.taskId}
                                className={`flex items-center gap-3 p-2 rounded text-sm cursor-pointer hover:opacity-80 transition-opacity ${getTaskColor(task.status)}`}
                                onClick={() => onTaskSelect?.(task)}
                              >
                                {getStatusIcon(task.status)}
                                <span className="font-medium">{task.taskId}</span>
                                <span className="flex-1 truncate">{task.description}</span>
                                <span className="text-xs opacity-75">{task.filePath}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}