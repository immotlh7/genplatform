import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const TASK_QUEUE_FILE = '/root/genplatform/data/task-queue/task-queue.json';
const EXECUTION_LOCK_FILE = '/root/genplatform/data/execution-lock.json';
const EXECUTION_LOG_FILE = '/root/genplatform/data/execution-log.json';
const CURRENT_TASK_FILE = '/root/genplatform/data/current-task.json';
const SESSION_TRACKER_FILE = '/root/genplatform/data/session-tracker.json';
const CONFIG_FILE = '/root/genplatform/data/self-dev-config.json';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8630551989';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

async function addLog(log: any) {
  try {
    let logs: any[] = [];
    try { const d = await fs.readFile(EXECUTION_LOG_FILE, 'utf-8'); logs = JSON.parse(d); } catch {}
    logs.push(log);
    if (logs.length > 500) logs = logs.slice(-500);
    await fs.writeFile(EXECUTION_LOG_FILE, JSON.stringify(logs, null, 2));
  } catch {}
}

async function notify(text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text })
    });
  } catch {}
}

async function getLock() {
  try { return JSON.parse(await fs.readFile(EXECUTION_LOCK_FILE, 'utf-8')); }
  catch { return { locked: false, taskId: null, lockedAt: null }; }
}

async function setLock(taskId: string) {
  await fs.writeFile(EXECUTION_LOCK_FILE, JSON.stringify({ locked: true, taskId, lockedAt: new Date().toISOString(), attempts: 0 }, null, 2));
}

async function clearLock() {
  await fs.writeFile(EXECUTION_LOCK_FILE, JSON.stringify({ locked: false, taskId: null, lockedAt: null, attempts: 0 }, null, 2));
}

