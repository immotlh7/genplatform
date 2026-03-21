import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CONTENT_PATH = path.join(process.cwd(), 'data', 'pipeline-content.json');

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const content = JSON.parse(await fs.readFile(CONTENT_PATH, 'utf-8'));
    return NextResponse.json(content[id] || content['genplatform-ai'] || {});
  } catch {
    return NextResponse.json({});
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { stage, data } = await req.json();
  try {
    let content: any = {};
    try { content = JSON.parse(await fs.readFile(CONTENT_PATH, 'utf-8')); } catch {}
    if (!content[id]) content[id] = {};
    content[id][stage] = { ...content[id][stage], ...data };
    await fs.writeFile(CONTENT_PATH, JSON.stringify(content, null, 2));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
