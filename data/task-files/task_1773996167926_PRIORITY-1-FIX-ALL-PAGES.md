# ═══════════════════════════════════════════════════════════════
# الأولوية 1: إصلاح كل الصفحات الحالية
# كل رسالة = صفحة واحدة
# ═══════════════════════════════════════════════════════════════
# قبل البدء أرسل /reset ثم:
# "Read ~/.openclaw/workspace/memory/WORK-RULES.md and 
#  ~/.openclaw/workspace/memory/GENPLATFORM-CONTEXT.md.
#  We are fixing all existing pages. Follow all rules. Confirm: Ready"
# ═══════════════════════════════════════════════════════════════


# ─────────────────────────────────────────
# الرسالة 1: إصلاح Gateway Offline Notification
# ─────────────────────────────────────────

URGENT FIX: The "Gateway Offline" notification appears on EVERY page even when gateway is running. Fix it completely.

Project: /root/genplatform. Site: https://app.gen3.ai.

DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, or globals.css.

Task 1: Open src/components/notifications/notification-system.tsx (or wherever the Gateway Offline banner is). Find where it checks gateway status. It currently checks incorrectly. Fix the logic:
- Fetch /api/bridge/status
- If response has gateway.status === 'running' OR services array has a running gateway → gateway IS online → do NOT show warning
- If fetch fails OR gateway not running → show warning
- Add try/catch so if Bridge API is down, show "Connecting..." not "Gateway Offline"

Task 2: The notification "CPU usage has been above 85%" is fake/hardcoded. Remove it. Only show REAL notifications:
- Gateway status (from /api/bridge/status)
- Real CPU alert only if /api/bridge/metrics returns cpu > 85
- Build/deploy status

Task 3: The notification bell in the top bar shows a red badge with count. Make sure the count matches REAL unread notifications only. If no real alerts, badge should be hidden.

Task 4: Also check if there is a NotificationBell.tsx component that duplicates this logic. If yes, consolidate into one system.

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Fix Gateway Offline notification + remove fake alerts" && git push

🔗 Preview: https://app.gen3.ai/dashboard
Do all 4 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 2: إصلاح Dashboard
# ─────────────────────────────────────────

Fix the Dashboard page to be professional and useful.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Live Task Monitor widget at the top. Currently shows "Sprint 0D" and old data. Fix:
- Fetch from /api/bridge/live-status for current task info
- Show: Current phase name, current task name, progress bar
- Make it clickable → navigates to /dashboard/tasks
- If no active task: show "All tasks complete — waiting for next assignment"
- Remove "Sprint 0D" text. Replace with real phase from PROGRESS.md

Task 2: Stat Cards row (All Projects, Tasks, Team, Automations, Reports, Security). Fix each:
- All Projects: fetch /api/projects → show real count + active/completed
- Tasks: fetch /api/tasks → show real done/total + completion rate
- Team: keep 1 active (hardcoded is fine for now)
- Automations: fetch /api/workflows → show real active count
- Reports: fetch /api/bridge/reports or keep current if working
- Security: show "Healthy" with real last check time from /api/bridge/status

Task 3: System Performance section at bottom. Must show REAL data:
- CPU Usage: fetch /api/bridge/metrics → resources.cpu.usage → show percentage with color (green <60, amber <80, red >80)
- Memory Usage: same from metrics → resources.memory.usage
- Remove any hardcoded percentages

Task 4: Quick Actions section. Make ALL buttons work:
- "New Project" → navigate to /projects with create dialog open, OR call /api/projects POST
- "View Projects" → navigate to /projects
- "View Reports" → navigate to /dashboard/reports
- "Generate Report" → navigate to /dashboard/reports with generate dialog
- "Manage Team" → navigate to /dashboard/users
- "System Health" → navigate to /dashboard/monitoring

Task 5: Activity Stream. Show real recent events:
- Fetch last 5 git commits from /api/bridge/logs or hardcode last known commits
- Each entry: icon + message + time ago
- Remove any fake "Task 0D-23 completed" entries

Task 6: Workflows section. Either show real workflows from /api/workflows or hide the section if empty. "No workflows running" is fine but "Start Workflow" button should navigate to /automations.

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Dashboard: all real data, working buttons, professional layout" && git push

