import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';
    const [statusRes, healthRes] = await Promise.all([
      fetch(`${BRIDGE_URL}/api/status`, { cache: 'no-store' }).catch(() => null),
      fetch(`${BRIDGE_URL}/api/health`, { cache: 'no-store' }).catch(() => null)
    ]);
    
    const status = statusRes ? await statusRes.json() : {};
    const health = healthRes ? await healthRes.json() : {};

    return NextResponse.json({
      currentTask: {
        number: 'Sprint 3',
        name: 'Connecting real data to all pages',
        stage: 'building'
      },
      currentAction: 'running',
      sprint: { name: 'Sprint 3', id: 'sprint-3' },
      project: { name: 'GenPlatform.ai', id: 'genplatform-main' },
      team: { status: 'active', action: 'Coding • Building' },
      uptime: health.uptime || 0,
      tokensUsed: 15400,
      status: 'active',
      gateway: status.gateway || {},
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', error: e.message }, { status: 500 });
  }
}
