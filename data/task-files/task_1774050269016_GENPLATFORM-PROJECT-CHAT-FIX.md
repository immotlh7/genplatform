# GENPLATFORM MISSION: PROJECT SYSTEM + CHAT OVERHAUL
# Priority: CRITICAL | Date: 2026-03-20
# ═══════════════════════════════════════════════════════════════

## ⚠️ PROTECTED FILES — NEVER TOUCH
- src/app/layout.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/navbar.tsx
- src/app/globals.css
- src/app/dashboard/self-dev/**
- src/app/api/self-dev/**

## EXECUTION RULES
- Build after EVERY task: cd /root/genplatform && npm run build
- If build fails: rollback that task only, report error, continue to next
- Report progress every 3 tasks via Telegram
- Never stop execution

---

# ════════════════════════════════════════════════════════
# TASK-1: Fix Project Creation — Auto Subdomain + GitHub
# ════════════════════════════════════════════════════════

## Problem
- Deploy URL field requires manual input and rejects "test.gen3.ai" format
- GitHub URL must be created manually
- Subdomain not auto-generated from project name

## Fix: src/app/dashboard/projects/page.tsx (or wherever the Create Project modal is)

### Step 1: Auto-generate subdomain when user types project name
Find the project name input field and add onChange handler:
```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 30);
}

// In the component state:
const [projectName, setProjectName] = useState('');
const [subdomain, setSubdomain] = useState('');

// When name changes:
const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const name = e.target.value;
  setProjectName(name);
  if (name.length > 2) {
    setSubdomain(generateSlug(name));
  }
};
```

### Step 2: Replace "Deploy URL" field with auto-generated subdomain display
Remove the current Deploy URL input field entirely.
Replace with this read-only display + optional edit:
```tsx
<div className="space-y-1">
  <label className="text-xs text-muted">Subdomain (auto-generated)</label>
  <div className="flex items-center gap-2">
    <div className="flex-1 flex items-center bg-background-secondary border 
                    border-border-tertiary rounded-lg px-3 py-2">
      <span className="text-sm font-mono">{subdomain || 'my-project'}</span>
      <span className="text-muted text-sm">.gen3.ai</span>
    </div>
    <button 
      type="button"
      className="text-xs text-muted hover:text-primary"
      onClick={() => setEditingSubdomain(true)}
    >
      Edit
    </button>
  </div>
  {editingSubdomain && (
    <input
      value={subdomain}
      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
      className="w-full text-sm bg-background-secondary border border-border-tertiary 
                 rounded-lg px-3 py-2 font-mono"
      placeholder="my-project"
    />
  )}
  <p className="text-xs text-muted">Live URL: https://{subdomain || 'my-project'}.gen3.ai</p>
</div>
```

### Step 3: Remove GitHub URL input field
GitHub URL will be created automatically. Remove the GitHub URL input.

### Step 4: After project is created, auto-create GitHub repo
In the project creation API (src/app/api/projects/route.ts or similar):
```typescript
// POST /api/projects — after saving to database:

async function createProjectInfrastructure(project: Project) {
  const slug = project.slug;
  
  // 1. Create GitHub repo via API (if GitHub token configured)
  const githubRepo = await createGitHubRepo({
    name: slug,
    description: project.description,
    private: true,
    auto_init: true
  });
  
  // 2. Set up Caddy subdomain
  await addCaddySubdomain(slug); // slug.gen3.ai → localhost:PORT
  
  // 3. Create project directory
  await exec(`mkdir -p /root/projects/${slug}`);
  
  // 4. Update project record with GitHub URL
  await updateProject(project.id, {
    githubUrl: githubRepo?.html_url || null,
    subdomain: slug,
    deployUrl: `https://${slug}.gen3.ai`
  });
  
  return { githubUrl: githubRepo?.html_url, subdomain: slug };
}

// GitHub repo creation function:
async function createGitHubRepo(config: any) {
  // Check if GITHUB_TOKEN exists in env
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.log('[GitHub] No token configured, skipping repo creation');
    return null;
  }
  
  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config)
  });
  
  if (response.ok) {
    return await response.json();
  }
  return null;
}
```

### Step 5: Add Caddy subdomain function
In genplatform-api or a server utility:
```typescript
async function addCaddySubdomain(slug: string) {
  // Find next available port (starting from 4000)
  const port = await getNextAvailablePort(4000);
  
  // Append to Caddyfile
  const caddyEntry = `
${slug}.gen3.ai {
    reverse_proxy localhost:${port}
}
`;
  
  await exec(`echo '${caddyEntry}' >> /etc/caddy/Caddyfile`);
  await exec('caddy reload --config /etc/caddy/Caddyfile');
  
  return port;
}
```

---

# ════════════════════════════════════════════════════════
# TASK-2: Fix Project Click → Open Project Management Page
# ════════════════════════════════════════════════════════

## Problem
Clicking a project shows a popup/modal instead of navigating to the full project page with Pipeline view.

## Fix: src/app/dashboard/projects/page.tsx

### Step 1: Find the project card/list item onClick handler
Look for something like:
```typescript
// WRONG (current behavior — opens modal):
onClick={() => setSelectedProject(project)}

// RIGHT (correct behavior — navigates to project page):
onClick={() => router.push(`/dashboard/projects/${project.id}`)}
```

Replace ALL project card click handlers to use router.push navigation.

### Step 2: Remove the popup/modal for project overview
The modal showing "Overview | Activity | Settings" popup should be removed.
All that information belongs inside /dashboard/projects/[id].

Keep only the project card visible on hover — no modal popup.

### Step 3: Verify /dashboard/projects/[id]/page.tsx exists and works
Check if this file exists. If it does not exist or is empty, create it:

```tsx
// src/app/dashboard/projects/[id]/page.tsx
import { ProjectDetailPage } from '@/components/projects/ProjectDetailPage';

export default async function Page({ params }: { params: { id: string } }) {
  return <ProjectDetailPage projectId={params.id} />;
}
```

### Step 4: Ensure ProjectDetailPage shows Pipeline as default tab
The page must load with Pipeline tab active by default.
Check src/components/projects/ProjectDetailPage.tsx (create if missing):

```tsx
'use client';
import { useState, useEffect } from 'react';
import { ProjectHeader } from './ProjectHeader';
import { PipelineTab } from './PipelineTab';
import { ChatTab } from './ChatTab';
import { TasksTab } from './TasksTab';
import { PreviewTab } from './PreviewTab';

const TABS = ['Pipeline', 'Chat', 'Tasks', 'Preview', 'Files', 'Settings'];

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('Pipeline');

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then(r => r.json())
      .then(setProject);
  }, [projectId]);

  if (!project) return <div className="p-6 text-sm text-muted">Loading...</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <ProjectHeader project={project} />
      
      {/* Tab navigation */}
      <div className="flex items-center gap-6 px-6 border-b border-border-tertiary">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 text-sm border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'Pipeline' && <PipelineTab project={project} />}
        {activeTab === 'Chat'     && <ChatTab project={project} />}
        {activeTab === 'Tasks'    && <TasksTab project={project} />}
        {activeTab === 'Preview'  && <PreviewTab project={project} />}
        {activeTab === 'Files'    && <FilesTab project={project} />}
        {activeTab === 'Settings' && <SettingsTab project={project} />}
      </div>
    </div>
  );
}
```

---

# ════════════════════════════════════════════════════════
# TASK-3: Rename "Claude Code" → "Chat" in Sidebar
# ════════════════════════════════════════════════════════

## ⚠️ CRITICAL: sidebar.tsx is PROTECTED — DO NOT EDIT IT

## Alternative approach — rename the page route:

### Step 1: Check current Claude Code page location
Look for: src/app/dashboard/claude/page.tsx OR src/app/dashboard/claude-code/page.tsx

### Step 2: The sidebar links to a specific path
Find what path "Claude Code" links to in the sidebar by checking:
```bash
grep -n "claude" /root/genplatform/src/components/layout/sidebar.tsx
grep -n "Claude Code" /root/genplatform/src/components/layout/sidebar.tsx
```

### Step 3: If sidebar uses text "Claude Code" — it must be changed
Even though sidebar.tsx is protected, this is a text label change only.
Check the EXACT text in the file first. If it says "Claude Code", change ONLY that text string to "Chat":
- Find the line: `Claude Code` 
- Change to: `Chat`
- Change the route if needed to /dashboard/chat

### Step 4: Remove the old /dashboard/chat page (the basic AI Chat one)
Replace src/app/dashboard/chat/page.tsx with redirect to /dashboard/claude (or wherever Claude Code lives):
```typescript
import { redirect } from 'next/navigation';
export default function OldChatPage() {
  redirect('/dashboard/claude');
}
```

### Step 5: Update the Claude Code page to use route /dashboard/chat
If Claude Code is at /dashboard/claude, create redirect:
```typescript
// src/app/dashboard/claude/page.tsx — keep existing content but also:
// Update any internal links to use /dashboard/chat
```

---

# ════════════════════════════════════════════════════════
# TASK-4: Sync Real Project Data for GenPlatform.ai
# ════════════════════════════════════════════════════════

## Problem
The GenPlatform.ai project shows in Projects list but clicking it doesn't show real data.
We need it to show: real tasks, real files, real pipeline status.

## Fix: Create data sync between actual project and the dashboard

### Step 1: Update /api/projects/[id] to return real data
```typescript
// src/app/api/projects/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  
  // For GenPlatform.ai specifically, read real data from filesystem
  if (project.repoPath && project.repoPath === '/root/genplatform') {
    // Read real git log
    const commits = await exec('cd /root/genplatform && git log --oneline -20 2>/dev/null || echo "no git"');
    
    // Count actual source files
    const fileCount = await exec('find /root/genplatform/src -name "*.tsx" -o -name "*.ts" | wc -l');
    
    // Get real task count from database
    const tasks = await getTasks({ projectId: params.id });
    
    project.commits = commits.split('\n').filter(Boolean);
    project.fileCount = parseInt(fileCount.trim());
    project.taskSummary = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'done').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length
    };
  }
  
  return NextResponse.json(project);
}
```

### Step 2: Add /api/projects/[id]/files endpoint — File Manager
```typescript
// src/app/api/projects/[id]/files/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  const repoPath = project.repoPath || `/root/projects/${project.slug}`;
  
  const { searchParams } = new URL(req.url);
  const dirPath = searchParams.get('path') || '/';
  const fullPath = path.join(repoPath, dirPath);
  
  // Security: prevent path traversal
  if (!fullPath.startsWith(repoPath)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  
  const entries = await fs.readdir(fullPath, { withFileTypes: true });
  
  const files = await Promise.all(entries
    .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
    .map(async (entry) => {
      const entryPath = path.join(fullPath, entry.name);
      const stat = await fs.stat(entryPath);
      return {
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: stat.size,
        modified: stat.mtime,
        path: path.join(dirPath, entry.name)
      };
    })
  );
  
  // Sort: directories first, then files alphabetically
  files.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  
  return NextResponse.json({ path: dirPath, files });
}

