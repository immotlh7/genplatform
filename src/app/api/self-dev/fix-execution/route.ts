import { NextResponse } from 'next/server';
import fs from 'fs/promises';

export async function POST() {
  try {
    // 1. Clear execution lock
    await fs.writeFile('/root/genplatform/data/execution-lock.json', JSON.stringify({
      locked: false,
      taskId: null,
      lockedAt: null,
      attempts: 0
    }, null, 2));

    // 2. Reset any stuck "executing" tasks
    const queueData = await fs.readFile('/root/genplatform/data/task-queue/task-queue.json', 'utf-8');
    const queue = JSON.parse(queueData);
    
    let resetCount = 0;
    queue.messages?.forEach((message: any) => {
      message.tasks?.forEach((task: any) => {
        if (task.status === 'executing' && task.approved) {
          task.status = 'approved';
          delete task.startedAt;
          resetCount++;
        }
      });
    });

    await fs.writeFile('/root/genplatform/data/task-queue/task-queue.json', JSON.stringify(queue, null, 2));

    // 3. Send notification
    const TELEGRAM_BOT_TOKEN = '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
    const TELEGRAM_CHAT_ID = '8630551989';
    
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: `✅ Execution Pipeline Fixed!\n\n• Lock cleared\n• ${resetCount} stuck tasks reset\n• Ready to execute approved tasks\n\nClick "Start" in Self-Dev to begin execution.`
      })
    });

    // 4. Trigger execute-next
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    await fetch(`${baseUrl}/api/self-dev/execute-next`, {
      method: 'POST'
    });

    return NextResponse.json({ 
      success: true, 
      message: `Fixed execution pipeline. Reset ${resetCount} stuck tasks.` 
    });
  } catch (error) {
    console.error('Fix execution error:', error);
    return NextResponse.json({ error: 'Failed to fix execution' }, { status: 500 });
  }
}