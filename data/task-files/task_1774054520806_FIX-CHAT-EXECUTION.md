# CRITICAL FIX: Chat Must Execute, Not Chat
# Date: 2026-03-21
# ═══════════════════════════════════════════════════════════════
# PROTECTED: sidebar.tsx, navbar.tsx, layout.tsx, globals.css, self-dev/**

## THE CORE PROBLEM
The Chat page sends messages to Claude API but Claude has no way to:
- Read files on the server
- Execute commands
- Make real changes
So it just asks questions instead of acting.

## THE FIX
Chat must route through Bridge API (port 3001) which has server access.
When user sends a message → Bridge API → OpenClaw → executes on server.

---

# TASK-1: Fix Chat to use Bridge API (not Claude API directly)

## File: src/app/api/chat/send/route.ts
REPLACE the entire file with:

```typescript
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { message, projectId, history } = await req.json();

  // Build context for the agent
  const projectContext = projectId ? `
ACTIVE PROJECT: ${projectId}
Repo path: /root/genplatform
Live URL: https://app.gen3.ai
You have FULL access to read/write files and run commands.
PROTECTED FILES (never modify): sidebar.tsx, navbar.tsx, layout.tsx, globals.css, self-dev/**
` : '';

  const systemMessage = `You are an AI Engineer with DIRECT server access.
${projectContext}
When user reports a problem:
1. READ the relevant files immediately using bash
2. IDENTIFY the exact issue
3. SHOW the fix (code diff)
4. Ask: "Apply this fix? [Yes/No]"

When user says yes/نعم/apply/طبق:
1. Apply the change
2. Run: npm run build
3. Run: pm2 restart genplatform-app
4. Report result

You can execute ANY bash command. Use tools to act, not to ask questions.
Respond in the same language as the user (Arabic or English).`;

  try {
    // Send to Bridge API which routes to OpenClaw with exec permissions
    const bridgeResponse = await fetch('http://localhost:3001/api/gateway/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        system: systemMessage,
        history: history?.slice(-8) || [],
        projectId,
        allowExec: true
      })
    });

    if (!bridgeResponse.ok) {
      throw new Error(`Bridge API error: ${bridgeResponse.status}`);
    }

    const data = await bridgeResponse.json();
    return NextResponse.json({ reply: data.reply || data.message || data.response });

  } catch (error) {
    // Fallback: call Claude API directly with clear instructions
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        system: systemMessage,
        messages: [
          ...(history?.slice(-6) || []),
          { role: 'user', content: message }
        ]
      })
    });

    const claudeData = await claudeResponse.json();
    const reply = claudeData.content?.[0]?.text || 'Error getting response';
    return NextResponse.json({ reply });
  }
}
```

---

# TASK-2: Fix Bridge API to handle chat with exec

## File: /root/genplatform-api/src/routes/chat.js (create if not exists)

```javascript
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');

const PROJECT_ROOT = '/root/genplatform';
const PROTECTED = ['sidebar.tsx', 'navbar.tsx', 'layout.tsx', 'globals.css'];

// POST /api/gateway/chat
router.post('/chat', async (req, res) => {
  const { message, system, history, projectId, allowExec } = req.body;

  // Build tools for Claude
  const tools = allowExec ? [
    {
      name: 'bash',
      description: 'Execute bash command on the server',
      input_schema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The bash command to run' }
        },
        required: ['command']
      }
    },
    {
      name: 'read_file',
      description: 'Read a file from the project',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root' }
        },
        required: ['path']
      }
    },
    {
      name: 'write_file',
      description: 'Write content to a file',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root' },
          content: { type: 'string', description: 'New file content' }
        },
        required: ['path', 'content']
      }
    }
  ] : [];

  try {
    // Agentic loop - keep calling Claude until it gives a final text response
    let messages = [...(history || []), { role: 'user', content: message }];
    let finalReply = '';
    let iterations = 0;
    const MAX_ITERATIONS = 10;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 4000,
          system: system || 'You are an AI Engineer with server access.',
          tools,
          messages
        })
      });

      const data = await response.json();

      // If end_turn or no tool use → done
      if (data.stop_reason === 'end_turn') {
        finalReply = data.content
          .filter(b => b.type === 'text')
          .map(b => b.text)
          .join('\n');
        break;
      }

      // Process tool calls
      if (data.stop_reason === 'tool_use') {
        const assistantMessage = { role: 'assistant', content: data.content };
        messages.push(assistantMessage);

        const toolResults = [];

        for (const block of data.content) {
          if (block.type !== 'tool_use') continue;

          let result = '';

          if (block.name === 'bash') {
            // Check for dangerous commands
            const dangerous = ['rm -rf /', 'dd if=', 'mkfs', '> /dev/'];
            if (dangerous.some(d => block.input.command.includes(d))) {
              result = 'ERROR: Dangerous command blocked';
            } else {
              try {
                const { stdout, stderr } = await execAsync(block.input.command, {
                  cwd: PROJECT_ROOT,
                  timeout: 30000
                });
                result = stdout + (stderr ? `\nSTDERR: ${stderr}` : '');
              } catch (e) {
                result = `ERROR: ${e.message}\n${e.stdout || ''}\n${e.stderr || ''}`;
              }
            }
          }

          if (block.name === 'read_file') {
            const filePath = path.join(PROJECT_ROOT, block.input.path);
            if (!filePath.startsWith(PROJECT_ROOT)) {
              result = 'ERROR: Path outside project';
            } else {
              try {
                result = await fs.readFile(filePath, 'utf-8');
              } catch (e) {
                result = `ERROR: File not found: ${block.input.path}`;
              }
            }
          }

          if (block.name === 'write_file') {
            // Check protected files
            const isProtected = PROTECTED.some(p => block.input.path.includes(p));
            if (isProtected) {
              result = `ERROR: ${block.input.path} is a PROTECTED file - cannot modify`;
            } else {
              const filePath = path.join(PROJECT_ROOT, block.input.path);
              if (!filePath.startsWith(PROJECT_ROOT)) {
                result = 'ERROR: Path outside project';
              } else {
                try {
                  await fs.mkdir(path.dirname(filePath), { recursive: true });
                  await fs.writeFile(filePath, block.input.content);
                  result = `SUCCESS: Written to ${block.input.path}`;
                } catch (e) {
                  result = `ERROR: ${e.message}`;
                }
              }
            }
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result
          });
        }

        messages.push({ role: 'user', content: toolResults });
      }
    }

    if (!finalReply) finalReply = 'Completed execution.';
    res.json({ reply: finalReply });

  } catch (error) {
    console.error('[Chat API Error]', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

## Register the route in Bridge API main file:
Find /root/genplatform-api/src/index.js (or app.js or server.js) and add:
```javascript
const chatRouter = require('./routes/chat');
app.use('/api/gateway', chatRouter);
```

---

# TASK-3: Fix Chat UI - Add file upload + voice + show execution

## File: src/app/dashboard/chat/page.tsx
Find the message input area and REPLACE with:

```tsx
{/* Input area */}
<div className="border-t border-border-tertiary p-4">
  {/* Attachment preview */}
  {attachment && (
    <div className="mb-2 flex items-center gap-2 text-xs text-muted bg-background-secondary rounded px-3 py-2">
      <span>📎 {attachment.name}</span>
      <button onClick={() => setAttachment(null)} className="ml-auto">✕</button>
    </div>
  )}
  
  <div className="flex items-end gap-2">
    {/* File upload */}
    <label className="cursor-pointer p-2 text-muted hover:text-primary">
      <input
        type="file"
        accept="image/*,.pdf,.txt,.md,.json,.ts,.tsx,.js,.py"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => setAttachment({ 
              type: 'image', name: file.name, 
              base64: (reader.result as string).split(',')[1] 
            });
            reader.readAsDataURL(file);
          } else {
            const text = await file.text();
            setAttachment({ type: 'file', name: file.name, content: text });
            setMessage(m => m || `I uploaded ${file.name}, please review it.`);
          }
        }}
        className="hidden"
      />
      <span className="text-lg">📎</span>
    </label>

    {/* Text input */}
    <textarea
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      }}
      placeholder="Describe a problem or request a change... (Enter to send)"
      className="flex-1 bg-background-secondary border border-border-tertiary 
                 rounded-lg px-3 py-2 text-sm resize-none"
      rows={2}
    />

    {/* Send button */}
    <button
      onClick={sendMessage}
      disabled={!message.trim() && !attachment}
      className="p-2 text-muted hover:text-primary disabled:opacity-30"
    >
      →
    </button>
  </div>
  <p className="text-xs text-muted mt-1">
    Enter to send · Shift+Enter for new line · I can read files, fix bugs, and deploy changes
  </p>
