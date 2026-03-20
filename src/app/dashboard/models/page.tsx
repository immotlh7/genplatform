"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Brain, Zap, DollarSign, Activity } from 'lucide-react'

const models = [
  { name: 'claude-opus-4-5', provider: 'Anthropic', usage: 78, tokens: '2.4M', cost: '$12.40', status: 'active', type: 'Primary' },
  { name: 'claude-sonnet-4', provider: 'Anthropic', usage: 23, tokens: '580K', cost: '$2.90', status: 'active', type: 'Secondary' },
  { name: 'gpt-4o', provider: 'OpenAI', usage: 5, tokens: '120K', cost: '$1.80', status: 'standby', type: 'Fallback' },
  { name: 'whisper-1', provider: 'OpenAI', usage: 12, tokens: 'N/A', cost: '$0.36', status: 'active', type: 'Voice' },
]

export default function ModelsPage() {
  const [activeModel] = useState('claude-opus-4-5')

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">AI Models</h1>
        <p className="text-muted-foreground">Token usage and cost tracking</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Tokens', value: '3.1M', icon: Brain, color: 'text-blue-500' },
          { label: 'This Month Cost', value: '$17.46', icon: DollarSign, color: 'text-green-500' },
          { label: 'Active Models', value: '3', icon: Zap, color: 'text-amber-500' },
          { label: 'Requests Today', value: '847', icon: Activity, color: 'text-purple-500' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {models.map(model => (
          <Card key={model.name} className={model.name === activeModel ? 'ring-2 ring-blue-500' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {model.name}
                      {model.name === activeModel && <Badge variant="default" className="text-xs">Primary</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{model.provider} · {model.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{model.cost}</div>
                  <div className="text-xs text-muted-foreground">{model.tokens} tokens</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Usage</span>
                  <span>{model.usage}%</span>
                </div>
                <Progress value={model.usage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
