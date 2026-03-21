# GENPLATFORM FACTORY SYSTEM — COMPLETE BUILD
# Date: 2026-03-21
# ═══════════════════════════════════════════════════════════════
# PROTECTED: sidebar.tsx, navbar.tsx, layout.tsx, globals.css, self-dev/**
# BUILD after every task. Report via Telegram after every task.
# ═══════════════════════════════════════════════════════════════

---

# ════════════════════════════════════════════════════════
# TASK-1: CREATE PIPELINE CONTENT DATABASE
# ════════════════════════════════════════════════════════
# The pipeline stages need real content so clicking each shows details.

Run this on server:
```bash
cat > /root/genplatform/data/pipeline-content.json << 'EOF'
{
  "genplatform-ai": {
    "idea": {
      "status": "done",
      "completedAt": "2026-03-18",
      "title": "GenPlatform.ai — Mission Control for AI Development",
      "originalIdea": "بناء منصة متكاملة للتحكم في وكلاء الذكاء الاصطناعي وأتمتة تطوير المشاريع. المنصة تحول الأفكار إلى مشاريع احترافية عبر pipeline ذكي يشمل التحليل، التخطيط، التطوير، المراجعة، والنشر.",
      "problemSolved": "لا توجد أداة متكاملة تجمع بين إدارة المشاريع + تنفيذ AI agents + تتبع التقدم في مكان واحد",
      "targetAudience": ["AI developers", "Tech entrepreneurs", "Automation engineers"],
      "valueProposition": "من فكرة بسيطة إلى مشروع منشور — كل شيء في مكان واحد بدعم كامل من الذكاء الاصطناعي"
    },
    "analysis": {
      "status": "done",
      "completedAt": "2026-03-18",
      "marketAnalysis": {
        "marketSize": "AI dev tools market: $15B+ (2026)",
        "competitors": [
          { "name": "LangChain", "strength": "Python ecosystem", "weakness": "No UI, developer only", "ourAdvantage": "Full UI + no-code friendly" },
          { "name": "CrewAI", "strength": "Multi-agent", "weakness": "No project management", "ourAdvantage": "Complete project lifecycle" },
          { "name": "AutoGPT", "strength": "Autonomous", "weakness": "Unreliable, hard to control", "ourAdvantage": "Controlled + monitored execution" }
        ]
      },
      "coreFeatures": [
        { "name": "Pipeline Visualization", "priority": "must", "description": "7-stage interactive pipeline from Idea to Deploy" },
        { "name": "AI Chat Execution", "priority": "must", "description": "Chat that reads code, proposes fixes, and executes them" },
        { "name": "Self-Improvement Agent", "priority": "must", "description": "Daily agent that analyzes and suggests improvements" },
        { "name": "Ideas Intelligence", "priority": "must", "description": "AI transforms vague ideas into detailed project plans" },
        { "name": "Multi-Account Claude", "priority": "must", "description": "Rotate between 2 Claude Pro Max accounts for uninterrupted work" },
        { "name": "File Manager", "priority": "should", "description": "Browse and view project files directly in the dashboard" },
        { "name": "Subdomain Auto-Deploy", "priority": "should", "description": "Each project gets its own .gen3.ai subdomain automatically" }
      ],
      "techStack": {
        "frontend": "Next.js 16 + TypeScript + Tailwind + shadcn/ui",
        "backend": "Express.js (Bridge API port 3001)",
        "ai": "Claude Opus 4 via OpenClaw + OAuth rotation",
        "infra": "Hostinger VPS + Caddy SSL + PM2",
        "storage": "JSON files (data/) + Git for versioning"
      },
      "costEstimation": {
        "hosting": "$20/month",
        "aiAccounts": "2x Claude Pro Max = $40/month",
        "total": "~$60/month"
      },
      "timeline": {
        "mvp": "3 weeks (done)",
        "fullVersion": "2 months",
        "currentPhase": "Phase 3 — Advanced Features"
      }
    },
    "planning": {
      "status": "done",
      "completedAt": "2026-03-19",
      "architecture": "Frontend (Next.js:3000) ← Caddy SSL → User\nBridge API (Express:3001) ← Frontend → OpenClaw → Claude\nOpenClaw ← Telegram Bot → User",
      "pages": [
        { "name": "Dashboard", "route": "/dashboard", "role": "System overview with live stats and agent status" },
        { "name": "Projects", "route": "/dashboard/projects", "role": "List all projects with pipeline status" },
        { "name": "Project Detail", "route": "/dashboard/projects/[id]", "role": "Full pipeline + files + chat per project" },
        { "name": "Chat", "route": "/dashboard/chat", "role": "Claude Code — AI engineer with server access" },
        { "name": "Ideas", "route": "/dashboard/ideas", "role": "AI-powered idea analysis and conversion to projects" },
        { "name": "Self-Dev", "route": "/dashboard/self-dev", "role": "Autonomous development system" },
        { "name": "Memory", "route": "/dashboard/memory", "role": "Agent memory and context management" },
        { "name": "Agents", "route": "/dashboard/agents", "role": "Active AI agents and their tasks" }
      ],
      "keyDecisions": [
        "JSON files for storage (no DB setup needed)",
        "OpenClaw as Claude interface (OAuth not API key)",
        "Bridge API as execution layer (server commands)",
        "PM2 for process management",
        "Caddy for SSL + subdomains"
      ]
    },
    "development": {
      "status": "active",
      "startedAt": "2026-03-18",
      "total": 127,
      "completed": 48,
      "phases": [
        { "name": "Phase 1: Infrastructure", "status": "done", "tasks": 32 },
        { "name": "Phase 2: Project System", "status": "done", "tasks": 28 },
        { "name": "Phase 3: Advanced Features", "status": "active", "tasks": 45 },
        { "name": "Phase 4: Polish + Deploy", "status": "pending", "tasks": 22 }
      ]
    }
  }
}
EOF
echo "Pipeline content created ✅"
```

