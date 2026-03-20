'use client';

import { useState, useEffect } from 'react';
import { Trash2, PlayCircle, RefreshCw, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

interface QueueInfo {
  file: string;
  fileName: string;
  createdAt: string;
  stats: {
    total: number;
    approved: number;
    executing: number;
    done: number;
    failed: number;
    pending: number;
  };
  isActive: boolean;
}

export function QueueManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [queues, setQueues] = useState<QueueInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadQueues();
    }
  }, [isOpen]);

  const loadQueues = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/self-dev/queue-manager');
      if (response.ok) {
        const data = await response.json();
        setQueues(data.queues || []);
      }
    } catch (error) {
      console.error('Failed to load queues:', error);
    }
    setLoading(false);
  };

  const handleAction = async (action: string, queueFile: string) => {
    setMessage('');
    try {
      const response = await fetch('/api/self-dev/queue-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, queueFile })
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(result.message);
        await loadQueues();
        
        // Reload the page if activating a queue
        if (action === 'activate') {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        const error = await response.json();
        setMessage(error.error || 'Action failed');
      }
    } catch (error) {
      setMessage('Failed to perform action');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Manage Queues
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Queue Manager</DialogTitle>
            <DialogDescription>
              Manage task queues, activate different files, or reset stuck tasks
            </DialogDescription>
          </DialogHeader>

          {message && (
            <div className={`p-3 rounded-lg mb-4 ${
              message.includes('error') || message.includes('failed') 
                ? 'bg-red-900/20 border border-red-700 text-red-400'
                : 'bg-green-900/20 border border-green-700 text-green-400'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading queues...</p>
              </div>
            ) : queues.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No task queues found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queues.map((queue) => (
                  <div
                    key={queue.file}
                    className={`p-4 rounded-lg border ${
                      queue.isActive 
                        ? 'bg-blue-900/20 border-blue-700' 
                        : 'bg-gray-900/50 border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{queue.fileName}</h4>
                          {queue.isActive && (
                            <Badge variant="default" className="bg-blue-600">
                              ACTIVE
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          Created: {formatDate(queue.createdAt)}
                        </p>
                        
                        {/* Stats */}
                        <div className="grid grid-cols-6 gap-2 text-sm">
                          <div>
                            <div className="text-gray-400">Total</div>
                            <div className="font-bold">{queue.stats.total}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Approved</div>
                            <div className="font-bold text-green-400">{queue.stats.approved}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Pending</div>
                            <div className="font-bold text-yellow-400">{queue.stats.pending}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Running</div>
                            <div className="font-bold text-blue-400">{queue.stats.executing}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Done</div>
                            <div className="font-bold text-green-400">{queue.stats.done}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Failed</div>
                            <div className="font-bold text-red-400">{queue.stats.failed}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        {!queue.isActive && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAction('activate', queue.file)}
                            title="Make this the active queue"
                          >
                            <PlayCircle className="h-4 w-4" />
                            Activate
                          </Button>
                        )}
                        {queue.stats.pending < queue.stats.approved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction('reset', queue.file)}
                            title="Reset all tasks to pending"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Reset
                          </Button>
                        )}
                        {!queue.isActive && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Delete queue ${queue.fileName}?`)) {
                                handleAction('delete', queue.file);
                              }
                            }}
                            title="Delete this queue"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Additional Actions */}
            <div className="pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Tip: Activate a queue to make it the current working queue
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction('clear-logs', '')}
                >
                  Clear Logs
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}