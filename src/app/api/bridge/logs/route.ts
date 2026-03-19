import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${BRIDGE_URL}/api/logs`, { cache: 'no-store' });
    const raw = await res.json();

    // Parse the complex log format into simple lines
    const lines = (raw.lines || []).map((line: any) => {
      try {
        if (typeof line === 'string') {
          const parsed = JSON.parse(line);
          return {
            timestamp: parsed._meta?.date || parsed.time || new Date().toISOString(),
            level: (parsed._meta?.logLevelName || 'INFO').toLowerCase(),
            message: parsed['2'] || parsed.message || JSON.stringify(line).substring(0, 200)
          };
        }
        return { timestamp: new Date().toISOString(), level: 'info', message: String(line).substring(0, 200) };
      } catch {
        return { timestamp: new Date().toISOString(), level: 'info', message: String(line).substring(0, 200) };
      }
    });

    return NextResponse.json({ lines, totalLines: lines.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, lines: [] }, { status: 500 });
  }
}
