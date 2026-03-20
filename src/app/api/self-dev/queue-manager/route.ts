import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';
const TASK_QUEUE_FILE = '/root/genplatform/data/task-queue/task-queue.json';
const EXECUTION_LOG_FILE = '/root/genplatform/data/execution-log.json';

async function addLog(log: any) {
  try {
    let logs = [];
    try {
      const data = await fs.readFile(EXECUTION_LOG_FILE, 'utf-8');
      logs = JSON.parse(data);
    } catch {
      await fs.mkdir(path.dirname(EXECUTION_LOG_FILE), { recursive: true });
    }
    logs.push(log);
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }
    await fs.writeFile(EXECUTION_LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // List all queue files
    const files = await fs.readdir(TASK_QUEUE_DIR).catch(() => []);
    const queues = [];
    
    for (const file of files.sort()) {
      if (file.endsWith('.json')) {
        try {
          const data = await fs.readFile(path.join(TASK_QUEUE_DIR, file), 'utf-8');
          const queue = JSON.parse(data);
          
          // Calculate stats
          let totalTasks = 0;
          let approvedTasks = 0;
          let executingTasks = 0;
          let doneTasks = 0;
          let failedTasks = 0;
          
          if (queue.batches) {
            queue.batches.forEach((batch: any) => {
              batch.tasks.forEach((task: any) => {
                totalTasks++;
                if (task.approved) approvedTasks++;
                if (task.status === 'executing') executingTasks++;
                if (task.status === 'done') doneTasks++;
                if (task.status === 'failed' || task.status === 'skipped') failedTasks++;
              });
            });
          }
          
          queues.push({
            file,
            fileName: queue.fileName,
            createdAt: queue.createdAt,
            stats: {
              total: totalTasks,
              approved: approvedTasks,
              executing: executingTasks,
              done: doneTasks,
              failed: failedTasks,
              pending: approvedTasks - doneTasks - failedTasks - executingTasks
            },
            isActive: file === 'task-queue.json'
          });
        } catch (error) {
          console.error(`Failed to read queue file ${file}:`, error);
        }
      }
    }
    
    return NextResponse.json({ queues });
    
  } catch (error) {
    console.error('Queue manager error:', error);
    return NextResponse.json(
      { error: 'Failed to list queues' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, queueFile } = body;
    
    switch (action) {
      case 'activate': {
        // Make a queue file the active one by copying it to task-queue.json
        const sourcePath = path.join(TASK_QUEUE_DIR, queueFile);
        const targetPath = TASK_QUEUE_FILE;
        
        // Check if source exists
        try {
          await fs.access(sourcePath);
        } catch {
          return NextResponse.json(
            { error: 'Queue file not found' },
            { status: 404 }
          );
        }
        
        // Copy to active queue
        const data = await fs.readFile(sourcePath, 'utf-8');
        await fs.writeFile(targetPath, data);
        
        await addLog({
          timestamp: new Date().toISOString(),
          type: 'info',
          message: `Activated queue: ${queueFile}`
        });
        
        return NextResponse.json({ 
          success: true,
          message: `Queue ${queueFile} is now active`
        });
      }
      
      case 'delete': {
        // Delete a queue file
        const filePath = path.join(TASK_QUEUE_DIR, queueFile);
        
        // Don't delete the active queue
        if (queueFile === 'task-queue.json') {
          return NextResponse.json(
            { error: 'Cannot delete the active queue' },
            { status: 400 }
          );
        }
        
        try {
          await fs.unlink(filePath);
          
          await addLog({
            timestamp: new Date().toISOString(),
            type: 'info',
            message: `Deleted queue: ${queueFile}`
          });
          
          return NextResponse.json({ 
            success: true,
            message: `Queue ${queueFile} deleted`
          });
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to delete queue file' },
            { status: 500 }
          );
        }
      }
      
      case 'reset': {
        // Reset a specific queue - mark all tasks as pending again
        const filePath = queueFile === 'active' 
          ? TASK_QUEUE_FILE 
          : path.join(TASK_QUEUE_DIR, queueFile);
        
        try {
          const data = await fs.readFile(filePath, 'utf-8');
          const queue = JSON.parse(data);
          
          // Reset all task statuses
          if (queue.batches) {
            queue.batches.forEach((batch: any) => {
              batch.tasks.forEach((task: any) => {
                if (task.approved && (task.status === 'done' || task.status === 'failed' || task.status === 'skipped' || task.status === 'executing')) {
                  delete task.status;
                  delete task.startedAt;
                  delete task.completedAt;
                  delete task.skipReason;
                  delete task.lastError;
                  task.retryCount = 0;
                }
              });
            });
          }
          
          await fs.writeFile(filePath, JSON.stringify(queue, null, 2));
          
          await addLog({
            timestamp: new Date().toISOString(),
            type: 'info',
            message: `Reset queue: ${queueFile} - all approved tasks marked as pending`
          });
          
          return NextResponse.json({ 
            success: true,
            message: `Queue ${queueFile} reset - all tasks are pending again`
          });
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to reset queue' },
            { status: 500 }
          );
        }
      }
      
      case 'clear-logs': {
        // Clear execution logs
        await fs.writeFile(EXECUTION_LOG_FILE, '[]');
        
        return NextResponse.json({ 
          success: true,
          message: 'Execution logs cleared'
        });
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Queue manager error:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}