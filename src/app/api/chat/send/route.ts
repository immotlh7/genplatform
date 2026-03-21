import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { ProjectRepo, LogRepo, NotificationRepo } from '@/lib/repositories';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const MAX_TOOL_ITERATIONS = 10;

const PROTECTED_PATTERNS = ['sidebar.tsx', 'navbar.tsx', 'layout.tsx', 'globals.css', 'self-dev/'];

const TOOLS = [
  {
    name: 'bash',
    description: 'Run a bash command on the server. Use for: reading file lists, running builds, restarting processes, checking git log, installing packages.',
    input_schema: {
      type: 'object' as const,
      properties: {
        command: { type: 'string' as const, description: 'The bash command to execute' },
        cwd: { type: 'string' as const, description: 'Working directory (default: /root/genplatform)' },
      },
      required: ['command'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the full content of a file. Always read before modifying.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string' as const, description: 'File path relative to project root (/root/genplatform)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write or overwrite a file. Always read_file first to understand the current content.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string' as const, description: 'File path relative to project root' },
        content: { type: 'string' as const, description: 'Complete new file content' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'patch_file',
    description: 'Replace a specific string in a file. Safer than write_file for small changes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string' as const, description: 'File path relative to project root' },
        search: { type: 'string' as const, description: 'Exact string to find (must be unique in the file)' },
        replace: { type: 'string' as const, description: 'String to replace it with' },
      },
      required: ['path', 'search', 'replace'],
    },
  },
];

function isProtected(filePath: string): boolean {
  return PROTECTED_PATTERNS.some(p => filePath.includes(p));
}

async function executeTool(name: string, input: any, projectRoot: string): Promise<string> {
  if (name === 'bash') {
    const dangerous = ['rm -rf /', 'dd if=', 'mkfs', ':(){'];
    if (dangerous.some(d => input.command.includes(d))) return 'ERROR: Dangerous command blocked';
    try {
      const result = execSync(input.command, {
        cwd: input.cwd || projectRoot, timeout: 60000, encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024,
      });
      return result.toString().trim().slice(0, 10000);
    } catch (e: any) {
      return `EXIT ${e.status || 1}\nSTDOUT: ${(e.stdout || '').slice(0, 3000)}\nSTDERR: ${(e.stderr || '').slice(0, 3000)}`;
    }
  }

  if (name === 'read_file') {
    const fullPath = path.resolve(projectRoot, input.path);
    if (!fullPath.startsWith(projectRoot)) return 'ERROR: Path outside project root';
    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch { return `ERROR: File not found: ${input.path}`; }
  }

  if (name === 'write_file') {
    if (isProtected(input.path)) return `ERROR: ${input.path} is protected`;
    const fullPath = path.resolve(projectRoot, input.path);
    if (!fullPath.startsWith(projectRoot)) return 'ERROR: Path outside project root';
    try {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, input.content);
      return `SUCCESS: Written to ${input.path}`;
    } catch (e: any) { return `ERROR: ${e.message}`; }
  }

  if (name === 'patch_file') {
    if (isProtected(input.path)) return `ERROR: ${input.path} is protected`;
    const fullPath = path.resolve(projectRoot, input.path);
    if (!fullPath.startsWith(projectRoot)) return 'ERROR: Path outside project root';
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      if (!content.includes(input.search)) return `ERROR: Search string not found in ${input.path}. Use read_file first.`;
      await fs.writeFile(fullPath, content.replace(input.search, input.replace));
      return `SUCCESS: Patch applied to ${input.path}`;
    } catch (e: any) { return `ERROR: ${e.message}`; }
  }

  return `ERROR: Unknown tool: ${name}`;
}

async function buildAndRestart(projectRoot: string): Promise<{ success: boolean; output: string }> {
  try {
    const output = execSync('npm run build 2>&1', {
      cwd: projectRoot, timeout: 120000, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024,
    });
    try { execSync('pm2 reload genplatform-app', { timeout: 10000 }); } catch {}
    return { success: true, output };
  } catch (e: any) {
    return { success: false, output: e.stdout || e.stderr || e.message || '' };
  }
}