</div>
```

Also add state variables at top of component:
```tsx
const [attachment, setAttachment] = useState<any>(null);
```

And update sendMessage to include attachment:
```tsx
const sendMessage = async () => {
  if (!message.trim() && !attachment) return;
  
  const userContent = attachment?.type === 'file' 
    ? `${message}\n\nFile content (${attachment.name}):\n\`\`\`\n${attachment.content}\n\`\`\``
    : message;
  
  const newMessage = { role: 'user', content: userContent };
  setMessages(prev => [...prev, newMessage]);
  setMessage('');
  setAttachment(null);
  setLoading(true);

  const res = await fetch('/api/chat/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userContent,
      projectId: selectedProject?.id,
      history: messages.slice(-6)
    })
  });

  const data = await res.json();
  setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
  setLoading(false);
};
```

---

# TASK-4: Fix Preview Panel "Something went wrong"

## Find the right panel component in chat page
Look for iframe or preview component and replace with:

```tsx
function PreviewPanel({ project }: { project: any }) {
  const [iframeError, setIframeError] = useState(false);
  
  const url = project?.deployUrl || project?.liveUrl;
  const safeUrl = url?.startsWith('http') ? url : url ? `https://${url}` : null;

  if (!project) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
      <div className="text-4xl opacity-20">💻</div>
      <p className="text-sm text-muted">Select a project from the dropdown above</p>
      <p className="text-xs text-muted opacity-60">
        I will load the project context and show the live preview here
      </p>
    </div>
  );

  if (!safeUrl || iframeError) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <p className="text-sm text-muted">{project.name}</p>
      {safeUrl && (
        <a href={safeUrl} target="_blank" rel="noopener noreferrer"
           className="text-xs text-info border border-info rounded px-3 py-1.5">
          Open {safeUrl} →
        </a>
      )}
      <p className="text-xs text-muted opacity-60">Preview cannot load in iframe</p>
    </div>
  );

  return (
    <iframe
      src={safeUrl}
      className="w-full h-full border-0"
      onError={() => setIframeError(true)}
      sandbox="allow-same-origin allow-scripts allow-forms"
    />
  );
}
```

---

# TASK-5: Remove old Chat from sidebar (keep only the new one)

The sidebar has two Chat items. The one under "Overview" (old basic chat) should redirect.

File: src/app/dashboard/chat/page.tsx — check if there are TWO chat pages:
- /dashboard/chat (old one - redirects)
- /dashboard/claude or /dashboard/claude-code (new one - keep)

If /dashboard/chat is the OLD one, replace its entire content with:
```tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldChatRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/claude'); }, []);
  return null;
}
```

---

# TASK-6: Fix "Project not found" when navigating to project

## File: src/app/api/projects/[id]/route.ts
Add proper error handling:
```typescript
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const project = await getProject(params.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
```

## File: src/components/projects/ProjectDetailPage.tsx
Fix the "not found" state:
```tsx
if (error) return (
  <div className="flex flex-col items-center justify-center h-full gap-4">
    <p className="text-sm text-muted">Project not found</p>
    <button onClick={() => router.push('/dashboard/projects')} 
            className="text-xs border border-border-tertiary rounded px-4 py-2">
      Back to Projects
    </button>
  </div>
);
```

Also fix the useEffect to handle errors:
```tsx
useEffect(() => {
  fetch(`/api/projects/${projectId}`)
    .then(r => {
      if (!r.ok) throw new Error('not found');
      return r.json();
    })
    .then(setProject)
    .catch(() => setError(true));
}, [projectId]);
```

---

# EXECUTION ORDER
1. TASK-2 first (Bridge API chat route - this enables real execution)
2. TASK-1 (Frontend chat API to use Bridge)
3. TASK-4 (Fix preview panel error)
4. TASK-3 (Add file upload to chat UI)
5. TASK-5 (Remove duplicate chat)
6. TASK-6 (Fix project not found)

After each task: npm run build && pm2 restart bridge-api genplatform-app
Report via Telegram after each task.

## VERIFICATION TEST
After all tasks complete, send this message in chat:
"اقرأ ملف src/app/dashboard/page.tsx وأخبرني بأول 5 أسطر"

If AI reads the file and shows the content → system works correctly.
If AI asks questions instead → TASK-2 failed, debug bridge-api logs.
