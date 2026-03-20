"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Lightbulb, CheckCircle, Loader2, MessageCircle, Clock } from 'lucide-react'
import { IdeaChatInterface } from '@/components/ideas/IdeaChatInterface'

interface Idea {
  id: string
  title: string
  stage: 'initial' | 'analyzed' | 'discuss' | 'improve' | 'approved' | 'rejected'
  createdAt: string
  projectId?: string
}

interface ApproveModal {
  open: boolean
  ideaId: string
  ideaTitle: string
  ideaDesc: string
}

const STAGE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  initial: { label: 'جديدة', color: 'bg-gray-100 text-gray-700', icon: Lightbulb },
  analyzed: { label: 'تم التحليل', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  discuss: { label: 'نقاش', color: 'bg-amber-100 text-amber-700', icon: MessageCircle },
  improve: { label: 'تحسين', color: 'bg-purple-100 text-purple-700', icon: Lightbulb },
  approved: { label: '✅ مُعتمدة', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'مرفوضة', color: 'bg-red-100 text-red-700', icon: Clock },
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null)
  const [approveModal, setApproveModal] = useState<ApproveModal>({ open: false, ideaId: '', ideaTitle: '', ideaDesc: '' })
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    loadIdeas()
  }, [])

  const loadIdeas = async () => {
    try {
      const res = await fetch('/api/ideas')
      if (res.ok) {
        const data = await res.json()
        setIdeas(data.ideas || [])
      }
    } catch {}
  }

  const createNewIdea = () => {
    const newId = `idea_${Date.now()}`
    const newIdea: Idea = {
      id: newId,
      title: 'فكرة جديدة',
      stage: 'initial',
      createdAt: new Date().toISOString()
    }
    setIdeas(prev => [newIdea, ...prev])
    setActiveIdeaId(newId)
  }

  const handleApproveRequest = (ideaId: string, title: string, desc: string) => {
    setApproveModal({ open: true, ideaId, ideaTitle: title, ideaDesc: desc })
  }

  const confirmApprove = async () => {
    setApproving(true)
    try {
      const res = await fetch('/api/ideas/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: approveModal.ideaId,
          ideaTitle: approveModal.ideaTitle,
          ideaDescription: approveModal.ideaDesc
        })
      })
      const data = await res.json()
      if (data.success) {
        setIdeas(prev => prev.map(i => i.id === approveModal.ideaId ? { ...i, stage: 'approved', projectId: data.projectId } : i))
        setApproveModal({ open: false, ideaId: '', ideaTitle: '', ideaDesc: '' })
        alert(`✅ تم إطلاق المشروع!\n\n${data.nextSteps?.join('\n')}`)
      }
    } catch {}
    setApproving(false)
  }

  const activeIdea = ideas.find(i => i.id === activeIdeaId)

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col bg-card flex-shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">💡 أفكاري ({ideas.length})</h2>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={createNewIdea}>
              <Plus className="h-3 w-3 mr-1" /> جديدة
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {ideas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs px-4">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>لا توجد أفكار بعد</p>
              <p className="mt-1">اضغط "+ جديدة" لإضافة فكرتك</p>
            </div>
          )}
          {ideas.map(idea => {
            const stageInfo = STAGE_LABELS[idea.stage] || STAGE_LABELS.initial
            return (
              <button
                key={idea.id}
                onClick={() => setActiveIdeaId(idea.id)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                  activeIdeaId === idea.id ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <div className="font-medium truncate">{idea.title}</div>
                <div className="mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${stageInfo.color}`}>
                    {stageInfo.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-hidden">
        {!activeIdeaId ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md px-8">
              <div className="text-6xl mb-4">💡</div>
              <h2 className="text-xl font-semibold mb-2">Ideas Intelligence Center</h2>
              <p className="text-muted-foreground text-sm mb-6">
                تحدث مع وكيل الأفكار — يحلل فكرتك بعمق، يقترح الميزات، التقنيات، والتكاليف.
                عند الموافقة يُنشئ المشروع مباشرة.
              </p>
              <Button onClick={createNewIdea} className="gap-2">
                <Plus className="h-4 w-4" />
                ابدأ فكرة جديدة
              </Button>
            </div>
          </div>
        ) : (
          <IdeaChatInterface
            ideaId={activeIdeaId}
            onApprove={(title, desc) => handleApproveRequest(activeIdeaId, title, desc)}
          />
        )}
      </div>

      {/* Approve Modal */}
      {approveModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 shadow-2xl">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2">✅ تأكيد إطلاق المشروع</h2>
              <p className="text-sm text-muted-foreground mb-4">
                الفكرة: <strong>{approveModal.ideaTitle}</strong>
              </p>
              <div className="space-y-2 text-sm mb-6">
                <p className="font-medium">الخطوات التالية:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>→ إرسال للتخطيط التقني</li>
                  <li>→ توليد المهام التفصيلية</li>
                  <li>→ إنشاء subdomain تلقائي</li>
                  <li>→ إضافة المشروع لقائمة Projects</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button onClick={confirmApprove} disabled={approving} className="flex-1 bg-green-600 hover:bg-green-700">
                  {approving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  إطلاق المشروع
                </Button>
                <Button variant="outline" onClick={() => setApproveModal({ open: false, ideaId: '', ideaTitle: '', ideaDesc: '' })}>
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
