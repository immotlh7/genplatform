# ═══════════════════════════════════════════════════════════════
# الأولوية 4: الصوت + التصور ثلاثي الأبعاد + إدارة النماذج
# ═══════════════════════════════════════════════════════════════


# ─────────────────────────────────────────
# الرسالة 28: Voice Input — رسائل صوتية
# ─────────────────────────────────────────

Add voice input support to the Chat page.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: In the Chat page (src/app/dashboard/chat/page.tsx), add a microphone button next to the Send button in the input area:
- Microphone icon (from lucide-react: Mic)
- When clicked: starts recording audio using browser's MediaRecorder API
- Button turns red and pulses while recording
- Click again to stop recording
- Show recording duration (0:01, 0:02...)

Task 2: Create src/app/api/chat/transcribe/route.ts:
- POST receives audio blob as FormData
- Sends to OpenAI Whisper API for transcription:
  * URL: https://api.openai.com/v1/audio/transcriptions
  * model: "whisper-1"
  * Headers: Authorization: Bearer {OPENAI_API_KEY}
- If no OpenAI key available, use a fallback: save audio file and send message "[Voice message — transcription not available]"
- Returns {text: "transcribed text", language: "ar" or "en"}

Task 3: After transcription:
- Insert transcribed text into the chat input field
- Auto-detect language (Arabic/English)
- If Arabic: activate Commander Mode banner
- User can edit the text before sending, or it auto-sends after 2 seconds

Task 4: Voice message display in chat:
- Show a special message bubble with audio waveform icon
- Display transcribed text below the waveform
- Small badge: "🎤 Voice" to indicate it was a voice message

Task 5: Add environment variable for OpenAI key:
- Check if OPENAI_API_KEY exists in process.env
- If not: show "Voice transcription requires OpenAI API key. Add OPENAI_API_KEY to your environment." in settings
- Store key in /root/genplatform/.env.local

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "Voice input: recording, Whisper transcription, Arabic support" && git push

🔗 Preview: https://app.gen3.ai/dashboard/chat
Do all 5 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 29: 3D Pipeline Visualization — المصنع الذكي
# ─────────────────────────────────────────

Build the interactive 3D-style pipeline visualization for projects.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

IMPORTANT: Use 2.5D approach with CSS transforms and SVG, NOT full Three.js. This keeps it lightweight and reliable. The goal is to LOOK 3D while being 2D technically.

Task 1: Create src/components/project/PipelineVisualization.tsx — a large interactive component:
- Full width, minimum 500px height
- Dark background matching the app theme
- Isometric-style layout using CSS transform: rotateX(45deg) rotateZ(45deg) or perspective transforms

Task 2: The pipeline shows 7 stages as 3D-looking platforms/blocks arranged in a flow:
Stage 1: 💡 Idea Generation (top-left) — Blue glow
Stage 2: 🔬 Analysis (below) — Purple
Stage 3: 📋 Task Planning (below) — Teal
Stage 4: 💻 Development (center, largest) — Amber, split into 3 sub-lanes:
  - Frontend lane
  - Backend lane  
  - Database lane
Stage 5: 🔍 Review (below development) — Purple
Stage 6: 🛡️ Security Check (below review) — Red
Stage 7: ✅ Production (bottom-right) — Green glow

Task 3: Animated data flow:
- Small circles (dots) represent tasks
- Dots move along paths between stages using CSS @keyframes
- Each dot has a color matching its assigned department
- Speed of dots varies (some fast, some slow = parallel processing)
- When a dot reaches a stage, it pauses briefly then continues
- Use requestAnimationFrame or CSS animations

Task 4: Interactive elements:
- Hover over a stage → shows tooltip: stage name, task count, active agents
- Click a stage → expands showing tasks in that stage as a list
- Click a task → navigates to task detail
- Each stage shows: a number badge with task count, and a progress ring

Task 5: Real data connection:
- Fetch tasks from /api/tasks
- Group by status: backlog→Idea, planned→Analysis, in_progress→Development, review→Review, done→Production
- Update counts in real-time
- Show total progress bar at bottom: "47 of 120 tasks complete (39%)"

Task 6: Add this component to the project detail page (/projects/[id]) as the "Pipeline" tab content. Also add a smaller version to the Dashboard page.

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "3D pipeline visualization with animated task flow" && git push

