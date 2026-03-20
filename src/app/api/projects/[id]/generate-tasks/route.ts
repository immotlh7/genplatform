import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { callWithRotation } from '@/lib/account-rotation';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { projectName, description, features, techStack } = await req.json();

  try {
    const response = await callWithRotation(async (apiKey) => {
      const client = new Anthropic({ apiKey });
      return await client.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 3000,
        system: 'You are a project manager. Generate a detailed task breakdown. Return ONLY valid JSON array.',
        messages: [{
          role: 'user',
          content: `Project: ${projectName}\nDescription: ${description}\nFeatures: ${JSON.stringify(features)}\nTech: ${JSON.stringify(techStack)}\n\nReturn ONLY this JSON (no other text):\n[{"title":"...","description":"...","department":"frontend|backend|devops|qa|security","priority":"high|medium|low","estimatedHours":N,"phase":"mvp|core|advanced","dependencies":[]}]`
        }]
      });
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const tasks = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // Save tasks
    const TASKS_FILE = '/root/genplatform/data/project-tasks.json';
    let allTasks = [];
    try { allTasks = JSON.parse(await fs.readFile(TASKS_FILE, 'utf-8')); } catch {}

    const newTasks = tasks.map((t: any, i: number) => ({
      id: `task_${id}_${Date.now()}_${i}`,
      projectId: id,
      status: 'backlog',
      createdAt: new Date().toISOString(),
      ...t,
    }));

    allTasks.push(...newTasks);
    await fs.mkdir(path.dirname(TASKS_FILE), { recursive: true });
    await fs.writeFile(TASKS_FILE, JSON.stringify(allTasks, null, 2));

    return NextResponse.json({ tasks: newTasks, count: newTasks.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, tasks: [] }, { status: 500 });
  }
}
