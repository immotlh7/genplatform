"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Star,
  Award,
  Zap,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  FileText,
  Database,
  Shield,
  Lightbulb,
  Flag
} from 'lucide-react'

interface WeeklyReportData {
  reportDate: string
  weekRange: {
    start: string
    end: string
  }
  generatedAt: string
  reportId: string
  
  // Executive Summary
  summary: {
    totalProjectsTracked: number
    tasksCompleted: number
    teamProductivity: number
    overallProgress: number
    weeklyGoalsAchieved: number
    weeklyGoalsTotal: number
  }
  
  // Team Performance
  teamPerformance: {
    totalMembers: number
    activeMembers: number
    averageHoursWorked: number
    productivityScore: number
    collaborationIndex: number
    topPerformers: Array<{
      name: string
      role: string
      tasksCompleted: number
      hoursWorked: number
      contributionScore: number
    }>
    teamInsights: string[]
  }
  
  // Project Progress
  projectProgress: {
    projects: Array<{
      name: string
      status: 'on-track' | 'at-risk' | 'delayed' | 'completed'
      progress: number
      tasksCompleted: number
      totalTasks: number
      weeklyProgress: number
      priority: 'high' | 'medium' | 'low'
      nextMilestone: string
      daysUntilDeadline: number
    }>
    milestones: Array<{
      project: string
      milestone: string
      completedDate: string
      impact: 'major' | 'moderate' | 'minor'
    }>
  }
  
  // Sprint & Goals Analysis
  sprintAnalysis: {
    currentSprint: string
    sprintProgress: number
    sprintGoals: Array<{
      goal: string
      status: 'completed' | 'in-progress' | 'at-risk' | 'blocked'
      progress: number
      assignee: string
    }>
    sprintRetro: {
      achievements: string[]
      challenges: string[]
      improvements: string[]
    }
  }
  
  // Metrics & KPIs
  metrics: {
    velocity: {
      current: number
      previous: number
      trend: 'up' | 'down' | 'stable'
    }
    quality: {
      bugRate: number
      codeReviewTime: number
      testCoverage: number
      customerSatisfaction: number
    }
    efficiency: {
      cycleTime: number
      leadTime: number
      throughput: number
      burndownRate: number
    }
  }
  
  // Trend Analysis
  trends: {
    productivity: {
      change: number
      direction: 'up' | 'down' | 'stable'
      insight: string
    }
    codeQuality: {
      change: number
      direction: 'up' | 'down' | 'stable'
      insight: string
    }
    teamSatisfaction: {
      change: number
      direction: 'up' | 'down' | 'stable'
      insight: string
    }
    deliverySpeed: {
      change: number
      direction: 'up' | 'down' | 'stable'
      insight: string
    }
  }
  
  // Risks & Blockers
  risks: Array<{
    type: 'technical' | 'resource' | 'timeline' | 'external'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    impact: string
    mitigation: string
    owner: string
  }>
  
  // Weekly Highlights
  highlights: Array<{
    type: 'achievement' | 'milestone' | 'innovation' | 'improvement'
    title: string
    description: string
    impact: string
    contributors: string[]
  }>
  
  // Next Week Planning
  nextWeek: {
    priorities: string[]
    plannedTasks: number
    expectedDeliverables: string[]
    potentialRisks: string[]
    resourceNeeds: string[]
  }
}

interface WeeklyReportTemplateProps {
  data: WeeklyReportData
  className?: string
}

