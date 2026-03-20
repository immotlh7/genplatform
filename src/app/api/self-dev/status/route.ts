import { NextResponse } from 'next/server';
import fs from 'fs/promises';

export async function GET() {
  try {
    // Read current task
    let currentTask = null;
    try {
      const currentData = await fs.readFile('/root/genplatform/data/current-task.json', 'utf-8');
      currentTask = JSON.parse(currentData);
    } catch {}

    // Read execution log
    let executionLog: any[] = [];
    try {
      const logData = await fs.readFile('/root/genplatform/data/execution-log.json', 'utf-8');
      executionLog = JSON.parse(logData);
    } catch {}

    // Read session tracker
    let sessionTracker = { tasksSinceReset: 0, totalResets: 0, lastResetTime: null, totalTasksSent: 0 };
    try {
      const trackerData = await fs.readFile('/root/genplatform/data/session-tracker.json', 'utf-8');
      sessionTracker = JSON.parse(trackerData);
    } catch {}

    // Read config
    let config = { autoMode: false };
    try {
      const configData = await fs.readFile('/root/genplatform/data/self-dev-config.json', 'utf-8');
      config = JSON.parse(configData);
    } catch {}

    // Calculate REAL stats from queue
    let stats = {
      totalTasks: 0,
      completedTasks: 0,
      executingTasks: 0,
      approvedTasks: 0,
      pendingTasks: 0,
      skippedTasks: 0
    };

    let executingTaskDetail = null;

    try {
      const QUEUE_DIR = '/root/genplatform/data/task-queue';
      const queueFiles = (await fs.readdir(QUEUE_DIR)).filter((f: string) => f.endsWith('.json') && !f.endsWith('.json.json') && f !== 'task-queue.json');
      const allMessages: any[] = [];
      for (const qf of queueFiles) {
        try {
          const q = JSON.parse(await fs.readFile(`${QUEUE_DIR}/${qf}`, 'utf-8'));
          allMessages.push(...(q.messages || []));
        } catch {}
      }
      const queue = { messages: allMessages };

      queue.messages?.forEach((msg: any) => {
        msg.tasks?.forEach((task: any) => {
          stats.totalTasks++;
          if (task.status === 'done') stats.completedTasks++;
          else if (task.status === 'executing') {
            stats.executingTasks++;
            if (!executingTaskDetail) {
              executingTaskDetail = {
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
    } catch {}

    const recentLogs = executionLog.slice(-20).reverse();

    return NextResponse.json({
      // Real stats for ExecutionMonitor
      stats,
      // Current executing task
      currentTask: executingTaskDetail || currentTask,
      isExecuting: stats.executingTasks > 0,
      autoMode: config.autoMode,
      config,
      sessionStats: {
        tasksSinceReset: sessionTracker.tasksSinceReset,
        totalResets: sessionTracker.totalResets,
        totalTasksSent: sessionTracker.totalTasksSent
      },
      recentLogs,
      lastActivity: executionLog[executionLog.length - 1]?.timestamp || null
    });
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json({
      stats: { totalTasks: 0, completedTasks: 0, executingTasks: 0, approvedTasks: 0, pendingTasks: 0, skippedTasks: 0 },
      currentTask: null,
      isExecuting: false,
      autoMode: false,
      config: { autoMode: false },
      sessionStats: { tasksSinceReset: 0, totalResets: 0, totalTasksSent: 0 },
      recentLogs: []
    }, { status: 500 });
  }
}