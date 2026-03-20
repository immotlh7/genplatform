'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle, XCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface ExecutionMonitorProps {
  fileId: string;
  analysis: any;
  onExecute: () => void;
  isExecuting: boolean;
}

export function ExecutionMonitor({ fileId, analysis, onExecute, isExecuting }: ExecutionMonitorProps) {
  const [currentTask, setCurrentTask] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [failedTasks, setFailedTasks] = useState<Set<string>>(new Set());
  
  const totalTasks = analysis?.totalMicroTasks || 0;
  const progress = totalTasks > 0 ? (completedTasks.size / totalTasks) * 100 : 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Execution Monitor</h3>
        <button
          onClick={onExecute}
          disabled={isExecuting}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isExecuting
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isExecuting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start Execution
            </>
          )}
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress</span>
          <span>{completedTasks.size} / {totalTasks} tasks</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Current Batch */}
      {analysis?.executionPlan?.batches && currentTask < analysis.executionPlan.batches.length && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-medium mb-3">
            Current Batch #{analysis.executionPlan.batches[currentTask].batchNumber}
          </h4>
          <div className="space-y-2">
            {analysis.executionPlan.batches[currentTask].taskIds.map((taskId: string) => {
              const task = findTaskById(analysis, taskId);
              const isCompleted = completedTasks.has(taskId);
              const isFailed = failedTasks.has(taskId);
              
              return (
                <div key={taskId} className="flex items-center gap-3 text-sm">
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : isFailed ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-400" />
                  )}
                  <span className={isCompleted ? 'text-gray-500 line-through' : ''}>
                    {task?.description || taskId}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Messages Overview */}
      {analysis?.messages && (
        <div className="space-y-4">
          <h4 className="font-medium">Messages Overview</h4>
          {analysis.messages.map((message: any, index: number) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Message #{message.messageNumber}</span>
                <span className="text-xs text-gray-500">
                  {message.microTasks.filter((t: any) => completedTasks.has(t.taskId)).length} / {message.microTasks.length} tasks
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{message.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function findTaskById(analysis: any, taskId: string): any {
  for (const message of analysis.messages || []) {
    const task = message.microTasks.find((t: any) => t.taskId === taskId);
    if (task) return task;
  }
  return null;
}