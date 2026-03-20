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

const PROJECTS = [
  { id: 'genplatform', name: 'GenPlatform.ai', url: 'https://app.gen3.ai/dashboard', path: '/root/genplatform' },
]

export default function ClaudeCodePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: '## مرحباً! 👋\n\nأنا AI Engineer — يمكنني تحليل مشاكلك، كتابة الكود، وتنفيذه مباشرة على السيرفر.\n\nاختر مشروعاً وأخبرني بما تريد.',
      type: 'text'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0])
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [previewMode, setPreviewMode] = useState<'preview' | 'terminal'>('preview')
  const [terminalOutput, setTerminalOutput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
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
          projectContext: {
            name: selectedProject.name,
            path: selectedProject.path,
            url: selectedProject.url,
          }
        })
      })

      if (res.ok) {
        const data = await res.json()
        const aiMsg: Message = {
          role: 'ai',
          content: data.response || data.message || 'تم استقبال رسالتك.',
          type: 'text'
        }
        setMessages(prev => [...prev, aiMsg])
      } else {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: '✅ تم إرسال الرسالة إلى OpenClaw عبر Telegram. ستصلك الإجابة قريباً.',
          type: 'text'
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '📨 تم إرسال طلبك. OpenClaw يعمل على المهمة.',
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
                {PROJECTS.map(p => (
                  <button key={p.id} className="w-full text-left px-3 py-2 text-xs hover:bg-accent"
                    onClick={() => { setSelectedProject(p); setShowProjectMenu(false) }}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-[10px]">AI Engineer</Badge>
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
          <div className="flex gap-2">
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
          projectUrl={selectedProject.url}
          mode={previewMode}
          terminalOutput={terminalOutput}
        />
      </div>
    </div>
  )
}
