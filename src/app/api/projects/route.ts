import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'projects.json');

async function getProjects(): Promise<any[]> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveProjects(projects: any[]) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const projects = await getProjects();
    return NextResponse.json({ projects, total: projects.length });
  } catch (error) {
    return NextResponse.json({ projects: [], total: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, status, priority, techStack, previewUrl, deployUrl, slug, ideaId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const projects = await getProjects();
    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 30);

    const newProject: any = {
      id: `proj-${Date.now()}`,
      name,
      description: description || '',
      slug: generatedSlug,
      status: status || 'active',
      progress: 0,
      priority: priority || 'medium',
      techStack: techStack || [],
      deployUrl: deployUrl || previewUrl || `https://${generatedSlug}.gen3.ai`,
      previewUrl: previewUrl || deployUrl || `https://${generatedSlug}.gen3.ai`,
      subdomain: generatedSlug,
      repoPath: null,
      githubUrl: null,
      pipeline: {
        idea: { status: 'done' },
        analysis: { status: 'pending' },
        planning: { status: 'pending' },
        development: { status: 'pending', total: 0, completed: 0 },
        review: { status: 'pending' },
        security: { status: 'pending' },
        deploy: { status: 'pending' }
      },
      agents: [],
      ideaId: ideaId || null,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };

    projects.push(newProject);
    await saveProjects(projects);

    return NextResponse.json(newProject, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create project' }, { status: 500 });
  }
}
