import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CURRENT_TASK_FILE = '/root/genplatform/data/current-task.json';
const EXECUTION_LOG_FILE = '/root/genplatform/data/execution-log.json';
const CONFIG_FILE = '/root/genplatform/data/self-dev-config.json';

export async function GET(request: NextRequest) {
  try {
    // Read current task (small file)
    let currentTask = null;
    try {
      const currentData = await fs.readFile(CURRENT_TASK_FILE, 'utf-8');
      currentTask = JSON.parse(currentData);
    } catch {}
    
    // Read config
    let config = { autoMode: false };
    try {
      const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
      config = JSON.parse(configData);
    } catch {}
    
    // Read last 20 lines of execution log only
    let recentLogs = [];
    try {
      const logsData = await fs.readFile(EXECUTION_LOG_FILE, 'utf-8');
      const logs = JSON.parse(logsData);
      recentLogs = logs.slice(-20); // Last 20 entries only
    } catch {}
    
    // Calculate stats from current task
    const stats = {
      totalTasks: currentTask?.totalTasks || 0,
      completedTasks: currentTask?.completedTasks || 0,
      executingTasks: currentTask?.task?.status === 'executing' ? 1 : 0,
      currentTaskId: currentTask?.taskId,
      currentTaskDescription: currentTask?.task?.description
    };
    
    return NextResponse.json({
      currentTask,
      config,
      stats,
      recentLogs,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json({
      currentTask: null,
      config: { autoMode: false },
      stats: {},
      recentLogs: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}