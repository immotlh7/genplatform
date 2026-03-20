import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';
const EXECUTION_LOG = '/root/genplatform/data/self-dev-execution.log';

// In-memory execution state
export const executionState = {
  status: 'idle',
  currentFile: null,
  currentMessage: null,
  currentTask: null,
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
  elapsedTime: 0,
  startTime: null as number | null,
};

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    switch (action) {
      case 'start':
        // Check if there are approved tasks
        const files = await fs.readdir(TASK_QUEUE_DIR).catch(() => []);
        let hasApprovedTasks = false;
        let totalApproved = 0;
        
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          const queuePath = path.join(TASK_QUEUE_DIR, file);
          const queue = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
          
          for (const message of queue.messages) {
            if (message.tasks?.some((t: any) => t.approved)) {
              hasApprovedTasks = true;
              totalApproved += message.tasks.filter((t: any) => t.approved).length;
            }
          }
        }
        
        if (!hasApprovedTasks) {
          return NextResponse.json({ error: 'No approved tasks to execute' }, { status: 400 });
        }
        
        // Start execution
        executionState.status = 'executing';
        executionState.startTime = Date.now();
        executionState.overallProgress.tasksTotal = totalApproved;
        
        // Log start
        const logEntry = `[${new Date().toISOString()}] Execution started with ${totalApproved} approved tasks\n`;
        await fs.appendFile(EXECUTION_LOG, logEntry).catch(() => {});
        
        // In production, this would trigger execute-next
        // For demo, we'll simulate some progress
        setTimeout(async () => {
          executionState.currentMessage = { number: 1, title: 'Processing first batch...' };
          executionState.overallProgress.tasksDone = 1;
          executionState.overallProgress.percentage = Math.round((1 / totalApproved) * 100);
        }, 1000);
        
        return NextResponse.json({ success: true, message: 'Execution started' });
        
      case 'pause':
        if (executionState.status !== 'executing') {
          return NextResponse.json({ error: 'Not currently executing' }, { status: 400 });
        }
        executionState.status = 'paused';
        return NextResponse.json({ success: true, message: 'Execution paused' });
        
      case 'resume':
        if (executionState.status !== 'paused') {
          return NextResponse.json({ error: 'Not currently paused' }, { status: 400 });
        }
        executionState.status = 'executing';
        return NextResponse.json({ success: true, message: 'Execution resumed' });
        
      case 'stop':
        executionState.status = 'idle';
        executionState.currentFile = null;
        executionState.currentMessage = null;
        executionState.currentTask = null;
        return NextResponse.json({ success: true, message: 'Execution stopped' });
        
      case 'skip':
        // Skip current task
        if (executionState.status === 'executing' && executionState.currentTask) {
          executionState.overallProgress.tasksDone += 1;
          executionState.overallProgress.percentage = Math.round(
            (executionState.overallProgress.tasksDone / executionState.overallProgress.tasksTotal) * 100
          );
        }
        return NextResponse.json({ success: true, message: 'Task skipped' });
        
      case 'retry':
        // Retry current task
        return NextResponse.json({ success: true, message: 'Task retry initiated' });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Control error:', error);
    return NextResponse.json(
      { error: 'Control action failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}