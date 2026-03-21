import { NextResponse } from 'next/server';
import { AgentRepo } from '@/lib/repositories';

export async function GET() {
  return NextResponse.json(AgentRepo.getAll());
}

export async function POST(req: Request) {
  const { agentId, action, task } = await req.json();
  if (action === 'assign_task') {
    AgentRepo.setStatus(agentId, 'active', task);
  } else if (action === 'complete_task') {
    AgentRepo.incrementDone(agentId);
  }
  return NextResponse.json({ ok: true });
}
