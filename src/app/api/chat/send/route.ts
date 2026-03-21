import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const GATEWAY_URL = 'http://127.0.0.1:18789/v1/chat/completions';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || 'bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df';
const DATA_DIR = path.join(process.cwd(), 'data');

async function loadProjectContext(projectId: string): Promise<string> {
  if (!projectId) return '';
  
  try {
    // Load project data
    const projectsData = await fs.readFile(path.join(DATA_DIR, 'projects.json'), 'utf-8');
    const projects = JSON.parse(projectsData);
    const project = projects.find((p: any) => p.id === projectId);
    
    if (!project) return '';

    let context = `\n\n## Current Project Context\n`;
    context += `Project: ${project.name}\n`;
    if (project.description) context += `Description: ${project.description}\n`;
    if (project.techStack) context += `Tech Stack: ${Array.isArray(project.techStack) ? project.techStack.join(', ') : project.techStack}\n`;
    if (project.repoPath || project.path) context += `Repo Path: ${project.repoPath || project.path}\n`;
    if (project.deployUrl) context += `Deploy URL: ${project.deployUrl}\n`;
    if (project.previewUrl) context += `Preview URL: ${project.previewUrl}\n`;
    if (project.status) context += `Status: ${project.status}\n`;
    
    // Load recent tasks for this project
    try {
      const tasksData = await fs.readFile(path.join(DATA_DIR, 'tasks.json'), 'utf-8');
      const allTasks = JSON.parse(tasksData);
      const projectTasks = allTasks
        .filter((t: any) => t.projectId === projectId)
        .slice(-10);
      
      if (projectTasks.length > 0) {
        context += `\nRecent Tasks (${projectTasks.length}):\n`;
        projectTasks.forEach((t: any) => {
          context += `- [${t.status || 'unknown'}] ${t.title || t.name}\n`;
        });
      }
    } catch {}

    return context;
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Support both formats: { message: { content } } and { message: "text" }
    let userMessage = '';
    let sessionId = 'web-chat-default';
    let projectId = '';
    
    if (typeof body.message === 'string') {
      userMessage = body.message;
    } else if (body.message?.content) {
      userMessage = body.message.content;
    }
    
    if (!userMessage.trim()) {
      return NextResponse.json({ 
        success: false, 
        message: { id: Date.now().toString(), content: 'رسالة فارغة', role: 'assistant', timestamp: new Date().toISOString(), type: 'message' }
      });
    }

    // Extract context
    projectId = body.context?.projectId || body.projectId || '';
    if (body.context?.sessionId) {
      sessionId = body.context.sessionId;
    }

    // Build project context for system message
    const projectContext = await loadProjectContext(projectId);

    // Build conversation history
    const previousMessages = (body.context?.previousMessages || body.history || [])
      .filter((m: any) => m.content && m.role)
      .slice(-10)
      .map((m: any) => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      }));

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    
    // Add project context as system message if available
    if (projectContext) {
      messages.push({
        role: 'system',
        content: `The user is working within a specific project context. Use this information when relevant:${projectContext}\n\nProtected files (NEVER modify): sidebar.tsx, navbar.tsx, layout.tsx, globals.css, self-dev/**`
      });
    }

    messages.push(...previousMessages);
    messages.push({ role: 'user', content: userMessage });

    // Call OpenClaw Gateway
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
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenClaw Gateway error:', response.status, errorText);
      return NextResponse.json({
        success: false,
        message: {
          id: Date.now().toString(),
          content: `خطأ في الاتصال بالـ Gateway (${response.status})`,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          type: 'message'
        }
      }, { status: 500 });
    }

    const data = await response.json();
    const replyContent = data.choices?.[0]?.message?.content || 'لا يوجد رد';

    return NextResponse.json({
      success: true,
      reply: replyContent,
      message: {
        id: data.id || Date.now().toString(),
        content: replyContent,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        type: 'message',
        metadata: {
          model: data.model,
          via: 'openclaw-gateway',
          projectId,
          usage: data.usage
        }
      }
    });

  } catch (e: any) {
    console.error('Chat send error:', e);
    return NextResponse.json({
      success: false,
      reply: `خطأ: ${e.message}`,
      message: {
        id: Date.now().toString(),
        content: `خطأ: ${e.message}`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        type: 'message'
      }
    }, { status: 500 });
  }
}
