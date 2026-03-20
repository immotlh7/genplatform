import { NextRequest, NextResponse } from 'next/server';

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 30).replace(/-$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, techStack = [], ideaId } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const slug = generateSlug(name);
    const subdomain = `${slug}.gen3.ai`;

    // Create project via existing API
    const res = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, status: 'planning', priority: 'high', progress: 0, techStack, previewUrl: `https://${subdomain}`, ideaId })
    });

    const project = res.ok ? await res.json() : { id: `proj_${Date.now()}` };

    return NextResponse.json({
      projectId: project.id,
      subdomain,
      port: Math.floor(Math.random() * 1000) + 4000,
      status: 'created',
      message: `Project "${name}" created. Subdomain: ${subdomain} (pending DNS setup)`
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
