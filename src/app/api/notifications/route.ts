import { NextResponse } from 'next/server';
import { NotificationRepo } from '@/lib/repositories';

export async function GET() {
  return NextResponse.json(NotificationRepo.getRecent(50));
}

export async function POST(req: Request) {
  const body = await req.json();
  const notif = NotificationRepo.create(body);
  return NextResponse.json(notif);
}

export async function PATCH(req: Request) {
  const { ids } = await req.json();
  NotificationRepo.markRead(ids);
  return NextResponse.json({ ok: true });
}
