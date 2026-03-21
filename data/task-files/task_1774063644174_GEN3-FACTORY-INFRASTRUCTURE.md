# GEN3 FACTORY — COMPLETE INFRASTRUCTURE SETUP
# Date: 2026-03-21
# ═══════════════════════════════════════════════════════════════
# PROTECTED: sidebar.tsx, navbar.tsx, layout.tsx, globals.css, self-dev/**
# BUILD after every task. Report via Telegram after every task.
# ═══════════════════════════════════════════════════════════════

---

# ════════════════════════════════════════════════════════
# PART 1: CREATE THE 3 SPECIALIZED AGENTS IN OPENCLAW
# ════════════════════════════════════════════════════════

## TASK-1: Add specialized agents to OpenClaw

Run these commands on the server:

```bash
# Agent 1: Frontend Developer
openclaw agents add \
  --name "frontend-dev" \
  --emoji "🖥️" \
  --description "Frontend specialist — Next.js, React, Tailwind, UI components"

# Agent 2: Backend Developer  
openclaw agents add \
  --name "backend-dev" \
  --emoji "⚙️" \
  --description "Backend specialist — APIs, Node.js, Express, databases"

# Agent 3: Improvement Agent
openclaw agents add \
  --name "improvement-agent" \
  --emoji "🧠" \
  --description "Daily improvement analyst — suggests features and optimizations"
```

If the above syntax fails, check the correct syntax with:
```bash
openclaw agents add --help
```

Then verify all agents exist:
```bash
openclaw agents list
```

---

# TASK-2: Configure agent system prompts in OpenClaw config

Read the current config:
```bash
cat ~/.openclaw/openclaw.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('agents',{}), indent=2))"
```

Then update the agents section to add specialized agents with system prompts.
Use python to update the config safely:

```bash
python3 << 'EOF'
import json

with open('/root/.openclaw/openclaw.json', 'r') as f:
    config = json.load(f)

# Keep existing defaults, add specialized agents
if 'agents' not in config:
    config['agents'] = {}

config['agents']['list'] = [
    {
        "id": "frontend-dev",
        "name": "Frontend Dev",
        "emoji": "🖥️",
        "systemPrompt": """You are a specialized Frontend Developer agent for the Gen3 factory.
YOUR SCOPE: Only Next.js, React, TypeScript, Tailwind CSS, shadcn/ui components.
YOUR RULES:
- Only modify files in src/app/ and src/components/ (except layout.tsx, sidebar.tsx, navbar.tsx, globals.css)
- Never touch API routes, server files, or backend code
- Always run npm run build after changes
- Always restart genplatform-app via pm2 after successful build
- Report every file you modify
PROTECTED FILES YOU NEVER TOUCH: sidebar.tsx, navbar.tsx, layout.tsx, globals.css, self-dev/**"""
    },
    {
        "id": "backend-dev", 
        "name": "Backend Dev",
        "emoji": "⚙️",
        "systemPrompt": """You are a specialized Backend Developer agent for the Gen3 factory.
YOUR SCOPE: Only API routes, Express.js, Bridge API, data files, server logic.
YOUR RULES:
- Only modify files in src/app/api/, genplatform-api/, data/ (json files)
- Never touch frontend components or UI files
- Always validate JSON files after modifying them
- Always restart bridge-api via pm2 after changes to genplatform-api
- Always restart genplatform-app via pm2 after changes to Next.js API routes
- Report every file you modify
PROTECTED FILES YOU NEVER TOUCH: sidebar.tsx, navbar.tsx, layout.tsx, globals.css, self-dev/**"""
    },
    {
        "id": "improvement-agent",
        "name": "Improvement Agent", 
        "emoji": "🧠",
        "systemPrompt": """You are the daily improvement analyst for the Gen3 factory.
YOUR SCOPE: Analyze all projects, suggest improvements, never execute code directly.
YOUR RULES:
- Run once per day (triggered by cron job at 9am)
- Read all projects from /root/genplatform/data/projects.json
- For each active project, analyze: current state, missing features, user value opportunities
- Write suggestions to /root/genplatform/data/improvements.json
- Send a summary to Telegram after analysis
- Never modify source code — only write to improvements.json
- Suggestions must include: title, description, impact (high/medium/low), effort estimate, suggested tasks"""
    }
]

with open('/root/.openclaw/openclaw.json', 'w') as f:
    json.dump(config, f, indent=2)

print("Agents configured successfully")
EOF
```

