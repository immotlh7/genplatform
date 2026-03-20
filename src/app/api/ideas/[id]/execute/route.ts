import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ideaTitle, ideaDescription, tasks } = await request.json();

    // Create project from idea
    const projectRes = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: ideaTitle,
        description: ideaDescription,
        status: 'active',
        priority: 'high',
        progress: 0,
        techStack: []
      })
    });

    const project = projectRes.ok ? await projectRes.json() : { id: `idea-${id}` };

    // Create tasks if provided
    let taskCount = 0;
    if (tasks && Array.isArray(tasks)) {
      for (const task of tasks.slice(0, 20)) {
        await fetch('http://localhost:3000/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...task, projectId: project.id })
        }).catch(() => {});
        taskCount++;
      }
    }

    return NextResponse.json({ success: true, projectId: project.id, taskCount });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to execute idea' }, { status: 500 });
  }
}
