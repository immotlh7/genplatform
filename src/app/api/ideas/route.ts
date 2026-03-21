import { NextResponse } from 'next/server';
import { IdeaRepo } from '@/lib/repositories';
export async function GET() {
  return NextResponse.json(IdeaRepo.getAll());
}
