import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_FILES_DIR = '/root/genplatform/data/task-files';
const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';
const EXECUTION_LOG_FILE = '/root/genplatform/data/self-dev-execution.log';

// In-memory storage for execution state
export const executionState = {
  currentFile: null as { id: string; name: string; progress: number } | null,
  currentMessage: null as { number: number; title: string } | null,
  currentTask: null as { number: number; description: string; status: string } | null,
  currentBatch: null as { position: number; total: number } | null,
  status: 'idle' as 'idle' | 'analyzing' | 'executing' | 'building' | 'paused' | 'error',
  autoMode: true,
  contextTokens: 0,
  startTime: null as Date | null,
  tasksProcessed: 0,
  retryCount: new Map<string, number>()
};

interface TaskQueue {
  fileId: string;
  fileName: string;
  totalMessages: number;
  totalMicroTasks: number;
  messages: Array<{
    messageNumber: number;
    summary: string;
    microTasks: Array<{
      taskId: string;
      status: 'pending' | 'executing' | 'done' | 'failed' | 'skipped';
      description: string;
      filePath: string;
    }>;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Get execution log
    let log: string[] = [];
    try {
      const logContent = await fs.readFile(EXECUTION_LOG_FILE, 'utf-8');
      log = logContent.split('\n').filter(line => line).slice(-50); // Last 50 entries
    } catch (e) {
      // Log file might not exist yet
    }
    
    // Calculate overall progress
    let filesTotal = 0;
    let filesDone = 0;
    let messagesTotal = 0;
    let messagesDone = 0;
    let tasksTotal = 0;
    let tasksDone = 0;
    
    try {
      const files = await fs.readdir(TASK_QUEUE_DIR).catch(() => []);
      filesTotal = files.length;
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const queuePath = path.join(TASK_QUEUE_DIR, file);
        const queueData: TaskQueue = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
        
        messagesTotal += queueData.messages.length;
        let fileComplete = true;
        
        for (const message of queueData.messages) {
          let messageComplete = true;
          
          for (const task of message.microTasks) {
            tasksTotal++;
            if (task.status === 'done') {
              tasksDone++;
            } else {
              messageComplete = false;
              fileComplete = false;
            }
          }
          
          if (messageComplete) {
            messagesDone++;
          }
        }
        
        if (fileComplete) {
          filesDone++;
        }
      }
    } catch (e) {
      console.error('Error calculating progress:', e);
    }
    
    const percentage = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
    
    // Estimate context usage (rough approximation)
    const contextEstimate = Math.min(
      100,
      Math.round((executionState.contextTokens / 200000) * 100)
    );
    
    return NextResponse.json({
      currentFile: executionState.currentFile,
      currentMessage: executionState.currentMessage,
      currentTask: executionState.currentTask,
      currentBatch: executionState.currentBatch,
      log,
      overallProgress: {
        filesTotal,
        filesDone,
        messagesTotal,
        messagesDone,
        tasksTotal,
        tasksDone,
        percentage
      },
      contextEstimate,
      status: executionState.status,
      autoMode: executionState.autoMode,
      tasksProcessed: executionState.tasksProcessed,
      elapsedTime: executionState.startTime 
        ? Math.floor((Date.now() - executionState.startTime.getTime()) / 1000)
        : 0
    });
    
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}