Then restart OpenClaw gateway:
```bash
systemctl --user restart openclaw-gateway
sleep 3
openclaw gateway status 2>&1 | grep "Runtime"
```

---

# ════════════════════════════════════════════════════════
# PART 2: ADD AGENTS MANAGEMENT PAGE TO THE DASHBOARD
# ════════════════════════════════════════════════════════

## TASK-3: Create Agents API

Create file src/app/api/agents/route.ts:

```typescript
import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const AGENTS_DATA_PATH = path.join(process.cwd(), 'data', 'agents-status.json');

// Default agents definition
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
    // Get real OpenClaw agents
    let openclawAgents: any[] = [];
    try {
      const result = execSync('openclaw agents list 2>/dev/null', { encoding: 'utf-8' });
      // Parse the output if it's JSON
      try { openclawAgents = JSON.parse(result); } catch {}
    } catch {}

    // Get PM2 processes for watchdog status
    let pm2Processes: any[] = [];
    try {
      const pm2Result = execSync('pm2 jlist 2>/dev/null', { encoding: 'utf-8' });
      pm2Processes = JSON.parse(pm2Result);
    } catch {}

    // Load saved status
    let savedStatus: any = {};
    try {
      const data = await fs.readFile(AGENTS_DATA_PATH, 'utf-8');
      savedStatus = JSON.parse(data);
    } catch {}

    // Merge defaults with saved status
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

  // Save agent status update
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
```

## TASK-4: Create Agents Dashboard Page

Create file src/app/dashboard/agents/page.tsx:

```tsx
'use client';
import { useState, useEffect } from 'react';

const STATUS_COLORS: Record<string, string> = {
  active: '#1D9E75',
  idle: 'var(--color-text-secondary)',
  scheduled: '#185FA5',
  error: '#E24B4A'
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  idle: 'Idle',
  scheduled: 'Scheduled',
  error: 'Error'
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      setAgents(await res.json());
    } catch {}
    setLoading(false);
  };

  const activeCount = agents.filter(a => a.status === 'active').length;
  const idleCount = agents.filter(a => a.status === 'idle').length;

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 6px' }}>AI Agents</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
          {activeCount} active · {idleCount} idle · {agents.length} total
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total agents', value: agents.length, color: 'var(--color-text-primary)' },
          { label: 'Active now', value: activeCount, color: '#1D9E75' },
          { label: 'Tasks done today', value: agents.reduce((s, a) => s + (a.tasksCompleted || 0), 0), color: '#185FA5' }
        ].map(stat => (
          <div key={stat.label} style={{
            padding: 16, borderRadius: 12,
            border: '0.5px solid var(--color-border-tertiary)',
            background: 'var(--color-background-secondary)'
          }}>
            <div style={{ fontSize: 28, fontWeight: 500, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Agents list */}
      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading agents...</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {agents.map(agent => (
            <div key={agent.id} style={{
              padding: 16, borderRadius: 12,
              border: `0.5px solid ${agent.status === 'active' ? '#1D9E75' : 'var(--color-border-tertiary)'}`,
              background: 'var(--color-background-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Status dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: 4, marginTop: 4,
                    background: STATUS_COLORS[agent.status] || 'var(--color-text-secondary)'
                  }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{agent.emoji}</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{agent.name}</span>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 4,
                        background: agent.status === 'active' ? 'rgba(29,158,117,0.15)' :
                                   agent.status === 'scheduled' ? 'rgba(24,95,165,0.15)' : 'var(--color-background-primary)',
                        color: STATUS_COLORS[agent.status],
                        border: `0.5px solid ${STATUS_COLORS[agent.status]}`
                      }}>
                        {STATUS_LABELS[agent.status]}
                      </span>
                      {agent.isProtected && (
                        <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', padding: '2px 6px',
                                       border: '0.5px solid var(--color-border-tertiary)', borderRadius: 4 }}>
                          system
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                      {agent.role}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2, opacity: 0.7 }}>
                      Scope: {agent.scope}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {agent.tasksCompleted > 0 && (
                    <div>{agent.tasksCompleted} tasks done</div>
                  )}
                  {agent.schedule && (
                    <div style={{ marginTop: 4, color: '#185FA5' }}>cron: {agent.schedule}</div>
                  )}
                </div>
              </div>

              {/* Current task */}
              {agent.currentTask && (
                <div style={{
                  marginTop: 12, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(29,158,117,0.08)',
                  border: '0.5px solid rgba(29,158,117,0.2)',
                  fontSize: 12, color: '#1D9E75'
                }}>
                  Working on: {agent.currentTask}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* How agents work info */}
      <div style={{
        marginTop: 24, padding: 16, borderRadius: 12,
        border: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-secondary)'
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 500, margin: '0 0 10px' }}>How agents work</h3>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          All agents run through OpenClaw Gateway on port 18789 — same brain, different system prompts.
          When you send a message in Chat, the Main Agent handles it. Specialized agents are assigned
          specific tasks automatically based on their scope. The Improvement Agent runs daily at 9am
          and writes suggestions to the Improvements tab in each project.
        </div>
      </div>
    </div>
  );
}
```

