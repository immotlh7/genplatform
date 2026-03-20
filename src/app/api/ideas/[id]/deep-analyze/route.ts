import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8630551989';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ideaTitle, ideaDescription } = await request.json();

    const prompt = `🔬 DEEP ANALYSIS — Idea: ${ideaTitle}
Description: ${ideaDescription}

Provide analysis:
- Market size and competitors (top 3)
- Technical feasibility (1-10)
- Recommended tech stack
- Estimated dev time and cost
- MVP features list
- GO or NO-GO recommendation

Reply with structured analysis.`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: prompt })
    });

    // Save analysis request to disk
    const analysisId = `analysis_${id}_${Date.now()}`;
    await fs.mkdir('/root/genplatform/data/analyses', { recursive: true });
    await fs.writeFile(
      `/root/genplatform/data/analyses/${analysisId}.json`,
      JSON.stringify({ ideaId: id, ideaTitle, status: 'pending', requestedAt: new Date().toISOString() }, null, 2)
    );

    return NextResponse.json({ success: true, analysisId, message: 'Deep analysis request sent' });
  } catch (error) {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dir = '/root/genplatform/data/analyses';
    const files = await fs.readdir(dir).catch(() => []);
    const analysisFile = files.find(f => f.startsWith(`analysis_${id}_`));
    
    if (!analysisFile) {
      return NextResponse.json({ status: 'not_found' });
    }

    const data = JSON.parse(await fs.readFile(`${dir}/${analysisFile}`, 'utf-8'));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: 'error' });
  }
}
