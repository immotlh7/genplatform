import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const GATEWAY_URL = 'http://127.0.0.1:18789/v1/chat/completions';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || 'bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df';
const DATA_DIR = path.join(process.cwd(), 'data');

async function loadProjectContext(projectId: string): Promise<string> {
  if (!projectId) return '';
  try {
    const projectsData = await fs.readFile(path.join(DATA_DIR, 'projects.json'), 'utf-8');
    const projects = JSON.parse(projectsData);
    const project = projects.find((p: any) => p.id === projectId);
    if (!project) return '';
    let ctx = `Project: ${project.name}`;
    if (project.techStack) ctx += ` | Tech: ${Array.isArray(project.techStack) ? project.techStack.join(', ') : project.techStack}`;
    if (project.repoPath || project.path) ctx += ` | Path: ${project.repoPath || project.path}`;
    return ctx;
  } catch { return ''; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let userMessage = '';
    let sessionId = 'web-chat-default';
    let projectId = '';

    if (typeof body.message === 'string') {
      userMessage = body.message;
    } else if (body.message?.content) {
      userMessage = body.message.content;
    }

    if (!userMessage.trim()) {
      return new Response('data: {"error":"empty message"}\n\ndata: [DONE]\n\n', {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
      });
    }

    projectId = body.context?.projectId || body.projectId || '';
    if (body.context?.sessionId) sessionId = body.context.sessionId;

    const projectContext = await loadProjectContext(projectId);

    const previousMessages = (body.context?.previousMessages || body.history || [])
      .filter((m: any) => m.content && m.role)
      .slice(-10)
      .map((m: any) => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      }));

    const messages: { role: string; content: string }[] = [];
    if (projectContext) {
      messages.push({ role: 'system', content: `Project context: ${projectContext}\nProtected files: sidebar.tsx, navbar.tsx, layout.tsx, globals.css, self-dev/**` });
    }
    messages.push(...previousMessages);
    messages.push({ role: 'user', content: userMessage });

    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        'x-openclaw-agent-id': 'main',
        'x-openclaw-session-key': `web:${sessionId}`
      },
      body: JSON.stringify({
        model: 'openclaw',
        messages,
        user: sessionId,
        stream: true
      })
    });

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => 'Gateway error');
      return new Response(`data: {"error":"Gateway ${response.status}: ${errText}"}\n\ndata: [DONE]\n\n`, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
      });
    }

    // Pipe the SSE stream from Gateway directly to client
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      } catch {} finally {
        await writer.close().catch(() => {});
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (e: any) {
    return new Response(`data: {"error":"${e.message}"}\n\ndata: [DONE]\n\n`, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
    });
  }
}
