'use client';

import { useState, useEffect } from 'react';
import { FileUploader } from '@/components/self-dev/FileUploader';
import { TaskQueue } from '@/components/self-dev/TaskQueue';
import { ExecutionMonitor } from '@/components/self-dev/ExecutionMonitor';
import { PreviewPanel } from '@/components/self-dev/PreviewPanel';
import { ControlBar } from '@/components/self-dev/ControlBar';
import { AlertCircle } from 'lucide-react';

interface ExecutionStatus {
  status: 'idle' | 'analyzing' | 'executing' | 'building' | 'paused' | 'error';
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
  elapsedTime: number;
  currentMessage?: { number: number; title: string };
  currentFile?: { name: string };
}

const initialStatus: ExecutionStatus = {
  status: 'idle',
  overallProgress: {
    filesTotal: 0,
    filesDone: 0,
    messagesTotal: 0,
    messagesDone: 0,
    tasksTotal: 0,
    tasksDone: 0,
    percentage: 0
  },
  contextEstimate: 0,
  elapsedTime: 0
};

export default function SelfDevPage() {
  const [status, setStatus] = useState<ExecutionStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [hasApprovedTasks, setHasApprovedTasks] = useState(false);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/self-dev/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data || initialStatus);
      }
      
      // Check for approved tasks
      try {
        const queuesResponse = await fetch('/api/self-dev/queues');
        if (queuesResponse.ok) {
          const queues = await queuesResponse.json();
          const approved = Array.isArray(queues) && queues.some((q: any) => 
            q.messages?.some((m: any) => m.tasks?.some((t: any) => t.approved))
          );
          setHasApprovedTasks(approved);
        }
      } catch (queueError) {
        console.error('Failed to load queues:', queueError);
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const handleFileUpload = async (fileData: any) => {
    setError(null);
    await loadStatus();
  };

  const handleControl = async (action: string, confirmation?: string) => {
    setError(null);
    try {
      const response = await fetch('/api/self-dev/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, confirmation })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Control action failed');
      } else {
        await loadStatus();
      }
    } catch (err) {
      setError('Failed to execute control action');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h1 className="text-2xl font-bold">🔧 Self-Development Center</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload task files and watch the platform develop itself
        </p>
      </div>
      
      {/* Main Content - 3 Panel Grid */}
      <div 
        className="flex-1 overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr 350px',
          height: 'calc(100vh - 140px)',
          gap: '16px',
          padding: '16px',
          backgroundColor: 'rgb(17 24 39)',
        }}
      >
        {/* Left Panel - Task Queue */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-semibold text-white">Task Files</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Upload Zone */}
            <div className="mb-4">
              <FileUploader onUploadComplete={handleFileUpload} />
            </div>
            
            {/* Task Queue */}
            <TaskQueue />
          </div>
        </div>
        
        {/* Middle Panel - Execution Monitor */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-semibold text-white">Execution Monitor</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <ExecutionMonitor onRefresh={loadStatus} />
          </div>
        </div>
        
        {/* Right Panel - Live Preview */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-semibold text-white">Live Preview</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <PreviewPanel 
              url="https://app.gen3.ai/dashboard"
              isBuilding={status.status === 'building'} 
            />
          </div>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg z-50">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      
      {/* Control Bar - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-[60px] z-50">
        <ControlBar
          status={status}
          hasApprovedTasks={hasApprovedTasks}
          onStart={() => handleControl('start')}
          onPause={() => handleControl('pause')}
          onResume={() => handleControl('resume')}
          onSkip={() => handleControl('skip')}
          onRetry={() => handleControl('retry')}
        />
      </div>
    </div>
  );
}