🔗 Preview: https://app.gen3.ai/dashboard
Do all 6 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 3: إصلاح Top Navigation Bar
# ─────────────────────────────────────────

Fix the top navigation bar to show correct user info.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT change the dark background color, layout structure, or sidebar. ONLY fix the user display area on the right side of the navbar.

Task 1: The user avatar area shows "U User Member". Fix:
- Show "Med" as the name (from auth cookie or hardcode)
- Show "OWNER" badge instead of "Member" (green badge)
- The dropdown menu should show: Profile, Settings, Sign out
- Profile link → /dashboard/settings (not /profile which is 404)

Task 2: Sign Out button must work:
- Clear the auth-token cookie
- Redirect to /login
- After sign out, accessing /dashboard should redirect to /login (not show data)

Task 3: The "Select Project" dropdown in the top bar. Make it functional:
- Fetch /api/projects to get project list
- When selected, store in localStorage or context
- Show selected project name in the dropdown
- Default: "GenPlatform.ai"

Task 4: Navigation links (Dashboard, Projects, Automations, Reports) — verify all navigate correctly:
- Dashboard → /dashboard
- Projects → /projects
- Automations → /automations
- Reports → /dashboard/reports

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Fix navbar: user info, sign out, project selector" && git push

🔗 Preview: https://app.gen3.ai/dashboard
Do all 4 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 4: إصلاح Command Center
# ─────────────────────────────────────────

Fix the Command Center page to be useful and connected to real actions.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Status cards at top. Fix each:
- System Health: fetch /api/bridge/status. If gateway running → "Healthy" (green). If not → "Warning" (amber)
- Resource Usage: fetch /api/bridge/metrics. Show real CPU%, Memory%, Disk%
- Active Users: show "1" (Med, OWNER). Remove "12" and "8 active tasks" fake data
- Services Status: fetch /api/bridge/status. List real services: OpenClaw Gateway (running/stopped), Bridge API (running), Next.js (running)

Task 2: Quick Actions — make ALL buttons execute real commands:
- "Restart Gateway": POST /api/bridge/gateway → show success/error toast
- "System Health Check": GET /api/bridge/metrics → show results in a modal
- "View Logs": navigate to /dashboard/monitoring (Logs tab)
- "Clear System Cache": show "Cache cleared" toast (can be cosmetic for now)
- "Backup Memory Files": POST /api/bridge/memory with action=backup → show toast
- "Update All Skills": show "Skills are up to date" toast
- "Optimize Database": show "Optimization complete" toast
- "Export System Logs": download /api/bridge/logs as JSON file
- "Network Connectivity Test": fetch /api/bridge/health → show latency result
- "Disk Space Cleanup": show "Cleanup complete" toast
- "Reset Configuration": show confirmation dialog → "Are you sure?" → do nothing on confirm (safety)

Task 3: Remove the "Terminal" and "Services" tabs if they don't have real content. Keep only "Quick Actions" tab.

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Command Center: real status, working actions" && git push

🔗 Preview: https://app.gen3.ai/dashboard/command-center
Do all 3 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 5: إصلاح Memory Page
# ─────────────────────────────────────────

The Memory page at /dashboard/memory is broken. Fix it completely.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: The page should load the file tree from Bridge API. On mount:
- Fetch GET /api/bridge/memory
- Response has: tree (array of files/folders), stats (totalFiles, totalFolders, totalSize)
- Display tree on the LEFT side as a file browser (folders expandable, files clickable)
- Display stats in the top cards: Total Files, Projects count, Areas count, Resources count

Task 2: When clicking a file in the tree:
- Fetch GET /api/bridge/memory?path=[filePath]
- Response has: content (string), name, path, size
- Display content in the RIGHT panel
- If file ends with .md: render as formatted text (preserve line breaks, headers)
- If other format: show as monospace plain text
- Show file name and path above the content

Task 3: Add EDIT functionality:
- "Edit" button appears when viewing a file
- Click → content becomes a textarea (editable)
- "Save" button → PUT /api/bridge/memory with body {path: filePath, content: newContent}
- Show success toast on save
- "Cancel" button → reverts to view mode without saving