export function WeeklyReportTemplate({ data, className = "" }: WeeklyReportTemplateProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatWeekRange = () => {
    const start = formatDate(data.weekRange.start)
    const end = formatDate(data.weekRange.end)
    return `${start} - ${end}`
  }

  const getTrendIcon = (direction: string, size = "h-4 w-4") => {
    switch (direction) {
      case 'up': return <TrendingUp className={`${size} text-green-600`} />
      case 'down': return <TrendingDown className={`${size} text-red-600`} />
      default: return <Minus className={`${size} text-gray-600`} />
    }
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      'on-track': { label: 'On Track', className: 'bg-green-50 text-green-700 border-green-200' },
      'at-risk': { label: 'At Risk', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      'delayed': { label: 'Delayed', className: 'bg-red-50 text-red-700 border-red-200' },
      'completed': { label: 'Completed', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      'in-progress': { label: 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      'blocked': { label: 'Blocked', className: 'bg-red-50 text-red-700 border-red-200' }
    }
    const config = configs[status as keyof typeof configs] || configs['in-progress']
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getHighlightIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Award className="h-5 w-5 text-yellow-600" />
      case 'milestone': return <Flag className="h-5 w-5 text-blue-600" />
      case 'innovation': return <Lightbulb className="h-5 w-5 text-purple-600" />
      case 'improvement': return <TrendingUp className="h-5 w-5 text-green-600" />
      default: return <Star className="h-5 w-5 text-blue-600" />
    }
  }

  return (
    <div className={`space-y-6 max-w-5xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center space-x-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <span>Weekly Performance Report</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          {formatWeekRange()}
        </p>
        <p className="text-sm text-muted-foreground">
          Generated at {new Date(data.generatedAt).toLocaleString()} • Report ID: {data.reportId}
        </p>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Executive Summary</span>
          </CardTitle>
          <CardDescription>
            High-level overview of weekly performance and achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.summary.totalProjectsTracked}
              </div>
              <p className="text-sm text-muted-foreground">Projects Tracked</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.summary.tasksCompleted}
              </div>
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {data.summary.teamProductivity}%
              </div>
              <p className="text-sm text-muted-foreground">Team Productivity</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {data.summary.overallProgress}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">
                {data.summary.weeklyGoalsAchieved}
              </div>
              <p className="text-sm text-muted-foreground">Goals Achieved</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {Math.round((data.summary.weeklyGoalsAchieved / data.summary.weeklyGoalsTotal) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Goal Success Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team Performance</span>
          </CardTitle>
          <CardDescription>
            Team productivity metrics and individual contributions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.teamPerformance.totalMembers}</div>
              <p className="text-xs text-muted-foreground">Total Members</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.teamPerformance.activeMembers}</div>
              <p className="text-xs text-muted-foreground">Active This Week</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.teamPerformance.averageHoursWorked}h</div>
              <p className="text-xs text-muted-foreground">Avg Hours/Member</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.teamPerformance.productivityScore}%</div>
              <p className="text-xs text-muted-foreground">Productivity Score</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">{data.teamPerformance.collaborationIndex}%</div>
              <p className="text-xs text-muted-foreground">Collaboration Index</p>
            </div>
          </div>

          <Separator />

          {/* Top Performers */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center space-x-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <span>Top Performers This Week</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.teamPerformance.topPerformers.map((performer, index) => (
                <div key={index} className="p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {performer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <h5 className="font-medium text-sm">{performer.name}</h5>
                      <p className="text-xs text-muted-foreground">{performer.role}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Tasks:</span>
                      <span className="font-medium">{performer.tasksCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hours:</span>
                      <span className="font-medium">{performer.hoursWorked}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Score:</span>
                      <span className="font-medium text-green-600">{performer.contributionScore}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Insights */}
          <div className="space-y-2">
            <h4 className="font-medium">Team Insights</h4>
            <div className="space-y-1">
              {data.teamPerformance.teamInsights.map((insight, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Project Progress</span>
          </CardTitle>
          <CardDescription>
            Detailed progress tracking across all active projects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.projectProgress.projects.map((project, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h4 className="font-semibold">{project.name}</h4>
                  {getStatusBadge(project.status)}
                  <span className={`text-xs font-medium ${getPriorityColor(project.priority)}`}>
                    {project.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{project.progress}% Complete</div>
                  <div className="text-xs text-muted-foreground">
                    {project.tasksCompleted}/{project.totalTasks} tasks
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
                
                <div className="flex items-center justify-between text-sm">
                  <span>Weekly Progress</span>
                  <span className="flex items-center space-x-1">
                    <span>{project.weeklyProgress > 0 ? '+' : ''}{project.weeklyProgress}%</span>
                    {getTrendIcon(project.weeklyProgress > 0 ? 'up' : project.weeklyProgress < 0 ? 'down' : 'stable', "h-3 w-3")}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Next Milestone:</span> {project.nextMilestone}
                </div>
                <div>
                  <span className="font-medium">Days to Deadline:</span> {project.daysUntilDeadline}
                </div>
              </div>
            </div>
          ))}

          {/* Recent Milestones */}
          {data.projectProgress.milestones.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <Flag className="h-4 w-4 text-blue-500" />
                  <span>Milestones Achieved This Week</span>
                </h4>
                {data.projectProgress.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-blue-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{milestone.milestone}</div>
                      <div className="text-xs text-muted-foreground">
                        {milestone.project} • {formatDate(milestone.completedDate)}
                      </div>
                    </div>
                    <Badge variant="outline" className={
                      milestone.impact === 'major' ? 'border-green-500 text-green-700' :
                      milestone.impact === 'moderate' ? 'border-blue-500 text-blue-700' :
                      'border-gray-500 text-gray-700'
                    }>
                      {milestone.impact}
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sprint Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Sprint Analysis</span>
          </CardTitle>
          <CardDescription>
            Current sprint progress and retrospective insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{data.sprintAnalysis.currentSprint}</h4>
            <div className="text-right">
              <div className="font-bold text-lg">{data.sprintAnalysis.sprintProgress}%</div>
              <div className="text-xs text-muted-foreground">Sprint Progress</div>
            </div>
          </div>
          
          <Progress value={data.sprintAnalysis.sprintProgress} className="h-3" />

          {/* Sprint Goals */}
          <div className="space-y-2">
            <h5 className="font-medium">Sprint Goals</h5>
            {data.sprintAnalysis.sprintGoals.map((goal, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-3">
                  {getStatusBadge(goal.status)}
                  <span className="text-sm">{goal.goal}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">{goal.assignee}</span>
                  <span className="text-sm font-medium">{goal.progress}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Retrospective */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h5 className="font-medium text-green-600 flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Achievements</span>
              </h5>
              <ul className="space-y-1">
                {data.sprintAnalysis.sprintRetro.achievements.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start space-x-1">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-red-600 flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4" />
                <span>Challenges</span>
              </h5>
              <ul className="space-y-1">
                {data.sprintAnalysis.sprintRetro.challenges.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start space-x-1">
                    <span className="text-red-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-blue-600 flex items-center space-x-1">
                <Lightbulb className="h-4 w-4" />
                <span>Improvements</span>
              </h5>
              <ul className="space-y-1">
                {data.sprintAnalysis.sprintRetro.improvements.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start space-x-1">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics & Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Metrics & Trends</span>
          </CardTitle>
          <CardDescription>
            Key performance indicators and trend analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Velocity and Quality Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Velocity & Efficiency</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Velocity</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{data.metrics.velocity.current}</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(data.metrics.velocity.trend, "h-3 w-3")}
                      <span className={`text-xs ${getTrendColor(data.metrics.velocity.trend)}`}>
                        {data.metrics.velocity.previous}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cycle Time</span>
                  <span className="font-medium">{data.metrics.efficiency.cycleTime}h</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Throughput</span>
                  <span className="font-medium">{data.metrics.efficiency.throughput}/week</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Quality Metrics</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bug Rate</span>
                  <span className="font-medium">{data.metrics.quality.bugRate}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Code Review Time</span>
                  <span className="font-medium">{data.metrics.quality.codeReviewTime}h</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Test Coverage</span>
                  <span className="font-medium">{data.metrics.quality.testCoverage}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium">Trend Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data.trends).map(([key, trend]) => (
                <div key={key} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(trend.direction, "h-4 w-4")}
                      <span className={`text-sm font-bold ${getTrendColor(trend.direction)}`}>
                        {trend.change > 0 ? '+' : ''}{trend.change}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{trend.insight}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5" />
            <span>Weekly Highlights</span>
          </CardTitle>
          <CardDescription>
            Notable achievements and significant events this week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.highlights.map((highlight, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
              {getHighlightIcon(highlight.type)}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h5 className="font-medium">{highlight.title}</h5>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {highlight.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{highlight.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-600 font-medium">Impact: {highlight.impact}</span>
                  <span className="text-muted-foreground">
                    Contributors: {highlight.contributors.join(', ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Risks & Blockers */}
      {data.risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Risks & Blockers</span>
            </CardTitle>
            <CardDescription>
              Current risks and blockers requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.risks.map((risk, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {risk.type}
                    </Badge>
                    <span className={`text-xs font-medium ${getSeverityColor(risk.severity)}`}>
                      {risk.severity.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">Owner: {risk.owner}</span>
                </div>
                <h5 className="font-medium text-sm mb-1">{risk.description}</h5>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><span className="font-medium">Impact:</span> {risk.impact}</p>
                  <p><span className="font-medium">Mitigation:</span> {risk.mitigation}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Next Week Planning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Next Week Planning</span>
          </CardTitle>
          <CardDescription>
            Priorities and planning for the upcoming week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="font-medium">Top Priorities</h5>
              <ul className="space-y-1">
                {data.nextWeek.priorities.map((priority, index) => (
                  <li key={index} className="text-sm flex items-center space-x-2">
                    <span className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span>{priority}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium">Expected Deliverables</h5>
              <ul className="space-y-1">
                {data.nextWeek.expectedDeliverables.map((deliverable, index) => (
                  <li key={index} className="text-sm flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>{deliverable}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="font-medium text-red-600">Potential Risks</h5>
              <ul className="space-y-1">
                {data.nextWeek.potentialRisks.map((risk, index) => (
                  <li key={index} className="text-sm flex items-center space-x-2">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-blue-600">Resource Needs</h5>
              <ul className="space-y-1">
                {data.nextWeek.resourceNeeds.map((need, index) => (
                  <li key={index} className="text-sm flex items-center space-x-2">
                    <Users className="h-3 w-3 text-blue-600" />
                    <span>{need}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="font-bold text-blue-600">{data.nextWeek.plannedTasks}</div>
            <div className="text-sm text-muted-foreground">Planned Tasks for Next Week</div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground border-t pt-4">
        <p>
          This weekly report was automatically generated by GenPlatform.ai Mission Control Dashboard
        </p>
        <p>
          Report ID: {data.reportId} • Generated: {new Date(data.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

// Mock data generator for testing
export function generateMockWeeklyReportData(): WeeklyReportData {
  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  return {
    reportDate: now.toISOString(),
    weekRange: {
      start: weekStart.toISOString(),
      end: now.toISOString()
    },
    generatedAt: now.toISOString(),
    reportId: `weekly-${Date.now()}`,
    
    summary: {
      totalProjectsTracked: 6,
      tasksCompleted: 47,
      teamProductivity: 88,
      overallProgress: 73,
      weeklyGoalsAchieved: 4,
      weeklyGoalsTotal: 5
    },
    
    teamPerformance: {
      totalMembers: 5,
      activeMembers: 4,
      averageHoursWorked: 42,
      productivityScore: 88,
      collaborationIndex: 92,
      topPerformers: [
        {
          name: 'Claude Agent',
          role: 'AI Developer',
          tasksCompleted: 18,
          hoursWorked: 45,
          contributionScore: 96
        },
        {
          name: 'Med',
          role: 'Project Lead',
          tasksCompleted: 12,
          hoursWorked: 40,
          contributionScore: 89
        },
        {
          name: 'System Agent',
          role: 'DevOps',
          tasksCompleted: 8,
          hoursWorked: 35,
          contributionScore: 85
        }
      ],
      teamInsights: [
        'Team exceeded weekly velocity target by 15%',
        'Collaboration score increased by 8% from last week',
        'All team members met their individual goals',
        'Cross-functional communication improved significantly'
      ]
    },
    
    projectProgress: {
      projects: [
        {
          name: 'GenPlatform.ai',
          status: 'on-track',
          progress: 85,
          tasksCompleted: 15,
          totalTasks: 23,
          weeklyProgress: 12,
          priority: 'high',
          nextMilestone: 'Sprint 5A Completion',
          daysUntilDeadline: 5
        },
        {
          name: 'Commander Enhancement',
          status: 'completed',
          progress: 100,
          tasksCompleted: 12,
          totalTasks: 12,
          weeklyProgress: 25,
          priority: 'high',
          nextMilestone: 'Production Deployment',
          daysUntilDeadline: 2
        }
      ],
      milestones: [
        {
          project: 'Commander Enhancement',
          milestone: 'Sprint 1C Completion',
          completedDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          impact: 'major'
        },
        {
          project: 'GenPlatform.ai',
          milestone: 'Sprint 2C Completion',
          completedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          impact: 'major'
        }
      ]
    },
    
    sprintAnalysis: {
      currentSprint: 'Sprint 5A - Reports System',
      sprintProgress: 33,
      sprintGoals: [
        {
          goal: 'Complete reports page layout',
          status: 'completed',
          progress: 100,
          assignee: 'Claude'
        },
        {
          goal: 'Build report generation system',
          status: 'in-progress',
          progress: 60,
          assignee: 'Claude'
        },
        {
          goal: 'Implement weekly templates',
          status: 'in-progress',
          progress: 90,
          assignee: 'Claude'
        }
      ],
      sprintRetro: {
        achievements: [
          'Successfully completed 2 major sprints (1C and 2C)',
          'Delivered Commander integration with Arabic support',
          'Built comprehensive multi-project management',
          'Maintained high code quality and documentation'
        ],
        challenges: [
          'Complex API integration requirements',
          'Balancing feature completeness with delivery speed',
          'Managing multiple concurrent development streams'
        ],
        improvements: [
          'Implement more granular task tracking',
          'Add automated testing for new components',
          'Enhance error handling across all features'
        ]
      }
    },
    
    metrics: {
      velocity: {
        current: 47,
        previous: 38,
        trend: 'up'
      },
      quality: {
        bugRate: 0.8,
        codeReviewTime: 2.5,
        testCoverage: 87,
        customerSatisfaction: 94
      },
      efficiency: {
        cycleTime: 4.2,
        leadTime: 6.8,
        throughput: 47,
        burndownRate: 88
      }
    },
    
    trends: {
      productivity: {
        change: 15,
        direction: 'up',
        insight: 'Team productivity increased significantly with improved task automation'
      },
      codeQuality: {
        change: 5,
        direction: 'up',
        insight: 'Code quality improvements through enhanced review processes'
      },
      teamSatisfaction: {
        change: 8,
        direction: 'up',
        insight: 'Team satisfaction increased due to clear goals and achievements'
      },
      deliverySpeed: {
        change: 12,
        direction: 'up',
        insight: 'Delivery speed improved through streamlined development processes'
      }
    },
    
    risks: [
      {
        type: 'timeline',
        severity: 'medium',
        description: 'Sprint 5A has 12 remaining tasks with tight timeline',
        impact: 'May delay final delivery by 1-2 days',
        mitigation: 'Prioritize core features and defer non-critical items',
        owner: 'Claude'
      }
    ],
    
    highlights: [
      {
        type: 'achievement',
        title: 'Sprint 1C & 2C Completed',
        description: 'Successfully delivered Commander integration and multi-project management systems',
        impact: 'Major milestone achieved ahead of schedule',
        contributors: ['Claude', 'Med']
      },
      {
        type: 'innovation',
        title: 'Arabic Command Translation',
        description: 'Implemented innovative Arabic-to-English command translation with confidence scoring',
        impact: 'Enhanced user experience for Arabic speakers',
        contributors: ['Claude']
      },
      {
        type: 'improvement',
        title: 'Quality-First Approach',
        description: 'Maintained high code quality while delivering features rapidly',
        impact: 'Reduced technical debt and improved maintainability',
        contributors: ['Claude', 'System']
      }
    ],
    
    nextWeek: {
      priorities: [
        'Complete Sprint 5A (Reports & Improvements)',
        'Implement remaining report templates',
        'Add PDF export functionality',
        'Deploy and test complete system',
        'Prepare documentation and handover'
      ],
      plannedTasks: 14,
      expectedDeliverables: [
        'Complete reports system',
        'PDF export functionality',
        'Improvements management',
        'Full system deployment',
        'Comprehensive documentation'
      ],
      potentialRisks: [
        'PDF generation complexity',
        'Report performance with large datasets',
        'Integration testing scope'
      ],
      resourceNeeds: [
        'Additional testing time',
        'PDF generation library setup',
        'Performance optimization review'
      ]
    }
  }
}