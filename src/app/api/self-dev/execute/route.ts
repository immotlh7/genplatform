import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = '510906393'; // Your OpenClaw agent chat

interface MicroTask {
  taskId: string;
  action: string;
  filePath: string;
  description: string;
  specificChanges: string;
  estimatedMinutes: number;
}

export async function POST(request: NextRequest) {
  try {
    const { task, projectContext } = await request.json();
    
    if (!task || !task.taskId) {
      return NextResponse.json({ error: 'Invalid task' }, { status: 400 });
    }
    
    const microTask = task as MicroTask;
    
    // Format the task for the Developer agent
    const taskMessage = formatTaskForDeveloper(microTask, projectContext);
    
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
      return NextResponse.json({ error: 'Failed to send task' }, { status: 500 });
    }
    
    const telegramData = await telegramResponse.json();
    
    return NextResponse.json({
      taskId: microTask.taskId,
      status: 'sent',
      telegramMessageId: telegramData.result.message_id,
      sentAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Execute error:', error);
    return NextResponse.json({ error: 'Execution failed' }, { status: 500 });
  }
}

function formatTaskForDeveloper(task: MicroTask, projectContext: string): string {
  return `🤖 *MICRO-TASK: ${task.taskId}*

*Action:* ${task.action}
*File:* \`${task.filePath}\`

*Task:* ${task.description}

*Specific Changes:*
${task.specificChanges}

*Context:* ${projectContext || 'GenPlatform.ai development'}

When complete, reply "✅ DONE" and wait for the next task.`;
}