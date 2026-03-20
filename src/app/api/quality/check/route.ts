import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { type = 'build' } = await request.json();
    const results: Record<string, any> = {};

    if (type === 'build' || type === 'all') {
      try {
        const { stdout } = await execAsync('cd /root/genplatform && npm run build 2>&1 | tail -5', { timeout: 180000 });
        results.build = { passed: stdout.includes('✓') || stdout.includes('Compiled'), output: stdout.substring(0, 200) };
      } catch (e: any) {
        results.build = { passed: false, output: e.message.substring(0, 200) };
      }
    }

    if (type === 'pm2' || type === 'all') {
      try {
        const { stdout } = await execAsync('pm2 jlist 2>/dev/null');
        const procs = JSON.parse(stdout);
        const app = procs.find((p: any) => p.name === 'genplatform-app');
        results.pm2 = { passed: app?.pm2_env?.status === 'online', status: app?.pm2_env?.status };
      } catch {
        results.pm2 = { passed: false };
      }
    }

    const allPassed = Object.values(results).every((r: any) => r.passed);

    return NextResponse.json({ passed: allPassed, results, checkedAt: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ passed: false, error: error.message }, { status: 500 });
  }
}
