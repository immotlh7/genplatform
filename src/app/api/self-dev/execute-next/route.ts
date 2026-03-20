import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface SessionTracker {
  tasksSinceReset: number;
  totalResets: number;
  lastResetTime: string | null;
  totalTasksSent: number;
}

interface CurrentTask {
  taskId: string;
  messageNumber: number;
  messageTitle: string;
  totalTasks: number;
  completedTasks: number;
  task: {
    taskNumber: number;
    description: string;
    status: string;
  };
}

interface ExecutionLock {
  locked: boolean;
  lockedAt: string | null;
  taskId: string | null;
}

const TASK_QUEUE_FILE = '/root/genplatform/data/task-queue/task-queue.json';
const CURRENT_TASK_FILE = '/root/genplatform/data/current-task.json';
const SESSION_TRACKER_FILE = '/root/genplatform/data/session-tracker.json';
const EXECUTION_LOG_FILE = '/root/genplatform/data/execution-log.json';
const EXECUTION_LOCK_FILE = '/root/genplatform/data/execution-lock.json';

const TELEGRAM_BOT_TOKEN = '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = '8630551989';

async function getExecutionLock(): Promise<ExecutionLock> {
  try {
    const data = await fs.readFile(EXECUTION_LOCK_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    const defaultLock: ExecutionLock = {
      locked: false,
      lockedAt: null,
      taskId: null
    };
    await fs.writeFile(EXECUTION_LOCK_FILE, JSON.stringify(defaultLock, null, 2));
    return defaultLock;
  }
}

async function setExecutionLock(taskId: string): Promise<boolean> {
  const lock = await getExecutionLock();
  if (lock.locked) {
    console.log('[EXECUTE-NEXT] Already locked by:', lock.taskId);
    return false;
  }
  
  lock.locked = true;
  lock.lockedAt = new Date().toISOString();
  lock.taskId = taskId;
  await fs.writeFile(EXECUTION_LOCK_FILE, JSON.stringify(lock, null, 2));
  return true;
}

async function releaseExecutionLock() {
  const lock: ExecutionLock = {
    locked: false,
    lockedAt: null,
    taskId: null
  };
  await fs.writeFile(EXECUTION_LOCK_FILE, JSON.stringify(lock, null, 2));
}

async function checkDuplicate(taskDescription: string): Promise<boolean> {
  try {
    const logsData = await fs.readFile(EXECUTION_LOG_FILE, 'utf-8');
    const logs = JSON.parse(logsData);
    
    // Check last 50 sent tasks
    const recentTasks = logs.filter((l: any) => l.type === 'task_sent').slice(-50);
    
    for (const log of recentTasks) {
      if (log.message && log.message.includes(' sent - ')) {
        const sentDesc = log.message.split(' sent - ')[1];
        if (sentDesc && calculateSimilarity(taskDescription, sentDesc) > 0.8) {
          console.log('[EXECUTE-NEXT] Duplicate task detected, skipping');
          return true;
        }
      }
    }
  } catch {}
  
  return false;
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  const intersection = words1.filter(w => words2.includes(w));
  return intersection.length / Math.max(words1.length, words2.length);
}

async function getSessionTracker(): Promise<SessionTracker> {
  try {
    const data = await fs.readFile(SESSION_TRACKER_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    const defaultTracker: SessionTracker = {
      tasksSinceReset: 0,
      totalResets: 0,
      lastResetTime: null,
      totalTasksSent: 0
    };
    await fs.mkdir(path.dirname(SESSION_TRACKER_FILE), { recursive: true });
    await fs.writeFile(SESSION_TRACKER_FILE, JSON.stringify(defaultTracker, null, 2));
    return defaultTracker;
  }
}

async function updateSessionTracker(tracker: SessionTracker) {
  await fs.writeFile(SESSION_TRACKER_FILE, JSON.stringify(tracker, null, 2));
}

async function addLog(log: any) {
  try {
    let logs: any[] = [];
    try {
      const data = await fs.readFile(EXECUTION_LOG_FILE, 'utf-8');
      logs = JSON.parse(data);
    } catch {}
    logs.push(log);
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }
    await fs.writeFile(EXECUTION_LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

async function sendToTelegram(text: string): Promise<boolean> {
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
    
    return response.ok;
  } catch (error) {
    console.error('[EXECUTE-NEXT] Failed to send to Telegram:', error);
    return false;
  }
}

export async function executeNext() {
  try {
    // Check execution lock first
    const lock = await getExecutionLock();
    if (lock.locked) {
      console.log('[EXECUTE-NEXT] Execution locked, skipping');
      return {
        error: 'Execution locked',
        lockedBy: lock.taskId,
        message: 'Another task is currently executing'
      };
    }
    
    // Load task queue ONCE to find next task
    const queueData = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
    const queue = JSON.parse(queueData);
    
    // Find next approved but unexecuted task
    let foundTask = null;
    let foundMessage = null;
    let totalTasks = 0;
    let completedTasks = 0;
    
    const messages = queue.messages || [];
    for (const message of messages) {
      const tasks = message.tasks || [];
      for (const task of tasks) {
        totalTasks++;
        if (task.status === 'done') completedTasks++;
        
        if (!task.approved) continue;
        if (task.status === 'executing') {
          // Task already executing, lock should be set
          await setExecutionLock(task.taskId);
          return {
            message: 'Task already executing',
            taskId: task.taskId
          };
        }
        if (!foundTask && (!task.status || task.status === 'pending' || task.status === 'approved')) {
          foundTask = task;
          foundMessage = message;
        }
      }
    }

    if (!foundTask || !foundMessage) {
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

    // Check for duplicate
    const isDuplicate = await checkDuplicate(foundTask.originalDescription);
    if (isDuplicate) {
      foundTask.status = 'skipped';
      foundTask.skippedReason = 'Duplicate task';
      await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
      
      await addLog({
        timestamp: new Date().toISOString(),
        type: 'info',
        message: `⏭️ Skipped duplicate task: ${foundTask.taskId}`
      });
      
      // Try next task
      return executeNext();
    }

    // Set lock before proceeding
    const lockAcquired = await setExecutionLock(foundTask.taskId);
    if (!lockAcquired) {
      return {
        error: 'Failed to acquire lock',
        message: 'Another task is being executed'
      };
    }

    // Create current-task.json with ONLY the current task
    const currentTask: CurrentTask = {
      taskId: foundTask.taskId,
      messageNumber: foundMessage.messageNumber,
      messageTitle: foundMessage.summary || `Message ${foundMessage.messageNumber}`,
      totalTasks,
      completedTasks,
      task: {
        taskNumber: foundTask.taskNumber,
        description: foundTask.originalDescription,
        status: 'executing'
      }
    };
    
    await fs.writeFile(CURRENT_TASK_FILE, JSON.stringify(currentTask, null, 2));
    
    // Update task status in main queue
    foundTask.status = 'executing';
    foundTask.startedAt = new Date().toISOString();
    await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
    
    // Check session tracker
    const tracker = await getSessionTracker();
    
    // Auto-reset after 30 tasks
    if (tracker.tasksSinceReset >= 30) {
      await addLog({
        timestamp: new Date().toISOString(),
        type: 'reset',
        message: '🧠 Context reset required after 30 tasks'
      });

      await sendToTelegram('/reset');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const contextRefresh = `Read ~/.openclaw/workspace/memory/WORK-RULES.md. You are developing GenPlatform.ai at /root/genplatform. Site: https://app.gen3.ai. Continue executing tasks from Self-Dev system.`;
      await sendToTelegram(contextRefresh);
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      tracker.tasksSinceReset = 0;
      tracker.totalResets++;
      tracker.lastResetTime = new Date().toISOString();
      await updateSessionTracker(tracker);

      await addLog({
        timestamp: new Date().toISOString(),
        type: 'reset',
        message: '🧠 Auto context reset — session refreshed after 30 tasks'
      });
    }
    
    // Format concise task message (under 300 tokens)
    let taskMessage = `<b>📋 TASK ${foundTask.taskNumber}</b>\n\n`;
    taskMessage += `<b>📁</b> /root/genplatform\n`;
    taskMessage += `<b>🌐</b> https://app.gen3.ai\n\n`;
    taskMessage += `${foundTask.originalDescription}\n\n`;
    taskMessage += `Reply: ✅ Done or ❌ Failed`;
    
    // Send to Telegram
    const sent = await sendToTelegram(taskMessage);
    
    if (sent) {
      // Update tracker
      tracker.tasksSinceReset++;
      tracker.totalTasksSent++;
      await updateSessionTracker(tracker);
      
      // Log the send
      await addLog({
        timestamp: new Date().toISOString(),
        type: 'task_sent',
        message: `📤 Task ${foundTask.taskNumber} sent - ${foundTask.originalDescription.substring(0, 50)}...`,
        taskId: foundTask.taskId
      });
      
      return {
        taskId: foundTask.taskId,
        sent: true,
        taskNumber: foundTask.taskNumber,
        sessionTasks: tracker.tasksSinceReset,
        totalTasks: tracker.totalTasksSent
      };
    } else {
      // Failed to send - release lock and revert status
      await releaseExecutionLock();
      foundTask.status = 'approved';
      delete foundTask.startedAt;
      await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
      
      return { 
        error: 'Failed to send task to Telegram',
        taskId: foundTask.taskId 
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
  const result = await executeNext();
  
  if (result.error) {
    return NextResponse.json(result, { status: result.completed ? 404 : 500 });
  }
  
  return NextResponse.json(result);
}