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
    
    // Reset all tasks in the message to pending state
    message.tasks.forEach((task: any) => {
      task.rewritten = false;
      task.approved = false;
      task.status = 'pending';
      task.microTasks = [];
      delete task.executionResult;
    });
    
    // Update total micro-tasks count
    queue.totalMicroTasks = queue.messages.reduce((sum: number, msg: any) => 
      sum + msg.tasks.reduce((taskSum: number, task: any) => 
        taskSum + (task.microTasks?.length || 0), 0
      ), 0
    );
    
    // Save updated queue
    await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
    
    return NextResponse.json({ 
      success: true,
      message: 'Tasks reset for re-rewriting'
    });
    
  } catch (error) {
    console.error('Reject error:', error);
    return NextResponse.json(
      { error: 'Failed to reject tasks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}