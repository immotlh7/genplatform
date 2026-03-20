import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASKS_FILE = '/root/genplatform/data/project-tasks.json';

async function loadTasks(): Promise<any[]> {
  try { return JSON.parse(await fs.readFile(TASKS_FILE, 'utf-8')); } catch { return []; }
}
async function saveTasks(tasks: any[]) {
  await fs.mkdir(path.dirname(TASKS_FILE), { recursive: true });
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tasks = await loadTasks();
  return NextResponse.json({ tasks: tasks.filter(t => t.projectId === id) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const tasks = await loadTasks();
  const newTask = { id: `task_${Date.now()}`, projectId: id, status: 'backlog', createdAt: new Date().toISOString(), ...body };
  tasks.push(newTask);
  await saveTasks(tasks);
  return NextResponse.json(newTask);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { taskId, ...updates } = await req.json();
  const tasks = await loadTasks();
  const idx = tasks.findIndex(t => t.id === taskId && t.projectId === id);
  if (idx === -1) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() };
  await saveTasks(tasks);
  return NextResponse.json(tasks[idx]);
}
