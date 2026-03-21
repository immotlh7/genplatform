'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  projects: number;
  tasks: number;
  completedTasks: number;
  activeAgents: number;
}

interface LogEntry {
  timestamp: string;
  message: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ projects: 0, tasks: 0, completedTasks: 0, activeAgents: 0 });
  const [recentLog, setRecentLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()).catch(() => []),
      fetch('/api/tasks').then(r => r.json()).catch(() => []),
      fetch('/api/agents').then(r => r.json()).catch(() => []),
      fetch('/api/execution-log').then(r => r.json()).catch(() => []),
    ]).then(([projects, tasks, agents, log]) => {
      const p = Array.isArray(projects) ? projects : [];
      const t = Array.isArray(tasks) ? tasks : [];
      const a = Array.isArray(agents) ? agents : [];
      const l = Array.isArray(log) ? log : [];
      setStats({
        projects: p.length,
        tasks: t.length,
        completedTasks: t.filter((x: any) => x.status === 'done').length,
        activeAgents: a.filter((x: any) => x.status === 'active').length,
      });
      setRecentLog(l.slice(-8).reverse());
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading...</p>
    </div>
  );

  const STATS = [
    { label: 'Projects', value: stats.projects, color: '#7F77DD', link: '/dashboard/projects' },
    { label: 'Total tasks', value: stats.tasks, color: 'var(--color-text-primary)', link: '/dashboard/projects' },
    { label: 'Completed', value: stats.completedTasks, color: '#1D9E75', link: '/dashboard/projects' },
    { label: 'Active agents', value: stats.activeAgents, color: '#185FA5', link: '/dashboard/agents' },
  ];

  const ACTIONS = [
    { label: '+ New idea', desc: 'Turn your idea into a full project', link: '/dashboard/ideas', color: '#7F77DD' },
    { label: '+ New project', desc: 'Start a project directly', link: '/dashboard/projects', color: '#1D9E75' },
    { label: 'Open chat', desc: 'Talk to your AI engineer', link: '/dashboard/claude', color: '#185FA5' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 4px' }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {STATS.map(s => (
          <div key={s.label} onClick={() => router.push(s.link)} style={{
            padding: '16px 20px', borderRadius: 12, cursor: 'pointer',
            border: '0.5px solid var(--color-border-tertiary)',
            background: 'var(--color-background-secondary)',
          }}>
            <div style={{ fontSize: 32, fontWeight: 500, color: s.color, marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {ACTIONS.map(a => (
          <div key={a.label} onClick={() => router.push(a.link)} style={{
            padding: 16, borderRadius: 12, cursor: 'pointer',
            border: `0.5px solid ${a.color}33`,
            background: `${a.color}0A`,
          }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: a.color, marginBottom: 4 }}>{a.label}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{a.desc}</div>
          </div>
        ))}
      </div>

      {recentLog.length > 0 && (
        <div style={{ padding: 16, borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, margin: '0 0 12px' }}>Recent activity</h3>
          <div style={{ fontFamily: 'monospace' }}>
            {recentLog.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: 'var(--color-text-secondary)', minWidth: 50 }}>
                  {entry.timestamp
                    ? new Date(entry.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })
                    : '--:--'}
                </span>
                <span style={{
                  color: entry.message?.includes('completed') || entry.message?.includes('OK') ? '#1D9E75' :
                         entry.message?.includes('failed') || entry.message?.includes('Error') ? '#E24B4A' :
                         entry.message?.includes('started') ? '#185FA5' :
                         'var(--color-text-primary)'
                }}>
                  {entry.message?.slice(0, 90)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
