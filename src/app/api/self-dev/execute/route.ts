import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TELEGRAM_BOT_TOKEN = '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = '510906393'; // Your OpenClaw agent chat
const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';

interface MicroTask {
  id: string;
  filePath: string;
  change: string;
  description: string;
  status?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { fileId, messageNumber, taskNumber, microTaskIndex, projectContext } = await request.json();
    
    if (!fileId || !messageNumber || !taskNumber || microTaskIndex === undefined) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    
    // Load queue to get the micro-task
    const queuePath = path.join(TASK_QUEUE_DIR, fileId + '.json');
    const queue = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
    
    const message = queue.messages.find((m: any) => m.messageNumber === messageNumber);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    const task = message.tasks.find((t: any) => t.taskNumber === taskNumber);
    if (!task || !task.microTasks || !task.microTasks[microTaskIndex]) {
      return NextResponse.json({ error: 'Micro-task not found' }, { status: 404 });
    }
    
    const microTask = task.microTasks[microTaskIndex];
    
    // Update micro-task status to executing
    microTask.status = 'executing';
    task.status = 'executing';
    await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
    
    // Format the task for the Developer agent
    const taskMessage = formatTaskForDeveloper(microTask, task, message, projectContext);
    
    // Send to Telegram
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
      console.error('Telegram API error:', error);
      
      // Mark as failed
      microTask.status = 'failed';
      await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
      
      return NextResponse.json({ error: 'Failed to send task' }, { status: 500 });
    }
    
    const telegramData = await telegramResponse.json();
    
    return NextResponse.json({
      taskId: microTask.id,
      status: 'sent',
      telegramMessageId: telegramData.result.message_id,
      sentAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Execute error:', error);
    return NextResponse.json({ error: 'Execution failed' }, { status: 500 });
  }
}

function formatTaskForDeveloper(microTask: MicroTask, task: any, message: any, projectContext: string): string {
  return `🤖 *MICRO-TASK: ${microTask.id}*

*Original Task ${task.taskNumber}:* ${task.originalDescription}
*File:* \`${microTask.filePath}\`

*Specific Changes Required:*
${microTask.description}

*Summary:* ${microTask.change}

*Context:* ${projectContext || 'GenPlatform.ai development'}
*Message:* ${message.messageNumber} / Task: ${task.taskNumber}

When complete, reply with the result. The orchestrator will mark this as complete.`;
}