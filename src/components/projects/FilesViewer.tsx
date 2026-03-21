'use client';

import { useState, useEffect } from 'react';

interface FileEntry { name: string; type: 'file' | 'directory'; size: number; path: string; }

export function FilesViewer({ projectId }: { projectId: string }) {
  const [currentPath, setCurrentPath] = useState('/src');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadDir(currentPath); }, [currentPath]);

  const loadDir = async (p: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/files?path=${encodeURIComponent(p)}`);
      if (res.ok) { const d = await res.json(); setFiles(d.files || []); }
    } catch {} finally { setLoading(false); }
  };

  const openFile = async (file: FileEntry) => {
    if (file.type === 'directory') { setCurrentPath(file.path); setSelectedFile(null); return; }
    setSelectedFile(file);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: file.path })
      });
      if (res.ok) { const d = await res.json(); setContent(d.content || 'Could not read'); }
    } catch { setContent('Error reading file'); }
  };

  const goUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath('/' + parts.join('/') || '/');
  };

  return (
    <div className="flex h-[500px] border rounded-lg overflow-hidden">
      {/* File tree */}
      <div className="w-56 border-r overflow-y-auto bg-muted/20 p-1 flex-shrink-0">
        <div className="px-2 py-1 text-[10px] text-muted-foreground font-mono truncate">{currentPath}</div>
        {currentPath !== '/' && (
          <button onClick={goUp} className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent rounded">← ..</button>
        )}
        {loading ? <div className="px-2 py-4 text-xs text-muted-foreground">Loading...</div> : (
          files.map(file => (
            <button key={file.path} onClick={() => openFile(file)}
              className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-1.5 truncate
                ${selectedFile?.path === file.path ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}>
              <span className="flex-shrink-0">{file.type === 'directory' ? '📁' : '📄'}</span>
              <span className="truncate">{file.name}</span>
            </button>
          ))
        )}
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {selectedFile ? (
          <>
            <div className="px-3 py-2 border-b bg-muted/20 text-[10px] font-mono text-muted-foreground">{selectedFile.path}</div>
            <pre className="p-3 text-[11px] font-mono whitespace-pre-wrap leading-relaxed">{content}</pre>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Select a file to view</div>
        )}
      </div>
    </div>
  );
}
