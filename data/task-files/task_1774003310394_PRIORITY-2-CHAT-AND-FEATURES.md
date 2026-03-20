# ═══════════════════════════════════════════════════════════════
# الأولوية 2: نظام الشات الاحترافي + المشاريع المتقدمة
# ═══════════════════════════════════════════════════════════════


# ─────────────────────────────────────────
# الرسالة 17: الشات الاحترافي — Split View
# ─────────────────────────────────────────

Build a professional Chat page like ChatGPT with split view.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Completely rebuild src/app/dashboard/chat/page.tsx as a split-view layout:
- LEFT side (40% width): Chat interface
- RIGHT side (60% width): Live preview iframe
- A draggable divider between them (optional, fixed split is ok)

Task 2: LEFT side — Chat interface:
- Top bar: Project selector dropdown (fetch from /api/projects), current project name displayed
- Chat permissions badges: "Read/Write", "Commander Enabled"
- Message area (scrollable, flex-grow):
  * User messages: right-aligned, blue-ish dark background, rounded corners
  * AI messages: left-aligned, darker background, rounded corners
  * System messages: centered, small, gray
  * Each message: avatar, name, timestamp, content
  * Auto-scroll to bottom on new message
- Bottom input area:
  * Text input with placeholder "Type your message (English or Arabic)..."
  * Send button (arrow icon)
  * If text contains Arabic characters → show blue banner: "Commander Mode — Arabic will be translated to English command"
  * Input direction: auto-detect RTL for Arabic

Task 3: RIGHT side — Live Preview:
- iframe src = selected project's previewUrl
- Device toggle buttons above: Desktop (100% width), Tablet (768px), Mobile (375px)
- "Open in new tab" button
- "Refresh" button to reload iframe
- If no project selected or no previewUrl: show "Select a project to preview" message

Task 4: Message sending flow:
- User types message → press Enter or click Send
- Add message to local state immediately (optimistic)
- POST /api/chat/send with {message, projectId}
- Show "AI is thinking..." indicator
- The message includes project context: "[Project: {name} | Path: {path}] {message}"
- Bot token: 8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4
- Owner chat: 510906393

Task 5: When project changes in dropdown:
- Update the preview iframe src
- Clear chat or show project-specific chat history
- Update context for messages

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Chat: professional split view with preview" && git push

🔗 Preview: https://app.gen3.ai/dashboard/chat
Do all 5 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 18: Tasks/Kanban Board المتقدم
# ─────────────────────────────────────────

Improve the Tasks/Kanban page to be fully functional.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: The Kanban page at /dashboard/tasks should have:
- 5 columns: Backlog (gray) | Planned (blue) | In Progress (amber) | Review (purple) | Done (green)
- Each column: colored top border, title, task count badge
- Top bar: Progress bar ("X of Y tasks done"), Search, Role filter, Sprint filter, View toggle (Board/List)

Task 2: Task cards in columns:
- Task number (T-01), name (bold), assigned department icon+name
- Priority badge (red=high, amber=medium, green=low)
- Estimated time
- If in_progress: show elapsed time since started
- If done: show actual vs estimated time
- "→ Move" button to advance to next column

Task 3: New Task button:
- Modal with: Name, Description, Assigned Department (dropdown with 7 departments), Priority, Estimated Time, Sprint
- Submit → POST /api/tasks → add to Backlog column

Task 4: Click task card → Detail modal:
- Full details: name, description, department, priority, sprint, times
- Status change buttons: Plan → Start → Review → Complete
- Notes textarea
- History of status changes

Task 5: Initialize with real tasks from our development:
- T-01: Fix Gateway notification (done)
- T-02: Fix Dashboard real data (done) 
- T-03: Fix Memory page (done)
- T-04: Build Chat split view (in_progress)
- T-05: Build 3D visualization (planned)
- T-06: Arabic/RTL support (backlog)
- T-07: Voice input (backlog)
- T-08: Token tracking (backlog)
- Plus more realistic tasks

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Kanban: full board, task CRUD, detail modal" && git push

🔗 Preview: https://app.gen3.ai/dashboard/tasks
Do all 5 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 19: Agents Page الاحترافية
# ─────────────────────────────────────────

Build a professional Agents page showing all 7 AI departments.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Create/improve the Agents page at src/app/agents/page.tsx or src/app/(dashboard)/agents/page.tsx. Make sure it's accessible from sidebar.

