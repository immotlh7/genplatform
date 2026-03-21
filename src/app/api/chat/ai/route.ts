import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { callWithRotation } from '@/lib/account-rotation';

const PROTECTED_FILES = ['src/app/layout.tsx', 'src/components/layout/sidebar.tsx', 'src/components/layout/navbar.tsx', 'src/app/globals.css'];

export async function POST(req: NextRequest) {
  try {
    const { message, projectContext, conversationHistory = [] } = await req.json();

    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const ctx = projectContext || {};
    const systemPrompt = `You are an expert AI Engineer working on ${ctx.name || 'a project'}.

PROJECT: ${ctx.name || 'GenPlatform.ai'}
PATH: ${ctx.path || '/root/genplatform'}
URL: ${ctx.url || 'https://app.gen3.ai'}
TECH: Next.js 16, TypeScript, Tailwind, shadcn/ui

PROTECTED FILES (NEVER modify):
${PROTECTED_FILES.join('\n')}

When user reports a problem:
1. Explain what you understand
2. Show exact file + code changes needed
3. Ask: "Should I apply this?"

When user says yes/apply/نعم/طبق:
1. Provide the bash script to execute
2. End with: npm run build && pm2 reload genplatform-app

Respond in the same language the user uses.`;

    const messages = [
      ...(conversationHistory || []).slice(-10),
      { role: 'user' as const, content: message }
    ];

    const response = await callWithRotation(async (apiKey) => {
      const client = new Anthropic({ apiKey });
      return await client.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 3000,
        system: systemPrompt,
        messages,
      });
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({ reply, role: 'assistant' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, reply: 'حدث خطأ. حاول مرة أخرى.' }, { status: 500 });
  }
}
