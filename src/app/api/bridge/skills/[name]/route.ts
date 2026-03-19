import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await context.params;
    const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';
    
    // Fetch skill markdown content from Bridge API
    const res = await fetch(`${BRIDGE_URL}/api/skills/${encodeURIComponent(name)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message, content: null }, 
      { status: 500 }
    );
  }
}