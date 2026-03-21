'use client';

import { useState, useEffect } from 'react';

const STAGES = [
  { id: 'idea', emoji: '💡', label: 'Idea' },
  { id: 'analysis', emoji: '🔬', label: 'Analysis' },
  { id: 'planning', emoji: '📋', label: 'Planning' },
  { id: 'development', emoji: '💻', label: 'Dev' },
  { id: 'review', emoji: '🔍', label: 'Review' },
  { id: 'security', emoji: '🛡️', label: 'Security' },
  { id: 'deploy', emoji: '✅', label: 'Deploy' },
];

interface Props {
  projectId: string;
  progress?: number;
  currentPhase?: string;
  tasksDone?: number;
  tasksTotal?: number;
}

export function ProjectPipeline({ projectId, progress = 0, currentPhase = 'development', tasksDone = 0, tasksTotal = 0 }: Props) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [stageContent, setStageContent] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const activeIdx = STAGES.findIndex(s => s.id === currentPhase);

  const handleStageClick = async (stageId: string) => {
    if (selectedStage === stageId) { setSelectedStage(null); return; }
    setSelectedStage(stageId);
    setLoadingContent(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/pipeline`);
      if (res.ok) {
        const data = await res.json();
        setStageContent(data[stageId] || null);
      }
    } catch {} finally { setLoadingContent(false); }
  };

  const getStatus = (idx: number) => idx < activeIdx ? 'done' : idx === activeIdx ? 'active' : 'pending';
  const statusColor = (s: string) => s === 'done' ? '#22c55e' : s === 'active' ? '#eab308' : '#6b7280';
  const statusBg = (s: string) => s === 'done' ? 'rgba(34,197,94,0.1)' : s === 'active' ? 'rgba(234,179,8,0.1)' : 'rgba(107,114,128,0.05)';

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-2xl font-bold">{tasksTotal}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-500">{tasksDone}</div>
          <div className="text-xs text-muted-foreground">Done</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-amber-500">{tasksTotal - tasksDone}</div>
          <div className="text-xs text-muted-foreground">Remaining</div>
        </div>
      </div>

      {/* Pipeline stages */}
      <div className="flex items-center overflow-x-auto gap-0 p-2">
        {STAGES.map((stage, idx) => {
          const status = getStatus(idx);
          const isSelected = selectedStage === stage.id;
          return (
            <div key={stage.id} className="flex items-center">
              <button
                onClick={() => handleStageClick(stage.id)}
                className="flex flex-col items-center min-w-[80px] p-3 rounded-xl transition-all cursor-pointer hover:scale-105"
                style={{
                  border: isSelected ? `2px solid ${statusColor(status)}` : '1px solid var(--border)',
                  background: isSelected ? statusBg(status) : 'transparent',
                }}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-1
                  ${status === 'active' ? 'animate-pulse' : ''}`}
                  style={{ background: statusBg(status) }}>
                  {stage.emoji}
                </div>
                <span className="text-[11px] font-medium">{stage.label}</span>
                <span className="text-[10px] mt-0.5" style={{ color: statusColor(status) }}>
                  {status === 'done' ? '✓' : status === 'active' ? '●' : '—'}
                </span>
              </button>
              {idx < STAGES.length - 1 && (
                <div className="w-6 h-0.5 mx-0.5" style={{
                  background: getStatus(idx + 1) !== 'pending' ? '#22c55e' : 'var(--border)'
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Stage detail panel */}
      {selectedStage && (
        <div className="border rounded-xl p-5 bg-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-sm">
              {STAGES.find(s => s.id === selectedStage)?.emoji} {STAGES.find(s => s.id === selectedStage)?.label} Stage
            </h3>
            <button onClick={() => setSelectedStage(null)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>

          {loadingContent ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !stageContent ? (
            <p className="text-sm text-muted-foreground">No data for this stage yet.</p>
          ) : (
            <div className="space-y-4 text-sm">
              {/* Idea */}
              {selectedStage === 'idea' && (
                <>
                  <Field label="Original Idea" value={stageContent.originalIdea} />
                  <Field label="Problem Solved" value={stageContent.problemSolved} />
                  <Field label="Value Proposition" value={stageContent.valueProposition} />
                  <Field label="Target Audience" value={stageContent.targetAudience?.join(', ')} />
                </>
              )}
              {/* Analysis */}
              {selectedStage === 'analysis' && (
                <>
                  <Field label="Market Size" value={stageContent.marketAnalysis?.marketSize} />
                  {stageContent.marketAnalysis?.competitors?.map((c: any) => (
                    <div key={c.name} className="border rounded-lg p-3 text-xs">
                      <strong>{c.name}</strong> — {c.ourAdvantage}
                    </div>
                  ))}
                  {stageContent.coreFeatures?.map((f: any) => (
                    <div key={f.name} className="text-xs">
                      <span className={f.priority === 'must' ? 'text-green-500' : 'text-muted-foreground'}>
                        {f.priority === 'must' ? '●' : '○'}
                      </span>{' '}
                      <strong>{f.name}</strong> — {f.description}
                    </div>
                  ))}
                  <Field label="Tech Stack" value={stageContent.techStack ? Object.entries(stageContent.techStack).map(([k,v]) => `${k}: ${v}`).join('\n') : ''} />
                  <Field label="Cost" value={stageContent.costEstimation?.total} />
                </>
              )}
              {/* Planning */}
              {selectedStage === 'planning' && (
                <>
                  <Field label="Architecture" value={stageContent.architecture} />
                  {stageContent.pages?.map((p: any) => (
                    <div key={p.route} className="text-xs"><code className="text-blue-500">{p.route}</code> — {p.role}</div>
                  ))}
                </>
              )}
              {/* Development */}
              {selectedStage === 'development' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold">{stageContent.total || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Total</div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-500">{stageContent.completed || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Done</div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-amber-500">{(stageContent.total || 0) - (stageContent.completed || 0)}</div>
                      <div className="text-[10px] text-muted-foreground">Left</div>
                    </div>
                  </div>
                  {stageContent.phases?.map((p: any) => (
                    <div key={p.name} className="flex items-center gap-2 text-xs">
                      <span>{p.status === 'done' ? '✅' : p.status === 'active' ? '🔄' : '⏳'}</span>
                      <span className="flex-1">{p.name}</span>
                      <span className="text-muted-foreground">{p.tasks} tasks</span>
                    </div>
                  ))}
                </>
              )}
              {/* Others */}
              {['review','security','deploy'].includes(selectedStage) && (
                <p className="text-muted-foreground">Stage pending — will populate when reached.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span><span>{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[11px] text-muted-foreground font-medium mb-1">{label}</div>
      <div className="text-xs whitespace-pre-line leading-relaxed">{value}</div>
    </div>
  );
}
