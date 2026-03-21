import { NextResponse } from 'next/server';
import { ProjectRepo, TaskRepo, PipelineRepo } from '@/lib/repositories';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = ProjectRepo.getById(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const tasks = TaskRepo.getByProject(id);
  project.taskSummary = {
    total: tasks.length,
    completed: tasks.filter((t: any) => t.status === 'done').length,
    inProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
    planned: tasks.filter((t: any) => t.status === 'planned').length,
  };

  return NextResponse.json(project);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = ProjectRepo.update(id, body);
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  ProjectRepo.delete(id);
  return NextResponse.json({ ok: true });
}
