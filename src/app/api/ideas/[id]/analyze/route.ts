import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8630551989';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ideaTitle, ideaDescription } = await request.json();

    const message = `🔬 Deep Analysis Request\n\nIdea: ${ideaTitle}\nDescription: ${ideaDescription}\n\nProvide: Market size, competitors, tech feasibility, timeline, cost estimate, risk assessment, Go/No-Go recommendation.`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
    });

    return NextResponse.json({ success: true, message: 'Analysis request sent', ideaId: id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send analysis request' }, { status: 500 });
  }
}
