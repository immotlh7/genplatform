'use client';

import { useState } from 'react';
import { Monitor, Tablet, Smartphone, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewPanelProps {
  url?: string;
  isBuilding?: boolean;
}

export function PreviewPanel({ url = 'https://app.gen3.ai/dashboard', isBuilding = false }: PreviewPanelProps) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeError, setIframeError] = useState(false);

  const deviceLabel = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Controls */}
      <div className="p-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex bg-gray-700 rounded-md p-1 gap-1">
          {(['desktop','tablet','mobile'] as const).map(d => (
            <button key={d} onClick={() => setDevice(d)}
              className={`px-2 py-1 rounded text-xs transition-colors ${device===d ? 'bg-white text-gray-900 font-medium' : 'text-gray-400 hover:text-white'}`}>
              {deviceLabel[d]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7 border-gray-600"
            onClick={() => { setIframeError(false); setIframeKey(k => k+1); }} disabled={isBuilding} title="Refresh">
            <RefreshCw className={`h-3 w-3 ${isBuilding ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7 border-gray-600"
            onClick={() => window.open(url, '_blank')} title="Open in new tab">
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
        {isBuilding ? (
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-3 animate-spin">⚙️</div>
            <p className="font-medium">Building...</p>
          </div>
        ) : iframeError ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">🌐</div>
            <p className="text-gray-300 font-medium">Live Preview</p>
            <p className="text-gray-500 text-sm">iframe blocked by browser security</p>
            <Button onClick={() => window.open(url, '_blank')} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Open {url}
            </Button>
            <div className="mt-4 p-3 bg-gray-800 rounded-lg text-left text-xs text-gray-400 space-y-1">
              <p>✅ Site is running at:</p>
              <p className="text-blue-400 font-mono">{url}</p>
            </div>
          </div>
        ) : (
          <div className={`h-full w-full transition-all ${device==='tablet' ? 'max-w-[768px]' : device==='mobile' ? 'max-w-[375px]' : 'w-full'}`}>
            <iframe
              key={iframeKey}
              src={url}
              className="w-full h-full rounded-lg bg-white"
              onError={() => setIframeError(true)}
              onLoad={(e) => {
                try {
                  // Check if iframe loaded successfully
                  const iframe = e.target as HTMLIFrameElement;
                  if (!iframe.contentDocument) setIframeError(true);
                } catch {
                  setIframeError(true);
                }
              }}
              title="Live Preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        )}
      </div>
    </div>
  );
}
