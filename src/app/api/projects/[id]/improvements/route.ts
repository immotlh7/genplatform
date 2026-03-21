import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const IMP_PATH = path.join(process.cwd(), 'data', 'improvements.json');
const TASKS_PATH = path.join(process.cwd(), 'data', 'tasks.json');
const PROJECTS_PATH = path.join(process.cwd(), 'data', 'projects.json');

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = JSON.parse(await fs.readFile(IMP_PATH, 'utf-8'));
    return NextResponse.json(data[id] || []);
  } catch { return NextResponse.json([]); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const projects = JSON.parse(await fs.readFile(PROJECTS_PATH, 'utf-8'));
    const project = projects.find((p: any) => p.id === id);
    let tasks: any[] = [];
    try { tasks = JSON.parse(await fs.readFile(TASKS_PATH, 'utf-8')); } catch {}
    const done = tasks.filter(t => t.projectId === id && t.status === 'done');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-opus-4-5', max_tokens: 2000,
        messages: [{ role: 'user', content: `Analyze ${project?.name || 'project'} (${project?.description || ''}, ${done.length} tasks done). Suggest 3-5 improvements. Return JSON array ONLY: [{"id":"IMP-001","title":"...","description":"...","impact":"high|medium","effort":"1-3 days","category":"UX|Performance|Feature|Security","suggestedTasks":["task1","task2"]}]` }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const improvements = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    let existing: any = {};
    try { existing = JSON.parse(await fs.readFile(IMP_PATH, 'utf-8')); } catch {}
    existing[id] = improvements.map((imp: any) => ({ ...imp, status: 'pending', generatedAt: new Date().toISOString() }));
    await fs.mkdir(path.dirname(IMP_PATH), { recursive: true });
    await fs.writeFile(IMP_PATH, JSON.stringify(existing, null, 2));

    return NextResponse.json(improvements);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { improvementId, action } = await req.json();
  try {
    let existing: any = {};
    try { existing = JSON.parse(await fs.readFile(IMP_PATH, 'utf-8')); } catch {}
    const improvements = existing[id] || [];
    const imp = improvements.find((i: any) => i.id === improvementId);
    if (!imp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    imp.status = action === 'approve' ? 'approved' : 'rejected';
    if (action === 'approve' && imp.suggestedTasks) {
      let tasks: any[] = [];
      try { tasks = JSON.parse(await fs.readFile(TASKS_PATH, 'utf-8')); } catch {}
      const newTasks = imp.suggestedTasks.map((t: string, i: number) => ({
        id: `T-IMP-${Date.now()}-${i}`, projectId: id, title: t, status: 'planned',
        department: imp.category === 'UX' ? 'Frontend' : 'Backend', priority: imp.impact === 'high' ? 'high' : 'medium',
        improvementId, createdAt: new Date().toISOString()
      }));
      tasks.push(...newTasks);
      await fs.writeFile(TASKS_PATH, JSON.stringify(tasks, null, 2));
      imp.createdTasks = newTasks.length;
    }

    await fs.writeFile(IMP_PATH, JSON.stringify(existing, null, 2));
    return NextResponse.json({ ok: true, imp });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
