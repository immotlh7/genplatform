'use client';

import { useEffect, useState, useRef } from 'react';

interface LogEntry {
  time: string;
  type: 'task_done' | 'task_sent' | 'info' | 'error' | 'build';
  message: string;
}

export function ExecutionLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await fetch('/api/self-dev/logs');
        if (res.ok) {
          const data = await res.json();
          const formatted = (Array.isArray(data) ? data : data.logs || [])
            .slice(-20)
            .map((l: any) => ({
              time: new Date(l.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              type: l.type || 'info',
              message: (l.message || '').substring(0, 80),
            }));
          setLogs(formatted);
        }
      } catch {}
    };
    loadLogs();
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const typeColors: Record<string, string> = {
    task_done: 'text-green-400',
    task_sent: 'text-blue-400',
    error: 'text-red-400',
    build: 'text-yellow-400',
    info: 'text-gray-400',
  };

  return (
    <div className="bg-gray-950 rounded-lg p-3 h-48 overflow-y-auto font-mono text-[10px]">
      {logs.length === 0 ? (
        <p className="text-gray-600 text-center py-4">No activity yet</p>
      ) : (
        logs.map((log, idx) => (
          <div key={idx} className="flex gap-2 py-0.5">
            <span className="text-gray-600 flex-shrink-0">{log.time}</span>
            <span className={typeColors[log.type] || 'text-gray-400'}>{log.message}</span>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
