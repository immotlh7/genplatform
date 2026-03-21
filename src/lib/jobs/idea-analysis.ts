import { registerHandler } from '../queue';
import { IdeaRepo, TaskRepo, ProjectRepo, PipelineRepo, LogRepo } from '../repositories';

const GATEWAY = 'http://127.0.0.1:18789/v1/chat/completions';
const TOKEN   = 'bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df';

async function callGateway(prompt: string, maxTokens = 4000): Promise<string> {
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      model: 'claude',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Gateway error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function safeJSON(text: string, fallback: any = null): any {
  try { return JSON.parse(text.replace(/```json|```/g, '').trim()); }
  catch { return fallback || { raw: text }; }
}

// ─── HANDLER: analyze-idea ──────────────────────────────────────
registerHandler('analyze-idea', async (job, update) => {
  const { ideaId, ideaText } = job.payload;

  update(5, 'Starting deep research...');
  const research = await callGateway(
    `Use skill: research-idea\n\nIdea: ${ideaText}\n\nReturn detailed JSON analysis.`,
    3000
  );

  update(25, 'Analyzing the market...');
  const market = await callGateway(
    `Use skill: product-strategy\n\nIdea: ${ideaText}\nResearch: ${research}\n\nReturn market analysis JSON.`,
    3000
  );

  update(45, 'Building strategic plan...');
  const strategy = await callGateway(
    `Use skill: product-strategist\n\nIdea: ${ideaText}\nMarket: ${market}\n\nReturn strategic plan JSON.`,
    3000
  );

  update(65, 'Specifying features...');
  const features = await callGateway(
    `Use skill: feature-specification\n\nIdea: ${ideaText}\nStrategy: ${strategy}\n\nReturn feature specifications JSON.`,
    3000
  );

  update(80, 'Generating full project vision...');

  const expansionPrompt = `You are an expert product visionary.
Idea: "${ideaText}"
Research context: ${research.slice(0, 500)}
Strategy: ${strategy.slice(0, 500)}

Generate a COMPLETE project vision. Be exhaustive.
Return ONLY valid JSON with this structure:
{
  "projectName": "string",
  "tagline": "string",
  "vision": "string",
  "coreFeatures": [{ "id": "F001", "name": "string", "description": "string", "impact": "high|medium|low", "complexity": "low|medium|high", "aiTools": [], "pages": [] }],
  "suggestedAdditions": [{ "id": "A001", "name": "string", "description": "string", "impact": "high|medium|low" }],
  "pages": [{ "id": "P001", "name": "string", "route": "string", "purpose": "string", "components": [], "wireframeDescription": "string" }],
  "agents": [{ "name": "string", "role": "string", "triggers": "string" }],
  "techStack": { "frontend": { "framework": "string", "why": "string" }, "backend": { "framework": "string", "why": "string" }, "database": { "type": "string", "why": "string" }, "aiModels": [{ "name": "string", "useCase": "string", "cost": "string" }] },
  "competitors": [{ "name": "string", "strengths": "string", "weaknesses": "string", "ourAdvantage": "string" }],
  "financials": { "monthlyCosts": { "hosting": "string", "ai": "string", "total": "string" }, "revenueModel": "string" },
  "phases": [{ "name": "string", "duration": "string", "goal": "string", "features": [] }],
  "risks": [{ "risk": "string", "probability": "low|medium|high", "mitigation": "string" }],
  "marketOpportunity": { "tam": "string", "sam": "string", "som": "string", "summary": "string" }
}`;

  const expansion = await callGateway(expansionPrompt, 8000);
  const expandedData = safeJSON(expansion);

  update(95, 'Saving analysis...');

  const analysis = {
    research: safeJSON(research),
    market: safeJSON(market),
    strategy: safeJSON(strategy),
    features: safeJSON(features),
    expanded: expandedData,
  };

  IdeaRepo.update(ideaId, { status: 'analyzed', analysis });

  update(100, 'Analysis complete');
  return { ideaId, analysis: expandedData };
});

// ─── HANDLER: launch-project ────────────────────────────────────
registerHandler('launch-project', async (job, update) => {
  const { ideaId, approvedFeatures, projectName, techStack } = job.payload;

  update(5, 'Generating project specification...');
  const specPrompt = `Use skill: spec-first-dev

Generate a complete SPEC.md for this project:
Project: ${projectName}
Approved Features: ${JSON.stringify(approvedFeatures)}
Tech Stack: ${JSON.stringify(techStack)}

The SPEC must be detailed enough that any developer can build the entire project from it.
Include: overview, tech stack, file structure, each page (purpose + components + data),
all API endpoints, database schema, environment variables.`;

  const spec = await callGateway(specPrompt, 8000);

  update(35, 'Breaking down into tasks...');
  const taskPrompt = `Use skill: task-decomp

Break this project into maximum granularity development tasks.
No limit on count. Each task must be doable in 1-8 hours.

SPEC:
${spec.slice(0, 3000)}

Return JSON array only:
[{ "id": "T001", "title": "string", "description": "string", "department": "Frontend|Backend|Database|AI|DevOps|QA|Security", "priority": "critical|high|medium|low", "estimatedHours": 4, "dependencies": [], "acceptanceCriteria": [] }]`;

  const tasksRaw = await callGateway(taskPrompt, 8000);
  let taskList: any[] = [];
  try {
    const parsed = JSON.parse(tasksRaw.replace(/```json|```/g, '').trim());
    taskList = Array.isArray(parsed) ? parsed : parsed.tasks || [];
  } catch {
    taskList = tasksRaw.split('\n')
      .filter((l: string) => l.match(/^[\-\*\d]/))
      .map((l: string, i: number) => ({
        id: `T${String(i + 1).padStart(3, '0')}`,
        title: l.replace(/^[\-\*\d\.\s]+/, '').trim(),
        department: 'Frontend',
        priority: 'medium',
        estimatedHours: 4,
      }));
  }

  update(65, `Creating project with ${taskList.length} tasks...`);

  const slug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);
  const projectId = `${slug}-${Date.now()}`;

  const project = ProjectRepo.create({
    id: projectId,
    name: projectName,
    slug,
    description: approvedFeatures[0]?.description || '',
    status: 'active',
    color: `hsl(${Math.floor(Math.random() * 360)}, 60%, 50%)`,
    techStack: techStack || [],
    deployUrl: `https://${slug}.gen3.ai`,
    subdomain: slug,
    repoPath: `/root/projects/${slug}`,
    pipeline: {
      idea: { status: 'done' },
      analysis: { status: 'done' },
      planning: { status: 'done' },
      development: { status: 'active', total: taskList.length, completed: 0 },
      review: { status: 'pending' },
      security: { status: 'pending' },
      deploy: { status: 'pending', liveUrl: `https://${slug}.gen3.ai` },
    },
    spec,
    ideaId,
  });

  update(80, 'Saving tasks to database...');

  const formattedTasks = taskList.map((t: any, i: number) => ({
    id: `${projectId}-${t.id || 'T' + String(i + 1).padStart(3, '0')}`,
    projectId,
    title: t.title || `Task ${i + 1}`,
    description: t.description || '',
    status: 'planned',
    department: t.department || 'Frontend',
    priority: t.priority || 'medium',
    agentId: mapAgent(t.department),
    estimatedHours: t.estimatedHours || 4,
    dependencies: t.dependencies || [],
    acceptanceCriteria: t.acceptanceCriteria || [],
  }));

  TaskRepo.bulkCreate(formattedTasks);

  update(90, 'Setting up project directory...');
  try {
    const { execSync } = require('child_process');
    execSync(`mkdir -p /root/projects/${slug}`);
    require('fs').writeFileSync(`/root/projects/${slug}/SPEC.md`, spec);
  } catch {}

  IdeaRepo.update(ideaId, { status: 'launched', projectId });
  LogRepo.add(`Project "${projectName}" created with ${formattedTasks.length} tasks`, 'info', projectId);

  update(100, 'Project created');
  return { projectId, slug, taskCount: formattedTasks.length, deployUrl: project.deployUrl };
});

function mapAgent(dept: string): string {
  if (!dept) return 'main';
  const d = dept.toLowerCase();
  if (d.includes('frontend') || d.includes('ui') || d.includes('react')) return 'frontend-dev';
  if (d.includes('backend') || d.includes('api') || d.includes('server') || d.includes('database')) return 'backend-dev';
  return 'main';
}
