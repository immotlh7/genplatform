import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${BRIDGE_URL}/api/cron`, { cache: 'no-store' });
    const raw = await res.json();

    const jobs = (raw.jobs || []).map((j: any, i: number) => ({
      id: j.id || `job-${i}`,
      name: j.name || 'Unnamed Job',
      schedule: j.schedule?.expr || j.schedule || '* * * * *',
      command: j.payload?.text?.substring(0, 200) || j.payload?.kind || 'N/A',
      description: j.payload?.text?.substring(0, 100) || j.name || '',
      enabled: j.enabled !== false,
      lastRun: j.state?.lastRunAtMs ? new Date(j.state.lastRunAtMs).toISOString() : undefined,
      nextRun: j.state?.nextRunAtMs ? new Date(j.state.nextRunAtMs).toISOString() : undefined,
      status: !j.enabled ? 'disabled' : j.state?.lastRunStatus === 'ok' ? 'idle' : j.state?.lastRunStatus === 'error' ? 'failed' : 'idle',
      isSystemCritical: j.name?.includes('report') || j.name?.includes('health') || j.name?.includes('backup')
    }));

    const total = jobs.length;
    const enabled = jobs.filter((j: any) => j.enabled).length;
    const failed = jobs.filter((j: any) => j.status === 'failed').length;
    const running = jobs.filter((j: any) => j.status === 'running').length;

    // Find next scheduled job
    const nextJob = jobs
      .filter((j: any) => j.nextRun)
      .sort((a: any, b: any) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime())[0];

    return NextResponse.json({
      jobs,
      total,
      enabled,
      stats: { total, enabled, running, failed },
      nextRun: nextJob?.nextRun || null
    });
  } catch (e: any) {
    return NextResponse.json({ 
      error: e.message, 
      jobs: [], 
      stats: { total: 0, enabled: 0, running: 0, failed: 0 } 
    }, { status: 500 });
  }
}
