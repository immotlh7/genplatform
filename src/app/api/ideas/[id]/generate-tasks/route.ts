import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8630551989';

const DEPARTMENTS = {
  frontend: '💻 Frontend',
  backend: '⚙️ Backend',
  security: '🛡️ Security',
  qa: '🔍 QA',
  research: '🔬 Research',
  devops: '🔧 DevOps'
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ideaTitle, features = [], techStack = [] } = await request.json();

    const prompt = `📋 TASK GENERATION — ${ideaTitle}

Generate a complete task breakdown for development.
Features to implement: ${features.join(', ')}
Tech stack: ${techStack.join(', ')}

For each task provide:
- Task name
- Department: ${Object.values(DEPARTMENTS).join(' | ')}
- Priority: high/medium/low
- Estimated hours
- Dependencies (other task names)

Format as numbered list grouped by department.`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: prompt })
    });

    return NextResponse.json({ success: true, ideaId: id, message: 'Task generation request sent', departments: DEPARTMENTS });
  } catch (error) {
    return NextResponse.json({ error: 'Task generation failed' }, { status: 500 });
  }
}
