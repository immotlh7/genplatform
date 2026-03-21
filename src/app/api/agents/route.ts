import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const AGENTS_DATA_PATH = path.join(process.cwd(), 'data', 'agents-status.json');

const DEFAULT_AGENTS = [
  {
    id: 'main',
    name: 'Main Agent',
    emoji: '🤖',
    status: 'active',
    role: 'General purpose — handles all requests from Chat',
    scope: 'Everything',
    currentTask: null,
    tasksCompleted: 0,
    isProtected: true
  },
  {
    id: 'frontend-dev',
    name: 'Frontend Dev',
    emoji: '🖥️',
    status: 'idle',
    role: 'Next.js, React, Tailwind, UI components only',
    scope: 'src/app/, src/components/ (no protected files)',
    currentTask: null,
    tasksCompleted: 0,
    isProtected: false
  },
  {
    id: 'backend-dev',
    name: 'Backend Dev',
    emoji: '⚙️',
    status: 'idle',
    role: 'APIs, Express, data files, server logic only',
    scope: 'src/app/api/, genplatform-api/, data/',
    currentTask: null,
    tasksCompleted: 0,
    isProtected: false
  },
  {
    id: 'improvement-agent',
    name: 'Improvement Agent',
    emoji: '🧠',
    status: 'scheduled',
    role: 'Daily analysis — suggests improvements for all projects',
    scope: 'Read-only analysis, writes to improvements.json',
    currentTask: null,
    tasksCompleted: 0,
    schedule: '0 9 * * *',
    isProtected: false
  },
  {
    id: 'watchdog',
    name: 'Watchdog',
    emoji: '👁️',
    status: 'active',
    role: 'Monitors system health, restarts failed processes',
    scope: 'PM2 process monitoring',
    currentTask: 'Monitoring all processes',
    tasksCompleted: 0,
    isProtected: true
  }
];

export async function GET() {
  try {
    let pm2Processes: any[] = [];
    try {
      const pm2Result = execSync('pm2 jlist 2>/dev/null', { encoding: 'utf-8', timeout: 5000 });
      pm2Processes = JSON.parse(pm2Result);
    } catch {}

    let savedStatus: any = {};
    try {
      const data = await fs.readFile(AGENTS_DATA_PATH, 'utf-8');
      savedStatus = JSON.parse(data);
    } catch {}

    const agents = DEFAULT_AGENTS.map(agent => ({
      ...agent,
      ...(savedStatus[agent.id] || {}),
      pm2Status: agent.id === 'watchdog'
        ? (pm2Processes.find((p: any) => p.name === 'bridge-api')?.pm2_env?.status || 'unknown')
        : undefined
    }));

    return NextResponse.json(agents);
  } catch (error: any) {
    return NextResponse.json(DEFAULT_AGENTS);
  }
}

export async function POST(req: Request) {
  const { agentId, action, task } = await req.json();

  let savedStatus: any = {};
  try {
    const data = await fs.readFile(AGENTS_DATA_PATH, 'utf-8');
    savedStatus = JSON.parse(data);
  } catch {}

  if (action === 'assign_task') {
    savedStatus[agentId] = {
      ...savedStatus[agentId],
      status: 'active',
      currentTask: task,
      lastAssigned: new Date().toISOString()
    };
  } else if (action === 'complete_task') {
    savedStatus[agentId] = {
      ...savedStatus[agentId],
      status: 'idle',
      currentTask: null,
      tasksCompleted: (savedStatus[agentId]?.tasksCompleted || 0) + 1,
      lastCompleted: new Date().toISOString()
    };
  }

  await fs.mkdir(path.dirname(AGENTS_DATA_PATH), { recursive: true });
  await fs.writeFile(AGENTS_DATA_PATH, JSON.stringify(savedStatus, null, 2));

  return NextResponse.json({ ok: true });
}
