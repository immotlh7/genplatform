import { NextResponse } from 'next/server';
import fs from 'fs/promises';

export async function GET() {
  try {
    // Read session tracker for task count
    const tracker = await fs.readFile('/root/genplatform/data/session-tracker.json', 'utf-8')
      .then(JSON.parse).catch(() => ({ tasksSinceReset: 0, totalResets: 0 }));

    // Estimate based on tasks (rough: each task ~3K tokens avg)
    const estimatedUsed = tracker.tasksSinceReset * 3000;
    const total = 200000;
    const percent = Math.min(Math.round((estimatedUsed / total) * 100), 99);

    return NextResponse.json({
      used: estimatedUsed,
      total,
      percent,
      usedK: Math.round(estimatedUsed / 1000),
      tasksSinceReset: tracker.tasksSinceReset,
      totalResets: tracker.totalResets,
      status: percent > 90 ? 'critical' : percent > 80 ? 'warning' : 'ok'
    });
  } catch {
    return NextResponse.json({ used: 0, total: 200000, percent: 0, usedK: 0, status: 'ok' });
  }
}
