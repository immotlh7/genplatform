'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronDown, ChevronLeft, FileText, CheckCircle, XCircle, 
  Clock, AlertCircle, Loader2, PlayCircle, PauseCircle,
  RefreshCw, Check, X, Edit3, Zap, Trash2, SkipForward, RotateCcw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QueueManager } from './QueueManager';
import { RewriteApprove } from './RewriteApprove';

interface MicroTask {
  id: string;
  description: string;
  filePath: string;
  change: string;
  status?: 'pending' | 'executing' | 'done' | 'failed';
}

interface Task {
  taskId: string;
  taskNumber: number;
  originalDescription: string;
  status: 'pending' | 'rewriting' | 'review' | 'approved' | 'executing' | 'done' | 'failed' | 'skipped';
  approved: boolean;
  rewritten: boolean;
  microTasks?: MicroTask[];
  completedIcon?: string;
  executionResult?: {
    success: boolean;
    message?: string;
    completedAt?: string;
  };
}

interface Message {
  messageNumber: number;
  summary: string;
  originalContent?: string;
  tasks?: Task[];
  microTasks?: any[]; // Old format compatibility
  commitMessage?: string;
}

interface TaskQueue {
  fileId: string;
  fileName: string;
  totalMessages: number;
  totalTasks?: number;
  totalMicroTasks?: number;
  autoMode?: boolean;
  messages?: Message[];
  batches?: any[]; // For old format compatibility
}

interface TaskQueueProps {
  className?: string;
  hideActions?: boolean;
}

