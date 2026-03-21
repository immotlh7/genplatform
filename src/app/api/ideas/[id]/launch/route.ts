import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { notify } from '@/lib/notify';

const GATEWAY = 'http://127.0.0.1:18789/v1/chat/completions';
const TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || 'bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df';

async function callGateway(prompt: string, maxTokens = 8000): Promise<string> {
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
    body: JSON.stringify({ model: 'openclaw', max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { approvedFeatures, skippedFeatures } = await req.json();
  
  // Load idea
  const ideasPath = path.join(process.cwd(), 'data', 'ideas.json');
  let ideas: any[] = [];
  try { ideas = JSON.parse(await fs.readFile(ideasPath, 'utf-8')); } catch {}
  const idea = ideas.find((i: any) => i.id === params.id);
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  
  const analysis = idea.analysis?.expanded;
  const projectName = analysis?.projectName || 'New Project';
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);
  
  await notify('project_launching', `Launching project: ${projectName}`);

  // Generate tasks
  const taskPrompt = `Break this project into detailed development tasks.

Project: ${projectName}
Features to build: ${JSON.stringify((approvedFeatures || []).map((f: any) => f.name || f))}
Pages: ${JSON.stringify((analysis?.pages || []).map((p: any) => ({ name: p.name, route: p.route })))}
Tech Stack: ${JSON.stringify(analysis?.techStack || {})}

Return ONLY a JSON array of tasks (no markdown):
[{
  "id": "T001",
  "title": "task title",
  "description": "exact description of what to do",
  "department": "Frontend|Backend|Database|AI|DevOps|QA",
  "priority": "critical|high|medium|low",
  "estimatedHours": 2,
  "dependencies": [],
  "files": ["src/path/to/file.tsx"]
}]

Be thorough — include setup, each page, each API endpoint, each component, testing, deployment.`;

  const tasksRaw = await callGateway(taskPrompt, 6000);
  
  let tasks: any[] = [];
  try {
    const cleaned = tasksRaw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
  } catch {
    tasks = [{ id: 'T001', title: 'Setup project', department: 'DevOps', priority: 'critical', estimatedHours: 2 }];
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
    color: `hsl(${Math.floor(Math.random() * 360)}, 60%, 50%)`,
    initials: projectName.slice(0, 2).toUpperCase(),
    techStack: analysis?.techStack ? Object.values(analysis.techStack).map((v: any) => v?.framework || v?.type || '').filter(Boolean) : [],
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
    createdAt: new Date().toISOString(),
    ideaId: params.id
  };
  
  // Save project
  const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
  let projects: any[] = [];
  try { projects = JSON.parse(await fs.readFile(projectsPath, 'utf-8')); } catch {}
  projects.push(newProject);
  await fs.writeFile(projectsPath, JSON.stringify(projects, null, 2));
  
  // Save tasks
  const tasksPath = path.join(process.cwd(), 'data', 'tasks.json');
  let allTasks: any[] = [];
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
  
  // Create project directory with SPEC
  try {
    const { execSync } = require('child_process');
    execSync(`mkdir -p /root/projects/${slug}`);
    const specContent = `# ${projectName}\n\n${analysis?.vision || ''}\n\n## Features\n${(approvedFeatures || []).map((f: any) => `- ${f.name || f}: ${f.description || ''}`).join('\n')}\n\n## Pages\n${(analysis?.pages || []).map((p: any) => `- ${p.route}: ${p.purpose || p.name}`).join('\n')}`;
    require('fs').writeFileSync(`/root/projects/${slug}/SPEC.md`, specContent);
  } catch {}
  
  // Update idea status
  idea.status = 'launched';
  idea.projectId = projectId;
  idea.approvedFeatures = approvedFeatures;
  idea.skippedFeatures = skippedFeatures;
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
