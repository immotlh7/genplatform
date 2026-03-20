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

// Helper to get current executing task
async function getCurrentExecutingTask(): Promise<any | null> {
  const files = await fs.readdir(TASK_QUEUE_DIR).catch(() => []);
  
  for (const file of files.sort()) {
    if (!file.endsWith('.json')) continue;
    
    const queuePath = path.join(TASK_QUEUE_DIR, file);
    const queue = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
    
    // Find executing micro-task
    for (const message of queue.messages) {
      for (const task of message.tasks) {
        if (!task.microTasks) continue;
        
        for (const microTask of task.microTasks) {
          if (microTask.status === 'executing') {
            return {
              fileId: queue.fileId,
              microTask,
              queue,
              queuePath
            };
          }
        }
      }
    }
  }
  
  return null;
}

// Helper to trigger next task execution
async function triggerNextTask() {
  if (!executionState.autoMode) {
    await appendLog('⏸️ Auto-mode is OFF, not triggering next task');
    return;
  }
  
  // Wait 10 seconds before next task
  setTimeout(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/self-dev/execute-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        await appendLog('❌ Failed to trigger next task');
      }
    } catch (error) {
      await appendLog(`❌ Error triggering next task: ${error}`);
    }
  }, 10000);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Parse Telegram webhook data
    const message = body.message || body.edited_message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }
    
    const text = message.text.trim();
    const chatId = message.chat.id;
    
    // Only process messages from our OpenClaw chat
    if (chatId.toString() !== '510906393') {
      return NextResponse.json({ ok: true });
    }
    
    // Check if this is an orchestrator rewrite response
    if (text.includes('[ORCHESTRATOR]') || text.includes('[Task')) {
      await appendLog('🧠 Received Orchestrator rewrite response');
      
      // TODO: Parse rewritten tasks and update queue
      // For now, just log it
      await appendLog('📝 Rewrite response received (manual update needed)');
      
      return NextResponse.json({ ok: true });
    }
    
    // Otherwise handle as Developer response
    await appendLog(`📝 Developer response: ${text.substring(0, 100)}...`);
    
    // Detect response type
    if (text.includes('✅ Done') || text.includes('✅ DONE')) {
      // Task completed successfully
      await appendLog('✅ Task completed successfully');
      
      const currentData = await getCurrentExecutingTask();
      if (currentData) {
        currentData.microTask.status = 'done';
        await fs.writeFile(currentData.queuePath, JSON.stringify(currentData.queue, null, 2));
        
        executionState.tasksProcessed++;
        executionState.contextTokens += 700; // Approximate response size
        
        // Reset retry count for this task
        executionState.retryCount.delete(currentData.microTask.id);
        
        // Trigger next task
        await triggerNextTask();
      }
      
    } else if (text.includes('❌ Failed') || text.includes('❌ Error')) {
      // Task failed
      await appendLog('❌ Task failed');
      
      const currentData = await getCurrentExecutingTask();
      if (currentData) {
        const taskId = currentData.microTask.id;
        const retries = executionState.retryCount.get(taskId) || 0;
        
        if (retries < 3) {
          // Retry the task
          executionState.retryCount.set(taskId, retries + 1);
          await appendLog(`🔄 Retrying task (attempt ${retries + 2}/3)`);
          
          // Re-send the same task with retry message
          setTimeout(async () => {
            const response = await fetch('http://localhost:3000/api/self-dev/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                task: currentData.microTask,
                projectContext: `Retry ${retries + 2}/3 - Previous attempt failed. Please try again.`
              })
            });
            
            if (response.ok) {
              await appendLog(`📤 Resent task for retry`);
            }
          }, 5000);
          
        } else {
          // Max retries reached, skip task
          currentData.microTask.status = 'skipped';
          await fs.writeFile(currentData.queuePath, JSON.stringify(currentData.queue, null, 2));
          await appendLog('⏭️ Max retries reached, task skipped');
          
          // Move to next task
          await triggerNextTask();
        }
      }
      
    } else if (text.includes('Building') || text.includes('npm run build')) {
      // Build output
      await appendLog('⚙️ Build in progress...');
      executionState.status = 'building';
      
    } else if (text.includes('committed') || text.includes('git commit')) {
      // Commit message
      await appendLog('📦 Code committed');
      
    } else if (text.includes('/reset acknowledged')) {
      // Context reset acknowledged
      await appendLog('🧠 Context reset acknowledged by Developer');
      executionState.contextTokens = 500; // Reset to base context size
    }
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    await appendLog(`❌ Webhook error: ${error}`);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}