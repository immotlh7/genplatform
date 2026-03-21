# GEN3 FACTORY — MASTER SYSTEM DOCUMENT
# Date: 2026-03-21
# ═══════════════════════════════════════════════════════════════
# This document fixes ALL systems and connects them together.
# Read every section before executing. Order matters.
# ═══════════════════════════════════════════════════════════════

## PROTECTED FILES — NEVER TOUCH THESE
- src/app/layout.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/navbar.tsx
- src/app/globals.css
- src/app/dashboard/self-dev/**
- src/app/api/self-dev/**
- src/components/self-dev/**

## HOW THIS SYSTEM WORKS (READ FIRST)

The Gen3 factory has 5 connected systems that must all work together:

SYSTEM 1 — STRATEGIC ROOM (/dashboard/ideas)
User writes one sentence → AI runs deep analysis using ClawHub skills →
produces a massive interactive document → user discusses and refines →
user approves → system generates tasks → project is created automatically.

SYSTEM 2 — PROJECT PIPELINE (/dashboard/projects/[id])
Shows the project's 7-stage pipeline with live data.
After idea is approved, shows real tasks, real agents, real progress.
Every change made anywhere in the system appears here live.

SYSTEM 3 — LIVE CHAT (/dashboard/chat or /dashboard/claude)
User selects a project → AI knows everything about it →
user describes a problem or requests a feature →
AI reads the code → proposes the fix → user approves →
AI executes on the server → changes appear in preview LIVE.

SYSTEM 4 — LIVE NOTIFICATIONS
Every action in the system generates a notification:
new file created, task completed, build succeeded, agent started.
These appear in the bell icon AND as a live feed in the project page.

SYSTEM 5 — AGENT SYSTEM
5 agents each with a specific role.
All run through OpenClaw Gateway (same brain, different system prompts).
Tasks are automatically routed to the correct agent based on department.

---

# ════════════════════════════════════════════════════════
# PHASE 1: FIX THE FOUNDATION FIRST
# ════════════════════════════════════════════════════════

## TASK-F1: Create the live events system (SSE)
# This is the backbone of all "live" features.
# Without this, nothing updates in real time.

### File: src/app/api/events/route.ts (CREATE)
```typescript
import { NextResponse } from 'next/server';

// In-memory event store (shared across requests in same process)
const clients = new Set<ReadableStreamDefaultController>();

// Push event to all connected clients
export function broadcastEvent(type: string, data: any) {
  const message = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
  clients.forEach(controller => {
    try { controller.enqueue(new TextEncoder().encode(message)); } catch {}
  });
}

// Also save to execution-log.json
import fs from 'fs';
import path from 'path';
const LOG_PATH = path.join(process.cwd(), 'data', 'execution-log.json');

export function logEvent(type: string, message: string, projectId?: string) {
  const entry = {
    timestamp: new Date().toISOString(),
    type,
    message,
    projectId: projectId || null
  };
  
  try {
    let log = [];
    try { log = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8')); } catch {}
    log.push(entry);
    // Keep last 500 entries
    if (log.length > 500) log = log.slice(-500);
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
  } catch {}
  
  broadcastEvent(type, { message, projectId });
}

// SSE endpoint
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      // Send initial connection message
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
    },
    cancel(controller) {
      clients.delete(controller);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
```

## TASK-F2: Create notifications store
### File: src/app/api/notifications/route.ts (CREATE)
```typescript
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const NOTIF_PATH = path.join(process.cwd(), 'data', 'notifications.json');

export async function GET() {
  try {
    const data = await fs.readFile(NOTIF_PATH, 'utf-8');
    const notifs = JSON.parse(data);
    return NextResponse.json(notifs.slice(-50)); // Last 50
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const { type, message, projectId, link } = await req.json();
  
  const notification = {
    id: Date.now().toString(),
    type, // 'task_complete' | 'file_created' | 'build_success' | 'build_fail' | 'agent_started' | 'idea_approved'
    message,
    projectId: projectId || null,
    link: link || null,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  let notifs = [];
  try { notifs = JSON.parse(await fs.readFile(NOTIF_PATH, 'utf-8')); } catch {}
  notifs.push(notification);
  if (notifs.length > 200) notifs = notifs.slice(-200);
  await fs.writeFile(NOTIF_PATH, JSON.stringify(notifs, null, 2));
  
  return NextResponse.json(notification);
}

export async function PATCH(req: Request) {
  // Mark notifications as read
  const { ids } = await req.json();
  let notifs = [];
  try { notifs = JSON.parse(await fs.readFile(NOTIF_PATH, 'utf-8')); } catch {}
  notifs = notifs.map((n: any) => ids.includes(n.id) ? { ...n, read: true } : n);
  await fs.writeFile(NOTIF_PATH, JSON.stringify(notifs, null, 2));
  return NextResponse.json({ ok: true });
}
```

## TASK-F3: Add notification helper to all API routes
### File: src/lib/notify.ts (CREATE)
```typescript
export async function notify(type: string, message: string, options?: { projectId?: string; link?: string }) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message, ...options })
    });
  } catch {}
}
```

---

# ════════════════════════════════════════════════════════
# PHASE 2: THE STRATEGIC ROOM (IDEAS SYSTEM)
# ════════════════════════════════════════════════════════

## TASK-S1: Create the deep analysis pipeline API
### File: src/app/api/ideas/analyze/route.ts (CREATE)

This chains ClawHub skills in sequence. Each skill gets the previous output as context.

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { notify } from '@/lib/notify';

const GATEWAY = 'http://127.0.0.1:18789/v1/chat/completions';
const TOKEN = 'bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df';

async function callGateway(prompt: string, maxTokens = 4000): Promise<string> {
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
    body: JSON.stringify({
      model: 'claude',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function runSkill(skillName: string, input: string, maxTokens = 4000): Promise<string> {
  return callGateway(`Use skill: ${skillName}\n\nInput:\n${input}\n\nReturn detailed structured JSON.`, maxTokens);
}

function safeJSON(text: string): any {
  try { return JSON.parse(text.replace(/```json|```/g, '').trim()); }
  catch { return { raw: text }; }
}

export async function POST(req: Request) {
  const { ideaText, ideaId } = await req.json();
  if (!ideaText?.trim()) return NextResponse.json({ error: 'No idea text' }, { status: 400 });

  try {
    await notify('analysis_started', `Analyzing: "${ideaText.slice(0, 50)}..."`, { link: '/dashboard/ideas' });

    // STAGE 1: Deep research
    const research = await runSkill('research-idea', ideaText, 3000);
    
    // STAGE 2: Market analysis with research context
    const marketInput = `Idea: ${ideaText}\n\nResearch: ${research}`;
    const market = await runSkill('product-strategy', marketInput, 3000);
    
    // STAGE 3: Strategic plan
    const stratInput = `Idea: ${ideaText}\n\nMarket: ${market}`;
    const strategy = await runSkill('product-strategist', stratInput, 3000);
    
    // STAGE 4: Feature specification
    const featInput = `Idea: ${ideaText}\n\nStrategy: ${strategy}`;
    const features = await runSkill('feature-specification', featInput, 3000);
    
    // STAGE 5: Deep idea expansion — THIS IS THE CORE STAGE
    // This stage expands the idea to its full potential
    const expansionPrompt = `
You are an expert product visionary. A user gave you this idea:
"${ideaText}"

Based on research and strategy analysis:
${strategy}

Generate a COMPLETE project vision document. Be exhaustive. No limits.

Return JSON with this exact structure:
{
  "projectName": "suggested name",
  "tagline": "one line description",
  "vision": "full vision paragraph",
  
  "coreFeatures": [
    {
      "id": "F001",
      "name": "feature name",
      "description": "detailed description of what it does",
      "userValue": "why users need this",
      "complexity": "low|medium|high",
      "impact": "low|medium|high",
      "aiTools": ["tool1", "tool2"],
      "pages": ["page1", "page2"]
    }
  ],
  
  "suggestedAdditions": [
    {
      "id": "A001", 
      "name": "addition name",
      "description": "what it adds and why it increases value",
      "inspiration": "where the idea came from (market, competitors, AI trends)",
      "impact": "high|medium|low"
    }
  ],
  
  "pages": [
    {
      "id": "P001",
      "name": "page name",
      "route": "/route",
      "purpose": "what this page does",
      "components": ["component1", "component2"],
      "dataNeeded": ["data1", "data2"],
      "aiAgents": ["agent that works on this page"],
      "wireframeDescription": "describe the layout in detail — header, sidebar, main content, cards, etc."
    }
  ],
  
  "agents": [
    {
      "name": "agent name",
      "role": "what it does in the system",
      "capabilities": ["capability1"],
      "triggers": "when it activates",
      "integrations": ["tool1", "tool2"]
    }
  ],
  
  "techStack": {
    "frontend": { "framework": "...", "why": "...", "cost": "..." },
    "backend": { "framework": "...", "why": "...", "cost": "..." },
    "database": { "type": "...", "why": "...", "cost": "..." },
    "aiModels": [{ "name": "...", "useCase": "...", "cost": "..." }],
    "externalAPIs": [{ "name": "...", "purpose": "...", "cost": "..." }],
    "infrastructure": { "hosting": "...", "cdn": "...", "cost": "..." }
  },
  
  "architecture": {
    "overview": "describe how all parts connect",
    "dataFlow": "describe how data moves through the system",
    "layers": ["layer1: ...", "layer2: ..."]
  },
  
  "financials": {
    "monthlyCosts": { "hosting": "...", "ai": "...", "apis": "...", "total": "..." },
    "revenueModel": "how the product makes money",
    "pricing": [{ "plan": "...", "price": "...", "features": ["..."] }],
    "projections": { "month3": "...", "month6": "...", "month12": "..." }
  },
  
  "competitors": [
    {
      "name": "competitor",
      "strengths": "what they do well",
      "weaknesses": "where they fall short",
      "ourAdvantage": "how we beat them"
    }
  ],
  
  "phases": [
    {
      "name": "Phase 1: MVP",
      "duration": "X weeks",
      "goal": "what we ship",
      "features": ["F001", "F002"],
      "successMetrics": ["metric1"]
    }
  ],
  
  "risks": [
    { "risk": "...", "probability": "low|medium|high", "mitigation": "..." }
  ]
}`;

    const expansion = await callGateway(expansionPrompt, 8000);
    const expandedData = safeJSON(expansion);
    
    // Save analysis
    const ideasPath = path.join(process.cwd(), 'data', 'ideas.json');
    let ideas = [];
    try { ideas = JSON.parse(await fs.readFile(ideasPath, 'utf-8')); } catch {}
    
    const ideaRecord = {
      id: ideaId || Date.now().toString(),
      ideaText,
      status: 'analyzed',
      analysis: {
        research: safeJSON(research),
        market: safeJSON(market),
        strategy: safeJSON(strategy),
        features: safeJSON(features),
        expanded: expandedData
      },
      approvedFeatures: [],
      skippedFeatures: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const idx = ideas.findIndex((i: any) => i.id === ideaRecord.id);
    if (idx >= 0) ideas[idx] = ideaRecord;
    else ideas.push(ideaRecord);
    
    await fs.writeFile(ideasPath, JSON.stringify(ideas, null, 2));
    await notify('analysis_complete', `Analysis complete: ${expandedData.projectName || 'New project'}`, { link: `/dashboard/ideas` });
    
    return NextResponse.json({ ideaId: ideaRecord.id, analysis: expandedData });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## TASK-S2: Create idea discussion API
### File: src/app/api/ideas/[id]/discuss/route.ts (CREATE)

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const GATEWAY = 'http://127.0.0.1:18789/v1/chat/completions';
const TOKEN = 'bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { message, currentAnalysis } = await req.json();
  
  const prompt = `You are managing a product analysis document. The user wants to modify it.

Current project: ${currentAnalysis?.projectName || 'Unknown'}
Current features count: ${currentAnalysis?.coreFeatures?.length || 0}

User message: "${message}"

Analyze what the user wants and return JSON:
{
  "action": "add_feature|remove_feature|add_suggestion|update_section|answer_question|regenerate_section",
  "targetId": "ID of item to modify (if applicable)",
  "newData": { ... new data if adding },
  "sectionName": "which section to update",
  "reply": "conversational reply to show the user",
  "changes": ["human readable list of what changed"]
}

Be smart about detecting intent. Arabic and English both supported.
If user says 'أضف' or 'add' → action is add_feature or add_suggestion
If user says 'احذف' or 'remove' → action is remove_feature
If user says 'غيّر' or 'change' → action is update_section`;

  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
    body: JSON.stringify({ model: 'claude', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
  });
  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || '{}';
  
  try {
    const action = JSON.parse(reply.replace(/```json|```/g, '').trim());
    
    // Apply the change to the stored idea
    const ideasPath = path.join(process.cwd(), 'data', 'ideas.json');
    let ideas = JSON.parse(await fs.readFile(ideasPath, 'utf-8'));
    const idea = ideas.find((i: any) => i.id === params.id);
    
    if (idea && action.action === 'add_feature' && action.newData) {
      idea.analysis.expanded.coreFeatures = idea.analysis.expanded.coreFeatures || [];
      idea.analysis.expanded.coreFeatures.push({ ...action.newData, id: `F${Date.now()}`, userAdded: true });
    } else if (idea && action.action === 'remove_feature' && action.targetId) {
      idea.analysis.expanded.coreFeatures = (idea.analysis.expanded.coreFeatures || [])
        .filter((f: any) => f.id !== action.targetId);
    }
    
    if (idea) {
      idea.updatedAt = new Date().toISOString();
      await fs.writeFile(ideasPath, JSON.stringify(ideas, null, 2));
    }
    
    return NextResponse.json(action);
  } catch {
    return NextResponse.json({ action: 'answer_question', reply });
  }
}
```

## TASK-S3: Create project launch from idea
### File: src/app/api/ideas/[id]/launch/route.ts (CREATE)

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { notify } from '@/lib/notify';

const GATEWAY = 'http://127.0.0.1:18789/v1/chat/completions';
const TOKEN = 'bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df';

async function callGateway(prompt: string, maxTokens = 8000): Promise<string> {
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
    body: JSON.stringify({ model: 'claude', max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { approvedFeatures, skippedFeatures } = await req.json();
  
  // Load idea
  const ideasPath = path.join(process.cwd(), 'data', 'ideas.json');
  const ideas = JSON.parse(await fs.readFile(ideasPath, 'utf-8'));
  const idea = ideas.find((i: any) => i.id === params.id);
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  
  const analysis = idea.analysis?.expanded;
  const projectName = analysis?.projectName || 'New Project';
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);
  
  await notify('project_launching', `Launching project: ${projectName}`);

  // STEP 1: Generate SPEC.md using spec-first-dev skill
  const specPrompt = `Use skill: spec-first-dev

Generate a complete SPEC.md for this project:
Project: ${projectName}
Approved Features: ${JSON.stringify(approvedFeatures)}
Tech Stack: ${JSON.stringify(analysis?.techStack)}
Architecture: ${JSON.stringify(analysis?.architecture)}
Pages: ${JSON.stringify(analysis?.pages)}

The SPEC must be detailed enough that any developer can build the entire project from it.
Include: overview, tech stack, file structure, each page (purpose + components + data),
all API endpoints, database schema, environment variables needed.`;

  const specContent = await callGateway(specPrompt, 8000);
  
  // STEP 2: Generate tasks using task-decomp skill
  const taskPrompt = `Use skill: task-decomp

Break this project into maximum granularity development tasks.
No limit on task count. Be extremely detailed.

Project SPEC:
${specContent}

Approved Features: ${JSON.stringify(approvedFeatures.map((f: any) => f.name))}
Pages to build: ${JSON.stringify(analysis?.pages?.map((p: any) => p.name))}

Return JSON array of tasks:
[{
  "id": "T001",
  "title": "task title",
  "description": "exact description of what to do",
  "department": "Frontend|Backend|Database|AI|DevOps|QA|Security",
  "priority": "critical|high|medium|low",
  "estimatedHours": 2,
  "dependencies": ["T002"],
  "acceptanceCriteria": ["criterion 1", "criterion 2"],
  "files": ["src/path/to/file.tsx"]
}]`;

  const tasksRaw = await callGateway(taskPrompt, 8000);
  
  let tasks: any[] = [];
  try {
    tasks = JSON.parse(tasksRaw.replace(/```json|```/g, '').trim());
    if (!Array.isArray(tasks)) tasks = tasks.tasks || [];
  } catch {
    // Extract from markdown
    const lines = tasksRaw.split('\n');
    tasks = lines
      .filter(l => l.match(/^[\-\*\d]/))
      .map((l, i) => ({ id: `T${String(i+1).padStart(3,'0')}`, title: l.replace(/^[\-\*\d\.\s]+/, '').trim(), department: 'Frontend', priority: 'medium', estimatedHours: 4 }));
  }
  
  const projectId = `${slug}-${Date.now()}`;
  
  // Create project record
  const newProject = {
    id: projectId,
    name: projectName,
    slug,
    description: analysis?.tagline || '',
    status: 'active',
    progress: 0,
    color: `hsl(${Math.random() * 360}, 60%, 50%)`,
    initials: projectName.slice(0, 2).toUpperCase(),
    techStack: Object.values(analysis?.techStack || {}).map((v: any) => v.framework || v).filter(Boolean),
    deployUrl: `https://${slug}.gen3.ai`,
    subdomain: slug,
    repoPath: `/root/projects/${slug}`,
    githubUrl: null,
    pipeline: {
      idea: { status: 'done', completedAt: new Date().toISOString() },
      analysis: { status: 'done', completedAt: new Date().toISOString() },
      planning: { status: 'done', completedAt: new Date().toISOString() },
      development: { status: 'active', total: tasks.length, completed: 0 },
      review: { status: 'pending' },
      security: { status: 'pending' },
      deploy: { status: 'pending', liveUrl: `https://${slug}.gen3.ai` }
    },
    agents: [],
    spec: specContent,
    createdAt: new Date().toISOString(),
    ideaId: params.id
  };
  
  // Save project
  const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
  let projects = [];
  try { projects = JSON.parse(await fs.readFile(projectsPath, 'utf-8')); } catch {}
  projects.push(newProject);
  await fs.writeFile(projectsPath, JSON.stringify(projects, null, 2));
  
  // Save tasks
  const tasksPath = path.join(process.cwd(), 'data', 'tasks.json');
  let allTasks = [];
  try { allTasks = JSON.parse(await fs.readFile(tasksPath, 'utf-8')); } catch {}
  
  const formattedTasks = tasks.map((t: any, i: number) => ({
    ...t,
    id: `${projectId}-${t.id || 'T' + String(i+1).padStart(3,'0')}`,
    projectId,
    status: 'planned',
    agentId: mapToAgent(t.department),
    createdAt: new Date().toISOString()
  }));
  
  allTasks.push(...formattedTasks);
  await fs.writeFile(tasksPath, JSON.stringify(allTasks, null, 2));
  
  // Save SPEC.md to project directory
  try {
    execSync(`mkdir -p /root/projects/${slug}`);
    require('fs').writeFileSync(`/root/projects/${slug}/SPEC.md`, specContent);
  } catch {}
  
  // Update idea status
  idea.status = 'launched';
  idea.projectId = projectId;
  await fs.writeFile(ideasPath, JSON.stringify(ideas, null, 2));
  
  await notify('project_created', `Project "${projectName}" created with ${tasks.length} tasks`, {
    projectId,
    link: `/dashboard/projects/${projectId}`
  });
  
  return NextResponse.json({ projectId, slug, taskCount: tasks.length, deployUrl: newProject.deployUrl });
}

function mapToAgent(dept: string): string {
  if (!dept) return 'main';
  const d = dept.toLowerCase();
  if (d.includes('frontend') || d.includes('ui') || d.includes('react')) return 'frontend-dev';
  if (d.includes('backend') || d.includes('api') || d.includes('server') || d.includes('database')) return 'backend-dev';
  return 'main';
}
```

## TASK-S4: Rebuild Ideas page — THE STRATEGIC ROOM
### File: src/app/dashboard/ideas/page.tsx (FULL REBUILD)

The page has 3 states:
STATE 1: Empty — shows textarea to enter idea
STATE 2: Analyzing — shows progress bar through 4 stages  
STATE 3: Analysis ready — shows the full interactive document

Key behaviors:
- Each section (Research, Market, Features, Tech Stack, etc.) is COLLAPSIBLE
- Feature cards have KEEP / SKIP toggle buttons
- Suggested additions have ADD / SKIP buttons
- Discussion box at bottom — user types changes, system updates sections
- LAUNCH PROJECT button appears only when at least 1 feature is kept
- After launch: redirect to /dashboard/projects/[id]

Build this component with these sections displayed in order:
1. Project name + tagline (editable inline)
2. Vision paragraph (collapsible)
3. Market opportunity (TAM/SAM/SOM as 3 stat cards)
4. Competitive analysis (table: Competitor | Strength | Weakness | Our Edge)
5. Core features (interactive cards with Keep/Skip)
6. AI-suggested additions (cards with Add/Skip)
7. Pages & structure (list: route + purpose + wireframe description)
8. Agents (list: name + role + triggers)
9. Tech stack (table per layer)
10. Financial projection (3-column: Month 1-3, 4-6, 7-12)
11. Phases (timeline: Phase 1 MVP, Phase 2 Growth, Phase 3 Scale)
12. Risks (table: Risk | Probability | Mitigation)

At the bottom:
- Discussion chat box (send messages to /api/ideas/[id]/discuss)
- [Save Draft] button
- [Launch Project →] button (calls /api/ideas/[id]/launch)

When Launch is clicked, show modal:
"Creating project [Name] with [X] tasks. This will:
→ Generate full SPEC.md  
→ Create [X] development tasks
→ Assign tasks to specialized agents
→ Set up project at [slug].gen3.ai
[Confirm Launch] [Cancel]"

---

# ════════════════════════════════════════════════════════
# PHASE 3: FIX LIVE CHAT — REAL EXECUTION
# ════════════════════════════════════════════════════════

## TASK-C1: Fix chat send API to show streaming response
### File: src/app/api/chat/send/route.ts (UPDATE)

The current issue: response comes back but UI shows "processing..." forever.
Fix: read the response correctly from OpenClaw Gateway format.

Read the current file first:
```bash
cat /root/genplatform/src/app/api/chat/send/route.ts
```

Then find where the response content is extracted.
The OpenClaw gateway returns: `data.choices[0].message.content`
Make sure this exact path is being read and returned as `{ reply: string }`.

Also add project context to every message. When projectId is provided:
1. Load project from data/projects.json
2. Load last 10 tasks from data/tasks.json
3. Include in system prompt:
   - Project name, repo path, deploy URL
   - Current phase and progress
   - List of protected files
   - Last 10 tasks (completed and in-progress)

## TASK-C2: Fix chat UI — show response and live updates
### File: src/app/dashboard/chat/page.tsx (UPDATE)
OR: src/app/dashboard/claude/page.tsx (whichever is the working chat)

First find the working chat:
```bash
grep -rn "OpenClaw\|split.*view\|LivePreview" /root/genplatform/src/app/dashboard/ --include="*.tsx" -l
```

In that file, find the sendMessage function.
Fix it to:
1. Show "thinking..." immediately when message is sent
2. After getting reply, show it in the chat
3. If reply contains code blocks, render them with monospace font
4. If reply contains "Applied changes" or "Build OK" → trigger preview refresh
5. Connect to SSE (/api/events) to receive live updates:
   - When a file is modified → show notification in chat
   - When build completes → refresh preview panel
   - When task completes → show in chat

## TASK-C3: Make Live Preview actually refresh
### In the LivePreviewPanel component:

The iframe must refresh automatically when changes are deployed.
Add this logic:

```typescript
// Connect to SSE
useEffect(() => {
  const es = new EventSource('/api/events');
  es.onmessage = (e) => {
    const event = JSON.parse(e.data);
    if (event.type === 'build_success' || event.type === 'app_restarted') {
      // Add timestamp param to force iframe refresh
      setPreviewKey(Date.now());
    }
  };
  return () => es.close();
}, []);

// Use key to force refresh
<iframe key={previewKey} src={project?.deployUrl} ... />
```

## TASK-C4: Remove the broken old Chat page
```bash
# Find which chat is broken (no split view, no project selector)
# Check the sidebar link
grep -n "chat\|Chat" /root/genplatform/src/components/layout/sidebar.tsx

# The broken one is the simple /dashboard/chat
# Replace with redirect to working chat
cat > /root/genplatform/src/app/dashboard/chat/page.tsx << 'REDIRECT'
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function OldChatRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/claude'); }, []);
  return <div style={{padding: 24, fontSize: 13, color: 'var(--color-text-secondary)'}}>Redirecting...</div>;
}
REDIRECT
```

---

# ════════════════════════════════════════════════════════
# PHASE 4: LIVE NOTIFICATIONS IN PROJECT PAGE
# ════════════════════════════════════════════════════════

## TASK-N1: Add live activity feed to project pipeline page
### In src/components/projects/ProjectDetailPage.tsx

Add a useEffect that connects to SSE and listens for events related to this project:

```typescript
useEffect(() => {
  const es = new EventSource('/api/events');
  es.onmessage = (e) => {
    const event = JSON.parse(e.data);
    
    // Only handle events for this project
    if (event.data?.projectId && event.data.projectId !== projectId) return;
    
    // Add to live log
    setLiveLog(prev => [{
      time: new Date().toLocaleTimeString('en', { hour12: false }),
      message: event.data?.message || event.type,
      type: event.type
    }, ...prev].slice(0, 20));
    
    // Refresh task counts if a task was completed
    if (event.type === 'task_complete') {
      fetch(`/api/projects/${projectId}/tasks`)
        .then(r => r.json())
        .then(tasks => {
          const completed = tasks.filter((t: any) => t.status === 'done').length;
          setProject(p => ({ ...p, pipeline: { ...p.pipeline, development: { ...p.pipeline.development, completed } } }));
        });
    }
  };
  return () => es.close();
}, [projectId]);
```

## TASK-N2: Show new files in Files tab when added
### In src/components/projects/FilesView

Add SSE listener:
```typescript
useEffect(() => {
  const es = new EventSource('/api/events');
  es.onmessage = (e) => {
    const event = JSON.parse(e.data);
    if (event.type === 'file_created' || event.type === 'file_modified') {
      // Reload current directory
      loadFiles(currentPath);
    }
  };
  return () => es.close();
}, [currentPath]);
```

## TASK-N3: Add broadcast calls in chat execution
### In src/app/api/chat/send/route.ts

After executing code that modifies files:
```typescript
import { logEvent } from '@/app/api/events/route';

// After write_file tool executes:
logEvent('file_modified', `Modified: ${filePath}`, projectId);

// After build succeeds:
logEvent('build_success', 'Build OK — app restarted', projectId);

// After build fails:
logEvent('build_fail', `Build failed: ${errorSummary}`, projectId);
```

---

# ════════════════════════════════════════════════════════
# PHASE 5: AGENT SYSTEM SETUP
# ════════════════════════════════════════════════════════

## TASK-A1: Register agents in OpenClaw
```bash
# Check syntax first
openclaw agents add --help

# Add the 3 specialized agents
openclaw agents add --name "frontend-dev" --description "Specialist: Next.js, React, Tailwind, UI components only. Never touches backend files."
openclaw agents add --name "backend-dev" --description "Specialist: APIs, Node.js, Express, data files only. Never touches UI components."
openclaw agents add --name "improvement-agent" --description "Daily analyst: reads all projects, suggests improvements. Never executes code."

# Verify
openclaw agents list
```

## TASK-A2: Create LESSONS.md
```bash
mkdir -p ~/.openclaw/workspace/memory

cat > ~/.openclaw/workspace/memory/LESSONS.md << 'EOF'
# LESSONS — Read at start of EVERY task

## Always read before writing
Use bash: cat [file] before modifying anything. Never guess content.

## Build after every change  
cd /root/genplatform && npm run build
If build fails: restore file, try different approach.

## Protected files — ABSOLUTE RULE
NEVER touch: sidebar.tsx, navbar.tsx, layout.tsx, globals.css, self-dev/**

## Check imports
New component = must be imported in parent file.

## pm2 restart after build
pm2 restart genplatform-app
Without this, changes don't appear on live site.

## JSON validation
python3 -c "import json; json.load(open('FILE'))" after editing any .json

## Report every file changed
After every modification, log: "[TIME] Modified: [filepath]"
EOF
echo "LESSONS.md created"
```

---

# ════════════════════════════════════════════════════════
# PHASE 6: CLEANUP
# ════════════════════════════════════════════════════════

## TASK-CL1: Find and remove duplicate/broken pages
```bash
# List all dashboard pages
ls /root/genplatform/src/app/dashboard/

# Check which chat page is working
cat /root/genplatform/src/app/dashboard/chat/page.tsx | head -5
cat /root/genplatform/src/app/dashboard/claude/page.tsx | head -5

# Check for Invoices page (not in original design)
ls /root/genplatform/src/app/dashboard/invoices/ 2>/dev/null && echo "Invoices page exists"

# Report findings to Telegram before removing anything
```

## TASK-CL2: Verify all sidebar links work
For each item in sidebar, test that the page loads without errors:
- /dashboard → loads with real data
- /dashboard/projects → shows all projects
- /dashboard/chat (or /claude) → shows split view chat
- /dashboard/ideas → shows strategic room
- /dashboard/agents → shows 5 agents
- /dashboard/memory → loads
- /dashboard/self-dev → loads (PROTECTED, don't modify)

Report any that show errors.

---

# ════════════════════════════════════════════════════════
# EXECUTION ORDER — FOLLOW EXACTLY
# ════════════════════════════════════════════════════════

## STEP 1 — Foundation (no build needed)
- TASK-A2: Create LESSONS.md
- TASK-A1: Register agents in OpenClaw
- TASK-F1: Create /api/events/route.ts
- TASK-F2: Create /api/notifications/route.ts
- TASK-F3: Create /lib/notify.ts
Run: npm run build → fix any errors → continue

## STEP 2 — Chat fix (most urgent)
- TASK-C4: Remove broken old chat
- TASK-C1: Fix chat send API
- TASK-C2: Fix chat UI response display
- TASK-C3: Make preview refresh automatically
Run: npm run build && pm2 restart genplatform-app
TEST: Open chat, type "اقرأ ملف package.json" → must show content

## STEP 3 — Strategic Room
- TASK-S1: Create /api/ideas/analyze/route.ts
- TASK-S2: Create /api/ideas/[id]/discuss/route.ts
- TASK-S3: Create /api/ideas/[id]/launch/route.ts
- TASK-S4: Rebuild ideas page
Run: npm run build && pm2 restart genplatform-app
TEST: Go to /dashboard/ideas → type idea → analysis must appear

## STEP 4 — Live notifications
- TASK-N1: Add SSE to project pipeline
- TASK-N2: Add SSE to Files tab
- TASK-N3: Add broadcast in chat execution
Run: npm run build && pm2 restart genplatform-app

## STEP 5 — Cleanup
- TASK-CL1: Find and remove duplicates
- TASK-CL2: Verify all pages
Final build + restart

---

# FINAL VERIFICATION CHECKLIST
Send results of each test to Telegram:

[ ] Chat reads files: type "اقرأ package.json" → shows content
[ ] Chat executes: type "add a comment to src/app/dashboard/page.tsx line 1" → applies change
[ ] Chat preview refreshes after change
[ ] Ideas page: type idea → shows full analysis with all sections
[ ] Feature cards: Keep/Skip buttons work
[ ] Discussion: type "أضف ميزة X" → feature appears
[ ] Launch: click Launch → tasks generate → redirect to project
[ ] Project pipeline: shows real task counts
[ ] Live log: updates when tasks execute
[ ] Notifications: appear in bell icon
[ ] Files tab: shows real project files (not raw JSON)
[ ] Agents page: shows 5 agents with status
