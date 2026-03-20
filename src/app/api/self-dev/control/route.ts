import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { executionState } from '../status/route';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';
const EXECUTION_LOG_FILE = '/root/genplatform/data/self-dev-execution.log';

// Helper to append to log
async function appendLog(entry: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} | ${entry}\n`;
  await fs.appendFile(EXECUTION_LOG_FILE, logEntry).catch(() => {});
}

export async function POST(request: NextRequest) {
  try {
    const { action, confirmation } = await request.json();
    
    switch (action) {
      case 'start':
        if (executionState.status === 'executing') {
          return NextResponse.json({ error: 'Already executing' }, { status: 400 });
        }
        
        executionState.status = 'executing';
        executionState.autoMode = true;
        executionState.startTime = new Date();
        await appendLog('▶️ Execution started');
        
        // Trigger first task
        setTimeout(async () => {
          await fetch('http://localhost:3000/api/self-dev/execute-next', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
        }, 1000);
        
        return NextResponse.json({ success: true, message: 'Execution started' });
        
      case 'pause':
        executionState.autoMode = false;
        executionState.status = 'paused';
        await appendLog('⏸️ Execution paused (will finish current task)');
        return NextResponse.json({ success: true, message: 'Execution paused' });
        
      case 'resume':
        if (executionState.status !== 'paused') {
          return NextResponse.json({ error: 'Not paused' }, { status: 400 });
        }
        
        executionState.autoMode = true;
        executionState.status = 'executing';
        await appendLog('▶️ Execution resumed');
        
        // Trigger next task
        setTimeout(async () => {
          await fetch('http://localhost:3000/api/self-dev/execute-next', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
        }, 1000);
        
        return NextResponse.json({ success: true, message: 'Execution resumed' });
        
      case 'skip':
        if (!executionState.currentTask) {
          return NextResponse.json({ error: 'No task to skip' }, { status: 400 });
        }
        
        await appendLog(`⏭️ Skipping current task: ${executionState.currentTask.description}`);
        
        // Mark current task as skipped and trigger next
        const skipFiles = await fs.readdir(TASK_QUEUE_DIR).catch(() => []);
        for (const file of skipFiles) {
          if (!file.endsWith('.json')) continue;
          
          const queuePath = path.join(TASK_QUEUE_DIR, file);
          const queue = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
          
          // Find and skip current task
          let found = false;
          for (const message of queue.messages) {
            for (const task of message.microTasks) {
              if (task.status === 'executing') {
                task.status = 'skipped';
                found = true;
                break;
              }
            }
            if (found) break;
          }
          
          if (found) {
            await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
            
            // Trigger next task
            setTimeout(async () => {
              await fetch('http://localhost:3000/api/self-dev/execute-next', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
              });
            }, 1000);
            
            break;
          }
        }
        
        return NextResponse.json({ success: true, message: 'Task skipped' });
        
      case 'retry':
        if (!executionState.currentTask) {
          return NextResponse.json({ error: 'No task to retry' }, { status: 400 });
        }
        
        await appendLog('🔄 Retrying current task');
        
        // Re-execute current task
        const currentTaskData = executionState.currentTask;
        setTimeout(async () => {
          await fetch('http://localhost:3000/api/self-dev/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task: { description: currentTaskData.description },
              projectContext: 'Manual retry requested'
            })
          });
        }, 1000);
        
        return NextResponse.json({ success: true, message: 'Task retry initiated' });
        
      case 'reset':
        if (confirmation !== 'CONFIRM_RESET') {
          return NextResponse.json({ 
            error: 'Dangerous operation - requires confirmation: CONFIRM_RESET' 
          }, { status: 400 });
        }
        
        await appendLog('🔄 RESETTING ALL TASKS TO PENDING');
        
        // Reset all tasks in all queues
        const resetFiles = await fs.readdir(TASK_QUEUE_DIR).catch(() => []);
        for (const file of resetFiles) {
          if (!file.endsWith('.json')) continue;
          
          const queuePath = path.join(TASK_QUEUE_DIR, file);
          const queue = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
          
          // Reset all tasks
          for (const message of queue.messages) {
            for (const task of message.microTasks) {
              task.status = 'pending';
            }
          }
          
          await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
        }
        
        // Reset execution state
        executionState.currentFile = null;
        executionState.currentMessage = null;
        executionState.currentTask = null;
        executionState.currentBatch = null;
        executionState.status = 'idle';
        executionState.contextTokens = 0;
        executionState.tasksProcessed = 0;
        executionState.retryCount.clear();
        
        return NextResponse.json({ success: true, message: 'All tasks reset to pending' });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Control error:', error);
    await appendLog(`❌ Control error: ${error}`);
    return NextResponse.json({ error: 'Control action failed' }, { status: 500 });
  }
}