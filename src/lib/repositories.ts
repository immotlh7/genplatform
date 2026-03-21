import db from './db';

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
    if (data.description !== undefined){ fields.push('description = ?'); values.push(data.description); }
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
    if (data.status !== undefined)      { fields.push('status = ?');          values.push(data.status); }
    if (data.title !== undefined)       { fields.push('title = ?');           values.push(data.title); }
    if (data.agentId !== undefined)     { fields.push('agent_id = ?');        values.push(data.agentId); }
    if (data.actualHours !== undefined) { fields.push('actual_hours = ?');    values.push(data.actualHours); }
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
        t.id || `T-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
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