export async function POST(req: Request) {
  const { message, projectId, history, attachment } = await req.json();

  let project: any = null;
  let projectRoot = '/root/genplatform';
  if (projectId) {
    project = ProjectRepo.getById(projectId);
    if (project?.repoPath) projectRoot = project.repoPath;
  }

  const systemPrompt = buildSystemPrompt(project, projectRoot);

  const msgs: any[] = [
    ...(history || []).slice(-8).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
  ];

  if (attachment) {
    msgs.push({ role: 'user', content: `${message}\n\n---\nAttached file (${attachment.name}):\n\`\`\`\n${attachment.content.slice(0, 5000)}\n\`\`\`` });
  } else {
    msgs.push({ role: 'user', content: message });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
      };

      try {
        let currentMessages = [...msgs];
        let finalReply = '';
        let filesModified = false;

        for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
          const response = await fetch(ANTHROPIC_API, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': ANTHROPIC_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4096,
              system: systemPrompt,
              tools: TOOLS,
              messages: currentMessages,
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            send({ type: 'error', message: `API error ${response.status}: ${errText.slice(0, 200)}` });
            break;
          }

          const raw = await response.json();
          // Normalize OpenAI format (OpenClaw) to Anthropic format
          const data = raw.choices ? {
            stop_reason: raw.choices[0]?.finish_reason === 'stop' ? 'end_turn' : (raw.choices[0]?.finish_reason || 'end_turn'),
            content: [{ type: 'text', text: raw.choices[0]?.message?.content || '' }]
          } : raw;
          const content = data.content || [];
          const stopReason = data.stop_reason;

          // Extract text
          const textBlocks = content.filter((b: any) => b.type === 'text');
          if (textBlocks.length > 0) {
            const text = textBlocks.map((b: any) => b.text).join('\n');
            send({ type: 'text', text });
            finalReply = text;
          }

          if (stopReason === 'end_turn') break;

          if (stopReason === 'tool_use') {
            const toolUseBlocks = content.filter((b: any) => b.type === 'tool_use');
            currentMessages.push({ role: 'assistant', content });

            const toolResults: any[] = [];

            for (const toolCall of toolUseBlocks) {
              send({ type: 'tool_start', tool: toolCall.name, input: toolCall.input });

              const result = await executeTool(toolCall.name, toolCall.input, projectRoot);

              send({ type: 'tool_end', tool: toolCall.name, result: result.slice(0, 200) });

              if ((toolCall.name === 'write_file' || toolCall.name === 'patch_file') && result.startsWith('SUCCESS')) {
                filesModified = true;
                LogRepo.add(`Modified: ${toolCall.input.path}`, 'info', projectId);
              }

              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: result,
              });
            }

            currentMessages.push({ role: 'user', content: toolResults });
            continue;
          }

          break;
        }

        // Build if files changed
        if (filesModified) {
          send({ type: 'building', message: 'Files changed — running build...' });
          const buildResult = await buildAndRestart(projectRoot);

          if (buildResult.success) {
            send({ type: 'build_complete', message: 'Build passed — preview updated' });
            LogRepo.add('Build OK — app restarted', 'info', projectId);
          } else {
            send({ type: 'build_failed', message: 'Build failed — attempting auto-fix...' });

            // Auto-fix attempt
            const fixMessages = [
              ...currentMessages,
              { role: 'user', content: `Build failed:\n\n${buildResult.output.slice(0, 2000)}\n\nFix the error. Common causes: missing import, type error, syntax error.` },
            ];

            const fixRes = await fetch(ANTHROPIC_API, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
              body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: systemPrompt, tools: TOOLS, messages: fixMessages }),
            });

            if (fixRes.ok) {
              const fixData = await fixRes.json();
              const fixTools = (fixData.content || []).filter((b: any) => b.type === 'tool_use');
              for (const tc of fixTools) {
                const r = await executeTool(tc.name, tc.input, projectRoot);
                send({ type: 'auto_fix', tool: tc.name, result: r.slice(0, 100) });
              }
              const retry = await buildAndRestart(projectRoot);
              send(retry.success
                ? { type: 'build_complete', message: 'Auto-fix successful — build passed' }
                : { type: 'build_failed_final', message: 'Auto-fix failed. Manual intervention needed.', error: retry.output.slice(0, 500) }
              );
            }
          }
        }

        send({ type: 'done', reply: finalReply });
      } catch (err: any) {
        send({ type: 'error', message: err.message || 'Unexpected error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}

function buildSystemPrompt(project: any, projectRoot: string): string {
  const projectInfo = project ? `
ACTIVE PROJECT: ${project.name}
Repo path: ${projectRoot}
Live URL: ${project.deployUrl || 'not deployed'}
Tech stack: ${(project.techStack || []).join(', ')}` : `
No project selected. Working on GenPlatform itself.
Repo path: /root/genplatform`;

  return `You are an expert AI Engineer with DIRECT access to the server and codebase.
${projectInfo}

PROTECTED FILES — NEVER MODIFY:
- src/app/layout.tsx, sidebar.tsx, navbar.tsx, globals.css, self-dev/**

YOUR TOOLS: bash, read_file, write_file, patch_file

HOW YOU WORK:
1. User reports problem → use bash/read_file to investigate immediately
2. Show what you'll change and why
3. When user approves → execute with write_file/patch_file
4. Build automatically runs after file changes
5. If build fails → read error and fix automatically

RULES:
- ALWAYS read_file before modifying
- Never modify protected files
- Report every file you modify
- Respond in user's language (Arabic or English)`;
}
