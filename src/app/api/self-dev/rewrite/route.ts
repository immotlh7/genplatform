import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';

export async function POST(request: NextRequest) {
  try {
    const { fileId, messageNumber } = await request.json();
    
    if (!fileId || !messageNumber) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const queuePath = path.join(TASK_QUEUE_DIR, fileId + '.json');
    const queue = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
    
    // Find the message
    const message = queue.messages.find((m: any) => m.messageNumber === messageNumber);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    // Update task status to indicate rewriting is in progress
    message.tasks.forEach((task: any) => {
      task.status = 'rewriting';
    });
    
    await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
    
    // Send to Telegram for orchestrator to rewrite
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '510906393';
    
    const orchestratorPrompt = `[ORCHESTRATOR] Rewrite Message ${messageNumber} from ${queue.fileName} into micro-tasks:

${message.originalContent}

Break down each task into specific, ultra-precise micro-tasks that:
1. Target a single file
2. Make one atomic change
3. Can be completed in under 5 minutes
4. Include exact file paths and specific changes

Respond with the rewritten micro-tasks in this format:
[REWRITE_COMPLETE:${fileId}:${messageNumber}]
Task 1 micro-tasks:
1. /path/to/file.tsx | Add import statement for X
2. /path/to/file.tsx | Create component function
...`;
    
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: orchestratorPrompt,
        parse_mode: 'Markdown'
      })
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Rewrite request sent to orchestrator'
    });
    
  } catch (error) {
    console.error('Rewrite error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate rewrite', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}