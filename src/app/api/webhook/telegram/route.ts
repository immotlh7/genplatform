import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_FILE = '/root/genplatform/data/task-queue/task-queue.json';
const EXECUTION_LOG_FILE = '/root/genplatform/data/execution-log.json';
const CONFIG_FILE = '/root/genplatform/data/self-dev-config.json';

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
    // Import and call execute-next directly
    const { executeNext } = await import('../self-dev/execute-next/route');
    const result = await executeNext();
    console.log('[WEBHOOK] Execute next result:', result);
    return result;
  } catch (error) {
    console.error('[WEBHOOK] Failed to execute next task:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[WEBHOOK] Received telegram webhook:', JSON.stringify(body, null, 2));
    
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
      
      // Find and update the executing task
      try {
        const queueData = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
        const queue = JSON.parse(queueData);
        let foundTask = false;
        
        for (const msg of queue.messages || []) {
          for (const task of msg.tasks || []) {
            // Check main task
            if (task.status === 'executing') {
              task.status = 'done';
              task.completedAt = new Date().toISOString();
              foundTask = true;
              
              await addLog({
                timestamp: new Date().toISOString(),
                type: 'task_done',
                message: `✅ Task completed: ${task.taskId}`,
                taskId: task.taskId
              });
              break;
            }
            
            // Check micro-tasks
            if (task.microTasks) {
              for (const micro of task.microTasks) {
                if (micro.status === 'executing') {
                  micro.status = 'done';
                  micro.completedAt = new Date().toISOString();
                  foundTask = true;
                  
                  await addLog({
                    timestamp: new Date().toISOString(),
                    type: 'task_done',
                    message: `✅ Micro-task completed: ${micro.id}`,
                    taskId: micro.id
                  });
                  break;
                }
              }
            }
            if (foundTask) break;
          }
          if (foundTask) break;
        }
        
        if (foundTask) {
          await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
          
          // Check if auto-mode is on
          const config = await getConfig();
          if (config.autoMode) {
            // Execute next task
            await executeNextTask();
          }
        }
      } catch (error) {
        console.error('[WEBHOOK] Failed to update task status:', error);
      }
    } else if (text.includes('❌') || text.includes('fail') || text.includes('error')) {
      console.log('[WEBHOOK] Task marked as failed');
      
      // Find and update the executing task
      try {
        const queueData = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
        const queue = JSON.parse(queueData);
        let foundTask = false;
        
        for (const msg of queue.messages || []) {
          for (const task of msg.tasks || []) {
            // Check main task
            if (task.status === 'executing') {
              task.status = 'failed';
              task.failedAt = new Date().toISOString();
              task.failureReason = message.text;
              foundTask = true;
              
              await addLog({
                timestamp: new Date().toISOString(),
                type: 'task_failed',
                message: `❌ Task failed: ${task.taskId} - ${message.text}`,
                taskId: task.taskId
              });
              break;
            }
            
            // Check micro-tasks
            if (task.microTasks) {
              for (const micro of task.microTasks) {
                if (micro.status === 'executing') {
                  micro.status = 'failed';
                  micro.failedAt = new Date().toISOString();
                  micro.failureReason = message.text;
                  foundTask = true;
                  
                  await addLog({
                    timestamp: new Date().toISOString(),
                    type: 'task_failed',
                    message: `❌ Micro-task failed: ${micro.id} - ${message.text}`,
                    taskId: micro.id
                  });
                  break;
                }
              }
            }
            if (foundTask) break;
          }
          if (foundTask) break;
        }
        
        if (foundTask) {
          await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
          
          // Check if auto-mode is on (might want to pause on failures)
          const config = await getConfig();
          if (config.autoMode && !text.includes('stop')) {
            // Execute next task even after failure
            await executeNextTask();
          }
        }
      } catch (error) {
        console.error('[WEBHOOK] Failed to update task status:', error);
      }
    }
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('[WEBHOOK] Webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return ok to Telegram
  }
}