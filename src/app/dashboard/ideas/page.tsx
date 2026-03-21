'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { JobProgress } from '@/components/shared/JobProgress';

interface Feature {
  id: string; name: string; description: string;
  impact: 'high' | 'medium' | 'low'; complexity: 'low' | 'medium' | 'high';
  aiTools?: string[]; pages?: string[]; userAdded?: boolean;
}

interface Page { id: string; name: string; route: string; purpose: string; components?: string[]; wireframeDescription?: string; }

interface Analysis {
  projectName: string; tagline: string; vision: string;
  marketOpportunity?: { tam: string; sam: string; som: string; summary: string };
  competitors?: { name: string; strengths: string; weaknesses: string; ourAdvantage: string }[];
  coreFeatures: Feature[]; suggestedAdditions: Feature[]; pages: Page[];
  agents?: { name: string; role: string; triggers: string }[];
  techStack?: any; financials?: any;
  phases?: { name: string; duration: string; goal: string; features: string[] }[];
  risks?: { risk: string; probability: string; mitigation: string }[];
}

interface DiscussMessage { role: 'user' | 'ai'; content: string; changes?: string[]; }

type PageState = 'empty' | 'submitting' | 'analyzing' | 'ready';

function ImpactBadge({ impact }: { impact: string }) {
  const color = impact === 'high' ? '#1D9E75' : impact === 'medium' ? '#EF9F27' : 'var(--color-text-secondary)';
  const bg = impact === 'high' ? 'rgba(29,158,117,0.12)' : impact === 'medium' ? 'rgba(239,159,39,0.12)' : 'var(--color-background-secondary)';
  return <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: bg, color, border: `0.5px solid ${color}40` }}>{impact} impact</span>;
}

function Section({ title, icon, children, defaultOpen = true }: any) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16, borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-background-secondary)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}><span>{icon}</span> {title}</span>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ padding: 16, background: 'var(--color-background-primary)' }}>{children}</div>}
    </div>
  );
}

