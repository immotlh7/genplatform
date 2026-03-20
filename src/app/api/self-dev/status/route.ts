import { NextResponse } from 'next/server';
import fs from 'fs/promises';

interface ExecutionLog {
  timestamp: string;
  type: string;
  message: string;
  taskId?: string;
}

export async function GET() {
  try {
    // Read current task
    let currentTask = null;
    try {
      const currentData = await fs.readFile('/root/genplatform/data/current-task.json', 'utf-8');
      currentTask = JSON.parse(currentData);
    } catch {}

    // Read execution log
    let executionLog: ExecutionLog[] = [];
    try {
      const logData = await fs.readFile('/root/genplatform/data/execution-log.json', 'utf-8');
      executionLog = JSON.parse(logData);
    } catch {}

    // Read session tracker
    let sessionTracker = {
      tasksSinceReset: 0,
      totalResets: 0,
      lastResetTime: null,
      totalTasksSent: 0
    };
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

    // Get last 20 log entries
    const recentLogs = executionLog.slice(-20).reverse();

    // Check if actively executing
    const lastLog = executionLog[executionLog.length - 1];
    const isExecuting = lastLog && 
      (Date.now() - new Date(lastLog.timestamp).getTime()) < 60000 && // Within last minute
      (lastLog.type === 'task_sent' || lastLog.type === 'developer_message');

    return NextResponse.json({
      currentTask,
      isExecuting,
      autoMode: config.autoMode,
      sessionStats: {
        tasksSinceReset: sessionTracker.tasksSinceReset,
        totalResets: sessionTracker.totalResets,
        totalTasksSent: sessionTracker.totalTasksSent
      },
      recentLogs,
      lastActivity: lastLog?.timestamp || null
    });
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json({ 
      error: 'Failed to get status',
      currentTask: null,
      isExecuting: false,
      autoMode: false,
      sessionStats: {
        tasksSinceReset: 0,
        totalResets: 0,
        totalTasksSent: 0
      },
      recentLogs: []
    }, { status: 500 });
  }
}