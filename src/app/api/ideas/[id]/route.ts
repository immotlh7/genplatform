import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const IDEAS_DIR = '/root/genplatform/data/ideas';

async function ensureDir() {
  await fs.mkdir(IDEAS_DIR, { recursive: true });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await ensureDir();
    const data = JSON.parse(await fs.readFile(path.join(IDEAS_DIR, `${id}.json`), 'utf-8'));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await ensureDir();
    const body = await req.json();
    const filePath = path.join(IDEAS_DIR, `${id}.json`);
    const existing = await fs.readFile(filePath, 'utf-8').then(JSON.parse).catch(() => ({ id }));
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await fs.unlink(path.join(IDEAS_DIR, `${id}.json`));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
