import { NextResponse } from 'next/server';
import { IdeaRepo } from '@/lib/repositories';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = IdeaRepo.getById(id);
  if (!idea) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(idea);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = IdeaRepo.update(id, body);
  return NextResponse.json(updated);
}