---

# ════════════════════════════════════════════════════════
# PART 3: FIX ALL SYSTEM CONNECTIONS
# ════════════════════════════════════════════════════════

## TASK-5: Fix chat response display (the "processing forever" bug)

Read src/app/dashboard/chat/page.tsx and find where the response is read.
The issue is likely that the response from OpenClaw Gateway uses a different
field name than expected.

Check what field the gateway returns:
```bash
curl -s -X POST http://127.0.0.1:18789/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df" \
  -d '{"model":"claude","messages":[{"role":"user","content":"say: test"}],"max_tokens":50}' \
  | python3 -m json.tool
```

Then in src/app/api/chat/send/route.ts, make sure the response is read correctly:
- For standard OpenAI-compatible format: `data.choices[0].message.content`
- Also handle errors gracefully: if gateway is down, return helpful error message

Fix the response parsing and make sure it returns `{ reply: string }` always.

## TASK-6: Fix project context in chat

When a project is selected in the Chat dropdown, the system prompt sent to OpenClaw
must include the full project context. 

Read src/app/api/chat/send/route.ts and find where systemPrompt is built.
Update it to:
1. Accept projectId in the request body
2. Load project data from data/projects.json
3. Load recent tasks from data/tasks.json (last 10 for that project)
4. Include repoPath, deployUrl, techStack in the system prompt
5. Include list of protected files

This makes the agent aware of exactly which project it's working on.

## TASK-7: Fix streaming — show response as it comes

Currently chat waits for full response before showing. 
Update to use streaming from OpenClaw Gateway:

In src/app/api/chat/send/route.ts, add stream: true to the gateway request.
In src/app/dashboard/chat/page.tsx, read the stream and append to message as it arrives.

This will make the chat feel live instead of frozen while waiting.

---

# ════════════════════════════════════════════════════════
# PART 4: CONNECT ALL DATA — LIVE SYSTEM
# ════════════════════════════════════════════════════════

## TASK-8: Make execution log live in project pipeline

Currently the Live Execution Log in the project pipeline shows hardcoded data.
Fix it to read from /root/genplatform/data/execution-log.json in real time.

Create src/app/api/projects/[id]/execution-log/route.ts:
- Read the last 20 entries from data/execution-log.json
- Filter entries relevant to this project if projectId is in the entry
- Return sorted by timestamp descending

In the pipeline component, poll this endpoint every 5 seconds to update the log.

