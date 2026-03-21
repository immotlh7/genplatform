import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const DB_PATH = path.join(process.cwd(), 'data', 'projects.json');

async function getProjects(): Promise<any[]> {
  try { return JSON.parse(await fs.readFile(DB_PATH, 'utf-8')); } catch { return []; }
}

async function saveProjects(projects: any[]) {
  await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2));
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const projects = await getProjects();
    const project = projects.find((p: any) => p.id === id || p.slug === id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found', id }, { status: 404 });
    }

    // Enrich GenPlatform.ai with real data
    if (project.repoPath === '/root/genplatform') {
      try {
        const { stdout: commits } = await execAsync('cd /root/genplatform && git log --oneline -5 2>/dev/null');
        project.recentCommits = commits.trim().split('\n').filter(Boolean);
        project.pipeline = project.pipeline || {};
        project.pipeline.development = project.pipeline.development || {};
        project.pipeline.development.status = 'active';
        project.pipeline.idea = { status: 'done' };
        project.pipeline.analysis = { status: 'done' };
        project.pipeline.planning = { status: 'done' };
      } catch {}
    }

    return NextResponse.json(project);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const projects = await getProjects();
    const idx = projects.findIndex((p: any) => p.id === id || p.slug === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    projects[idx] = { ...projects[idx], ...body, updatedAt: new Date().toISOString() };
    await saveProjects(projects);
    return NextResponse.json(projects[idx]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projects = await getProjects();
  const filtered = projects.filter((p: any) => p.id !== id && p.slug !== id);
  if (filtered.length === projects.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await saveProjects(filtered);
  return NextResponse.json({ success: true });
}
