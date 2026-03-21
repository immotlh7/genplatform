import { NextResponse } from 'next/server';
import { enqueue } from '@/lib/queue';
import { IdeaRepo } from '@/lib/repositories';
import '@/lib/jobs/idea-analysis';

export async function POST(req: Request) {
  const { ideaText } = await req.json();
  if (!ideaText?.trim()) {
    return NextResponse.json({ error: 'Idea text is required' }, { status: 400 });
  }

  const idea = IdeaRepo.create({ ideaText, status: 'analyzing' });
  const job = enqueue('analyze-idea', { ideaId: idea.id, ideaText });

  return NextResponse.json({
    ideaId: idea.id,
    jobId: job.id,
    status: 'queued',
    message: 'Analysis started. Track progress via SSE or poll /api/jobs/' + job.id,
  });
}
