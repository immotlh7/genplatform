# FILE-2: DATABASE — Replace JSON Files With SQLite
# ═══════════════════════════════════════════════════════════════
# This is FILE-2 of 6. Only start this after FILE-1 build passes.
# ═══════════════════════════════════════════════════════════════

## WHY SQLite INSTEAD OF JSON FILES
JSON files have 3 fatal problems:
1. Two processes writing at same time = corrupted file = app crash
2. No relationships — tasks don't truly belong to projects
3. No queries — to find tasks for a project you load ALL tasks

SQLite solves all three. It is a single file, no server needed,
handles concurrent writes safely, and supports SQL queries.
It is what powers millions of production apps including WhatsApp.

## PROTECTED FILES — NEVER TOUCH
- src/app/layout.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/navbar.tsx
- src/app/globals.css
- src/app/dashboard/self-dev/**

---

# ════════════════════════════════════════════════════════
# STEP 1: Install dependencies
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 1: Installing SQLite dependencies ==="
cd /root/genplatform

npm install better-sqlite3
npm install --save-dev @types/better-sqlite3

echo "OK: better-sqlite3 installed"
echo "=== STEP 1 COMPLETE ==="
```

---

# ════════════════════════════════════════════════════════
# STEP 2: Create the database module
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 2: Creating database module ==="
mkdir -p /root/genplatform/src/lib

cat > /root/genplatform/src/lib/db.ts << 'EOF'
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database lives in /root/genplatform/data/gen3.db
const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'gen3.db');

// Make sure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Open database (creates it if it does not exist)
const db = new Database(DB_PATH);

// Enable WAL mode — allows concurrent reads while writing
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ────────────────────────────────────────────────────

db.exec(`
  -- Projects table
  CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    description TEXT,
    status      TEXT DEFAULT 'active',
    progress    INTEGER DEFAULT 0,
    color       TEXT DEFAULT '#4F46E5',
    initials    TEXT,
    tech_stack  TEXT DEFAULT '[]',
    deploy_url  TEXT,
    subdomain   TEXT,
    repo_path   TEXT,
    github_url  TEXT,
    pipeline    TEXT DEFAULT '{}',
    agents      TEXT DEFAULT '[]',
    spec        TEXT,
    idea_id     TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  -- Tasks table
  CREATE TABLE IF NOT EXISTS tasks (
    id               TEXT PRIMARY KEY,
    project_id       TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    description      TEXT,
    status           TEXT DEFAULT 'planned',
    department       TEXT DEFAULT 'Frontend',
    priority         TEXT DEFAULT 'medium',
    agent_id         TEXT DEFAULT 'main',
    estimated_hours  REAL DEFAULT 4,
    actual_hours     REAL,
    sprint           INTEGER DEFAULT 1,
    dependencies     TEXT DEFAULT '[]',
    acceptance       TEXT DEFAULT '[]',
    files            TEXT DEFAULT '[]',
    created_at       TEXT DEFAULT (datetime('now')),
    updated_at       TEXT DEFAULT (datetime('now'))
  );

  -- Ideas table
  CREATE TABLE IF NOT EXISTS ideas (
    id               TEXT PRIMARY KEY,
    idea_text        TEXT NOT NULL,
    status           TEXT DEFAULT 'pending',
    analysis         TEXT,
    approved_features TEXT DEFAULT '[]',
    skipped_features TEXT DEFAULT '[]',
    project_id       TEXT REFERENCES projects(id),
    created_at       TEXT DEFAULT (datetime('now')),
    updated_at       TEXT DEFAULT (datetime('now'))
  );

  -- Agents table
  CREATE TABLE IF NOT EXISTS agents (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    emoji          TEXT DEFAULT 'AI',
    status         TEXT DEFAULT 'idle',
    role           TEXT,
    scope          TEXT,
    current_task   TEXT,
    tasks_done     INTEGER DEFAULT 0,
    schedule       TEXT,
    is_protected   INTEGER DEFAULT 0,
    last_active    TEXT,
    created_at     TEXT DEFAULT (datetime('now'))
  );

  -- Notifications table
  CREATE TABLE IF NOT EXISTS notifications (
    id         TEXT PRIMARY KEY,
    type       TEXT NOT NULL,
    message    TEXT NOT NULL,
    project_id TEXT,
    link       TEXT,
    read       INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Execution log table
  CREATE TABLE IF NOT EXISTS execution_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp  TEXT DEFAULT (datetime('now')),
    type       TEXT DEFAULT 'info',
    message    TEXT NOT NULL,
    project_id TEXT,
    task_id    TEXT
  );

  -- Pipeline content table (analysis data per stage per project)
  CREATE TABLE IF NOT EXISTS pipeline_content (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage      TEXT NOT NULL,
    content    TEXT DEFAULT '{}',
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(project_id, stage)
  );
`);

// ─── Indexes for performance ────────────────────────────────────

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
  CREATE INDEX IF NOT EXISTS idx_log_project ON execution_log(project_id);
  CREATE INDEX IF NOT EXISTS idx_log_timestamp ON execution_log(timestamp);
  CREATE INDEX IF NOT EXISTS idx_pipeline_project ON pipeline_content(project_id);
`);

export default db;
EOF

echo "OK: Database module created at src/lib/db.ts"
echo "=== STEP 2 COMPLETE ==="
```

---

# ════════════════════════════════════════════════════════
# STEP 3: Create data access layer (repository pattern)
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 3: Creating data access layer ==="

cat > /root/genplatform/src/lib/repositories.ts << 'EOF'
import db from './db';

// ─── Helper: parse JSON fields safely ─────────────────────────

function parseJSON(value: string | null, fallback: any = null) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function toJSON(value: any): string {
  return JSON.stringify(value ?? null);
}

// ─── Projects ──────────────────────────────────────────────────

export const ProjectRepo = {
  getAll(): any[] {
    const rows = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
    return rows.map(ProjectRepo._parse);
  },

  getById(id: string): any | null {
    const row = db.prepare('SELECT * FROM projects WHERE id = ? OR slug = ?').get(id, id);
    return row ? ProjectRepo._parse(row) : null;
  },

  create(data: any): any {
    const id = data.id || `${data.slug}-${Date.now()}`;
    db.prepare(`
      INSERT INTO projects (id, name, slug, description, status, progress, color, initials,
        tech_stack, deploy_url, subdomain, repo_path, github_url, pipeline, agents, spec, idea_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.name, data.slug, data.description || null,
      data.status || 'active', data.progress || 0,
      data.color || '#4F46E5', data.initials || data.name?.slice(0, 2).toUpperCase(),
      toJSON(data.techStack || data.tech_stack || []),
      data.deployUrl || data.deploy_url || null,
      data.subdomain || null,
      data.repoPath || data.repo_path || null,
      data.githubUrl || data.github_url || null,
      toJSON(data.pipeline || {}),
      toJSON(data.agents || []),
      data.spec || null,
      data.ideaId || data.idea_id || null
    );
    return ProjectRepo.getById(id);
  },

  update(id: string, data: any): any {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined)       { fields.push('name = ?');        values.push(data.name); }
    if (data.status !== undefined)     { fields.push('status = ?');      values.push(data.status); }
    if (data.progress !== undefined)   { fields.push('progress = ?');    values.push(data.progress); }
    if (data.pipeline !== undefined)   { fields.push('pipeline = ?');    values.push(toJSON(data.pipeline)); }
    if (data.agents !== undefined)     { fields.push('agents = ?');      values.push(toJSON(data.agents)); }
    if (data.githubUrl !== undefined)  { fields.push('github_url = ?');  values.push(data.githubUrl); }
    if (data.spec !== undefined)       { fields.push('spec = ?');        values.push(data.spec); }

    if (fields.length === 0) return ProjectRepo.getById(id);

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return ProjectRepo.getById(id);
  },

  delete(id: string): void {
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  },

  _parse(row: any): any {
    return {
      ...row,
      techStack: parseJSON(row.tech_stack, []),
      pipeline: parseJSON(row.pipeline, {}),
      agents: parseJSON(row.agents, []),
      tech_stack: undefined,
    };
  }
};

// ─── Tasks ─────────────────────────────────────────────────────

export const TaskRepo = {
  getAll(): any[] {
    return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all().map(TaskRepo._parse);
  },

  getByProject(projectId: string): any[] {
    return db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY sprint, id').all(projectId).map(TaskRepo._parse);
  },

  getById(id: string): any | null {
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return row ? TaskRepo._parse(row) : null;
  },

  create(data: any): any {
    const id = data.id || `T-${Date.now()}`;
    db.prepare(`
      INSERT INTO tasks (id, project_id, title, description, status, department,
        priority, agent_id, estimated_hours, sprint, dependencies, acceptance, files)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.projectId || data.project_id,
      data.title, data.description || null,
      data.status || 'planned',
      data.department || 'Frontend',
      data.priority || 'medium',
      data.agentId || data.agent_id || 'main',
      data.estimatedHours || data.estimated_hours || 4,
      data.sprint || 1,
      toJSON(data.dependencies || []),
      toJSON(data.acceptanceCriteria || data.acceptance || []),
      toJSON(data.files || [])
    );
    return TaskRepo.getById(id);
  },

  updateStatus(id: string, status: string): void {
    db.prepare("UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  },

  update(id: string, data: any): any {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.status !== undefined)    { fields.push('status = ?');          values.push(data.status); }
    if (data.title !== undefined)     { fields.push('title = ?');           values.push(data.title); }
    if (data.agentId !== undefined)   { fields.push('agent_id = ?');        values.push(data.agentId); }
    if (data.actualHours !== undefined) { fields.push('actual_hours = ?'); values.push(data.actualHours); }
    if (fields.length === 0) return TaskRepo.getById(id);
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return TaskRepo.getById(id);
  },

  bulkCreate(tasks: any[]): void {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO tasks (id, project_id, title, description, status, department,
        priority, agent_id, estimated_hours, sprint, dependencies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((items: any[]) => {
      for (const t of items) insert.run(
        t.id || `T-${Date.now()}-${Math.random()}`,
        t.projectId || t.project_id,
        t.title, t.description || null,
        t.status || 'planned',
        t.department || 'Frontend',
        t.priority || 'medium',
        t.agentId || t.agent_id || 'main',
        t.estimatedHours || 4,
        t.sprint || 1,
        toJSON(t.dependencies || [])
      );
    });
    insertMany(tasks);
  },

  _parse(row: any): any {
    return {
      ...row,
      projectId: row.project_id,
      agentId: row.agent_id,
      estimatedHours: row.estimated_hours,
      actualHours: row.actual_hours,
      dependencies: parseJSON(row.dependencies, []),
      acceptanceCriteria: parseJSON(row.acceptance, []),
      files: parseJSON(row.files, []),
    };
  }
};

// ─── Ideas ─────────────────────────────────────────────────────

export const IdeaRepo = {
  getAll(): any[] {
    return db.prepare('SELECT * FROM ideas ORDER BY created_at DESC').all().map(IdeaRepo._parse);
  },

  getById(id: string): any | null {
    const row = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id);
    return row ? IdeaRepo._parse(row) : null;
  },

  create(data: any): any {
    const id = data.id || `idea-${Date.now()}`;
    db.prepare(`
      INSERT INTO ideas (id, idea_text, status, analysis, approved_features, skipped_features)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id, data.ideaText || data.idea_text,
      data.status || 'pending',
      data.analysis ? toJSON(data.analysis) : null,
      toJSON(data.approvedFeatures || []),
      toJSON(data.skippedFeatures || [])
    );
    return IdeaRepo.getById(id);
  },

  update(id: string, data: any): any {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.status !== undefined)           { fields.push('status = ?');            values.push(data.status); }
    if (data.analysis !== undefined)         { fields.push('analysis = ?');          values.push(toJSON(data.analysis)); }
    if (data.approvedFeatures !== undefined) { fields.push('approved_features = ?'); values.push(toJSON(data.approvedFeatures)); }
    if (data.projectId !== undefined)        { fields.push('project_id = ?');        values.push(data.projectId); }
    if (fields.length === 0) return IdeaRepo.getById(id);
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE ideas SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return IdeaRepo.getById(id);
  },

  _parse(row: any): any {
    return {
      ...row,
      ideaText: row.idea_text,
      analysis: parseJSON(row.analysis),
      approvedFeatures: parseJSON(row.approved_features, []),
      skippedFeatures: parseJSON(row.skipped_features, []),
      projectId: row.project_id,
    };
  }
};

// ─── Agents ────────────────────────────────────────────────────

export const AgentRepo = {
  getAll(): any[] {
    return db.prepare('SELECT * FROM agents ORDER BY is_protected DESC, name').all();
  },

  getById(id: string): any | null {
    return db.prepare('SELECT * FROM agents WHERE id = ?').get(id) || null;
  },

  upsert(data: any): void {
    db.prepare(`
      INSERT INTO agents (id, name, emoji, status, role, scope, current_task, tasks_done, schedule, is_protected)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        current_task = excluded.current_task,
        last_active = datetime('now')
    `).run(
      data.id, data.name, data.emoji || 'AI',
      data.status || 'idle', data.role || null, data.scope || null,
      data.currentTask || data.current_task || null,
      data.tasksDone || 0, data.schedule || null,
      data.isProtected ? 1 : 0
    );
  },

  setStatus(id: string, status: string, currentTask?: string): void {
    db.prepare(`
      UPDATE agents SET status = ?, current_task = ?, last_active = datetime('now') WHERE id = ?
    `).run(status, currentTask || null, id);
  },

  incrementDone(id: string): void {
    db.prepare("UPDATE agents SET tasks_done = tasks_done + 1, status = 'idle', current_task = NULL WHERE id = ?").run(id);
  }
};

// ─── Notifications ─────────────────────────────────────────────

export const NotificationRepo = {
  getRecent(limit = 50): any[] {
    return db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?').all(limit);
  },

  create(data: any): any {
    const id = Date.now().toString();
    db.prepare(`
      INSERT INTO notifications (id, type, message, project_id, link)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.type, data.message, data.projectId || null, data.link || null);
    return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  },

  markRead(ids: string[]): void {
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`UPDATE notifications SET read = 1 WHERE id IN (${placeholders})`).run(...ids);
  },

  unreadCount(): number {
    const row: any = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE read = 0').get();
    return row?.count || 0;
  }
};

// ─── Execution Log ─────────────────────────────────────────────

export const LogRepo = {
  add(message: string, type = 'info', projectId?: string, taskId?: string): void {
    db.prepare(`
      INSERT INTO execution_log (message, type, project_id, task_id)
      VALUES (?, ?, ?, ?)
    `).run(message, type, projectId || null, taskId || null);
    // Keep only last 1000 entries
    db.prepare('DELETE FROM execution_log WHERE id NOT IN (SELECT id FROM execution_log ORDER BY id DESC LIMIT 1000)').run();
  },

  getRecent(limit = 50, projectId?: string): any[] {
    if (projectId) {
      return db.prepare(`
        SELECT * FROM execution_log WHERE project_id = ? OR project_id IS NULL
        ORDER BY id DESC LIMIT ?
      `).all(projectId, limit).reverse();
    }
    return db.prepare('SELECT * FROM execution_log ORDER BY id DESC LIMIT ?').all(limit).reverse();
  }
};

// ─── Pipeline Content ──────────────────────────────────────────

export const PipelineRepo = {
  getForProject(projectId: string): Record<string, any> {
    const rows = db.prepare('SELECT stage, content FROM pipeline_content WHERE project_id = ?').all(projectId);
    const result: Record<string, any> = {};
    for (const row of rows as any[]) {
      result[row.stage] = parseJSON(row.content, {});
    }
    return result;
  },

  setStage(projectId: string, stage: string, content: any): void {
    db.prepare(`
      INSERT INTO pipeline_content (project_id, stage, content, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(project_id, stage) DO UPDATE SET
        content = excluded.content,
        updated_at = datetime('now')
    `).run(projectId, stage, toJSON(content));
  }
};
EOF

echo "OK: Data access layer created at src/lib/repositories.ts"
echo "=== STEP 3 COMPLETE ==="
```

---

# ════════════════════════════════════════════════════════
# STEP 4: Migrate existing JSON data into SQLite
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 4: Migrating existing data to SQLite ==="

cat > /tmp/migrate.js << 'MIGRATE_EOF'
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join('/root/genplatform/data', 'gen3.db');
const db = new Database(DB_PATH);

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return null; }
}

function toJSON(v) { return JSON.stringify(v ?? null); }

// Migrate projects
const projects = readJSON('/root/genplatform/data/projects.json');
if (projects && Array.isArray(projects)) {
  const insertProject = db.prepare(`
    INSERT OR IGNORE INTO projects
      (id, name, slug, description, status, progress, color, initials,
       tech_stack, deploy_url, subdomain, repo_path, github_url, pipeline, agents, spec, idea_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of projects) {
    try {
      insertProject.run(
        p.id, p.name,
        p.slug || p.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        p.description || null,
        p.status || 'active',
        p.progress || 0,
        p.color || '#4F46E5',
        p.initials || p.name?.slice(0, 2).toUpperCase(),
        toJSON(p.techStack || p.tech_stack || []),
        p.deployUrl || p.deploy_url || null,
        p.subdomain || null,
        p.repoPath || p.repo_path || null,
        p.githubUrl || p.github_url || null,
        toJSON(p.pipeline || {}),
        toJSON(p.agents || []),
        p.spec || null,
        p.ideaId || p.idea_id || null
      );
    } catch (e) { console.log('Project skip:', p.id, e.message); }
  }
  console.log('Migrated', projects.length, 'projects');
}

// Migrate tasks
const tasks = readJSON('/root/genplatform/data/tasks.json');
if (tasks && Array.isArray(tasks)) {
  const insertTask = db.prepare(`
    INSERT OR IGNORE INTO tasks
      (id, project_id, title, description, status, department, priority, agent_id,
       estimated_hours, sprint, dependencies)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const t of tasks) {
    try {
      insertTask.run(
        t.id, t.projectId || t.project_id,
        t.title, t.description || null,
        t.status || 'planned',
        t.department || 'Frontend',
        t.priority || 'medium',
        t.agentId || t.agent_id || 'main',
        t.estimatedHours || t.estimated_hours || 4,
        t.sprint || 1,
        toJSON(t.dependencies || [])
      );
    } catch (e) { console.log('Task skip:', t.id, e.message); }
  }
  console.log('Migrated', tasks.length, 'tasks');
}

// Migrate ideas
const ideas = readJSON('/root/genplatform/data/ideas.json');
if (ideas && Array.isArray(ideas)) {
  const insertIdea = db.prepare(`
    INSERT OR IGNORE INTO ideas
      (id, idea_text, status, analysis, approved_features, skipped_features, project_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const i of ideas) {
    try {
      insertIdea.run(
        i.id,
        i.ideaText || i.idea_text,
        i.status || 'pending',
        i.analysis ? toJSON(i.analysis) : null,
        toJSON(i.approvedFeatures || []),
        toJSON(i.skippedFeatures || []),
        i.projectId || i.project_id || null
      );
    } catch (e) { console.log('Idea skip:', i.id, e.message); }
  }
  console.log('Migrated', ideas.length, 'ideas');
}

// Migrate pipeline content
const pipeline = readJSON('/root/genplatform/data/pipeline-content.json');
if (pipeline && typeof pipeline === 'object') {
  const insertPipeline = db.prepare(`
    INSERT OR IGNORE INTO pipeline_content (project_id, stage, content)
    VALUES (?, ?, ?)
  `);
  for (const [projectId, stages] of Object.entries(pipeline)) {
    if (typeof stages === 'object' && stages !== null) {
      for (const [stage, content] of Object.entries(stages)) {
        try {
          insertPipeline.run(projectId, stage, toJSON(content));
        } catch (e) { console.log('Pipeline skip:', projectId, stage); }
      }
    }
  }
  console.log('Migrated pipeline content');
}

// Seed default agents
const agents = [
  { id: 'main', name: 'Main Agent', emoji: 'AI', status: 'active', role: 'General purpose — handles all chat requests', scope: 'Everything', is_protected: 1 },
  { id: 'frontend-dev', name: 'Frontend Dev', emoji: 'FE', status: 'idle', role: 'Next.js, React, Tailwind, UI components only', scope: 'src/app/, src/components/ (no protected files)', is_protected: 0 },
  { id: 'backend-dev', name: 'Backend Dev', emoji: 'BE', status: 'idle', role: 'APIs, Node.js, Express, data files only', scope: 'src/app/api/, genplatform-api/, data/', is_protected: 0 },
  { id: 'improvement-agent', name: 'Improvement Agent', emoji: 'AI', status: 'scheduled', role: 'Daily analysis — suggests improvements for all projects', scope: 'Read-only analysis, writes to improvements table', schedule: '0 9 * * *', is_protected: 0 },
  { id: 'watchdog', name: 'Watchdog', emoji: 'WD', status: 'active', role: 'Monitors system health, restarts failed processes', scope: 'PM2 process monitoring', current_task: 'Monitoring all processes', is_protected: 1 },
];

const insertAgent = db.prepare(`
  INSERT OR IGNORE INTO agents
    (id, name, emoji, status, role, scope, current_task, schedule, is_protected)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const a of agents) {
  insertAgent.run(a.id, a.name, a.emoji, a.status, a.role, a.scope || null, a.current_task || null, a.schedule || null, a.is_protected);
}
console.log('Seeded', agents.length, 'agents');

// Migrate execution log (last 200 entries only)
const log = readJSON('/root/genplatform/data/execution-log.json');
if (log && Array.isArray(log)) {
  const recent = log.slice(-200);
  const insertLog = db.prepare(`
    INSERT INTO execution_log (timestamp, message, type, project_id)
    VALUES (?, ?, ?, ?)
  `);
  for (const entry of recent) {
    try {
      insertLog.run(
        entry.timestamp || new Date().toISOString(),
        entry.message || '',
        entry.type || 'info',
        entry.projectId || null
      );
    } catch {}
  }
  console.log('Migrated', recent.length, 'log entries');
}

console.log('');
console.log('Migration complete. Database:', DB_PATH);
console.log('Size:', Math.round(require('fs').statSync(DB_PATH).size / 1024), 'KB');
MIGRATE_EOF

cd /root/genplatform && node /tmp/migrate.js
echo "=== STEP 4 COMPLETE ==="
```

---

# ════════════════════════════════════════════════════════
# STEP 5: Update all API routes to use SQLite
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 5: Updating API routes to use SQLite ==="

# --- /api/projects ---
cat > /root/genplatform/src/app/api/projects/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { ProjectRepo } from '@/lib/repositories';
import { LogRepo } from '@/lib/repositories';

export async function GET() {
  try {
    return NextResponse.json(ProjectRepo.getAll());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const project = ProjectRepo.create(body);
    LogRepo.add(`Project created: ${project.name}`, 'info', project.id);
    return NextResponse.json(project);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
EOF

# --- /api/projects/[id] ---
cat > /root/genplatform/src/app/api/projects/\[id\]/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { ProjectRepo, TaskRepo, PipelineRepo } from '@/lib/repositories';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const project = ProjectRepo.getById(params.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Attach task summary
  const tasks = TaskRepo.getByProject(params.id);
  project.taskSummary = {
    total: tasks.length,
    completed: tasks.filter((t: any) => t.status === 'done').length,
    inProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
    planned: tasks.filter((t: any) => t.status === 'planned').length,
  };

  return NextResponse.json(project);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = ProjectRepo.update(params.id, body);
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  ProjectRepo.delete(params.id);
  return NextResponse.json({ ok: true });
}
EOF

# --- /api/projects/[id]/tasks ---
cat > /root/genplatform/src/app/api/projects/\[id\]/tasks/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { TaskRepo, LogRepo } from '@/lib/repositories';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json(TaskRepo.getByProject(params.id));
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const task = TaskRepo.create({ ...body, projectId: params.id });
    LogRepo.add(`Task created: ${task.title}`, 'info', params.id, task.id);
    return NextResponse.json(task);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
EOF

# --- /api/tasks (global) ---
cat > /root/genplatform/src/app/api/tasks/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { TaskRepo } from '@/lib/repositories';
export async function GET() {
  return NextResponse.json(TaskRepo.getAll());
}
EOF

# --- /api/agents ---
cat > /root/genplatform/src/app/api/agents/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { AgentRepo } from '@/lib/repositories';

export async function GET() {
  return NextResponse.json(AgentRepo.getAll());
}

export async function POST(req: Request) {
  const { agentId, action, task } = await req.json();
  if (action === 'assign_task') {
    AgentRepo.setStatus(agentId, 'active', task);
  } else if (action === 'complete_task') {
    AgentRepo.incrementDone(agentId);
  }
  return NextResponse.json({ ok: true });
}
EOF

# --- /api/notifications ---
cat > /root/genplatform/src/app/api/notifications/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { NotificationRepo } from '@/lib/repositories';

export async function GET() {
  return NextResponse.json(NotificationRepo.getRecent(50));
}

export async function POST(req: Request) {
  const body = await req.json();
  const notif = NotificationRepo.create(body);
  return NextResponse.json(notif);
}

export async function PATCH(req: Request) {
  const { ids } = await req.json();
  NotificationRepo.markRead(ids);
  return NextResponse.json({ ok: true });
}
EOF

# --- /api/execution-log ---
cat > /root/genplatform/src/app/api/execution-log/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { LogRepo } from '@/lib/repositories';
export async function GET() {
  return NextResponse.json(LogRepo.getRecent(50));
}
EOF

# --- /api/projects/[id]/pipeline ---
mkdir -p /root/genplatform/src/app/api/projects/\[id\]/pipeline
cat > /root/genplatform/src/app/api/projects/\[id\]/pipeline/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { PipelineRepo } from '@/lib/repositories';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json(PipelineRepo.getForProject(params.id));
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { stage, data } = await req.json();
  PipelineRepo.setStage(params.id, stage, data);
  return NextResponse.json({ ok: true });
}
EOF

echo "OK: All API routes updated to use SQLite"
echo "=== STEP 5 COMPLETE ==="
```

---

# ════════════════════════════════════════════════════════
# STEP 6: Build and verify
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 6: Build and verify ==="
cd /root/genplatform

npm run build 2>&1 | tail -30
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
  echo "BUILD PASSED"
  pm2 restart genplatform-app
  sleep 4

  echo "Testing API routes..."
  P=$(curl -s http://localhost:3000/api/projects | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d), 'projects')" 2>/dev/null || echo "error")
  T=$(curl -s http://localhost:3000/api/tasks | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d), 'tasks')" 2>/dev/null || echo "error")
  A=$(curl -s http://localhost:3000/api/agents | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d), 'agents')" 2>/dev/null || echo "error")
  N=$(curl -s http://localhost:3000/api/notifications | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d), 'notifications')" 2>/dev/null || echo "error")
  L=$(curl -s http://localhost:3000/api/execution-log | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d), 'log entries')" 2>/dev/null || echo "error")

  DB_SIZE=$(du -h /root/genplatform/data/gen3.db 2>/dev/null | cut -f1 || echo "not found")

  echo "Projects:      $P"
  echo "Tasks:         $T"
  echo "Agents:        $A"
  echo "Notifications: $N"
  echo "Log:           $L"
  echo "DB size:       $DB_SIZE"

  MSG="FILE-2 DATABASE COMPLETE%0ABuild: PASSED%0AProjects: $P%0ATasks: $T%0AAgents: $A%0ADB size: $DB_SIZE%0A%0AReady for FILE-3 (Queue)"
  curl -s "https://api.telegram.org/bot8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4/sendMessage" \
    -d "chat_id=510906393&text=$MSG" > /dev/null

else
  echo "BUILD FAILED"
  npm run build 2>&1 | grep -E "Cannot find|Module not found|Type error" | head -15

  ERRS=$(npm run build 2>&1 | grep -E "Cannot find|Type error" | head -3 | tr '\n' ' ' | cut -c1-180)
  MSG="FILE-2 BUILD FAILED%0AErrors: $ERRS"
  curl -s "https://api.telegram.org/bot8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4/sendMessage" \
    -d "chat_id=510906393&text=$MSG" > /dev/null
fi
```

---

# EXPECTED STATE AFTER FILE-2 COMPLETES

Database file exists:
  /root/genplatform/data/gen3.db

Tables created:
  projects, tasks, ideas, agents, notifications, execution_log, pipeline_content

Data migrated from JSON files:
  All existing projects, tasks, ideas, pipeline content

Default agents seeded:
  main, frontend-dev, backend-dev, improvement-agent, watchdog

All API routes use SQLite:
  /api/projects, /api/tasks, /api/agents, /api/notifications, /api/execution-log
  /api/projects/[id], /api/projects/[id]/tasks, /api/projects/[id]/pipeline

Build: PASSING

When confirmed -> send "FILE-2 DONE" in Telegram -> start FILE-3