---

# ════════════════════════════════════════════════════════
# TASK-2: CREATE TASKS DATABASE FROM REAL HISTORY
# ════════════════════════════════════════════════════════

Run this on server:
```bash
cat > /root/genplatform/data/tasks.json << 'EOF'
[
  { "id": "T-01", "title": "Set up project repository", "status": "done", "department": "Backend", "projectId": "genplatform-ai", "priority": "high", "sprint": 1, "estimatedHours": 2, "actualHours": 2 },
  { "id": "T-02", "title": "Design system architecture", "status": "done", "department": "Architecture", "projectId": "genplatform-ai", "priority": "high", "sprint": 1, "estimatedHours": 8, "actualHours": 10 },
  { "id": "T-03", "title": "Bridge API setup", "status": "done", "department": "Backend", "projectId": "genplatform-ai", "priority": "critical", "sprint": 1 },
  { "id": "T-04", "title": "Dashboard UI components", "status": "done", "department": "Frontend", "projectId": "genplatform-ai", "priority": "high", "sprint": 2 },
  { "id": "T-05", "title": "API endpoint development", "status": "done", "department": "Backend", "projectId": "genplatform-ai", "priority": "medium", "sprint": 2 },
  { "id": "T-06", "title": "Security audit preparation", "status": "done", "department": "Security", "projectId": "genplatform-ai", "priority": "high", "sprint": 2 },
  { "id": "T-07", "title": "Database optimization", "status": "done", "department": "Backend", "projectId": "genplatform-ai", "priority": "medium", "sprint": 2 },
  { "id": "T-08", "title": "User onboarding flow", "status": "done", "department": "Frontend", "projectId": "genplatform-ai", "priority": "medium", "sprint": 3 },
  { "id": "T-09", "title": "Integration testing", "status": "done", "department": "QA", "projectId": "genplatform-ai", "priority": "high", "sprint": 3 },
  { "id": "T-10", "title": "Performance monitoring", "status": "done", "department": "Backend", "projectId": "genplatform-ai", "priority": "medium", "sprint": 3 },
  { "id": "T-11", "title": "Projects CRUD API", "status": "done", "department": "Backend", "projectId": "genplatform-ai", "priority": "critical", "sprint": 3 },
  { "id": "T-12", "title": "Pipeline visualization", "status": "done", "department": "Frontend", "projectId": "genplatform-ai", "priority": "critical", "sprint": 3 },
  { "id": "T-13", "title": "Kanban board", "status": "done", "department": "Frontend", "projectId": "genplatform-ai", "priority": "high", "sprint": 3 },
  { "id": "T-14", "title": "Telegram integration", "status": "done", "department": "Backend", "projectId": "genplatform-ai", "priority": "critical", "sprint": 3 },
  { "id": "T-15", "title": "Memory read/write system", "status": "done", "department": "Backend", "projectId": "genplatform-ai", "priority": "high", "sprint": 3 },
  { "id": "T-16", "title": "Ideas Intelligence UI", "status": "done", "department": "Frontend", "projectId": "genplatform-ai", "priority": "high", "sprint": 4 },
  { "id": "T-17", "title": "AI analysis API", "status": "done", "department": "Backend", "projectId": "genplatform-ai", "priority": "critical", "sprint": 4 },
  { "id": "T-18", "title": "OAuth dual account setup", "status": "done", "department": "Backend", "projectId": "genplatform-ai", "priority": "critical", "sprint": 4 },
  { "id": "T-19", "title": "Context window management", "status": "done", "department": "Backend", "projectId": "genplatform-ai", "priority": "high", "sprint": 4 },
  { "id": "T-20", "title": "Self-Dev execution system", "status": "done", "department": "AI", "projectId": "genplatform-ai", "priority": "critical", "sprint": 4 },
  { "id": "T-21", "title": "Watchdog + auto-restart", "status": "done", "department": "DevOps", "projectId": "genplatform-ai", "priority": "high", "sprint": 4 },
  { "id": "T-22", "title": "Chat split-view UI", "status": "done", "department": "Frontend", "projectId": "genplatform-ai", "priority": "critical", "sprint": 5 },
  { "id": "T-23", "title": "Project selector in chat", "status": "done", "department": "Frontend", "projectId": "genplatform-ai", "priority": "high", "sprint": 5 },
  { "id": "T-24", "title": "Live preview panel", "status": "done", "department": "Frontend", "projectId": "genplatform-ai", "priority": "high", "sprint": 5 },
  { "id": "T-25", "title": "Terminal output component", "status": "done", "department": "Frontend", "projectId": "genplatform-ai", "priority": "medium", "sprint": 5 },
  { "id": "T-26", "title": "SSE stream for live logs", "status": "done", "department": "Backend", "projectId": "genplatform-ai", "priority": "high", "sprint": 5 },
  { "id": "T-27", "title": "Files API for project browsing", "status": "done", "department": "Backend", "projectId": "genplatform-ai", "priority": "high", "sprint": 5 },
  { "id": "T-28", "title": "Auto subdomain generation", "status": "done", "department": "DevOps", "projectId": "genplatform-ai", "priority": "high", "sprint": 5 },
  { "id": "T-29", "title": "Project detail page rebuild", "status": "done", "department": "Frontend", "projectId": "genplatform-ai", "priority": "critical", "sprint": 5 },
  { "id": "T-30", "title": "Pipeline stage detail panels", "status": "done", "department": "Frontend", "projectId": "genplatform-ai", "priority": "high", "sprint": 5 },
  { "id": "T-47", "title": "Fix dashboard real data", "status": "in_progress", "department": "Frontend", "projectId": "genplatform-ai", "priority": "high", "sprint": 6 },
  { "id": "T-48", "title": "Chat tool-use execution via Bridge", "status": "in_progress", "department": "Backend", "projectId": "genplatform-ai", "priority": "critical", "sprint": 6 },
  { "id": "T-49", "title": "Self-improvement agent (daily cron)", "status": "planned", "department": "AI", "projectId": "genplatform-ai", "priority": "critical", "sprint": 6 },
  { "id": "T-50", "title": "Pipeline clickable stages with real content", "status": "planned", "department": "Frontend", "projectId": "genplatform-ai", "priority": "high", "sprint": 6 },
  { "id": "T-51", "title": "Add improvement suggestion to project page", "status": "planned", "department": "Frontend", "projectId": "genplatform-ai", "priority": "high", "sprint": 6 },
  { "id": "T-52", "title": "File viewer with syntax highlighting", "status": "planned", "department": "Frontend", "projectId": "genplatform-ai", "priority": "medium", "sprint": 6 },
  { "id": "T-53", "title": "Voice input in chat (Whisper)", "status": "planned", "department": "Frontend", "projectId": "genplatform-ai", "priority": "medium", "sprint": 7 },
  { "id": "T-54", "title": "Security scan agent", "status": "planned", "department": "Security", "projectId": "genplatform-ai", "priority": "high", "sprint": 7 },
  { "id": "T-55", "title": "Multi-project support", "status": "planned", "department": "Backend", "projectId": "genplatform-ai", "priority": "critical", "sprint": 7 }
]
EOF
echo "Tasks database created ✅ — $(cat /root/genplatform/data/tasks.json | python3 -c 'import sys,json; d=json.load(sys.stdin); print(len(d), "tasks")')"
```

