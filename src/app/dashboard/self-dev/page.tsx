'use client';

import { useState, useEffect } from 'react';
import { FileUploader } from '@/components/self-dev/FileUploader';
import { TaskQueue } from '@/components/self-dev/TaskQueue';
import { ExecutionMonitor } from '@/components/self-dev/ExecutionMonitor';
import { PreviewPanel } from '@/components/self-dev/PreviewPanel';
import { ControlBar } from '@/components/self-dev/ControlBar';
import { Bot, Brain, AlertCircle } from 'lucide-react';

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
  const [selectedTask, setSelectedTask] = useState<any>(null);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 3000); // Poll every 3 seconds
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
    // File uploaded and analyzed, ready to start execution
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
      <div className="max-w-[1800px] mx-auto pb-20 px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🔧 Self-Development Center</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload task files and watch the platform develop itself
          </p>
        </div>
        
        {/* Two-Agent Architecture Explanation */}
        {status.overallProgress.filesTotal === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold">Orchestrator Agent</h3>
                  <p className="text-sm text-gray-500">Claude Sonnet - Fast Analysis</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Reads entire task files (100+ tasks)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Decomposes into micro-tasks
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Manages execution flow
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Never touches code directly
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bot className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold">Developer Agent</h3>
                  <p className="text-sm text-gray-500">Claude Opus on OpenClaw</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Receives one micro-task at a time
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Executes code changes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Runs builds and tests
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Clean context (200 tokens vs 4000)
                </li>
              </ul>
            </div>
          </div>
        )}
        
        {/* File Upload */}
        {status.overallProgress.filesTotal === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload Task File</h2>
            <FileUploader onUploadComplete={handleFileUpload} />
          </div>
        )}
        
        {/* Main Content Area - 3 Panel Layout */}
        {(status.overallProgress.filesTotal > 0 || status.status !== 'idle') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel - Task Queue (25%) */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold">Task Queue</h2>
                </div>
                <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                  <TaskQueue onTaskSelect={setSelectedTask} />
                </div>
              </div>
            </div>
            
            {/* Center Panel - Execution Monitor (45%) */}
            <div className="lg:col-span-5">
              <ExecutionMonitor onRefresh={loadStatus} />
            </div>
            
            {/* Right Panel - Preview (30%) */}
            <div className="lg:col-span-4">
              <div className="h-[calc(100vh-300px)]">
                <PreviewPanel isBuilding={status.status === 'building'} />
              </div>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Control Bar - Fixed Bottom */}
      {(status.overallProgress.filesTotal > 0 || status.status !== 'idle') && (
        <ControlBar
          status={status}
          onStart={() => handleControl('start')}
          onPause={() => handleControl('pause')}
          onResume={() => handleControl('resume')}
          onSkip={() => handleControl('skip')}
          onRetry={() => handleControl('retry')}
        />
      )}
    </>
  );
}