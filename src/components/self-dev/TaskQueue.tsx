'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Task {
  taskId: string;
  taskNumber: number;
  originalDescription: string;
  status: 'pending' | 'analyzing' | 'approved' | 'executing' | 'done' | 'failed' | 'skipped';
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
  totalTasks: number;
  totalMicroTasks: number;
  messages: Message[];
  hasApprovedTasks?: boolean;
}

export function TaskQueue() {
  const [queues, setQueues] = useState<TaskQueue[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
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
      const response = await fetch('/api/self-dev/queues');
      if (response.ok) {
        const queuesData = await response.json();
        if (Array.isArray(queuesData)) {
          setQueues(queuesData);
        }
      }
      setLoading(false);
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
        await loadQueues();
      }
    } catch (error) {
      console.error('Rewrite error:', error);
    } finally {
      setRewriting(null);
    }
  };

  const handleApprove = async (fileId: string, messageNumber: number, approved: boolean) => {
    setApproving(`${fileId}-${messageNumber}`);
    
    try {
      const response = await fetch('/api/self-dev/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, messageNumber, approved })
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
    }
    setExpandedFiles(newExpanded);
  };

  const getStatusColor = (message: Message) => {
    if (message.tasks.some(t => t.status === 'executing')) return 'bg-blue-500';
    if (message.tasks.every(t => t.approved)) return 'bg-green-500';
    if (message.tasks.some(t => t.status === 'analyzing')) return 'bg-amber-500';
    return 'bg-gray-500';
  };

  const getStatusText = (message: Message) => {
    if (message.tasks.some(t => t.status === 'executing')) return 'executing';
    if (message.tasks.every(t => t.approved)) return 'approved';
    if (message.tasks.some(t => t.status === 'analyzing')) return 'analyzing';
    return 'pending';
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
        <FileText className="h-10 w-10 mx-auto mb-2 text-gray-500" />
        <p className="text-sm text-gray-400">No files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {queues.map(queue => {
        const isExpanded = expandedFiles.has(queue.fileId);

        return (
          <div key={queue.fileId} className="bg-gray-700 rounded-lg border border-gray-600">
            {/* File Header - Clickable */}
            <div
              className="p-3 cursor-pointer hover:bg-gray-600/50 transition-colors rounded-lg flex items-center justify-between"
              onClick={() => toggleFile(queue.fileId)}
            >
              <div className="flex items-center gap-2 flex-1">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                <FileText className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-white truncate">{queue.fileName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-gray-600 text-gray-200">
                  {queue.totalMessages} msgs
                </Badge>
                <Badge variant="secondary" className="text-xs bg-gray-600 text-gray-200">
                  {queue.totalTasks} tasks
                </Badge>
              </div>
            </div>

            {/* Messages List - Expandable */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-2">
                {queue.messages.map(message => {
                  const messageId = `${queue.fileId}-${message.messageNumber}`;
                  const isRewriting = rewriting === messageId;
                  const isApproving = approving === messageId;
                  const statusColor = getStatusColor(message);
                  const statusText = getStatusText(message);

                  return (
                    <div 
                      key={message.messageNumber} 
                      className="bg-gray-800 rounded p-3 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-300">
                              Message {message.messageNumber}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                            <span className="text-xs text-gray-400">{statusText}</span>
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {message.summary}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {message.tasks.length} tasks
                          </Badge>
                          
                          {!message.tasks.every(t => t.rewritten) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleRewrite(queue.fileId, message.messageNumber)}
                              disabled={isRewriting}
                            >
                              {isRewriting ? 'Rewriting...' : 'Rewrite'}
                            </Button>
                          )}
                          
                          {message.tasks.every(t => t.rewritten) && !message.tasks.every(t => t.approved) && (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
                              onClick={() => handleApprove(queue.fileId, message.messageNumber, true)}
                              disabled={isApproving}
                            >
                              {isApproving ? 'Approving...' : 'Approve'}
                            </Button>
                          )}
                          
                          {message.tasks.every(t => t.approved) && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
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