import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface SessionTracker {
  tasksSentInSession: number;
  lastReset: string;
  totalTasksSent: number;
  currentBatch: number;
  tasksInCurrentBatch: number;
  lastApiError?: string;
  retryAfter?: string;
}

interface ExecutionLog {
  timestamp: string;
  type: 'task_sent' | 'task_done' | 'task_failed' | 'build' | 'reset' | 'error' | 'info' | 'api_limit';
  message: string;
  taskId?: string;
}

const TASK_QUEUE_FILE = '/root/genplatform/data/task-queue/task-queue.json';
const SESSION_TRACKER_FILE = '/root/genplatform/data/session-tracker.json';
const EXECUTION_LOG_FILE = '/root/genplatform/data/execution-log.json';

const TELEGRAM_BOT_TOKEN = '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = '8630551989';

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
    
    // Check for rate limit errors
    if (!response.ok && result.error_code === 429) {
      const retryAfter = result.parameters?.retry_after || 900; // Default 15 minutes
      await addLog({
        timestamp: new Date().toISOString(),
        type: 'api_limit',
        message: `⚠️ Telegram API rate limit hit. Will retry in ${retryAfter} seconds (${Math.round(retryAfter / 60)} minutes)`
      });
      
      // Update tracker with retry time
      const tracker = await getSessionTracker();
      tracker.lastApiError = new Date().toISOString();
      tracker.retryAfter = new Date(Date.now() + retryAfter * 1000).toISOString();
      await updateSessionTracker(tracker);
      
      // Schedule retry
      setTimeout(async () => {
        await addLog({
          timestamp: new Date().toISOString(),
          type: 'info',
          message: '🔄 Retrying after API rate limit cooldown'
        });
        await executeNext();
      }, retryAfter * 1000);
      
      return false;
    }
    
    return response.ok;
  } catch (error) {
    console.error('[EXECUTE-NEXT] Failed to send to Telegram:', error);
    return false;
  }
}