---

# ════════════════════════════════════════════════════════
# TASK-3: FIX PIPELINE STAGES — CLICKABLE WITH REAL CONTENT
# ════════════════════════════════════════════════════════

## File: src/app/api/projects/[id]/pipeline/route.ts
CREATE this file:

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const contentPath = path.join(process.cwd(), 'data', 'pipeline-content.json');
    const content = JSON.parse(await fs.readFile(contentPath, 'utf-8'));
    const projectContent = content[params.id] || content['genplatform-ai'];
    return NextResponse.json(projectContent);
  } catch {
    return NextResponse.json({});
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { stage, data } = await req.json();
  const contentPath = path.join(process.cwd(), 'data', 'pipeline-content.json');
  const content = JSON.parse(await fs.readFile(contentPath, 'utf-8'));
  if (!content[params.id]) content[params.id] = {};
  content[params.id][stage] = { ...content[params.id][stage], ...data };
  await fs.writeFile(contentPath, JSON.stringify(content, null, 2));
  return NextResponse.json({ ok: true });
}
```

## File: src/app/api/projects/[id]/tasks/route.ts
CREATE this file:

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASKS_PATH = path.join(process.cwd(), 'data', 'tasks.json');

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const tasks = JSON.parse(await fs.readFile(TASKS_PATH, 'utf-8'));
    const projectTasks = tasks.filter((t: any) => t.projectId === params.id);
    return NextResponse.json(projectTasks);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const tasks = JSON.parse(await fs.readFile(TASKS_PATH, 'utf-8'));
  const newTask = {
    id: `T-${Date.now()}`,
    projectId: params.id,
    status: 'planned',
    createdAt: new Date().toISOString(),
    ...body
  };
  tasks.push(newTask);
  await fs.writeFile(TASKS_PATH, JSON.stringify(tasks, null, 2));
  return NextResponse.json(newTask);
}
```

