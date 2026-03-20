import { NextResponse } from 'next/server';
import fs from 'fs/promises';

export async function GET() {
  try {
    const queue = JSON.parse(await fs.readFile('/root/genplatform/data/task-queue/task-queue.json', 'utf-8'));
    
    let stats = {
      totalTasks: 0,
      completedTasks: 0,
      executingTasks: 0,
      approvedTasks: 0,
      pendingTasks: 0,
      skippedTasks: 0
    };
    
    let currentTask = null;
    
    queue.messages?.forEach(msg => {
      msg.tasks?.forEach(task => {
        stats.totalTasks++;
        
        if (task.status === 'done') stats.completedTasks++;
        else if (task.status === 'executing') {
          stats.executingTasks++;
          if (!currentTask) {
            currentTask = {
              messageNumber: msg.messageNumber,
              messageTitle: msg.summary,
              task: task
            };
          }
        }
        else if (task.status === 'skipped') stats.skippedTasks++;
        else if (task.approved && task.status === 'approved') stats.approvedTasks++;
        else stats.pendingTasks++;
      });
    });
    
    // Get config
    let config = { autoMode: false };
    try {
      const configData = await fs.readFile('/root/genplatform/data/self-dev-config.json', 'utf-8');
      config = JSON.parse(configData);
    } catch {}
    
    return NextResponse.json({
      stats,
      currentTask,
      config,
      isExecuting: stats.executingTasks > 0
    });
  } catch (error) {
    console.error('Execution stats error:', error);
    return NextResponse.json({ 
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        executingTasks: 0,
        approvedTasks: 0,
        pendingTasks: 0,
        skippedTasks: 0
      },
      currentTask: null,
      config: { autoMode: false },
      isExecuting: false
    });
  }
}