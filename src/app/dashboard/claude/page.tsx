"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, ChevronDown, Monitor, RefreshCw, ExternalLink, Mic, MicOff } from 'lucide-react'
import { LivePreviewPanel } from '@/components/chat/LivePreviewPanel'

interface Message {
  role: 'user' | 'ai'
  content: string
  type?: 'text' | 'code' | 'execution'
}

interface Project {
  id: string
  name: string
  url?: string
  path?: string
  previewUrl?: string
  deployUrl?: string
}

const DEFAULT_PROJECT: Project = {
  id: 'genplatform',
  name: 'GenPlatform.ai',
  url: 'https://app.gen3.ai/dashboard',
  path: '/root/genplatform'
}

export default function ClaudeCodePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: '## مرحباً! 👋\n\nأنا متصل بـ OpenClaw Gateway — نفس العقل، نفس الأدوات، نفس الذاكرة.\n\nاختر مشروعاً وأخبرني بما تريد.',
      type: 'text'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [attachment, setAttachment] = useState<{name:string;content:string}|null>(null)
  const [projects, setProjects] = useState<Project[]>([DEFAULT_PROJECT])
  const [selectedProject, setSelectedProject] = useState<Project>(DEFAULT_PROJECT)
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [previewMode, setPreviewMode] = useState<'preview' | 'terminal'>('preview')
  const [terminalOutput, setTerminalOutput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load projects from API
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch('/api/projects')
        const data = await res.json()
        if (data.projects && data.projects.length > 0) {
          const allProjects = [DEFAULT_PROJECT, ...data.projects.filter((p: Project) => p.id !== 'genplatform')]
          setProjects(allProjects)
        }
      } catch {
        // Keep default project
      }
    }
    loadProjects()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    let text = input.trim()
    if (attachment) {
      text += '\n\nAttached file (' + attachment.name + '):\n```\n' + attachment.content.substring(0, 3000) + '\n```'
      setAttachment(null)
    }
    if (!text || loading) return
    setInput('')
    setLoading(true)

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.filter(m => m.role === 'user' || m.role === 'ai').slice(-10).map(m => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.content
          })),
          context: {
            sessionId: `claude-${selectedProject.id}`,
            projectId: selectedProject.id
          }
        })
      })

      const data = await res.json()
      const replyText = data.reply || data.message?.content || data.response || 'تم استقبال رسالتك.'
      const aiMsg: Message = {
        role: 'ai',
        content: replyText,
        type: 'text'
      }
      setMessages(prev => [...prev, aiMsg])
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '❌ خطأ في الاتصال بـ OpenClaw Gateway. تأكد من أن الخدمة تعمل.',
        type: 'text'
      }])
    } finally {
      setLoading(false)
    }
  }

  const renderMessage = (msg: Message, idx: number) => {
    const isUser = msg.role === 'user'
    return (
      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[85%] ${isUser
          ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3'
          : 'bg-card border rounded-2xl rounded-tl-sm px-4 py-3'
        }`}>
          {isUser ? (
            <p className="text-sm">{msg.content}</p>
          ) : (
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {msg.content}
            </div>
          )}
        </div>
      </div>
    )
  }

  const projectUrl = selectedProject.url || selectedProject.previewUrl || selectedProject.deployUrl || 'https://app.gen3.ai/dashboard'

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Chat Panel (40%) */}
      <div className="w-[42%] flex flex-col border-r">
        {/* Header */}
        <div className="p-3 border-b flex items-center gap-2 bg-card flex-shrink-0">
          <div className="relative">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"
              onClick={() => setShowProjectMenu(p => !p)}>
              🔧 {selectedProject.name}
              <ChevronDown className="h-3 w-3" />
            </Button>
            {showProjectMenu && (
              <div className="absolute top-full left-0 mt-1 bg-card border rounded-lg shadow-lg z-10 min-w-[200px]">
                {projects.map(p => (
                  <button key={p.id} className={`w-full text-left px-3 py-2 text-xs hover:bg-accent ${
                    p.id === selectedProject.id ? 'bg-accent font-medium' : ''
                  }`}
                    onClick={() => { setSelectedProject(p); setShowProjectMenu(false) }}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
            OpenClaw Gateway
          </Badge>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map(renderMessage)}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-card border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-muted-foreground">جاري المعالجة...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-card flex-shrink-0">
          {attachment && (
            <div className="mb-2 flex items-center gap-2 text-xs bg-muted/30 px-3 py-1.5 rounded">
              <span>📎 {attachment.name}</span>
              <button onClick={() => setAttachment(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <label className="cursor-pointer text-muted-foreground hover:text-foreground p-2 self-end">
              <input type="file" className="hidden" accept=".ts,.tsx,.js,.json,.md,.txt,.py,image/*"
                onChange={async e => {
                  const file = e.target.files?.[0]; if (!file) return;
                  const text = await file.text();
                  setAttachment({ name: file.name, content: text });
                }} />
              📎
            </label>
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="أخبرني بالمشكلة أو الميزة التي تريدها... (Ctrl+Enter)"
              className="min-h-[52px] max-h-[120px] resize-none text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendMessage() } }}
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()} className="self-end">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Live Preview Panel (60%) */}
      <div className="flex-1">
        <LivePreviewPanel
          projectUrl={projectUrl}
          mode={previewMode}
          terminalOutput={terminalOutput}
        />
      </div>
    </div>
  )
}
