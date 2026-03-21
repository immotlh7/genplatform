'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const TABS = ['Pipeline', 'Tasks', 'Files', 'Chat', 'Preview', 'Settings'] as const;
type Tab = typeof TABS[number];

const STAGES = [
  { id: 'idea', emoji: '💡', label: 'Idea' }, { id: 'analysis', emoji: '🔬', label: 'Analysis' },
  { id: 'planning', emoji: '📋', label: 'Planning' }, { id: 'development', emoji: '💻', label: 'Development' },
  { id: 'review', emoji: '🔍', label: 'Review' }, { id: 'security', emoji: '🛡️', label: 'Security' },
  { id: 'deploy', emoji: '✅', label: 'Deploy' },
];

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('Pipeline');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [liveLog, setLiveLog] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`/api/projects/${projectId}/pipeline`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/projects/${projectId}/tasks`).then(r => r.json()).catch(() => []),
      fetch('/api/execution-log').then(r => r.json()).catch(() => []),
    ]).then(([proj, pipe, taskList, log]) => {
      setProject(proj); setPipeline(pipe); setTasks(Array.isArray(taskList) ? taskList : []);
      setLiveLog(Array.isArray(log) ? log.slice(-8).reverse() : []); setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, [projectId]);

  useEffect(() => {
    const es = new EventSource('/api/events');
    es.onmessage = (e) => { try { const ev = JSON.parse(e.data); if (ev.event === 'job_done') fetch(`/api/projects/${projectId}`).then(r => r.json()).then(setProject).catch(() => {}); } catch {} };
    return () => es.close();
  }, [projectId]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading...</p></div>;
  if (error || !project) return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}><p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Project not found</p><button onClick={() => router.push('/dashboard/projects')} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)', background: 'transparent', cursor: 'pointer' }}>← Back</button></div>;

  const pd = project.pipeline || {};
  const totalTasks = pd.development?.total || tasks.length || 0;
  const completedTasks = pd.development?.completed || tasks.filter((t: any) => t.status === 'done').length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/dashboard/projects')} style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>←</button>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: project.color || '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, color: '#fff', flexShrink: 0 }}>{project.initials || project.name?.slice(0, 2).toUpperCase()}</div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>{project.name}</h1>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#1D9E75' }}>{project.status}</span><span>·</span><span>{progress}%</span>
              {project.deployUrl && <><span>·</span><a href={project.deployUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-info)', textDecoration: 'none' }}>{project.deployUrl?.replace('https://', '')}</a></>}
            </div>
          </div>
        </div>
        <button onClick={() => setActiveTab('Chat')} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', border: '0.5px solid var(--color-border-tertiary)', background: 'transparent' }}>Open chat</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '0 24px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
        {TABS.map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '9px 16px', fontSize: 13, cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: activeTab === tab ? '2px solid var(--color-text-primary)' : '2px solid transparent', color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: activeTab === tab ? 500 : 400 }}>{tab}</button>))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'Pipeline' && <PipelineTab project={project} pipeline={pipeline} pd={pd} tasks={tasks} liveLog={liveLog} totalTasks={totalTasks} completedTasks={completedTasks} progress={progress} selectedStage={selectedStage} setSelectedStage={setSelectedStage} projectId={projectId} />}
        {activeTab === 'Tasks' && <TasksTab tasks={tasks} projectId={projectId} onUpdate={() => fetch(`/api/projects/${projectId}/tasks`).then(r => r.json()).then(setTasks).catch(() => {})} />}
        {activeTab === 'Chat' && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 24 }}><div style={{ fontSize: 32, opacity: 0.3 }}>💬</div><p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Chat for {project.name}</p><button onClick={() => router.push(`/dashboard/claude`)} style={{ marginTop: 8, padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#185FA5', color: '#fff', border: 'none' }}>Open Chat →</button></div>}
        {activeTab === 'Preview' && <PreviewTab project={project} />}
        {activeTab === 'Files' && <div style={{ padding: 24, fontSize: 13, color: 'var(--color-text-secondary)' }}>File browser coming soon. Repo path: {project.repoPath || 'not configured'}</div>}
        {activeTab === 'Settings' && <SettingsTab project={project} />}
      </div>

      {/* Control bar */}
      <div style={{ flexShrink: 0, padding: '10px 24px', borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--color-background-primary)' }}>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--color-border-tertiary)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${progress}%`, background: '#1D9E75', borderRadius: 2, transition: 'width 0.4s' }} /></div>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{completedTasks}/{totalTasks} tasks ({progress}%)</span>
        <button onClick={() => setActiveTab('Tasks')} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, cursor: 'pointer', border: '0.5px solid var(--color-border-tertiary)', background: 'transparent' }}>View tasks</button>
      </div>
    </div>
  );
}