async function executeTaskWithClaude(task: any, message: any): Promise<{ success: boolean; result: string }> {
  const systemPrompt = `You are a senior developer working on GenPlatform.ai at /root/genplatform.
Tech stack: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui.
Site URL: https://app.gen3.ai

RULES:
- Write complete, working code
- Use TypeScript with proper types  
- Follow existing code patterns in the project
- Only modify the files needed for the task
- After making changes, run: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Task: [description]" && git push
- If build fails, fix the errors before committing
- Use real API calls, no hardcoded/fake data
- PROTECT: Never modify sidebar.tsx, globals.css unless explicitly asked

Respond with a shell script that implements the task. Format:
\`\`\`bash
# Your implementation commands here
\`\`\``;

  const userPrompt = `Implement this task completely:

Message: ${message.summary || ''}
Full context: ${(message.originalContent || '').substring(0, 2000)}

Task ${task.taskNumber}: ${task.originalDescription}

Micro-tasks to implement:
${(task.microTasks || []).map((mt: any) => `- File: ${mt.filePath}\n  Change: ${mt.change}\n  Details: ${mt.description}`).join('\n')}

Write and execute the implementation. After completion run: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Fix: ${task.originalDescription.substring(0, 50)}" && git push`;

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
  
  // Extract bash script
  const bashMatch = responseText.match(/```bash\n([\s\S]*?)```/);
  if (!bashMatch) {
    return { success: false, result: 'No bash script found in response' };
  }

  const script = bashMatch[1];
  
  // Safety check - block destructive commands
  const dangerous = ['rm -rf .next', 'rm -rf node_modules', 'rm -rf /', 'DROP TABLE', 'format c:', 'del /'];
  for (const cmd of dangerous) {
    if (script.toLowerCase().includes(cmd.toLowerCase())) {
      return { success: false, result: `Blocked dangerous command: ${cmd}` };
    }
  }
  
  try {
    const { stdout, stderr } = await execAsync(script, { 
      cwd: '/root/genplatform',
      timeout: 120000, // 2 min timeout
      env: { ...process.env, PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' }
    });
    
    const output = (stdout + stderr).substring(0, 500);
    return { success: true, result: output };
  } catch (execError: any) {
    return { success: false, result: execError.message?.substring(0, 300) || 'Execution failed' };
  }
}

export async function executeNext() {
  try {
    // Check lock - auto-release if >10 minutes old
    const lock = await getLock();
    if (lock.locked) {
      const ageMin = lock.lockedAt ? (Date.now() - new Date(lock.lockedAt).getTime()) / 60000 : 999;
      if (ageMin > 10) {
        await addLog({ timestamp: new Date().toISOString(), type: 'info', message: `🔓 Lock auto-released after ${ageMin.toFixed(1)}min` });
        // Reset stuck task
        try {
          const q = JSON.parse(await fs.readFile(TASK_QUEUE_FILE, 'utf-8'));
          q.messages?.forEach((m: any) => m.tasks?.forEach((t: any) => {
            if (t.taskId === lock.taskId && t.status === 'executing') { t.status = 'approved'; delete t.startedAt; }
          }));
          await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(q, null, 2));
        } catch {}
        await fs.writeFile(EXECUTION_LOCK_FILE, JSON.stringify({ locked: false, taskId: null, lockedAt: null, attempts: 0 }, null, 2));
      } else {
        return { error: 'Execution locked', lockedBy: lock.taskId, message: 'Another task is currently executing' };
      }
    }

    // Load queue
    const queue = JSON.parse(await fs.readFile(TASK_QUEUE_FILE, 'utf-8'));
    
    // Find next approved task
    let foundTask: any = null;
    let foundMessage: any = null;
    let totalTasks = 0;
    let completedTasks = 0;

    for (const message of (queue.messages || [])) {
      for (const task of (message.tasks || [])) {
        totalTasks++;
        if (task.status === 'done') completedTasks++;
        if (!task.approved) continue;
        if (task.status === 'executing') {
          await setLock(task.taskId);
          return { message: 'Task already executing', taskId: task.taskId };
        }
        if (!foundTask && (task.status === 'approved' || task.status === 'pending')) {
          foundTask = task;
          foundMessage = message;
        }
      }
    }

    if (!foundTask) {
      await addLog({ timestamp: new Date().toISOString(), type: 'info', message: 'No approved tasks found to execute' });
      return { message: 'No approved tasks found', completed: true };
    }

    // Acquire lock
    await setLock(foundTask.taskId);
    
    // Mark as executing
    foundTask.status = 'executing';
    foundTask.startedAt = new Date().toISOString();
    await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
    
    // Update current task file
    await fs.writeFile(CURRENT_TASK_FILE, JSON.stringify({
      taskId: foundTask.taskId,
      messageNumber: foundMessage.messageNumber,
      messageTitle: foundMessage.summary || `Message ${foundMessage.messageNumber}`,
      totalTasks, completedTasks,
      task: { taskNumber: foundTask.taskNumber, description: foundTask.originalDescription, status: 'executing' }
    }, null, 2));

    await addLog({ timestamp: new Date().toISOString(), type: 'task_sent', message: `🚀 Executing Task ${foundTask.taskNumber}: ${foundTask.originalDescription.substring(0, 60)}...`, taskId: foundTask.taskId });

    // Notify start
    await notify(`🔨 Starting Task ${foundTask.taskNumber}/${totalTasks}\n\n${foundTask.originalDescription.substring(0, 150)}\n\n⏳ Executing...`);

    // Execute with Claude
    const result = await executeTaskWithClaude(foundTask, foundMessage);

    // Mark done or failed
    foundTask.status = result.success ? 'done' : 'failed';
    foundTask.completedAt = new Date().toISOString();
    foundTask.executionResult = result;
    
    // Sync both files
    await fs.writeFile(TASK_QUEUE_FILE, JSON.stringify(queue, null, 2));
    try {
      const indPath = path.join('/root/genplatform/data/task-queue', foundTask.taskId.split('-msg')[0].replace('task_', 'task_') + '.json');
      await fs.writeFile(indPath.replace(/task_\d+_/, 'task_1773996310129_').replace(/-msg.+$/, '') + '.json', JSON.stringify(queue, null, 2));
    } catch {}

    // Clear lock
    await clearLock();

    // Log result
    await addLog({
      timestamp: new Date().toISOString(),
      type: result.success ? 'task_done' : 'task_failed',
      message: result.success ? `✅ Task ${foundTask.taskNumber} completed` : `❌ Task ${foundTask.taskNumber} failed: ${result.result.substring(0, 100)}`,
      taskId: foundTask.taskId
    });

    // Notify result
    await notify(result.success
      ? `✅ Task ${foundTask.taskNumber}/${totalTasks} DONE\n\n${foundTask.originalDescription.substring(0, 100)}\n\nProgress: ${completedTasks + 1}/${totalTasks}`
      : `❌ Task ${foundTask.taskNumber} FAILED\n\n${result.result.substring(0, 200)}`
    );

    // Also sync individual file
    try {
      const indFile = '/root/genplatform/data/task-queue/task_1773996310129_PRIORITY-1-FIX-ALL-PAGES.md.json';
      await fs.writeFile(indFile, JSON.stringify(queue, null, 2));
    } catch {}

    // Auto-execute next if auto-mode on
    try {
      const config = JSON.parse(await fs.readFile(CONFIG_FILE, 'utf-8'));
      if (config.autoMode !== false && result.success) {
        setTimeout(() => executeNext(), 3000);
      }
    } catch {
      if (result.success) setTimeout(() => executeNext(), 3000);
    }

    return { taskId: foundTask.taskId, sent: true, success: result.success, taskNumber: foundTask.taskNumber, totalTasks, completedTasks: completedTasks + (result.success ? 1 : 0) };

  } catch (error: any) {
    await clearLock();
    await addLog({ timestamp: new Date().toISOString(), type: 'error', message: `Execute-next error: ${error.message}` });
    return { error: error.message };
  }
}

export async function POST(request: NextRequest) {
  const result = await executeNext();
  return NextResponse.json(result);
}
