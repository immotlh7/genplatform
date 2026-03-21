import { NextResponse } from 'next/server';
import { PipelineRepo } from '@/lib/repositories';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(PipelineRepo.getForProject(id));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { stage, data } = await req.json();
  PipelineRepo.setStage(id, stage, data);
  return NextResponse.json({ ok: true });
}