function PipelineTab({ project, pipeline, pd, tasks, liveLog, totalTasks, completedTasks, progress, selectedStage, setSelectedStage, projectId }: any) {
  const getStatus = (id: string) => pd[id]?.status || 'pending';
  const sc = (s: string) => s === 'done' ? '#1D9E75' : s === 'active' ? '#EF9F27' : 'var(--color-text-secondary)';
  const sb = (s: string) => s === 'done' ? 'rgba(29,158,117,0.10)' : s === 'active' ? 'rgba(239,159,39,0.10)' : 'var(--color-background-secondary)';

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 8, marginBottom: 20 }}>
        {STAGES.map((stage, i) => {
          const status = getStatus(stage.id); const sel = selectedStage === stage.id; const info = pd[stage.id] || {};
          return (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div onClick={() => setSelectedStage(sel ? null : stage.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 14px', borderRadius: 12, cursor: 'pointer', minWidth: 88, border: sel ? `1px solid ${sc(status)}` : '0.5px solid var(--color-border-tertiary)', background: sel ? sb(status) : 'var(--color-background-secondary)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 19, background: sb(status), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 6 }}>{stage.emoji}</div>
                <span style={{ fontSize: 11, fontWeight: 500 }}>{stage.label}</span>
                <span style={{ fontSize: 10, color: sc(status), marginTop: 2 }}>{status === 'active' && info.total ? `${info.completed || 0}/${info.total}` : status === 'done' ? 'Done' : '—'}</span>
              </div>
              {i < STAGES.length - 1 && <div style={{ display: 'flex', alignItems: 'center', padding: '0 2px', flexShrink: 0 }}><div style={{ width: 16, height: 2, borderRadius: 1, background: getStatus(STAGES[i + 1].id) !== 'pending' || status === 'done' ? '#1D9E75' : 'var(--color-border-tertiary)' }} /><span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>›</span></div>}
            </div>
          );
        })}
      </div>

      {selectedStage && (
        <div style={{ marginBottom: 20, padding: 20, borderRadius: 12, border: `0.5px solid ${sc(getStatus(selectedStage))}40`, background: 'var(--color-background-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>{STAGES.find(s => s.id === selectedStage)?.emoji} {selectedStage.charAt(0).toUpperCase() + selectedStage.slice(1)} Stage</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${sc(getStatus(selectedStage))}15`, color: sc(getStatus(selectedStage)) }}>{getStatus(selectedStage)}</span>
              <button onClick={() => setSelectedStage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-text-secondary)' }}>✕</button>
            </div>
          </div>
          {Object.keys(pipeline[selectedStage] || {}).length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{getStatus(selectedStage) === 'pending' ? 'This stage has not started yet.' : 'No content available.'}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {Object.entries(pipeline[selectedStage] || {}).filter(([k]) => k !== 'status' && k !== 'total' && k !== 'completed').map(([key, value]: [string, any]) => (
                <div key={key}><div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 5, textTransform: 'uppercase', fontWeight: 500 }}>{key.replace(/_/g, ' ')}</div><div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{typeof value === 'object' ? JSON.stringify(value, null, 2).slice(0, 400) : String(value).slice(0, 300)}</div></div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedStage && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[{ label: 'Total tasks', value: totalTasks, color: 'var(--color-text-primary)' }, { label: 'Completed', value: completedTasks, color: '#1D9E75' }, { label: 'In progress', value: tasks.filter((t: any) => t.status === 'in_progress').length, color: '#EF9F27' }, { label: 'Planned', value: tasks.filter((t: any) => t.status === 'planned').length, color: '#185FA5' }].map(s => (
              <div key={s.label} style={{ padding: '14px 16px', borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>
                <div style={{ fontSize: 28, fontWeight: 500, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 16, borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, margin: '0 0 12px' }}>Recent activity</h3>
            <div style={{ fontFamily: 'monospace' }}>
              {liveLog.length === 0 ? <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>No recent activity</p> : liveLog.map((e: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 5, fontSize: 11 }}>
                  <span style={{ color: 'var(--color-text-secondary)', minWidth: 42, flexShrink: 0 }}>{e.timestamp ? new Date(e.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}</span>
                  <span style={{ color: e.message?.includes('OK') || e.message?.includes('complete') ? '#1D9E75' : e.message?.includes('fail') ? '#E24B4A' : 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.message?.slice(0, 70)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TasksTab({ tasks, projectId, onUpdate }: any) {
  const COLS = [{ id: 'planned', label: 'Planned', color: 'var(--color-text-secondary)' }, { id: 'in_progress', label: 'In Progress', color: '#EF9F27' }, { id: 'review', label: 'Review', color: '#185FA5' }, { id: 'done', label: 'Done', color: '#1D9E75' }];
  const pc = (p: string) => p === 'critical' ? '#E24B4A' : p === 'high' ? '#EF9F27' : p === 'medium' ? '#185FA5' : 'var(--color-text-secondary)';

  return (
    <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, alignContent: 'start' }}>
      {COLS.map(col => {
        const ct = tasks.filter((t: any) => t.status === col.id);
        return (
          <div key={col.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}><span style={{ fontSize: 12, fontWeight: 500, color: col.color }}>{col.label}</span><span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' }}>{ct.length}</span></div>
            <div style={{ height: 2, borderRadius: 1, background: col.color, marginBottom: 10, opacity: 0.4 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ct.map((task: any) => (
                <div key={task.id} style={{ padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>{task.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: pc(task.priority) }}>{task.priority}</span>
                    <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{task.department}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PreviewTab({ project }: any) {
  const url = project.deployUrl;
  const safeUrl = url?.startsWith('http') ? url : url ? `https://${url}` : null;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '6px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: 11, color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', background: 'var(--color-background-secondary)' }}>
        <span>{safeUrl || 'No deploy URL'}</span>
        {safeUrl && <a href={safeUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-info)', textDecoration: 'none' }}>Open ↗</a>}
      </div>
      {safeUrl ? <iframe src={safeUrl} style={{ flex: 1, border: 'none' }} /> : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Preview not available</p></div>}
    </div>
  );
}

function SettingsTab({ project }: any) {
  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 20 }}>Project Settings</h2>
      {[{ label: 'Project ID', value: project.id }, { label: 'Slug', value: project.slug }, { label: 'Deploy URL', value: project.deployUrl }, { label: 'Repo path', value: project.repoPath || 'Not configured' }, { label: 'GitHub', value: project.githubUrl || 'Not configured' }, { label: 'Created', value: project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—' }].map(f => (
        <div key={f.label} style={{ marginBottom: 14 }}><label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>{f.label}</label><div style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', fontFamily: f.label === 'Project ID' || f.label === 'Slug' ? 'monospace' : 'inherit' }}>{f.value}</div></div>
      ))}
    </div>
  );
}
