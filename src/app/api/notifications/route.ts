import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const NOTIF_PATH = path.join(process.cwd(), 'data', 'notifications.json');

export async function GET() {
  try {
    const data = await fs.readFile(NOTIF_PATH, 'utf-8');
    const notifs = JSON.parse(data);
    return NextResponse.json(notifs.slice(-50)); // Last 50
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const { type, message, projectId, link } = await req.json();
  
  const notification = {
    id: Date.now().toString(),
    type, // 'task_complete' | 'file_created' | 'build_success' | 'build_fail' | 'agent_started' | 'idea_approved'
    message,
    projectId: projectId || null,
    link: link || null,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  let notifs: any[] = [];
  try { notifs = JSON.parse(await fs.readFile(NOTIF_PATH, 'utf-8')); } catch {}
  notifs.push(notification);
  if (notifs.length > 200) notifs = notifs.slice(-200);
  await fs.writeFile(NOTIF_PATH, JSON.stringify(notifs, null, 2));
  
  return NextResponse.json(notification);
}

export async function PATCH(req: Request) {
  // Mark notifications as read
  const { ids } = await req.json();
  let notifs: any[] = [];
  try { notifs = JSON.parse(await fs.readFile(NOTIF_PATH, 'utf-8')); } catch {}
  notifs = notifs.map((n: any) => ids.includes(n.id) ? { ...n, read: true } : n);
  await fs.writeFile(NOTIF_PATH, JSON.stringify(notifs, null, 2));
  return NextResponse.json({ ok: true });
}
