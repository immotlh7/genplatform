import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8630551989';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ideaTitle, techStack = [] } = await request.json();

    const prompt = `📐 ARCHITECTURE PLAN — ${ideaTitle}

Design the technical architecture:
1. System components and their interactions
2. Database schema (main tables)
3. API endpoints list
4. Frontend pages/routes
5. Infrastructure setup (server, CDN, storage)
6. Development phases with timeline
7. Team structure needed

Tech stack: ${techStack.join(', ') || 'To be determined'}`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: prompt })
    });

    return NextResponse.json({ success: true, ideaId: id, message: 'Architecture planning request sent' });
  } catch (error) {
    return NextResponse.json({ error: 'Architecture planning failed' }, { status: 500 });
  }
}
