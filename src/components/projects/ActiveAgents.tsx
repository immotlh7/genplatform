'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface Agent {
  name: string;
  department: string;
  status: 'active' | 'idle' | 'building';
  currentTask?: string;
}

export function ActiveAgents({ projectId }: { projectId: string }) {
  const [agents, setAgents] = useState<Agent[]>([
    { name: 'Frontend Dev', department: '💻', status: 'active', currentTask: 'Building UI components' },
    { name: 'Backend Dev', department: '⚙️', status: 'idle' },
    { name: 'QA', department: '🔍', status: 'idle' },
    { name: 'Security', department: '🛡️', status: 'idle' },
  ]);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await fetch('/api/bridge/agents');
        if (res.ok) {
          const data = await res.json();
          if (data.departments?.length > 0) {
            setAgents(data.departments.slice(0, 4).map((d: any) => ({
              name: d.name,
              department: d.icon || '🤖',
              status: d.status === 'active' ? 'active' : 'idle',
              currentTask: d.currentTask,
            })));
          }
        }
      } catch {}
    };
    loadAgents();
    const interval = setInterval(loadAgents, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2">
      {agents.map((agent, idx) => (
        <div key={idx} className={`flex items-start gap-3 p-2.5 rounded-lg border ${
          agent.status === 'active' ? 'border-green-500/30 bg-green-500/5' : 'border-transparent bg-muted/20'
        }`}>
          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
            agent.status === 'active' ? 'bg-green-400 animate-pulse' :
            agent.status === 'building' ? 'bg-amber-400 animate-pulse' : 'bg-gray-500'
          }`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium">{agent.department} {agent.name}</span>
              {agent.status === 'active' && (
                <Badge className="text-[9px] h-4 px-1 bg-green-500/20 text-green-400 border-0">active</Badge>
              )}
            </div>
            {agent.currentTask && (
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{agent.currentTask}</p>
            )}
            {agent.status === 'idle' && (
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">idle</p>
            )}
          </div>
          {agent.status === 'building' && <Loader2 className="h-3 w-3 animate-spin text-amber-400 flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}
