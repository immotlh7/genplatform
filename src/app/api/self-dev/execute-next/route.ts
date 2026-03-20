import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface SessionTracker {
  tasksSentInSession: number;
  lastReset: string;
  totalTasksSent: number;
  currentBatch: number;
  tasksInCurrentBatch: number;
}

interface ExecutionLog {
  timestamp: string;
  type: 'task_sent' | 'task_done' | 'task_failed' | 'build' | 'reset' | 'error' | 'info';
  message: string;
  taskId?: string;
}

const TASK_QUEUE_FILE = '/root/genplatform/data/task-queue/task-queue.json';
const SESSION_TRACKER_FILE = '/root/genplatform/data/session-tracker.json';
const EXECUTION_LOG_FILE = '/root/genplatform/data/execution-log.json';

const TELEGRAM_BOT_TOKEN = '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = '510906393';

async function getSessionTracker(): Promise<SessionTracker> {
  try {
    const data = await fs.readFile(SESSION_TRACKER_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    const defaultTracker: SessionTracker = {
      tasksSentInSession: 0,
      lastReset: new Date().toISOString(),
      totalTasksSent: 0,
      currentBatch: 1,
      tasksInCurrentBatch: 0
    };
    await fs.mkdir(path.dirname(SESSION_TRACKER_FILE), { recursive: true });
    await fs.writeFile(SESSION_TRACKER_FILE, JSON.stringify(defaultTracker, null, 2));
    return defaultTracker;
  }
}

async function updateSessionTracker(tracker: SessionTracker) {
  await fs.writeFile(SESSION_TRACKER_FILE, JSON.stringify(tracker, null, 2));
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

async function sendToTelegram(text: string): Promise<boolean> {
  console.log('[EXECUTE-NEXT] Attempting to send to Telegram:', text.substring(0, 100) + '...');
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });
    
    const result = await response.json();
    console.log('[EXECUTE-NEXT] Telegram response:', result);
    
    return response.ok;
  } catch (error) {
    console.error('[EXECUTE-NEXT] Failed to send to Telegram:', error);
    return false;
  }
}

