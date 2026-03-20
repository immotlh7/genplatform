import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';
const MAIN_QUEUE_FILE = '/root/genplatform/data/task-queue/task-queue.json';
const EXECUTION_LOG_FILE = '/root/genplatform/data/execution-log.json';
const CONFIG_FILE = '/root/genplatform/data/self-dev-config.json';

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

async function triggerExecution() {
  try {
    const response = await fetch('http://localhost:3000/api/self-dev/execute-next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await response.json();
    console.log('[APPROVE] Triggered execution:', result);
    return result;
  } catch (error) {
    console.error('[APPROVE] Failed to trigger execution:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fileId, messageNumber, approved, scope = 'message' } = await request.json();
    
    if (!fileId || typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Always use main queue file for consistency
    const queue = JSON.parse(await fs.readFile(MAIN_QUEUE_FILE, 'utf-8'));
    
    let approvedTaskCount = 0;
    
    if (scope === 'all') {
      queue.messages.forEach((message: any) => {
        message.tasks.forEach((task: any) => {
          if (task.rewritten || task.microTasks?.length > 0) {
            task.approved = approved;
            task.status = approved ? 'approved' : 'review';
            if (approved) approvedTaskCount++;
          }
        });
      });
    } else {
      const message = queue.messages.find((m: any) => m.messageNumber === messageNumber);
      if (message) {
        message.tasks.forEach((task: any) => {
          if (task.rewritten || task.microTasks?.length > 0) {
            task.approved = approved;
            task.status = approved ? 'approved' : 'review';
            if (approved) approvedTaskCount++;
          }
        });
      }
    }
    
    // Save to main queue
    await fs.writeFile(MAIN_QUEUE_FILE, JSON.stringify(queue, null, 2));
    
    // Update individual file - DON'T CREATE NEW FILES
    const individualPath = path.join(TASK_QUEUE_DIR, fileId + '.json');
    try {
      const stat = await fs.stat(individualPath);
      if (stat.isFile()) {
        await fs.writeFile(individualPath, JSON.stringify(queue, null, 2));
      }
    } catch (error) {
      console.log('Individual queue file not found, using main queue only');
    }
    
    // Add log entry
    await addLog({
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `✅ Approved ${approvedTaskCount} tasks in message ${messageNumber}`
    });
    
    // Check if auto-mode is enabled
    let autoMode = true; // Default to true
    try {
      const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
      const config = JSON.parse(configData);
      autoMode = config.autoMode !== false;
    } catch {}
    
    // If tasks were approved and auto-mode is on, start execution
    if (approvedTaskCount > 0 && autoMode) {
      // Trigger execution immediately
      setTimeout(async () => {
        const result = await triggerExecution();
        if (result && !result.error) {
          await addLog({
            timestamp: new Date().toISOString(),
            type: 'info',
            message: `🚀 Auto-execution started after approval`
          });
        }
      }, 1000); // Small delay to ensure save is complete
    }
    
    return NextResponse.json({ 
      success: true,
      approvedTasks: approvedTaskCount,
      autoExecute: autoMode && approvedTaskCount > 0,
      message: `Approved ${approvedTaskCount} tasks${autoMode ? ' - execution will start automatically' : ''}`
    });
    
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: 'Failed to approve tasks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}