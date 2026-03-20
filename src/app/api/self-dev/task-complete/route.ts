import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';
const TELEGRAM_BOT_TOKEN = '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = '510906393';

export async function POST(request: NextRequest) {
  try {
    const { 
      fileId, 
      messageNumber, 
      taskNumber, 
      microTaskIndex, 
      success = true, 
      message = '', 
      error = null 
    } = await request.json();
    
    if (!fileId || !messageNumber || !taskNumber || microTaskIndex === undefined) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    
    // Load queue
    const queuePath = path.join(TASK_QUEUE_DIR, fileId + '.json');
    const queue = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
    
    const msg = queue.messages.find((m: any) => m.messageNumber === messageNumber);
    if (!msg) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    const task = msg.tasks.find((t: any) => t.taskNumber === taskNumber);
    if (!task || !task.microTasks || !task.microTasks[microTaskIndex]) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    const microTask = task.microTasks[microTaskIndex];
    
    // Update micro-task status
    microTask.status = success ? 'done' : 'failed';
    if (error) {
      microTask.error = error;
    }
    
    // Check if all micro-tasks are complete for this task
    const allMicroTasksComplete = task.microTasks.every((mt: any) => 
      mt.status === 'done' || mt.status === 'failed'
    );
    
    const allMicroTasksSuccessful = task.microTasks.every((mt: any) => 
      mt.status === 'done'
    );
    
    if (allMicroTasksComplete) {
      // Update task status
      task.status = allMicroTasksSuccessful ? 'done' : 'failed';
      task.executionResult = {
        success: allMicroTasksSuccessful,
        message: allMicroTasksSuccessful 
          ? `Completed all ${task.microTasks.length} micro-tasks successfully` 
          : `Completed with ${task.microTasks.filter((mt: any) => mt.status === 'failed').length} failed micro-tasks`,
        completedAt: new Date().toISOString()
      };
      
      // Check if all tasks in message are complete
      const allTasksComplete = msg.tasks.every((t: any) => 
        t.status === 'done' || t.status === 'failed'
      );
      
      if (allTasksComplete) {
        // Send message completion notification
        const successCount = msg.tasks.filter((t: any) => t.status === 'done').length;
        const failedCount = msg.tasks.filter((t: any) => t.status === 'failed').length;
        
        const notificationText = `[ORCHESTRATOR] 📊 Message ${messageNumber} Complete:
✅ Success: ${successCount} tasks
❌ Failed: ${failedCount} tasks
🔢 Total: ${msg.tasks.length} tasks

${failedCount > 0 ? '⚠️ Some tasks failed. You may want to re-rewrite them.' : '🎉 All tasks completed successfully!'}`;
        
        // Send notification to Telegram
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: notificationText,
            parse_mode: 'Markdown'
          })
        }).catch(err => console.error('Failed to send completion notification:', err));
      }
    }
    
    // Save updated queue
    await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
    
    return NextResponse.json({
      success: true,
      microTaskStatus: microTask.status,
      taskStatus: task.status,
      message: 'Task completion recorded'
    });
    
  } catch (error) {
    console.error('Task complete error:', error);
    return NextResponse.json({ 
      error: 'Failed to update task status', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}