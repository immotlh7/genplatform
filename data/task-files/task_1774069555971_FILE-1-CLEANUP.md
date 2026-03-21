# FILE-1: CLEANUP — Remove Chaos From The Foundation
# ═══════════════════════════════════════════════════════════════
# This is FILE-1 of 6. Do not start FILE-2 before this is complete.
# Execute every step in order. Report result of each step before next.
# ═══════════════════════════════════════════════════════════════

## PROTECTED FILES — NEVER TOUCH
- src/app/layout.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/navbar.tsx
- src/app/globals.css
- src/app/dashboard/self-dev/**

## WHY THIS FILE EXISTS
The project has a critical architectural problem:
- Same page exists in 3 different routes simultaneously
- Same component exists twice with different names
- Unused pages bloating the bundle
- Conflicting routes breaking Next.js routing

Solution: Define exactly which pages are needed, delete everything else,
unify all routes.

## PAGES THAT SURVIVE (everything else gets deleted)
```
/dashboard                 -> Main overview
/dashboard/projects        -> Projects list
/dashboard/projects/[id]   -> Single project (pipeline + files + chat + tasks)
/dashboard/claude          -> Smart chat (AI Engineer)
/dashboard/ideas           -> Strategic room
/dashboard/agents          -> Agents management
/dashboard/memory          -> Memory system
/dashboard/skills          -> Skills
/dashboard/cron            -> Cron jobs
/dashboard/command-center  -> Command center
/dashboard/settings        -> Settings
/dashboard/self-dev        -> PROTECTED — never touch
```

---

# ════════════════════════════════════════════════════════
# STEP 1: Delete duplicate and unused pages
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 1: Removing duplicate and unused pages ==="

# Remove the (dashboard) route group — it duplicates /dashboard
rm -rf /root/genplatform/src/app/\(dashboard\)/
echo "OK: Removed (dashboard)/ route group"

# Remove root-level duplicate routes
rm -rf /root/genplatform/src/app/projects/
rm -rf /root/genplatform/src/app/reports/
rm -rf /root/genplatform/src/app/automations/
rm -rf /root/genplatform/src/app/help/
echo "OK: Removed root-level duplicate routes"

# Remove unused dashboard pages
rm -rf /root/genplatform/src/app/dashboard/invoices/
rm -rf /root/genplatform/src/app/dashboard/monitoring/
rm -rf /root/genplatform/src/app/dashboard/analytics/
rm -rf /root/genplatform/src/app/dashboard/models/
rm -rf /root/genplatform/src/app/dashboard/security/
rm -rf /root/genplatform/src/app/dashboard/users/
rm -rf /root/genplatform/src/app/dashboard/tasks/
rm -rf /root/genplatform/src/app/dashboard/reports/
echo "OK: Removed unused dashboard pages"

# Replace old broken chat with a redirect to /dashboard/claude
cat > /root/genplatform/src/app/dashboard/chat/page.tsx << 'EOF'
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function ChatRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/claude'); }, [router]);
  return null;
}
EOF
echo "OK: Old chat now redirects to /dashboard/claude"

# Remove projects/new (project creation moves to Ideas page)
rm -rf /root/genplatform/src/app/dashboard/projects/new/
echo "OK: Removed projects/new"

echo "=== STEP 1 COMPLETE ==="
```

---

# ════════════════════════════════════════════════════════
# STEP 2: Delete duplicate components
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 2: Removing duplicate components ==="

# components/project/ (singular) duplicates components/projects/ (plural)
# Keep projects/, delete project/
rm -rf /root/genplatform/src/components/project/
echo "OK: Removed components/project/ — keeping components/projects/"

# Automations components no longer needed
rm -rf /root/genplatform/src/components/automations/
echo "OK: Removed components/automations/"

# Reports components no longer needed
rm -rf /root/genplatform/src/components/reports/
echo "OK: Removed components/reports/"

# Team components no longer needed
rm -rf /root/genplatform/src/components/team/
echo "OK: Removed components/team/"

# Clean duplicate notification components — keep only notification-context.tsx
rm -f /root/genplatform/src/components/notifications/ReportsNotifications.tsx
rm -f /root/genplatform/src/components/notifications/WorkflowApprovalNotification.tsx
rm -f /root/genplatform/src/components/notifications/notification-provider.tsx
rm -f /root/genplatform/src/components/notifications/notification-system.tsx
echo "OK: Cleaned notifications/ — kept notification-context.tsx"

# Clean unused dashboard widgets
rm -f /root/genplatform/src/components/dashboard/AutomationsCard.tsx
rm -f /root/genplatform/src/components/dashboard/AutomationsIndicator.tsx
rm -f /root/genplatform/src/components/dashboard/WorkflowStatusCard.tsx
rm -f /root/genplatform/src/components/dashboard/activity-feed.tsx
echo "OK: Cleaned dashboard/ widgets"

# Clean unused chat components
# KEEPING: LivePreviewPanel.tsx, ProjectSelector.tsx, TerminalOutput.tsx, VoiceInput.tsx
rm -f /root/genplatform/src/components/chat/CommanderCard.tsx
rm -f /root/genplatform/src/components/chat/EditCommandModal.tsx
rm -f /root/genplatform/src/components/chat/MobileChatLayout.tsx
rm -f /root/genplatform/src/components/chat/NewIdeaModal.tsx
rm -f /root/genplatform/src/components/chat/QuickCommands.tsx
rm -f /root/genplatform/src/components/chat/SendToProjectModal.tsx
rm -f /root/genplatform/src/components/chat/ChatNotifications.tsx
echo "OK: Cleaned chat/ components"

echo "=== STEP 2 COMPLETE ==="
```

---

# ════════════════════════════════════════════════════════
# STEP 3: Find and fix broken imports
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 3: Checking for broken imports ==="

echo "--- Files importing deleted automations components ---"
grep -rn "from.*components/automations\|from.*components/reports\|from.*components/team" \
  /root/genplatform/src --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules" | grep -v ".next"

echo "--- Files importing deleted dashboard widgets ---"
grep -rn "AutomationsCard\|AutomationsIndicator\|WorkflowStatusCard" \
  /root/genplatform/src --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules"

echo "--- Files importing deleted chat components ---"
grep -rn "CommanderCard\|EditCommandModal\|MobileChatLayout\|QuickCommands\|SendToProjectModal" \
  /root/genplatform/src --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules"

echo "=== Review output above ==="
echo "For each broken import found:"
echo "  - If it is in a page we already deleted -> no action needed"
echo "  - If it is in a file we kept -> remove that import line"
echo ""
echo "To remove an import line from a file:"
echo "  sed -i '/import.*COMPONENT_NAME/d' /path/to/file.tsx"
echo ""
echo "When no broken imports remain -> continue to STEP 4"
```

---

# ════════════════════════════════════════════════════════
# STEP 4: Rebuild Dashboard page with real live data
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 4: Rebuilding Dashboard page ==="

cat > /root/genplatform/src/app/dashboard/page.tsx << 'DASHBOARD_EOF'
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  projects: number;
  tasks: number;
  completedTasks: number;
  activeAgents: number;
}

interface LogEntry {
  timestamp: string;
  message: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ projects: 0, tasks: 0, completedTasks: 0, activeAgents: 0 });
  const [recentLog, setRecentLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()).catch(() => []),
      fetch('/api/tasks').then(r => r.json()).catch(() => []),
      fetch('/api/agents').then(r => r.json()).catch(() => []),
      fetch('/api/execution-log').then(r => r.json()).catch(() => []),
    ]).then(([projects, tasks, agents, log]) => {
      const p = Array.isArray(projects) ? projects : [];
      const t = Array.isArray(tasks) ? tasks : [];
      const a = Array.isArray(agents) ? agents : [];
      const l = Array.isArray(log) ? log : [];
      setStats({
        projects: p.length,
        tasks: t.length,
        completedTasks: t.filter((x: any) => x.status === 'done').length,
        activeAgents: a.filter((x: any) => x.status === 'active').length,
      });
      setRecentLog(l.slice(-8).reverse());
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading...</p>
    </div>
  );

  const STATS = [
    { label: 'Projects', value: stats.projects, color: '#7F77DD', link: '/dashboard/projects' },
    { label: 'Total tasks', value: stats.tasks, color: 'var(--color-text-primary)', link: '/dashboard/projects' },
    { label: 'Completed', value: stats.completedTasks, color: '#1D9E75', link: '/dashboard/projects' },
    { label: 'Active agents', value: stats.activeAgents, color: '#185FA5', link: '/dashboard/agents' },
  ];

  const ACTIONS = [
    { label: '+ New idea', desc: 'Turn your idea into a full project', link: '/dashboard/ideas', color: '#7F77DD' },
    { label: '+ New project', desc: 'Start a project directly', link: '/dashboard/projects', color: '#1D9E75' },
    { label: 'Open chat', desc: 'Talk to your AI engineer', link: '/dashboard/claude', color: '#185FA5' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 4px' }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {STATS.map(s => (
          <div key={s.label} onClick={() => router.push(s.link)} style={{
            padding: '16px 20px', borderRadius: 12, cursor: 'pointer',
            border: '0.5px solid var(--color-border-tertiary)',
            background: 'var(--color-background-secondary)',
          }}>
            <div style={{ fontSize: 32, fontWeight: 500, color: s.color, marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {ACTIONS.map(a => (
          <div key={a.label} onClick={() => router.push(a.link)} style={{
            padding: 16, borderRadius: 12, cursor: 'pointer',
            border: `0.5px solid ${a.color}33`,
            background: `${a.color}0A`,
          }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: a.color, marginBottom: 4 }}>{a.label}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{a.desc}</div>
          </div>
        ))}
      </div>

      {recentLog.length > 0 && (
        <div style={{ padding: 16, borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, margin: '0 0 12px' }}>Recent activity</h3>
          <div style={{ fontFamily: 'monospace' }}>
            {recentLog.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: 'var(--color-text-secondary)', minWidth: 50 }}>
                  {entry.timestamp
                    ? new Date(entry.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })
                    : '--:--'}
                </span>
                <span style={{
                  color: entry.message?.includes('completed') || entry.message?.includes('OK') ? '#1D9E75' :
                         entry.message?.includes('failed') || entry.message?.includes('Error') ? '#E24B4A' :
                         entry.message?.includes('started') ? '#185FA5' :
                         'var(--color-text-primary)'
                }}>
                  {entry.message?.slice(0, 90)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
DASHBOARD_EOF

echo "OK: Dashboard page rebuilt with real data"
echo "=== STEP 4 COMPLETE ==="
```

---

# ════════════════════════════════════════════════════════
# STEP 5: Create missing API routes
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 5: Creating missing API routes ==="

# /api/tasks — global tasks list
mkdir -p /root/genplatform/src/app/api/tasks
cat > /root/genplatform/src/app/api/tasks/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
const TASKS_PATH = path.join(process.cwd(), 'data', 'tasks.json');
export async function GET() {
  try {
    const data = await fs.readFile(TASKS_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch { return NextResponse.json([]); }
}
EOF
echo "OK: Created /api/tasks"

# /api/execution-log — last 50 execution log entries
mkdir -p /root/genplatform/src/app/api/execution-log
cat > /root/genplatform/src/app/api/execution-log/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
const LOG_PATH = path.join(process.cwd(), 'data', 'execution-log.json');
export async function GET() {
  try {
    const data = await fs.readFile(LOG_PATH, 'utf-8');
    const log = JSON.parse(data);
    return NextResponse.json(Array.isArray(log) ? log.slice(-50) : []);
  } catch { return NextResponse.json([]); }
}
EOF
echo "OK: Created /api/execution-log"

echo "=== STEP 5 COMPLETE ==="
```

---

# ════════════════════════════════════════════════════════
# STEP 6: Build and verify everything works
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 6: Build and verify ==="
cd /root/genplatform

npm run build 2>&1 | tail -30
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
  echo ""
  echo "BUILD PASSED"
  pm2 restart genplatform-app
  sleep 4

  echo "Running smoke tests..."
  D=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard)
  P=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard/projects)
  I=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard/ideas)
  C=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard/claude)
  A=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard/agents)

  echo "Dashboard: $D"
  echo "Projects:  $P"
  echo "Ideas:     $I"
  echo "Chat:      $C"
  echo "Agents:    $A"

  MSG="FILE-1 CLEANUP COMPLETE%0ABuild: PASSED%0ADashboard: $D%0AProjects: $P%0AIdeas: $I%0AChat: $C%0AAgents: $A%0AReady for FILE-2"
  curl -s "https://api.telegram.org/bot8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4/sendMessage" \
    -d "chat_id=510906393&text=$MSG" > /dev/null

else
  echo "BUILD FAILED"
  echo ""
  echo "Errors:"
  npm run build 2>&1 | grep -E "Cannot find|Module not found|Type error" | head -15
  echo ""
  echo "Fix all errors above. Do NOT continue to FILE-2 until build passes."

  ERRS=$(npm run build 2>&1 | grep -E "Cannot find|Module not found" | head -3 | tr '\n' ' ' | cut -c1-180)
  MSG="FILE-1 BUILD FAILED%0AErrors: $ERRS"
  curl -s "https://api.telegram.org/bot8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4/sendMessage" \
    -d "chat_id=510906393&text=$MSG" > /dev/null
fi
```

---

# ════════════════════════════════════════════════════════
# HOW TO FIX COMMON BUILD ERRORS
# ════════════════════════════════════════════════════════

## "Cannot find module './AutomationsCard'" or similar:
```bash
# Find the file that has the broken import
grep -rn "AutomationsCard\|WorkflowStatusCard\|AutomationsIndicator" \
  /root/genplatform/src --include="*.tsx" | grep -v node_modules

# Remove the import line
sed -i '/import.*AutomationsCard/d' /path/to/the/file.tsx
```

## "Cannot find module in components/reports":
```bash
grep -rn "from.*components/reports" /root/genplatform/src --include="*.tsx" | grep -v node_modules
# Remove each broken import line found
```

## Error involves layout.tsx, sidebar.tsx, navbar.tsx:
DO NOT edit those files.
Send the full error message to Telegram and wait for instructions.

---

# ════════════════════════════════════════════════════════
# EXPECTED STATE AFTER FILE-1 COMPLETES
# ════════════════════════════════════════════════════════

Pages (no duplicates):
  /dashboard/page.tsx                  -> real data, 4 stat cards, 3 quick actions
  /dashboard/projects/page.tsx         -> project list
  /dashboard/projects/[id]/page.tsx    -> project detail with pipeline
  /dashboard/claude/page.tsx           -> chat (working)
  /dashboard/chat/page.tsx             -> redirect only
  /dashboard/ideas/page.tsx            -> strategic room
  /dashboard/agents/page.tsx           -> agents management
  /dashboard/memory/page.tsx           -> memory
  /dashboard/self-dev/page.tsx         -> UNTOUCHED
  /dashboard/settings/page.tsx         -> settings
  /dashboard/cron/page.tsx             -> cron jobs
  /dashboard/command-center/page.tsx   -> command center

API routes working:
  /api/projects     -> returns projects list
  /api/tasks        -> returns all tasks
  /api/agents       -> returns agents list
  /api/execution-log -> returns last 50 log entries
  /api/chat/send    -> sends to OpenClaw Gateway

Build: PASSING
All 5 main pages: HTTP 200

When confirmed -> send "FILE-1 DONE" in Telegram -> start FILE-2
