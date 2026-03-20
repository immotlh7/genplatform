import { NextResponse } from 'next/server';
import fs from 'fs/promises';

export async function GET() {
  try {
    const queue = JSON.parse(await fs.readFile('/root/genplatform/data/task-queue/task-queue.json', 'utf-8'));
    
    let stats = {
      totalTasks: 0,
      approvedTasks: 0,
      readyToExecute: 0,
      executing: 0,
      done: 0,
      pending: 0
    };
    
    let executingTask = null;
    let readyTasks = [];
    
    queue.messages?.forEach(msg => {
      msg.tasks?.forEach(task => {
        stats.totalTasks++;
        
        if (task.approved) stats.approvedTasks++;
        
        if (task.status === 'done') stats.done++;
        else if (task.status === 'executing') {
          stats.executing++;
          if (!executingTask) {
            executingTask = {
              messageNumber: msg.messageNumber,
              taskId: task.taskId,
              description: task.originalDescription
            };
          }
        }
        else if (task.approved && task.status === 'approved') {
          stats.readyToExecute++;
          readyTasks.push({
            messageNumber: msg.messageNumber,
            taskId: task.taskId,
            description: task.originalDescription?.substring(0, 50) + '...'
          });
        }
        else stats.pending++;
      });
    });
    
    // Test execution-stats API
    const statsResponse = await fetch('http://localhost:3000/api/self-dev/execution-stats');
    const execStats = await statsResponse.json();
    
    return NextResponse.json({
      systemCheck: {
        queueFileExists: true,
        totalMessages: queue.messages?.length || 0,
        stats
      },
      executingTask,
      readyTasks: readyTasks.slice(0, 5),
      executionStatsAPI: {
        working: statsResponse.ok,
        data: execStats
      },
      recommendations: [
        stats.readyToExecute > 0 ? '✅ You have tasks ready to execute!' : '❌ No tasks ready (need approved + status=approved)',
        stats.executing > 0 ? '✅ Task is currently executing' : '⚠️ No task executing',
        execStats.stats?.approvedTasks > 0 ? '✅ ExecutionStats API shows approved tasks' : '❌ ExecutionStats API issue'
      ]
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'System check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}