Task 4: Add NEW FILE button in the header:
- Click → modal with two fields: "File path" (e.g. notes/meeting.md) and "Content" (textarea)
- Submit → PUT /api/bridge/memory with {path, content}
- On success → refresh tree and select the new file
- Validate: path cannot be empty, cannot contain ".."

Task 5: Stats cards at top should show:
- Total Files: real count from API
- Projects: count files in projects/ folder
- Areas: count files in areas/ folder  
- Resources: count files in resources/ folder
- Last Updated: most recent file modification date

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Memory page: file browser, edit, create, real data" && git push

🔗 Preview: https://app.gen3.ai/dashboard/memory
Do all 5 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 6: إصلاح Settings + Authentication
# ─────────────────────────────────────────

Fix Settings page and authentication system completely.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Settings page — make Save Changes work:
- Profile section: Full Name and Timezone should be saved
- Create/update PUT /api/settings route that stores settings in a JSON file on disk (/root/genplatform/data/settings.json)
- On page load: GET /api/settings → populate fields
- On Save: PUT /api/settings → write to file → success toast
- Add '/api/settings' to CSRF skip list

Task 2: Password change:
- Add "Change Password" section in Settings
- Two fields: New Password, Confirm Password
- On submit: POST /api/auth/change-password
- Create this route: validates passwords match, updates the password variable
- Show success/error toast

Task 3: Sign Out — fix completely:
- The Sign Out button (in navbar dropdown AND settings page) must:
  1. Call POST /api/auth/logout (create if not exists)
  2. This route clears the auth-token cookie: Set-Cookie: auth-token=; Path=/; HttpOnly; Max-Age=0
  3. Redirect to /login
- After sign out: visiting /dashboard must redirect to /login
- The middleware should check auth-token on every request to /dashboard/*

Task 4: Login page security:
- After login, should NOT show sidebar or any dashboard content on the login page itself
- Login page should be a clean standalone page without sidebar

Task 5: Notifications settings (Daily Reports toggle, System Alerts toggle):
- Save state to settings.json
- These can be cosmetic for now (save the boolean but don't connect to real notifications yet)

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Settings: save, password change, sign out, auth security" && git push

🔗 Preview: https://app.gen3.ai/dashboard/settings
Do all 5 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 7: إصلاح Skills Library
# ─────────────────────────────────────────

Improve the Skills Library page.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Skills are loading (27-35 skills from Bridge API). Good. But improve the cards:
- Each skill card should show: name, status (active badge), category badge, description (first 100 chars)
- Add which DEPARTMENT uses this skill. Map skills to departments:
  * developer, senior-dev, coding-agent → 💻 Frontend/Backend Dev
  * deep-research-pro, exa-search, tavily-search → 🔬 Research
  * security-scanner, security-audit-toolkit → 🛡️ Security
  * critical-code-reviewer → 🔍 QA
  * auto-continue, task-planner → 📋 Planning
  * self-improving-agent → 📈 Self-Improvement
- Show department icon badge on each card

Task 2: Click a skill card → open a detail modal:
- Fetch skill details: GET /api/bridge/skills?name=[skillName]
- Show: full name, description, version, category, department, last used date
- If the skill has a SKILL.md content, show it in a scrollable area
- Close button to dismiss

Task 3: "Add Skill" button in header should show a message: "Skills are managed through OpenClaw. Use the Command Center to update skills." with a link to /dashboard/command-center.

Task 4: Category filter should work with real data:
- "all" shows everything
- "development" filters to developer, coding-agent, etc.
- "research" filters to search and research skills
- "security" filters to security skills
- "productivity" filters to auto-continue, task-planner, etc.

Task 5: Stats cards at top:
- Total Skills: real count
- Development: count of dev skills
- Research: count of research skills
- Security: count of security skills
- Productivity: count of productivity skills

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Skills: department mapping, detail modal, working filters" && git push

🔗 Preview: https://app.gen3.ai/dashboard/skills
Do all 5 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 8: إصلاح Cron Jobs + New Job
# ─────────────────────────────────────────

Improve Cron Jobs page with smart job creation.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Stats cards fix:
- Total Jobs: show real count from /api/bridge/cron (should be 3-4)
- Running: count of jobs currently executing
- Failed Today: count of failed jobs today
- Next Job: show time until next execution in human readable format ("in 2h 15m")

Task 2: Job list is working. Improve each job card:
- Show: name, human-readable schedule, last run time, next run time, status badge
- The "Run" toggle should work: POST to /api/bridge/cron/[id]/toggle (create if needed)
- The "..." menu should have: Edit, Delete, Run Now options

Task 3: "New Job" button — make it smart:
- Click → modal with:
  * "What do you want to schedule?" (textarea — natural language)
  * Examples shown below: "Send me a daily progress report at 8 AM", "Check system health every hour", "Backup memory files every Sunday"
- On submit: POST /api/cron/create-smart
- Create this API route that:
  * Takes the natural language description
  * Sends to OpenClaw via Telegram: "Create a cron job: [description]. Respond with: name, cron expression, command."
  * Returns the parsed result to the frontend
  * Shows preview: "Name: daily-report | Schedule: 0 8 * * * (Daily at 8:00 AM) | Command: ..."
  * "Confirm" button → creates the job via openclaw cron create

Task 4: Each job should show the cron expression in human readable form:
- "0 7 * * *" → "Daily at 7:00 AM"
- "0 21 * * *" → "Daily at 9:00 PM"
- "0 10 * * 0" → "Weekly on Sunday at 10:00 AM"
- "*/5 * * * *" → "Every 5 minutes"

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Cron: smart job creation, working toggles, human schedules" && git push

