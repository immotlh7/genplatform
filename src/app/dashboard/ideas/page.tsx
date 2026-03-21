"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Lightbulb, Loader2, ChevronDown, ChevronRight, Check, X, Plus, 
  Send, Rocket, Target, Users, Code, DollarSign, Shield, Layers,
  AlertTriangle, Zap, Globe, Bot, FileText
} from 'lucide-react'

interface Analysis {
  projectName: string
  tagline: string
  vision: string
  marketOpportunity?: { tam: string; sam: string; som: string; summary: string }
  coreFeatures: any[]
  suggestedAdditions: any[]
  pages: any[]
  agents: any[]
  techStack: any
  financials: any
  competitors: any[]
  phases: any[]
  risks: any[]
}

interface DiscussionMessage {
  role: 'user' | 'ai'
  content: string
  changes?: string[]
}

type PageState = 'empty' | 'analyzing' | 'ready'

export default function IdeasPage() {
  const [state, setState] = useState<PageState>('empty')
  const [ideaText, setIdeaText] = useState('')
  const [ideaId, setIdeaId] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [keptFeatures, setKeptFeatures] = useState<Set<string>>(new Set())
  const [skippedFeatures, setSkippedFeatures] = useState<Set<string>>(new Set())
  const [addedSuggestions, setAddedSuggestions] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [discussion, setDiscussion] = useState<DiscussionMessage[]>([])
  const [discussInput, setDiscussInput] = useState('')
  const [discussLoading, setDiscussLoading] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [showLaunchModal, setShowLaunchModal] = useState(false)
  const [analyzeStage, setAnalyzeStage] = useState(0)
  const discussRef = useRef<HTMLDivElement>(null)

  const toggleCollapse = (section: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(section) ? next.delete(section) : next.add(section)
      return next
    })
  }

  const isCollapsed = (section: string) => collapsed.has(section)

  // Load existing ideas on mount
  useEffect(() => {
    const loadExisting = async () => {
      try {
        const res = await fetch('/api/ideas')
        if (res.ok) {
          const ideas = await res.json()
          const latest = ideas.filter((i: any) => i.status === 'analyzed').pop()
          if (latest?.analysis?.expanded) {
            setIdeaId(latest.id)
            setIdeaText(latest.ideaText)
            setAnalysis(latest.analysis.expanded)
            setState('ready')
            // Initialize all features as kept
            const featureIds = (latest.analysis.expanded.coreFeatures || []).map((f: any) => f.id)
            setKeptFeatures(new Set(featureIds))
          }
        }
      } catch {}
    }
    loadExisting()
  }, [])

  const startAnalysis = async () => {
    if (!ideaText.trim()) return
    setState('analyzing')
    setAnalyzeStage(1)
    
    const stageTimer = setInterval(() => {
      setAnalyzeStage(prev => prev < 4 ? prev + 1 : prev)
    }, 3000)

    try {
      const newId = Date.now().toString()
      const res = await fetch('/api/ideas/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaText, ideaId: newId })
      })
      const data = await res.json()
      if (data.analysis) {
        setIdeaId(data.ideaId)
        setAnalysis(data.analysis)
        setState('ready')
        const featureIds = (data.analysis.coreFeatures || []).map((f: any) => f.id)
        setKeptFeatures(new Set(featureIds))
      } else {
        setState('empty')
        alert(data.error || 'Analysis failed')
      }
    } catch (e: any) {
      setState('empty')
      alert('Error: ' + e.message)
    } finally {
      clearInterval(stageTimer)
    }
  }

  const sendDiscussion = async () => {
    if (!discussInput.trim() || !ideaId || discussLoading) return
    const msg = discussInput.trim()
    setDiscussInput('')
    setDiscussLoading(true)
    setDiscussion(prev => [...prev, { role: 'user', content: msg }])

    try {
      const res = await fetch(`/api/ideas/${ideaId}/discuss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, currentAnalysis: analysis })
      })
      const data = await res.json()
      setDiscussion(prev => [...prev, { role: 'ai', content: data.reply || 'تم.', changes: data.changes }])
      
      // Reload analysis to get updates
      if (data.action !== 'answer_question') {
        const ideasRes = await fetch('/api/ideas')
        const ideas = await ideasRes.json()
        const updated = ideas.find((i: any) => i.id === ideaId)
        if (updated?.analysis?.expanded) {
          setAnalysis(updated.analysis.expanded)
        }
      }
    } catch {
      setDiscussion(prev => [...prev, { role: 'ai', content: '❌ خطأ في الاتصال' }])
    } finally {
      setDiscussLoading(false)
      setTimeout(() => discussRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  const launchProject = async () => {
    if (!ideaId || launching) return
    setLaunching(true)
    setShowLaunchModal(false)

    const approved = (analysis?.coreFeatures || []).filter((f: any) => keptFeatures.has(f.id))
    const skipped = (analysis?.coreFeatures || []).filter((f: any) => skippedFeatures.has(f.id))
    // Add accepted suggestions
    const acceptedSuggestions = (analysis?.suggestedAdditions || []).filter((s: any) => addedSuggestions.has(s.id))
    const allApproved = [...approved, ...acceptedSuggestions]

    try {
      const res = await fetch(`/api/ideas/${ideaId}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedFeatures: allApproved, skippedFeatures: skipped })
      })
      const data = await res.json()
      if (data.projectId) {
        window.location.href = `/dashboard/projects/${data.projectId}`
      } else {
        alert(data.error || 'Launch failed')
      }
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setLaunching(false)
    }
  }

  const approvedCount = keptFeatures.size + addedSuggestions.size

  const stages = [
    { label: 'البحث والتحليل', icon: '🔍' },
    { label: 'دراسة السوق', icon: '📊' },
    { label: 'التخطيط الاستراتيجي', icon: '🎯' },
    { label: 'توليد المواصفات', icon: '⚡' }
  ]

  // ═══════════════════════════════════════════
  // STATE: EMPTY — Show idea input
  // ═══════════════════════════════════════════
  if (state === 'empty') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div>
            <div className="text-6xl mb-4">💡</div>
            <h1 className="text-3xl font-bold mb-2">غرفة الاستراتيجية</h1>
            <p className="text-muted-foreground text-lg">اكتب فكرتك في جملة واحدة — وسنحولها لمشروع كامل</p>
          </div>
          
          <div className="space-y-4">
            <Textarea
              value={ideaText}
              onChange={e => setIdeaText(e.target.value)}
              placeholder="مثال: منصة لإدارة المشاريع بالذكاء الاصطناعي مع وكلاء متخصصين..."
              className="min-h-[120px] text-lg text-center"
              dir="auto"
            />
            <Button size="lg" className="px-8 gap-2" onClick={startAnalysis} disabled={!ideaText.trim()}>
              <Zap className="h-5 w-5" />
              تحليل الفكرة
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground pt-4">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
              <Target className="h-5 w-5 text-blue-500" />
              <span>تحليل السوق</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
              <Code className="h-5 w-5 text-green-500" />
              <span>المواصفات التقنية</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <span>التكاليف والإيرادات</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════
  // STATE: ANALYZING — Show progress
  // ═══════════════════════════════════════════
  if (state === 'analyzing') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-8">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold mb-2">جاري تحليل فكرتك...</h2>
            <p className="text-muted-foreground text-sm">"{ideaText.slice(0, 80)}..."</p>
          </div>
          
          <div className="space-y-3 text-right">
            {stages.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                i < analyzeStage ? 'bg-green-500/10 text-green-500' : 
                i === analyzeStage ? 'bg-blue-500/10 text-blue-500 animate-pulse' : 
                'bg-muted/30 text-muted-foreground'
              }`}>
                <span className="text-xl">{i < analyzeStage ? '✅' : s.icon}</span>
                <span className="font-medium">{s.label}</span>
                {i === analyzeStage && <Loader2 className="h-4 w-4 animate-spin mr-auto" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════
  // STATE: READY — Show full analysis document
  // ═══════════════════════════════════════════
  if (!analysis) return null

  const SectionHeader = ({ title, icon, section, count }: { title: string; icon: React.ReactNode; section: string; count?: number }) => (
    <button onClick={() => toggleCollapse(section)}
      className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 rounded-t-lg transition-colors">
      {isCollapsed(section) ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      {icon}
      <span className="font-bold text-lg">{title}</span>
      {count !== undefined && <Badge variant="secondary" className="mr-auto">{count}</Badge>}
    </button>
  )

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header: Project Name + Tagline */}
      <div className="text-center space-y-2 pb-6 border-b">
        <h1 className="text-4xl font-bold">{analysis.projectName}</h1>
        <p className="text-xl text-muted-foreground">{analysis.tagline}</p>
        <Badge variant="outline" className="mt-2">
          {approvedCount} ميزة معتمدة
        </Badge>
      </div>

      {/* 1. Vision */}
      <Card>
        <SectionHeader title="الرؤية" icon={<Lightbulb className="h-5 w-5 text-yellow-500" />} section="vision" />
        {!isCollapsed('vision') && (
          <CardContent className="pt-0">
            <p className="text-muted-foreground leading-relaxed" dir="auto">{analysis.vision}</p>
          </CardContent>
        )}
      </Card>

      {/* 2. Market Opportunity */}
      {analysis.marketOpportunity && (
        <Card>
          <SectionHeader title="فرصة السوق" icon={<Target className="h-5 w-5 text-blue-500" />} section="market" />
          {!isCollapsed('market') && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'TAM', value: analysis.marketOpportunity.tam, color: 'blue' },
                  { label: 'SAM', value: analysis.marketOpportunity.sam, color: 'green' },
                  { label: 'SOM', value: analysis.marketOpportunity.som, color: 'yellow' },
                ].map(m => (
                  <div key={m.label} className={`p-4 rounded-lg bg-${m.color}-500/10 border border-${m.color}-500/20 text-center`}>
                    <div className="text-xs text-muted-foreground uppercase mb-1">{m.label}</div>
                    <div className="font-bold text-lg">{m.value}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground" dir="auto">{analysis.marketOpportunity.summary}</p>
            </CardContent>
          )}
        </Card>
      )}

      {/* 3. Competitors */}
      {analysis.competitors?.length > 0 && (
        <Card>
          <SectionHeader title="المنافسون" icon={<Users className="h-5 w-5 text-red-500" />} section="competitors" count={analysis.competitors.length} />
          {!isCollapsed('competitors') && (
            <CardContent className="pt-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-2 font-medium">المنافس</th>
                    <th className="text-right p-2 font-medium">نقاط القوة</th>
                    <th className="text-right p-2 font-medium">نقاط الضعف</th>
                    <th className="text-right p-2 font-medium">ميزتنا</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.competitors.map((c: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-2 font-medium">{c.name}</td>
                      <td className="p-2 text-muted-foreground">{c.strengths}</td>
                      <td className="p-2 text-muted-foreground">{c.weaknesses}</td>
                      <td className="p-2 text-green-600 dark:text-green-400">{c.ourAdvantage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          )}
        </Card>
      )}

      {/* 4. Core Features — Interactive */}
      <Card>
        <SectionHeader title="الميزات الأساسية" icon={<Zap className="h-5 w-5 text-green-500" />} section="features" count={analysis.coreFeatures?.length} />
        {!isCollapsed('features') && (
          <CardContent className="pt-0 space-y-3">
            {(analysis.coreFeatures || []).map((f: any) => {
              const kept = keptFeatures.has(f.id)
              const skipped = skippedFeatures.has(f.id)
              return (
                <div key={f.id} className={`p-4 rounded-lg border transition-all ${
                  skipped ? 'opacity-50 bg-muted/30' : kept ? 'bg-green-500/5 border-green-500/30' : 'bg-card'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">{f.name}</span>
                        <Badge variant="outline" className="text-[10px]">{f.complexity}</Badge>
                        <Badge variant={f.impact === 'high' ? 'default' : 'secondary'} className="text-[10px]">{f.impact}</Badge>
                        {f.userAdded && <Badge className="text-[10px] bg-purple-500">مضاف</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{f.description}</p>
                      {f.userValue && <p className="text-xs text-blue-500 mt-1">💡 {f.userValue}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant={kept ? 'default' : 'outline'} className="h-8 gap-1"
                        onClick={() => {
                          const next = new Set(keptFeatures)
                          const skipNext = new Set(skippedFeatures)
                          if (kept) { next.delete(f.id) } else { next.add(f.id); skipNext.delete(f.id) }
                          setKeptFeatures(next)
                          setSkippedFeatures(skipNext)
                        }}>
                        <Check className="h-3 w-3" /> Keep
                      </Button>
                      <Button size="sm" variant={skipped ? 'destructive' : 'outline'} className="h-8 gap-1"
                        onClick={() => {
                          const next = new Set(skippedFeatures)
                          const keepNext = new Set(keptFeatures)
                          if (skipped) { next.delete(f.id) } else { next.add(f.id); keepNext.delete(f.id) }
                          setSkippedFeatures(next)
                          setKeptFeatures(keepNext)
                        }}>
                        <X className="h-3 w-3" /> Skip
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        )}
      </Card>

      {/* 5. AI Suggested Additions */}
      {analysis.suggestedAdditions?.length > 0 && (
        <Card>
          <SectionHeader title="اقتراحات الذكاء الاصطناعي" icon={<Bot className="h-5 w-5 text-purple-500" />} section="suggestions" count={analysis.suggestedAdditions.length} />
          {!isCollapsed('suggestions') && (
            <CardContent className="pt-0 space-y-3">
              {analysis.suggestedAdditions.map((s: any) => {
                const added = addedSuggestions.has(s.id)
                return (
                  <div key={s.id} className={`p-4 rounded-lg border transition-all ${
                    added ? 'bg-purple-500/5 border-purple-500/30' : 'bg-card'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{s.name}</span>
                          <Badge variant={s.impact === 'high' ? 'default' : 'secondary'} className="text-[10px]">{s.impact}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{s.description}</p>
                        {s.inspiration && <p className="text-xs text-purple-500 mt-1">🔮 {s.inspiration}</p>}
                      </div>
                      <Button size="sm" variant={added ? 'default' : 'outline'} className="h-8 gap-1 flex-shrink-0"
                        onClick={() => {
                          const next = new Set(addedSuggestions)
                          added ? next.delete(s.id) : next.add(s.id)
                          setAddedSuggestions(next)
                        }}>
                        {added ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        {added ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          )}
        </Card>
      )}

      {/* 6. Pages & Structure */}
      {analysis.pages?.length > 0 && (
        <Card>
          <SectionHeader title="الصفحات والهيكل" icon={<Globe className="h-5 w-5 text-cyan-500" />} section="pages" count={analysis.pages.length} />
          {!isCollapsed('pages') && (
            <CardContent className="pt-0 space-y-2">
              {analysis.pages.map((p: any) => (
                <div key={p.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{p.route}</code>
                    <span className="font-medium text-sm">{p.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.purpose}</p>
                  {p.wireframeDescription && (
                    <p className="text-xs text-blue-500 mt-1">🖼️ {p.wireframeDescription}</p>
                  )}
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* 7. Agents */}
      {analysis.agents?.length > 0 && (
        <Card>
          <SectionHeader title="الوكلاء" icon={<Bot className="h-5 w-5 text-orange-500" />} section="agents" count={analysis.agents.length} />
          {!isCollapsed('agents') && (
            <CardContent className="pt-0 space-y-2">
              {analysis.agents.map((a: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border bg-card flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-medium text-sm">{a.name}</span>
                    <p className="text-xs text-muted-foreground">{a.role}</p>
                    <p className="text-xs text-orange-500 mt-0.5">⚡ {a.triggers}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* 8. Tech Stack */}
      {analysis.techStack && (
        <Card>
          <SectionHeader title="البنية التقنية" icon={<Code className="h-5 w-5 text-indigo-500" />} section="techstack" />
          {!isCollapsed('techstack') && (
            <CardContent className="pt-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-2 font-medium">الطبقة</th>
                    <th className="text-right p-2 font-medium">التقنية</th>
                    <th className="text-right p-2 font-medium">السبب</th>
                    <th className="text-right p-2 font-medium">التكلفة</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysis.techStack).filter(([_, v]) => v && typeof v === 'object' && !Array.isArray(v)).map(([key, val]: [string, any]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="p-2 font-medium capitalize">{key}</td>
                      <td className="p-2">{val.framework || val.type || val.hosting || '-'}</td>
                      <td className="p-2 text-muted-foreground text-xs">{val.why || '-'}</td>
                      <td className="p-2 text-green-600">{val.cost || '-'}</td>
                    </tr>
                  ))}
                  {analysis.techStack.aiModels && Array.isArray(analysis.techStack.aiModels) && analysis.techStack.aiModels.map((m: any, i: number) => (
                    <tr key={`ai-${i}`} className="border-b last:border-0">
                      <td className="p-2 font-medium">AI: {m.name}</td>
                      <td className="p-2">{m.useCase}</td>
                      <td className="p-2 text-muted-foreground text-xs">-</td>
                      <td className="p-2 text-green-600">{m.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          )}
        </Card>
      )}

      {/* 9. Financial Projections */}
      {analysis.financials && (
        <Card>
          <SectionHeader title="التوقعات المالية" icon={<DollarSign className="h-5 w-5 text-yellow-500" />} section="financials" />
          {!isCollapsed('financials') && (
            <CardContent className="pt-0 space-y-4">
              {analysis.financials.monthlyCosts && (
                <div>
                  <h4 className="text-sm font-medium mb-2">التكاليف الشهرية</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {Object.entries(analysis.financials.monthlyCosts).map(([key, val]: [string, any]) => (
                      <div key={key} className={`p-3 rounded-lg text-center ${key === 'total' ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-muted/30'}`}>
                        <div className="text-xs text-muted-foreground capitalize mb-1">{key}</div>
                        <div className={`font-bold ${key === 'total' ? 'text-yellow-600' : ''}`}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analysis.financials.revenueModel && (
                <p className="text-sm text-muted-foreground">💰 {analysis.financials.revenueModel}</p>
              )}
              {analysis.financials.projections && (
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(analysis.financials.projections).map(([period, val]: [string, any]) => (
                    <div key={period} className="p-3 rounded-lg bg-card border text-center">
                      <div className="text-xs text-muted-foreground mb-1">{period}</div>
                      <div className="text-sm font-medium">{val}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* 10. Phases */}
      {analysis.phases?.length > 0 && (
        <Card>
          <SectionHeader title="المراحل" icon={<Layers className="h-5 w-5 text-teal-500" />} section="phases" count={analysis.phases.length} />
          {!isCollapsed('phases') && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                {analysis.phases.map((p: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg border bg-card relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-7 w-7 rounded-full bg-teal-500/10 text-teal-500 flex items-center justify-center text-sm font-bold">{i+1}</div>
                      <span className="font-bold">{p.name}</span>
                      <Badge variant="outline" className="text-[10px]">{p.duration}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{p.goal}</p>
                    {p.successMetrics && (
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(p.successMetrics) ? p.successMetrics : [p.successMetrics]).map((m: string, j: number) => (
                          <Badge key={j} variant="secondary" className="text-[10px]">📏 {m}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* 11. Risks */}
      {analysis.risks?.length > 0 && (
        <Card>
          <SectionHeader title="المخاطر" icon={<AlertTriangle className="h-5 w-5 text-red-500" />} section="risks" count={analysis.risks.length} />
          {!isCollapsed('risks') && (
            <CardContent className="pt-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-2 font-medium">المخاطرة</th>
                    <th className="text-right p-2 font-medium">الاحتمال</th>
                    <th className="text-right p-2 font-medium">التخفيف</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.risks.map((r: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-2">{r.risk}</td>
                      <td className="p-2">
                        <Badge variant={r.probability === 'high' ? 'destructive' : r.probability === 'medium' ? 'default' : 'secondary'} className="text-[10px]">
                          {r.probability}
                        </Badge>
                      </td>
                      <td className="p-2 text-muted-foreground text-xs">{r.mitigation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          )}
        </Card>
      )}

      {/* Discussion Box */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-500" />
            نقاش وتعديل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {discussion.length > 0 && (
            <div className="max-h-[300px] overflow-y-auto space-y-2 p-3 bg-muted/30 rounded-lg">
              {discussion.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-card border'
                  }`}>
                    <p dir="auto">{msg.content}</p>
                    {msg.changes && msg.changes.length > 0 && (
                      <div className="mt-2 text-xs opacity-75">
                        {msg.changes.map((c, j) => <div key={j}>✏️ {c}</div>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={discussRef} />
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={discussInput}
              onChange={e => setDiscussInput(e.target.value)}
              placeholder='اكتب تعديلاً: "أضف ميزة الدفع" أو "احذف F003"...'
              dir="auto"
              onKeyDown={e => e.key === 'Enter' && sendDiscussion()}
            />
            <Button onClick={sendDiscussion} disabled={discussLoading || !discussInput.trim()}>
              {discussLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pb-12 pt-4">
        <Button variant="outline" size="lg" onClick={() => { setState('empty'); setAnalysis(null); setIdeaId(null) }}>
          فكرة جديدة
        </Button>
        <Button size="lg" className="gap-2 px-8" onClick={() => setShowLaunchModal(true)}
          disabled={approvedCount === 0 || launching}>
          {launching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
          إطلاق المشروع ({approvedCount} ميزة)
        </Button>
      </div>

      {/* Launch Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowLaunchModal(false)}>
          <div className="bg-card rounded-xl p-6 max-w-md w-full shadow-2xl border" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-500" />
              إطلاق المشروع
            </h3>
            <div className="space-y-3 text-sm mb-6" dir="auto">
              <p className="font-medium">إنشاء مشروع "{analysis.projectName}" مع {approvedCount} ميزة:</p>
              <div className="space-y-2 text-muted-foreground">
                <p>→ توليد ملف SPEC.md كامل</p>
                <p>→ إنشاء مهام تطوير مفصلة</p>
                <p>→ توزيع المهام على الوكلاء المتخصصين</p>
                <p>→ إعداد المشروع على {analysis.projectName?.toLowerCase().replace(/\s+/g, '-')}.gen3.ai</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowLaunchModal(false)}>إلغاء</Button>
              <Button className="gap-2" onClick={launchProject} disabled={launching}>
                {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                تأكيد الإطلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
