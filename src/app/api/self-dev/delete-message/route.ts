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
    
    // Remove the message
    const originalLength = queue.messages.length;
    queue.messages = queue.messages.filter((m: any) => m.messageNumber !== messageNumber);
    
    if (queue.messages.length === originalLength) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    // Update counts
    queue.totalMessages = queue.messages.length;
    queue.totalTasks = queue.messages.reduce((sum: number, msg: any) => 
      sum + (msg.tasks?.length || 0), 0
    );
    queue.totalMicroTasks = queue.messages.reduce((sum: number, msg: any) => 
      sum + msg.tasks.reduce((taskSum: number, task: any) => 
        taskSum + (task.microTasks?.length || 0), 0
      ), 0
    );
    
    // Save updated queue
    await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
    
    return NextResponse.json({ 
      success: true,
      message: 'Message deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json(
      { error: 'Failed to delete message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}