## TASK-9: Connect tasks count to real data

In the project pipeline stats row (Total tasks, Completed, In Progress):
- Fetch from /api/projects/[id]/tasks
- Count by status: done, in_progress, planned
- Update the pipeline development stage data accordingly

## TASK-10: Add project to agents routing

When a task is created for a project and assigned to a department:
- Frontend tasks → route to frontend-dev agent (x-openclaw-agent-id: frontend-dev)
- Backend tasks → route to backend-dev agent (x-openclaw-agent-id: backend-dev)  
- Analysis tasks → route to main agent

Update the task execution in self-dev system to use the correct agent ID
based on the task department.

---

# ════════════════════════════════════════════════════════
# PART 5: LESSONS SYSTEM — AGENT LEARNS FROM MISTAKES
# ════════════════════════════════════════════════════════

## TASK-11: Create lessons memory system

Create the file if it doesn't exist:
```bash
cat > ~/.openclaw/workspace/memory/LESSONS.md << 'EOF'
# Agent Lessons — Learned from Experience
# Updated automatically after each failed task
# Read this at the START of every new task session

## Rule: Always read before writing
Never modify a file without reading it first.
Use read_file tool, understand the full context, then write.

## Rule: Build after every change
After modifying ANY .tsx or .ts file, always run:
cd /root/genplatform && npm run build
If build fails, restore the file and try a different approach.

## Rule: Protected files are sacred
NEVER modify: sidebar.tsx, navbar.tsx, layout.tsx, globals.css, self-dev/**
These files must not be touched even if the user asks.

## Rule: Check imports
When creating a new component, verify it is properly imported
in the file that uses it. Missing imports cause "is not defined" errors.

## Rule: JSON files need valid syntax
After writing any .json file, validate with:
python3 -c "import json; json.load(open('FILE'))" 
Invalid JSON breaks the entire application.

## Rule: pm2 restart after build
After successful npm run build, always run:
pm2 restart genplatform-app
Otherwise the live site won't reflect the changes.
EOF
echo "Lessons file created"
```

## TASK-12: Auto-update lessons on task failure

In the self-dev execution system, after any failed task add this logic:
Read the error message, append a new lesson to LESSONS.md in this format:
```
## Lesson [DATE]: [Short title]
Failed: [what was attempted]
Error: [error message summary]
Fix: [what to do instead]
```

Also add to the start of every system prompt sent to OpenClaw:
"Before starting, read ~/.openclaw/workspace/memory/LESSONS.md and apply all lessons."

---

# ════════════════════════════════════════════════════════
# EXECUTION ORDER
# ════════════════════════════════════════════════════════

Execute in this exact order:
1. TASK-1: Add agents to OpenClaw (bash commands)
2. TASK-2: Configure agent system prompts (python script)
3. TASK-11: Create LESSONS.md (bash)
4. TASK-3: Create /api/agents/route.ts
5. TASK-4: Create /dashboard/agents/page.tsx
6. TASK-5: Fix chat response display
7. TASK-6: Fix project context in chat
8. TASK-7: Add streaming to chat
9. TASK-8: Live execution log
10. TASK-9: Real task counts
11. TASK-10: Agent routing by department
12. TASK-12: Auto-update lessons on failure

After tasks 1-3: restart openclaw gateway
After tasks 4-12: npm run build && pm2 restart genplatform-app bridge-api

## FINAL VERIFICATION
After everything is complete, verify the system:

```bash
# 1. Agents are registered
openclaw agents list

# 2. Gateway is running with agents
openclaw gateway status 2>&1 | grep "agent model"

# 3. Chat API connects to gateway
curl -s -X POST http://localhost:3000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message":"list the files in src/app/dashboard/","projectId":"genplatform-ai"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('reply','')[:200])"

# 4. Agents page loads
curl -s http://localhost:3000/api/agents | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d), 'agents found')"
```

Send results to Telegram. Expected:
- 3+ agents in openclaw list
- /api/agents returns 5 agents
- Chat reads files and responds with real content
- Build passes, site online
