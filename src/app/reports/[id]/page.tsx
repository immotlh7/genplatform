"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Download,
  Share,
  Calendar,
  User,
  BarChart3,
  FileText,
  Tag,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import type { Report } from '@/components/reports/report-card'

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReport()
  }, [params.id])

  const loadReport = async () => {
    try {
      setLoading(true)
      
      // Mock data for development
      const mockReport: Report = {
        id: params.id as string,
        title: 'Daily Development Report - March 18, 2026',
        type: 'daily',
        description: 'Comprehensive overview of development activities, sprint progress, and system performance for today',
        createdAt: '2026-03-18T22:50:00Z',
        updatedAt: '2026-03-18T22:50:00Z',
        status: 'completed',
        size: '2.4 MB',
        insights: 15,
        metrics: {
          tasksCompleted: 12,
          codeCommits: 8,
          deployments: 3,
          testsCovered: 94,
          performanceScore: 96,
          bugCount: 2,
          linesOfCode: 1247,
          apiCalls: 2341,
          responseTime: 234
        },
        tags: ['development', 'sprint', 'performance'],
        author: 'System',
        project: 'GenPlatform.ai'
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setReport(mockReport)

    } catch (err) {
      setError('Failed to load report')
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading report:', err);
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusConfig = (status: Report['status']) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-green-500/20 text-green-500 border-green-500/30',
          label: 'Completed',
          icon: CheckCircle
        }
      case 'generating':
        return {
          color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
          label: 'Generating',
          icon: Activity
        }
      case 'failed':
        return {
          color: 'bg-red-500/20 text-red-500 border-red-500/30',
          label: 'Failed',
          icon: AlertTriangle
        }
      default:
        return {
          color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
          label: 'Unknown',
          icon: FileText
        }
    }
  }

  const handleDownload = () => {
    // Implement download functionality
    console.log('Downloading report:', report?.id)
  }

  const handleShare = () => {
    // Implement share functionality
    console.log('Sharing report:', report?.id)
    if (navigator.share) {
      navigator.share({
        title: report?.title,
        text: report?.description,
        url: window.location.href
      })
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-12 w-3/4 bg-muted animate-pulse rounded" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Report Not Found</h3>
            <p className="text-muted-foreground mb-4">
              {error || 'The requested report could not be found.'}
            </p>
            <Button onClick={() => router.push('/reports')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusConfig = getStatusConfig(report.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-bold">{report.title}</h1>
            <p className="text-muted-foreground">{report.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleShare}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Status and Metadata */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className={`${statusConfig.color}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {report.type} Report
          </Badge>
          {report.project && (
            <Badge variant="secondary">{report.project}</Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Generated {formatDate(report.createdAt)}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Size</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.size || 'N/A'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.insights || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Author</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.author || 'System'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {new Date(report.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
              <CardDescription>
                Key highlights and overview of this report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p>
                  This daily development report provides a comprehensive overview of all development 
                  activities for March 18, 2026. The report includes sprint progress, code quality 
                  metrics, deployment status, and performance indicators.
                </p>
                <h4>Key Highlights:</h4>
                <ul>
                  <li>Successfully completed 12 tasks across 3 different sprints</li>
                  <li>Deployed 3 updates to production with zero downtime</li>
                  <li>Maintained 94% test coverage across the codebase</li>
                  <li>System performance score improved to 96%</li>
                  <li>Only 2 minor bugs identified and resolved</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {report.tags && report.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {report.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          {report.metrics && (
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(report.metrics).map(([key, value]) => (
                <Card key={key}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-xs text-muted-foreground">
                      {typeof value === 'number' && key.includes('Score') ? '/ 100' : ''}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>
                Automated analysis and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <h4 className="font-medium text-green-700 mb-2">✅ Strong Performance</h4>
                  <p className="text-sm">
                    The team maintained excellent velocity with 12 tasks completed and 94% test coverage. 
                    Performance metrics are above target.
                  </p>
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <h4 className="font-medium text-yellow-700 mb-2">⚠️ Areas for Improvement</h4>
                  <p className="text-sm">
                    API response times have increased slightly. Consider implementing caching 
                    strategies for frequently accessed endpoints.
                  </p>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="font-medium text-blue-700 mb-2">💡 Recommendations</h4>
                  <p className="text-sm">
                    Based on current trends, consider allocating more resources to the 
                    performance optimization sprint in the next iteration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Raw Data Tab */}
        <TabsContent value="raw" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Raw Report Data</CardTitle>
              <CardDescription>
                Complete JSON representation of the report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(report, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}