🔗 Preview: https://app.gen3.ai/projects/1 (Pipeline tab)
Do all 6 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 30: AI Models & Token Management Page
# ─────────────────────────────────────────

Create the AI Models management and token tracking page.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css. ONLY add new page + sidebar link.

Task 1: Create src/app/dashboard/models/page.tsx — "AI Models & Resources" page.

Task 2: Connected Models section — show cards for each model:
Card 1: Claude Opus 4
- Provider: Anthropic
- Connection: via OpenClaw (OAuth)
- Status: Connected (green dot)
- Plan: Pro Max
- Context: 200K tokens
- Current session usage: fetch from /api/bridge/sessions → show percentage bar
- Cost: ~$0.015/1K input, ~$0.075/1K output

Card 2: Claude Sonnet 4 (available but not active)
- Status: Available
- Faster, cheaper alternative for simpler tasks

Card 3: Whisper (OpenAI)
- Status: Not connected (or connected if OPENAI_API_KEY exists)
- Used for: Voice transcription
- Cost: $0.006/minute

Card 4: Future Models (placeholder)
- GPT-5, Llama 4, DeepSeek V3, Mistral Large
- Status: "Add API Key to connect"
- Show "Coming soon" badge

Task 3: Token Usage Dashboard:
- Today's usage: estimated from session data
- This week: accumulated
- This month: accumulated
- Bar chart showing daily usage (last 7 days) — can use placeholder data with note "Tracking started today"
- Cost estimate based on usage

Task 4: Smart Model Routing section:
- Show a table explaining which model is used for what:
  * Complex coding tasks → Claude Opus 4 (best quality)
  * Code review → Claude Sonnet 4 (faster, cheaper)
  * Research tasks → Claude Opus 4 (needs reasoning)
  * Simple tasks → Haiku/local model (cheapest)
  * Voice → Whisper
- This is informational for now, routing is manual via OpenClaw config

Task 5: Session Management:
- Show active sessions from /api/bridge/sessions
- Each session: model, context usage %, last active, age
- "Reset Session" button (sends /reset via OpenClaw)
- Warning when context > 80%: "Session nearing limit. Consider /reset to free context."

Task 6: Add "Models" link in sidebar under MONITORING section. Use BrainCircuit or Cpu icon from lucide-react.

After ALL: npm run build && pm2 restart genplatform-app && git add -A && git commit -m "AI Models page: token tracking, session management, cost estimates" && git push

🔗 Preview: https://app.gen3.ai/dashboard/models
Do all 6 tasks NOW.


# ─────────────────────────────────────────
# الرسالة 31: Auto-Deploy Subdomain System
# ─────────────────────────────────────────

Build the auto-deploy subdomain system for projects.

Project: /root/genplatform. Site: https://app.gen3.ai.
DESIGN PROTECTION: Do NOT modify sidebar.tsx, navbar.tsx, layout.tsx, globals.css.

Task 1: Create src/app/api/projects/[id]/deploy/route.ts:
- POST receives {projectId}
- Gets project from /api/projects/[id]
- Generates subdomain: {project-slug}.gen3.ai
- Creates deployment entry with: subdomain, port, status
- Returns {subdomain, previewUrl, status: "deploying"}

Task 2: Create a deployment helper in the Bridge API (/root/genplatform-api):
Create routes/deploy.js:
- POST /api/deploy — receives {projectName, subdomain, sourcePath}
- Checks if the project directory exists
- Finds an available port (start from 3100, increment)
- Adds Caddy config entry for subdomain → localhost:PORT
- Starts the project with PM2 on that port
- Returns {success, port, subdomain, url}

Task 3: Register route in Bridge API server.js and restart bridge-api.

Task 4: In the project detail page Settings tab, add "Deploy" section:
- Current deploy status: "Not deployed" or "Live at {subdomain}.gen3.ai"
- "Deploy" button → calls POST /api/projects/[id]/deploy
- Shows deployment progress
- After success: shows live URL with "Open" link

Task 5: In the Projects list page, deployed projects show a green "Live" badge with their subdomain URL.

Task 6: The preview tab in project detail automatically uses the subdomain URL for the iframe.

After ALL: npm run build && pm2 restart genplatform-app && pm2 restart bridge-api && git add -A && git commit -m "Auto-deploy: subdomain creation, Caddy config, PM2 launch" && git push

🔗 Preview: https://app.gen3.ai/projects
Do all 6 tasks NOW.
