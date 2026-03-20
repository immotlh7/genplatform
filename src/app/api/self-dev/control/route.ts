import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface SelfDevConfig {
  autoMode: boolean;
  lastUpdated: string;
}

const CONFIG_FILE = '/root/genplatform/data/self-dev-config.json';
const TASK_QUEUE_FILE = '/root/genplatform/data/task-queue/task-queue.json';
const EXECUTION_LOG_FILE = '/root/genplatform/data/execution-log.json';

async function getConfig(): Promise<SelfDevConfig> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    const defaultConfig: SelfDevConfig = {
      autoMode: false,
      lastUpdated: new Date().toISOString()
    };
    await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
}

async function setConfig(config: SelfDevConfig) {
  config.lastUpdated = new Date().toISOString();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function addLog(log: any) {
  try {
    let logs = [];
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

async function triggerExecuteNext() {
  try {
    const response = await fetch('http://localhost:3000/api/self-dev/execute-next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to trigger execute-next:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'start': {
        // Set auto-mode ON and start execution
        const config = await getConfig();
        config.autoMode = true;
        await setConfig(config);
        
        // Also update queue's autoMode flag
        try {
          const queueData = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
          const queue = JSON.parse(queueData);
          queue.autoMode = true;
          await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
        } catch (error) {
          console.error('Failed to update queue autoMode:', error);
        }
        
        await addLog({
          timestamp: new Date().toISOString(),
          type: 'info',
          message: '▶️ Execution started - Auto-mode enabled'
        });
        
        // Trigger first task
        const success = await triggerExecuteNext();
        
        return NextResponse.json({ 
          action: 'start',
          autoMode: true,
          success,
          message: success ? 'Execution started' : 'Failed to start execution'
        });
      }
      
      case 'pause': {
        // Set auto-mode OFF (current task will finish)
        const config = await getConfig();
        config.autoMode = false;
        await setConfig(config);
        
        // Also update queue's autoMode flag
        try {
          const queueData = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
          const queue = JSON.parse(queueData);
          queue.autoMode = false;
          await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
        } catch (error) {
          console.error('Failed to update queue autoMode:', error);
        }
        
        await addLog({
          timestamp: new Date().toISOString(),
          type: 'info',
          message: '⏸️ Execution paused - Current task will complete'
        });
        
        return NextResponse.json({ 
          action: 'pause',
          autoMode: false,
          message: 'Execution paused'
        });
      }
      
      case 'resume': {
        // Set auto-mode ON and continue
        const config = await getConfig();
        config.autoMode = true;
        await setConfig(config);
        
        // Also update queue's autoMode flag
        try {
          const queueData = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
          const queue = JSON.parse(queueData);
          queue.autoMode = true;
          await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
        } catch (error) {
          console.error('Failed to update queue autoMode:', error);
        }
        
        await addLog({
          timestamp: new Date().toISOString(),
          type: 'info',
          message: '▶️ Execution resumed - Auto-mode enabled'
        });
        
        // Trigger next task
        const success = await triggerExecuteNext();
        
        return NextResponse.json({ 
          action: 'resume',
          autoMode: true,
          success,
          message: success ? 'Execution resumed' : 'Failed to resume execution'
        });
      }
      
      case 'skip': {
        // Mark current executing task as skipped
        try {
          const queueData = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
          const queue = JSON.parse(queueData);
          
          let skippedTask = null;
          for (const batch of queue.batches || []) {
            for (const task of batch.tasks || []) {
              if (task.status === 'executing') {
                task.status = 'skipped';
                task.skipReason = 'Manual skip';
                task.skippedAt = new Date().toISOString();
                skippedTask = task;
                break;
              }
            }
            if (skippedTask) break;
          }
          
          if (skippedTask) {
            await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
            
            await addLog({
              timestamp: new Date().toISOString(),
              type: 'info',
              message: `⏭️ Skipped task: ${skippedTask.id} - ${skippedTask.description}`,
              taskId: skippedTask.id
            });
            
            // If auto-mode is on, trigger next task
            const config = await getConfig();
            if (config.autoMode) {
              await triggerExecuteNext();
            }
            
            return NextResponse.json({ 
              action: 'skip',
              taskId: skippedTask.id,
              message: 'Task skipped successfully'
            });
          } else {
            return NextResponse.json({ 
              action: 'skip',
              error: 'No executing task found to skip'
            }, { status: 404 });
          }
        } catch (error) {
          console.error('Failed to skip task:', error);
          return NextResponse.json({ 
            action: 'skip',
            error: 'Failed to skip task'
          }, { status: 500 });
        }
      }
      
      case 'retry': {
        // Find the last failed task and retry it
        try {
          const queueData = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
          const queue = JSON.parse(queueData);
          
          let failedTask = null;
          // Find the most recent failed task
          for (const batch of queue.batches || []) {
            for (const task of batch.tasks || []) {
              if (task.status === 'failed' || (task.status === 'skipped' && task.retryCount >= 3)) {
                failedTask = task;
              }
            }
          }
          
          if (failedTask) {
            // Reset task for retry
            failedTask.status = 'approved';
            failedTask.retryCount = (failedTask.retryCount || 0) + 1;
            delete failedTask.startedAt;
            delete failedTask.completedAt;
            delete failedTask.skippedAt;
            
            await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
            
            await addLog({
              timestamp: new Date().toISOString(),
              type: 'info',
              message: `🔄 Retrying task: ${failedTask.id} - ${failedTask.description} (Attempt ${failedTask.retryCount})`,
              taskId: failedTask.id
            });
            
            // Trigger execution
            const success = await triggerExecuteNext();
            
            return NextResponse.json({ 
              action: 'retry',
              taskId: failedTask.id,
              retryCount: failedTask.retryCount,
              success,
              message: success ? 'Task queued for retry' : 'Failed to retry task'
            });
          } else {
            return NextResponse.json({ 
              action: 'retry',
              error: 'No failed task found to retry'
            }, { status: 404 });
          }
        } catch (error) {
          console.error('Failed to retry task:', error);
          return NextResponse.json({ 
            action: 'retry',
            error: 'Failed to retry task'
          }, { status: 500 });
        }
      }
      
      default:
        return NextResponse.json({ 
          error: 'Invalid action',
          validActions: ['start', 'pause', 'resume', 'skip', 'retry']
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Control error:', error);
    return NextResponse.json(
      { error: 'Failed to process control action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}