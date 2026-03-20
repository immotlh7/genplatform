import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';

const SESSION_FILE = '/root/genplatform/data/session-tracker.json';
const CONTEXT_LIMIT = 30; // tasks before reset

export async function GET() {
  try {
    const tracker = JSON.parse(await fs.readFile(SESSION_FILE, 'utf-8').catch(() => '{}'));
    const usage = tracker.tasksSinceReset || 0;
    const percentage = Math.round((usage / CONTEXT_LIMIT) * 100);

    return NextResponse.json({
      tasksInContext: usage,
      contextLimit: CONTEXT_LIMIT,
      percentage,
      totalResets: tracker.totalResets || 0,
      totalTasksSent: tracker.totalTasksSent || 0,
      needsReset: usage >= CONTEXT_LIMIT,
      lastResetTime: tracker.lastResetTime
    });
  } catch {
    return NextResponse.json({ tasksInContext: 0, contextLimit: CONTEXT_LIMIT, percentage: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'reset') {
      const tracker = JSON.parse(await fs.readFile(SESSION_FILE, 'utf-8').catch(() => '{}'));
      tracker.tasksSinceReset = 0;
      tracker.totalResets = (tracker.totalResets || 0) + 1;
      tracker.lastResetTime = new Date().toISOString();
      await fs.writeFile(SESSION_FILE, JSON.stringify(tracker, null, 2));
      return NextResponse.json({ success: true, message: 'Context reset' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
