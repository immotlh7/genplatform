"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Calendar,
  TrendingUp,
  Users,
  Target,
  Zap,
  GitBranch,
  CheckCircle,
  Clock,
  BarChart3,
  Award,
  AlertTriangle
} from 'lucide-react'

export interface WeeklyReportData {
  weekStart: string
  weekEnd: string
  weekNumber: number
  sprints: Array<{
    id: string
    name: string
    status: 'completed' | 'in-progress' | 'planned'
    progress: number
    tasksCompleted: number
    tasksTotal: number
    velocity: number
  }>
  team: {
    members: number
    productivity: number
    satisfaction: number
    hoursLogged: number
  }
  development: {
    commits: number
    pullRequests: number
    deployments: number
    linesOfCode: number
    testCoverage: number
    bugs: {
      found: number
      fixed: number
      remaining: number
    }
  }
  velocity: {
    current: number
    target: number
    trend: 'up' | 'down' | 'stable'
    storyPoints: number
  }
  achievements: Array<{
    title: string
    description: string
    type: 'milestone' | 'improvement' | 'feature'
  }>
  challenges: Array<{
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    resolution: string
  }>
  nextWeek: {
    plannedSprints: Array<{
      name: string
      priority: 'high' | 'medium' | 'low'
      estimatedTasks: number
    }>
    focus: string[]
    risks: string[]
  }
}

interface WeeklyReportTemplateProps {
  data?: WeeklyReportData
  loading?: boolean
}

// Mock data for development
const MOCK_WEEKLY_DATA: WeeklyReportData = {
  weekStart: '2026-03-12',
  weekEnd: '2026-03-18',
  weekNumber: 12,
  sprints: [
    {
      id: '2C',
      name: 'Multi-Project Management',
      status: 'completed',
      progress: 100,
      tasksCompleted: 5,
      tasksTotal: 5,
      velocity: 24
    },
    {
      id: '1C',
      name: 'Commander Integration',
      status: 'completed',
      progress: 100,
      tasksCompleted: 12,
      tasksTotal: 12,
      velocity: 28
    },
    {
      id: '5A',
      name: 'Reports & Improvements',
      status: 'in-progress',
      progress: 28,
      tasksCompleted: 5,
      tasksTotal: 18,
      velocity: 15
    }
  ],
  team: {
    members: 3,
    productivity: 87,
    satisfaction: 92,
    hoursLogged: 120
  },
  development: {
    commits: 45,
    pullRequests: 12,
    deployments: 8,
    linesOfCode: 8420,
    testCoverage: 94,
    bugs: {
      found: 6,
      fixed: 8,
      remaining: 3
    }
  },
  velocity: {
    current: 67,
    target: 60,
    trend: 'up',
    storyPoints: 89
  },
  achievements: [
    {
      title: 'Project Management System Complete',
      description: 'Successfully delivered multi-project management with priority system and context switching',
      type: 'milestone'
    },
    {
      title: 'Arabic Translation Integration',
      description: 'Implemented seamless Arabic-English command translation in chat interface',
      type: 'feature'
    },
    {
      title: 'Performance Optimization',
      description: 'Improved application load time by 15% through caching improvements',
      type: 'improvement'
    }
  ],
  challenges: [
    {
      title: 'API Response Time Increase',
      description: 'Database queries showing slight performance degradation during peak usage',
      impact: 'medium',
      resolution: 'Implementing query optimization and connection pooling'
    },
    {
      title: 'Mobile Layout Edge Cases',
      description: 'Some components need refinement for smaller screen sizes',
      impact: 'low',
      resolution: 'Scheduled for next sprint cleanup tasks'
    }
  ],
  nextWeek: {
    plannedSprints: [
      {
        name: 'Complete Sprint 5A - Reports System',
        priority: 'high',
        estimatedTasks: 13
      },
      {
        name: 'Security Audit Sprint',
        priority: 'medium',
        estimatedTasks: 8
      }
    ],
    focus: [
      'Complete reports and improvements system',
      'Performance optimization',
      'Mobile experience refinement'
    ],
    risks: [
      'Potential database migration complexity',
      'Third-party API rate limiting'
    ]
  }
}