---

# ════════════════════════════════════════════════════════
# TASK-4: UPDATE ProjectDetailPage — FETCH REAL PIPELINE CONTENT
# ════════════════════════════════════════════════════════

## File: src/components/projects/ProjectDetailPage.tsx
Find the StageDetailPanel component and replace its content fetching:

```tsx
function StageDetailPanel({ stage, projectId, onClose }: any) {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/pipeline`)
      .then(r => r.json())
      .then(data => setContent(data[stage]));
  }, [stage, projectId]);

  if (!content) return (
    <div style={{ padding: 20, background: 'var(--color-background-secondary)', borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)', marginBottom: 16 }}>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Loading...</p>
    </div>
  );

  return (
    <div style={{ padding: 20, background: 'var(--color-background-secondary)', borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
          {stage === 'idea' && '💡 Idea'}
          {stage === 'analysis' && '🔬 Analysis'}
          {stage === 'planning' && '📋 Planning'}
          {stage === 'development' && '💻 Development'}
          {stage === 'review' && '🔍 Review'}
          {stage === 'security' && '🛡️ Security'}
          {stage === 'deploy' && '✅ Deploy'}
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 16 }}>✕</button>
      </div>

      {/* Idea stage */}
      {stage === 'idea' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <Field label="Original Idea" value={content.originalIdea} />
          <Field label="Problem Solved" value={content.problemSolved} />
          <Field label="Value Proposition" value={content.valueProposition} />
          <Field label="Target Audience" value={content.targetAudience?.join(', ')} />
        </div>
      )}

      {/* Analysis stage */}
      {stage === 'analysis' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <Field label="Market Size" value={content.marketAnalysis?.marketSize} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 500 }}>Competitors</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {content.marketAnalysis?.competitors?.map((c: any) => (
                <div key={c.name} style={{ padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)', fontSize: 12 }}>
                  <strong>{c.name}</strong> · Our advantage: {c.ourAdvantage}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 500 }}>Core Features</div>
            {content.coreFeatures?.map((f: any) => (
              <div key={f.name} style={{ fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: f.priority === 'must' ? '#1D9E75' : 'var(--color-text-secondary)', marginRight: 8 }}>
                  {f.priority === 'must' ? '●' : '○'}
                </span>
                <strong>{f.name}</strong> — {f.description}
              </div>
            ))}
          </div>
          <Field label="Tech Stack" value={Object.entries(content.techStack || {}).map(([k,v]) => `${k}: ${v}`).join('\n')} />
          <Field label="Cost Estimate" value={`${content.costEstimation?.total} total`} />
        </div>
      )}

      {/* Planning stage */}
      {stage === 'planning' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <Field label="Architecture" value={content.architecture} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 500 }}>Pages ({content.pages?.length})</div>
            {content.pages?.map((p: any) => (
              <div key={p.route} style={{ fontSize: 12, marginBottom: 6 }}>
                <code style={{ color: 'var(--color-text-info)', marginRight: 8 }}>{p.route}</code>
                {p.role}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Development stage */}
      {stage === 'development' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <StatCard label="Total Tasks" value={content.total} color="#1D9E75" />
            <StatCard label="Completed" value={content.completed} color="#1D9E75" />
            <StatCard label="Remaining" value={(content.total || 0) - (content.completed || 0)} color="#EF9F27" />
          </div>
          {content.phases?.map((p: any) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
              <span>{p.status === 'done' ? '✅' : p.status === 'active' ? '🔄' : '⏳'}</span>
              <span>{p.name}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--color-text-secondary)' }}>{p.tasks} tasks</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: any) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{value || '—'}</div>
    </div>
  );
}

function StatCard({ label, value, color }: any) {
  return (
    <div style={{ padding: 12, borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)', textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 500, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
```

Also update PipelineView to pass projectId and handle onClose:
```tsx
// In PipelineView, change StageDetailPanel call to:
{selectedStage && (
  <StageDetailPanel
    stage={selectedStage}
    projectId={project.id}
    onClose={() => setSelectedStage(null)}
  />
)}
```

---

# ════════════════════════════════════════════════════════
# TASK-5: SELF-IMPROVEMENT AGENT (DAILY CRON)
# ════════════════════════════════════════════════════════
# This agent runs daily, analyzes the project, suggests improvements.
# User approves → suggestions become tasks → get executed.

## File: src/app/api/projects/[id]/improvements/route.ts
CREATE:

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const IMPROVEMENTS_PATH = path.join(process.cwd(), 'data', 'improvements.json');

// GET — list pending improvements
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = JSON.parse(await fs.readFile(IMPROVEMENTS_PATH, 'utf-8'));
    return NextResponse.json(data[params.id] || []);
  } catch {
    return NextResponse.json([]);
  }
}

// POST — generate new improvements via AI
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const projectsData = JSON.parse(
    await fs.readFile(path.join(process.cwd(), 'data', 'projects.json'), 'utf-8')
  );
  const project = projectsData.find((p: any) => p.id === params.id);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const tasksData = JSON.parse(
    await fs.readFile(path.join(process.cwd(), 'data', 'tasks.json'), 'utf-8')
  );
  const completedTasks = tasksData.filter((t: any) => t.projectId === params.id && t.status === 'done');
  const plannedTasks = tasksData.filter((t: any) => t.projectId === params.id && t.status === 'planned');

  const prompt = `You are a senior product strategist analyzing ${project.name}.

Project: ${project.description}
Tech Stack: ${project.techStack?.join(', ')}
Completed: ${completedTasks.length} tasks done
Planned: ${plannedTasks.map((t: any) => t.title).join(', ')}

Analyze this project and suggest 3-5 high-value improvements that:
1. Add significant user value
2. Are technically feasible with the current stack
3. Don't exist yet in the planned tasks

Return JSON array only, no explanation:
[{
  "id": "IMP-001",
  "title": "short title",
  "description": "what it does and why it matters",
  "impact": "high|medium|low",
  "effort": "1-3 days|1 week|2 weeks",
  "category": "UX|Performance|Feature|Security|AI",
  "suggestedTasks": ["task 1", "task 2", "task 3"]
}]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';
    const improvements = JSON.parse(text.replace(/```json|```/g, '').trim());

    // Save with timestamp
    let existing: any = {};
    try { existing = JSON.parse(await fs.readFile(IMPROVEMENTS_PATH, 'utf-8')); } catch {}
    existing[params.id] = improvements.map((imp: any) => ({
      ...imp,
      status: 'pending',
      generatedAt: new Date().toISOString()
    }));
    await fs.writeFile(IMPROVEMENTS_PATH, JSON.stringify(existing, null, 2));

    return NextResponse.json(improvements);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT — approve/reject improvement → create tasks
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { improvementId, action } = await req.json(); // action: 'approve' | 'reject'

  let existing: any = {};
  try { existing = JSON.parse(await fs.readFile(IMPROVEMENTS_PATH, 'utf-8')); } catch {}

  const improvements = existing[params.id] || [];
  const imp = improvements.find((i: any) => i.id === improvementId);
  if (!imp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  imp.status = action === 'approve' ? 'approved' : 'rejected';

  if (action === 'approve') {
    // Convert suggested tasks to real tasks
    const tasksData = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'data', 'tasks.json'), 'utf-8')
    );
    const newTasks = (imp.suggestedTasks || []).map((taskTitle: string, i: number) => ({
      id: `T-IMP-${Date.now()}-${i}`,
      projectId: params.id,
      title: taskTitle,
      description: `Part of improvement: ${imp.title}`,
      status: 'planned',
      department: imp.category === 'UX' ? 'Frontend' : imp.category === 'Security' ? 'Security' : 'Backend',
      priority: imp.impact === 'high' ? 'high' : 'medium',
      improvementId,
      createdAt: new Date().toISOString()
    }));
    tasksData.push(...newTasks);
    await fs.writeFile(path.join(process.cwd(), 'data', 'tasks.json'), JSON.stringify(tasksData, null, 2));
    imp.createdTasks = newTasks.length;
  }

  await fs.writeFile(IMPROVEMENTS_PATH, JSON.stringify(existing, null, 2));
  return NextResponse.json({ ok: true, imp });
}
```

## File: src/components/projects/ImprovementsPanel.tsx
CREATE:

```tsx
'use client';
import { useState, useEffect } from 'react';

export function ImprovementsPanel({ project }: { project: any }) {
  const [improvements, setImprovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadImprovements(); }, []);

  const loadImprovements = async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${project.id}/improvements`);
    setImprovements(await res.json());
    setLoading(false);
  };

  const generate = async () => {
    setGenerating(true);
    const res = await fetch(`/api/projects/${project.id}/improvements`, { method: 'POST' });
    const data = await res.json();
    setImprovements(Array.isArray(data) ? data : []);
    setGenerating(false);
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    await fetch(`/api/projects/${project.id}/improvements`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ improvementId: id, action })
    });
    loadImprovements();
  };

  const impactColor = (impact: string) =>
    impact === 'high' ? '#1D9E75' : impact === 'medium' ? '#EF9F27' : 'var(--color-text-secondary)';

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>🧠 AI Improvement Suggestions</h2>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            AI analyzes your project and suggests high-value improvements
          </p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            border: '0.5px solid var(--color-border-tertiary)',
            background: generating ? 'var(--color-background-secondary)' : 'transparent',
            color: 'var(--color-text-primary)'
          }}
        >
          {generating ? 'Analyzing...' : '✨ Generate Suggestions'}
        </button>
      </div>

      {/* Improvements list */}
      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Loading...</p>
      ) : improvements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
          <p style={{ fontSize: 13 }}>No suggestions yet</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>
            Click "Generate Suggestions" to let AI analyze your project
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {improvements.map(imp => (
            <div key={imp.id} style={{
              padding: 16, borderRadius: 12,
              border: `0.5px solid ${imp.status === 'approved' ? '#1D9E75' : imp.status === 'rejected' ? 'var(--color-border-tertiary)' : 'var(--color-border-tertiary)'}`,
              background: 'var(--color-background-secondary)',
              opacity: imp.status === 'rejected' ? 0.5 : 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4,
                                 background: imp.impact === 'high' ? 'rgba(29,158,117,0.15)' : 'rgba(239,159,39,0.15)',
                                 color: impactColor(imp.impact) }}>
                    {imp.impact} impact
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', padding: '2px 8px',
                                 border: '0.5px solid var(--color-border-tertiary)', borderRadius: 4 }}>
                    {imp.category}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>~{imp.effort}</span>
                </div>
                {imp.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleAction(imp.id, 'approve')} style={{
                      fontSize: 11, padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                      border: '0.5px solid #1D9E75', background: 'rgba(29,158,117,0.1)', color: '#1D9E75'
                    }}>✓ Approve</button>
                    <button onClick={() => handleAction(imp.id, 'reject')} style={{
                      fontSize: 11, padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                      border: '0.5px solid var(--color-border-tertiary)', background: 'transparent',
                      color: 'var(--color-text-secondary)'
                    }}>✕ Skip</button>
                  </div>
                )}
                {imp.status === 'approved' && (
                  <span style={{ fontSize: 11, color: '#1D9E75' }}>✅ {imp.createdTasks} tasks created</span>
                )}
              </div>
              <h4 style={{ fontSize: 13, fontWeight: 500, margin: '0 0 6px' }}>{imp.title}</h4>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {imp.description}
              </p>
              {imp.suggestedTasks?.length > 0 && imp.status === 'pending' && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Will create {imp.suggestedTasks.length} tasks:</div>
                  {imp.suggestedTasks.map((t: string, i: number) => (
                    <div key={i} style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>· {t}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Add "Improvements" tab to ProjectDetailPage:
In TABS array, add 'Improvements':
```tsx
const TABS = ['Pipeline', 'Files', 'Chat', 'Tasks', 'Improvements', 'Preview', 'Settings'];
```

And in tab content:
```tsx
{activeTab === 'Improvements' && <ImprovementsPanel project={project} />}
```

## Add daily cron job for auto-suggestions:
In /root/genplatform/data/ create script:
```bash
cat > /root/genplatform/scripts/daily-improvements.sh << 'EOF'
#!/bin/bash
# Run daily — generate improvement suggestions for all active projects
curl -s -X POST http://localhost:3000/api/projects/genplatform-ai/improvements \
  -H "Content-Type: application/json" \
  >> /root/genplatform/data/improvements.log 2>&1
echo "[$(date)] Daily improvements generated" >> /root/genplatform/data/improvements.log
EOF
chmod +x /root/genplatform/scripts/daily-improvements.sh
```

Add to crontab:
```bash
(crontab -l 2>/dev/null; echo "0 9 * * * /root/genplatform/scripts/daily-improvements.sh") | crontab -
```

---

# ════════════════════════════════════════════════════════
# TASK-6: FIX CHAT — REAL EXECUTION VIA BRIDGE API
# ════════════════════════════════════════════════════════

## File: src/app/api/chat/send/route.ts
REPLACE entire file:

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = '/root/genplatform';
const PROTECTED = ['sidebar.tsx', 'navbar.tsx', 'layout.tsx', 'globals.css'];

async function readFile(filePath: string): Promise<string> {
  const full = path.join(PROJECT_ROOT, filePath);
  if (!full.startsWith(PROJECT_ROOT)) return 'ERROR: Invalid path';
  return fs.readFile(full, 'utf-8');
}

async function writeFile(filePath: string, content: string): Promise<string> {
  if (PROTECTED.some(p => filePath.includes(p))) return 'ERROR: Protected file';
  const full = path.join(PROJECT_ROOT, filePath);
  if (!full.startsWith(PROJECT_ROOT)) return 'ERROR: Invalid path';
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content);
  return 'SUCCESS: Written';
}

function runBash(cmd: string): string {
  const dangerous = ['rm -rf /', 'dd if=', 'mkfs'];
  if (dangerous.some(d => cmd.includes(d))) return 'ERROR: Blocked';
  try {
    return execSync(cmd, { cwd: PROJECT_ROOT, timeout: 30000, encoding: 'utf-8' });
  } catch (e: any) {
    return `ERROR: ${e.message}\n${e.stdout || ''}\n${e.stderr || ''}`;
  }
}

export async function POST(req: Request) {
  const { message, projectId, history } = await req.json();

  const systemPrompt = `You are an AI Engineer with DIRECT access to the GenPlatform.ai codebase at /root/genplatform.

You have 3 tools: bash (run commands), read_file (read any file), write_file (write files).
PROTECTED — never modify: ${PROTECTED.join(', ')}, anything in self-dev/

BEHAVIOR:
- When user reports a problem → use read_file to inspect the relevant file → identify the issue → show the exact fix
- Ask: "هل أطبق هذا الإصلاح؟ [نعم/لا]" or "Should I apply this fix? [Yes/No]"
- When user says yes/نعم/apply/طبق → use write_file to apply → run bash "npm run build" → run bash "pm2 restart genplatform-app" → report result
- When user asks to read a file → read it and show the content
- When user asks about the project → use bash to check git log, file structure, etc.

Respond in the same language as the user (Arabic or English).`;

  const messages = [
    ...(history || []).slice(-8),
    { role: 'user', content: message }
  ];

  const tools = [
    {
      name: 'bash',
      description: 'Run a bash command on the server',
      input_schema: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] }
    },
    {
      name: 'read_file',
      description: 'Read a file from the project',
      input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] }
    },
    {
      name: 'write_file',
      description: 'Write content to a file in the project',
      input_schema: {
        type: 'object',
        properties: { path: { type: 'string' }, content: { type: 'string' } },
        required: ['path', 'content']
      }
    }
  ];

  let currentMessages = [...messages];
  let finalReply = '';
  let iterations = 0;

  while (iterations++ < 8) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages: currentMessages
      })
    });

    const data = await response.json();

    if (data.stop_reason === 'end_turn') {
      finalReply = data.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
      break;
    }

    if (data.stop_reason === 'tool_use') {
      currentMessages.push({ role: 'assistant', content: data.content });
      const results = [];

      for (const block of data.content.filter((b: any) => b.type === 'tool_use')) {
        let result = '';
        if (block.name === 'bash') result = runBash(block.input.command);
        if (block.name === 'read_file') result = await readFile(block.input.path);
        if (block.name === 'write_file') result = await writeFile(block.input.path, block.input.content);
        results.push({ type: 'tool_result', tool_use_id: block.id, content: result });
      }

      currentMessages.push({ role: 'user', content: results });
    }
  }

  return NextResponse.json({ reply: finalReply || 'تم التنفيذ.' });
}
```

---

# EXECUTION ORDER
1. TASK-1 — run bash: create pipeline-content.json
2. TASK-2 — run bash: create tasks.json
3. TASK-3 — create pipeline/route.ts + tasks/route.ts
4. TASK-4 — update ProjectDetailPage StageDetailPanel
5. TASK-5 — create improvements API + ImprovementsPanel + add tab + cron
6. TASK-6 — replace chat/send/route.ts

After all: npm run build && pm2 restart genplatform-app

## FINAL VERIFICATION (send in chat after deploy):
"اقرأ ملف package.json وأخبرني بالإصدار"
→ If AI reads and responds with version number = Chat works ✅
→ Click "Idea" stage in pipeline = shows original idea content ✅
→ Click "Improvements" tab = can generate AI suggestions ✅
