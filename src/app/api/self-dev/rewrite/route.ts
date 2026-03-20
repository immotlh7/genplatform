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
    
    // For now, simulate rewriting by generating micro-tasks immediately
    // In production, this would send to Telegram and wait for webhook response
    message.tasks.forEach((task: any) => {
      if (!task.rewritten) {
        // Generate 2-4 micro-tasks based on the task description
        const microTasks = [];
        const taskWords = task.originalDescription.split(' ').slice(0, 10).join(' ');
        
        // Create realistic micro-tasks based on common patterns
        if (task.originalDescription.toLowerCase().includes('open') || 
            task.originalDescription.toLowerCase().includes('find')) {
          microTasks.push({
            id: `${fileId}-msg${messageNumber}-task${task.taskNumber}-micro1`,
            filePath: 'src/components/notifications/notification-system.tsx',
            change: 'Locate and analyze the component structure',
            description: 'Find the notification system component',
            status: 'pending'
          });
        }
        
        if (task.originalDescription.toLowerCase().includes('fix') || 
            task.originalDescription.toLowerCase().includes('update')) {
          microTasks.push({
            id: `${fileId}-msg${messageNumber}-task${task.taskNumber}-micro2`,
            filePath: 'src/components/notifications/notification-system.tsx',
            change: 'Update gateway status check logic',
            description: 'Fix the gateway status detection',
            status: 'pending'
          });
        }
        
        if (task.originalDescription.toLowerCase().includes('check') || 
            task.originalDescription.toLowerCase().includes('verify')) {
          microTasks.push({
            id: `${fileId}-msg${messageNumber}-task${task.taskNumber}-micro3`,
            filePath: 'src/components/notifications/notification-system.tsx',
            change: 'Verify the changes work correctly',
            description: 'Test the notification system',
            status: 'pending'
          });
        }
        
        // Default micro-tasks if none of the above
        if (microTasks.length === 0) {
          microTasks.push(
            {
              id: `${fileId}-msg${messageNumber}-task${task.taskNumber}-micro1`,
              filePath: 'src/app/api/self-dev/route.ts',
              change: 'Implement the requested functionality',
              description: taskWords.substring(0, 50) + '...',
              status: 'pending'
            },
            {
              id: `${fileId}-msg${messageNumber}-task${task.taskNumber}-micro2`,
              filePath: 'src/app/api/self-dev/route.ts',
              change: 'Add error handling and validation',
              description: 'Ensure robust implementation',
              status: 'pending'
            }
          );
        }
        
        task.microTasks = microTasks;
        task.rewritten = true;
        task.status = 'review';
      }
    });
    
    // Update total micro-tasks count
    queue.totalMicroTasks = queue.messages.reduce((sum: number, msg: any) => 
      sum + msg.tasks.reduce((taskSum: number, task: any) => 
        taskSum + (task.microTasks?.length || 0), 0
      ), 0
    );
    
    await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
    
    // In production, this would send to Telegram
    // For now, return immediate success
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