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
      // File doesn't exist, don't create it
      console.log('Individual queue file not found, using main queue only');
    }
    
    // Add log entry
    await addLog({
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `✅ Approved ${approvedTaskCount} tasks in message ${messageNumber}`
    });
    
    // Auto-start execution if auto-mode is on
    try {
      const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
      const config = JSON.parse(configData);
      
      if (config.autoMode && approvedTaskCount > 0) {
        // Trigger execution
        const executeResponse = await fetch('http://localhost:3000/api/self-dev/execute-next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (executeResponse.ok) {
          const executeResult = await executeResponse.json();
          await addLog({
            timestamp: new Date().toISOString(),
            type: 'info',
            message: `🚀 Started execution after approval - Task ${executeResult.taskNumber} sent`
          });
        }
      }
    } catch (error) {
      console.error('Failed to trigger execution:', error);
    }
    
    return NextResponse.json({ 
      success: true,
      approvedTasks: approvedTaskCount,
      message: `Approved ${approvedTaskCount} tasks`
    });
    
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: 'Failed to approve tasks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}