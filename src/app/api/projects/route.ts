import { NextResponse } from 'next/server';
import { ProjectRepo, LogRepo } from '@/lib/repositories';

export async function GET() {
  try {
    return NextResponse.json(ProjectRepo.getAll());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const project = ProjectRepo.create(body);
    LogRepo.add(`Project created: ${project.name}`, 'info', project.id);
    return NextResponse.json(project);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
