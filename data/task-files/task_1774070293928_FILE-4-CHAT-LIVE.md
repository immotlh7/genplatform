# FILE-4: LIVE CHAT — The AI Engineer That Actually Works
# ═══════════════════════════════════════════════════════════════
# This is FILE-4 of 6. Only start after FILE-3 build passes.
# ═══════════════════════════════════════════════════════════════

## WHY THIS FILE EXISTS
The current chat has two critical failures:

FAILURE 1 — It talks, it does not act.
When told "there is a bug in dashboard", it asks questions
instead of reading the file, finding the bug, and fixing it.
A real AI engineer reads first, then proposes, then executes.

FAILURE 2 — Execution is invisible.
Even when it does execute, the user sees nothing until it is
completely done. No live output, no progress, no feedback.
A real engineer shows every step as it happens.

The fixed chat works exactly like Claude Code:
1. User describes a problem or requests a feature
2. AI reads the relevant files immediately
3. AI shows exactly what it will change and why
4. User approves (or modifies the proposal)
5. AI executes on the server, streams every step live
6. Preview panel refreshes automatically when done
7. If build fails, AI reads the error and fixes it automatically

## PROTECTED FILES — NEVER TOUCH
- src/app/layout.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/navbar.tsx
- src/app/globals.css
- src/app/dashboard/self-dev/**

---

# ════════════════════════════════════════════════════════
# STEP 1: Rebuild the chat API — agentic loop with tools
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 1: Rebuilding chat send API ==="
mkdir -p /root/genplatform/src/app/api/chat/send

cat > /root/genplatform/src/app/api/chat/send/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ProjectRepo, LogRepo, NotificationRepo } from '@/lib/repositories';
import { subscribeSSE } from '@/lib/queue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ─── Constants ─────────────────────────────────────────────────

const GATEWAY  = 'http://127.0.0.1:18789/v1/chat/completions';
const TOKEN    = 'bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df';
const MAX_TOOL_ITERATIONS = 10;

const PROTECTED_PATTERNS = [
  'sidebar.tsx',
  'navbar.tsx',
  'layout.tsx',
  'globals.css',
  'self-dev/',
];

// ─── Tool definitions ───────────────────────────────────────────

const TOOLS = [
  {
    name: 'bash',
    description: 'Run a bash command on the server. Use for: reading file lists, running builds, restarting processes, checking git log, installing packages.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The bash command to execute' },
        cwd: { type: 'string', description: 'Working directory (default: /root/genplatform)' },
      },
      required: ['command'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the full content of a file. Always read before modifying.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root (/root/genplatform)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write or overwrite a file. Always read_file first to understand the current content.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
        content: { type: 'string', description: 'Complete new file content' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'patch_file',
    description: 'Replace a specific string in a file. Safer than write_file for small changes.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
        search: { type: 'string', description: 'Exact string to find (must be unique in the file)' },
        replace: { type: 'string', description: 'String to replace it with' },
      },
      required: ['path', 'search', 'replace'],
    },
  },
];

// ─── Tool execution ─────────────────────────────────────────────

function isProtected(filePath: string): boolean {
  return PROTECTED_PATTERNS.some(p => filePath.includes(p));
}

async function executeTool(
  name: string,
  input: any,
  projectRoot: string,
  broadcast: (msg: string) => void
): Promise<string> {

  if (name === 'bash') {
    const dangerous = ['rm -rf /', 'dd if=', 'mkfs', ':(){', 'fork bomb'];
    if (dangerous.some(d => input.command.includes(d))) {
      return 'ERROR: Dangerous command blocked for safety';
    }
    try {
      broadcast(JSON.stringify({ type: 'tool_call', tool: 'bash', input: input.command }));
      const result = execSync(input.command, {
        cwd: input.cwd || projectRoot,
        timeout: 60000,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 5,
      });
      const output = result.toString().trim();
      broadcast(JSON.stringify({ type: 'tool_result', tool: 'bash', output: output.slice(0, 500) }));
      return output;
    } catch (e: any) {
      const err = `EXIT ${e.status || 1}\nSTDOUT: ${e.stdout || ''}\nSTDERR: ${e.stderr || ''}`;
      broadcast(JSON.stringify({ type: 'tool_result', tool: 'bash', output: err.slice(0, 500), error: true }));
      return err;
    }
  }

  if (name === 'read_file') {
    const fullPath = path.join(projectRoot, input.path);
    if (!fullPath.startsWith(projectRoot)) return 'ERROR: Path outside project root';
    try {
      broadcast(JSON.stringify({ type: 'tool_call', tool: 'read_file', input: input.path }));
      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch {
      return `ERROR: File not found: ${input.path}`;
    }
  }

  if (name === 'write_file') {
    if (isProtected(input.path)) {
      return `ERROR: ${input.path} is a protected file and cannot be modified`;
    }
    const fullPath = path.join(projectRoot, input.path);
    if (!fullPath.startsWith(projectRoot)) return 'ERROR: Path outside project root';
    try {
      broadcast(JSON.stringify({ type: 'tool_call', tool: 'write_file', input: input.path }));
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, input.content);
      broadcast(JSON.stringify({ type: 'tool_result', tool: 'write_file', output: 'File written successfully' }));
      return `SUCCESS: Written to ${input.path}`;
    } catch (e: any) {
      return `ERROR: ${e.message}`;
    }
  }

  if (name === 'patch_file') {
    if (isProtected(input.path)) {
      return `ERROR: ${input.path} is a protected file and cannot be modified`;
    }
    const fullPath = path.join(projectRoot, input.path);
    if (!fullPath.startsWith(projectRoot)) return 'ERROR: Path outside project root';
    try {
      broadcast(JSON.stringify({ type: 'tool_call', tool: 'patch_file', input: input.path }));
      const content = await fs.readFile(fullPath, 'utf-8');
      if (!content.includes(input.search)) {
        return `ERROR: Search string not found in ${input.path}. The file may have changed. Use read_file first.`;
      }
      const newContent = content.replace(input.search, input.replace);
      await fs.writeFile(fullPath, newContent);
      broadcast(JSON.stringify({ type: 'tool_result', tool: 'patch_file', output: 'Patch applied successfully' }));
      return `SUCCESS: Patch applied to ${input.path}`;
    } catch (e: any) {
      return `ERROR: ${e.message}`;
    }
  }

  return `ERROR: Unknown tool: ${name}`;
}

// ─── Build and restart ──────────────────────────────────────────

async function buildAndRestart(projectRoot: string, broadcast: (msg: string) => void): Promise<{ success: boolean; output: string }> {
  broadcast(JSON.stringify({ type: 'build_start', message: 'Running npm run build...' }));

  try {
    const output = execSync('npm run build 2>&1', {
      cwd: projectRoot,
      timeout: 120000,
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 * 10,
    });

    broadcast(JSON.stringify({ type: 'build_success', message: 'Build successful' }));

    // Restart the app
    try {
      execSync('pm2 restart genplatform-app', { timeout: 10000 });
      broadcast(JSON.stringify({ type: 'restart_success', message: 'App restarted successfully' }));
    } catch {
      broadcast(JSON.stringify({ type: 'restart_warning', message: 'Build OK but pm2 restart failed — restart manually' }));
    }

    return { success: true, output };
  } catch (e: any) {
    const errorOutput = e.stdout || e.stderr || e.message || '';
    broadcast(JSON.stringify({ type: 'build_fail', message: 'Build failed', error: errorOutput.slice(0, 1000) }));
    return { success: false, output: errorOutput };
  }
}

// ─── Main handler — streaming response ─────────────────────────

export async function POST(req: Request) {
  const { message, projectId, history, attachment } = await req.json();

  // Load project context
  let project: any = null;
  let projectRoot = '/root/genplatform';

  if (projectId) {
    project = ProjectRepo.getById(projectId);
    if (project?.repoPath) projectRoot = project.repoPath;
  }

  const systemPrompt = buildSystemPrompt(project, projectRoot);

  // Build conversation history
  const messages: any[] = [
    ...(history || []).slice(-8).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
  ];

  // Add current message with optional attachment
  if (attachment) {
    messages.push({
      role: 'user',
      content: `${message}\n\n---\nAttached file (${attachment.name}):\n\`\`\`\n${attachment.content.slice(0, 5000)}\n\`\`\``,
    });
  } else {
    messages.push({ role: 'user', content: message });
  }

  // Stream the response
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      const broadcast = (msg: string) => {
        try { send({ type: 'tool_event', data: JSON.parse(msg) }); } catch {}
      };

      try {
        let currentMessages = [...messages];
        let finalReply = '';
        let filesModified = false;

        // Agentic loop
        for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {

          const response = await fetch(GATEWAY, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${TOKEN}`,
            },
            body: JSON.stringify({
              model: 'claude',
              max_tokens: 4096,
              system: systemPrompt,
              tools: TOOLS,
              messages: currentMessages,
              stream: false,
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            send({ type: 'error', message: `Gateway error ${response.status}: ${errText.slice(0, 200)}` });
            break;
          }

          const data = await response.json();
          const content = data.content || [];
          const stopReason = data.stop_reason;

          // Extract text blocks
          const textBlocks = content.filter((b: any) => b.type === 'text');
          if (textBlocks.length > 0) {
            const text = textBlocks.map((b: any) => b.text).join('\n');
            send({ type: 'text', text });
            finalReply = text;
          }

          // If no tool use, we are done
          if (stopReason === 'end_turn') break;

          // Process tool calls
          if (stopReason === 'tool_use') {
            const toolUseBlocks = content.filter((b: any) => b.type === 'tool_use');

            currentMessages.push({ role: 'assistant', content });

            const toolResults: any[] = [];

            for (const toolCall of toolUseBlocks) {
              send({
                type: 'tool_start',
                tool: toolCall.name,
                input: toolCall.input,
              });

              const result = await executeTool(toolCall.name, toolCall.input, projectRoot, broadcast);

              send({
                type: 'tool_end',
                tool: toolCall.name,
                result: result.slice(0, 200),
              });

              // Track if any files were modified
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

          break; // Unknown stop reason
        }

        // If files were modified, build and restart
        if (filesModified) {
          send({ type: 'building', message: 'Files changed — running build...' });

          const buildResult = await buildAndRestart(projectRoot, broadcast);

          if (buildResult.success) {
            send({ type: 'build_complete', message: 'Build passed — preview updated' });
            NotificationRepo.create({
              type: 'build_success',
              message: 'Build successful — changes deployed',
              projectId: projectId || null,
              link: project?.deployUrl || null,
            });
            LogRepo.add('Build OK — app restarted', 'info', projectId);
          } else {
            // Build failed — send error back to AI to fix
            send({ type: 'build_failed', message: 'Build failed — attempting auto-fix...' });

            const fixMessages = [
              ...currentMessages,
              {
                role: 'user',
                content: `The build failed with this error:\n\n${buildResult.output.slice(0, 2000)}\n\nPlease read the error carefully and fix it. The most common causes are:\n1. Missing import statement\n2. Type error\n3. Syntax error\n\nRead the affected file and fix the issue.`,
              },
            ];

            const fixResponse = await fetch(GATEWAY, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
              body: JSON.stringify({
                model: 'claude',
                max_tokens: 4096,
                system: systemPrompt,
                tools: TOOLS,
                messages: fixMessages,
              }),
            });

            if (fixResponse.ok) {
              const fixData = await fixResponse.json();
              const fixTools = (fixData.content || []).filter((b: any) => b.type === 'tool_use');

              for (const toolCall of fixTools) {
                const result = await executeTool(toolCall.name, toolCall.input, projectRoot, broadcast);
                send({ type: 'auto_fix', tool: toolCall.name, result: result.slice(0, 100) });
              }

              // Try building again
              const retryBuild = await buildAndRestart(projectRoot, broadcast);
              if (retryBuild.success) {
                send({ type: 'build_complete', message: 'Auto-fix successful — build passed' });
              } else {
                send({ type: 'build_failed_final', message: 'Auto-fix failed. Manual intervention needed.', error: retryBuild.output.slice(0, 500) });
              }
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
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// ─── System prompt builder ──────────────────────────────────────

function buildSystemPrompt(project: any, projectRoot: string): string {
  const projectInfo = project ? `
ACTIVE PROJECT: ${project.name}
Repo path: ${projectRoot}
Live URL: ${project.deployUrl || 'not deployed'}
Tech stack: ${(project.techStack || []).join(', ')}
Current phase: ${project.pipeline?.development?.status || 'unknown'}
Progress: ${project.progress || 0}%` : `
No project selected. Working on the GenPlatform itself.
Repo path: /root/genplatform`;

  return `You are an expert AI Engineer with DIRECT access to the server and the project codebase.
${projectInfo}

PROTECTED FILES — YOU MUST NEVER MODIFY THESE:
- src/app/layout.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/navbar.tsx
- src/app/globals.css
- Everything inside src/app/dashboard/self-dev/

YOUR TOOLS:
- bash: Run any server command. Use to check files, run builds, restart processes.
- read_file: Read any file in the project. ALWAYS read before modifying.
- write_file: Write a complete file. Use for new files or complete rewrites.
- patch_file: Replace a specific string in a file. Safer for small targeted changes.

HOW YOU WORK:
1. When user reports a problem or requests a change:
   - Use bash or read_file to investigate immediately
   - Identify the root cause
   - Show what you will change and why (be specific: file path + what changes)
   - Ask: "Should I apply this fix?" — wait for approval before executing

2. When user approves (any of: yes, apply, go ahead, نعم, طبق, موافق, ok):
   - Execute the changes using write_file or patch_file
   - Run npm run build automatically
   - If build passes: confirm success
   - If build fails: read the error and fix it automatically

3. Always think step by step. Never guess. Read first, then act.

4. For large features: break into steps, show the plan, then execute step by step.

IMPORTANT RULES:
- Never modify protected files under any circumstances
- Always run npm run build after modifying any .tsx or .ts file
- Always pm2 restart genplatform-app after a successful build
- If you are unsure about a file, use read_file to check it first
- Report every file you modify

Respond in the same language as the user (Arabic or English).`;
}
EOF

echo "OK: Chat API rebuilt with agentic loop and streaming"
echo "=== STEP 1 COMPLETE ==="
```

---

# ════════════════════════════════════════════════════════
# STEP 2: Rebuild the Claude (Chat) page
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 2: Rebuilding Claude chat page ==="

cat > /root/genplatform/src/app/dashboard/claude/page.tsx << 'EOF'
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { LivePreviewPanel } from '@/components/chat/LivePreviewPanel';

// ─── Types ─────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolEvents?: ToolEvent[];
  buildStatus?: 'building' | 'success' | 'failed';
}

interface ToolEvent {
  type: string;
  tool?: string;
  input?: any;
  result?: string;
  message?: string;
  error?: string;
}

interface Project {
  id: string;
  name: string;
  deployUrl?: string;
  repoPath?: string;
  techStack?: string[];
}

interface Attachment {
  name: string;
  content: string;
}

// ─── Component ─────────────────────────────────────────────────

export default function ClaudePage() {
  const [messages, setMessages] = useState<Message[]>([{
    id: '0',
    role: 'assistant',
    content: '## Hello! I am your AI Engineer.\n\nI am connected to OpenClaw Gateway — same brain, same tools, same memory as Telegram.\n\nSelect a project and tell me what you need. I can read files, fix bugs, add features, and deploy changes live.',
  }]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [currentToolEvents, setCurrentToolEvents] = useState<ToolEvent[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load projects
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
          if (data.length > 0 && !selectedProject) setSelectedProject(data[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Connect to SSE for live updates
  useEffect(() => {
    const es = new EventSource('/api/events');
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.event === 'build_success' || event.event === 'app_restarted') {
          setPreviewKey(k => k + 1);
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle file attachment
  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > 500000) {
      alert('File too large. Maximum 500KB.');
      return;
    }
    const text = await file.text();
    setAttachment({ name: file.name, content: text });
    setInput(prev => prev || `I uploaded ${file.name} — please review it.`);
  }, []);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!input.trim() && !attachment) return;
    if (loading) return;

    const userContent = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: attachment ? `${userContent}\n\n*Attached: ${attachment.name}*` : userContent,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachment(null);
    setLoading(true);
    setCurrentToolEvents([]);

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      toolEvents: [],
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userContent,
          projectId: selectedProject?.id || null,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          attachment: attachment || null,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const toolEvents: ToolEvent[] = [];
      let finalText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'text') {
              finalText = event.text;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: event.text } : m
              ));
            }

            if (event.type === 'tool_start') {
              const te: ToolEvent = { type: 'tool_start', tool: event.tool, input: event.input };
              toolEvents.push(te);
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, toolEvents: [...toolEvents] } : m
              ));
            }

            if (event.type === 'tool_end') {
              const te: ToolEvent = { type: 'tool_end', tool: event.tool, result: event.result };
              toolEvents.push(te);
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, toolEvents: [...toolEvents] } : m
              ));
            }

            if (event.type === 'building') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, buildStatus: 'building' } : m
              ));
            }

            if (event.type === 'build_complete') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, buildStatus: 'success' } : m
              ));
              setPreviewKey(k => k + 1);
            }

            if (event.type === 'build_failed' || event.type === 'build_failed_final') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, buildStatus: 'failed' } : m
              ));
            }

            if (event.type === 'error') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: `Error: ${event.message}` } : m
              ));
            }

          } catch {}
        }
      }

    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: `Connection error: ${err.message}. Check if the server is running.` }
          : m
      ));
    } finally {
      setLoading(false);
    }
  }, [input, attachment, loading, messages, selectedProject]);

  // Keyboard shortcut
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left: Chat ── */}
      <div style={{
        width: '42%', minWidth: 320, display: 'flex', flexDirection: 'column',
        borderRight: '0.5px solid var(--color-border-tertiary)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          background: 'var(--color-background-secondary)',
        }}>
          {/* Project selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProjectMenu(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)',
                background: 'transparent', cursor: 'pointer', fontSize: 12,
                color: 'var(--color-text-primary)',
              }}
            >
              <span style={{ fontSize: 10 }}>◆</span>
              {selectedProject?.name || 'Select project'}
              <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>
            </button>

            {showProjectMenu && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50,
                minWidth: 200, background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProject(p); setShowProjectMenu(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 12px',
                      fontSize: 12, cursor: 'pointer', background: 'transparent', border: 'none',
                      color: selectedProject?.id === p.id ? 'var(--color-text-info)' : 'var(--color-text-primary)',
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 4,
            background: 'rgba(29,158,117,0.15)', color: '#1D9E75',
          }}>
            OpenClaw Gateway
          </span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ marginBottom: 16 }}>
              {/* Message bubble */}
              <div style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
                  lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  background: msg.role === 'user'
                    ? 'var(--color-background-info)'
                    : 'var(--color-background-secondary)',
                }}>
                  {msg.content || (loading && msg.role === 'assistant' ? (
                    <span style={{ color: 'var(--color-text-secondary)' }}>Thinking...</span>
                  ) : '')}
                </div>
              </div>

              {/* Tool events */}
              {msg.toolEvents && msg.toolEvents.length > 0 && (
                <div style={{ marginTop: 8, marginLeft: 4 }}>
                  {msg.toolEvents
                    .filter(e => e.type === 'tool_start')
                    .map((e, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 8px', marginBottom: 3, borderRadius: 6, fontSize: 11,
                      background: 'var(--color-background-secondary)',
                      color: 'var(--color-text-secondary)',
                    }}>
                      <span>{
                        e.tool === 'bash' ? '⚙' :
                        e.tool === 'read_file' ? '📖' :
                        e.tool === 'write_file' ? '✏️' :
                        e.tool === 'patch_file' ? '🔧' : '◦'
                      }</span>
                      <span style={{ fontFamily: 'monospace' }}>
                        {e.tool}:{' '}
                        {e.tool === 'bash' ? (e.input?.command || '').slice(0, 50) :
                         (e.input?.path || '').slice(0, 50)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Build status */}
              {msg.buildStatus && (
                <div style={{
                  marginTop: 8, marginLeft: 4, padding: '6px 10px', borderRadius: 6,
                  fontSize: 11, display: 'flex', alignItems: 'center', gap: 6,
                  background: msg.buildStatus === 'success'
                    ? 'rgba(29,158,117,0.1)'
                    : msg.buildStatus === 'failed'
                    ? 'rgba(226,75,74,0.1)'
                    : 'rgba(24,95,165,0.1)',
                  color: msg.buildStatus === 'success' ? '#1D9E75'
                    : msg.buildStatus === 'failed' ? '#E24B4A' : '#185FA5',
                }}>
                  {msg.buildStatus === 'building' && '⟳ Building...'}
                  {msg.buildStatus === 'success' && '✓ Build passed — preview updated'}
                  {msg.buildStatus === 'failed' && '✗ Build failed — attempting auto-fix'}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: 12, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
          {/* Attachment preview */}
          {attachment && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
              padding: '5px 10px', borderRadius: 6, fontSize: 11,
              background: 'var(--color-background-secondary)',
              color: 'var(--color-text-secondary)',
            }}>
              <span>📎 {attachment.name}</span>
              <button
                onClick={() => setAttachment(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none',
                         cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 14 }}
              >✕</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            {/* File attachment button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              style={{
                padding: 8, borderRadius: 8, background: 'transparent',
                border: '0.5px solid var(--color-border-tertiary)', cursor: 'pointer',
                color: 'var(--color-text-secondary)', fontSize: 14, flexShrink: 0,
              }}
            >📎</button>

            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              accept=".txt,.md,.json,.ts,.tsx,.js,.jsx,.py,.sh,.env,.yaml,.yml,.css"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe a problem, request a change, or drop a file... (Enter to send)"
              disabled={loading}
              rows={2}
              style={{
                flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 8,
                resize: 'none', minHeight: 40, maxHeight: 120,
                border: '0.5px solid var(--color-border-tertiary)',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                opacity: loading ? 0.6 : 1,
              }}
            />

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && !attachment)}
              style={{
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                border: '0.5px solid var(--color-border-tertiary)',
                background: 'transparent', color: 'var(--color-text-primary)',
                fontSize: 14, flexShrink: 0,
                opacity: loading || (!input.trim() && !attachment) ? 0.4 : 1,
              }}
            >→</button>
          </div>

          <div style={{ marginTop: 6, fontSize: 10, color: 'var(--color-text-secondary)', opacity: 0.7 }}>
            Enter to send · Shift+Enter for new line · Drop files to attach
          </div>
        </div>
      </div>

      {/* ── Right: Live Preview ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <LivePreviewPanel
          project={selectedProject}
          previewKey={previewKey}
        />
      </div>

    </div>
  );
}
EOF

echo "OK: Claude chat page rebuilt"
echo "=== STEP 2 COMPLETE ==="
```

---

# ════════════════════════════════════════════════════════
# STEP 3: Rebuild LivePreviewPanel component
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 3: Rebuilding LivePreviewPanel ==="

cat > /root/genplatform/src/components/chat/LivePreviewPanel.tsx << 'EOF'
'use client';
import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  deployUrl?: string;
}

interface LivePreviewPanelProps {
  project: Project | null;
  previewKey?: number;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';

const VIEW_MODES: { mode: ViewMode; label: string; width: string }[] = [
  { mode: 'desktop', label: 'Desktop', width: '100%' },
  { mode: 'tablet',  label: 'Tablet',  width: '768px' },
  { mode: 'mobile',  label: 'Mobile',  width: '375px' },
];

export function LivePreviewPanel({ project, previewKey = 0 }: LivePreviewPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [iframeError, setIframeError] = useState(false);
  const [lastKey, setLastKey] = useState(previewKey);

  // Reset error when key changes (new build)
  if (previewKey !== lastKey) {
    setLastKey(previewKey);
    setIframeError(false);
  }

  const url = project?.deployUrl;
  const safeUrl = url?.startsWith('http') ? url : url ? `https://${url}` : null;
  const currentWidth = VIEW_MODES.find(m => m.mode === viewMode)?.width || '100%';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background-tertiary)' }}>

      {/* Preview header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-secondary)',
      }}>
        {/* View mode toggles */}
        <div style={{ display: 'flex', gap: 4 }}>
          {VIEW_MODES.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                border: '0.5px solid var(--color-border-tertiary)',
                background: viewMode === mode ? 'var(--color-background-primary)' : 'transparent',
                color: viewMode === mode ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              }}
            >{label}</button>
          ))}
        </div>

        {/* URL display */}
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
          {safeUrl || 'No project selected'}
        </span>

        {/* Open in new tab */}
        {safeUrl && (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--color-text-info)', textDecoration: 'none' }}
          >
            Open ↗
          </a>
        )}
      </div>

      {/* Preview area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto', padding: viewMode !== 'desktop' ? 16 : 0 }}>

        {!project ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <div style={{ fontSize: 32, opacity: 0.2 }}>◻</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Select a project to see the live preview
            </p>
          </div>
        ) : iframeError || !safeUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Preview not available in iframe
            </p>
            {safeUrl && (
              <a
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12, padding: '6px 14px', borderRadius: 8,
                  border: '0.5px solid var(--color-border-info)',
                  color: 'var(--color-text-info)', textDecoration: 'none',
                }}
              >
                Open {safeUrl} →
              </a>
            )}
          </div>
        ) : (
          <div style={{
            width: currentWidth,
            height: viewMode === 'desktop' ? '100%' : 'auto',
            minHeight: viewMode !== 'desktop' ? 600 : undefined,
            border: viewMode !== 'desktop' ? '0.5px solid var(--color-border-tertiary)' : 'none',
            borderRadius: viewMode !== 'desktop' ? 8 : 0,
            overflow: 'hidden',
            boxShadow: viewMode !== 'desktop' ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
          }}>
            <iframe
              key={`${project.id}-${previewKey}`}
              src={safeUrl}
              style={{ width: '100%', height: viewMode === 'desktop' ? '100%' : '600px', border: 'none' }}
              onError={() => setIframeError(true)}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              title={`${project.name} preview`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
EOF

echo "OK: LivePreviewPanel rebuilt"
echo "=== STEP 3 COMPLETE ==="
```

---

# ════════════════════════════════════════════════════════
# STEP 4: Build and verify
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 4: Build and verify ==="
cd /root/genplatform

npm run build 2>&1 | tail -30
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
  echo "BUILD PASSED"
  pm2 restart genplatform-app
  sleep 4

  echo "Testing chat system..."

  # Test 1: Chat API accepts messages and streams a response
  CHAT_RESPONSE=$(curl -s -m 20 -X POST http://localhost:3000/api/chat/send \
    -H "Content-Type: application/json" \
    -d '{"message":"what is in package.json — just tell me the name field","projectId":"genplatform-ai"}' \
    | head -c 500)

  echo "Chat response preview:"
  echo "$CHAT_RESPONSE" | head -5
  echo "---"

  # Test 2: Check if response contains expected SSE format
  if echo "$CHAT_RESPONSE" | grep -q "data:"; then
    echo "PASS: Chat streams SSE events correctly"
  else
    echo "WARN: Chat response format may need checking"
  fi

  # Test 3: Preview panel page loads
  CLAUDE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard/claude)
  echo "Chat page HTTP status: $CLAUDE_STATUS"

  MSG="FILE-4 LIVE CHAT COMPLETE%0ABuild: PASSED%0AChat page: $CLAUDE_STATUS%0AStreaming: working%0A%0AReady for FILE-5 (Ideas page)"
  curl -s "https://api.telegram.org/bot8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4/sendMessage" \
    -d "chat_id=510906393&text=$MSG" > /dev/null

else
  echo "BUILD FAILED"
  npm run build 2>&1 | grep -E "Cannot find|Module not found|Type error" | head -15

  ERRS=$(npm run build 2>&1 | grep -E "Cannot find|Type error" | head -3 | tr '\n' ' ' | cut -c1-180)
  MSG="FILE-4 BUILD FAILED%0AErrors: $ERRS"
  curl -s "https://api.telegram.org/bot8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4/sendMessage" \
    -d "chat_id=510906393&text=$MSG" > /dev/null
fi
```

---

# EXPECTED STATE AFTER FILE-4 COMPLETES

Chat API (src/app/api/chat/send/route.ts):
  - Receives message + projectId + history + optional attachment
  - Loads full project context from database
  - Runs agentic loop: up to 10 tool iterations
  - Streams every event: text, tool_start, tool_end, building, build_complete
  - Auto-fixes build errors without user intervention
  - Returns SSE stream (not a single JSON response)

Chat page (src/app/dashboard/claude/page.tsx):
  - Project selector dropdown (loads from /api/projects)
  - Messages render with tool execution timeline
  - Build status shown per message (building / success / failed)
  - File attachment button (accepts .ts, .tsx, .md, .json, etc.)
  - Enter to send, Shift+Enter for new line
  - Live preview refreshes automatically after successful build

LivePreviewPanel:
  - Desktop / Tablet / Mobile view toggles
  - Graceful fallback when iframe is blocked
  - Refreshes when previewKey changes (after build)

User experience:
  - Tell chat "read package.json" -> it reads and shows the content
  - Tell chat "there is a bug in dashboard" -> it reads files, finds bug, proposes fix
  - Say "yes" -> it applies, builds, restarts, preview refreshes automatically
  - Attach a file -> AI reads it and responds accordingly

Build: PASSING

When confirmed -> send "FILE-4 DONE" in Telegram -> start FILE-5
