'use client';
import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  deployUrl?: string;
}

interface LivePreviewPanelProps {
  project: Project | null;
  previewKey?: number;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';

const VIEW_MODES: { mode: ViewMode; label: string; width: string }[] = [
  { mode: 'desktop', label: 'Desktop', width: '100%' },
  { mode: 'tablet',  label: 'Tablet',  width: '768px' },
  { mode: 'mobile',  label: 'Mobile',  width: '375px' },
];

export function LivePreviewPanel({ project, previewKey = 0 }: LivePreviewPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [iframeError, setIframeError] = useState(false);
  const [lastKey, setLastKey] = useState(previewKey);

  if (previewKey !== lastKey) {
    setLastKey(previewKey);
    setIframeError(false);
  }

  const url = project?.deployUrl;
  const safeUrl = url?.startsWith('http') ? url : url ? `https://${url}` : null;
  const currentWidth = VIEW_MODES.find(m => m.mode === viewMode)?.width || '100%';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background-tertiary)' }}>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-secondary)',
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {VIEW_MODES.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                border: '0.5px solid var(--color-border-tertiary)',
                background: viewMode === mode ? 'var(--color-background-primary)' : 'transparent',
                color: viewMode === mode ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              }}
            >{label}</button>
          ))}
        </div>

        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
          {safeUrl || 'No project selected'}
        </span>

        {safeUrl && (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--color-text-info)', textDecoration: 'none' }}
          >
            Open ↗
          </a>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto', padding: viewMode !== 'desktop' ? 16 : 0 }}>

        {!project ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <div style={{ fontSize: 32, opacity: 0.2 }}>◻</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Select a project to see the live preview
            </p>
          </div>
        ) : iframeError || !safeUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Preview not available in iframe
            </p>
            {safeUrl && (
              <a
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12, padding: '6px 14px', borderRadius: 8,
                  border: '0.5px solid var(--color-border-info)',
                  color: 'var(--color-text-info)', textDecoration: 'none',
                }}
              >
                Open {safeUrl} →
              </a>
            )}
          </div>
        ) : (
          <div style={{
            width: currentWidth,
            height: viewMode === 'desktop' ? '100%' : 'auto',
            minHeight: viewMode !== 'desktop' ? 600 : undefined,
            border: viewMode !== 'desktop' ? '0.5px solid var(--color-border-tertiary)' : 'none',
            borderRadius: viewMode !== 'desktop' ? 8 : 0,
            overflow: 'hidden',
            boxShadow: viewMode !== 'desktop' ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
          }}>
            <iframe
              key={`${project.id}-${previewKey}`}
              src={safeUrl}
              style={{ width: '100%', height: viewMode === 'desktop' ? '100%' : '600px', border: 'none' }}
              onError={() => setIframeError(true)}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              title={`${project.name} preview`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
