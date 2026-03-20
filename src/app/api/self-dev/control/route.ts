import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { executeNext } from '../execute-next/route';

const CONFIG_FILE = '/root/genplatform/data/self-dev-config.json';
const EXECUTION_LOG_FILE = '/root/genplatform/data/execution-log.json';
const TASK_QUEUE_FILE = '/root/genplatform/data/task-queue/task-queue.json';

interface SelfDevConfig {
  autoMode: boolean;
  lastUpdated: string;
  retryEnabled?: boolean;
  retryInterval?: number; // minutes
}

interface ExecutionLog {
  timestamp: string;
  type: 'task_sent' | 'task_done' | 'task_failed' | 'build' | 'reset' | 'error' | 'info' | 'api_limit';
  message: string;
  taskId?: string;
}

async function getConfig(): Promise<SelfDevConfig> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { 
      autoMode: false, 
      lastUpdated: new Date().toISOString(),
      retryEnabled: true,
      retryInterval: 15 
    };
  }
}

async function saveConfig(config: SelfDevConfig) {
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
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
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }
    await fs.writeFile(EXECUTION_LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

let retryTimer: NodeJS.Timeout | null = null;

async function startRetryLoop(intervalMinutes: number = 15) {
  // Clear existing timer
  if (retryTimer) {
    clearInterval(retryTimer);
  }
  
  // Set up new retry loop
  retryTimer = setInterval(async () => {
    const config = await getConfig();
    if (!config.autoMode) {
      console.log('[CONTROL] Auto-mode disabled, stopping retry loop');
      if (retryTimer) clearInterval(retryTimer);
      return;
    }
    
    try {
      console.log('[CONTROL] Attempting auto-retry...');
      await addLog({
        timestamp: new Date().toISOString(),
        type: 'info',
        message: `🔄 Auto-retry attempt (every ${intervalMinutes} minutes)`
      });
      
      const result = await executeNext();
      
      if (result.error && result.error.includes('API rate limit')) {
        console.log('[CONTROL] Still in API cooldown, will retry later');
      } else if (result.sent) {
        console.log('[CONTROL] Successfully sent task via retry');
      }
    } catch (error) {
      console.error('[CONTROL] Retry error:', error);
    }
  }, intervalMinutes * 60 * 1000);
  
  await addLog({
    timestamp: new Date().toISOString(),
    type: 'info',
    message: `⏰ Auto-retry enabled: will check every ${intervalMinutes} minutes for pending tasks`
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action, autoMode } = await request.json();
    const config = await getConfig();
    
    let result: any = { action };
    
    switch (action) {
      case 'start':
      case 'resume':
        // Enable auto mode
        config.autoMode = true;
        config.lastUpdated = new Date().toISOString();
        config.retryEnabled = true;
        config.retryInterval = 15;
        await saveConfig(config);
        
        await addLog({
          timestamp: new Date().toISOString(),
          type: 'info',
          message: action === 'start' ? '▶️ Execution started - Auto-mode enabled' : '▶️ Execution resumed - Auto-mode enabled'
        });
        
        // Start retry loop
        await startRetryLoop(config.retryInterval || 15);
        
        // Try to execute next task
        const executeResult = await executeNext();
        result.autoMode = true;
        result.success = !executeResult.error;
        result.message = executeResult.error ? 'No approved tasks found' : 'Execution started';
        result.result = executeResult;
        break;
        
      case 'pause':
      case 'stop':
        // Disable auto mode
        config.autoMode = false;
        config.lastUpdated = new Date().toISOString();
        await saveConfig(config);
        
        // Stop retry timer
        if (retryTimer) {
          clearInterval(retryTimer);
          retryTimer = null;
        }
        
        await addLog({
          timestamp: new Date().toISOString(),
          type: 'info',
          message: '⏸️ Execution paused - Auto-mode disabled'
        });
        
        result.autoMode = false;
        result.success = true;
        result.message = 'Execution paused';
        break;
        
      case 'skip':
        // Mark current executing task as skipped
        try {
          const queueData = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
          const queue = JSON.parse(queueData);
          let skipped = false;
          
          for (const msg of queue.messages || []) {
            for (const task of msg.tasks || []) {
              if (task.status === 'executing') {
                task.status = 'skipped';
                task.skippedAt = new Date().toISOString();
                skipped = true;
                
                await addLog({
                  timestamp: new Date().toISOString(),
                  type: 'info',
                  message: `⏭️ Task skipped: ${task.taskId}`,
                  taskId: task.taskId
                });
                break;
              }
            }
            if (skipped) break;
          }
          
          if (skipped) {
            await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
            
            // Execute next if in auto mode
            if (config.autoMode) {
              const executeResult = await executeNext();
              result.result = executeResult;
            }
          }
          
          result.success = skipped;
          result.message = skipped ? 'Task skipped' : 'No executing task found';
        } catch (error) {
          result.success = false;
          result.message = 'Failed to skip task';
        }
        break;
        
      case 'retry':
        // Retry failed task
        try {
          const queueData = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
          const queue = JSON.parse(queueData);
          let retried = false;
          
          for (const msg of queue.messages || []) {
            for (const task of msg.tasks || []) {
              if (task.status === 'failed') {
                task.status = 'approved';
                task.retryCount = (task.retryCount || 0) + 1;
                delete task.failedAt;
                delete task.failureReason;
                retried = true;
                
                await addLog({
                  timestamp: new Date().toISOString(),
                  type: 'info',
                  message: `🔄 Task queued for retry: ${task.taskId} (attempt ${task.retryCount})`,
                  taskId: task.taskId
                });
                break;
              }
            }
            if (retried) break;
          }
          
          if (retried) {
            await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
            
            // Execute if in auto mode
            if (config.autoMode) {
              const executeResult = await executeNext();
              result.result = executeResult;
            }
          }
          
          result.success = retried;
          result.message = retried ? 'Task queued for retry' : 'No failed task found';
        } catch (error) {
          result.success = false;
          result.message = 'Failed to retry task';
        }
        break;
        
      default:
        result.success = false;
        result.message = 'Invalid action';
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Control error:', error);
    return NextResponse.json(
      { error: 'Failed to process control action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}