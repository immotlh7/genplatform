import { NextResponse } from 'next/server';
import { TaskRepo, LogRepo } from '@/lib/repositories';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(TaskRepo.getByProject(id));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const task = TaskRepo.create({ ...body, projectId: id });
    LogRepo.add(`Task created: ${task.title}`, 'info', id, task.id);
    return NextResponse.json(task);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
