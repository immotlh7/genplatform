import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const logEntry = `[${data.timestamp}] ${data.url}\n  Message: ${data.message}\n  Stack: ${(data.stack || '').substring(0, 500)}\n\n`;
    await fs.appendFile('/root/genplatform/data/client-errors.log', logEntry);
    console.error('CLIENT ERROR:', data.message, '\nURL:', data.url, '\nStack:', (data.stack || '').substring(0, 300));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