function FeatureCard({ feature, kept, onKeep, onSkip }: any) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 8, border: `0.5px solid ${kept ? '#1D9E75' : 'var(--color-border-tertiary)'}`, background: kept ? 'rgba(29,158,117,0.05)' : 'var(--color-background-secondary)', display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'border-color 0.2s, background 0.2s' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{feature.name}</span>
          {feature.userAdded && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(127,119,221,0.15)', color: '#7F77DD' }}>you added</span>}
          <ImpactBadge impact={feature.impact} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>{feature.description}</p>
        {feature.aiTools && feature.aiTools.length > 0 && (
          <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {feature.aiTools.map((t: string) => (
              <span key={t} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>{t}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
        <button onClick={onKeep} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', border: kept ? 'none' : '0.5px solid #1D9E75', background: kept ? '#1D9E75' : 'transparent', color: kept ? '#fff' : '#1D9E75', fontWeight: kept ? 500 : 400 }}>
          {kept ? '✓ Kept' : 'Keep'}
        </button>
        {!kept && <button onClick={onSkip} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', border: '0.5px solid var(--color-border-tertiary)', background: 'transparent', color: 'var(--color-text-secondary)' }}>Skip</button>}
      </div>
    </div>
  );
}

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

  useEffect(() => {
    fetch('/api/ideas').then(r => r.json()).then(data => { if (Array.isArray(data)) setIdeas(data); }).catch(() => {});
  }, []);

  useEffect(() => { discussEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [discussion]);

  const submitIdea = async () => {
    if (!ideaText.trim()) return;
    setPageState('submitting');
    try {
      const res = await fetch('/api/ideas/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ideaText }) });
      const data = await res.json();
      if (data.jobId && data.ideaId) { setIdeaId(data.ideaId); setJobId(data.jobId); setPageState('analyzing'); }
      else throw new Error(data.error || 'Failed');
    } catch (e: any) { alert('Error: ' + e.message); setPageState('empty'); }
  };

  const onAnalysisDone = async () => {
    if (!ideaId) return;
    try {
      const res = await fetch(`/api/ideas/${ideaId}`);
      const idea = await res.json();
      const expanded = idea.analysis?.expanded;
      if (expanded) {
        setAnalysis(expanded);
        setKeptFeatures(new Set((expanded.coreFeatures || []).map((f: Feature) => f.id)));
      }
    } catch {}
    setPageState('ready');
    setIdeas(prev => [{ id: ideaId, ideaText, status: 'analyzed' }, ...prev]);
  };

  const sendDiscussion = async () => {
    if (!discussInput.trim() || discussLoading || !ideaId) return;
    const userMsg = discussInput;
    setDiscussInput(''); setDiscussLoading(true);
    setDiscussion(prev => [...prev, { role: 'user', content: userMsg }]);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/discuss`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg, currentAnalysis: analysis }) });
      const data = await res.json();
      if (data.action === 'add_feature' && data.newItem && analysis) {
        setAnalysis(prev => prev ? { ...prev, coreFeatures: [...prev.coreFeatures, data.newItem] } : prev);
        setKeptFeatures(prev => new Set([...prev, data.newItem.id]));
      }
      if (data.action === 'add_suggestion' && data.newItem && analysis) {
        setAnalysis(prev => prev ? { ...prev, suggestedAdditions: [...(prev.suggestedAdditions || []), data.newItem] } : prev);
      }
      if (data.action === 'remove_feature' && data.targetId && analysis) {
        setAnalysis(prev => prev ? { ...prev, coreFeatures: prev.coreFeatures.filter(f => f.id !== data.targetId), suggestedAdditions: (prev.suggestedAdditions || []).filter(f => f.id !== data.targetId) } : prev);
        setKeptFeatures(prev => { const n = new Set(prev); n.delete(data.targetId); return n; });
      }
      setDiscussion(prev => [...prev, { role: 'ai', content: data.reply || 'Done.', changes: data.changes || [] }]);
    } catch (e: any) { setDiscussion(prev => [...prev, { role: 'ai', content: `Error: ${e.message}` }]); }
    finally { setDiscussLoading(false); }
  };

  const launchProject = async () => {
    if (!ideaId || launching) return;
    setLaunching(true);
    const approvedFeatures = (analysis?.coreFeatures || []).filter(f => keptFeatures.has(f.id));
    const addedFeatures = (analysis?.suggestedAdditions || []).filter(f => keptFeatures.has(f.id));
    try {
      const res = await fetch(`/api/ideas/${ideaId}/launch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvedFeatures: [...approvedFeatures, ...addedFeatures] }) });
      const data = await res.json();
      if (data.jobId) setLaunchJobId(data.jobId); else throw new Error(data.error || 'Launch failed');
    } catch (e: any) { alert('Launch error: ' + e.message); setLaunching(false); }
  };

  const onLaunchDone = (result: any) => { if (result?.projectId) router.push(`/dashboard/projects/${result.projectId}`); };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left sidebar */}
      <div style={{ width: 220, flexShrink: 0, borderRight: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <p style={{ fontSize: 11, fontWeight: 500, margin: 0 }}>Ideas</p>
        </div>
        <button onClick={() => { setPageState('empty'); setIdeaText(''); setAnalysis(null); setJobId(null); setIdeaId(null); setDiscussion([]); setLaunching(false); setLaunchJobId(null); }} style={{ margin: 8, padding: '7px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: '0.5px solid var(--color-border-tertiary)', background: 'transparent', color: 'var(--color-text-primary)', textAlign: 'left' }}>
          + New idea
        </button>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {ideas.map(idea => (
            <button key={idea.id} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(idea.ideaText || idea.idea_text || 'Untitled').slice(0, 40)}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{idea.status === 'launched' ? '✓ Launched' : idea.status === 'analyzed' ? '◎ Analyzed' : '○ Pending'}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Empty state */}
        {pageState === 'empty' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <div style={{ maxWidth: 600, width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💡</div>
                <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 8px' }}>Strategic Room</h1>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>Write your idea — even one sentence — and we will build a complete project vision from it.</p>
              </div>
              <textarea value={ideaText} onChange={e => setIdeaText(e.target.value)} placeholder="Example: I want a platform that manages social media accounts with AI agents that create and schedule content automatically..." rows={5} autoFocus style={{ width: '100%', padding: 16, fontSize: 14, borderRadius: 12, resize: 'vertical', border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', lineHeight: 1.6, boxSizing: 'border-box' }} />
              <button onClick={submitIdea} disabled={!ideaText.trim()} style={{ marginTop: 12, width: '100%', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', background: ideaText.trim() ? '#7F77DD' : 'var(--color-background-secondary)', color: ideaText.trim() ? '#fff' : 'var(--color-text-secondary)', border: 'none' }}>
                Analyze idea →
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 20 }}>
                {[{ icon: '📊', label: 'Market analysis' }, { icon: '⚙', label: 'Technical specs' }, { icon: '💰', label: 'Cost projection' }].map(item => (
                  <div key={item.label} style={{ padding: '10px 14px', borderRadius: 10, textAlign: 'center', fontSize: 12, border: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)', background: 'var(--color-background-secondary)' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>{item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analyzing state */}
        {(pageState === 'submitting' || pageState === 'analyzing') && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <div style={{ maxWidth: 480, width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <h2 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 6px' }}>Analyzing your idea</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>Running deep research, market analysis, and strategic planning...</p>
              </div>
              {jobId && (
                <JobProgress jobId={jobId} onDone={onAnalysisDone} onFailed={(err) => { alert('Analysis failed: ' + err); setPageState('empty'); }} labels={{ queued: 'Queued — starting shortly...', done: 'Analysis complete!', failed: 'Analysis failed' }} />
              )}
              <p style={{ marginTop: 16, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center' }}>This takes 2-3 minutes. You can leave and come back.</p>
            </div>
          </div>
        )}

        {/* Ready state — full analysis */}
        {pageState === 'ready' && analysis && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 120px' }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 6px' }}>{analysis.projectName}</h1>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>{analysis.tagline}</p>
              <p style={{ fontSize: 13, marginTop: 10, lineHeight: 1.7, maxWidth: 700 }}>{analysis.vision}</p>
            </div>

            {analysis.marketOpportunity && (
              <Section title="Market Opportunity" icon="📊">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
                  {[{ label: 'TAM', value: analysis.marketOpportunity.tam }, { label: 'SAM', value: analysis.marketOpportunity.sam }, { label: 'SOM', value: analysis.marketOpportunity.som }].map(s => (
                    <div key={s.label} style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>{analysis.marketOpportunity.summary}</p>
              </Section>
            )}

            {analysis.competitors && analysis.competitors.length > 0 && (
              <Section title="Competitive Analysis" icon="🥊">
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead><tr>{['Competitor', 'Strengths', 'Weaknesses', 'Our Advantage'].map(h => (<th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)', fontWeight: 500 }}>{h}</th>))}</tr></thead>
                    <tbody>{analysis.competitors.map((c, i) => (<tr key={i}><td style={{ padding: '8px 12px', fontWeight: 500, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{c.name}</td><td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{c.strengths}</td><td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{c.weaknesses}</td><td style={{ padding: '8px 12px', color: '#1D9E75', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{c.ourAdvantage}</td></tr>))}</tbody>
                  </table>
                </div>
              </Section>
            )}

            <Section title={`Core Features (${analysis.coreFeatures?.length || 0})`} icon="✨">
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Keep the features you want. Discuss changes below.</p>
              {(analysis.coreFeatures || []).map(feature => (
                <FeatureCard key={feature.id} feature={feature} kept={keptFeatures.has(feature.id)} onKeep={() => setKeptFeatures(prev => new Set([...prev, feature.id]))} onSkip={() => setKeptFeatures(prev => { const n = new Set(prev); n.delete(feature.id); return n; })} />
              ))}
            </Section>

            {analysis.suggestedAdditions && analysis.suggestedAdditions.length > 0 && (
              <Section title="AI-Suggested Additions" icon="💡" defaultOpen={false}>
                {analysis.suggestedAdditions.map(feature => (
                  <FeatureCard key={feature.id} feature={feature} kept={keptFeatures.has(feature.id)} onKeep={() => setKeptFeatures(prev => new Set([...prev, feature.id]))} onSkip={() => setKeptFeatures(prev => { const n = new Set(prev); n.delete(feature.id); return n; })} />
                ))}
              </Section>
            )}

            {analysis.pages && analysis.pages.length > 0 && (
              <Section title={`Pages & Screens (${analysis.pages.length})`} icon="📄" defaultOpen={false}>
                <div style={{ display: 'grid', gap: 10 }}>
                  {analysis.pages.map(page => (
                    <div key={page.id} style={{ padding: '12px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{page.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-info)', fontFamily: 'monospace' }}>{page.route}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>{page.purpose}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {analysis.techStack && (
              <Section title="Technical Stack" icon="⚙" defaultOpen={false}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {Object.entries(analysis.techStack).map(([layer, info]: [string, any]) => {
                    if (typeof info !== 'object' || !info?.framework) return null;
                    return (
                      <div key={layer} style={{ padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>
                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>{layer}</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{info.framework || info.type}</div>
                        {info.why && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 }}>{info.why}</div>}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {analysis.phases && analysis.phases.length > 0 && (
              <Section title="Implementation Phases" icon="🗓" defaultOpen={false}>
                {analysis.phases.map((phase, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>{i + 1}</div>
                    <div><div style={{ fontSize: 13, fontWeight: 500 }}>{phase.name}</div><div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{phase.duration} · {phase.goal}</div></div>
                  </div>
                ))}
              </Section>
            )}

            {/* Discussion */}
            <div style={{ marginBottom: 16, borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: 'var(--color-background-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>💬 Discuss & Refine</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '3px 0 0' }}>Ask to add, remove, or change anything.</p>
              </div>
              {discussion.length > 0 && (
                <div style={{ padding: 12, maxHeight: 240, overflowY: 'auto' }}>
                  {discussion.map((msg, i) => (
                    <div key={i} style={{ marginBottom: 8, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '80%', padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.5, background: msg.role === 'user' ? 'var(--color-background-info)' : 'var(--color-background-secondary)' }}>{msg.content}</div>
                    </div>
                  ))}
                  <div ref={discussEndRef} />
                </div>
              )}
              <div style={{ padding: 12, display: 'flex', gap: 8 }}>
                <input value={discussInput} onChange={e => setDiscussInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendDiscussion(); }} placeholder="Add a feature, remove something, ask a question..." disabled={discussLoading} style={{ flex: 1, padding: '8px 12px', fontSize: 12, borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)' }} />
                <button onClick={sendDiscussion} disabled={!discussInput.trim() || discussLoading} style={{ padding: '8px 14px', borderRadius: 8, cursor: 'pointer', border: '0.5px solid var(--color-border-tertiary)', background: 'transparent', fontSize: 13, opacity: !discussInput.trim() || discussLoading ? 0.4 : 1 }}>→</button>
              </div>
            </div>
          </div>
        )}

        {/* Launch bar */}
        {pageState === 'ready' && analysis && (
          <div style={{ position: 'sticky', bottom: 0, padding: '12px 24px', borderTop: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{keptFeatures.size} features selected</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 10 }}>Ready to generate tasks and create the project</span>
            </div>
            {launchJobId ? (
              <div style={{ width: 280 }}>
                <JobProgress jobId={launchJobId} onDone={onLaunchDone} onFailed={(err) => { alert('Launch failed: ' + err); setLaunching(false); setLaunchJobId(null); }} labels={{ queued: 'Preparing...', done: 'Project created!', failed: 'Launch failed' }} />
              </div>
            ) : (
              <button onClick={launchProject} disabled={keptFeatures.size === 0 || launching} style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: keptFeatures.size === 0 || launching ? 'not-allowed' : 'pointer', background: keptFeatures.size > 0 && !launching ? '#1D9E75' : 'var(--color-background-secondary)', color: keptFeatures.size > 0 && !launching ? '#fff' : 'var(--color-text-secondary)', border: 'none' }}>
                {launching ? 'Launching...' : 'Launch Project →'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
