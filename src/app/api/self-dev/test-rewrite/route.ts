import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';

export async function POST(request: NextRequest) {
  try {
    const { fileId, messageNumber } = await request.json();
    
    const queuePath = path.join(TASK_QUEUE_DIR, fileId + '.json');
    const queue = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
    
    const message = queue.messages.find((m: any) => m.messageNumber === messageNumber);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    // Simulate micro-tasks for each task in the message
    message.tasks.forEach((task: any, index: number) => {
      // Generate sample micro-tasks based on the task description
      const microTasks = [];
      
      // Create 2-4 micro-tasks per task
      const numMicroTasks = Math.min(4, Math.max(2, Math.floor(Math.random() * 3) + 2));
      
      for (let i = 0; i < numMicroTasks; i++) {
        microTasks.push({
          id: `${fileId}-msg${messageNumber}-task${task.taskNumber}-micro${i + 1}`,
          filePath: `/src/components/example-${i + 1}.tsx`,
          change: `Micro-task ${i + 1} for ${task.originalDescription.substring(0, 50)}...`,
          description: `Update component ${i + 1}`,
          status: 'pending'
        });
      }
      
      task.microTasks = microTasks;
      task.rewritten = true;
      task.status = 'review';
    });
    
    // Update total micro-tasks count
    queue.totalMicroTasks = queue.messages.reduce((sum: number, msg: any) => 
      sum + msg.tasks.reduce((taskSum: number, task: any) => 
        taskSum + (task.microTasks?.length || 0), 0
      ), 0
    );
    
    await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
    
    return NextResponse.json({ 
      success: true,
      message: `Rewritten message ${messageNumber} with sample micro-tasks`
    });
    
  } catch (error) {
    console.error('Test rewrite error:', error);
    return NextResponse.json(
      { error: 'Failed to test rewrite', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}