export async function executeNext() {
  console.log('[EXECUTE-NEXT] Starting executeNext function');
  
  try {
    // Check if we're still in cooldown from API limit
    const tracker = await getSessionTracker();
    if (tracker.retryAfter) {
      const retryTime = new Date(tracker.retryAfter);
      if (retryTime > new Date()) {
        const minutesLeft = Math.round((retryTime.getTime() - Date.now()) / 60000);
        console.log(`[EXECUTE-NEXT] Still in API cooldown. ${minutesLeft} minutes remaining.`);
        return {
          error: 'API rate limit cooldown',
          retryAfter: tracker.retryAfter,
          minutesLeft
        };
      } else {
        // Clear the retry flag
        delete tracker.retryAfter;
        delete tracker.lastApiError;
        await updateSessionTracker(tracker);
      }
    }
    
    // Load task queue
    let queue;
    try {
      const data = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
      queue = JSON.parse(data);
      console.log('[EXECUTE-NEXT] Loaded queue');
    } catch (error) {
      console.error('[EXECUTE-NEXT] Failed to load queue:', error);
      return { 
        error: 'No task queue found',
        message: 'Please analyze a file first' 
      };
    }

    // Find next approved but unexecuted task
    let foundTask = null;
    let foundMessage = null;
    let foundParentTask = null;
    
    console.log('[EXECUTE-NEXT] Looking for approved tasks...');
    
    // Support both "batches" and "messages" structure
    const collections = queue.messages || [];
    console.log('[EXECUTE-NEXT] Found', collections.length, 'messages');
    
    for (const message of collections) {
      const tasks = message.tasks || [];
      console.log(`[EXECUTE-NEXT] Checking message ${message.messageNumber} with ${tasks.length} tasks`);
      
      for (const task of tasks) {
        // Skip if not approved
        if (!task.approved) continue;
        
        // Check if the main task itself needs execution
        if (!task.status || task.status === 'pending' || task.status === 'approved') {
          foundTask = task;
          foundMessage = message;
          console.log('[EXECUTE-NEXT] Found approved task to execute:', task.taskId);
          break;
        }
        
        // If task has been started, check micro-tasks
        if (task.microTasks && task.microTasks.length > 0) {
          for (const microTask of task.microTasks) {
            if (!microTask.status || microTask.status === 'pending') {
              foundTask = microTask;
              foundMessage = message;
              foundParentTask = task;
              console.log('[EXECUTE-NEXT] Found micro-task to execute:', microTask.id);
              break;
            }
          }
        }
      }
      if (foundTask) break;
    }

    if (!foundTask || !foundMessage) {
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

    // Format the task message using ORIGINAL task descriptions
    let taskMessage = '';
    
    // If it's a main task (not a micro-task)
    if (!foundParentTask) {
      taskMessage = `<b>📋 MESSAGE ${foundMessage.messageNumber} - TASK ${foundTask.taskNumber}</b>\n\n`;
      taskMessage += `<b>📁 Project:</b> /root/genplatform\n`;
      taskMessage += `<b>🌐 Site:</b> https://app.gen3.ai\n\n`;
      taskMessage += `<b>🛡️ PROTECTED FILES:</b>\n`;
      taskMessage += `Never modify: self-dev/**, sidebar.tsx, navbar.tsx, layout.tsx, globals.css\n\n`;
      taskMessage += `<b>✏️ TASK DESCRIPTION:</b>\n`;
      taskMessage += `${foundTask.originalDescription}\n\n`;
      
      // Add the full context from the message if available
      const messageIndex = foundMessage.originalContent.indexOf(`Task ${foundTask.taskNumber}:`);
      if (messageIndex > -1) {
        const nextTaskIndex = foundMessage.originalContent.indexOf(`Task ${foundTask.taskNumber + 1}:`, messageIndex);
        const endIndex = nextTaskIndex > -1 ? nextTaskIndex : foundMessage.originalContent.indexOf('\nAfter ALL:', messageIndex);
        
        if (endIndex > -1) {
          const fullTaskContent = foundMessage.originalContent.substring(messageIndex, endIndex).trim();
          taskMessage += `<b>📝 FULL TASK DETAILS:</b>\n`;
          taskMessage += `${fullTaskContent}\n\n`;
        }
      }
    } else {
      // It's a micro-task - use better formatting
      taskMessage = `<b>🔧 MICRO-TASK: ${foundParentTask.taskNumber}</b>\n\n`;
      taskMessage += `<b>📁 Project:</b> /root/genplatform\n`;
      taskMessage += `<b>🛡️ PROTECTED:</b> Never modify self-dev/**, sidebar.tsx, navbar.tsx, layout.tsx, globals.css\n\n`;
      taskMessage += `<b>📋 Original Task:</b>\n`;
      taskMessage += `${foundParentTask.originalDescription}\n\n`;
      
      if (foundTask.filePath) {
        taskMessage += `<b>📄 File:</b> ${foundTask.filePath}\n\n`;
      }
    }
    
    // Add build instruction every 5 tasks
    tracker.tasksInCurrentBatch++;
    if (tracker.tasksInCurrentBatch >= 5) {
      taskMessage += `<b>🔨 BUILD REQUIRED:</b>\n`;
      taskMessage += `After completing this task, run:\n`;
      taskMessage += `<code>npm run build && pm2 restart genplatform-app</code>\n\n`;
      tracker.tasksInCurrentBatch = 0;
      tracker.currentBatch++;
    }

    taskMessage += `<b>📊 Progress:</b> Task ${tracker.totalTasksSent + 1} of session\n\n`;
    taskMessage += `After completing: reply with ✅ Done or ❌ Failed`;

    // Update task status to executing BEFORE saving
    foundTask.status = 'executing';
    foundTask.startedAt = new Date().toISOString();
    
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
        message: `📤 Task ${foundTask.taskId || foundTask.id} sent - ${foundTask.originalDescription || foundTask.description}`,
        taskId: foundTask.taskId || foundTask.id
      });
      
      return {
        taskId: foundTask.taskId || foundTask.id,
        sent: true,
        batch: foundMessage.messageNumber,
        description: foundTask.originalDescription || foundTask.description,
        sessionTasks: tracker.tasksSentInSession,
        totalTasks: tracker.totalTasksSent,
        needsBuild: tracker.tasksInCurrentBatch === 0
      };
    } else {
      console.log('[EXECUTE-NEXT] Failed to send to Telegram');
      
      // Failed to send - revert status
      foundTask.status = 'approved';
      delete foundTask.startedAt;
      await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
      
      await addLog({
        timestamp: new Date().toISOString(),
        type: 'error',
        message: `Failed to send task ${foundTask.taskId || foundTask.id} to Telegram`,
        taskId: foundTask.taskId || foundTask.id
      });
      
      return { 
        error: 'Failed to send task to Telegram',
        taskId: foundTask.taskId || foundTask.id 
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