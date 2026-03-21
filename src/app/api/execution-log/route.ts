import { NextResponse } from 'next/server';
import { LogRepo } from '@/lib/repositories';
export async function GET() {
  return NextResponse.json(LogRepo.getRecent(50));
}
