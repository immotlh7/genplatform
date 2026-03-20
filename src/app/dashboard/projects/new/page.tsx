"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react'

type Step = 1 | 2 | 3

interface Analysis {
  projectName: string
  tagline: string
  problemSolved: string
  coreFeatures: { name: string; description: string; priority: string }[]
  techStack: { frontend: string; backend: string; database: string }
  costEstimation: { total: string }
  timeline: { mvp: string }
  slug: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [ideaText, setIdeaText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [slug, setSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const analyzeIdea = async () => {
    if (!ideaText.trim()) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/projects/analyze-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaText })
      })
      const data = await res.json()
      if (data.analysis) {
        setAnalysis(data.analysis)
        setSlug(data.slug || data.analysis.slug || '')
        setName(data.analysis.projectName || '')
        setStep(2)
      }
    } catch {}
    setAnalyzing(false)
  }

  const createProject = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: analysis?.tagline || ideaText.substring(0, 200),
          slug,
          techStack: analysis?.techStack ? [analysis.techStack.frontend, analysis.techStack.backend, analysis.techStack.database].filter(Boolean) : [],
          ideaText,
        })
      })
      const data = await res.json()
      if (data.projectId) {
        router.push(`/dashboard/projects/${data.projectId}`)
      }
    } catch {}
    setCreating(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {([1,2,3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              s < step ? 'bg-green-500 text-white' : s === step ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {s < step ? <Check className="h-3.5 w-3.5" /> : s}
            </div>
            <span className={`text-xs ${s === step ? 'font-medium' : 'text-muted-foreground'}`}>
              {s === 1 ? 'Idea' : s === 2 ? 'Review' : 'Create'}
            </span>
            {s < 3 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: Idea input */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Describe your project idea</CardTitle>
            <p className="text-sm text-muted-foreground">Write anything — even 3 sentences. AI will extract all the details.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full h-40 bg-background border border-border rounded-lg p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Example: I want to build a platform that lets users create AI-powered chatbots for their websites without coding. It should support multiple languages and integrate with common CRMs like Salesforce and HubSpot..."
              value={ideaText}
              onChange={e => setIdeaText(e.target.value)}
            />
            <Button onClick={analyzeIdea} disabled={!ideaText.trim() || analyzing} className="w-full gap-2">
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {analyzing ? 'AI is analyzing...' : 'Analyze with AI →'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review analysis */}
      {step === 2 && analysis && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">AI Analysis Results</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Project Name</label>
                <input className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-background" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tagline</label>
                <p className="text-sm mt-1 text-muted-foreground">{analysis.tagline}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Problem Solved</label>
                <p className="text-sm mt-1">{analysis.problemSolved}</p>
              </div>
              {analysis.coreFeatures?.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Core Features</label>
                  <div className="mt-1 space-y-1">
                    {analysis.coreFeatures.slice(0,5).map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline" className="text-[10px] flex-shrink-0 mt-0.5">{f.priority}</Badge>
                        <span>{f.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analysis.techStack && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tech Stack</label>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {[analysis.techStack.frontend, analysis.techStack.backend, analysis.techStack.database].filter(Boolean).map((t,i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Cost Estimate</label>
                  <p className="text-sm font-medium">{analysis.costEstimation?.total || 'TBD'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">MVP Timeline</label>
                  <p className="text-sm font-medium">{analysis.timeline?.mvp || 'TBD'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Subdomain</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <input className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background" value={slug} onChange={e => setSlug(e.target.value.replace(/[^a-z0-9-]/g, '').toLowerCase())} placeholder="project-slug" />
                <span className="text-sm text-muted-foreground flex-shrink-0">.gen3.ai</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">URL: https://{slug || 'your-project'}.gen3.ai</p>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1 gap-1.5">
              Confirm & Create <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Create Project</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span className="font-medium">{name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">URL:</span><span className="text-blue-500">{slug}.gen3.ai</span></div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Next steps:</p>
              <ul className="space-y-1">
                <li>→ Project created in database</li>
                <li>→ Subdomain configured: {slug}.gen3.ai</li>
                <li>→ Redirect to project pipeline</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" /></Button>
              <Button onClick={createProject} disabled={creating} className="flex-1 bg-green-600 hover:bg-green-700 gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {creating ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
