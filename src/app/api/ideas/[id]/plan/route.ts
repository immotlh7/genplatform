import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8630551989';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ideaTitle } = await request.json();

    const message = `📋 Development Plan Request\n\nIdea: ${ideaTitle}\n\nCreate detailed plan: Phase 1 (MVP), Phase 2 (Core), Phase 3 (Advanced). For each phase: task name, department, estimated hours, dependencies.`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
    });

    return NextResponse.json({ success: true, message: 'Plan request sent', ideaId: id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to request plan' }, { status: 500 });
  }
}
