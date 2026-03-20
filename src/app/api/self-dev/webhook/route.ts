import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const EXECUTION_LOG = '/root/genplatform/data/self-dev-execution.log';
const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message;
    const text = message?.text || '';
    
    // Log the webhook
    const logEntry = `[${new Date().toISOString()}] Webhook received: ${text.substring(0, 100)}...\n`;
    await fs.appendFile(EXECUTION_LOG, logEntry).catch(console.error);
    
    // Handle rewrite completion
    const rewriteMatch = text.match(/\[REWRITE_COMPLETE:([^:]+):(\d+)\]/);
    if (rewriteMatch) {
      const [_, fileId, messageNumberStr] = rewriteMatch;
      const messageNumber = parseInt(messageNumberStr);
      
      const queuePath = path.join(TASK_QUEUE_DIR, fileId + '.json');
      const queue = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
      const queueMessage = queue.messages.find((m: any) => m.messageNumber === messageNumber);
      
      if (queueMessage) {
        // Parse micro-tasks from the response
        const lines = text.split('\n').slice(1); // Skip the header
        const microTasksByTask: Record<number, any[]> = {};
        let currentTaskNumber = 0;
        
        for (const line of lines) {
          const taskMatch = line.match(/Task (\d+) micro-tasks:/);
          if (taskMatch) {
            currentTaskNumber = parseInt(taskMatch[1]);
            microTasksByTask[currentTaskNumber] = [];
          } else if (currentTaskNumber && line.match(/^\d+\.\s/)) {
            const microTaskMatch = line.match(/^\d+\.\s([^|]+)\s*\|\s*(.+)$/);
            if (microTaskMatch) {
              const [_, filePath, change] = microTaskMatch;
              microTasksByTask[currentTaskNumber].push({
                id: `${fileId}-msg${messageNumber}-task${currentTaskNumber}-micro${microTasksByTask[currentTaskNumber].length + 1}`,
                filePath: filePath.trim(),
                change: change.trim(),
                description: `${filePath.trim()} - ${change.trim()}`,
                status: 'pending'
              });
            }
          }
        }
        
        // Update tasks with micro-tasks
        queueMessage.tasks.forEach((task: any) => {
          if (microTasksByTask[task.taskNumber]) {
            task.microTasks = microTasksByTask[task.taskNumber];
            task.rewritten = true;
            task.status = 'review'; // Ready for review
          }
        });
        
        // Update total micro-tasks count
        queue.totalMicroTasks = queue.messages.reduce((sum: number, msg: any) => 
          sum + msg.tasks.reduce((taskSum: number, task: any) => 
            taskSum + (task.microTasks?.length || 0), 0
          ), 0
        );
        
        await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
      }
    }
    
    // Handle task execution results
    const resultMatch = text.match(/\[TASK_RESULT:([^:]+):(\d+):(\d+):(success|failed)\]/);
    if (resultMatch) {
      const [_, fileId, messageNumberStr, taskNumberStr, result] = resultMatch;
      const messageNumber = parseInt(messageNumberStr);
      const taskNumber = parseInt(taskNumberStr);
      
      const queuePath = path.join(TASK_QUEUE_DIR, fileId + '.json');
      const queue = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
      const queueMessage = queue.messages.find((m: any) => m.messageNumber === messageNumber);
      
      if (queueMessage) {
        const task = queueMessage.tasks.find((t: any) => t.taskNumber === taskNumber);
        if (task) {
          task.status = result === 'success' ? 'done' : 'failed';
        }
        await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
      }
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}