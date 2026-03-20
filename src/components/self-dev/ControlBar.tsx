'use client';

import { Play, Pause, SkipForward, RefreshCw, Brain, Clock, CheckSquare } from 'lucide-react';
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
  hasApprovedTasks?: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onRetry: () => void;
}

export function ControlBar({ status, hasApprovedTasks = false, onStart, onPause, onResume, onSkip, onRetry }: ControlBarProps) {
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
    if (status.overallProgress.tasksDone === 0 || status.overallProgress.tasksTotal === 0) return 'calculating...';
    const rate = status.overallProgress.tasksDone / status.elapsedTime;
    const remaining = (status.overallProgress.tasksTotal - status.overallProgress.tasksDone) / rate;
    return formatTime(Math.round(remaining));
  };

  const isRunning = status.status === 'executing' || status.status === 'building';
  const isPaused = status.status === 'paused';
  const isIdle = status.status === 'idle';
  const hasTasks = status.overallProgress.tasksTotal > 0;

  // Determine button state and message
  let startButtonDisabled = true;
  let startButtonTooltip = 'Upload a file first';
  
  if (hasTasks && !hasApprovedTasks) {
    startButtonDisabled = true;
    startButtonTooltip = 'Approve tasks before starting execution';
  } else if (hasTasks && hasApprovedTasks) {
    startButtonDisabled = false;
    startButtonTooltip = 'Start execution';
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 shadow-lg z-50">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between gap-6">
          {/* Progress Section */}
          <div className="flex-1">
            {hasTasks ? (
              <>
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
                  {!hasApprovedTasks && hasTasks && (
                    <>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" />
                        Approval needed
                      </span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">
                <Progress value={0} className="mb-2" />
                <span>No tasks yet — Upload a file to begin</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {isIdle ? (
              <Button 
                onClick={onStart} 
                className="gap-2"
                disabled={startButtonDisabled}
                title={startButtonTooltip}
              >
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
            {hasTasks && (
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="font-medium">Context</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    ~{status.contextEstimate}%
                  </div>
                </div>
              </div>
            )}

            {/* Time */}
            {hasTasks && status.elapsedTime > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="font-medium">{formatTime(status.elapsedTime)}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    ~{estimateRemaining()} left
                  </div>
                </div>
              </div>
            )}

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
              {status.status === 'idle' && !hasTasks ? 'Idle — Upload a file to begin' : 
               status.status === 'idle' && hasTasks && !hasApprovedTasks ? 'Awaiting approval' :
               status.status === 'idle' && hasTasks && hasApprovedTasks ? 'Ready to start' :
               status.status}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}