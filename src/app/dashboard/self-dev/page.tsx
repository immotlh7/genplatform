'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploader } from '@/components/self-dev/FileUploader';
import { TaskQueue } from '@/components/self-dev/TaskQueue';
import { ExecutionMonitor } from '@/components/self-dev/ExecutionMonitor';
import { PreviewPanel } from '@/components/self-dev/PreviewPanel';
import { ControlBar } from '@/components/self-dev/ControlBar';
import { MonitorDashboard } from '@/components/self-dev/MonitorDashboard';
import { Activity, AlertCircle } from 'lucide-react';

interface Status {
  status: 'idle' | 'analyzing' | 'executing' | 'paused' | 'building' | 'error';
  currentFile?: any;
  currentMessage?: any;
  currentTask?: any;
  overallProgress?: {
    tasksTotal: number;
    tasksDone: number;
    percentage: number;
  };
  elapsedTime: number;
  contextEstimate: number;
  error?: string;
}

const initialStatus: Status = {
  status: 'idle',
  overallProgress: {
    tasksTotal: 0,
    tasksDone: 0,
    percentage: 0
  },
  elapsedTime: 0,
  contextEstimate: 0
};

export default function SelfDevPage() {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [hasApprovedTasks, setHasApprovedTasks] = useState(false);
  const [activeTab, setActiveTab] = useState('execution');
  const [isExecuting, setIsExecuting] = useState(false);
  
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
        
        // Check queue for approved tasks
        if (data.queue?.batches) {
          const hasApproved = data.queue.batches.some((batch: any) =>
            batch.tasks.some((task: any) => task.approved && task.status !== 'done')
          );
          setHasApprovedTasks(hasApproved);
          
          // Check if any task is executing
          const hasExecuting = data.queue.batches.some((batch: any) =>
            batch.tasks.some((task: any) => task.status === 'executing')
          );
          setIsExecuting(hasExecuting);
          
          // Set status based on execution state
          if (hasExecuting) {
            setStatus(prev => ({ ...prev, status: 'executing' }));
          } else if (hasApproved && !hasExecuting) {
            setStatus(prev => ({ ...prev, status: 'idle' }));
          }
        } else {
          setHasApprovedTasks(false);
          setIsExecuting(false);
        }
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const handleFileUpload = async (fileData: any) => {
    setError(null);
    await loadStatus();
  };

  const handleControl = async (action: string) => {
    setError(null);
    
    if (action === 'start') {
      // Start execution by calling execute-next
      try {
        const response = await fetch('/api/self-dev/execute-next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to start execution');
        } else {
          setStatus(prev => ({ ...prev, status: 'executing' }));
          await loadStatus();
        }
      } catch (err) {
        setError('Failed to start execution');
      }
    } else if (action === 'pause') {
      // TODO: Implement pause functionality
      setStatus(prev => ({ ...prev, status: 'paused' }));
    } else if (action === 'resume') {
      // Resume by calling execute-next again
      try {
        const response = await fetch('/api/self-dev/execute-next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to resume execution');
        } else {
          setStatus(prev => ({ ...prev, status: 'executing' }));
          await loadStatus();
        }
      } catch (err) {
        setError('Failed to resume execution');
      }
    } else if (action === 'skip') {
      // TODO: Implement skip functionality
      console.log('Skip not implemented yet');
    } else if (action === 'retry') {
      // TODO: Implement retry functionality
      console.log('Retry not implemented yet');
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
        
        {/* Middle Panel - Execution Monitor with Tabs */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-gray-700">
              <TabsList className="w-full justify-start bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="execution" 
                  className="data-[state=active]:bg-gray-700 rounded-none px-6 py-3"
                >
                  Execution Monitor
                </TabsTrigger>
                <TabsTrigger 
                  value="monitor" 
                  className="data-[state=active]:bg-gray-700 rounded-none px-6 py-3"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  System Monitor
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="execution" className="flex-1 overflow-y-auto p-4">
              <ExecutionMonitor onRefresh={loadStatus} />
            </TabsContent>
            
            <TabsContent value="monitor" className="flex-1 p-4">
              <MonitorDashboard />
            </TabsContent>
          </Tabs>
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