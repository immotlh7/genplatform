import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const REWRITE_PROMPT = `You are rewriting development tasks into ultra-precise micro-tasks. RULES:
1. Each micro-task = ONE specific change in ONE specific file
2. You MUST specify the EXACT file path based on the task description
3. You MUST describe EXACTLY what code to write or change
4. You MUST include the function name or component name to edit
5. A task about Dashboard → file is src/app/dashboard/page.tsx
6. A task about Skills → file is src/app/dashboard/skills/page.tsx
7. A task about Memory → file is src/app/dashboard/memory/page.tsx
8. A task about an API → file is src/app/api/[name]/route.ts
9. NEVER point to notification-system.tsx unless the task is about notifications
10. Make tasks MORE detailed not less. Original 1 task should become 3-8 micro-tasks
11. Each micro-task description must be at least 50 words with specific code instructions

Examples of GOOD micro-tasks:
- "src/app/dashboard/page.tsx - In the StatsGrid component, find the Card with title 'All Projects'. Replace the hardcoded value='3' with a dynamic fetch: const res = await fetch('/api/projects'); const data = await res.json(); use data.projects.length. Update the Card's value prop to show this count."
- "src/app/dashboard/skills/page.tsx - In the SkillsPage component's useEffect hook, add error handling for the fetch('/api/bridge/skills') call. Wrap in try-catch, show toast.error('Failed to load skills') on error, and set a fallback empty array for skills state."

Output JSON format:
{
  "tasks": [
    {
      "taskNumber": 1,
      "originalDescription": "...",
      "microTasks": [
        {
          "filePath": "exact/path/to/file.tsx",
          "description": "Detailed 50+ word description of exactly what to change, including function names, variable names, and specific code to write",
          "change": "Short summary of the change"
        }
      ]
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const { fileId, messageNumber, forceRewrite = false } = await request.json();
    
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
    
    // Prepare tasks for rewriting
    let tasksToRewrite = message.tasks.filter((t: any) => !t.rewritten);
    
    // If force rewrite, include all tasks regardless of status
    if (forceRewrite) {
      tasksToRewrite = message.tasks;
      // Reset tasks for re-rewriting
      tasksToRewrite.forEach((task: any) => {
        task.rewritten = false;
        task.approved = false;
        task.status = 'pending';
        task.microTasks = [];
        delete task.executionResult;
      });
    }
    
    if (tasksToRewrite.length === 0) {
      return NextResponse.json({ message: 'All tasks already rewritten' });
    }
    
    // Use Claude to rewrite tasks into micro-tasks
    try {
      const tasksText = tasksToRewrite.map((t: any) => 
        `Task ${t.taskNumber}: ${t.originalDescription}`
      ).join('\n');
      
      const claudeResponse = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.3,
        system: REWRITE_PROMPT,
        messages: [{
          role: 'user',
          content: `Rewrite these tasks into ultra-precise micro-tasks:\n\n${tasksText}`
        }]
      });
      
      const responseText = claudeResponse.content[0].type === 'text' 
        ? claudeResponse.content[0].text 
        : '';
        
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const rewrittenData = JSON.parse(jsonMatch[0]);
      
      // Update tasks with micro-tasks
      rewrittenData.tasks.forEach((rewrittenTask: any) => {
        const task = message.tasks.find((t: any) => t.taskNumber === rewrittenTask.taskNumber);
        if (task) {
          task.microTasks = rewrittenTask.microTasks.map((micro: any, idx: number) => ({
            id: `${fileId}-msg${messageNumber}-task${task.taskNumber}-micro${idx + 1}`,
            filePath: micro.filePath,
            change: micro.change,
            description: micro.description,
            status: 'pending'
          }));
          task.rewritten = true;
          task.status = 'review';
        }
      });
      
    } catch (claudeError) {
      console.error('Claude rewrite failed, using fallback:', claudeError);
      
      // Fallback: generate detailed micro-tasks based on patterns
      tasksToRewrite.forEach((task: any) => {
        const microTasks = [];
        const taskLower = task.originalDescription.toLowerCase();
        
        if (taskLower.includes('dashboard')) {
          microTasks.push(
            {
              id: `${fileId}-msg${messageNumber}-task${task.taskNumber}-micro1`,
              filePath: 'src/app/dashboard/page.tsx',
              change: 'Locate the component mentioned in the task',
              description: `In src/app/dashboard/page.tsx, find the main DashboardPage component. Look for the specific section mentioned in the task: "${task.originalDescription}". Identify the exact component or JSX element that needs to be modified.`,
              status: 'pending'
            },
            {
              id: `${fileId}-msg${messageNumber}-task${task.taskNumber}-micro2`,
              filePath: 'src/app/dashboard/page.tsx',
              change: 'Implement the requested change',
              description: `Make the specific change requested in the original task. This involves modifying the identified component to ${task.originalDescription}. Ensure proper TypeScript types and React best practices are followed.`,
              status: 'pending'
            }
          );
        } else if (taskLower.includes('api')) {
          const apiName = taskLower.match(/api[\/\s]+(\w+)/)?.[1] || 'endpoint';
          microTasks.push(
            {
              id: `${fileId}-msg${messageNumber}-task${task.taskNumber}-micro1`,
              filePath: `src/app/api/${apiName}/route.ts`,
              change: 'Create or update the API route',
              description: `In src/app/api/${apiName}/route.ts, implement the requested API functionality: ${task.originalDescription}. Use Next.js 13+ app router conventions with proper request/response handling.`,
              status: 'pending'
            }
          );
        } else {
          // Generic detailed micro-tasks
          microTasks.push(
            {
              id: `${fileId}-msg${messageNumber}-task${task.taskNumber}-micro1`,
              filePath: 'src/app/dashboard/page.tsx',
              change: 'Analyze and implement the requested feature',
              description: `Implement the following task with precision: ${task.originalDescription}. First identify the correct file and component, then make the necessary changes following the project's coding standards.`,
              status: 'pending'
            }
          );
        }
        
        task.microTasks = microTasks;
        task.rewritten = true;
        task.status = 'review';
      });
    }
    
    // Update total micro-tasks count
    queue.totalMicroTasks = queue.messages.reduce((sum: number, msg: any) => 
      sum + msg.tasks.reduce((taskSum: number, task: any) => 
        taskSum + (task.microTasks?.length || 0), 0
      ), 0
    );
    
    await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
    
    // Also sync to main task-queue.json so approve can find rewritten=true
    const mainQueuePath = '/root/genplatform/data/task-queue/task-queue.json';
    try {
      const mainQueue = JSON.parse(await fs.readFile(mainQueuePath, 'utf-8'));
      const mainMsg = mainQueue.messages.find((m: any) => m.messageNumber === messageNumber);
      if (mainMsg) {
        mainMsg.tasks = message.tasks;
        mainQueue.totalMicroTasks = queue.totalMicroTasks;
        await fs.writeFile(mainQueuePath, JSON.stringify(mainQueue, null, 2));
      }
    } catch (e) {
      console.error('Failed to sync to main queue:', e);
    }
    
    // Send notification to Telegram about rewrite completion
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8630551989';
    
    const notificationText = `[ORCHESTRATOR] ✅ Rewrite complete for Message ${messageNumber}:
- Generated ${message.tasks.reduce((sum: number, task: any) => sum + (task.microTasks?.length || 0), 0)} micro-tasks
- Ready for review and approval`;
    
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: notificationText,
        parse_mode: 'Markdown'
      })
    }).catch(err => console.error('Failed to send notification:', err));
    
    return NextResponse.json({ 
      success: true,
      message: 'Tasks rewritten successfully',
      microTasksGenerated: message.tasks.reduce((sum: number, task: any) => 
        sum + (task.microTasks?.length || 0), 0
      )
    });
    
  } catch (error) {
    console.error('Rewrite error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate rewrite', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}