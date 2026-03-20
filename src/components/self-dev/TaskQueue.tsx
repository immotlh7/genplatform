'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FileText, CheckCircle, XCircle, Clock, AlertCircle, SkipForward, Square } from 'lucide-react';
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

export function TaskQueue() {
  const [queues, setQueues] = useState<TaskQueue[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueues();
    const interval = setInterval(loadQueues, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadQueues = async () => {
    try {
      const response = await fetch('/api/self-dev/status');
      if (response.ok) {
        const data = await response.json();
        // TODO: Fetch actual queue data from API
        // For now, check if there are files
        if (data.overallProgress.filesTotal > 0) {
          // Mock some queue data for testing
          setQueues([{
            fileId: 'test_file',
            fileName: 'PRIORITY-1.md',
            totalMessages: data.overallProgress.messagesTotal || 16,
            totalMicroTasks: data.overallProgress.tasksTotal || 127,
            messages: []
          }]);
        }
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
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'executing':
        return <Clock className="h-3 w-3 text-amber-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'skipped':
        return <SkipForward className="h-3 w-3 text-gray-500" />;
      default:
        return <Square className="h-3 w-3 text-gray-400" />;
    }
  };

  const calculateProgress = (tasks: any[]) => {
    const done = tasks.filter(t => t.status === 'done').length;
    return (done / tasks.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Clock className="h-6 w-6 text-gray-400 animate-pulse" />
      </div>
    );
  }

  if (queues.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">No files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {queues.map(queue => {
        const isExpanded = expandedFiles.has(queue.fileId);
        const fileProgress = queue.messages.length > 0 
          ? calculateProgress(queue.messages.flatMap(m => m.microTasks))
          : 0;

        return (
          <div key={queue.fileId} className="text-sm">
            {/* File Header */}
            <div
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => toggleFile(queue.fileId)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
              )}
              <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="font-medium truncate flex-1">{queue.fileName}</span>
              <span className="text-xs text-gray-500">
                {queue.totalMessages} msgs, {queue.totalMicroTasks} tasks
              </span>
            </div>

            {/* Messages */}
            {isExpanded && queue.messages.length > 0 && (
              <div className="ml-6 mt-1 space-y-1">
                {queue.messages.map(message => {
                  const messageId = `${queue.fileId}-${message.messageNumber}`;
                  const isMessageExpanded = expandedMessages.has(messageId);

                  return (
                    <div key={messageId}>
                      {/* Message Header */}
                      <div
                        className="flex items-center gap-2 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => toggleMessage(messageId)}
                      >
                        {isMessageExpanded ? (
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-gray-400" />
                        )}
                        <span className="text-xs">📨 Message {message.messageNumber}:</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                          {message.summary}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({message.microTasks.length} tasks)
                        </span>
                      </div>

                      {/* Tasks */}
                      {isMessageExpanded && (
                        <div className="ml-6 space-y-0.5">
                          {message.microTasks.map((task, idx) => (
                            <div
                              key={task.taskId}
                              className="flex items-center gap-2 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-xs"
                            >
                              {getStatusIcon(task.status)}
                              <span className="text-gray-500">Task {idx + 1}:</span>
                              <span className="truncate flex-1">{task.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Show placeholder if no messages loaded yet */}
            {isExpanded && queue.messages.length === 0 && (
              <div className="ml-6 mt-1 text-xs text-gray-400">
                Loading task details...
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}