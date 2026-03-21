'use client';

import { useState, useEffect } from 'react';

interface FileEntry { name: string; type: 'file' | 'directory'; size: number; path: string; }

export function FilesViewer({ projectId }: { projectId: string }) {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadDir(currentPath); }, [currentPath, projectId]);

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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getIcon = (name: string, type: string) => {
    if (type === 'directory') return '📁';
    const ext = name.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx'].includes(ext || '')) return '🟦';
    if (['js', 'jsx'].includes(ext || '')) return '🟨';
    if (['json'].includes(ext || '')) return '📋';
    if (['md'].includes(ext || '')) return '📝';
    if (['css'].includes(ext || '')) return '🎨';
    if (['html'].includes(ext || '')) return '🌐';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return '🖼️';
    return '📄';
  };

  return (
    <div className="flex h-[500px] border rounded-lg overflow-hidden">
      {/* شجرة الملفات */}
      <div className="w-56 border-r overflow-y-auto bg-muted/20 p-1 flex-shrink-0">
        <div className="px-2 py-1.5 text-[10px] text-muted-foreground font-mono truncate border-b mb-1">{currentPath}</div>
        {currentPath !== '/' && (
          <button onClick={goUp} className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent rounded flex items-center gap-1.5">
            <span>⬆️</span> <span>..</span>
          </button>
        )}
        {loading ? <div className="px-2 py-4 text-xs text-muted-foreground text-center">جاري التحميل...</div> : 
          files.length === 0 ? <div className="px-2 py-4 text-xs text-muted-foreground text-center">لا توجد ملفات</div> : (
          files.map(file => (
            <button key={file.path} onClick={() => openFile(file)}
              className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-1.5 truncate
                ${selectedFile?.path === file.path ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}>
              <span className="flex-shrink-0">{getIcon(file.name, file.type)}</span>
              <span className="truncate flex-1">{file.name}</span>
              {file.type === 'file' && <span className="text-[9px] text-muted-foreground flex-shrink-0">{formatSize(file.size)}</span>}
            </button>
          ))
        )}
      </div>
      {/* محتوى الملف */}
      <div className="flex-1 overflow-auto">
        {selectedFile ? (
          <>
            <div className="px-3 py-2 border-b bg-muted/20 flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground truncate">{selectedFile.path}</span>
              <span className="text-[10px] text-muted-foreground">{formatSize(selectedFile.size)}</span>
            </div>
            <pre className="p-3 text-[11px] font-mono whitespace-pre-wrap leading-relaxed">{content}</pre>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground gap-2">
            <span className="text-3xl">📂</span>
            <span>اختر ملفاً لعرض محتواه</span>
          </div>
        )}
      </div>
    </div>
  );
}