export async function executeNext() {
  console.log('[EXECUTE-NEXT] Starting executeNext function');
  
  try {
    // Load task queue
    let queue;
    try {
      const data = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
      queue = JSON.parse(data);
      console.log('[EXECUTE-NEXT] Loaded queue with', queue.batches?.length || 0, 'batches');
    } catch (error) {
      console.error('[EXECUTE-NEXT] Failed to load queue:', error);
      return { 
        error: 'No task queue found',
        message: 'Please analyze a file first' 
      };
    }

    // Find next approved but unexecuted task
    let foundTask = null;
    let foundBatch = null;
    
    console.log('[EXECUTE-NEXT] Looking for approved tasks...');
    
    for (const batch of queue.batches || []) {
      for (const task of batch.tasks || []) {
        console.log(`[EXECUTE-NEXT] Checking task ${task.id}: approved=${task.approved}, status=${task.status}`);
        if (task.approved && (!task.status || task.status === 'approved')) {
          foundTask = task;
          foundBatch = batch;
          console.log('[EXECUTE-NEXT] Found task to execute:', task.id, task.description);
          break;
        }
      }
      if (foundTask) break;
    }

    if (!foundTask || !foundBatch) {
      console.log('[EXECUTE-NEXT] No approved tasks found');
      await addLog({
        timestamp: new Date().toISOString(),
        type: 'info',
        message: 'No approved tasks found to execute'
      });
      
      return { 
        message: 'No approved tasks found',
        completed: true 
      };
    }

    // Get session tracker
    const tracker = await getSessionTracker();
    console.log('[EXECUTE-NEXT] Session tracker:', tracker);
    
    // Check if we need to reset context (every 40 tasks)
    if (tracker.tasksSentInSession >= 40) {
      console.log('[EXECUTE-NEXT] Context reset required');
      await addLog({
        timestamp: new Date().toISOString(),
        type: 'reset',
        message: '🧠 Context reset required after 40 tasks'
      });

      // Send /reset command
      await sendToTelegram('/reset');
      
      // Wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Send context refresh
      const contextRefresh = `Read ~/.openclaw/workspace/memory/WORK-RULES.md. You are developing GenPlatform.ai at /root/genplatform. Continue with next task.`;
      await sendToTelegram(contextRefresh);
      
      // Wait another 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Reset session counter
      tracker.tasksSentInSession = 0;
      tracker.lastReset = new Date().toISOString();
      await updateSessionTracker(tracker);

      await addLog({
        timestamp: new Date().toISOString(),
        type: 'reset',
        message: '🧠 Context reset complete - session refreshed'
      });
    }

    // Update task status to executing
    foundTask.status = 'executing';
    foundTask.startedAt = new Date().toISOString();
    
    // Format the task message (concise, under 500 tokens)
    let taskMessage = `<b>MICRO-TASK: ${foundTask.id}</b>\n\n`;
    taskMessage += `<b>PROTECTED:</b> Never modify self-dev/**, sidebar.tsx, navbar.tsx, layout.tsx, globals.css.\n`;
    taskMessage += `<b>Project:</b> /root/genplatform\n\n`;
    
    taskMessage += `<b>Task:</b> ${foundTask.description}\n`;
    taskMessage += `<b>File:</b> ${foundTask.filePath}\n\n`;
    
    taskMessage += `<b>Specific Changes:</b>\n`;
    foundTask.specificChanges.slice(0, 3).forEach((change: string, idx: number) => {
      taskMessage += `${idx + 1}. ${change}\n`;
    });
    
    // Add build instruction every 5 tasks
    tracker.tasksInCurrentBatch++;
    if (tracker.tasksInCurrentBatch >= 5) {
      taskMessage += `\n<b>After completing this task, also run:</b>\n`;
      taskMessage += `npm run build && pm2 restart genplatform-app`;
      tracker.tasksInCurrentBatch = 0;
      tracker.currentBatch++;
    }

    taskMessage += `\n\nAfter completing: report ✅ Done or ❌ Failed.`;

    console.log('[EXECUTE-NEXT] Saving queue with executing status');
    
    // Save queue with updated status
    await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
    
    // Send to Telegram
    console.log('[EXECUTE-NEXT] Sending to Telegram...');
    const sent = await sendToTelegram(taskMessage);
    
    if (sent) {
      console.log('[EXECUTE-NEXT] Successfully sent task to Telegram');
      
      // Update tracker
      tracker.tasksSentInSession++;
      tracker.totalTasksSent++;
      await updateSessionTracker(tracker);
      
      // Log the send
      await addLog({
        timestamp: new Date().toISOString(),
        type: 'task_sent',
        message: `📤 Task ${foundTask.id} sent to Developer - ${foundTask.description}`,
        taskId: foundTask.id
      });
      
      return {
        taskId: foundTask.id,
        sent: true,
        batch: foundBatch.id,
        description: foundTask.description,
        sessionTasks: tracker.tasksSentInSession,
        totalTasks: tracker.totalTasksSent,
        needsBuild: tracker.tasksInCurrentBatch === 0
      };
    } else {
      console.log('[EXECUTE-NEXT] Failed to send to Telegram');
      
      // Failed to send
      foundTask.status = 'approved';
      delete foundTask.startedAt;
      await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
      
      await addLog({
        timestamp: new Date().toISOString(),
        type: 'error',
        message: `Failed to send task ${foundTask.id} to Telegram`,
        taskId: foundTask.id
      });
      
      return { 
        error: 'Failed to send task to Telegram',
        taskId: foundTask.id 
      };
    }
    
  } catch (error) {
    console.error('[EXECUTE-NEXT] Execute-next error:', error);
    
    await addLog({
      timestamp: new Date().toISOString(),
      type: 'error',
      message: `Execute-next error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    
    return {
      error: 'Failed to execute next task',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: NextRequest) {
  console.log('[EXECUTE-NEXT] POST request received');
  const result = await executeNext();
  
  if (result.error) {
    return NextResponse.json(result, { status: result.completed ? 404 : 500 });
  }
  
  return NextResponse.json(result);
}