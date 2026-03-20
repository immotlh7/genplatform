import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface ExecutionLog {
  timestamp: string;
  type: 'task_sent' | 'task_done' | 'task_failed' | 'build' | 'reset' | 'error' | 'info' | 'developer_message';
  message: string;
  taskId?: string;
  raw?: string;
}

interface SelfDevConfig {
  autoMode: boolean;
  lastUpdated: string;
}

const TASK_QUEUE_FILE = '/root/genplatform/data/task-queue/task-queue.json';
const EXECUTION_LOG_FILE = '/root/genplatform/data/execution-log.json';
const CONFIG_FILE = '/root/genplatform/data/self-dev-config.json';

async function getConfig(): Promise<SelfDevConfig> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { autoMode: false, lastUpdated: new Date().toISOString() };
  }
}

async function addLog(log: ExecutionLog) {
  try {
    let logs: ExecutionLog[] = [];
    try {
      const data = await fs.readFile(EXECUTION_LOG_FILE, 'utf-8');
      logs = JSON.parse(data);
    } catch {
      await fs.mkdir(path.dirname(EXECUTION_LOG_FILE), { recursive: true });
    }
    logs.push(log);
    // Keep only last 1000 logs
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }
    await fs.writeFile(EXECUTION_LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

async function getCurrentExecutingTask() {
  try {
    const data = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
    const queue = JSON.parse(data);
    
    for (const batch of queue.batches || []) {
      for (const task of batch.tasks || []) {
        if (task.status === 'executing') {
          return { task, batch, queue };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function triggerNextTask() {
  // Call execute-next API after a delay
  setTimeout(async () => {
    try {
      await fetch('http://localhost:3000/api/self-dev/execute-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Failed to trigger next task:', error);
    }
  }, 10000); // Wait 10 seconds before next task
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle both webhook formats (self-dev specific and general telegram)
    const message = body.message || body;
    const text = message?.text || message?.content || '';
    const from = message?.from || {};
    
    if (!text) {
      return NextResponse.json({ success: true });
    }

    // Log the incoming message
    await addLog({
      timestamp: new Date().toISOString(),
      type: 'developer_message',
      message: `Developer: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`,
      raw: text
    });

    // Get current executing task
    const currentTaskData = await getCurrentExecutingTask();
    
    if (!currentTaskData) {
      // No task currently executing
      await addLog({
        timestamp: new Date().toISOString(),
        type: 'info',
        message: 'Received message but no task is currently executing'
      });
      return NextResponse.json({ success: true });
    }

    const { task, batch, queue } = currentTaskData;

    // Check for task completion
    if (text.includes('✅') || text.toLowerCase().includes('done') || text.toLowerCase().includes('complete')) {
      task.status = 'done';
      task.completedAt = new Date().toISOString();
      
      await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
      
      await addLog({
        timestamp: new Date().toISOString(),
        type: 'task_done',
        message: `Task ${task.id} completed successfully - ${task.description}`,
        taskId: task.id
      });

      // Check if auto-mode is on from config file
      const config = await getConfig();
      if (config.autoMode) {
        await addLog({
          timestamp: new Date().toISOString(),
          type: 'info',
          message: 'Auto-mode enabled, triggering next task in 10 seconds...'
        });
        triggerNextTask();
      }
    }
    // Check for task failure
    else if (text.includes('❌') || text.toLowerCase().includes('failed') || text.toLowerCase().includes('error')) {
      task.retryCount = (task.retryCount || 0) + 1;
      
      if (task.retryCount < 3) {
        // Retry the task
        task.status = 'approved'; // Reset to approved for retry
        task.lastError = text;
        
        await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
        
        await addLog({
          timestamp: new Date().toISOString(),
          type: 'task_failed',
          message: `Task ${task.id} failed (attempt ${task.retryCount}/3), will retry in 15 seconds`,
          taskId: task.id
        });
        
        // Check auto-mode for retry
        const config = await getConfig();
        if (config.autoMode) {
          // Retry after 15 seconds
          setTimeout(async () => {
            try {
              await fetch('http://localhost:3000/api/self-dev/execute-next', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });
            } catch (error) {
              console.error('Failed to retry task:', error);
            }
          }, 15000);
        }
      } else {
        // Skip after 3 failed attempts
        task.status = 'skipped';
        task.skipReason = 'Failed after 3 attempts';
        task.lastError = text;
        
        await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
        
        await addLog({
          timestamp: new Date().toISOString(),
          type: 'error',
          message: `Task ${task.id} skipped after 3 failed attempts`,
          taskId: task.id
        });
        
        // Continue to next task if auto-mode
        const config = await getConfig();
        if (config.autoMode) {
          triggerNextTask();
        }
      }
    }
    // Check for build messages
    else if (text.toLowerCase().includes('build')) {
      await addLog({
        timestamp: new Date().toISOString(),
        type: 'build',
        message: text
      });
      
      // If build successful, might contain done message too
      if (text.includes('✅') || text.toLowerCase().includes('success')) {
        task.status = 'done';
        task.completedAt = new Date().toISOString();
        
        await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
        
        await addLog({
          timestamp: new Date().toISOString(),
          type: 'task_done',
          message: `Task ${task.id} completed with build`,
          taskId: task.id
        });
        
        const config = await getConfig();
        if (config.autoMode) {
          triggerNextTask();
        }
      }
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    
    await addLog({
      timestamp: new Date().toISOString(),
      type: 'error',
      message: `Webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}