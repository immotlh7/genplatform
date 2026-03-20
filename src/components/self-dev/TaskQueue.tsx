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
  analyzedAt?: string;
  status?: string;
  hasApprovedTasks?: boolean;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-3 w-3 text-gray-400" />;
    case 'rewriting':
      return <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />;
    case 'review':
      return <Edit3 className="h-3 w-3 text-yellow-500" />;
    case 'approved':
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case 'executing':
      return <PlayCircle className="h-3 w-3 text-blue-500 animate-pulse" />;
    case 'done':
      return <CheckCircle className="h-3 w-3 text-green-600" />;
    case 'failed':
      return <XCircle className="h-3 w-3 text-red-500" />;
    default:
      return <Clock className="h-3 w-3 text-gray-400" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    pending: 'bg-gray-600 text-gray-200',
    rewriting: 'bg-amber-600 text-amber-100',
    review: 'bg-yellow-600 text-yellow-100',
    approved: 'bg-green-600 text-green-100',
    executing: 'bg-blue-600 text-blue-100 animate-pulse',
    done: 'bg-green-700 text-green-100',
    failed: 'bg-red-600 text-red-100',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
      variants[status] || variants.pending
    )}>
      <StatusIcon status={status} />
      {status}
    </span>
  );
};

// Helper function to normalize message structure
function normalizeMessage(message: any): Message {
  // Handle old format where microTasks are at message level
  if (message.microTasks && !message.tasks) {
    // Convert old format to new format
    return {
      messageNumber: message.messageNumber || 1,
      summary: message.summary || 'Task batch',
      originalContent: message.originalContent,
      tasks: [{
        taskId: `task_${message.messageNumber}_1`,
        taskNumber: 1,
        originalDescription: message.summary || 'Legacy tasks',
        status: 'pending',
        approved: false,
        rewritten: false,
        microTasks: message.microTasks
      }]
    };
  }
  
  return {
    messageNumber: message.messageNumber || 1,
    summary: message.summary || '',
    originalContent: message.originalContent,
    tasks: message.tasks || []
  };
}

