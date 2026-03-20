# ═══════════════════════════════════════════════════════════════
# الأولوية 3: الميزات المتقدمة
# 3D Visualization + Voice + Arabic + Security
# ═══════════════════════════════════════════════════════════════


# ─────────────────────────────────────────
# الرسالة 22: Project Detail — التصور البصري للتدفق
# ─────────────────────────────────────────

Build an interactive pipeline visualization for the project detail page.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: In the project detail page (/projects/[id]), add a new tab called "Pipeline" after the Overview tab.

Task 2: Build an animated pipeline flow using SVG + CSS animations (NOT Three.js for now — keep it simple and reliable):
- Horizontal flow diagram showing stages:
  💡 Idea → 🔬 Analysis → 📋 Task Planning → 💻 Development → 🔍 Review → 🛡️ Security → ✅ Deploy
- Each stage is a rounded box with icon, name, and task count
- Animated dots flow between stages (CSS keyframe animation on small circles moving along paths)
- Color coding: completed stages = green, active = amber pulsing, pending = gray

Task 3: Below the pipeline, show a table of tasks for this project:
- Columns: Task #, Name, Stage, Assigned Agent, Status, Time
- Each row is a task that belongs to this project
- Click a row → opens task detail

Task 4: Stats bar above the pipeline:
- Total Tasks: X
- Completed: Y
- In Progress: Z
- Active Agents: N
- Estimated completion: time

Task 5: The pipeline should animate on load — dots appearing at "Idea" and flowing through to "Deploy". When a task moves stages, a new dot appears. Use requestAnimationFrame for smooth animation.

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Project pipeline visualization with animated flow" && git push

🔗 Preview: https://app.gen3.ai/projects/1 (Pipeline tab)
Do all 5 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 23: نظام تطوير الأفكار المتكامل
# ─────────────────────────────────────────

Build the complete idea-to-project pipeline system.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Create src/app/api/ideas/[id]/analyze/route.ts — Deep analysis endpoint:
- POST receives {ideaId, ideaTitle, ideaDescription}
- Sends to OpenClaw via Telegram: "🔬 Deep Analysis Request for idea: {title}. Description: {description}. Provide comprehensive analysis: 1. Market size and opportunity 2. Competitor landscape (list top 5) 3. Unique value proposition 4. Technical feasibility (1-10) 5. Estimated development time 6. Recommended tech stack 7. Cost estimate (hosting, APIs, tools) 8. Revenue model suggestions 9. Risk assessment 10. Go/No-Go recommendation with reasoning"
- Returns {success: true, message: "Analysis request sent"}

Task 2: In the Ideas Lab page, when clicking "Research" on an idea:
- Call POST /api/ideas/[id]/analyze
- Show loading state: "AI is analyzing your idea... This may take 2-3 minutes"
- Update idea status to "research"

Task 3: Create src/app/api/ideas/[id]/plan/route.ts — Planning endpoint:
- After analysis is approved, this creates the development plan
- Sends to OpenClaw: "📋 Create detailed development plan for: {title}. Break down into: Phase 1 (MVP), Phase 2 (Core features), Phase 3 (Advanced). For each phase list specific tasks with: task name, department (Frontend/Backend/Security/QA), estimated hours, dependencies."
- Returns {success: true}

Task 4: Create src/app/api/ideas/[id]/execute/route.ts — Execution endpoint:
- After plan is approved, starts execution
- Creates a new project via POST /api/projects
- Creates tasks from the plan via POST /api/tasks (multiple)
- Sets up the project structure
- Returns {projectId, taskCount}

Task 5: Update Ideas Lab UI to show the full pipeline with visual progress for each idea:
- Stage 1: Submitted (gray) → clickable "Analyze" button
- Stage 2: Analyzing (amber, animated) → shows "AI working..."
- Stage 3: Analysis Complete → shows summary, "Approve/Reject" buttons
- Stage 4: Planning (amber) → shows "Creating plan..."
- Stage 5: Plan Ready → shows task breakdown, "Start Development" button
- Stage 6: In Development (green) → links to project page

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Ideas: complete pipeline from idea to project" && git push

🔗 Preview: https://app.gen3.ai/ideas
Do all 5 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 24: Arabic/RTL Support
# ─────────────────────────────────────────

Add Arabic language support and RTL layout.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify the visual design. ONLY add RTL support and translation capability.

Task 1: Install next-intl if not installed: npm install next-intl

Task 2: Create src/messages/en.json with ALL UI text (at least 150 keys). Cover: navigation names, button labels, page titles, status messages, form labels, error messages, placeholders.

Task 3: Create src/messages/ar.json with professional Arabic translations. Examples:
- Dashboard → لوحة التحكم
- Skills → المهارات
- Memory → الذاكرة
- Projects → المشاريع
- System Monitor → مراقبة النظام
- Settings → الإعدادات
- Save Changes → حفظ التغييرات
- Sign Out → تسجيل الخروج

