import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_FILE = '/root/genplatform/data/task-queue/task-queue.json';
const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';
const EXECUTION_LOG_FILE = '/root/genplatform/data/execution-log.json';
const CONFIG_FILE = '/root/genplatform/data/self-dev-config.json';
const CURRENT_TASK_FILE = '/root/genplatform/data/current-task.json';

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
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }
    await fs.writeFile(EXECUTION_LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

async function executeNextTask() {
  try {
    // Call execute-next API directly
    const response = await fetch('http://localhost:3000/api/self-dev/execute-next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await response.json();
    console.log('[WEBHOOK] Execute next result:', result);
    return result;
  } catch (error) {
    console.error('[WEBHOOK] Failed to execute next task:', error);
  }
}

async function updateTaskStatus(taskId: string, status: string, additionalData: any = {}) {
  try {
    // Update main task-queue.json
    const queueData = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
    const queue = JSON.parse(queueData);
    let foundTask = false;
    let fileId = '';
    
    for (const msg of queue.messages || []) {
      for (const task of msg.tasks || []) {
        if (task.taskId === taskId || task.status === 'executing') {
          task.status = status;
          Object.assign(task, additionalData);
          foundTask = true;
          fileId = task.taskId.split('-msg')[0];
          break;
        }
      }
      if (foundTask) break;
    }
    
    if (foundTask) {
      await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
      
      // Also update individual queue file
      if (fileId) {
        try {
          const individualPath = path.join(TASK_QUEUE_DIR, fileId + '.json');
          const individualData = await fs.readFile(individualPath, 'utf-8');
          const individualQueue = JSON.parse(individualData);
          
          for (const msg of individualQueue.messages || []) {
            for (const task of msg.tasks || []) {
              if (task.taskId === taskId || task.status === 'executing') {
                task.status = status;
                Object.assign(task, additionalData);
              }
            }
          }
          
          await fs.writeFile(individualPath, JSON.stringify(individualQueue, null, 2));
        } catch (e) {
          console.error('[WEBHOOK] Failed to update individual queue file:', e);
        }
      }
      
      // Update current-task.json status
      try {
        const currentData = await fs.readFile(CURRENT_TASK_FILE, 'utf-8');
        const currentTask = JSON.parse(currentData);
        if (currentTask.taskId === taskId) {
          currentTask.task.status = status;
          if (status === 'done') {
            currentTask.completedTasks++;
          }
          await fs.writeFile(CURRENT_TASK_FILE, JSON.stringify(currentTask, null, 2));
        }
      } catch {}
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[WEBHOOK] Failed to update task status:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[WEBHOOK] Received telegram webhook');
    
    // Check if this is a message from our bot chat
    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true });
    }
    
    const message = body.message;
    const text = message.text.toLowerCase();
    
    // Only process messages from the correct chat
    if (message.chat.id !== 8630551989) {
      return NextResponse.json({ ok: true });
    }
    
    // Log the message
    await addLog({
      timestamp: new Date().toISOString(),
      type: 'developer_message',
      message: `Developer: ${message.text}`,
      raw: JSON.stringify(message)
    });
    
    // Check if message indicates task completion
    if (text.includes('✅') || text.includes('done') || text.includes('complete')) {
      console.log('[WEBHOOK] Task marked as done');
      
      const updated = await updateTaskStatus('', 'done', {
        completedAt: new Date().toISOString(),
        completedIcon: '✅'
      });
      
      if (updated) {
        await addLog({
          timestamp: new Date().toISOString(),
          type: 'task_done',
          message: `✅ Task completed`
        });
        
        // Check if auto-mode is on
        const config = await getConfig();
        if (config.autoMode) {
          // Wait 2 seconds then execute next task
          setTimeout(() => {
            executeNextTask();
          }, 2000);
        }
      }
    } else if (text.includes('❌') || text.includes('fail') || text.includes('error')) {
      console.log('[WEBHOOK] Task marked as failed');
      
      const updated = await updateTaskStatus('', 'failed', {
        failedAt: new Date().toISOString(),
        failureReason: message.text
      });
      
      if (updated) {
        await addLog({
          timestamp: new Date().toISOString(),
          type: 'task_failed',
          message: `❌ Task failed: ${message.text}`
        });
        
        // Check if auto-mode is on (might want to pause on failures)
        const config = await getConfig();
        if (config.autoMode && !text.includes('stop')) {
          // Execute next task even after failure
          setTimeout(() => {
            executeNextTask();
          }, 2000);
        }
      }
    }
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('[WEBHOOK] Webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return ok to Telegram
  }
}