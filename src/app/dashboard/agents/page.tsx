'use client';
import { useState, useEffect } from 'react';

const STATUS_COLORS: Record<string, string> = {
  active: '#1D9E75',
  idle: 'var(--color-text-secondary, #888)',
  scheduled: '#185FA5',
  error: '#E24B4A'
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  idle: 'Idle',
  scheduled: 'Scheduled',
  error: 'Error'
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      setAgents(await res.json());
    } catch {}
    setLoading(false);
  };

  const activeCount = agents.filter(a => a.status === 'active').length;
  const idleCount = agents.filter(a => a.status === 'idle').length;

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium mb-1">AI Agents</h1>
        <p className="text-sm text-muted-foreground">
          {activeCount} active · {idleCount} idle · {agents.length} total
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total agents', value: agents.length, color: '' },
          { label: 'Active now', value: activeCount, color: 'text-green-600' },
          { label: 'Tasks done today', value: agents.reduce((s, a) => s + (a.tasksCompleted || 0), 0), color: 'text-blue-600' }
        ].map(stat => (
          <div key={stat.label} className="p-4 rounded-xl border bg-card">
            <div className={`text-3xl font-medium ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Agents list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading agents...</p>
      ) : (
        <div className="grid gap-3">
          {agents.map(agent => (
            <div key={agent.id} className={`p-4 rounded-xl border bg-card ${
              agent.status === 'active' ? 'border-green-500/30' : ''
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Status dot */}
                  <div className="mt-1" style={{
                    width: 8, height: 8, borderRadius: 4,
                    background: STATUS_COLORS[agent.status] || '#888'
                  }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{agent.emoji}</span>
                      <span className="text-sm font-medium">{agent.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded border" style={{
                        color: STATUS_COLORS[agent.status],
                        borderColor: STATUS_COLORS[agent.status],
                        background: agent.status === 'active' ? 'rgba(29,158,117,0.1)' :
                                   agent.status === 'scheduled' ? 'rgba(24,95,165,0.1)' : 'transparent'
                      }}>
                        {STATUS_LABELS[agent.status]}
                      </span>
                      {agent.isProtected && (
                        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded border">
                          system
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{agent.role}</div>
                    <div className="text-[11px] text-muted-foreground/70 mt-0.5">Scope: {agent.scope}</div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-muted-foreground">
                  {agent.tasksCompleted > 0 && <div>{agent.tasksCompleted} tasks done</div>}
                  {agent.schedule && <div className="mt-1 text-blue-600">cron: {agent.schedule}</div>}
                </div>
              </div>

              {/* Current task */}
              {agent.currentTask && (
                <div className="mt-3 px-3 py-2 rounded-lg text-xs text-green-700 dark:text-green-400"
                  style={{ background: 'rgba(29,158,117,0.08)', border: '0.5px solid rgba(29,158,117,0.2)' }}>
                  Working on: {agent.currentTask}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 rounded-xl border bg-card">
        <h3 className="text-sm font-medium mb-2">How agents work</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          All agents run through OpenClaw Gateway on port 18789 — same brain, different system prompts.
          When you send a message in Chat, the Main Agent handles it. Specialized agents are assigned
          specific tasks automatically based on their scope. The Improvement Agent runs daily at 9am
          and writes suggestions to the Improvements tab in each project.
        </p>
      </div>
    </div>
  );
}
