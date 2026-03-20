import { NextResponse } from 'next/server';
import { getRotationStatus } from '@/lib/account-rotation';

export async function GET() {
  return NextResponse.json({ accounts: getRotationStatus() });
}
