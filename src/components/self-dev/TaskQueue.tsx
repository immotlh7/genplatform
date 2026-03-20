'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FileText, CheckCircle, XCircle, Clock, AlertCircle, Square, Check, X, Edit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Task {
  taskId: string;
  taskNumber: number;
  originalDescription: string;
  status: 'pending' | 'executing' | 'done' | 'failed' | 'skipped';
  approved: boolean;
  rewritten: boolean;
  microTasks: any[];
}

interface Message {
  messageNumber: number;
  summary: string;
  originalContent: string;
  tasks: Task[];
}

interface TaskQueue {
  fileId: string;
  fileName: string;
  totalMessages: number;
  totalMicroTasks: number;
  messages: Message[];
  hasApprovedTasks?: boolean;
}

export function TaskQueue() {
  const [queues, setQueues] = useState<TaskQueue[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [rewriting, setRewriting] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    loadQueues();
    const interval = setInterval(loadQueues, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadQueues = async () => {
    try {
      // Get list of queue files
      const response = await fetch('/api/self-dev/status');
      if (response.ok) {
        const data = await response.json();
        if (data.overallProgress.filesTotal > 0) {
          // Load actual queue data (in production, this would be a proper API)
          // For now, using the uploaded file data
          const files = await fetch('/api/self-dev/queues').catch(() => null);
          if (files && files.ok) {
            const queuesData = await files.json();
            setQueues(queuesData);
          }
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load queues:', error);
      setLoading(false);
    }
  };

  const handleRewrite = async (fileId: string, messageNumber: number) => {
    setRewriting(`${fileId}-${messageNumber}`);
    
    try {
      const response = await fetch('/api/self-dev/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, messageNumber })
      });
      
      if (response.ok) {
        // Reload queues to show rewritten tasks
        await loadQueues();
      }
    } catch (error) {
      console.error('Rewrite error:', error);
    } finally {
      setRewriting(null);
    }
  };

  const handleApprove = async (fileId: string, messageNumber: number, approved: boolean, scope: 'message' | 'all' = 'message') => {
    setApproving(`${fileId}-${messageNumber}`);
    
    try {
      const response = await fetch('/api/self-dev/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, messageNumber, approved, scope })
      });
      
      if (response.ok) {
        await loadQueues();
      }
    } catch (error) {
      console.error('Approval error:', error);
    } finally {
      setApproving(null);
    }
  };

  const toggleFile = (fileId: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
      // Auto-expand first file
      if (queues.length > 0) {
        expandedMessages.clear();
        // Auto-expand all messages
        queues[0].messages.forEach(msg => {
          expandedMessages.add(`${fileId}-${msg.messageNumber}`);
        });
      }
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
        const isExpanded = expandedFiles.has(queue.fileId) || true; // Auto-expand
        const approvedMessages = queue.messages.filter(m => 
          m.tasks.some(t => t.approved)
        ).length;

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
              <div className="flex items-center gap-2">
                {approvedMessages > 0 && (
                  <Badge variant="default" className="text-xs">
                    {approvedMessages} approved
                  </Badge>
                )}
                <span className="text-xs text-gray-500">
                  {queue.totalMessages} msgs
                </span>
              </div>
            </div>

            {/* Messages */}
            {isExpanded && queue.messages.length > 0 && (
              <div className="ml-6 mt-1 space-y-3">
                {queue.messages.map(message => {
                  const messageId = `${queue.fileId}-${message.messageNumber}`;
                  const isMessageExpanded = expandedMessages.has(messageId) || true; // Auto-expand
                  const isRewriting = rewriting === messageId;
                  const isApproving = approving === messageId;
                  const allTasksRewritten = message.tasks.every(t => t.rewritten);
                  const hasApprovedTasks = message.tasks.some(t => t.approved);

                  return (
                    <div key={messageId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      {/* Message Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                          onClick={() => toggleMessage(messageId)}
                        >
                          <span className="text-sm font-medium">📨 Message {message.messageNumber}</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {message.summary}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({message.tasks.length} tasks)
                          </span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {hasApprovedTasks && (
                            <Badge variant="default" className="text-xs">
                              Approved
                            </Badge>
                          )}
                          
                          {!allTasksRewritten && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleRewrite(queue.fileId, message.messageNumber)}
                              disabled={isRewriting}
                            >
                              {isRewriting ? 'Rewriting...' : 'Rewrite Tasks'}
                            </Button>
                          )}
                          
                          {allTasksRewritten && !hasApprovedTasks && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs"
                                onClick={() => handleApprove(queue.fileId, message.messageNumber, true)}
                                disabled={isApproving}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                onClick={() => handleApprove(queue.fileId, message.messageNumber, false)}
                                disabled={isApproving}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Tasks */}
                      {isMessageExpanded && (
                        <div className="space-y-2">
                          {message.tasks.map(task => (
                            <div key={task.taskId} className="ml-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="flex items-start gap-2">
                                <Square className="h-3 w-3 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs">
                                    <span className="font-medium">Task {task.taskNumber}:</span> {task.originalDescription}
                                  </p>
                                  
                                  {/* Micro-tasks */}
                                  {task.microTasks && task.microTasks.length > 0 && (
                                    <div className="mt-2 ml-4 space-y-1">
                                      <p className="text-xs font-medium text-green-600 dark:text-green-400">Rewritten as:</p>
                                      {task.microTasks.map((micro: any, idx: number) => (
                                        <div key={micro.id} className="text-xs text-gray-600 dark:text-gray-400 pl-2">
                                          <span className="font-medium">{idx + 1}.</span> {micro.filePath} | {micro.change}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Approve All Button */}
                {queue.messages.some(m => m.tasks.every(t => t.rewritten) && !m.tasks.some(t => t.approved)) && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="default"
                      onClick={() => handleApprove(queue.fileId, 1, true, 'all')}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve All Messages
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}