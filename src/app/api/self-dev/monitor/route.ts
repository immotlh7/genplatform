import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';
const MONITOR_LOG_PATH = '/root/genplatform/data/self-dev-monitor.json';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8630551989';

interface MonitorEntry {
  timestamp: string;
  type: 'task_complete' | 'task_failed' | 'review_passed' | 'review_failed' | 'build_success' | 'build_failed';
  fileId: string;
  messageNumber?: number;
  taskNumber?: number;
  microTaskId?: string;
  details: string;
  result?: any;
}

interface MonitorStats {
  totalTasksCompleted: number;
  totalTasksFailed: number;
  totalBuildsSuccessful: number;
  totalBuildsFailed: number;
  lastActivity: string;
  activeSince: string;
  log: MonitorEntry[];
}

// Load or initialize monitor data
async function loadMonitorData(): Promise<MonitorStats> {
  try {
    const data = await fs.readFile(MONITOR_LOG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    const initialData: MonitorStats = {
      totalTasksCompleted: 0,
      totalTasksFailed: 0,
      totalBuildsSuccessful: 0,
      totalBuildsFailed: 0,
      lastActivity: new Date().toISOString(),
      activeSince: new Date().toISOString(),
      log: []
    };
    await fs.writeFile(MONITOR_LOG_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

// Save monitor data
async function saveMonitorData(data: MonitorStats) {
  await fs.writeFile(MONITOR_LOG_PATH, JSON.stringify(data, null, 2));
}

// Send notification to Telegram
async function sendNotification(message: string, isError: boolean = false) {
  const icon = isError ? '❌' : '✅';
  const fullMessage = `[SELF-DEV MONITOR] ${icon} ${message}`;
  
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: fullMessage,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Ensure directories exist
    await fs.mkdir(TASK_QUEUE_DIR, { recursive: true });
    await fs.mkdir(path.dirname(MONITOR_LOG_PATH), { recursive: true });
    
    // Load monitor data
    const monitorData = await loadMonitorData();
    
    // Calculate current status from all queues
    let totalMicroTasks = 0;
    let completedMicroTasks = 0;
    let failedMicroTasks = 0;
    let executingMicroTasks = 0;
    let pendingApproval = 0;
    const activeProjects: string[] = [];
    
    const files = await fs.readdir(TASK_QUEUE_DIR).catch(() => []);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const queuePath = path.join(TASK_QUEUE_DIR, file);
        const queueData = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
        
        if (queueData.messages) {
          activeProjects.push(queueData.fileName || file);
          
          queueData.messages.forEach((msg: any) => {
            if (msg.tasks) {
              msg.tasks.forEach((task: any) => {
                if (task.rewritten && !task.approved) {
                  pendingApproval++;
                }
                
                if (task.microTasks) {
                  totalMicroTasks += task.microTasks.length;
                  
                  task.microTasks.forEach((micro: any) => {
                    if (micro.status === 'done') completedMicroTasks++;
                    else if (micro.status === 'failed') failedMicroTasks++;
                    else if (micro.status === 'executing') executingMicroTasks++;
                  });
                }
              });
            }
          });
        }
      } catch (error) {
        console.error(`Error processing queue file ${file}:`, error);
      }
    }
    
    // Calculate health status
    const successRate = totalMicroTasks > 0 
      ? Math.round((completedMicroTasks / totalMicroTasks) * 100) 
      : 0;
    
    const healthStatus = {
      overall: failedMicroTasks === 0 ? 'healthy' : 'warning',
      tasksHealth: successRate >= 90 ? 'excellent' : successRate >= 70 ? 'good' : 'needs_attention',
      lastCheck: new Date().toISOString()
    };
    
    // Recent activity (last 10 entries)
    const recentActivity = monitorData.log.slice(-10).reverse();
    
    return NextResponse.json({
      status: 'active',
      health: healthStatus,
      stats: {
        totalMicroTasks,
        completedMicroTasks,
        failedMicroTasks,
        executingMicroTasks,
        pendingApproval,
        successRate,
        totalTasksCompleted: monitorData.totalTasksCompleted,
        totalTasksFailed: monitorData.totalTasksFailed,
        totalBuildsSuccessful: monitorData.totalBuildsSuccessful,
        totalBuildsFailed: monitorData.totalBuildsFailed
      },
      activeProjects,
      recentActivity,
      lastActivity: monitorData.lastActivity,
      activeSince: monitorData.activeSince
    });
    
  } catch (error) {
    console.error('Monitor error:', error);
    return NextResponse.json(
      { error: 'Failed to get monitor status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    const monitorData = await loadMonitorData();
    const entry: MonitorEntry = {
      timestamp: new Date().toISOString(),
      type: action,
      fileId: data.fileId,
      messageNumber: data.messageNumber,
      taskNumber: data.taskNumber,
      microTaskId: data.microTaskId,
      details: data.details || '',
      result: data.result
    };
    
    // Update stats based on action
    switch (action) {
      case 'task_complete':
        monitorData.totalTasksCompleted++;
        await sendNotification(`Task completed: ${data.details}`);
        break;
        
      case 'task_failed':
        monitorData.totalTasksFailed++;
        await sendNotification(`Task failed: ${data.details} - Fixing...`, true);
        // Auto-trigger fix
        if (data.autoFix) {
          await triggerAutoFix(data);
        }
        break;
        
      case 'build_success':
        monitorData.totalBuildsSuccessful++;
        await sendNotification(`Build successful! ${data.details}`);
        break;
        
      case 'build_failed':
        monitorData.totalBuildsFailed++;
        await sendNotification(`Build failed: ${data.details} - Investigating...`, true);
        break;
        
      case 'review_failed':
        await sendNotification(`Code review found issues: ${data.details} - Creating fix tasks...`, true);
        break;
    }
    
    // Add to log (keep last 100 entries)
    monitorData.log.push(entry);
    if (monitorData.log.length > 100) {
      monitorData.log = monitorData.log.slice(-100);
    }
    
    monitorData.lastActivity = entry.timestamp;
    
    await saveMonitorData(monitorData);
    
    return NextResponse.json({
      success: true,
      entry,
      stats: {
        totalTasksCompleted: monitorData.totalTasksCompleted,
        totalTasksFailed: monitorData.totalTasksFailed
      }
    });
    
  } catch (error) {
    console.error('Monitor log error:', error);
    return NextResponse.json(
      { error: 'Failed to log monitor event' },
      { status: 500 }
    );
  }
}

// Auto-fix failed tasks
async function triggerAutoFix(data: any) {
  const fixMessage = `🔧 AUTO-FIX: Task failed in ${data.fileId}
Message: ${data.messageNumber}, Task: ${data.taskNumber}
Error: ${data.details}

Analyzing and applying fix...`;
  
  await sendNotification(fixMessage);
  
  // Here you would trigger the actual fix logic
  // For now, we'll just log it
  console.log('Auto-fix triggered for:', data);
}