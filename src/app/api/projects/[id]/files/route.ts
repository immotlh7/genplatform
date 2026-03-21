import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

async function getRepoPath(projectId: string): Promise<string> {
  try {
    const projectsFile = '/root/genplatform/data/projects.json';
    const projects = JSON.parse(await fs.readFile(projectsFile, 'utf-8'));
    const project = projects.find((p: any) => p.id === projectId);
    if (project?.repoPath) return project.repoPath;
  } catch {}
  // Fallback: check common paths
  const candidates = [
    `/root/projects/${projectId}`,
    `/root/${projectId}`,
    '/root/genplatform',
  ];
  for (const c of candidates) {
    try { await fs.access(c); return c; } catch {}
  }
  return '/root/genplatform';
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const dirPath = searchParams.get('path') || '/src';
  const repoPath = await getRepoPath(id);
  const fullPath = path.join(repoPath, dirPath);

  if (!fullPath.startsWith(repoPath)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '.next')
        .map(async entry => {
          const stat = await fs.stat(path.join(fullPath, entry.name)).catch(() => null);
          return {
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: stat?.size || 0,
            modified: stat?.mtime?.toISOString(),
            path: path.join(dirPath, entry.name),
          };
        })
    );

    files.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ path: dirPath, files });
  } catch {
    return NextResponse.json({ path: dirPath, files: [] });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { filePath } = await req.json();
  const repoPath = await getRepoPath(id);
  const fullPath = path.join(repoPath, filePath);

  if (!fullPath.startsWith(repoPath)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    return NextResponse.json({ content, lines: content.split('\n').length, path: filePath });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
