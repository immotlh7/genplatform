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
  totalMicroTasks: number;
  messages?: Message[];
  createdAt: string;
  status?: string;
}

export function TaskQueue() {
  const [queues, setQueues] = useState<TaskQueue[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rewritingMessage, setRewritingMessage] = useState<string | null>(null);
  const [approvingMessage, setApprovingMessage] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<{fileId: string, messageNumber: number} | null>(null);
  
  useEffect(() => {
    loadQueues();
    const interval = setInterval(loadQueues, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadQueues = async () => {
    try {
      const response = await fetch('/api/self-dev/queues');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setQueues(data);
          setError(null);
        } else {
          setQueues([]);
          setError('Invalid data format received');
        }
      } else {
        setError('Failed to load task queues');
      }
    } catch (error) {
      console.error('Failed to load queues:', error);
      setError('Failed to load task queues');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFile = (fileId: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const toggleMessage = (fileId: string, messageNumber: number) => {
    const key = `${fileId}-${messageNumber}`;
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleRewrite = async (fileId: string, messageNumber: number) => {
    const key = `${fileId}-${messageNumber}`;
    setRewritingMessage(key);
    try {
      const response = await fetch('/api/self-dev/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, messageNumber })
      });
      
      if (response.ok) {
        await loadQueues();
      } else {
        console.error('Failed to rewrite message');
      }
    } catch (error) {
      console.error('Failed to rewrite:', error);
    } finally {
      setRewritingMessage(null);
    }
  };

  const handleApprove = async (fileId: string, messageNumber: number, approved: boolean, taskId: string | 'all') => {
    const key = `${fileId}-${messageNumber}`;
    setApprovingMessage(key);
    try {
      const response = await fetch('/api/self-dev/approve', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, messageNumber, approved, taskId })
      });
      
      if (response.ok) {
        await loadQueues();
      }
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setApprovingMessage(null);
    }
  };

  const handleReject = async (fileId: string, messageNumber: number, taskId: string | 'all') => {
    try {
      const response = await fetch('/api/self-dev/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, messageNumber, taskId })
      });
      
      if (response.ok) {
        await loadQueues();
      }
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const handleDelete = async (fileId: string, messageNumber: number) => {
    if (!confirm('Are you sure you want to delete this message and all its tasks?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/self-dev/delete-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, messageNumber })
      });
      
      if (response.ok) {
        await loadQueues();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getTaskStatus = (task: Task): string => {
    if (task.status === 'done') return 'done';
    if (task.status === 'failed' || task.status === 'skipped') return 'failed';
    if (task.status === 'executing') return 'executing';
    if (task.approved) return 'approved';
    if (task.rewritten) return 'review';
    return 'pending';
  };

  const getMessageStatus = (message: Message): string => {
    if (!message.tasks || message.tasks.length === 0) return 'empty';
    
    const allDone = message.tasks.every(t => t.status === 'done');
    if (allDone) return 'done';
    
    const anyFailed = message.tasks.some(t => t.status === 'failed' || t.status === 'skipped');
    if (anyFailed) return 'failed';
    
    const anyExecuting = message.tasks.some(t => t.status === 'executing');
    if (anyExecuting) return 'executing';
    
    const allApproved = message.tasks.every(t => t.approved);
    if (allApproved) return 'approved';
    
    const allRewritten = message.tasks.every(t => t.rewritten);
    if (allRewritten) return 'review';
    
    return 'pending';
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
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
      executing: 'bg-blue-600 text-blue-100',
      approved: 'bg-blue-700 text-blue-100',
      review: 'bg-yellow-700 text-yellow-100',
      pending: 'bg-gray-700 text-gray-300'
    };
    
    return (
      <Badge className={cn("text-xs", variants[status] || variants.pending)}>
        {status}
      </Badge>
    );
  };

  const navigateMessage = (direction: 'prev' | 'next') => {
    if (!selectedMessage) return;
    
    const queue = queues.find(q => q.fileId === selectedMessage.fileId);
    if (!queue || !queue.messages) return;
    
    const currentIndex = queue.messages.findIndex(m => m.messageNumber === selectedMessage.messageNumber);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'prev' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(queue.messages.length - 1, currentIndex + 1);
    
    if (newIndex !== currentIndex) {
      const newMessage = queue.messages[newIndex];
      setSelectedMessage({ fileId: selectedMessage.fileId, messageNumber: newMessage.messageNumber });
      
      const key = `${selectedMessage.fileId}-${newMessage.messageNumber}`;
      if (!expandedMessages.has(key)) {
        toggleMessage(selectedMessage.fileId, newMessage.messageNumber);
      }
    }
  };

  const getMicroTaskStatus = (queue: TaskQueue) => {
    let total = 0;
    let executing = 0;
    let done = 0;
    let failed = 0;
    
    queue.messages?.forEach(msg => {
      msg.tasks?.forEach(task => {
        if (task.microTasks) {
          task.microTasks.forEach(micro => {
            total++;
            if (micro.status === 'executing') executing++;
            else if (micro.status === 'done') done++;
            else if (micro.status === 'failed') failed++;
          });
        }
      });
    });
    
    return { total, executing, done, failed };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-red-400">
        <XCircle className="h-6 w-6 mb-2" />
        <p className="text-sm">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={loadQueues}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  if (queues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-400">
        <FileText className="h-6 w-6 mb-2" />
        <p className="text-sm">No task files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Queue Manager Button */}
      <div className="flex justify-end mb-2">
        <QueueManager />
      </div>

      {/* Navigation Controls */}
      {selectedMessage && (
        <div className="bg-blue-900/20 p-2 rounded-lg border border-blue-700/50 flex items-center justify-between">
          <span className="text-xs text-blue-300">
            Message {selectedMessage.messageNumber}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => navigateMessage('prev')}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => navigateMessage('next')}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Queue Files */}
      {queues.map((queue) => {
        const isExpanded = expandedFiles.has(queue.fileId);
        const messages = queue.messages || [];
        const approvedMessages = messages.filter(m => 
          m.tasks && m.tasks.every(t => t.approved)
        );
        const reviewMessages = messages.filter(m => 
          getMessageStatus(m) === 'review'
        );
        const executingMessages = messages.filter(m => 
          m.tasks && m.tasks.some(t => t.status === 'executing')
        );
        const doneMessages = messages.filter(m => 
          m.tasks && m.tasks.length > 0 && m.tasks.every(t => t.status === 'done')
        );
        const failedMessages = messages.filter(m => 
          m.tasks && m.tasks.some(t => t.status === 'failed')
        );

        const microTaskStatus = getMicroTaskStatus(queue);

        return (
          <div key={queue.fileId} className="bg-gray-700/50 rounded-lg border border-gray-600 overflow-hidden">
            {/* File Header */}
            <div
              className="p-3 cursor-pointer hover:bg-gray-700/70 transition-colors flex items-center justify-between"
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
                  <Badge className="text-xs bg-blue-600 text-blue-100 animate-pulse">
                    {microTaskStatus.executing} executing
                  </Badge>
                )}
                {doneMessages.length > 0 && (
                  <Badge className="text-xs bg-green-700 text-green-100">
                    {doneMessages.length} done
                  </Badge>
                )}
                {failedMessages.length > 0 && (
                  <Badge className="text-xs bg-red-600 text-red-100">
                    {failedMessages.length} failed
                  </Badge>
                )}
                {executingMessages.length > 0 && (
                  <Badge className="text-xs bg-blue-600 text-blue-100">
                    {executingMessages.length} running
                  </Badge>
                )}
                {reviewMessages.length > 0 && (
                  <Badge className="text-xs bg-yellow-700 text-yellow-100">
                    {reviewMessages.length} review
                  </Badge>
                )}
                {approvedMessages.length > 0 && (
                  <Badge className="text-xs bg-blue-700 text-blue-100">
                    {approvedMessages.length} ready
                  </Badge>
                )}
                <span className="text-xs text-gray-400">
                  {messages.length} msgs
                </span>
              </div>
            </div>

            {/* File Content */}
            {isExpanded && (
              <div className="border-t border-gray-600/50">
                {/* File Stats */}
                <div className="p-3 bg-gray-800/30 text-xs text-gray-400 grid grid-cols-3 gap-2 border-b border-gray-600/50">
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
                  
                  return (
                    <div 
                      key={message.messageNumber} 
                      className={cn(
                        "border-b border-gray-600/30 last:border-b-0",
                        isSelected && "bg-blue-900/10"
                      )}
                    >
                      {/* Message Header */}
                      <div
                        className="p-3 cursor-pointer hover:bg-gray-700/30 transition-colors"
                        onClick={() => {
                          toggleMessage(queue.fileId, message.messageNumber);
                          setSelectedMessage({ fileId: queue.fileId, messageNumber: message.messageNumber });
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isMessageExpanded ? (
                              <ChevronDown className="h-3 w-3 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-gray-500" />
                            )}
                            <StatusIcon status={messageStatus} />
                            <span className="text-sm font-medium text-gray-100">
                              Message {message.messageNumber}
                              {message.summary && (
                                <span className="ml-2 text-gray-400 font-normal">
                                  {message.summary}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={messageStatus} />
                            {message.tasks && (
                              <span className="text-xs text-gray-500">
                                {message.tasks.length} tasks
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Message Actions and Tasks */}
                      {isMessageExpanded && (
                        <div className="bg-gray-800/20 px-3 pb-3">
                          {/* Message Actions */}
                          <div className="flex items-center gap-2 mb-3 pt-2">
                            {messageStatus === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRewrite(queue.fileId, message.messageNumber);
                                }}
                                disabled={rewritingMessage === `${queue.fileId}-${message.messageNumber}`}
                              >
                                {rewritingMessage === `${queue.fileId}-${message.messageNumber}` ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Rewriting...
                                  </>
                                ) : (
                                  <>
                                    <Zap className="h-3 w-3 mr-1" />
                                    Rewrite to Micro-tasks
                                  </>
                                )}
                              </Button>
                            )}
                            
                            {messageStatus === 'review' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(queue.fileId, message.messageNumber, true, 'all');
                                  }}
                                  disabled={approvingMessage === `${queue.fileId}-${message.messageNumber}`}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Approve All
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(queue.fileId, message.messageNumber, 'all');
                                  }}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Reject All
                                </Button>
                              </>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-red-400 hover:bg-red-900/20 ml-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(queue.fileId, message.messageNumber);
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete Message
                            </Button>
                          </div>

                          {/* Tasks */}
                          <div className="space-y-2">
                            {message.tasks?.map((task) => (
                              <div key={task.taskId} className="bg-gray-700/30 rounded p-2 text-xs">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <StatusIcon status={getTaskStatus(task)} />
                                      <span className="font-medium text-gray-100">
                                        Task {task.taskNumber}
                                      </span>
                                      <StatusBadge status={getTaskStatus(task)} />
                                      {task.approved && !task.status && (
                                        <Badge className="text-xs bg-green-700 text-green-100">
                                          Approved
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-gray-300 mb-1">{task.originalDescription}</p>
                                    
                                    {/* Task Actions */}
                                    {getTaskStatus(task) === 'review' && !task.approved && (
                                      <div className="flex gap-2 mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 text-xs"
                                          onClick={() => handleApprove(queue.fileId, message.messageNumber, true, task.taskId)}
                                        >
                                          <Check className="h-3 w-3 mr-1" />
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 text-xs text-red-400"
                                          onClick={() => handleReject(queue.fileId, message.messageNumber, task.taskId)}
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          Reject
                                        </Button>
                                      </div>
                                    )}
                                    
                                    {/* Execution Result */}
                                    {task.executionResult && (
                                      <div className={cn(
                                        "mt-2 p-2 rounded text-xs",
                                        task.executionResult.success ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"
                                      )}>
                                        {task.executionResult.message || (task.executionResult.success ? 'Completed successfully' : 'Failed')}
                                        {task.executionResult.completedAt && (
                                          <span className="text-gray-500 ml-2">
                                            at {new Date(task.executionResult.completedAt).toLocaleTimeString()}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Micro-tasks */}
                                    {task.microTasks && task.microTasks.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        <p className="text-xs font-medium text-green-400">
                                          Rewritten as {task.microTasks.length} micro-tasks:
                                        </p>
                                        {task.microTasks.map((micro: any, idx: number) => (
                                          <div key={micro.id} className="text-xs text-gray-400 pl-4">
                                            <div className="mb-1 flex items-center gap-2">
                                              <span className="text-gray-500">{idx + 1}.</span> 
                                              <span className="text-blue-400">{micro.filePath}</span>
                                              {micro.status && (
                                                <StatusBadge status={micro.status} />
                                              )}
                                            </div>
                                            <div className="pl-4 text-gray-300">
                                              {micro.description}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Bulk Actions */}
                {reviewMessages.length > 0 && (
                  <div className="p-3 bg-gray-900/30 border-t border-gray-600/50">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => handleApprove(queue.fileId, 1, true, 'all')}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve All Messages ({reviewMessages.length})
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