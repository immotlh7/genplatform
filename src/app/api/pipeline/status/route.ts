import { NextResponse } from 'next/server';
import fs from 'fs/promises';

export async function GET() {
  try {
    const [execLog, currentTask, lock] = await Promise.all([
      fs.readFile('/root/genplatform/data/execution-log.json', 'utf-8').then(JSON.parse).catch(() => []),
      fs.readFile('/root/genplatform/data/current-task.json', 'utf-8').then(JSON.parse).catch(() => null),
      fs.readFile('/root/genplatform/data/execution-lock.json', 'utf-8').then(JSON.parse).catch(() => ({ locked: false }))
    ]);

    const recentLogs = execLog.slice(-20).reverse();
    const isRunning = lock.locked;
    const completedToday = recentLogs.filter((l: any) => l.type === 'task_done').length;
    const failedToday = recentLogs.filter((l: any) => l.type === 'task_failed').length;

    return NextResponse.json({
      isRunning,
      currentTask,
      completedToday,
      failedToday,
      recentActivity: recentLogs.slice(0, 10),
      lastActivity: execLog[execLog.length - 1]?.timestamp || null
    });
  } catch (error) {
    return NextResponse.json({ isRunning: false, currentTask: null, error: 'Failed to get status' });
  }
}
