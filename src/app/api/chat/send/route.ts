import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = '/root/genplatform';
const PROTECTED = ['sidebar.tsx', 'navbar.tsx', 'layout.tsx', 'globals.css'];

async function readFile(filePath: string): Promise<string> {
  const full = path.join(PROJECT_ROOT, filePath);
  if (!full.startsWith(PROJECT_ROOT)) return 'ERROR: Invalid path';
  try { return await fs.readFile(full, 'utf-8'); } catch { return 'ERROR: File not found'; }
}

async function writeFile(filePath: string, content: string): Promise<string> {
  if (PROTECTED.some(p => filePath.includes(p))) return 'ERROR: Protected file';
  if (filePath.includes('self-dev')) return 'ERROR: Protected directory';
  const full = path.join(PROJECT_ROOT, filePath);
  if (!full.startsWith(PROJECT_ROOT)) return 'ERROR: Invalid path';
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content);
  return 'SUCCESS: File written';
}

function runBash(cmd: string): string {
  const blocked = ['rm -rf /', 'dd if=', 'mkfs', 'rm -rf .next'];
  if (blocked.some(d => cmd.includes(d))) return 'ERROR: Blocked command';
  try { return execSync(cmd, { cwd: PROJECT_ROOT, timeout: 30000, encoding: 'utf-8' }).substring(0, 2000); }
  catch (e: any) { return `ERROR: ${(e.message || '').substring(0, 500)}`; }
}

export async function POST(req: NextRequest) {
  try {
    const { message, projectId, history } = await req.json();

    const systemPrompt = `You are an AI Engineer with DIRECT server access to ${PROJECT_ROOT}.
Tools: bash, read_file, write_file.
PROTECTED — never modify: ${PROTECTED.join(', ')}, self-dev/**
When user reports problem → read_file → find issue → show fix → ask approval.
When user says yes/نعم/apply → write_file → bash "npm run build" → bash "pm2 reload genplatform-app".
Respond in user's language.`;

    let currentMessages = [...(history || []).slice(-8), { role: 'user', content: message }];
    let finalReply = '';

    const tools = [
      { name: 'bash', description: 'Run bash command', input_schema: { type: 'object' as const, properties: { command: { type: 'string' as const } }, required: ['command'] } },
      { name: 'read_file', description: 'Read file', input_schema: { type: 'object' as const, properties: { path: { type: 'string' as const } }, required: ['path'] } },
      { name: 'write_file', description: 'Write file', input_schema: { type: 'object' as const, properties: { path: { type: 'string' as const }, content: { type: 'string' as const } }, required: ['path', 'content'] } },
    ];

    for (let i = 0; i < 6; i++) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens: 4096, system: systemPrompt, tools, messages: currentMessages })
      });

      const data = await response.json();

      if (data.stop_reason === 'end_turn' || !data.stop_reason) {
        finalReply = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
        break;
      }

      if (data.stop_reason === 'tool_use') {
        currentMessages.push({ role: 'assistant', content: data.content });
        const results: any[] = [];
        for (const block of (data.content || []).filter((b: any) => b.type === 'tool_use')) {
          let result = '';
          if (block.name === 'bash') result = runBash(block.input.command);
          if (block.name === 'read_file') result = await readFile(block.input.path);
          if (block.name === 'write_file') result = await writeFile(block.input.path, block.input.content);
          results.push({ type: 'tool_result', tool_use_id: block.id, content: result.substring(0, 3000) });
        }
        currentMessages.push({ role: 'user', content: results });
      }
    }

    return NextResponse.json({ reply: finalReply || 'تم.' });
  } catch (e: any) {
    return NextResponse.json({ reply: `خطأ: ${e.message}` }, { status: 500 });
  }
}
