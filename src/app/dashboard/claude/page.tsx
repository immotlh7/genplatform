'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { LivePreviewPanel } from '@/components/chat/LivePreviewPanel';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolEvents?: ToolEvent[];
  buildStatus?: 'building' | 'success' | 'failed';
}

interface ToolEvent {
  type: string;
  tool?: string;
  input?: any;
  result?: string;
  message?: string;
  error?: string;
}

interface Project {
  id: string;
  name: string;
  deployUrl?: string;
  repoPath?: string;
  techStack?: string[];
}

interface Attachment {
  name: string;
  content: string;
}

export default function ClaudePage() {
  const [messages, setMessages] = useState<Message[]>([{
    id: '0',
    role: 'assistant',
    content: '## Hello! I am your AI Engineer.\n\nI am connected to OpenClaw Gateway — same brain, same tools, same memory as Telegram.\n\nSelect a project and tell me what you need. I can read files, fix bugs, add features, and deploy changes live.',
  }]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
          if (data.length > 0 && !selectedProject) setSelectedProject(data[0]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const es = new EventSource('/api/events');
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.event === 'build_success' || event.event === 'app_restarted') {
          setPreviewKey(k => k + 1);
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > 500000) { alert('File too large. Maximum 500KB.'); return; }
    const text = await file.text();
    setAttachment({ name: file.name, content: text });
    setInput(prev => prev || `I uploaded ${file.name} — please review it.`);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() && !attachment) return;
    if (loading) return;

    const userContent = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: attachment ? `${userContent}\n\n*Attached: ${attachment.name}*` : userContent,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachment(null);
    setLoading(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId, role: 'assistant', content: '', toolEvents: [],
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userContent,
          projectId: selectedProject?.id || null,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          attachment: attachment || null,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const toolEvents: ToolEvent[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'text') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: event.text } : m
              ));
            }
            if (event.type === 'tool_start') {
              toolEvents.push({ type: 'tool_start', tool: event.tool, input: event.input });
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, toolEvents: [...toolEvents] } : m
              ));
            }
            if (event.type === 'tool_end') {
              toolEvents.push({ type: 'tool_end', tool: event.tool, result: event.result });
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, toolEvents: [...toolEvents] } : m
              ));
            }
            if (event.type === 'building') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, buildStatus: 'building' } : m
              ));
            }
            if (event.type === 'build_complete') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, buildStatus: 'success' } : m
              ));
              setPreviewKey(k => k + 1);
            }
            if (event.type === 'build_failed' || event.type === 'build_failed_final') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, buildStatus: 'failed' } : m
              ));
            }
            if (event.type === 'error') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: `Error: ${event.message}` } : m
              ));
            }
          } catch {}
        }
      }

    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: `Connection error: ${err.message}. Check if the server is running.` }
          : m
      ));
    } finally {
      setLoading(false);
    }
  }, [input, attachment, loading, messages, selectedProject]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [sendMessage]);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Left: Chat */}
      <div style={{
        width: '42%', minWidth: 320, display: 'flex', flexDirection: 'column',
        borderRight: '0.5px solid var(--color-border-tertiary)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          background: 'var(--color-background-secondary)',
        }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProjectMenu(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)',
                background: 'transparent', cursor: 'pointer', fontSize: 12,
                color: 'var(--color-text-primary)',
              }}
            >
              <span style={{ fontSize: 10 }}>◆</span>
              {selectedProject?.name || 'Select project'}
              <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>
            </button>

            {showProjectMenu && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50,
                minWidth: 200, background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProject(p); setShowProjectMenu(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 12px',
                      fontSize: 12, cursor: 'pointer', background: 'transparent', border: 'none',
                      color: selectedProject?.id === p.id ? 'var(--color-text-info)' : 'var(--color-text-primary)',
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 4,
            background: 'rgba(29,158,117,0.15)', color: '#1D9E75',
          }}>
            OpenClaw Gateway
          </span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ marginBottom: 16 }}>
              <div style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
                  lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  background: msg.role === 'user'
                    ? 'var(--color-background-info)'
                    : 'var(--color-background-secondary)',
                }}>
                  {msg.content || (loading && msg.role === 'assistant' ? (
                    <span style={{ color: 'var(--color-text-secondary)' }}>Thinking...</span>
                  ) : '')}
                </div>
              </div>

              {msg.toolEvents && msg.toolEvents.length > 0 && (
                <div style={{ marginTop: 8, marginLeft: 4 }}>
                  {msg.toolEvents
                    .filter(e => e.type === 'tool_start')
                    .map((e, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 8px', marginBottom: 3, borderRadius: 6, fontSize: 11,
                      background: 'var(--color-background-secondary)',
                      color: 'var(--color-text-secondary)',
                    }}>
                      <span>{
                        e.tool === 'bash' ? '⚙' :
                        e.tool === 'read_file' ? '📖' :
                        e.tool === 'write_file' ? '✏️' :
                        e.tool === 'patch_file' ? '🔧' : '◦'
                      }</span>
                      <span style={{ fontFamily: 'monospace' }}>
                        {e.tool}:{' '}
                        {e.tool === 'bash' ? (e.input?.command || '').slice(0, 50) :
                         (e.input?.path || e.input || '').toString().slice(0, 50)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {msg.buildStatus && (
                <div style={{
                  marginTop: 8, marginLeft: 4, padding: '6px 10px', borderRadius: 6,
                  fontSize: 11, display: 'flex', alignItems: 'center', gap: 6,
                  background: msg.buildStatus === 'success'
                    ? 'rgba(29,158,117,0.1)'
                    : msg.buildStatus === 'failed'
                    ? 'rgba(226,75,74,0.1)'
                    : 'rgba(24,95,165,0.1)',
                  color: msg.buildStatus === 'success' ? '#1D9E75'
                    : msg.buildStatus === 'failed' ? '#E24B4A' : '#185FA5',
                }}>
                  {msg.buildStatus === 'building' && '⟳ Building...'}
                  {msg.buildStatus === 'success' && '✓ Build passed — preview updated'}
                  {msg.buildStatus === 'failed' && '✗ Build failed — attempting auto-fix'}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: 12, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
          {attachment && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
              padding: '5px 10px', borderRadius: 6, fontSize: 11,
              background: 'var(--color-background-secondary)',
              color: 'var(--color-text-secondary)',
            }}>
              <span>📎 {attachment.name}</span>
              <button
                onClick={() => setAttachment(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none',
                         cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 14 }}
              >✕</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              style={{
                padding: 8, borderRadius: 8, background: 'transparent',
                border: '0.5px solid var(--color-border-tertiary)', cursor: 'pointer',
                color: 'var(--color-text-secondary)', fontSize: 14, flexShrink: 0,
              }}
            >📎</button>

            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              accept=".txt,.md,.json,.ts,.tsx,.js,.jsx,.py,.sh,.env,.yaml,.yml,.css"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />

            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe a problem, request a change, or drop a file... (Enter to send)"
              disabled={loading}
              rows={2}
              style={{
                flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 8,
                resize: 'none', minHeight: 40, maxHeight: 120,
                border: '0.5px solid var(--color-border-tertiary)',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                opacity: loading ? 0.6 : 1,
              }}
            />

            <button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && !attachment)}
              style={{
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                border: '0.5px solid var(--color-border-tertiary)',
                background: 'transparent', color: 'var(--color-text-primary)',
                fontSize: 14, flexShrink: 0,
                opacity: loading || (!input.trim() && !attachment) ? 0.4 : 1,
              }}
            >→</button>
          </div>

          <div style={{ marginTop: 6, fontSize: 10, color: 'var(--color-text-secondary)', opacity: 0.7 }}>
            Enter to send · Shift+Enter for new line · Drop files to attach
          </div>
        </div>
      </div>

      {/* Right: Live Preview */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <LivePreviewPanel project={selectedProject} previewKey={previewKey} />
      </div>

    </div>
  );
}
