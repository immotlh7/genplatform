import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';

export async function POST(request: NextRequest) {
  try {
    const { fileId, messageNumber, approved, scope = 'message' } = await request.json();
    
    if (!fileId || messageNumber === undefined || approved === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Load the task queue
    const queuePath = path.join(TASK_QUEUE_DIR, `${fileId}.json`);
    const queueData = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
    
    if (scope === 'all') {
      // Approve/reject all messages
      for (const message of queueData.messages) {
        for (const task of message.tasks) {
          task.approved = approved;
          for (const microTask of task.microTasks || []) {
            microTask.approved = approved;
          }
        }
      }
    } else if (scope === 'message') {
      // Approve/reject specific message
      const message = queueData.messages.find((m: any) => m.messageNumber === messageNumber);
      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }
      
      for (const task of message.tasks) {
        task.approved = approved;
        for (const microTask of task.microTasks || []) {
          microTask.approved = approved;
        }
      }
    }
    
    // Update queue status
    const hasApprovedTasks = queueData.messages.some((m: any) => 
      m.tasks.some((t: any) => t.approved)
    );
    
    queueData.hasApprovedTasks = hasApprovedTasks;
    
    // Save updated queue
    await fs.writeFile(queuePath, JSON.stringify(queueData, null, 2));
    
    return NextResponse.json({
      status: 'updated',
      fileId,
      messageNumber,
      approved,
      hasApprovedTasks
    });
    
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}