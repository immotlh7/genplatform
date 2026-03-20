"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, BookOpen, HelpCircle, FileText, MessageCircle } from 'lucide-react'

const faqs = [
  { q: 'How do I create a new project?', a: 'Go to Projects page and click "New Project". Fill in the name and description, then click Create.' },
  { q: 'How does the Self-Dev system work?', a: 'Upload a task file, click Rewrite on each message to break tasks into micro-tasks, then click OK to approve. The system executes them automatically.' },
  { q: 'How do I connect to OpenClaw?', a: 'OpenClaw runs locally on your server. The Bridge API connects the dashboard to OpenClaw on port 3001.' },
  { q: 'What is the Command Center?', a: 'A control panel to restart the gateway, check system health, view logs, and run maintenance commands.' },
  { q: 'How do I add skills to OpenClaw?', a: 'Skills are managed through OpenClaw directly. Use the Command Center → Update All Skills, or install via openclaw CLI.' },
]

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground">Everything you need to use GenPlatform.ai</p>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-blue-500" /> Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { step: 1, title: 'Login', desc: 'Access the dashboard at app.gen3.ai with your credentials' },
              { step: 2, title: 'Dashboard', desc: 'View real-time system status, projects, and tasks overview' },
              { step: 3, title: 'Create Project', desc: 'Go to Projects → New Project to start tracking your work' },
              { step: 4, title: 'Start Building', desc: 'Use Self-Dev to assign AI agents to your development tasks' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">{item.step}</div>
                <div>
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-amber-500" /> FAQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border rounded-lg overflow-hidden">
              <button className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                <span className="text-sm font-medium">{faq.q}</span>
                {openFaq === idx ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
              </button>
              {openFaq === idx && <div className="px-4 pb-3 text-sm text-muted-foreground">{faq.a}</div>}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Documentation + Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-purple-500" /> Documentation</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Full documentation for all features.</p>
            <a href="https://docs.openclaw.ai" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">→ OpenClaw Docs</a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageCircle className="h-4 w-4 text-green-500" /> Contact</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Contact the platform owner for support.</p>
            <a href="https://t.me/medtlh1" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">→ Telegram @medtlh1</a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
