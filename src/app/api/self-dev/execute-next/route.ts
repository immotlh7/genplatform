import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { executionState } from '../status/route';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';
const EXECUTION_LOG_FILE = '/root/genplatform/data/self-dev-execution.log';
const TELEGRAM_BOT_TOKEN = '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = '510906393';

// Helper to append to log
async function appendLog(entry: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} | ${entry}\n`;
  await fs.appendFile(EXECUTION_LOG_FILE, logEntry).catch(() => {});
}

// Get next pending micro-task from approved tasks
async function getNextPendingTask() {
  await fs.mkdir(TASK_QUEUE_DIR, { recursive: true });
  const files = await fs.readdir(TASK_QUEUE_DIR).catch(() => []);
  
  for (const file of files.sort()) {
    if (!file.endsWith('.json')) continue;
    
    const queuePath = path.join(TASK_QUEUE_DIR, file);
    const queue = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
    
    let totalMicroTasks = 0;
    let batchPosition = 0;
    let tasksInCurrentBatch = 0;
    let microTaskIndex = 0;
    
    // Count total micro-tasks
    for (const message of queue.messages) {
      for (const task of message.tasks) {
        if (task.approved && task.microTasks) {
          totalMicroTasks += task.microTasks.length;
        }
      }
    }
    
    // Find next pending micro-task from approved tasks
    for (const message of queue.messages) {
      for (const task of message.tasks) {
        if (!task.approved || !task.microTasks) continue;
        
        for (let i = 0; i < task.microTasks.length; i++) {
          const microTask = task.microTasks[i];
          microTaskIndex++;
          
          // Track batch position (every 5 tasks)
          if ((microTaskIndex - 1) % 5 === 0) {
            batchPosition = 1;
            tasksInCurrentBatch = Math.min(5, totalMicroTasks - (microTaskIndex - 1));
          } else {
            batchPosition++;
          }
          
          if (microTask.status === 'pending') {
            // Found next task - update it to executing
            microTask.status = 'executing';
            await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
            
            return {
              fileId: queue.fileId,
              fileName: queue.fileName,
              totalMessages: queue.totalMessages,
              totalMicroTasks,
              messageNumber: message.messageNumber,
              messageSummary: message.summary,
              commitMessage: message.summary, // Use message summary as commit message
              microTask,
              microTaskIndex,
              parentTaskId: task.taskId,
              batchPosition,
              tasksInBatch: tasksInCurrentBatch,
              queuePath,
              isLastInMessage: i === task.microTasks.length - 1 && 
                              !message.tasks.slice(message.tasks.indexOf(task) + 1).some(t => t.approved && t.microTasks?.length)
            };
          }
        }
      }
    }
  }
  
  return null;
}

// Format micro-task for Developer
function formatTaskForDeveloper(data: any): string {
  const { 
    microTask,
    microTaskIndex,
    totalMicroTasks,
    messageNumber,
    totalMessages,
    batchPosition,
    tasksInBatch,
    messageSummary,
    commitMessage,
    isLastInMessage
  } = data;
  
  const isLastInBatch = batchPosition === tasksInBatch;
  
  let command = `[SELF-DEV] Micro-task ${microTaskIndex}/${totalMicroTasks} for Message ${messageNumber}/${totalMessages}\n\n`;
  command += `PROTECTED: Never modify self-dev/**, sidebar.tsx, navbar.tsx, layout.tsx, globals.css\n\n`;
  command += `File: ${microTask.filePath}\n`;
  command += `Location: ${microTask.location}\n`;
  command += `Change: ${microTask.change}\n`;
  command += `Expected Result: ${microTask.expectedResult}\n\n`;
  command += `After edit: verify the file has no syntax errors.\n`;
  
  if (isLastInBatch) {
    command += `\nAlso run: cd /root/genplatform && npm run build && pm2 restart genplatform-app\n`;
  }
  
  if (isLastInMessage) {
    command += `\nAlso run: cd /root/genplatform && git add -A && git commit -m "${commitMessage}" && git push\n`;
  }
  
  command += `\nReport: ✅ Done or ❌ Failed — {reason}`;
  
  return command;
}

// Check if context reset needed
function needsContextReset(): boolean {
  // Reset after ~75K tokens (approximately 50 tasks)
  return executionState.contextTokens > 75000 || executionState.tasksProcessed > 0 && executionState.tasksProcessed % 50 === 0;
}

export async function POST(request: NextRequest) {
  try {
    // Check if we're paused or not executing
    if (executionState.status === 'paused' || executionState.status === 'idle') {
      await appendLog('⏸️ Execution is paused or idle, not sending next task');
      return NextResponse.json({ message: 'Execution paused' });
    }
    
    // Check if context reset is needed
    if (needsContextReset()) {
      await appendLog('🧠 Context window near limit, sending reset command');
      
      const resetMessage = `/reset\n\nContext reset due to token limit. Ready for next task.\n\nWORK-RULES: Never modify self-dev/**, sidebar.tsx, navbar.tsx, layout.tsx, globals.css`;
      
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: resetMessage
          })
        }
      );
      
      if (telegramResponse.ok) {
        executionState.contextTokens = 200; // Reset with minimal context
        await appendLog('📤 Context reset sent to Developer');
      }
      
      // Wait a bit before sending next task
      setTimeout(() => {
        fetch('http://localhost:3000/api/self-dev/execute-next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
      }, 5000);
      
      return NextResponse.json({ message: 'Context reset sent' });
    }
    
    // Get next pending task
    const nextTask = await getNextPendingTask();
    
    if (!nextTask) {
      await appendLog('✅ All approved tasks completed!');
      executionState.status = 'idle';
      executionState.currentTask = null;
      executionState.currentFile = null;
      executionState.currentMessage = null;
      return NextResponse.json({ message: 'All tasks completed' });
    }
    
    // Update execution state
    executionState.currentFile = {
      id: nextTask.fileId,
      name: nextTask.fileName,
      progress: Math.round((executionState.tasksProcessed / nextTask.totalMicroTasks) * 100)
    };
    executionState.currentMessage = {
      number: nextTask.messageNumber,
      title: nextTask.messageSummary
    };
    executionState.currentTask = {
      number: executionState.tasksProcessed + 1,
      description: `${nextTask.microTask.filePath}: ${nextTask.microTask.change}`,
      status: 'executing'
    };
    executionState.currentBatch = {
      position: nextTask.batchPosition,
      total: nextTask.tasksInBatch
    };
    
    // Format and send task
    const taskMessage = formatTaskForDeveloper(nextTask);
    
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: taskMessage,
          parse_mode: 'Markdown'
        })
      }
    );
    
    if (!telegramResponse.ok) {
      const error = await telegramResponse.text();
      await appendLog(`❌ Failed to send task to Developer: ${error}`);
      executionState.status = 'error';
      return NextResponse.json({ error: 'Failed to send task' }, { status: 500 });
    }
    
    await appendLog(`📤 Sent micro-task: ${nextTask.microTask.filePath} - ${nextTask.microTask.change}`);
    executionState.contextTokens += taskMessage.length / 4; // Rough token estimate
    
    return NextResponse.json({
      taskId: nextTask.microTask.id,
      taskNumber: executionState.tasksProcessed + 1,
      totalTasks: nextTask.totalMicroTasks,
      status: 'sent'
    });
    
  } catch (error) {
    console.error('Execute next error:', error);
    await appendLog(`❌ Execute next error: ${error}`);
    executionState.status = 'error';
    return NextResponse.json({ error: 'Failed to execute next task' }, { status: 500 });
  }
}