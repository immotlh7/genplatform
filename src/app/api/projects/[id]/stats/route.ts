import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';

const TASKS_FILE = '/root/genplatform/data/tasks.json';
const LOG_FILE = '/root/genplatform/data/execution-log.json';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  let tasks: any[] = [];
  try { tasks = JSON.parse(await fs.readFile(TASKS_FILE, 'utf-8')); } catch {}
  
  let logs: any[] = [];
  try { logs = JSON.parse(await fs.readFile(LOG_FILE, 'utf-8')); } catch {}

  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const projectLogs = logs.filter((l: any) => !l.projectId || l.projectId === projectId);

  const stats = {
    totalTasks: projectTasks.length,
    completed: projectTasks.filter(t => t.status === 'done' || t.status === 'completed').length,
    inProgress: projectTasks.filter(t => t.status === 'in_progress' || t.status === 'active').length,
    planned: projectTasks.filter(t => t.status === 'backlog' || t.status === 'planned' || t.status === 'pending').length,
    failed: projectTasks.filter(t => t.status === 'failed').length,
    executionLogs: projectLogs.length,
    lastExecution: projectLogs.length > 0 
      ? projectLogs.sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())[0]
      : null
  };

  return NextResponse.json(stats);
}
