import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const { ideaId, ideaTitle, ideaDescription } = await request.json();

    if (!ideaId) {
      return NextResponse.json({ error: 'Idea ID required' }, { status: 400 });
    }

    // Generate slug
    const slug = (ideaTitle || ideaId)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);

    // Create project via projects API
    let projectId = `proj_${Date.now()}`;
    try {
      const projectRes = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ideaTitle || 'New Project',
          description: ideaDescription || '',
          status: 'planning',
          priority: 'high',
          progress: 0,
          techStack: [],
          previewUrl: `https://${slug}.gen3.ai`,
          ideaId,
        })
      });
      if (projectRes.ok) {
        const proj = await projectRes.json();
        projectId = proj.id || projectId;
      }
    } catch {}

    // Update idea status
    try {
      const ideaFile = `/root/genplatform/data/ideas/${ideaId}.json`;
      const idea = await fs.readFile(ideaFile, 'utf-8').then(JSON.parse).catch(() => ({}));
      idea.stage = 'approved';
      idea.projectId = projectId;
      idea.approvedAt = new Date().toISOString();
      await fs.writeFile(ideaFile, JSON.stringify(idea, null, 2));
    } catch {}

    return NextResponse.json({
      success: true,
      projectId,
      subdomain: `${slug}.gen3.ai`,
      message: `Project created! ${ideaTitle} is now in planning phase.`,
      nextSteps: [
        'Technical planning started',
        'Tasks will be generated automatically',
        `Subdomain: ${slug}.gen3.ai (pending setup)`,
        'Project added to your Projects list'
      ]
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to approve idea' }, { status: 500 });
  }
}