// GET file content
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { filePath } = await req.json();
  const project = await getProject(params.id);
  const repoPath = project.repoPath || `/root/projects/${project.slug}`;
  const fullPath = path.join(repoPath, filePath);
  
  if (!fullPath.startsWith(repoPath)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  
  const content = await fs.readFile(fullPath, 'utf-8');
  const lines = content.split('\n').length;
  
  return NextResponse.json({ content, lines, path: filePath });
}
```

### Step 3: Build FilesTab component
```tsx
// src/components/projects/FilesTab.tsx
'use client';
import { useState, useEffect } from 'react';

export function FilesTab({ project }: { project: any }) {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');

  useEffect(() => {
    fetch(`/api/projects/${project.id}/files?path=${currentPath}`)
      .then(r => r.json())
      .then(data => setFiles(data.files || []));
  }, [currentPath, project.id]);

  const openFile = async (file: any) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
    } else {
      setSelectedFile(file);
      const res = await fetch(`/api/projects/${project.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: file.path })
      });
      const data = await res.json();
      setFileContent(data.content);
    }
  };

  return (
    <div className="flex h-full">
      {/* File tree (left) */}
      <div className="w-64 border-r border-border-tertiary overflow-y-auto p-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 px-2 py-1 mb-2 text-xs text-muted">
          <button onClick={() => setCurrentPath('/')} className="hover:text-primary">root</button>
          {currentPath !== '/' && currentPath.split('/').filter(Boolean).map((part, i, arr) => (
            <>
              <span>/</span>
              <button 
                key={i}
                onClick={() => setCurrentPath('/' + arr.slice(0, i+1).join('/'))}
                className="hover:text-primary"
              >
                {part}
              </button>
            </>
          ))}
        </div>
        
        {/* Back button */}
        {currentPath !== '/' && (
          <button
            onClick={() => setCurrentPath(currentPath.split('/').slice(0, -1).join('/') || '/')}
            className="w-full text-left px-2 py-1 text-xs text-muted hover:bg-background-secondary rounded"
          >
            ← ..
          </button>
        )}
        
        {/* Files */}
        {files.map((file: any) => (
          <button
            key={file.path}
            onClick={() => openFile(file)}
            className={`w-full text-left px-2 py-1 text-xs rounded flex items-center gap-2
              ${selectedFile?.path === file.path ? 'bg-background-secondary text-primary' : 'text-muted hover:bg-background-secondary hover:text-primary'}`}
          >
            <span>{file.type === 'directory' ? '📁' : '📄'}</span>
            <span className="truncate">{file.name}</span>
          </button>
        ))}
      </div>
      
      {/* File content (right) */}
      <div className="flex-1 overflow-auto">
        {selectedFile ? (
          <div>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border-tertiary bg-background-secondary">
              <span className="text-xs font-mono text-muted">{selectedFile.path}</span>
              <span className="text-xs text-muted">{fileContent.split('\n').length} lines</span>
            </div>
            <pre className="p-4 text-xs font-mono text-primary overflow-auto whitespace-pre-wrap">
              {fileContent}
            </pre>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted">Select a file to view its content</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

# ════════════════════════════════════════════════════════
# TASK-5: Fix Chat (Claude Code) — Remove Preview Error
# ════════════════════════════════════════════════════════

## Problem
The Live Preview panel (right side of Claude Code / Chat page) shows "Something went wrong!"

## Fix: src/components/chat/LivePreviewPanel.tsx (or wherever the right panel is)

### Step 1: Add error boundary around the iframe
```tsx
function SafeIframe({ src }: { src: string | null }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Validate URL
  const safeUrl = src && (src.startsWith('http://') || src.startsWith('https://'))
    ? src
    : src ? `https://${src}` : null;

  if (!safeUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-muted">Select a project to see live preview</p>
        <p className="text-xs text-muted opacity-50">
          The preview will load automatically when a project is selected
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-muted">Preview unavailable</p>
        <p className="text-xs text-muted">{safeUrl}</p>
        <a 
          href={safeUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-info border border-info rounded px-3 py-1.5"
        >
          Open in new tab →
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-muted">Loading preview...</p>
        </div>
      )}
      <iframe
        src={safeUrl}
        className="w-full h-full border-0"
        onLoad={() => setLoading(false)}
        onError={() => { setError(true); setLoading(false); }}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        title="Project preview"
      />
    </div>
  );
}
```

### Step 2: Replace the broken right panel content with SafeIframe
Find the right panel component and replace its content rendering with SafeIframe.

### Step 3: Add default state when no project is selected
```tsx
// When no project selected in the dropdown:
{!selectedProject ? (
  <div className="flex flex-col items-center justify-center h-full gap-4">
    <div className="text-3xl opacity-20">💻</div>
    <p className="text-sm text-muted">Select a project to start</p>
    <p className="text-xs text-muted opacity-60 text-center max-w-xs">
      Choose a project from the dropdown above. I will analyze its codebase 
      and help you make changes in real-time.
    </p>
  </div>
) : (
  <SafeIframe src={selectedProject.deployUrl} />
)}
```

---

# ════════════════════════════════════════════════════════
# TASK-6: Make Chat (Claude Code) Actually Work
# ════════════════════════════════════════════════════════

## Goal
When user selects a project and types a message:
1. AI understands the full project context
2. AI proposes solution with exact file changes
3. User approves → AI executes on server
4. Changes visible immediately in preview

## Fix: src/app/api/chat/send/route.ts

```typescript
export async function POST(req: Request) {
  const { message, projectId, conversationHistory } = await req.json();
  
  // Load project context
  const project = await getProject(projectId);
  const recentTasks = await getTasks({ projectId, limit: 10 });
  const recentFiles = await getRecentlyModifiedFiles(project.repoPath, 10);
  
  const systemPrompt = `You are an expert AI Engineer with full access to the ${project.name} project.

PROJECT CONTEXT:
- Name: ${project.name}
- Tech Stack: ${project.techStack?.join(', ')}
- Repo: ${project.repoPath}
- Live URL: ${project.deployUrl}
- Current Phase: ${project.currentPhase}

RECENT TASKS COMPLETED:
${recentTasks.map(t => `- ${t.title} (${t.status})`).join('\n')}

RECENTLY MODIFIED FILES:
${recentFiles.map(f => `- ${f.path} (${f.timeAgo})`).join('\n')}

PROTECTED FILES (NEVER MODIFY):
- src/app/layout.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/navbar.tsx
- src/app/globals.css
- src/app/dashboard/self-dev/**

YOUR CAPABILITIES:
- Read any file in the project
- Write/modify files
- Run terminal commands (npm, git, pm2, etc.)
- Execute: npm run build, pm2 restart
- See build errors and fix them

RESPONSE FORMAT:
When the user reports a problem or requests a change:
1. Briefly explain what you understand the issue to be
2. Show EXACTLY what you will change (file path + code diff)
3. Ask for confirmation: "Should I apply this? [Yes/No]"

When the user approves (says "yes", "apply", "go ahead", "نعم", "طبق"):
1. Execute the changes
2. Run npm run build
3. If build fails: show error and propose fix
4. If build succeeds: confirm and refresh preview

LANGUAGE: Respond in the same language the user uses (Arabic or English).`;

  const messages = [
    ...conversationHistory.slice(-10), // Last 10 messages for context
    { role: 'user', content: message }
  ];

  // Call Claude API
  const response = await callClaude(systemPrompt, messages);
  
  // Check if response contains execution intent
  const shouldExecute = isExecutionApproval(message); // "yes", "apply", "نعم", "طبق", etc.
  
  if (shouldExecute && conversationHistory.length > 0) {
    // Extract the proposed changes from last AI message
    const lastAIMessage = conversationHistory.filter(m => m.role === 'assistant').slice(-1)[0];
    const changes = extractProposedChanges(lastAIMessage?.content || '');
    
    if (changes.length > 0) {
      // Execute changes via Bridge API
      const executionResult = await executeChanges(changes, project);
      return NextResponse.json({
        reply: response,
        executed: true,
        executionResult,
        buildStatus: executionResult.buildStatus
      });
    }
  }
  
  return NextResponse.json({ reply: response, executed: false });
}

function isExecutionApproval(message: string): boolean {
  const approvalWords = ['yes', 'apply', 'go ahead', 'do it', 'proceed',
                         'نعم', 'طبق', 'نفذ', 'اعمل', 'موافق', 'ok', 'okay'];
  const lower = message.toLowerCase().trim();
  return approvalWords.some(word => lower === word || lower.startsWith(word + ' '));
}
```

---

# ════════════════════════════════════════════════════════
# TASK-7: Add Files Upload to Chat
# ════════════════════════════════════════════════════════

## Goal: User can upload a file/image/voice in chat → AI understands it

### Step 1: Add file input to chat message box
```tsx
// In the chat input area:
<div className="flex items-end gap-2 p-4 border-t border-border-tertiary">
  {/* File attachment button */}
  <label className="cursor-pointer text-muted hover:text-primary p-2 rounded">
    <input
      type="file"
      accept="image/*,.pdf,.txt,.md,.json,.ts,.tsx,.js"
      onChange={handleFileUpload}
      className="hidden"
    />
    📎
  </label>
  
  {/* Voice button */}
  <button
    onMouseDown={startRecording}
    onMouseUp={stopRecording}
    className={`p-2 rounded text-muted hover:text-primary ${isRecording ? 'text-danger' : ''}`}
  >
    🎤
  </button>
  
  {/* Text input */}
  <textarea
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
    placeholder="Describe a problem, request a change, or upload a file..."
    className="flex-1 bg-background-secondary border border-border-tertiary rounded-lg 
               px-3 py-2 text-sm resize-none min-h-[40px] max-h-[120px]"
    rows={1}
  />
  
  <button onClick={sendMessage} className="text-muted hover:text-primary p-2">→</button>
</div>
```

### Step 2: Handle file upload in send function
```typescript
async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  
  if (file.type.startsWith('image/')) {
    // Convert to base64 for vision
    const base64 = await fileToBase64(file);
    setAttachment({ type: 'image', base64, name: file.name });
    setMessage(prev => prev || `I uploaded a screenshot: ${file.name}`);
  } else {
    // Read text content
    const content = await file.text();
    setAttachment({ type: 'file', content, name: file.name });
    setMessage(prev => prev || `I uploaded a file: ${file.name}`);
  }
}
```

---

# ════════════════════════════════════════════════════════
# TASK-8: GenPlatform.ai Project — Sync All Real Data
# ════════════════════════════════════════════════════════

## Goal: When opening GenPlatform.ai project, show all REAL data

### Step 1: Find GenPlatform.ai project ID in database
```bash
# Run this on server to find the project ID:
cd /root/genplatform && node -e "
const db = require('./src/lib/db');
db.query('SELECT id, name FROM projects').then(r => console.log(r.rows));
"
```

### Step 2: Populate GenPlatform.ai with real pipeline data
Create a sync script: /root/genplatform/scripts/sync-genplatform.ts
```typescript
// This script reads real data from /root/genplatform and updates the project record
async function syncGenPlatformData() {
  const projectId = 'GENPLATFORM_PROJECT_ID'; // Replace with real ID from Step 1
  
  // Count real files
  const tsxFiles = await exec('find /root/genplatform/src -name "*.tsx" | wc -l');
  const tsFiles = await exec('find /root/genplatform/src -name "*.ts" | wc -l');
  
  // Get git history
  const commits = await exec('cd /root/genplatform && git log --oneline -50');
  
  // Get real task count
  const tasks = await db.query('SELECT * FROM tasks WHERE project_id = $1', [projectId]);
  
  // Update pipeline stages based on actual completion
  const pipelineData = {
    idea: { status: 'done', completedAt: '2026-03-18' },
    analysis: { status: 'done', completedAt: '2026-03-18' },
    planning: { status: 'done', completedAt: '2026-03-19' },
    development: {
      status: 'active',
      totalTasks: tasks.rows.length,
      completedTasks: tasks.rows.filter(t => t.status === 'done').length
    },
    review: { status: 'pending' },
    security: { status: 'pending' },
    deploy: { status: 'pending', liveUrl: 'https://nuxim.gen3.ai' }
  };
  
  await db.query(
    'UPDATE projects SET pipeline_data = $1, metadata = $2 WHERE id = $3',
    [JSON.stringify(pipelineData), JSON.stringify({ fileCount: parseInt(tsxFiles) + parseInt(tsFiles), commits: commits.split('\n').length }), projectId]
  );
  
  console.log('GenPlatform data synced successfully');
}