export function WeeklyReportTemplate({ data = MOCK_WEEKLY_DATA, loading = false }: WeeklyReportTemplateProps) {
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  const getSprintStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500 border-green-500/30'
      case 'in-progress': return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
      case 'planned': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      case 'stable': return '➡️'
      default: return '📊'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-500'
      case 'medium': return 'bg-yellow-500/20 text-yellow-500'
      case 'low': return 'bg-green-500/20 text-green-500'
      default: return 'bg-zinc-500/20 text-zinc-400'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/10 border-red-500/20 text-red-700'
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700'
      case 'low': return 'bg-green-500/10 border-green-500/20 text-green-700'
      default: return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-700'
    }
  }

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'milestone': return Award
      case 'improvement': return TrendingUp
      case 'feature': return Zap
      default: return CheckCircle
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  const totalTasks = data.sprints.reduce((sum, sprint) => sum + sprint.tasksTotal, 0)
  const completedTasks = data.sprints.reduce((sum, sprint) => sum + sprint.tasksCompleted, 0)
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Weekly Sprint Analysis</h1>
        <p className="text-xl text-muted-foreground">Week {data.weekNumber} • {formatDateRange(data.weekStart, data.weekEnd)}</p>
        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>Generated at {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Weekly Report</span>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Weekly Summary
          </CardTitle>
          <CardDescription>
            Key metrics and performance indicators for the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-blue-600">{data.velocity.current}</div>
              <div className="text-sm text-muted-foreground">Velocity {getTrendIcon(data.velocity.trend)}</div>
              <Progress value={(data.velocity.current / data.velocity.target) * 100} className="h-2" />
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-green-600">{completedTasks}/{totalTasks}</div>
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
              <Progress value={overallProgress} className="h-2" />
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-purple-600">{data.development.deployments}</div>
              <div className="text-sm text-muted-foreground">Deployments</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-orange-600">{data.team.productivity}%</div>
              <div className="text-sm text-muted-foreground">Team Productivity</div>
              <Progress value={data.team.productivity} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sprint Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Sprint Progress
          </CardTitle>
          <CardDescription>
            Status and progress of active sprints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.sprints.map((sprint) => (
            <div key={sprint.id} className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">Sprint {sprint.id}: {sprint.name}</h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={`text-xs ${getSprintStatusColor(sprint.status)}`}>
                      {sprint.status.replace('-', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {sprint.tasksCompleted}/{sprint.tasksTotal} tasks • Velocity: {sprint.velocity}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{sprint.progress}%</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </div>
              <Progress value={sprint.progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Team & Development Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Team Members</span>
                <span className="font-medium">{data.team.members}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Productivity</span>
                  <span className="font-medium">{data.team.productivity}%</span>
                </div>
                <Progress value={data.team.productivity} className="h-2" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Satisfaction</span>
                  <span className="font-medium">{data.team.satisfaction}%</span>
                </div>
                <Progress value={data.team.satisfaction} className="h-2" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Hours Logged</span>
                <span className="font-medium">{data.team.hoursLogged}h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GitBranch className="h-5 w-5 mr-2" />
              Development Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Commits</div>
                <div className="text-lg font-bold">{data.development.commits}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pull Requests</div>
                <div className="text-lg font-bold">{data.development.pullRequests}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Deployments</div>
                <div className="text-lg font-bold">{data.development.deployments}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Lines of Code</div>
                <div className="text-lg font-bold">{data.development.linesOfCode.toLocaleString()}</div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Test Coverage</span>
                <span className="font-medium">{data.development.testCoverage}%</span>
              </div>
              <Progress value={data.development.testCoverage} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <div className="text-red-600 font-bold">{data.development.bugs.found}</div>
                <div className="text-muted-foreground">Found</div>
              </div>
              <div>
                <div className="text-green-600 font-bold">{data.development.bugs.fixed}</div>
                <div className="text-muted-foreground">Fixed</div>
              </div>
              <div>
                <div className="text-orange-600 font-bold">{data.development.bugs.remaining}</div>
                <div className="text-muted-foreground">Remaining</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Week's Achievements
          </CardTitle>
          <CardDescription>
            Major accomplishments and milestones reached
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.achievements.map((achievement, index) => {
            const Icon = getAchievementIcon(achievement.type)
            return (
              <div key={index} className="flex items-start space-x-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                <Icon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{achievement.title}</h4>
                    <Badge variant="outline" className="text-xs capitalize">
                      {achievement.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Challenges & Resolutions */}
      {data.challenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Challenges & Resolutions
            </CardTitle>
            <CardDescription>
              Issues encountered and how they're being addressed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.challenges.map((challenge, index) => (
              <div key={index} className={`p-3 border rounded-lg ${getImpactColor(challenge.impact)}`}>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{challenge.title}</h4>
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(challenge.impact)}`}>
                      {challenge.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm opacity-80">{challenge.description}</p>
                  <div className="text-sm font-medium">
                    <span className="text-muted-foreground">Resolution: </span>
                    {challenge.resolution}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Next Week Planning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Next Week Planning
          </CardTitle>
          <CardDescription>
            Planned work and focus areas for the upcoming week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Planned Sprints</h4>
            <div className="space-y-2">
              {data.nextWeek.plannedSprints.map((sprint, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(sprint.priority)}`}>
                      {sprint.priority}
                    </Badge>
                    <span className="text-sm font-medium">{sprint.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{sprint.estimatedTasks} tasks</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Focus Areas</h4>
              <ul className="space-y-1">
                {data.nextWeek.focus.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Potential Risks</h4>
              <ul className="space-y-1">
                {data.nextWeek.risks.map((risk, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center space-x-2">
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground border-t pt-4">
        <p>Weekly Sprint Analysis generated by GenPlatform.ai Mission Control Dashboard</p>
        <p>Week {data.weekNumber} • {formatDateRange(data.weekStart, data.weekEnd)} • Next report: {new Date(new Date(data.weekEnd).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
      </div>
    </div>
  )
}