🔗 Preview: https://app.gen3.ai/dashboard/cron
Do all 4 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 9: إصلاح System Monitoring
# ─────────────────────────────────────────

Fix System Monitoring page with all real data.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: System Health bar at top:
- Services: fetch /api/bridge/status → count running vs total
- Resources: fetch /api/bridge/metrics → show healthy if CPU<80 and RAM<80 and Disk<90
- Network: always "Connected" (the server is online if you can see this page)

Task 2: Resources tab — show ALL real metrics from /api/bridge/metrics:
- CPU Usage: percentage bar + number (real from server)
- Memory Usage: used/total in GB + percentage bar
- Disk Usage: used/total in GB + percentage bar
- Swap: used/total (if available from metrics)
- Load Average: 1min, 5min, 15min (if available)
- Uptime: real system uptime

Task 3: Services tab — show real services:
- Fetch /api/bridge/status → services array
- Each service: name, status (running/stopped), uptime, port
- Must show: OpenClaw Gateway, Bridge API, Next.js (genplatform-app)
- If service down: red indicator. If up: green.

Task 4: Logs tab — show real parsed logs:
- Fetch /api/bridge/logs → lines array
- Each log: timestamp, level (info/warn/error), message
- Color code: info=gray, warn=amber, error=red
- Auto-scroll to bottom
- "Refresh" button to reload

Task 5: Auto-refresh toggle (already exists at top right). Make sure it works:
- When ON: poll every 5 seconds for new metrics
- When OFF: stop polling
- The interval selector (5000ms dropdown) should change poll rate

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Monitoring: all real metrics, services, logs" && git push

🔗 Preview: https://app.gen3.ai/dashboard/monitoring
Do all 5 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 10: إصلاح Analytics Dashboard
# ─────────────────────────────────────────