Task 4: Create src/components/layout/LanguageToggle.tsx:
- Small button showing "AR" or "EN"
- Click toggles between Arabic and English
- Saves to localStorage('locale')
- When Arabic: document.documentElement.dir = 'rtl' and lang = 'ar'
- When English: dir = 'ltr' and lang = 'en'

Task 5: Add the LanguageToggle to the navbar (next to user avatar). When RTL:
- Sidebar appears on the RIGHT
- Text aligns RIGHT
- Use CSS logical properties (margin-inline-start, padding-inline-end)
- Icons don't flip

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Arabic/RTL: translations, toggle, layout support" && git push

🔗 Preview: https://app.gen3.ai/dashboard (click AR toggle)
Do all 5 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 25: Security Hardening
# ─────────────────────────────────────────

Harden the platform security.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Install zod: npm install zod. Create src/lib/validators.ts:
- loginSchema: {password: string min 1}
- ideaSchema: {title: string min 3 max 200, description optional max 2000}
- taskSchema: {name: string min 3 max 200, description optional}
- chatSchema: {message: string min 1 max 4000, projectId optional}
- memorySchema: {path: string, no ".." allowed, content: string max 500000}

Task 2: Create src/lib/prompt-scanner.ts — scans for injection:
- Patterns: "ignore previous instructions", "forget your rules", "reveal system prompt", "act as admin", "<script", "javascript:", "${", "/etc/passwd"
- Returns {safe: boolean, threats: string[]}

Task 3: Apply validation to API routes:
- POST /api/chat/send → validate + scan
- POST /api/ideas → validate
- POST /api/tasks → validate
- PUT /api/bridge/memory → validate path (no "..")
- Return 400 with clear error on validation failure

Task 4: Protect sensitive files: chmod 600 ~/.openclaw/openclaw.json

Task 5: Make sure /login page works properly:
- Cannot access /dashboard without valid auth-token cookie
- Sign out clears cookie completely
- Cookie is HttpOnly and Secure

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Security: Zod validation, prompt scanner, auth hardening" && git push

🔗 Preview: https://app.gen3.ai/login
Do all 5 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 26: PWA + Meta + Favicon
# ─────────────────────────────────────────

Add PWA support and proper meta tags.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx (structure), globals.css.

Task 1: Create public/manifest.json:
{
  "name": "GenPlatform.ai",
  "short_name": "GenPlatform",
  "description": "AI Mission Control Dashboard",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#09090b",
  "theme_color": "#3b82f6"
}

Task 2: Create a favicon. Create public/favicon.svg:
- A 32x32 SVG with "GP" text in white on a blue (#3b82f6) rounded rect background
- Reference in layout.tsx metadata

Task 3: Update metadata in layout.tsx (do NOT change the layout structure, ONLY update the metadata object):
- title: "GenPlatform.ai — Mission Control"
- description: "AI-powered platform for managing projects, agents, and automation"
- Add link to manifest.json

Task 4: Add loading skeleton components:
- Create src/components/ui/page-skeleton.tsx
- A generic skeleton that shows animated gray rectangles while pages load
- Apply to Dashboard and other pages that fetch data on mount

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "PWA manifest, favicon, meta tags, loading skeletons" && git push

🔗 Preview: https://app.gen3.ai/dashboard
Do all 4 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 27: Production Hardening + Documentation
# ─────────────────────────────────────────

Final production checks and documentation.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Test EVERY page. Run this and fix any 500 errors:
for page in dashboard dashboard/skills dashboard/memory dashboard/cron dashboard/monitoring dashboard/analytics dashboard/reports dashboard/settings dashboard/users dashboard/chat dashboard/command-center dashboard/tasks dashboard/integrations projects automations ideas agents help login; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/$page)
  echo "$page: $STATUS"
done
Fix any page returning 500 or that crashes.

Task 2: Test all API routes:
for route in health skills memory cron metrics status logs sessions live-status config; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/bridge/$route)
  echo "/api/bridge/$route: $STATUS"
done
Fix any returning non-200.

Task 3: PM2 production setup:
pm2 save
pm2 startup
Verify both genplatform-app and bridge-api survive reboot.

Task 4: Create /root/genplatform/README.md with professional documentation:
- Project overview
- Architecture diagram (text)
- Setup instructions
- All pages listed
- All API routes listed
- Deployment process

Task 5: Final git tag:
git add -A && git commit -m "Production ready: all pages tested, documented" && git push
git tag -a "v1.0-production" -m "GenPlatform.ai v1.0" && git push --tags
pm2 save

Update PROGRESS.md: ALL phases complete.

After ALL: Send final status via Telegram to owner.
Do all 5 tasks NOW.
