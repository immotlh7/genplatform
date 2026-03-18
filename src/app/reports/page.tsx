"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ReportCard, type Report } from '@/components/reports/report-card'
import { GenerateReportDialog } from '@/components/reports/generate-report-dialog'
import {
  FileText,
  Search,
  Calendar,
  Download,
  Plus,
  TrendingUp,
  Clock,
  Filter
} from 'lucide-react'

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      // Mock API call - replace with actual API
      const response = await fetch('/api/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data.data || [])
      } else {
        // Fallback to mock data
        loadMockReports()
      }
    } catch (error) {
      console.error('Error loading reports:', error)
      loadMockReports()
    } finally {
      setLoading(false)
    }
  }

  const loadMockReports = () => {
    const mockReports: Report[] = [
      {
        id: '1',
        title: 'Daily Development Report - March 18, 2026',
        type: 'daily',
        description: 'Comprehensive overview of development activities and performance',
        createdAt: '2026-03-18T22:50:00Z',
        updatedAt: '2026-03-18T22:50:00Z',
        status: 'completed',
        size: '2.4 MB',
        insights: 15,
        metrics: {
          tasksCompleted: 12,
          codeCommits: 8,
          deployments: 3
        },
        tags: ['development', 'sprint', 'performance'],
        author: 'System',
        project: 'GenPlatform.ai'
      },
      {
        id: '2',
        title: 'Weekly Sprint Analysis - Week 12',
        type: 'weekly',
        description: 'Sprint velocity analysis and team performance metrics',
        createdAt: '2026-03-17T10:00:00Z',
        updatedAt: '2026-03-17T10:30:00Z',
        status: 'completed',
        size: '1.8 MB',
        insights: 8,
        metrics: {
          sprintsCompleted: 2,
          velocity: 24,
          bugCount: 2
        },
        tags: ['sprint', 'velocity', 'team'],
        author: 'System',
        project: 'GenPlatform.ai'
      },
      {
        id: '3',
        title: 'Performance Analysis Report',
        type: 'custom',
        description: 'Deep dive into application performance and optimization opportunities',
        createdAt: '2026-03-16T15:30:00Z',
        updatedAt: '2026-03-16T16:00:00Z',
        status: 'completed',
        size: '3.2 MB',
        insights: 22,
        metrics: {
          performanceScore: 94,
          loadTime: 1.2,
          errorRate: 0.02
        },
        tags: ['performance', 'optimization', 'database'],
        author: 'Med',
        project: 'GenPlatform.ai'
      },
      {
        id: '4',
        title: 'Weekly Report Generation',
        type: 'weekly',
        description: 'Automated weekly report currently being generated',
        createdAt: '2026-03-18T22:00:00Z',
        updatedAt: '2026-03-18T22:30:00Z',
        status: 'generating',
        author: 'System',
        project: 'GenPlatform.ai'
      }
    ]
    setReports(mockReports)
  }

  const mockImprovements = [
    {
      id: '1',
      title: 'Optimize Database Query Performance',
      description: 'Add indexes to frequently queried columns in project_tasks table',
      priority: 'high',
      status: 'pending',
      estimatedImpact: 'High',
      estimatedEffort: 'Low',
      createdAt: '2026-03-18T20:00:00Z'
    },
    {
      id: '2',
      title: 'Implement Caching for Static Assets',
      description: 'Add Redis caching layer for API responses and static content',
      priority: 'medium',
      status: 'approved',
      estimatedImpact: 'Medium',
      estimatedEffort: 'Medium',
      createdAt: '2026-03-18T18:30:00Z'
    }
  ]

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || report.type === typeFilter
    return matchesSearch && matchesType
  })

  const pendingImprovements = mockImprovements.filter(imp => imp.status === 'pending').length

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-500'
      case 'medium': return 'bg-yellow-500/20 text-yellow-500'
      case 'low': return 'bg-green-500/20 text-green-500'
      default: return 'bg-zinc-500/20 text-zinc-400'
    }
  }

  const handleReportView = (report: Report) => {
    window.location.href = `/reports/${report.id}`
  }

  const handleReportDownload = (report: Report) => {
    console.log('Downloading report:', report.id)
    // Implement download logic
  }

  const handleReportDelete = async (report: Report) => {
    console.log('Deleting report:', report.id)
    // Implement delete logic
    setReports(prev => prev.filter(r => r.id !== report.id))
  }

  const handleReportShare = (report: Report) => {
    console.log('Sharing report:', report.id)
    // Implement share logic
  }

  const handleReportGenerated = (newReport: any) => {
    console.log('New report generated:', newReport)
    loadReports() // Refresh the list
  }

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Automated insights and improvement suggestions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <GenerateReportDialog onSuccess={handleReportGenerated}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </GenerateReportDialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Improvements</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingImprovements}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Generated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h ago</div>
            <p className="text-xs text-muted-foreground">
              Daily report
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="improvements">
            Improvements
            {pendingImprovements > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {pendingImprovements}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reports Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onView={handleReportView}
                onDownload={handleReportDownload}
                onDelete={handleReportDelete}
                onShare={handleReportShare}
              />
            ))}
          </div>

          {filteredReports.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No reports found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || typeFilter !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'Generate your first report to get started'
                  }
                </p>
                {!searchQuery && typeFilter === 'all' && (
                  <GenerateReportDialog onSuccess={handleReportGenerated}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </GenerateReportDialog>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Improvements Tab */}
        <TabsContent value="improvements" className="space-y-6">
          <div className="space-y-4">
            {mockImprovements.map((improvement) => (
              <Card key={improvement.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base">{improvement.title}</CardTitle>
                      <CardDescription>{improvement.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={`${getPriorityColor(improvement.priority)}`}>
                        {improvement.priority}
                      </Badge>
                      <Badge variant={improvement.status === 'approved' ? 'default' : 'secondary'}>
                        {improvement.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Impact:</span>
                        <span className="ml-2 font-medium">{improvement.estimatedImpact}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Effort:</span>
                        <span className="ml-2 font-medium">{improvement.estimatedEffort}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {improvement.status === 'pending' && (
                        <>
                          <Button variant="outline" size="sm">
                            Reject
                          </Button>
                          <Button size="sm">
                            Approve
                          </Button>
                        </>
                      )}
                      {improvement.status === 'approved' && (
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {mockImprovements.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No improvements yet</h3>
                <p className="text-muted-foreground">
                  Improvements will appear here as the system analyzes your workflow
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Detailed performance metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Analytics dashboard will be implemented in the next phase
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}