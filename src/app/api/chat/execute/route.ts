import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const ALLOWED_COMMANDS = ['npm run build', 'pm2 status', 'pm2 logs', 'git log', 'git status', 'ls', 'cat'];
const BLOCKED = ['rm -rf', 'DROP', 'format', '> /dev/null && rm'];

export async function POST(req: NextRequest) {
  try {
    const { command, cwd = '/root/genplatform', projectId } = await req.json();

    // Safety checks
    for (const blocked of BLOCKED) {
      if (command?.toLowerCase().includes(blocked.toLowerCase())) {
        return NextResponse.json({ error: `Blocked command: ${blocked}`, output: '' }, { status: 403 });
      }
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: 60000,
      env: { ...process.env, PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' }
    });

    return NextResponse.json({ success: true, output: (stdout + stderr).substring(0, 2000) });
  } catch (e: any) {
    return NextResponse.json({ success: false, output: e.message?.substring(0, 500) || 'Command failed' });
  }
}
