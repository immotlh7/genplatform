'use client';

import { useState, useEffect } from 'react';

const STAGES = [
  { id: 'idea', emoji: '💡', label: 'Idea', color: 'bg-blue-500' },
  { id: 'analysis', emoji: '🔬', label: 'Analysis', color: 'bg-purple-500' },
  { id: 'planning', emoji: '📋', label: 'Planning', color: 'bg-teal-500' },
  { id: 'development', emoji: '💻', label: 'Dev', color: 'bg-amber-500' },
  { id: 'review', emoji: '🔍', label: 'Review', color: 'bg-indigo-500' },
  { id: 'security', emoji: '🛡️', label: 'Security', color: 'bg-red-500' },
  { id: 'deploy', emoji: '✅', label: 'Deploy', color: 'bg-green-500' },
];

interface Props {
  progress: number; // 0-100
  currentPhase?: string;
  tasksDone?: number;
  tasksTotal?: number;
}

export function ProjectPipeline({ progress = 0, currentPhase = 'development', tasksDone = 0, tasksTotal = 0 }: Props) {
  const [dotPos, setDotPos] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setDotPos(p => (p + 1) % STAGES.length), 900);
    return () => clearInterval(interval);
  }, []);

  const activeIdx = STAGES.findIndex(s => s.id === currentPhase) || 3;
  const progressPerStage = 100 / STAGES.length;

  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-lg font-bold">{tasksTotal}</div>
          <div className="text-xs text-muted-foreground">Total Tasks</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-lg font-bold text-green-500">{tasksDone}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2">
          <div className="text-lg font-bold text-amber-500">{tasksTotal - tasksDone}</div>
          <div className="text-xs text-muted-foreground">Remaining</div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-gray-950 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center min-w-[600px]">
          {STAGES.map((stage, idx) => {
            const isDone = idx < activeIdx;
            const isActive = idx === activeIdx;
            const isPending = idx > activeIdx;

            return (
              <div key={stage.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg
                    ${isDone ? stage.color + ' opacity-80' : ''}
                    ${isActive ? stage.color + ' ring-2 ring-white/40 animate-pulse' : ''}
                    ${isPending ? 'bg-gray-800 opacity-30 grayscale' : ''}
                    cursor-pointer hover:scale-105 transition-all`}>
                    {stage.emoji}
                  </div>
                  <span className={`text-[10px] mt-1.5 text-center w-12 ${isPending ? 'text-gray-600' : 'text-gray-300'}`}>
                    {stage.label}
                  </span>
                  {isDone && <span className="text-[9px] text-green-400 font-medium mt-0.5">✓</span>}
                  {isActive && <span className="text-[9px] text-amber-400 font-medium mt-0.5 animate-pulse">●</span>}
                </div>
                {idx < STAGES.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 bg-gray-800 rounded relative overflow-hidden">
                    <div className={`absolute inset-y-0 left-0 rounded transition-all duration-700 ${
                      isDone ? 'w-full ' + stage.color.replace('bg-', 'bg-') :
                      isActive ? 'w-1/2 bg-amber-500' : 'w-0'
                    }`} />
                    {dotPos === idx && (
                      <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"
                        style={{ left: '50%', animation: 'none' }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-amber-500 to-green-500 transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
