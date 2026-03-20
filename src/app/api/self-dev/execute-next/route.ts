import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { executionState } from '../control/route';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';
const EXECUTION_LOG_FILE = '/root/genplatform/data/self-dev-execution.log';

export async function POST(request: NextRequest) {
  try {
    // Find next task to execute
    await fs.mkdir(TASK_QUEUE_DIR, { recursive: true });
    const files = await fs.readdir(TASK_QUEUE_DIR).catch(() => []);
    
    for (const file of files.sort()) {
      if (!file.endsWith('.json')) continue;
      
      const queuePath = path.join(TASK_QUEUE_DIR, file);
      const queue = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
      
      for (const message of queue.messages) {
        if (!message.tasks || message.tasks.length === 0) continue;
        
        for (let i = 0; i < message.tasks.length; i++) {
          const task = message.tasks[i];
          
          // Only process approved tasks that are pending
          if (task.approved && task.status === 'approved') {
            // Found next task - update it to executing
            task.status = 'executing';
            await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
            
            // Update execution state
            executionState.currentFile = { name: queue.fileName };
            executionState.currentMessage = { 
              number: message.messageNumber, 
              title: message.summary 
            };
            executionState.currentTask = task;
            
            // Log execution
            const logEntry = `[${new Date().toISOString()}] Executing: Message ${message.messageNumber}, Task ${task.taskNumber}\n`;
            await fs.appendFile(EXECUTION_LOG_FILE, logEntry).catch(() => {});
            
            // Prepare task for Telegram
            const microTasksText = task.microTasks
              .map((mt: any, idx: number) => `${idx + 1}. ${mt.filePath} | ${mt.change}`)
              .join('\n');
            
            const taskPrompt = `[DEVELOPER] Execute micro-tasks for Message ${message.messageNumber}, Task ${task.taskNumber}:

${microTasksText}

Project: /root/genplatform
After each micro-task: commit with descriptive message
When all done, respond: [TASK_COMPLETE:${queue.fileId}:${message.messageNumber}:${task.taskNumber}]`;
            
            // Send to Telegram (in production)
            const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
            const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '510906393';
            
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: taskPrompt,
                parse_mode: 'Markdown'
              })
            }).catch(err => console.error('Failed to send to Telegram:', err));
            
            // For demo, simulate completion after a delay
            setTimeout(async () => {
              task.status = 'done';
              await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
              
              // Update progress
              if (executionState.overallProgress.tasksDone < executionState.overallProgress.tasksTotal) {
                executionState.overallProgress.tasksDone++;
                executionState.overallProgress.percentage = Math.round(
                  (executionState.overallProgress.tasksDone / executionState.overallProgress.tasksTotal) * 100
                );
              }
              
              // Check if all done
              if (executionState.overallProgress.tasksDone >= executionState.overallProgress.tasksTotal) {
                executionState.status = 'idle';
                executionState.currentFile = null;
                executionState.currentMessage = null;
                executionState.currentTask = null;
              }
            }, 5000); // Simulate 5 second execution
            
            return NextResponse.json({
              taskId: task.taskId,
              messageNumber: message.messageNumber,
              taskNumber: task.taskNumber,
              microTasks: task.microTasks.length
            });
          }
        }
      }
    }
    
    // No more tasks
    executionState.status = 'idle';
    return NextResponse.json({ message: 'No pending tasks found' });
    
  } catch (error) {
    console.error('Execute-next error:', error);
    return NextResponse.json(
      { error: 'Failed to get next task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}