'use client';

import { useEffect, useRef } from 'react';

interface Props { output: string; isRunning?: boolean; }

export function TerminalOutput({ output, isRunning }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' }); }, [output]);

  return (
    <div ref={ref} className="h-full bg-black text-green-400 font-mono text-xs p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        </div>
        <span className="text-gray-500">Terminal — /root/genplatform</span>
        {isRunning && <span className="text-amber-400 animate-pulse ml-auto">● running</span>}
      </div>
      <pre className="whitespace-pre-wrap break-all">{output || '$ ready'}</pre>
      {isRunning && <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5" />}
    </div>
  );
}