Fix Analytics Dashboard with real or meaningful data.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Stats cards at top:
- Total Sessions: fetch /api/bridge/sessions → real count (probably 2-3)
- Skill Executions: show 0 with note "Tracking starts now" (we don't have historical data)
- Response Time: show "~2.5s" (average AI response time)
- Memory Operations: fetch /api/bridge/memory → stats.totalFiles count

Task 2: Usage Trends chart area. Since we don't have historical data yet:
- Show a clean message: "📊 Collecting data — Charts will appear after 24h of monitoring"
- Add a small info icon explaining: "Analytics data is collected in real-time. Check back tomorrow for trends."
- Do NOT show fake random charts

Task 3: Tabs (Overview, Skills, Memory, Performance):
- Overview: the stats + trends message above
- Skills: fetch /api/bridge/skills → show skills by category as a simple bar chart (Development: 4, Research: 3, Security: 3, Productivity: 5)
- Memory: fetch /api/bridge/memory → show files by folder as a bar chart
- Performance: fetch /api/bridge/metrics → show current CPU, RAM, Disk as gauge charts or progress bars

Task 4: Remove ALL fake numbers. If real data is 0, show 0. Never show random generated numbers like "1.42843582752945".

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Analytics: real data, no fake charts, clean placeholders" && git push

🔗 Preview: https://app.gen3.ai/dashboard/analytics
Do all 4 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 11: إصلاح Reports & Analytics
# ─────────────────────────────────────────

Fix Reports page.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Stats cards:
- Total Reports: this seems to show 47 which is fake. Fix: count real reports from the API or show accurate number
- Success Rate: show real or "N/A" if no data
- Avg Generation: show "~30s" (reasonable estimate)
- Last Generated: show real timestamp of last report

Task 2: Report list. Currently shows "Daily System Report" etc. Make these real:
- Keep existing reports if they look reasonable
- Each report card: title, description, status badge, tags, created date, size
- Click a report → navigate to report detail page (/reports/[id])

Task 3: "Generate Report" button in header:
- Click → modal with: Report Type dropdown (Daily Summary, Weekly Review, Security Audit, Performance Report), Date Range, Description
- Submit → POST /api/reports/generate
- This route sends to OpenClaw: "Generate a [type] report for [date range]. Include: system metrics, tasks completed, issues found."
- Show "Generating..." state while waiting
- On complete → add to report list

Task 4: "Compare Reports" and "Export Reports" buttons:
- Compare: show "Select 2 reports to compare" (can be cosmetic for now)
- Export: download reports list as JSON file

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Reports: real data, generate button, clean stats" && git push

🔗 Preview: https://app.gen3.ai/dashboard/reports
Do all 4 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 12: إصلاح Automations/Workflows
# ─────────────────────────────────────────

Fix Automations page with working workflows.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Verify the page loads at /automations. Currently it shows 404 sometimes. Check the route:
- If page is at src/app/automations/page.tsx → make sure it works
- If page is at src/app/(dashboard)/automations/page.tsx → check routing
- The sidebar links to /automations → this path must work

Task 2: Stats cards:
- Total Workflows: fetch /api/workflows → real count
- Active Workflows: count where status=active
- Success Rate: calculate from completed/total
- Failed Workflows: count where status=failed

Task 3: Workflow list. Show 3 demo workflows that make sense:
- "Idea to MVP": Takes an idea → analyzes → creates tasks → assigns to agents
- "Bug Fix Pipeline": Detects bugs → creates fix task → assigns to dev → reviews
- "Code Review": When code is pushed → reviews → reports issues
- Each workflow: name, description, type, last run time, status, action buttons (Run, Edit, Delete)

Task 4: "New Workflow" button:
- Click → modal with: Name, Description, Trigger (Manual/Scheduled/On Push), Steps
- Submit → POST /api/workflows → add to list
- Show success toast

Task 5: "Browse Marketplace" button → show message: "Marketplace coming soon. Currently 3 built-in workflows available."

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Automations: working page, real workflows, new workflow button" && git push

🔗 Preview: https://app.gen3.ai/automations
Do all 5 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 13: إصلاح Projects Page
# ─────────────────────────────────────────

Improve Projects page.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Project cards look good. Improve:
- Each card: name, description, status badge (green=active, amber=paused), progress bar with %, tech stack tags, last activity time
- "Command" button → opens chat in project context
- "Edit" button → opens project settings
- The external link icon → opens preview URL in new tab

Task 2: "New Project" button must work:
- Click → modal with: Project Name (required), Description, Tech Stack (multi-select or tags), GitHub URL, Preview URL, Priority
- Submit → POST /api/projects
- On success → project appears in list
- Navigate to new project's detail page

Task 3: Click on project card → navigate to /projects/[id]:
- This page should have tabs: Overview, Preview, Tasks, Chat, Settings
- Overview: name, description, progress, recent activity
- Preview: iframe with project URL (if previewUrl is set)
- Tasks: filtered Kanban for this project
- Chat: project-specific chat
- Settings: edit project details

Task 4: For GenPlatform.ai project: previewUrl should be "https://app.gen3.ai". When you click Preview tab, it should show the live site in an iframe with device toggles (Desktop/Tablet/Mobile).

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Projects: improved cards, new project, detail page with preview" && git push

🔗 Preview: https://app.gen3.ai/projects
Do all 4 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 14: إصلاح Users/Team Page
# ─────────────────────────────────────────

Fix Users and Team page.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: The Users page should show the team. Currently shows Med (OWNER). Make it look professional:
- Card for Med: name "Med", role "OWNER", status "Active" (green dot), email "owner@genplatform.ai", last active "Just now"
- Show avatar placeholder (circle with "M" letter)

Task 2: "Invite Member" button → show modal:
- Fields: Email, Display Name, Role (Viewer/Manager/Admin)
- Submit → show toast "Invitation sent to [email]" (cosmetic — we don't have email system yet)
- Note below: "Members will receive an email invitation"

Task 3: Role badges should be styled:
- OWNER: red/premium badge
- ADMIN: purple badge
- MANAGER: blue badge
- VIEWER: gray badge

Task 4: Table view (if exists) should show: Avatar, Name, Email, Role, Status, Last Active, Actions (Edit/Remove)

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Users: professional team display, invite modal" && git push

🔗 Preview: https://app.gen3.ai/dashboard/users
Do all 4 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 15: إصلاح Help & Support + Security Pages
# ─────────────────────────────────────────

Fix Help and Security pages.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Help & Support page (/help or wherever it is):
- Show sections: Getting Started, FAQ, Documentation, Contact
- Getting Started: 4 steps (Login → Dashboard → Create Project → Start Building)
- FAQ: 5 common questions with expandable answers about GenPlatform
- Documentation: link to external docs (can be placeholder)
- Contact: "Contact the platform owner via Telegram"
- Make sure the page exists and is accessible from sidebar

Task 2: Security page (/dashboard/security):
- Show security status overview
- Last security scan: date/time
- Vulnerabilities found: 0
- SSL Certificate: Valid (auto from Caddy)
- Authentication: Enabled
- API Security: CSRF Protection active
- "Run Security Scan" button → POST to OpenClaw requesting a security audit
- Show scan results

Task 3: Make sure both pages are in the sidebar under ADMINISTRATION section with correct links.

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Help + Security pages complete" && git push

🔗 Preview: https://app.gen3.ai/help and https://app.gen3.ai/dashboard/security
Do all 3 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 16: Sidebar — إضافة الروابط الناقصة
# ─────────────────────────────────────────

IMPORTANT: The sidebar is MISSING links to new pages from Phase 2. Add them WITHOUT changing the design.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT change colors, layout structure, fonts, spacing. ONLY add new items to existing arrays.

Task 1: Open src/components/layout/sidebar.tsx. Find the navigation items arrays. Add these MISSING links in the correct sections:

OVERVIEW section (add if missing):
- Dashboard → /dashboard
- Command Center → /dashboard/command-center (with "New" badge)
- Chat → /dashboard/chat

CORE FEATURES section (add if missing):
- Skills → /dashboard/skills
- Memory → /dashboard/memory
- Cron Jobs → /dashboard/cron
- Projects → /projects
- Tasks → /dashboard/tasks (NEW — add this)
- Ideas → /ideas (NEW — add this if page exists)
- Automations → /automations
- Agents → /agents (NEW — add this if page exists)

MONITORING section:
- System Monitor → /dashboard/monitoring
- Analytics → /dashboard/analytics
- Reports → /dashboard/reports

ADMINISTRATION section:
- Settings → /dashboard/settings
- Users → /dashboard/users
- Security → /dashboard/security
- Help & Support → /help

Task 2: Verify EVERY link works by checking that each page file exists:
- ls src/app/dashboard/tasks/page.tsx
- ls src/app/(dashboard)/ideas/page.tsx OR src/app/ideas/page.tsx
- ls src/app/agents/page.tsx OR src/app/(dashboard)/agents/page.tsx
- For pages that don't exist: create a simple placeholder page

Task 3: Make sure sidebar highlights the current active page correctly.

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Sidebar: add all missing navigation links" && git push

🔗 Preview: https://app.gen3.ai/dashboard (check sidebar)
Do all 3 tasks NOW.
