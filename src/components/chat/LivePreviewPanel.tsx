'use client';

import { useState } from 'react';
import { ExternalLink, Monitor, Smartphone, Tablet, Terminal, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  projectUrl?: string;
  mode?: 'preview' | 'terminal' | 'diff';
  terminalOutput?: string;
  isBuilding?: boolean;
}

function safeUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

export function LivePreviewPanel({ projectUrl, mode = 'preview', terminalOutput = '', isBuilding = false }: Props) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [key, setKey] = useState(0);
  const [iframeError, setIframeError] = useState(false);
  const resolvedUrl = safeUrl(projectUrl);

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l">
      {/* Controls */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between bg-gray-800">
        <div className="flex gap-1 bg-gray-700 rounded-md p-1">
          {(['desktop','tablet','mobile'] as const).map(d => (
            <button key={d} onClick={() => setDevice(d)}
              className={`p-1.5 rounded text-xs transition-colors ${device===d ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'}`}>
              {d === 'desktop' ? <Monitor className="h-3.5 w-3.5" /> : d === 'tablet' ? <Tablet className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-400 truncate max-w-[150px]">{projectUrl || 'No project'}</div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => setKey(k=>k+1)}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {projectUrl && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => window.open(projectUrl,'_blank')}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isBuilding ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3 animate-spin">⚙️</div>
              <p className="text-gray-300 font-medium">Building...</p>
              <p className="text-gray-500 text-sm mt-1">npm run build</p>
            </div>
          </div>
        ) : mode === 'terminal' || terminalOutput ? (
          <div className="h-full p-4 font-mono text-xs text-green-400 overflow-y-auto bg-black">
            <pre className="whitespace-pre-wrap">{terminalOutput || '$ waiting for commands...'}</pre>
          </div>
        ) : projectUrl ? (
          <div className={`h-full flex items-center justify-center transition-all ${
            device === 'tablet' ? 'px-8' : device === 'mobile' ? 'px-16' : ''
          }`}>
            {iframeError || !resolvedUrl ? (
              <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground gap-3">
                <div className="text-4xl">🌐</div>
                <p>{resolvedUrl ? 'Preview unavailable in iframe' : 'Select a project to see live preview'}</p>
                {resolvedUrl && <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs">{resolvedUrl} ↗</a>}
              </div>
            ) : (
              <div className="w-full h-full bg-white rounded overflow-hidden">
                <iframe key={key} src={resolvedUrl} className="w-full h-full" title="Preview"
                  onError={() => setIframeError(true)}
                  onLoad={() => setIframeError(false)} />
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center px-6">
            <div>
              <div className="text-5xl mb-3">🌐</div>
              <p className="text-gray-400 text-sm">Select a project to see live preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
