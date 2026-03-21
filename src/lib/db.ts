import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'gen3.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
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

  CREATE TABLE IF NOT EXISTS notifications (
    id         TEXT PRIMARY KEY,
    type       TEXT NOT NULL,
    message    TEXT NOT NULL,
    project_id TEXT,
    link       TEXT,
    read       INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS execution_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp  TEXT DEFAULT (datetime('now')),
    type       TEXT DEFAULT 'info',
    message    TEXT NOT NULL,
    project_id TEXT,
    task_id    TEXT
  );

  CREATE TABLE IF NOT EXISTS pipeline_content (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage      TEXT NOT NULL,
    content    TEXT DEFAULT '{}',
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(project_id, stage)
  );
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
  CREATE INDEX IF NOT EXISTS idx_log_project ON execution_log(project_id);
  CREATE INDEX IF NOT EXISTS idx_log_timestamp ON execution_log(timestamp);
  CREATE INDEX IF NOT EXISTS idx_pipeline_project ON pipeline_content(project_id);
`);

export default db;
