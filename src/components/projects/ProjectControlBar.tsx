'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  projectId: string;
  totalTasks?: number;
  completedTasks?: number;
  progress?: number;
}

export function ProjectControlBar({ projectId, totalTasks = 0, completedTasks = 0, progress = 0 }: Props) {
  const [contextStatus, setContextStatus] = useState({ usedK: 0, percent: 0, status: 'ok' as 'ok' | 'warning' | 'critical' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/bridge/context-status');
        if (res.ok) setContextStatus(await res.json());
      } catch {}
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-t bg-card px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
      {/* Progress bar */}
      <div className="flex-1 flex items-center gap-3">
        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="flex-shrink-0">{completedTasks}/{totalTasks} tasks ({Math.round(progress)}%)</span>
      </div>

      {/* Context usage */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span>Context:</span>
        <span className={cn(
          'font-medium',
          contextStatus.status === 'critical' ? 'text-red-400' :
          contextStatus.status === 'warning' ? 'text-amber-400' :
          'text-green-400'
        )}>
          {contextStatus.usedK}K/200K ({contextStatus.percent}%)
        </span>
        {contextStatus.status !== 'ok' && (
          <span className={cn(
            'px-1.5 py-0.5 rounded text-[10px]',
            contextStatus.status === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
          )}>
            {contextStatus.status}
          </span>
        )}
      </div>
    </div>
  );
}
