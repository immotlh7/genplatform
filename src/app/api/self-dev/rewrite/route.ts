import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';
const TELEGRAM_BOT_TOKEN = '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = '510906393';

export async function POST(request: NextRequest) {
  try {
    const { fileId, messageNumber } = await request.json();
    
    if (!fileId || !messageNumber) {
      return NextResponse.json({ error: 'Missing fileId or messageNumber' }, { status: 400 });
    }
    
    // Load the task queue
    const queuePath = path.join(TASK_QUEUE_DIR, `${fileId}.json`);
    const queueData = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
    
    // Find the message
    const message = queueData.messages.find((m: any) => m.messageNumber === messageNumber);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    // Skip if already rewritten
    if (message.tasks.every((t: any) => t.rewritten)) {
      return NextResponse.json({ 
        status: 'already_rewritten',
        microTasks: message.tasks.flatMap((t: any) => t.microTasks)
      });
    }
    
    // Prepare the rewrite prompt
    const tasksText = message.tasks.map((t: any, idx: number) => 
      `Task ${idx + 1}: ${t.originalDescription}`
    ).join('\n');
    
    const rewritePrompt = `[ORCHESTRATOR] Rewrite these tasks as ultra-precise micro-tasks. Each micro-task = ONE specific file change. Include exact file path, exact function/line to change, exact new code logic. Make them 10x more detailed than the original. Return as numbered list.

Message: ${message.summary}

Original Tasks:
${tasksText}

For each task, break it down into multiple micro-tasks. Each micro-task must specify:
1. Exact file path (e.g., src/app/dashboard/page.tsx)
2. Exact location (function name, line description, or component)
3. Exact change (what to add/remove/modify)
4. Expected result

Format each micro-task as:
[Task X.Y] File: <path> | Location: <where> | Change: <what> | Result: <expected>`;

    // Send to OpenClaw via Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: rewritePrompt.substring(0, 4000) // Telegram limit
        })
      }
    );
    
    if (!telegramResponse.ok) {
      const error = await telegramResponse.text();
      console.error('Failed to send rewrite request:', error);
      return NextResponse.json({ error: 'Failed to send rewrite request' }, { status: 500 });
    }
    
    // For now, create mock micro-tasks (in production, wait for webhook response)
    const mockMicroTasks = [];
    for (let i = 0; i < message.tasks.length; i++) {
      const task = message.tasks[i];
      
      // Generate 2-4 micro-tasks per original task
      const numMicroTasks = Math.floor(Math.random() * 3) + 2;
      for (let j = 0; j < numMicroTasks; j++) {
        mockMicroTasks.push({
          id: `${task.taskId}_micro_${j + 1}`,
          parentTaskId: task.taskId,
          filePath: `src/app/example-${i}.tsx`,
          location: `function exampleFunction${i}`,
          change: `Add validation for ${task.originalDescription}`,
          expectedResult: 'Function properly validates input',
          status: 'pending',
          approved: false
        });
      }
    }
    
    // Update the task queue with mock micro-tasks
    for (const task of message.tasks) {
      task.rewritten = true;
      task.microTasks = mockMicroTasks.filter(m => m.parentTaskId === task.taskId);
    }
    
    // Save updated queue
    await fs.writeFile(queuePath, JSON.stringify(queueData, null, 2));
    
    return NextResponse.json({
      status: 'rewritten',
      messageNumber,
      microTasks: mockMicroTasks,
      note: 'Using mock micro-tasks - real rewrite sent to OpenClaw'
    });
    
  } catch (error) {
    console.error('Rewrite error:', error);
    return NextResponse.json({ error: 'Rewrite failed' }, { status: 500 });
  }
}