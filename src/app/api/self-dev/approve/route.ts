import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';

export async function POST(request: NextRequest) {
  try {
    const { fileId, messageNumber, approved, scope = 'message' } = await request.json();
    
    if (!fileId || typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const queuePath = path.join(TASK_QUEUE_DIR, fileId + '.json');
    const queue = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
    
    if (scope === 'all') {
      // Approve all messages that have been rewritten
      queue.messages.forEach((message: any) => {
        if (message.tasks.every((task: any) => task.rewritten)) {
          message.tasks.forEach((task: any) => {
            task.approved = approved;
            task.status = approved ? 'approved' : 'review';
          });
        }
      });
      queue.hasApprovedTasks = queue.messages.some((m: any) => 
        m.tasks.some((t: any) => t.approved)
      );
    } else {
      // Approve specific message
      const message = queue.messages.find((m: any) => m.messageNumber === messageNumber);
      if (message) {
        message.tasks.forEach((task: any) => {
          if (task.rewritten) {
            task.approved = approved;
            task.status = approved ? 'approved' : 'review';
          }
        });
        queue.hasApprovedTasks = queue.messages.some((m: any) => 
          m.tasks.some((t: any) => t.approved)
        );
      }
    }
    
    // Update total counts
    const approvedTasks = queue.messages.reduce((sum: number, msg: any) => 
      sum + msg.tasks.filter((t: any) => t.approved).length, 0
    );
    
    await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
    
    return NextResponse.json({ 
      success: true,
      approvedTasks,
      hasApprovedTasks: queue.hasApprovedTasks
    });
    
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: 'Failed to approve tasks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}