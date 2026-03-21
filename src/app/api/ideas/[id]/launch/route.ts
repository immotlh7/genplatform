import { NextResponse } from 'next/server';
import { enqueue } from '@/lib/queue';
import { IdeaRepo } from '@/lib/repositories';
import '@/lib/jobs/idea-analysis';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = IdeaRepo.getById(id);
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });

  const body = await req.json();
  const { approvedFeatures } = body;

  const analysis = idea.analysis?.expanded || {};
  const projectName = analysis.projectName || 'New Project';
  const techStack = analysis.techStack || {};

  const job = enqueue('launch-project', {
    ideaId: id,
    approvedFeatures: approvedFeatures || analysis.coreFeatures || [],
    projectName,
    techStack,
    redirectTo: '/dashboard/projects',
  });

  IdeaRepo.update(id, { status: 'launching' });

  return NextResponse.json({
    jobId: job.id,
    status: 'queued',
    message: 'Project creation started. Track via /api/jobs/' + job.id,
  });
}
