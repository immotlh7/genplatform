# GenPlatform.ai — خطة إعادة البناء الجوهرية
# ═══════════════════════════════════════════════════════════════
# الميزات الثلاث الأساسية: Ideas + Projects + Chat
# تاريخ: 20 مارس 2026
# ═══════════════════════════════════════════════════════════════

## ⚠️ PROTECTED FILES — لا تُعدَّل أبداً
- src/app/layout.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/navbar.tsx
- globals.css
- src/app/dashboard/self-dev/**
- src/app/api/self-dev/**
- src/components/self-dev/**

---

# ═══════════════════════════════════════════════════════════════
# FEATURE 1: نظام الأفكار الذكي (Ideas Intelligence System)
# ═══════════════════════════════════════════════════════════════

## الرؤية
صفحة الأفكار يجب أن تكون بالضبط مثل Claude أو ChatGPT — واجهة محادثة تتكلم فيها مع
وكيل متخصص في تحليل الأفكار. الوكيل يسمعك، يحلل، يقترح، وعند الموافقة يرسل
للفريق كاملاً. مو مجرد نموذج إدخال.

## الهيكل الجديد لـ /dashboard/ideas

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  💡 Ideas Intelligence Center                    [+ New]    │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [Sidebar: قائمة الأفكار السابقة]  [Main: محادثة نشطة]     │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ 📋 My Ideas (4)  │  │                                  │ │
│  │ ─────────────── │  │   [محادثة الفكرة النشطة]          │ │
│  │ • AI Code Review │  │                                  │ │
│  │   ✅ Approved    │  │                                  │ │
│  │ • Mobile Dash    │  │                                  │ │
│  │   🔬 Analyzing   │  │                                  │ │
│  │ • Collab Canvas  │  │                                  │ │
│  │   💬 Discussing  │  │                                  │ │
│  │ ─────────────── │  │                                  │ │
│  │ [+ New Idea]     │  │                                  │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### واجهة المحادثة (مثل Claude تماماً)

عندما يضغط المستخدم "+ New Idea" تفتح محادثة جديدة والوكيل يرحب:

```
🤖 Idea Analyst:
مرحباً! أنا مستعد لتحليل فكرتك بعمق.
أخبرني عن فكرتك — يمكنك الكتابة بحرية،
كلما أعطيتني تفاصيل أكثر، كان تحليلي أدق.

[اكتب فكرتك هنا...]
```

بعد إرسال الفكرة، الوكيل يعطي ردًا شاملاً منظماً:

### هيكل رد الوكيل (يُعرض كـ Markdown داخل الشات)

```markdown
## 🔍 تحليل الفكرة: [اسم الفكرة]

### فهم الفكرة
[ملخص ما فهمه الوكيل من الفكرة]

### 💎 القيمة المقترحة
[ما الذي يجعل هذه الفكرة مميزة؟]

### 📊 تحليل السوق
| المنافس | نقاط القوة | نقاط الضعف | ميزتنا |
|---------|-----------|-----------|--------|
| X       | ...       | ...       | ...    |

### ✨ المميزات الأساسية المقترحة
1. [ميزة 1] — [وصف + سبب أهميتها]
2. [ميزة 2] — [وصف]
3. [ميزة 3] — [وصف]

### 💡 إضافات يمكن أن ترفع المشروع
- [إضافة 1]: [وصف + تأثير على القيمة]
- [إضافة 2]: [وصف]

### 🛠️ Stack التقني الموصى به
| الطبقة | الأداة | السبب |
|--------|--------|-------|
| Frontend | Next.js + React | ... |
| Backend | Node.js + Express | ... |
| AI | [نموذج مناسب] | ... |
| Database | PostgreSQL | ... |

### 🤖 نماذج AI المقترحة
- [نموذج 1]: للـ [وظيفة محددة]
- [نموذج 2]: للـ [وظيفة أخرى]

### 💰 تقدير التكاليف
| البند | التكلفة الشهرية |
|------|----------------|
| Hosting | $X |
| AI APIs | $X |
| Services | $X |
| **الإجمالي** | **$X/month** |

### 🗺️ خريطة هيكل المشروع
[مخطط ASCII يوضح الهيكل والارتباطات]

### ⏱️ تقدير الوقت
- MVP: X أسابيع
- النسخة الكاملة: X أشهر

---
هل تريد مناقشة أي جانب؟ أو نبدأ في التخطيط التقني؟
```

### مراحل المحادثة (State Machine)

```
INITIAL → USER_SUBMITTED → AI_ANALYZING → AI_RESPONDED →
DISCUSSION_MODE → IMPROVEMENT_REVIEW → APPROVED/REJECTED
```

#### حالات الواجهة:
- **INITIAL**: شاشة ترحيب + input
- **AI_ANALYZING**: typing indicator + "جاري التحليل العميق..." (3-5 ثوانٍ)
- **AI_RESPONDED**: يُعرض التحليل كامل + أزرار (✅ موافق | 💬 ناقش | 🔄 عدّل | ❌ رفض)
- **DISCUSSION_MODE**: محادثة حرة للنقاش والتعديل
- **IMPROVEMENT_REVIEW**: الوكيل يقترح تحسينات إضافية (مرحلة ثانية)
- **APPROVED**: يُفتح modal تأكيد → إرسال لباقي الفريق

### زر الموافقة النهائية

عند الموافقة يظهر modal:
```
✅ تأكيد إطلاق المشروع

الفكرة: [اسم]
الخطوات التالية:
→ إرسال للتخطيط التقني (Technical Planning)
→ توليد المهام التفصيلية
→ إنشاء subdomain: [slug].gen3.ai
→ إضافة المشروع لقائمة Projects

[إطلاق المشروع] [إلغاء]
```

## API المطلوب

### POST /api/ideas/chat
```typescript
body: {
  ideaId: string,
  message: string,
  stage: 'initial' | 'discussion' | 'improvement',
  context?: string // السياق السابق
}
response: {
  reply: string, // markdown
  stage: string,
  actions: string[] // الأزرار التي تظهر
}
```

### POST /api/ideas/approve
```typescript
body: { ideaId: string }
// يفعل:
// 1. ينقل الفكرة لحالة "approved"
// 2. يولد slug للمشروع
// 3. يُنشئ مشروع جديد في قاعدة البيانات
// 4. يُرسل للتخطيط التقني
// 5. يُضيف subdomain عبر Caddy API
```

### ملفات يجب إنشاؤها:
- `src/app/dashboard/ideas/page.tsx` — الصفحة الرئيسية (قائمة + شات)
- `src/app/dashboard/ideas/[id]/page.tsx` — صفحة فكرة محددة
- `src/components/ideas/IdeaChatInterface.tsx` — واجهة المحادثة
- `src/components/ideas/IdeaAnalysisCard.tsx` — عرض التحليل المنسق
- `src/components/ideas/IdeaSidebar.tsx` — قائمة الأفكار
- `src/app/api/ideas/chat/route.ts` — API الشات
- `src/app/api/ideas/approve/route.ts` — API الموافقة
- `src/app/api/ideas/[id]/route.ts` — CRUD

---

# ═══════════════════════════════════════════════════════════════
# FEATURE 2: صفحة إدارة المشاريع الاحترافية
# ═══════════════════════════════════════════════════════════════

## الرؤية
كل مشروع له صفحة كاملة تعرض حالته بشكل تفاعلي — Pipeline مرئي، وكلاء نشطون،
مهام مقسمة، لوق حي. المهام تُدار من داخل صفحة المشروع لا من صفحة Tasks المنفصلة.

## /dashboard/projects — صفحة القائمة

```
┌─────────────────────────────────────────────────────────────┐
│  Projects                              [+ New Project]      │
│                                                             │
│  [Active (3)] [Planning (2)] [Completed (1)] [All]         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ GP  GenPlatform.ai        Active  75%  nuxim.gen3.ai │   │
│  │     Next.js · 127 tasks · 3 agents active            │   │
│  │     [Pipeline ████████░░░░] Dev phase                │   │
│  │                                    [Open] [Settings] │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AI  AI Code Review        Planning  10%              │   │
│  │     Node.js · 48 tasks · Generating...               │   │
│  │     [Pipeline ██░░░░░░░░] Analysis phase             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## /dashboard/projects/[id] — صفحة المشروع

### Layout الكامل
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
│ [GP] GenPlatform.ai  Active — 75% — nuxim.gen3.ai  [Chat]  │
│ Pipeline | Tasks | Preview | Quality | Settings             │
│─────────────────────────────────────────────────────────────│
│ TAB: Pipeline (الافتراضي)                                   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  💡─────🔬─────📋─────💻──●──🔍─────🛡️─────✅          │ │
│ │ Idea  Analysis Planning Dev  Review Security Deploy     │ │
│ │ Done   Done    Done   23/48  0      0      —           │ │
│ │  ✓──────✓───────✓──────◉────────────────────          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────┐  ┌──────────────────────────────────┐  │
│ │  127  │  48     │  │  5          │  3                  │  │
│ │ Total │Completed│  │ In Progress │ Active Agents       │  │
│ └───────┴─────────┘  └─────────────┴────────────────────┘  │
│                                                             │
│ ┌─────────────────────┐  ┌────────────────────────────────┐ │
│ │ Active Agents       │  │ Live Execution Log             │ │
│ │─────────────────────│  │────────────────────────────────│ │
│ │ ● Frontend Dev      │  │ 12:04 T-46 done: Memory page  │ │
│ │   T-47: Fix cards   │  │ 12:05 T-47 started            │ │
│ │   [building]        │  │ 12:05 Editing: dashboard/page │ │
│ │                     │  │ 12:06 Building: npm run build │ │
│ │ ● Backend Dev       │  │ 12:07 Build OK — pm2 restart  │ │
│ │   T-48: API fix     │  │ 12:07 T-48 started            │ │
│ │   [coding]          │  │ 12:08 Editing: api/bridge/... │ │
│ │                     │  │ 12:08 Context: 34K/200K (17%) │ │
│ │ ● QA                │  └────────────────────────────────┘ │
│ │   T-45: Login flow  │                                     │
│ │   [reviewing]       │                                     │
│ │                     │                                     │
│ │ ○ Security          │                                     │
│ │   idle              │                                     │
│ └─────────────────────┘                                     │
│                                                             │
│ CONTROL BAR ─────────────────────────────────────────────── │
│ [████████░░░░░░░░░░░] 48/127 tasks (38%) · 34K/200K · 4h   │
│                                          [View all tasks]  │
└─────────────────────────────────────────────────────────────┘
```

### TAB: Tasks (مراقبة المهام داخل المشروع)

لا صفحة Tasks منفصلة. المهام تُعرض كـ tab داخل كل مشروع:

```
┌─────────────────────────────────────────────────────────────┐
│ Tasks for GenPlatform.ai          [+ Add Task] [Auto-assign]│
│                                                             │
│ [All] [Frontend (3)] [Backend (5)] [QA (2)] [Security (1)] │
│                                                             │
│ Kanban Board:                                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│ │ Backlog  │ │ Planned  │ │In Progress│ │    Done          ││
│ │    5     │ │    3     │ │    2     │ │      3           ││
│ │──────────│ │──────────│ │──────────│ │──────────────────││
│ │ T-11     │ │ T-08     │ │ T-04     │ │ T-01             ││
│ │ Perf mon │ │ Onboard  │ │ Build UI │ │ Set up repo      ││
│ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### TAB: Preview (iframe مباشر)
```
┌─────────────────────────────────────────────────────────────┐
│ Live Preview — nuxim.gen3.ai    [📱Mobile] [💻Tablet] [🖥️] │
│─────────────────────────────────────────────────────────────│
│                                                             │
│  [iframe: https://nuxim.gen3.ai]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## نظام الـ Subdomains التلقائي

عند إنشاء مشروع جديد (من Ideas أو يدوياً):

### الخطوات التقنية:
```bash
# 1. توليد slug من اسم المشروع
slug = generateSlug(projectName) // "my-project" → "my-project"

# 2. إضافة Caddy config
cat >> /etc/caddy/Caddyfile << EOF
{slug}.gen3.ai {
  reverse_proxy localhost:{newPort}
}
EOF
caddy reload

# 3. إنشاء project directory
mkdir -p /root/projects/{slug}

# 4. تشغيل المشروع على port جديد
pm2 start /root/projects/{slug}/index.js --name "{slug}-app" -- --port {newPort}
```

### API: POST /api/projects/create
```typescript
body: {
  name: string,
  ideaId?: string,
  techStack: string[],
  description: string
}
response: {
  projectId: string,
  subdomain: string, // "my-project.gen3.ai"
  port: number,
  status: 'created'
}
```

## خريطة الارتباطات البصرية (Dependency Map)

داخل كل صفحة مشروع، يوجد view "Dependency Map" يُظهر:
- الملفات والمكونات وكيف ترتبط ببعض
- APIs والروابط
- قواعد البيانات والجداول
- الخدمات الخارجية

```
مثال مرئي:
pages/          components/          api/
  ├─ dashboard ──→ DashCard ───────→ /api/dashboard
  │               DashStats          ├─ /stats
  ├─ projects ───→ ProjectList ────→ /api/projects
  │               ProjectCard        └─ /api/projects/[id]
  └─ chat ────────→ ChatInterface ──→ Bridge API (3001)
                  MessageList        └─ OpenClaw/Telegram
```

يُعرض كـ interactive SVG قابل للنقر.

## الملفات المطلوبة:

- `src/app/dashboard/projects/page.tsx` — قائمة المشاريع
- `src/app/dashboard/projects/[id]/page.tsx` — صفحة المشروع
- `src/app/dashboard/projects/[id]/tasks/page.tsx` — Tasks tab
- `src/app/dashboard/projects/[id]/preview/page.tsx` — Preview tab
- `src/components/projects/ProjectPipeline.tsx` — Pipeline التفاعلي
- `src/components/projects/ActiveAgents.tsx` — قائمة الوكلاء
- `src/components/projects/ExecutionLog.tsx` — Live log
- `src/components/projects/DependencyMap.tsx` — خريطة الارتباطات SVG
- `src/components/projects/ProjectControlBar.tsx` — شريط التحكم
- `src/app/api/projects/create/route.ts` — إنشاء مشروع + subdomain
- `src/app/api/projects/[id]/tasks/route.ts` — CRUD للمهام

---

# ═══════════════════════════════════════════════════════════════
# FEATURE 3: Chat — Claude Code Experience
# ═══════════════════════════════════════════════════════════════

## الرؤية
صفحة Chat يجب أن تكون مثل Claude Code تماماً:
- تختار مشروع → الـ AI يعرف كل شيء عنه
- تخبره بمشكلة (نص/صوت/صورة) → يفهم
- يكتب الأوامر اللازمة → يسألك تأكيد (اختياري)
- ينفذ مباشرة على السيرفر
- يعرض النتائج live (ملفات تغيّرت، build نجح/فشل، preview)

## Layout الجديد

```
┌─────────────────────────────────────────────────────────────┐
│ [🔧 Project: GenPlatform.ai ▾]  [👁️ Live Preview] [⚙️]      │
│─────────────────────────────────────────────────────────────│
│                          │                                  │
│  CHAT (40%)              │  LIVE PREVIEW (60%)              │
│                          │                                  │
│  ┌────────────────────┐  │  ┌────────────────────────────┐  │
│  │                    │  │  │                            │  │
│  │  [رسائل المحادثة]  │  │  │  [iframe: المشروع الحي]   │  │
│  │                    │  │  │   أو                       │  │
│  │                    │  │  │  [Terminal output]         │  │
│  │                    │  │  │   أو                       │  │
│  │                    │  │  │  [File diff viewer]        │  │
│  │                    │  │  │                            │  │
│  └────────────────────┘  │  └────────────────────────────┘  │
│                          │                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ [🎤] [📎] Type your message... (Ctrl+Enter to send)    │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## أنواع رسائل الـ AI في الشات

### 1. رسالة تحليل المشكلة
```
🤖 AI Engineer

فهمت المشكلة. الخطأ في src/app/dashboard/page.tsx
السطر 47 — يحاول الوصول لـ data.stats قبل التحقق من وجودها.

الحل:
```tsx
// قبل
const count = data.stats.total;

// بعد
const count = data?.stats?.total ?? 0;
```

هل أبدأ الإصلاح؟ [✅ نعم] [👁️ عرض الملف أولاً] [❌ لا]
```

### 2. رسالة التنفيذ (مع live output)
```
🤖 AI Engineer — executing...

[▶] Opening file: src/app/dashboard/page.tsx
[✓] Fix applied at line 47
[▶] Running: npm run build
    ● Compiling...
    ● Compiled successfully
[✓] Build OK
[▶] PM2 restart: genplatform-app
[✓] App restarted — live at nuxim.gen3.ai

[👁️ View Changes] [🔄 Preview]
```

### 3. رسالة خطأ (مع اقتراح بديل)
```
🤖 AI Engineer — error

[✗] Build failed:
    Type error: Property 'x' does not exist on type 'Y'
    at src/components/card.tsx:23

جاري إصلاح الخطأ...
[▶] Analyzing error...
[✓] Found fix: add type assertion
```

## قدرات الـ Chat

### 1. إدخال نصي
المستخدم يكتب بالعربية أو الإنجليزية:
- "في صفحة Dashboard عندي خطأ في الأرقام"
- "add a dark mode toggle to the navbar" (محظور لأنه PROTECTED)
- "create a new API endpoint for /api/metrics"

### 2. إدخال صوتي (Whisper)
- زر 🎤 → تسجيل → Whisper API → تحويل لنص → إرسال

### 3. إدخال صورة/Screenshot
- زر 📎 → رفع صورة → الـ AI يحللها (vision)
- "اللي شايفه في الصورة هو خطأ في layout السطر الثالث..."

### 4. تنفيذ مباشر على السيرفر
عبر Bridge API (port 3001):
```typescript
// POST /api/bridge/execute
{
  command: string,  // الأمر للتنفيذ
  cwd: string,      // المجلد
  projectId: string
}
// Response: stream of output lines
```

## الـ Live Preview Panel

يُغيّر محتواه حسب ما يحدث:

| الحالة | ما يُعرض |
|--------|---------|
| idle | iframe للمشروع الحي |
| executing | Terminal output (streaming) |
| build_complete | iframe يُحدَّث تلقائياً |
| error | Error details + suggested fix |
| file_changed | File diff (قبل/بعد) |

## Project Context System

عند اختيار مشروع من dropdown:
```typescript
// يُحمَّل في الـ system prompt للـ AI
{
  projectName: string,
  techStack: string[],
  repoPath: string,        // /root/genplatform
  liveUrl: string,         // nuxim.gen3.ai
  currentPhase: string,    // Development
  recentTasks: Task[],     // آخر 10 مهام
  activeAgents: Agent[],
  protectedFiles: string[] // NEVER touch these
}
```

## الملفات المطلوبة:

- `src/app/dashboard/chat/page.tsx` — إعادة كتابة كاملة
- `src/components/chat/ChatInterface.tsx` — واجهة المحادثة الجديدة
- `src/components/chat/LivePreviewPanel.tsx` — Panel اليمين
- `src/components/chat/ProjectSelector.tsx` — dropdown اختيار المشروع
- `src/components/chat/MessageRenderer.tsx` — عرض رسائل AI المنسقة
- `src/components/chat/VoiceInput.tsx` — تسجيل صوتي
- `src/components/chat/TerminalOutput.tsx` — عرض output التنفيذ
- `src/components/chat/FileDiffViewer.tsx` — عرض التغييرات
- `src/app/api/chat/send/route.ts` — إرسال رسالة + AI response
- `src/app/api/chat/execute/route.ts` — تنفيذ أمر على السيرفر
- `src/app/api/chat/stream/route.ts` — SSE للـ live output

---

# ═══════════════════════════════════════════════════════════════
# ترتيب التنفيذ
# ═══════════════════════════════════════════════════════════════

## المرحلة الأولى (الأهم) — Ideas System
1. إعادة بناء /dashboard/ideas بالكامل
2. واجهة محادثة تفاعلية (مثل Claude)
3. API لتحليل الأفكار بـ AI
4. نظام الموافقة والإرسال للفريق
5. ربط مع Projects عند الموافقة

## المرحلة الثانية — Projects Enhancement
1. صفحة قائمة المشاريع المحسّنة
2. صفحة المشروع مع التبويبات
3. نقل Tasks داخل صفحة المشروع
4. إضافة DependencyMap
5. نظام subdomain تلقائي

## المرحلة الثالثة — Chat Rebuild
1. إعادة بناء Chat page بـ split view
2. إضافة Project Context
3. ربط التنفيذ المباشر عبر Bridge API
4. إضافة Voice input
5. إضافة Live Preview updates

---

# ═══════════════════════════════════════════════════════════════
# تعليمات للتنفيذ (لـ OpenClaw)
# ═══════════════════════════════════════════════════════════════

## قواعد إلزامية
1. PROTECTED FILES لا تُلمس: sidebar.tsx, navbar.tsx, layout.tsx, globals.css, self-dev/**
2. استخدم CSS variables الموجودة (var(--color-*))
3. لا gradients أو shadows أو تأثيرات مبالغة
4. حدود 0.5px فقط
5. border-radius: 8px للعناصر، 12px للبطاقات
6. font-weight: 400 أو 500 فقط (بدون 600/700)
7. كل API جديد يمر عبر Bridge API (port 3001) إذا احتاج لتنفيذ أوامر على السيرفر
8. الـ AI calls تستخدم OpenClaw عبر Telegram أو Claude API المحلي

## بنية المجلدات
```
src/
  app/
    dashboard/
      ideas/
        page.tsx ← REBUILD
        [id]/
          page.tsx ← NEW
      projects/
        page.tsx ← REBUILD
        [id]/
          page.tsx ← REBUILD
          tasks/ ← MOVE from /tasks
          preview/
      chat/
        page.tsx ← FULL REBUILD
  components/
    ideas/ ← NEW
    projects/ ← NEW
    chat/ ← REBUILD
  app/api/
    ideas/ ← NEW
    projects/ ← REBUILD
    chat/ ← REBUILD
```
