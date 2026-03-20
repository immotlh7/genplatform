import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8630551989';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { projectName, subdomain, framework = 'nextjs' } = await request.json();

    const slug = subdomain || projectName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || id;
    const deployUrl = `https://${slug}.gen3.ai`;

    const message = `🚀 Deploy Request\n\nProject: ${projectName || id}\nSubdomain: ${slug}\nFramework: ${framework}\nURL: ${deployUrl}\n\nRun: cd /root/${slug} && pm2 start npm --name ${slug} -- start -p 3001 && caddy reload`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
    });

    return NextResponse.json({
      success: true,
      deployUrl,
      subdomain: slug,
      message: `Deployment initiated for ${slug}.gen3.ai`
    });
  } catch (error) {
    return NextResponse.json({ error: 'Deploy failed' }, { status: 500 });
  }
}
