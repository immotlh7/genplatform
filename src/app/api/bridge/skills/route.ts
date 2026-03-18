import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${BRIDGE_URL}/api/skills`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, skills: [] }, { status: 500 });
  }
}
