'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string; name: string; slug: string; description: string; status: string;
  progress: number; color: string; initials: string; techStack: string[];
  deployUrl: string; pipeline: any; taskSummary?: { total: number; completed: number; inProgress: number }; createdAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(data => { if (Array.isArray(data)) setProjects(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p => { if (filter === 'active') return p.status === 'active'; if (filter === 'completed') return p.status === 'completed'; return true; });

  const getPipelineStage = (project: Project): string => {
    const p = project.pipeline || {};
    const stages = ['deploy', 'security', 'review', 'development', 'planning', 'analysis', 'idea'];
    for (const s of stages) { if (p[s]?.status === 'active') return s; } return 'idea';
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading projects...</p></div>;

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 4px' }}>Projects</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => router.push('/dashboard/ideas')} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#7F77DD', color: '#fff', border: 'none' }}>+ New project</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {(['all', 'active', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '0.5px solid var(--color-border-tertiary)', background: filter === f ? 'var(--color-background-secondary)' : 'transparent', color: filter === f ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: filter === f ? 500 : 400, textTransform: 'capitalize' }}>
            {f} {f === 'all' ? `(${projects.length})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>◻</div>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>No projects yet</p>
          <button onClick={() => router.push('/dashboard/ideas')} style={{ marginTop: 12, padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: '#7F77DD', color: '#fff', border: 'none' }}>Create your first project</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map(project => {
            const total = project.taskSummary?.total || project.pipeline?.development?.total || 0;
            const completed = project.taskSummary?.completed || project.pipeline?.development?.completed || 0;
            const progress = total > 0 ? Math.round((completed / total) * 100) : project.progress || 0;
            return (
              <div key={project.id} onClick={() => router.push(`/dashboard/projects/${project.id}`)} style={{ padding: '16px 20px', borderRadius: 12, cursor: 'pointer', border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', minWidth: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: project.color || '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: '#fff' }}>
                    {project.initials || project.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{project.name}</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: project.status === 'active' ? 'rgba(29,158,117,0.12)' : 'var(--color-background-primary)', color: project.status === 'active' ? '#1D9E75' : 'var(--color-text-secondary)' }}>{project.status}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.description}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {(project.techStack || []).slice(0, 4).map(t => (<span key={t} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--color-background-primary)', color: 'var(--color-text-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>{t}</span>))}
                      <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginLeft: 4 }}>Phase: {getPipelineStage(project)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 120 }}>
                  <div style={{ fontSize: 22, fontWeight: 500, color: progress > 0 ? '#1D9E75' : 'var(--color-text-secondary)', marginBottom: 4 }}>{progress}%</div>
                  <div style={{ height: 3, width: 100, borderRadius: 2, background: 'var(--color-border-tertiary)', overflow: 'hidden', marginLeft: 'auto' }}><div style={{ height: '100%', width: `${progress}%`, background: '#1D9E75', borderRadius: 2 }} /></div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>{completed}/{total} tasks</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
