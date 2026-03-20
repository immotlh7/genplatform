'use client';

import { Play, Pause, SkipForward, RefreshCw, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ControlBarProps {
  status: any;
  hasApprovedTasks: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onRetry: () => void;
}

export function ControlBar({ 
  status, 
  hasApprovedTasks,
  onStart, 
  onPause, 
  onResume, 
  onSkip, 
  onRetry 
}: ControlBarProps) {
  const isIdle = status.status === 'idle';
  const isPaused = status.status === 'paused';
  const isExecuting = status.status === 'executing' || status.status === 'analyzing' || status.status === 'building';
  
  // Format elapsed time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="h-[60px] bg-gray-900 border-t border-gray-700 flex items-center px-6 gap-4">
      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {isIdle ? (
          <Button
            size="sm"
            variant="default"
            onClick={onStart}
            disabled={!hasApprovedTasks}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start
          </Button>
        ) : isPaused ? (
          <Button
            size="sm"
            variant="default"
            onClick={onResume}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Resume
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onPause}
            className="flex items-center gap-2"
          >
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        )}
        
        {(isExecuting || isPaused) && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onSkip}
              className="flex items-center gap-2"
            >
              <SkipForward className="h-4 w-4" />
              Skip
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="flex-1 flex items-center gap-4">
        <div className="flex-1">
          <Progress value={status.overallProgress?.percentage || 0} className="h-2" />
        </div>
        <div className="text-sm text-gray-400 min-w-[200px]">
          {status.overallProgress && (
            <>
              <span className="font-medium">
                {status.overallProgress.tasksDone}/{status.overallProgress.tasksTotal} tasks
              </span>
              {status.elapsedTime > 0 && (
                <span className="ml-2">• {formatTime(status.elapsedTime)}</span>
              )}
              {status.contextEstimate > 0 && (
                <span className="ml-2">• {status.contextEstimate}K tokens</span>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        {status.status === 'executing' && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">Executing</span>
          </div>
        )}
        {status.status === 'building' && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">Building</span>
          </div>
        )}
        {status.status === 'paused' && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-gray-500 rounded-full" />
            <span className="text-xs text-gray-400">Paused</span>
          </div>
        )}
      </div>
    </div>
  );
}