export function TaskQueue() {
  const [queues, setQueues] = useState<TaskQueue[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<{fileId: string, messageNumber: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadQueues();
    const interval = setInterval(loadQueues, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadQueues = async () => {
    try {
      const response = await fetch('/api/self-dev/queues');
      if (response.ok) {
        const queuesData = await response.json();
        if (Array.isArray(queuesData)) {
          // Normalize queue data
          const normalizedQueues = queuesData.map((queue: any) => ({
            ...queue,
            messages: (queue.messages || []).map(normalizeMessage)
          }));
          setQueues(normalizedQueues);
          // Auto-expand first file if only one exists
          if (normalizedQueues.length === 1 && expandedFiles.size === 0) {
            setExpandedFiles(new Set([normalizedQueues[0].fileId]));
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load queues:', error);
      setLoading(false);
    }
  };

  const handleRewrite = async (fileId: string, messageNumber: number, forceRewrite: boolean = false) => {
    const actionKey = `rewrite-${fileId}-${messageNumber}`;
    setProcessingActions(prev => new Set(prev).add(actionKey));
    
    try {
      const response = await fetch('/api/self-dev/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, messageNumber, forceRewrite })
      });
      
      if (response.ok) {
        await loadQueues();
      }
    } catch (error) {
      console.error('Rewrite error:', error);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleApprove = async (fileId: string, messageNumber: number, approved: boolean, scope: 'message' | 'all' = 'message') => {
    const actionKey = `approve-${fileId}-${messageNumber}`;
    setProcessingActions(prev => new Set(prev).add(actionKey));
    
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
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleReject = async (fileId: string, messageNumber: number) => {
    // Reject means reset to pending state for re-rewriting
    const actionKey = `reject-${fileId}-${messageNumber}`;
    setProcessingActions(prev => new Set(prev).add(actionKey));
    
    try {
      const response = await fetch('/api/self-dev/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, messageNumber })
      });
      
      if (response.ok) {
        await loadQueues();
        // Auto-trigger rewrite after rejection
        setTimeout(() => handleRewrite(fileId, messageNumber, true), 500);
      }
    } catch (error) {
      console.error('Reject error:', error);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleDeleteMessage = async (fileId: string, messageNumber: number) => {
    const actionKey = `delete-${fileId}-${messageNumber}`;
    setProcessingActions(prev => new Set(prev).add(actionKey));
    
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
      console.error('Delete error:', error);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
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

  const navigateMessage = (direction: 'prev' | 'next') => {
    if (!selectedMessage || queues.length === 0) return;
    
    const currentQueue = queues.find(q => q.fileId === selectedMessage.fileId);
    if (!currentQueue || !currentQueue.messages) return;
    
    const currentIndex = currentQueue.messages.findIndex(m => m.messageNumber === selectedMessage.messageNumber);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex >= 0 && newIndex < currentQueue.messages.length) {
      setSelectedMessage({
        fileId: selectedMessage.fileId,
        messageNumber: currentQueue.messages[newIndex].messageNumber
      });
    }
  };

  const getMessageStatus = (message: Message): string => {
    if (!message.tasks || message.tasks.length === 0) return 'empty';
    
    const hasRewritten = message.tasks.some(t => t.rewritten);
    const allRewritten = message.tasks.every(t => t.rewritten);
    const hasApproved = message.tasks.some(t => t.approved);
    const allApproved = message.tasks.every(t => t.approved);
    const isExecuting = message.tasks.some(t => t.status === 'executing');
    const allDone = message.tasks.every(t => t.status === 'done');
    const hasFailed = message.tasks.some(t => t.status === 'failed');
    
    if (allDone) return 'done';
    if (hasFailed) return 'failed';
    if (isExecuting) return 'executing';
    if (allApproved) return 'approved';
    if (allRewritten && !hasApproved) return 'review';
    if (hasRewritten) return 'rewriting';
    return 'pending';
  };

  const getMicroTaskStatus = (queue: TaskQueue) => {
    let total = 0;
    let executing = 0;
    let done = 0;
    let failed = 0;

    (queue.messages || []).forEach(msg => {
      (msg.tasks || []).forEach(task => {
        (task.microTasks || []).forEach(micro => {
          total++;
          if (micro.status === 'executing') executing++;
          if (micro.status === 'done') done++;
          if (micro.status === 'failed') failed++;
        });
      });
    });

    return { total, executing, done, failed };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (queues.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-10 w-10 mx-auto mb-2 text-gray-500" />
        <p className="text-sm text-gray-400">No files uploaded yet</p>
        <p className="text-xs text-gray-500 mt-1">Drop a .md file above to begin</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
      
      {queues.map(queue => {
        const isExpanded = expandedFiles.has(queue.fileId);
        const messages = queue.messages || [];
        const approvedMessages = messages.filter(m => 
          m.tasks && m.tasks.length > 0 && m.tasks.every(t => t.approved)
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
                  <Badge className="text-xs bg-yellow-600 text-yellow-100">
                    {reviewMessages.length} review
                  </Badge>
                )}
                {approvedMessages.length > 0 && approvedMessages.length !== doneMessages.length && (
                  <Badge className="text-xs bg-green-600 text-green-100">
                    {approvedMessages.length} approved
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {messages.length} msgs
                </Badge>
              </div>
            </div>

            {/* Messages List */}
            {isExpanded && messages.length > 0 && (
              <div className="border-t border-gray-600/50">
                {/* Micro-task Progress */}
                {microTaskStatus.total > 0 && (
                  <div className="p-3 bg-gray-900/30 border-b border-gray-600/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Micro-tasks Progress</span>
                      <span className="text-gray-300">
                        {microTaskStatus.done} / {microTaskStatus.total} ({Math.round((microTaskStatus.done / microTaskStatus.total) * 100)}%)
                      </span>
                    </div>
                    <div className="mt-1 h-1 bg-gray-700 rounded overflow-hidden">
                      <div 
                        className="h-full bg-green-600 transition-all"
                        style={{ width: `${(microTaskStatus.done / microTaskStatus.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Approved Messages Summary */}
                {approvedMessages.length > 0 && (
                  <div className="p-3 bg-green-900/20 border-b border-gray-600/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-400 font-medium">
                        ✅ {approvedMessages.length} Approved Messages
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() => setExpandedMessages(new Set(approvedMessages.map(m => `${queue.fileId}-${m.messageNumber}`)))}
                      >
                        Show All
                      </Button>
                    </div>
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      {approvedMessages.map(msg => (
                        <div 
                          key={msg.messageNumber} 
                          className="text-xs text-green-300 py-1 cursor-pointer hover:text-green-200"
                          onClick={() => {
                            setSelectedMessage({ fileId: queue.fileId, messageNumber: msg.messageNumber });
                            toggleMessage(`${queue.fileId}-${msg.messageNumber}`);
                          }}
                        >
                          Message {msg.messageNumber}: {msg.summary}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {messages.map((message, msgIndex) => {
                  const messageId = `${queue.fileId}-${message.messageNumber}`;
                  const messageStatus = getMessageStatus(message);
                  const isMessageExpanded = expandedMessages.has(messageId);
                  const isProcessing = processingActions.has(`rewrite-${queue.fileId}-${message.messageNumber}`) ||
                                     processingActions.has(`approve-${queue.fileId}-${message.messageNumber}`) ||
                                     processingActions.has(`reject-${queue.fileId}-${message.messageNumber}`);
                  const isSelected = selectedMessage?.fileId === queue.fileId && selectedMessage?.messageNumber === message.messageNumber;
                  const isEmpty = !message.tasks || message.tasks.length === 0;

                  // Hide empty messages unless expanded
                  if (isEmpty && !isMessageExpanded) {
                    return null;
                  }

                  return (
                    <div 
                      key={message.messageNumber} 
                      className={cn(
                        "border-b border-gray-600/30 last:border-b-0 transition-colors",
                        isSelected ? "bg-blue-900/20" : msgIndex % 2 === 0 ? "bg-gray-800/30" : "bg-gray-800/50",
                        messageStatus === 'approved' && "bg-green-900/10",
                        messageStatus === 'done' && "bg-green-900/20",
                        messageStatus === 'failed' && "bg-red-900/20",
                        messageStatus === 'executing' && "bg-blue-900/20"
                      )}
                    >
                      {/* Message Header */}
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              toggleMessage(messageId);
                              setSelectedMessage({ fileId: queue.fileId, messageNumber: message.messageNumber });
                            }}
                          >
                            <span className="text-sm font-medium text-gray-300">
                              Message {message.messageNumber}
                            </span>
                            <StatusBadge status={messageStatus} />
                            {isEmpty && (
                              <Badge variant="outline" className="text-xs text-gray-500">
                                Empty - Skip
                              </Badge>
                            )}
                            <span className="text-xs text-gray-400 truncate">
                              {message.summary}
                            </span>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!isEmpty && (
                              <Badge variant="secondary" className="text-xs">
                                {message.tasks.length} {message.tasks.length === 1 ? 'task' : 'tasks'}
                              </Badge>
                            )}
                            
                            {isEmpty && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs gap-1 text-gray-400"
                                onClick={() => handleDeleteMessage(queue.fileId, message.messageNumber)}
                                disabled={isProcessing}
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            )}
                            
                            {messageStatus === 'pending' && !isEmpty && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleRewrite(queue.fileId, message.messageNumber)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <Zap className="h-3 w-3" />
                                    Rewrite
                                  </>
                                )}
                              </Button>
                            )}
                            
                            {messageStatus === 'review' && (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => handleApprove(queue.fileId, message.messageNumber, true)}
                                  disabled={isProcessing}
                                >
                                  <Check className="h-3 w-3" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => handleReject(queue.fileId, message.messageNumber)}
                                  disabled={isProcessing}
                                  title="Reject and re-rewrite"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Reject
                                </Button>
                              </div>
                            )}
                            
                            {(messageStatus === 'done' || messageStatus === 'failed') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleRewrite(queue.fileId, message.messageNumber, true)}
                                disabled={isProcessing}
                                title="Re-rewrite tasks"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Re-rewrite
                              </Button>
                            )}
                            
                            {messageStatus === 'approved' && (
                              <Badge className="text-xs bg-green-600 text-green-100">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            )}
                            
                            {messageStatus === 'executing' && (
                              <Badge className="text-xs bg-blue-600 text-blue-100 animate-pulse">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Executing
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Tasks Preview (when expanded) */}
                        {isMessageExpanded && message.tasks && message.tasks.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.tasks.map(task => (
                              <div 
                                key={task.taskId} 
                                className={cn(
                                  "ml-4 p-2 rounded border",
                                  task.status === 'done' ? "bg-green-900/30 border-green-700/50" :
                                  task.status === 'failed' ? "bg-red-900/30 border-red-700/50" :
                                  task.status === 'executing' ? "bg-blue-900/30 border-blue-700/50" :
                                  "bg-gray-900/50 border-gray-700/50"
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  <StatusIcon status={task.rewritten && !task.approved ? 'review' : task.status} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-300">
                                      <span className="font-medium">Task {task.taskNumber}:</span> {task.originalDescription}
                                    </p>
                                    
                                    {/* Execution Result */}
                                    {task.executionResult && (
                                      <div className={cn(
                                        "mt-1 p-1 rounded text-xs",
                                        task.executionResult.success ? "bg-green-800/20 text-green-300" : "bg-red-800/20 text-red-300"
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
                        )}
                      </div>
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
                      Approve All {reviewMessages.length} Rewritten Messages
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