'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Project { id: string; name: string; status: string; previewUrl?: string; }

interface Props {
  onSelect: (project: Project & { path: string }) => void;
  selected?: string;
}

export function ProjectSelector({ onSelect, selected }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string>(selected || '');

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => {
      const list = d.projects || [];
      setProjects(list);
      if (!current && list.length > 0) { setCurrent(list[0].id); onSelect({ ...list[0], path: '/root/genplatform' }); }
    }).catch(() => {});
  }, []);

  const currentProject = projects.find(p => p.id === current);

  return (
    <div className="relative">
      <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setOpen(o => !o)}>
        <FolderKanban className="h-3.5 w-3.5" />
        {currentProject?.name || 'Select Project'}
        <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 min-w-[200px]">
          {projects.map(p => (
            <button key={p.id} className="w-full text-left px-3 py-2 text-xs hover:bg-accent flex items-center gap-2"
              onClick={() => { setCurrent(p.id); onSelect({ ...p, path: '/root/genplatform' }); setOpen(false); }}>
              <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-green-400' : 'bg-gray-400'}`} />
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
