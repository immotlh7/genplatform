import { NextResponse } from 'next/server';
import { TaskRepo } from '@/lib/repositories';
export async function GET() {
  return NextResponse.json(TaskRepo.getAll());
}
