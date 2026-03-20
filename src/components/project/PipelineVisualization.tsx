'use client';

import { useState, useEffect } from 'react';

interface PipelineStage {
  id: number;
  emoji: string;
  name: string;
  color: string;
  glow: string;
  status: 'done' | 'active' | 'pending';
  tasks: number;
}

const stages: PipelineStage[] = [
  { id: 1, emoji: '💡', name: 'Idea', color: 'bg-blue-600', glow: 'shadow-blue-500/50', status: 'done', tasks: 2 },
  { id: 2, emoji: '🔬', name: 'Analysis', color: 'bg-purple-600', glow: 'shadow-purple-500/50', status: 'done', tasks: 3 },
  { id: 3, emoji: '📋', name: 'Planning', color: 'bg-teal-600', glow: 'shadow-teal-500/50', status: 'active', tasks: 5 },
  { id: 4, emoji: '💻', name: 'Development', color: 'bg-amber-600', glow: 'shadow-amber-500/50', status: 'active', tasks: 12 },
  { id: 5, emoji: '🔍', name: 'Review', color: 'bg-indigo-600', glow: 'shadow-indigo-500/50', status: 'pending', tasks: 4 },
  { id: 6, emoji: '🛡️', name: 'Security', color: 'bg-red-600', glow: 'shadow-red-500/50', status: 'pending', tasks: 3 },
  { id: 7, emoji: '✅', name: 'Deploy', color: 'bg-green-600', glow: 'shadow-green-500/50', status: 'pending', tasks: 2 },
];

interface Props {
  totalTasks?: number;
  completedTasks?: number;
  activeAgents?: number;
}

export function PipelineVisualization({ totalTasks = 31, completedTasks = 8, activeAgents = 2 }: Props) {
  const [animDot, setAnimDot] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimDot(prev => (prev + 1) % 7);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: totalTasks, color: 'text-foreground' },
          { label: 'Completed', value: completedTasks, color: 'text-green-500' },
          { label: 'In Progress', value: totalTasks - completedTasks, color: 'text-amber-500' },
          { label: 'Active Agents', value: activeAgents, color: 'text-blue-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 overflow-x-auto">
        <div className="flex items-center min-w-[700px]">
          {stages.map((stage, idx) => (
            <div key={stage.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`
                  w-16 h-16 rounded-2xl flex flex-col items-center justify-center
                  ${stage.color} shadow-lg ${stage.glow}
                  ${stage.status === 'active' ? 'animate-pulse ring-2 ring-white/30' : ''}
                  ${stage.status === 'done' ? 'opacity-90' : stage.status === 'pending' ? 'opacity-40 grayscale' : ''}
                  cursor-pointer hover:scale-110 transition-transform
                `}>
                  <span className="text-2xl">{stage.emoji}</span>
                </div>
                <div className="text-center mt-2">
                  <div className="text-xs font-medium text-gray-300">{stage.name}</div>
                  <div className="text-[10px] text-gray-500">{stage.tasks} tasks</div>
                </div>
                {stage.status === 'done' && (
                  <div className="mt-1 text-[10px] text-green-400 font-medium">✓ Done</div>
                )}
                {stage.status === 'active' && (
                  <div className="mt-1 text-[10px] text-amber-400 font-medium animate-pulse">⚡ Active</div>
                )}
              </div>
              {idx < stages.length - 1 && (
                <div className="flex-1 h-1 mx-2 bg-gray-800 rounded relative overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded transition-all duration-500 ${
                      stage.status === 'done' ? 'w-full bg-green-500' :
                      stage.status === 'active' ? 'w-1/2 bg-amber-500' :
                      'w-0'
                    }`}
                  />
                  {/* Animated dot */}
                  {animDot === idx && (
                    <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-[slideRight_0.8s_linear]" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideRight { from { left: 0; } to { left: 100%; } }
      `}</style>
    </div>
  );
}