export function TaskQueue({ className = '', hideActions = false }: TaskQueueProps) {
  const [queues, setQueues] = useState<TaskQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<{ fileId: string; messageNumber: number } | null>(null);
  const [showManager, setShowManager] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/self-dev/queues');
      if (!response.ok) {
        throw new Error('Failed to fetch queues');
      }
      const data = await response.json();
      setQueues(data.queues || []);
      setError(null);
      
      // Auto-expand first file if none expanded
      if (data.queues && data.queues.length > 0 && expandedFiles.size === 0) {
        setExpandedFiles(new Set([data.queues[0].fileId]));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRewrite = async (fileId: string, messageNumber: number) => {
    const response = await fetch('/api/self-dev/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, messageNumber, forceRewrite: true })
    });
    
    if (!response.ok) {
      throw new Error('Failed to rewrite tasks');
    }
  };

  const handleApprove = async (fileId: string, messageNumber: number) => {
    const response = await fetch('/api/self-dev/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, messageNumber, approved: true })
    });
    
    if (!response.ok) {
      throw new Error('Failed to approve tasks');
    }
  };

  const handleDeleteMessage = async (fileId: string, messageNumber: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const response = await fetch('/api/self-dev/delete-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, messageNumber, forceRewrite: true })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete message');
      }
      
      await fetchQueues();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Failed to delete message');
    }
  };

  const toggleFile = (fileId: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const toggleMessage = (fileId: string, messageNumber: number) => {
    const key = `${fileId}-${messageNumber}`;
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const getTaskStatus = (task: Task): string => {
    if (task.completedIcon === '✅') return 'done';
    if (task.executionResult?.success) return 'done';
    if (task.executionResult?.success === false) return 'failed';
    
    // Check if task has micro-tasks
    if (task.microTasks && task.microTasks.length > 0) {
      const allDone = task.microTasks.every(mt => mt.status === 'done');
      const anyFailed = task.microTasks.some(mt => mt.status === 'failed');
      const anyExecuting = task.microTasks.some(mt => mt.status === 'executing');
      
      if (allDone) return 'done';
      if (anyFailed) return 'failed';
      if (anyExecuting) return 'executing';
      if (task.approved) return 'approved';
    }
    
    return task.status || 'pending';
  };

  const getMessageStatus = (message: Message): string => {
    if (!message.tasks || message.tasks.length === 0) return 'pending';
    
    const allDone = message.tasks.every(task => {
      const status = getTaskStatus(task);
      return status === 'done';
    });
    
    const anyFailed = message.tasks.some(task => {
      const status = getTaskStatus(task);
      return status === 'failed';
    });
    
    const anyExecuting = message.tasks.some(task => {
      const status = getTaskStatus(task);
      return status === 'executing';
    });
    
    const anyApproved = message.tasks.some(task => {
      const status = getTaskStatus(task);
      return status === 'approved';
    });
    
    const anyReview = message.tasks.some(task => {
      const status = getTaskStatus(task);
      return status === 'review' || task.rewritten;
    });
    
    if (allDone) return 'done';
    if (anyFailed) return 'failed';
    if (anyExecuting) return 'executing';
    if (anyApproved) return 'approved';
    if (anyReview) return 'review';
    
    return 'pending';
  };

  const countMicroTasks = (queue: TaskQueue) => {
    if (!queue.messages) return { total: 0, pending: 0, executing: 0, done: 0, failed: 0 };
    
    let total = 0;
    let pending = 0;
    let executing = 0;
    let done = 0;
    let failed = 0;
    
    queue.messages.forEach(msg => {
      if (msg.tasks) {
        msg.tasks.forEach(task => {
          if (task.microTasks) {
            task.microTasks.forEach(micro => {
              total++;
              switch (micro.status) {
                case 'executing':
                  executing++;
                  break;
                case 'done':
                  done++;
                  break;
                case 'failed':
                  failed++;
                  break;
                default:
                  pending++;
              }
            });
          }
        });
      }
    });
    
    return { total, pending, executing, done, failed };
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'done':
        return <span className="text-green-500">✅</span>;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'executing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'approved':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'review':
        return <Edit3 className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, string> = {
      done: 'bg-green-700 text-green-100',
      failed: 'bg-red-600 text-red-100',
      executing: 'bg-blue-600 text-blue-100 animate-pulse',
      approved: 'bg-blue-700 text-blue-100',
      review: 'bg-yellow-700 text-yellow-100',
      pending: 'bg-gray-700 text-gray-300'
    };
    
    const labels: Record<string, string> = {
      done: '✅ done',
      failed: 'failed',
      executing: 'running',
      approved: 'ready',
      review: 'review',
      pending: 'pending'
    };
    
    return (
      <Badge className={cn("text-[10px] px-1.5 py-0.5", variants[status] || variants.pending)}>
        {labels[status] || status}
      </Badge>
    );
  };

  const navigateMessage = (direction: 'prev' | 'next') => {
    if (!selectedMessage) return;
    
    const queue = queues.find(q => q.fileId === selectedMessage.fileId);
    if (!queue || !queue.messages) return;
    
    const messages = queue.messages.filter(m => m.tasks && m.tasks.length > 0);
    const currentIndex = messages.findIndex(m => m.messageNumber === selectedMessage.messageNumber);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'prev' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(messages.length - 1, currentIndex + 1);
    
    if (newIndex !== currentIndex) {
      const newMessage = messages[newIndex];
      setSelectedMessage({ fileId: selectedMessage.fileId, messageNumber: newMessage.messageNumber });
      setExpandedMessages(prev => {
        const newSet = new Set(prev);
        newSet.add(`${selectedMessage.fileId}-${newMessage.messageNumber}`);
        return newSet;
      });
    }
  };

  if (loading && !refreshing) return <div className="text-center p-4 text-gray-500">Loading task queue...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

  if (queues.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center p-8 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-gray-400">No task files uploaded yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Upload a task file to start processing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Actions */}
      {!hideActions && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Task Queue</h3>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowManager(!showManager)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              Queue Manager
            </Button>
            <Button
              onClick={fetchQueues}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      )}

      {/* Queue Manager Modal */}
      {showManager && (
        <div className="mb-4">
          <QueueManager 
            onClose={() => setShowManager(false)}
            onRefresh={fetchQueues}
          />
        </div>
      )}

      {/* Navigation */}
      {selectedMessage && (
        <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg border border-gray-600/50">
          <Button
            onClick={() => navigateMessage('prev')}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            Previous
          </Button>
          <span className="text-xs text-gray-400">
            Navigate messages with arrow buttons
          </span>
          <Button
            onClick={() => navigateMessage('next')}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            Next
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}

      {/* Task Files */}
      {queues.map(queue => {
        const isExpanded = expandedFiles.has(queue.fileId);
        const messages = (queue.messages || []).filter(m => m.tasks && m.tasks.length > 0);
        const doneMessages = messages.filter(m => getMessageStatus(m) === 'done');
        const failedMessages = messages.filter(m => getMessageStatus(m) === 'failed');
        const executingMessages = messages.filter(m => getMessageStatus(m) === 'executing');
        const approvedMessages = messages.filter(m => getMessageStatus(m) === 'approved');
        const reviewMessages = messages.filter(m => getMessageStatus(m) === 'review');
        
        // Count micro-tasks
        const microTaskStatus = countMicroTasks(queue);
        
        return (
          <div key={queue.fileId} className="bg-gray-700/50 rounded-lg border border-gray-600 overflow-hidden">
            {/* File Header */}
            <div
              className="p-2 cursor-pointer hover:bg-gray-700/70 transition-colors flex items-center justify-between"
              onClick={() => toggleFile(queue.fileId)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="font-medium text-white truncate text-sm">{queue.fileName}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {microTaskStatus.executing > 0 && (
                  <Badge className="text-[10px] bg-blue-600 text-blue-100 animate-pulse">
                    {microTaskStatus.executing} executing
                  </Badge>
                )}
                {doneMessages.length > 0 && (
                  <Badge className="text-[10px] bg-green-700 text-green-100">
                    ✅ {doneMessages.length} done
                  </Badge>
                )}
                {failedMessages.length > 0 && (
                  <Badge className="text-[10px] bg-red-600 text-red-100">
                    {failedMessages.length} failed
                  </Badge>
                )}
                {executingMessages.length > 0 && (
                  <Badge className="text-[10px] bg-blue-600 text-blue-100">
                    {executingMessages.length} running
                  </Badge>
                )}
                {reviewMessages.length > 0 && (
                  <Badge className="text-[10px] bg-yellow-700 text-yellow-100">
                    {reviewMessages.length} review
                  </Badge>
                )}
                {approvedMessages.length > 0 && (
                  <Badge className="text-[10px] bg-blue-700 text-blue-100">
                    {approvedMessages.length} ready
                  </Badge>
                )}
                <span className="text-[10px] text-gray-400">
                  {messages.length} msgs
                </span>
              </div>
            </div>

            {/* File Content */}
            {isExpanded && (
              <div className="border-t border-gray-600/50">
                {/* File Stats */}
                <div className="p-1.5 bg-gray-800/30 text-[10px] text-gray-400 grid grid-cols-3 gap-2 border-b border-gray-600/50">
                  <div>Messages: {queue.totalMessages || messages.length}</div>
                  <div>Tasks: {queue.totalTasks || messages.reduce((sum, m) => sum + (m.tasks?.length || 0), 0)}</div>
                  <div>Micro-tasks: {queue.totalMicroTasks || microTaskStatus.total}</div>
                </div>

                {/* Messages */}
                {messages.map((message, msgIndex) => {
                  const isMessageExpanded = expandedMessages.has(`${queue.fileId}-${message.messageNumber}`);
                  const messageStatus = getMessageStatus(message);
                  const isSelected = selectedMessage?.fileId === queue.fileId && 
                                   selectedMessage?.messageNumber === message.messageNumber;
                  
                  // Calculate sequential display number (skip empty messages)
                  const displayNumber = msgIndex + 1;
                  
                  return (
                    <div 
                      key={message.messageNumber} 
                      className={cn(
                        "border-b border-gray-600/30 last:border-b-0",
                        isSelected && "bg-blue-900/10"
                      )}
                    >
                      {/* Message Header - Single row with all info */}
                      <div>
                        <div
                          className="p-1.5 cursor-pointer hover:bg-gray-700/30 transition-colors"
                          onClick={() => {
                            toggleMessage(queue.fileId, message.messageNumber);
                            setSelectedMessage({ fileId: queue.fileId, messageNumber: message.messageNumber });
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {isMessageExpanded ? (
                              <ChevronDown className="h-3 w-3 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-gray-500" />
                            )}
                            <StatusIcon status={messageStatus} />
                            <span className="text-xs font-medium text-gray-100">
                              Message {displayNumber}
                            </span>
                            {message.summary && (
                              <span className="text-[10px] text-gray-400 font-normal truncate flex-1">
                                {message.summary}
                              </span>
                            )}
                            <div className="flex items-center gap-1 ml-auto">
                              <StatusBadge status={messageStatus} />
                              {!hideActions && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMessage(queue.fileId, message.messageNumber);
                                  }}
                                  className="h-5 px-1"
                                >
                                  <Trash2 className="h-3 w-3 text-red-400" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Rewrite/Approve buttons on separate line */}
                        {message.tasks && message.tasks.length > 0 && messageStatus !== 'done' && messageStatus !== 'executing' && !hideActions && (
                          <div className="px-1.5 py-1 bg-gray-800/30 border-t border-gray-600/30">
                            <RewriteApprove
                              fileId={queue.fileId}
                              messageNumber={message.messageNumber}
                              onRewrite={() => handleRewrite(queue.fileId, message.messageNumber)}
                              onApprove={() => handleApprove(queue.fileId, message.messageNumber)}
                              onRefresh={fetchQueues}
                              disabled={messageStatus === 'executing'}
                            />
                          </div>
                        )}
                      </div>

                      {/* Message Content */}
                      {isMessageExpanded && (
                        <div className="px-2 py-1.5">
                          {/* Original Content */}
                          {message.originalContent && (
                            <div className="mt-1 p-1.5 bg-gray-800/50 rounded text-[10px] text-gray-300 max-h-24 overflow-y-auto">
                              <pre className="whitespace-pre-wrap">{message.originalContent}</pre>
                            </div>
                          )}

                          {/* Tasks */}
                          {message.tasks && message.tasks.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <div className="text-[10px] font-medium text-gray-400 mb-0.5">Tasks:</div>
                              {message.tasks.map((task, taskIndex) => {
                                const taskStatus = getTaskStatus(task);
                                const hasWarning = task.rewritten && !task.approved;
                                
                                return (
                                  <div 
                                    key={task.taskId || taskIndex}
                                    className={cn(
                                      "p-1 bg-gray-800/30 rounded border text-[10px]",
                                      taskStatus === 'done' && "border-green-700/50 bg-green-900/10",
                                      taskStatus === 'failed' && "border-red-700/50 bg-red-900/10",
                                      taskStatus === 'executing' && "border-blue-700/50 bg-blue-900/10 animate-pulse",
                                      taskStatus === 'approved' && "border-blue-600/50",
                                      hasWarning && "border-yellow-600/50",
                                      !hasWarning && taskStatus === 'pending' && "border-gray-700/50"
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-1">
                                      <div className="flex items-start gap-1 flex-1">
                                        <StatusIcon status={taskStatus} />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-1">
                                            <span className="font-medium text-gray-200">
                                              Task {task.taskNumber}
                                            </span>
                                            {hasWarning && (
                                              <AlertCircle className="h-3 w-3 text-yellow-500" />
                                            )}
                                          </div>
                                          <p className="text-gray-400 mt-0.5 leading-relaxed">
                                            {task.originalDescription}
                                          </p>
                                          
                                          {/* Show micro-tasks if any */}
                                          {task.microTasks && task.microTasks.length > 0 && (
                                            <div className="mt-1 space-y-0.5 pl-3 border-l border-gray-700">
                                              {task.microTasks.map((micro, microIndex) => (
                                                <div key={micro.id || microIndex} className="flex items-center gap-1">
                                                  {micro.status === 'done' ? (
                                                    <span className="text-green-500 text-[9px]">✅</span>
                                                  ) : micro.status === 'executing' ? (
                                                    <Loader2 className="h-2.5 w-2.5 text-blue-500 animate-spin" />
                                                  ) : micro.status === 'failed' ? (
                                                    <XCircle className="h-2.5 w-2.5 text-red-500" />
                                                  ) : (
                                                    <Clock className="h-2.5 w-2.5 text-gray-500" />
                                                  )}
                                                  <span className="text-[9px] text-gray-400">
                                                    {micro.filePath}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-0.5">
                                        <StatusBadge status={taskStatus} />
                                      </div>
                                    </div>
                                    
                                    {/* Retry/Skip buttons for failed tasks */}
                                    {!hideActions && taskStatus === 'failed' && (
                                      <div className="flex gap-1 mt-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-5 text-[10px] px-1"
                                          onClick={async () => {
                                            try {
                                              await fetch('/api/self-dev/control', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ action: 'retry' })
                                              });
                                              await fetchQueues();
                                            } catch (err) {
                                              console.error('Retry error:', err);
                                            }
                                          }}
                                        >
                                          <RotateCcw className="h-2.5 w-2.5 mr-0.5" />
                                          Retry
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-5 text-[10px] px-1"
                                          onClick={async () => {
                                            try {
                                              await fetch('/api/self-dev/control', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ action: 'skip' })
                                              });
                                              await fetchQueues();
                                            } catch (err) {
                                              console.error('Skip error:', err);
                                            }
                                          }}
                                        >
                                          <SkipForward className="h-2.5 w-2.5 mr-0.5" />
                                          Skip
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Commit Message */}
                          {message.commitMessage && (
                            <div className="mt-1 p-1 bg-green-900/20 rounded text-[10px]">
                              <span className="text-green-400">Commit:</span>
                              <span className="ml-1 text-gray-300">{message.commitMessage}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}