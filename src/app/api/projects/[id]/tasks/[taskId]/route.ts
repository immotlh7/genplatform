import { NextResponse } from 'next/server';
import { TaskRepo, LogRepo } from '@/lib/repositories';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params;
    const body = await req.json();
    const task = TaskRepo.update(taskId, body);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    LogRepo.add(`Task "${task.title}" moved to ${body.status}`, 'info', id, taskId);
    return NextResponse.json(task);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
