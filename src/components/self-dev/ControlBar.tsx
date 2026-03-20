'use client';

import { Play, Pause, SkipForward, RefreshCw, Brain, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ControlBarProps {
  status: {
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
  };
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onRetry: () => void;
}

export function ControlBar({ status, onStart, onPause, onResume, onSkip, onRetry }: ControlBarProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0 
      ? `${hours}h ${minutes}m`
      : minutes > 0 
      ? `${minutes}m ${secs}s`
      : `${secs}s`;
  };

  const estimateRemaining = () => {
    if (status.overallProgress.tasksDone === 0) return 'calculating...';
    const rate = status.overallProgress.tasksDone / status.elapsedTime;
    const remaining = (status.overallProgress.tasksTotal - status.overallProgress.tasksDone) / rate;
    return formatTime(Math.round(remaining));
  };

  const isRunning = status.status === 'executing' || status.status === 'building';
  const isPaused = status.status === 'paused';
  const isIdle = status.status === 'idle';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 shadow-lg z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-6">
          {/* Progress Section */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <Progress value={status.overallProgress.percentage} className="flex-1" />
              <span className="text-sm font-medium whitespace-nowrap">
                {status.overallProgress.tasksDone}/{status.overallProgress.tasksTotal} tasks ({status.overallProgress.percentage}%)
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span>Message {status.currentMessage?.number || 0}/{status.overallProgress.messagesTotal}</span>
              <span>•</span>
              <span>File {status.overallProgress.filesDone}/{status.overallProgress.filesTotal}</span>
              {status.currentFile && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[200px]">{status.currentFile.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {isIdle ? (
              <Button onClick={onStart} className="gap-2">
                <Play className="h-4 w-4" />
                Start
              </Button>
            ) : isPaused ? (
              <Button onClick={onResume} className="gap-2">
                <Play className="h-4 w-4" />
                Resume
              </Button>
            ) : isRunning ? (
              <Button onClick={onPause} variant="secondary" className="gap-2">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            ) : null}

            <Button
              onClick={onSkip}
              variant="outline"
              size="icon"
              disabled={!isRunning}
              title="Skip current task"
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button
              onClick={onRetry}
              variant="outline"
              size="icon"
              disabled={!isRunning}
              title="Retry failed task"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Info */}
          <div className="flex items-center gap-4 text-sm">
            {/* Context Usage */}
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <div>
                <div className="font-medium">Developer Context</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  ~{status.contextEstimate}% used
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <div className="font-medium">{formatTime(status.elapsedTime)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  ~{estimateRemaining()} remaining
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <Badge 
              variant={
                status.status === 'error' ? 'destructive' :
                status.status === 'executing' ? 'default' :
                status.status === 'building' ? 'secondary' :
                'outline'
              }
              className="capitalize"
            >
              {status.status}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}