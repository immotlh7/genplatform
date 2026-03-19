'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Sparkles, Zap, Shield, Brain, Code, Search, FileText } from 'lucide-react'

export default function AgentsPage() {
  const departments = [
    {
      id: 'research',
      name: 'Research Analyst',
      icon: Search,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-950',
      description: 'Market analysis, competitive research, and feasibility studies',
      status: 'Coming Soon'
    },
    {
      id: 'planning',
      name: 'Architecture & Planning',
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
      description: 'System design, technical architecture, and project planning',
      status: 'Coming Soon'
    },
    {
      id: 'frontend',
      name: 'Frontend Development',
      icon: Code,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-950',
      description: 'UI/UX implementation, responsive design, and user interactions',
      status: 'Coming Soon'
    },
    {
      id: 'backend',
      name: 'Backend Development',
      icon: Zap,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-950',
      description: 'API development, database design, and server architecture',
      status: 'Coming Soon'
    },
    {
      id: 'qa',
      name: 'Quality Assurance',
      icon: Shield,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-950',
      description: 'Testing, bug tracking, and quality control',
      status: 'Coming Soon'
    },
    {
      id: 'security',
      name: 'Security',
      icon: Shield,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100 dark:bg-indigo-950',
      description: 'Security audits, vulnerability scanning, and compliance',
      status: 'Coming Soon'
    },
    {
      id: 'improvement',
      name: 'Self-Improvement',
      icon: Brain,
      color: 'text-pink-500',
      bgColor: 'bg-pink-100 dark:bg-pink-950',
      description: 'Performance optimization and continuous improvement',
      status: 'Coming Soon'
    }
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
            <Bot className="h-8 w-8 text-blue-600" />
            <span>AI Agents</span>
          </h1>
          <p className="text-muted-foreground">
            Specialized AI departments for autonomous task execution
          </p>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Coming in Phase 3
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The AI Agents system will enable autonomous task execution across 7 specialized departments.
            Each agent will have unique capabilities and work together to complete complex projects.
          </p>
        </CardContent>
      </Card>

      {/* Department Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const Icon = dept.icon
          return (
            <Card key={dept.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${dept.bgColor}`}>
                    <Icon className={`h-6 w-6 ${dept.color}`} />
                  </div>
                  <Badge variant="outline">{dept.status}</Badge>
                </div>
                <CardTitle className="text-lg mt-4">{dept.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {dept.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Features Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Planned Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Task Routing</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Automatic task assignment based on content</li>
                <li>• Smart workload balancing</li>
                <li>• Priority-based queue management</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Real-time Monitoring</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Live agent status dashboard</li>
                <li>• Task progress tracking</li>
                <li>• Performance metrics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Collaboration</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Inter-agent communication</li>
                <li>• Handoff protocols</li>
                <li>• Shared knowledge base</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Quality Control</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Automated code review</li>
                <li>• Test generation</li>
                <li>• Security scanning</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}