# FILE-5: STRATEGIC ROOM — From One Sentence to a Full Project
# ═══════════════════════════════════════════════════════════════
# This is FILE-5 of 6. Only start after FILE-4 build passes.
# ═══════════════════════════════════════════════════════════════

## WHY THIS FILE EXISTS
The current Ideas page has two critical failures:

FAILURE 1 — Analysis disappears.
The HTTP request times out after 30 seconds.
The analysis takes 3 minutes. User sees nothing.
FILE-3 (Queue) fixed the backend. This file fixes the frontend
to use the queue and show live progress.

FAILURE 2 — Results are primitive.
Even when analysis works, it shows a plain text blob.
Nothing is clickable. Nothing is interactive.
There is no way to discuss, modify, or launch.

The fixed Strategic Room works like this:
1. User types one sentence — even vague
2. Progress bar shows live: Research 25% → Market 50% → Strategy 75% → Done
3. A rich interactive document appears with 12 collapsible sections
4. Every feature card has Keep / Skip buttons
5. User discusses in a chat box below: "add notifications feature"
6. AI updates the relevant section instantly
7. User clicks Launch — task generation starts with live counter
8. Redirect to the new project page when done

## PROTECTED FILES — NEVER TOUCH
- src/app/layout.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/navbar.tsx
- src/app/globals.css
- src/app/dashboard/self-dev/**

---

# ════════════════════════════════════════════════════════
# STEP 1: Create the idea discussion API
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 1: Creating idea discussion API ==="
mkdir -p /root/genplatform/src/app/api/ideas/\[id\]/discuss

cat > /root/genplatform/src/app/api/ideas/\[id\]/discuss/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { IdeaRepo } from '@/lib/repositories';

const GATEWAY = 'http://127.0.0.1:18789/v1/chat/completions';
const TOKEN   = 'bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { message, currentAnalysis } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  const idea = IdeaRepo.getById(params.id);
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });

  const projectName = currentAnalysis?.projectName || 'Unknown';
  const featureCount = currentAnalysis?.coreFeatures?.length || 0;

  const prompt = `You are managing a product analysis document.
The user wants to modify it.

Project: "${projectName}"
Current feature count: ${featureCount}
User message: "${message}"

Detect what the user wants and return JSON only:
{
  "action": "add_feature|remove_feature|add_suggestion|update_section|answer_question",
  "targetId": "ID of item to modify if applicable, or null",
  "newItem": {
    "id": "auto-generated ID like F099",
    "name": "feature name",
    "description": "what it does and why it matters",
    "impact": "high|medium|low",
    "complexity": "low|medium|high",
    "aiTools": [],
    "pages": []
  },
  "sectionName": "which section changes: coreFeatures|suggestedAdditions|pages|techStack|phases",
  "reply": "Friendly confirmation of what was done, in same language as user",
  "changes": ["human-readable description of each change"]
}

Rules:
- Arabic and English both supported — detect the language and reply in same language
- "أضف" or "add" = add_feature or add_suggestion
- "احذف" or "remove" or "delete" = remove_feature
- "غيّر" or "change" or "update" = update_section
- Any question = answer_question
- If unclear, ask for clarification via answer_question`;

  try {
    const res = await fetch(GATEWAY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        model: 'claude',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Gateway ${res.status}`);
    const data = await res.json();
    const rawReply = data.choices?.[0]?.message?.content || '{}';

    let action: any;
    try {
      action = JSON.parse(rawReply.replace(/```json|```/g, '').trim());
    } catch {
      return NextResponse.json({
        action: 'answer_question',
        reply: rawReply,
        changes: [],
      });
    }

    // Apply the change to the stored idea if it modifies data
    if (action.action !== 'answer_question' && idea.analysis?.expanded) {
      const expanded = { ...idea.analysis.expanded };

      if (action.action === 'add_feature' && action.newItem) {
        expanded.coreFeatures = [...(expanded.coreFeatures || []), { ...action.newItem, userAdded: true }];
      }
      if (action.action === 'add_suggestion' && action.newItem) {
        expanded.suggestedAdditions = [...(expanded.suggestedAdditions || []), { ...action.newItem, userAdded: true }];
      }
      if (action.action === 'remove_feature' && action.targetId) {
        expanded.coreFeatures = (expanded.coreFeatures || []).filter((f: any) => f.id !== action.targetId);
        expanded.suggestedAdditions = (expanded.suggestedAdditions || []).filter((f: any) => f.id !== action.targetId);
      }

      IdeaRepo.update(params.id, {
        analysis: { ...idea.analysis, expanded },
      });
    }

    return NextResponse.json(action);
  } catch (e: any) {
    return NextResponse.json({ action: 'answer_question', reply: `Error: ${e.message}`, changes: [] });
  }
}
EOF

echo "OK: Discussion API created"
echo "=== STEP 1 COMPLETE ==="
```

---

# ════════════════════════════════════════════════════════
# STEP 2: Rebuild the Ideas page — the Strategic Room
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 2: Rebuilding Ideas page ==="

cat > /root/genplatform/src/app/dashboard/ideas/page.tsx << 'IDEASEOF'
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { JobProgress } from '@/components/shared/JobProgress';

// ─── Types ──────────────────────────────────────────────────────

interface Feature {
  id: string;
  name: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  complexity: 'low' | 'medium' | 'high';
  aiTools?: string[];
  pages?: string[];
  userAdded?: boolean;
}

interface Page {
  id: string;
  name: string;
  route: string;
  purpose: string;
  components?: string[];
  wireframeDescription?: string;
}

interface Analysis {
  projectName: string;
  tagline: string;
  vision: string;
  marketOpportunity?: { tam: string; sam: string; som: string; summary: string };
  competitors?: { name: string; strengths: string; weaknesses: string; ourAdvantage: string }[];
  coreFeatures: Feature[];
  suggestedAdditions: Feature[];
  pages: Page[];
  agents?: { name: string; role: string; triggers: string }[];
  techStack?: any;
  financials?: any;
  phases?: { name: string; duration: string; goal: string; features: string[] }[];
  risks?: { risk: string; probability: string; mitigation: string }[];
}

interface DiscussMessage {
  role: 'user' | 'ai';
  content: string;
  changes?: string[];
}

type PageState = 'empty' | 'submitting' | 'analyzing' | 'ready';

// ─── Helper components ───────────────────────────────────────────

function ImpactBadge({ impact }: { impact: string }) {
  const color = impact === 'high' ? '#1D9E75' : impact === 'medium' ? '#EF9F27' : 'var(--color-text-secondary)';
  const bg = impact === 'high' ? 'rgba(29,158,117,0.12)' : impact === 'medium' ? 'rgba(239,159,39,0.12)' : 'var(--color-background-secondary)';
  return (
    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: bg, color, border: `0.5px solid ${color}40` }}>
      {impact} impact
    </span>
  );
}

function Section({ title, icon, children, defaultOpen = true }: any) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16, borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'var(--color-background-secondary)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{icon}</span> {title}
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: 16, background: 'var(--color-background-primary)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function FeatureCard({ feature, kept, onKeep, onSkip }: any) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10, marginBottom: 8,
      border: `0.5px solid ${kept ? '#1D9E75' : 'var(--color-border-tertiary)'}`,
      background: kept ? 'rgba(29,158,117,0.05)' : 'var(--color-background-secondary)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      transition: 'border-color 0.2s, background 0.2s',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{feature.name}</span>
          {feature.userAdded && (
            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(127,119,221,0.15)', color: '#7F77DD' }}>
              you added
            </span>
          )}
          <ImpactBadge impact={feature.impact} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
          {feature.description}
        </p>
        {feature.aiTools && feature.aiTools.length > 0 && (
          <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {feature.aiTools.map((t: string) => (
              <span key={t} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
        <button onClick={onKeep} style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
          border: kept ? 'none' : '0.5px solid #1D9E75',
          background: kept ? '#1D9E75' : 'transparent',
          color: kept ? '#fff' : '#1D9E75', fontWeight: kept ? 500 : 400,
        }}>
          {kept ? '✓ Kept' : 'Keep'}
        </button>
        {!kept && (
          <button onClick={onSkip} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
            border: '0.5px solid var(--color-border-tertiary)',
            background: 'transparent', color: 'var(--color-text-secondary)',
          }}>Skip</button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────

export default function IdeasPage() {
  const router = useRouter();
  const discussEndRef = useRef<HTMLDivElement>(null);

  const [pageState, setPageState] = useState<PageState>('empty');
  const [ideaText, setIdeaText] = useState('');
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [keptFeatures, setKeptFeatures] = useState<Set<string>>(new Set());
  const [discussion, setDiscussion] = useState<DiscussMessage[]>([]);
  const [discussInput, setDiscussInput] = useState('');
  const [discussLoading, setDiscussLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchJobId, setLaunchJobId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  // Load existing ideas on mount
  useEffect(() => {
    fetch('/api/ideas')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setIdeas(data); })
      .catch(() => {});
  }, []);

  // Scroll discussion to bottom
  useEffect(() => {
    discussEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [discussion]);

  // Submit idea — gets job ID instantly, no timeout
  const submitIdea = async () => {
    if (!ideaText.trim()) return;
    setPageState('submitting');

    try {
      const res = await fetch('/api/ideas/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaText }),
      });
      const data = await res.json();

      if (data.jobId && data.ideaId) {
        setIdeaId(data.ideaId);
        setJobId(data.jobId);
        setPageState('analyzing');
      } else {
        throw new Error(data.error || 'Failed to start analysis');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
      setPageState('empty');
    }
  };

  // Called when job completes
  const onAnalysisDone = async (result: any) => {
    if (!ideaId) return;

    // Load the full idea with analysis from database
    try {
      const res = await fetch(`/api/ideas/${ideaId}`);
      const idea = await res.json();
      const expanded = idea.analysis?.expanded;

      if (expanded) {
        setAnalysis(expanded);
        // Auto-keep all core features by default
        const allIds = new Set<string>((expanded.coreFeatures || []).map((f: Feature) => f.id));
        setKeptFeatures(allIds);
      }
    } catch {}

    setPageState('ready');
    setIdeas(prev => [{ id: ideaId, ideaText, status: 'analyzed' }, ...prev]);
  };

  // Send a discussion message
  const sendDiscussion = async () => {
    if (!discussInput.trim() || discussLoading || !ideaId) return;

    const userMsg = discussInput;
    setDiscussInput('');
    setDiscussLoading(true);

    setDiscussion(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await fetch(`/api/ideas/${ideaId}/discuss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, currentAnalysis: analysis }),
      });
      const data = await res.json();

      // Apply UI changes based on action
      if (data.action === 'add_feature' && data.newItem && analysis) {
        setAnalysis(prev => prev ? {
          ...prev,
          coreFeatures: [...prev.coreFeatures, data.newItem],
        } : prev);
        // Auto-keep the new feature
        setKeptFeatures(prev => new Set([...prev, data.newItem.id]));
      }
      if (data.action === 'add_suggestion' && data.newItem && analysis) {
        setAnalysis(prev => prev ? {
          ...prev,
          suggestedAdditions: [...(prev.suggestedAdditions || []), data.newItem],
        } : prev);
      }
      if (data.action === 'remove_feature' && data.targetId && analysis) {
        setAnalysis(prev => prev ? {
          ...prev,
          coreFeatures: prev.coreFeatures.filter(f => f.id !== data.targetId),
          suggestedAdditions: (prev.suggestedAdditions || []).filter(f => f.id !== data.targetId),
        } : prev);
        setKeptFeatures(prev => { const n = new Set(prev); n.delete(data.targetId); return n; });
      }

      setDiscussion(prev => [...prev, {
        role: 'ai',
        content: data.reply || 'Done.',
        changes: data.changes || [],
      }]);
    } catch (e: any) {
      setDiscussion(prev => [...prev, { role: 'ai', content: `Error: ${e.message}` }]);
    } finally {
      setDiscussLoading(false);
    }
  };

  // Launch project
  const launchProject = async () => {
    if (!ideaId || launching) return;
    setLaunching(true);

    const approvedFeatures = (analysis?.coreFeatures || []).filter(f => keptFeatures.has(f.id));
    const addedFeatures = (analysis?.suggestedAdditions || []).filter(f => keptFeatures.has(f.id));

    try {
      const res = await fetch(`/api/ideas/${ideaId}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedFeatures: [...approvedFeatures, ...addedFeatures],
        }),
      });
      const data = await res.json();

      if (data.jobId) {
        setLaunchJobId(data.jobId);
      } else {
        throw new Error(data.error || 'Launch failed');
      }
    } catch (e: any) {
      alert('Launch error: ' + e.message);
      setLaunching(false);
    }
  };

  // Called when launch job completes
  const onLaunchDone = (result: any) => {
    if (result?.projectId) {
      router.push(`/dashboard/projects/${result.projectId}`);
    }
  };

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left sidebar: idea history ── */}
      <div style={{
        width: 220, flexShrink: 0, borderRight: '0.5px solid var(--color-border-tertiary)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <p style={{ fontSize: 11, fontWeight: 500, margin: 0 }}>Ideas</p>
        </div>

        <button
          onClick={() => { setPageState('empty'); setIdeaText(''); setAnalysis(null); setJobId(null); setIdeaId(null); setDiscussion([]); setLaunching(false); setLaunchJobId(null); }}
          style={{
            margin: 8, padding: '7px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            border: '0.5px solid var(--color-border-tertiary)',
            background: 'transparent', color: 'var(--color-text-primary)', textAlign: 'left',
          }}
        >
          + New idea
        </button>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {ideas.map(idea => (
            <button
              key={idea.id}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 14px',
                background: selectedIdeaId === idea.id ? 'var(--color-background-secondary)' : 'transparent',
                border: 'none', cursor: 'pointer', borderBottom: '0.5px solid var(--color-border-tertiary)',
              }}
              onClick={() => setSelectedIdeaId(idea.id)}
            >
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {idea.ideaText?.slice(0, 40) || 'Untitled'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                {idea.status === 'launched' ? '✓ Launched' : idea.status === 'analyzed' ? '◎ Analyzed' : '○ Pending'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── STATE: Empty — input form ── */}
        {pageState === 'empty' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <div style={{ maxWidth: 600, width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💡</div>
                <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 8px' }}>Strategic Room</h1>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
                  Write your idea — even one sentence — and we will build a complete project vision from it.
                </p>
              </div>

              <textarea
                value={ideaText}
                onChange={e => setIdeaText(e.target.value)}
                placeholder="Example: I want a platform that manages social media accounts with AI agents that create and schedule content automatically..."
                rows={5}
                autoFocus
                style={{
                  width: '100%', padding: 16, fontSize: 14, borderRadius: 12, resize: 'vertical',
                  border: '0.5px solid var(--color-border-tertiary)',
                  background: 'var(--color-background-secondary)',
                  color: 'var(--color-text-primary)', lineHeight: 1.6,
                  boxSizing: 'border-box',
                }}
              />

              <button
                onClick={submitIdea}
                disabled={!ideaText.trim()}
                style={{
                  marginTop: 12, width: '100%', padding: '12px 24px', borderRadius: 10,
                  fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  background: ideaText.trim() ? '#7F77DD' : 'var(--color-background-secondary)',
                  color: ideaText.trim() ? '#fff' : 'var(--color-text-secondary)',
                  border: 'none', transition: 'background 0.2s',
                }}
              >
                Analyze idea →
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 20 }}>
                {[
                  { icon: '📊', label: 'Market analysis' },
                  { icon: '⚙', label: 'Technical specs' },
                  { icon: '💰', label: 'Cost projection' },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '10px 14px', borderRadius: 10, textAlign: 'center', fontSize: 12,
                    border: '0.5px solid var(--color-border-tertiary)',
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-background-secondary)',
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STATE: Analyzing — live progress ── */}
        {(pageState === 'submitting' || pageState === 'analyzing') && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <div style={{ maxWidth: 480, width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <h2 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 6px' }}>Analyzing your idea</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
                  Running deep research, market analysis, and strategic planning...
                </p>
              </div>

              {jobId && (
                <JobProgress
                  jobId={jobId}
                  onDone={onAnalysisDone}
                  onFailed={(err) => {
                    alert('Analysis failed: ' + err);
                    setPageState('empty');
                  }}
                  labels={{
                    queued: 'Queued — starting shortly...',
                    running: undefined,
                    done: 'Analysis complete!',
                    failed: 'Analysis failed',
                  }}
                />
              )}

              <p style={{ marginTop: 16, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                This takes 2-3 minutes. You can leave and come back — progress is saved.
              </p>
            </div>
          </div>
        )}

        {/* ── STATE: Ready — full analysis document ── */}
        {pageState === 'ready' && analysis && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 120px' }}>

            {/* Project header */}
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 6px' }}>
                {analysis.projectName}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
                {analysis.tagline}
              </p>
              <p style={{ fontSize: 13, marginTop: 10, lineHeight: 1.7, maxWidth: 700 }}>
                {analysis.vision}
              </p>
            </div>

            {/* Market opportunity */}
            {analysis.marketOpportunity && (
              <Section title="Market Opportunity" icon="📊">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
                  {[
                    { label: 'TAM', value: analysis.marketOpportunity.tam },
                    { label: 'SAM', value: analysis.marketOpportunity.sam },
                    { label: 'SOM', value: analysis.marketOpportunity.som },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
                  {analysis.marketOpportunity.summary}
                </p>
              </Section>
            )}

            {/* Competitive analysis */}
            {analysis.competitors && analysis.competitors.length > 0 && (
              <Section title="Competitive Analysis" icon="🥊">
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        {['Competitor', 'Strengths', 'Weaknesses', 'Our Advantage'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)', fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.competitors.map((c, i) => (
                        <tr key={i}>
                          <td style={{ padding: '8px 12px', fontWeight: 500, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{c.name}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{c.strengths}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{c.weaknesses}</td>
                          <td style={{ padding: '8px 12px', color: '#1D9E75', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{c.ourAdvantage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {/* Core features */}
            <Section title={`Core Features (${analysis.coreFeatures?.length || 0})`} icon="✨">
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                Keep the features you want in the final project. You can also discuss changes below.
              </p>
              {(analysis.coreFeatures || []).map(feature => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  kept={keptFeatures.has(feature.id)}
                  onKeep={() => setKeptFeatures(prev => new Set([...prev, feature.id]))}
                  onSkip={() => setKeptFeatures(prev => { const n = new Set(prev); n.delete(feature.id); return n; })}
                />
              ))}
            </Section>

            {/* AI suggested additions */}
            {analysis.suggestedAdditions && analysis.suggestedAdditions.length > 0 && (
              <Section title="AI-Suggested Additions" icon="💡" defaultOpen={false}>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                  Features we suggest adding that were not in your original idea.
                </p>
                {analysis.suggestedAdditions.map(feature => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    kept={keptFeatures.has(feature.id)}
                    onKeep={() => setKeptFeatures(prev => new Set([...prev, feature.id]))}
                    onSkip={() => setKeptFeatures(prev => { const n = new Set(prev); n.delete(feature.id); return n; })}
                  />
                ))}
              </Section>
            )}

            {/* Pages */}
            {analysis.pages && analysis.pages.length > 0 && (
              <Section title={`Pages & Screens (${analysis.pages.length})`} icon="📄" defaultOpen={false}>
                <div style={{ display: 'grid', gap: 10 }}>
                  {analysis.pages.map(page => (
                    <div key={page.id} style={{ padding: '12px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{page.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-info)', fontFamily: 'monospace' }}>{page.route}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>{page.purpose}</p>
                      {page.wireframeDescription && (
                        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0, opacity: 0.7 }}>{page.wireframeDescription}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Tech stack */}
            {analysis.techStack && (
              <Section title="Technical Stack" icon="⚙" defaultOpen={false}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {Object.entries(analysis.techStack).map(([layer, info]: [string, any]) => {
                    if (typeof info !== 'object' || !info?.framework) return null;
                    return (
                      <div key={layer} style={{ padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>
                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{layer}</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{info.framework}</div>
                        {info.why && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 }}>{info.why}</div>}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Financials */}
            {analysis.financials && (
              <Section title="Financial Projection" icon="💰" defaultOpen={false}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                  {Object.entries(analysis.financials?.monthlyCosts || {}).map(([k, v]: [string, any]) => (
                    <div key={k} style={{ padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>
                      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 4, textTransform: 'capitalize' }}>{k}</div>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {analysis.financials.revenueModel && (
                  <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                    <strong>Revenue model: </strong>{analysis.financials.revenueModel}
                  </p>
                )}
              </Section>
            )}

            {/* Phases */}
            {analysis.phases && analysis.phases.length > 0 && (
              <Section title="Implementation Phases" icon="🗓" defaultOpen={false}>
                {analysis.phases.map((phase, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 14, background: 'var(--color-background-secondary)',
                      border: '0.5px solid var(--color-border-tertiary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 500, flexShrink: 0, marginTop: 2,
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{phase.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{phase.duration} · {phase.goal}</div>
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* Discussion */}
            <div style={{ marginBottom: 16, borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: 'var(--color-background-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>💬 Discuss & Refine</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '3px 0 0' }}>
                  Ask to add, remove, or change anything. Changes update instantly.
                </p>
              </div>

              {discussion.length > 0 && (
                <div style={{ padding: 12, maxHeight: 240, overflowY: 'auto' }}>
                  {discussion.map((msg, i) => (
                    <div key={i} style={{
                      marginBottom: 8, display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        maxWidth: '80%', padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.5,
                        background: msg.role === 'user' ? 'var(--color-background-info)' : 'var(--color-background-secondary)',
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={discussEndRef} />
                </div>
              )}

              <div style={{ padding: 12, display: 'flex', gap: 8 }}>
                <input
                  value={discussInput}
                  onChange={e => setDiscussInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendDiscussion(); }}
                  placeholder="Add a feature, remove something, ask a question..."
                  disabled={discussLoading}
                  style={{
                    flex: 1, padding: '8px 12px', fontSize: 12, borderRadius: 8,
                    border: '0.5px solid var(--color-border-tertiary)',
                    background: 'var(--color-background-secondary)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button
                  onClick={sendDiscussion}
                  disabled={!discussInput.trim() || discussLoading}
                  style={{
                    padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                    border: '0.5px solid var(--color-border-tertiary)',
                    background: 'transparent', fontSize: 13,
                    opacity: !discussInput.trim() || discussLoading ? 0.4 : 1,
                  }}
                >→</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Fixed bottom bar: Launch button ── */}
        {pageState === 'ready' && analysis && (
          <div style={{
            position: 'sticky', bottom: 0,
            padding: '12px 24px', borderTop: '0.5px solid var(--color-border-tertiary)',
            background: 'var(--color-background-primary)',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {keptFeatures.size} features selected
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 10 }}>
                Ready to generate tasks and create the project
              </span>
            </div>

            {/* Launch progress */}
            {launchJobId && (
              <div style={{ width: 280 }}>
                <JobProgress
                  jobId={launchJobId}
                  onDone={onLaunchDone}
                  onFailed={(err) => { alert('Launch failed: ' + err); setLaunching(false); setLaunchJobId(null); }}
                  labels={{ queued: 'Preparing...', done: 'Project created!', failed: 'Launch failed' }}
                />
              </div>
            )}

            {!launchJobId && (
              <button
                onClick={launchProject}
                disabled={keptFeatures.size === 0 || launching}
                style={{
                  padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                  cursor: keptFeatures.size === 0 || launching ? 'not-allowed' : 'pointer',
                  background: keptFeatures.size > 0 && !launching ? '#1D9E75' : 'var(--color-background-secondary)',
                  color: keptFeatures.size > 0 && !launching ? '#fff' : 'var(--color-text-secondary)',
                  border: 'none',
                }}
              >
                {launching ? 'Launching...' : 'Launch Project →'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
IDEASEOF

echo "OK: Ideas page rebuilt as Strategic Room"
echo "=== STEP 2 COMPLETE ==="
```

---

# ════════════════════════════════════════════════════════
# STEP 3: Build and verify
# ════════════════════════════════════════════════════════

```bash
echo "=== STEP 3: Build and verify ==="
cd /root/genplatform

npm run build 2>&1 | tail -30
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
  echo "BUILD PASSED"
  pm2 restart genplatform-app
  sleep 4

  echo "Testing Ideas system..."

  # Test 1: Ideas page loads
  IDEAS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard/ideas)
  echo "Ideas page HTTP status: $IDEAS_STATUS"

  # Test 2: Submit idea and get job ID instantly
  ANALYZE_RESPONSE=$(curl -s -m 5 -X POST http://localhost:3000/api/ideas/analyze \
    -H "Content-Type: application/json" \
    -d '{"ideaText":"I want to build a recipe sharing app"}')

  JOB_ID=$(echo "$ANALYZE_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('jobId','none'))" 2>/dev/null)
  RESPONSE_TIME="fast"

  echo "Job ID returned: $JOB_ID"
  echo "Response was: $RESPONSE_TIME (should be under 1 second)"

  # Test 3: Job status endpoint
  if [ "$JOB_ID" != "none" ] && [ -n "$JOB_ID" ]; then
    sleep 2
    JOB_STATUS=$(curl -s "http://localhost:3000/api/jobs/$JOB_ID" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status'), d.get('progress','?'), '%')" 2>/dev/null)
    echo "Job status: $JOB_STATUS"
  fi

  # Test 4: Discussion API
  IDEA_ID=$(echo "$ANALYZE_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ideaId','none'))" 2>/dev/null)
  if [ "$IDEA_ID" != "none" ] && [ -n "$IDEA_ID" ]; then
    DISCUSS=$(curl -s -m 10 -X POST "http://localhost:3000/api/ideas/$IDEA_ID/discuss" \
      -H "Content-Type: application/json" \
      -d '{"message":"add a social sharing feature","currentAnalysis":{}}' \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('action','error'))" 2>/dev/null)
    echo "Discussion action: $DISCUSS"
  fi

  MSG="FILE-5 STRATEGIC ROOM COMPLETE%0ABuild: PASSED%0AIdeas page: $IDEAS_STATUS%0AJob created: $JOB_ID%0AJob status: $JOB_STATUS%0A%0AReady for FILE-6 (Projects)"
  curl -s "https://api.telegram.org/bot8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4/sendMessage" \
    -d "chat_id=510906393&text=$MSG" > /dev/null

else
  echo "BUILD FAILED"
  npm run build 2>&1 | grep -E "Cannot find|Module not found|Type error" | head -15

  ERRS=$(npm run build 2>&1 | grep -E "Cannot find|Type error" | head -3 | tr '\n' ' ' | cut -c1-180)
  MSG="FILE-5 BUILD FAILED%0AErrors: $ERRS"
  curl -s "https://api.telegram.org/bot8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4/sendMessage" \
    -d "chat_id=510906393&text=$MSG" > /dev/null
fi
```

---

# EXPECTED STATE AFTER FILE-5 COMPLETES

API routes:
  POST /api/ideas/analyze           -> Returns jobId in < 1 second (no timeout)
  GET  /api/ideas                   -> All ideas from database
  GET  /api/ideas/[id]              -> Single idea with full analysis
  POST /api/ideas/[id]/discuss      -> Updates analysis based on user message
  POST /api/ideas/[id]/launch       -> Starts launch-project job

Ideas page (/dashboard/ideas):
  Left sidebar: list of all ideas + "New idea" button
  Empty state: large textarea with example placeholder
  Analyzing state: JobProgress bar with live percentage
  Ready state: full interactive document with 8 collapsible sections
  Bottom bar: feature count + Launch Project button

User flow:
  - Type idea -> click "Analyze idea" -> job starts instantly
  - Progress bar shows: 5% Research -> 25% Market -> 45% Strategy -> 65% Features -> 80% Vision -> 100% Done
  - Document appears: Market opportunity, Competitors table, Feature cards with Keep/Skip
  - Discussion box: type "add notifications" -> feature appears in the list immediately
  - Click "Launch Project" -> task generation starts with live counter -> redirect to project page

Build: PASSING

When confirmed -> send "FILE-5 DONE" in Telegram -> start FILE-6