Task 2: Header with stats:
- Total Departments: 7
- Currently Active: count from /api/bridge/status (if gateway running, at least 1 active)
- Tasks Completed: total across all departments
- Skills Available: count from /api/bridge/skills

Task 3: Department cards (2-column grid):
🔬 Research Analyst — Skills: deep-research-pro, exa-search, tavily-search — "Conducts market research and competitive analysis"
📋 Architecture & Planning — Skills: task-planner, project-architect — "Designs system architecture and sprint roadmaps"
💻 Frontend Development — Skills: developer, senior-dev, coding-agent — "Builds React components and UI features"
⚙️ Backend Development — Skills: developer, api-builder — "Creates API endpoints and server logic"
🔍 Quality Assurance — Skills: critical-code-reviewer — "Reviews code quality and runs tests"
🛡️ Security — Skills: security-scanner, security-audit-toolkit — "Scans vulnerabilities and audits code"
📈 Self-Improvement — Skills: self-improving-agent — "Analyzes performance and suggests improvements"

Task 4: Each card shows:
- Icon + name + status indicator (green pulsing=active, gray=idle)
- Current task if active
- Skills as small badges
- Mini weekly activity chart (7 bars, can be placeholder data)
- Last action with timestamp
- Task count completed

Task 5: Toggle view: Cards (default) vs Skills Matrix (table showing departments as rows, skills as columns, checkmark where they match)

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Agents: 7 departments, cards, matrix view" && git push

🔗 Preview: https://app.gen3.ai/agents
Do all 5 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 20: Ideas Lab الاحترافية
# ─────────────────────────────────────────

Build a professional Ideas Lab page with pipeline visualization.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: The Ideas page at /ideas or /(dashboard)/ideas. Must be accessible from sidebar. Shows the idea pipeline:
- Pipeline stages displayed as horizontal tabs or columns: Pending → Research → Planning → Approved → In Development
- Stats cards: Total Ideas, Pending, Approved, In Development

Task 2: Each idea card:
- Title, description (truncated), status badge, priority badge
- Vote count with up/down buttons
- Submitted by + date
- Category badge (project/feature/enhancement/bug)

Task 3: "Submit Idea" button:
- Modal with: Title (required), Description (textarea), Category (dropdown), Priority (dropdown)
- Submit → POST /api/ideas
- Idea starts in "Pending" status

Task 4: Idea detail — click an idea:
- Full view with all fields
- "Research" button → POST /api/ideas/[id]/research → sends to OpenClaw for analysis
- "Approve" button → changes status to "Approved"
- "Create Tasks" button → POST /api/ideas/[id]/create-tasks → generates Kanban tasks
- Research notes area (editable, saved via PUT /api/ideas/[id])

Task 5: Initialize with 4 ideas:
- "Online Marketplace for Morocco" (approved, high priority)
- "AI Writing Assistant" (pending, medium)
- "Mobile App Version" (research, low)
- "Voice Commands for Arabic" (pending, medium)

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Ideas Lab: pipeline, submit, research, approve" && git push

🔗 Preview: https://app.gen3.ai/ideas
Do all 5 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 21: APIs & Integrations Page (جديدة)
# ─────────────────────────────────────────

Create a new APIs & Integrations page.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css. ONLY add the new page and a link in sidebar.

Task 1: Create src/app/dashboard/integrations/page.tsx. This page shows all connected services.

Task 2: Service cards (each with status indicator):
- OpenClaw Gateway: status from /api/bridge/status, model name, version
- Telegram Bot: connected (token exists), bot name, owner chat ID (masked: 5109****93)
- GitHub: connected, repo name (immotlh7/genplatform), last push time
- Bridge API: status from /api/bridge/health, endpoint count (10+), port 3001
- Caddy (SSL): running, domains (app.gen3.ai), certificate status
- Claude API: connected via OpenClaw, model: claude-opus-4, plan: Pro Max

Task 3: Each card has:
- Service icon, name, status badge (green=connected, red=disconnected)
- Key details (masked for security)
- "Test Connection" button → pings the service and shows result
- Last checked timestamp

Task 4: Token Usage section (if possible):
- Show: "OpenClaw Session: X% of 200K context used"
- This can fetch from /api/bridge/sessions

Task 5: Add link in sidebar under ADMINISTRATION: "Integrations" → /dashboard/integrations
REMEMBER: Only ADD the link, do not change sidebar design.

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "New page: APIs & Integrations dashboard" && git push

🔗 Preview: https://app.gen3.ai/dashboard/integrations
Do all 5 tasks NOW.