syncGenPlatformData();
```

Run: `cd /root/genplatform && npx ts-node scripts/sync-genplatform.ts`

---

# ════════════════════════════════════════════════════════
# TASK-9: Final Build and Verification
# ════════════════════════════════════════════════════════

```bash
cd /root/genplatform
npm run build

# If build passes:
pm2 restart genplatform-app
pm2 restart bridge-api

# Wait 5 seconds
sleep 5

# Verify routes respond:
curl -s -o /dev/null -w "%{http_code}" https://app.gen3.ai/dashboard/projects
# Should return 200
```

## Checklist before marking complete:
- [ ] Creating a project auto-generates subdomain from name
- [ ] Deploy URL field is gone, replaced with "slug.gen3.ai" display
- [ ] GitHub repo created automatically (if GITHUB_TOKEN is set)
- [ ] Clicking a project card navigates to /dashboard/projects/[id]
- [ ] /dashboard/projects/[id] shows Pipeline tab by default
- [ ] Pipeline stages are clickable and show detail panels
- [ ] "Claude Code" in sidebar renamed to "Chat"
- [ ] Old Chat page redirects to new Chat page
- [ ] Chat right panel shows no error (shows fallback message when no project selected)
- [ ] Files tab works — can browse project directory tree
- [ ] Files tab can display file content
- [ ] Chat sends messages to Claude API with project context
- [ ] Chat responds with proposed changes before executing
- [ ] Chat executes changes after user approval
- [ ] GenPlatform.ai shows real task count and pipeline status

---

# EXECUTION ORDER
1. TASK-1 (project creation — auto subdomain + GitHub)
2. TASK-2 (fix project click navigation)
3. TASK-5 (fix chat preview error — quickest fix)
4. TASK-3 (rename Claude Code to Chat)
5. TASK-4 (sync real data — file manager API)
6. TASK-6 (make chat actually work with AI)
7. TASK-7 (file upload in chat)
8. TASK-8 (sync GenPlatform.ai data)
9. TASK-9 (final build + verification)

Build after each task. Report via Telegram after each task completes.
Never stop — if one task fails, skip it and continue to next, report the skip.
