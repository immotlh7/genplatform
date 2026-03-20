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

export default function SelfDevPage() {
  const [status, setStatus] = useState<ExecutionStatus>({
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
  });
  const [error, setError] = useState<string | null>(null);

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
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const handleFileUpload = async (fileData: any) => {
    await loadStatus();
  };

  const handleControl = async (action: string, confirmation?: string) => {
    try {
      const response = await fetch('/api/self-dev/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, confirmation })
      });
      
      if (!response.ok) {
        const error = await response.json();
        setError(error.error || 'Control action failed');
      } else {
        await loadStatus();
      }
    } catch (err) {
      setError('Failed to execute control action');
    }
  };

  return (
    <>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold">🔧 Self-Development Center</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload task files and watch the platform develop itself
          </p>
        </div>
        
        {/* Main 3-Panel Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Task Queue (25%) */}
          <div className="w-1/4 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold">Task Files</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Compact Upload Zone */}
              <div className="mb-6">
                <FileUploader onUploadComplete={handleFileUpload} />
              </div>
              
              {/* Task Queue Tree */}
              <TaskQueue />
            </div>
          </div>
          
          {/* Middle Panel - Execution Monitor (45%) */}
          <div className="w-[45%] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold">Execution Monitor</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ExecutionMonitor onRefresh={loadStatus} />
            </div>
          </div>
          
          {/* Right Panel - Live Preview (30%) */}
          <div className="w-[30%] border-l border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold">Live Preview</h2>
            </div>
            <div className="flex-1">
              <PreviewPanel 
                url="https://app.gen3.ai/dashboard"
                isBuilding={status.status === 'building'} 
              />
            </div>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Control Bar - Always Visible */}
      <ControlBar
        status={status}
        onStart={() => handleControl('start')}
        onPause={() => handleControl('pause')}
        onResume={() => handleControl('resume')}
        onSkip={() => handleControl('skip')}
        onRetry={() => handleControl('retry')}
      />
    </>
  );
}