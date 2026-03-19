import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';
    const [statusRes, healthRes] = await Promise.all([
      fetch(`${BRIDGE_URL}/api/status`, { cache: 'no-store' }),
      fetch(`${BRIDGE_URL}/api/health`, { cache: 'no-store' })
    ]);
    const status = await statusRes.json();
    const health = await healthRes.json();

    // Transform to format monitoring page expects
    const services = [
      {
        name: 'OpenClaw Gateway',
        status: health.status === 'ok' ? 'active' : 'inactive',
        uptime: health.uptime || 0,
        model: status.gateway?.model || 'unknown',
        version: status.gateway?.version || 'unknown'
      },
      {
        name: 'Telegram Bot',
        status: status.telegram?.enabled ? 'active' : 'inactive',
        uptime: health.uptime || 0
      },
      {
        name: 'Bridge API',
        status: 'active',
        uptime: health.uptime || 0,
        version: health.version || '1.0.0'
      },
      {
        name: 'Next.js Frontend',
        status: 'active',
        uptime: process.uptime()
      }
    ];

    return NextResponse.json({
      ...status,
      services,
      health
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, services: [] }, { status: 500 });
  }
}
