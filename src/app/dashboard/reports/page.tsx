"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { 
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Target,
  CheckCircle,
  AlertTriangle,
  Zap,
  RefreshCw,
  Settings,
  MoreHorizontal,
  Eye,
  Star,
  Archive
} from 'lucide-react'

interface Report {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  status: 'generating' | 'completed' | 'failed' | 'scheduled'
  createdAt: string
  generatedAt?: string
  dataRange: {
    start: string
    end: string
  }
  metrics: {
    totalProjects: number
    completedTasks: number
    activeUsers: number
    systemHealth: number
  }
  size: string
  downloadUrl?: string
  isStarred?: boolean
  tags: string[]
}

interface ReportStats {
  totalReports: number
  reportsThisMonth: number
  avgGenerationTime: string
  successRate: number
  lastGenerated: string
  topReportType: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('reports')

  useEffect(() => {
    loadReports()
    loadStats()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      // Mock API call - in real app, this would call /api/reports
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockReports: Report[] = [
        {
          id: 'report-1',
          title: 'Daily System Report',
          description: 'Comprehensive daily overview of system performance and project progress',
          type: 'daily',
          status: 'completed',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          dataRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          },
          metrics: {
            totalProjects: 6,
            completedTasks: 23,
            activeUsers: 3,
            systemHealth: 98
          },
          size: '2.4 MB',
          downloadUrl: '/api/reports/report-1/download',
          isStarred: true,
          tags: ['automated', 'daily', 'system']
        },
        {
          id: 'report-2',
          title: 'Weekly Team Performance',
          description: 'Team productivity metrics and project milestones achieved',
          type: 'weekly',
          status: 'completed',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          dataRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          },
          metrics: {
            totalProjects: 6,
            completedTasks: 47,
            activeUsers: 3,
            systemHealth: 96
          },
          size: '5.1 MB',
          downloadUrl: '/api/reports/report-2/download',
          tags: ['weekly', 'team', 'performance']
        },
        {
          id: 'report-3',
          title: 'Sprint 2C Analysis',
          description: 'Detailed analysis of Sprint 2C completion and outcomes',
          type: 'custom',
          status: 'generating',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          dataRange: {
            start: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          },
          metrics: {
            totalProjects: 1,
            completedTasks: 5,
            activeUsers: 1,
            systemHealth: 100
          },
          size: 'Calculating...',
          tags: ['sprint', 'analysis', 'custom']
        },
        {
          id: 'report-4',
          title: 'Monthly Security Audit',
          description: 'Comprehensive security review and compliance check',
          type: 'monthly',
          status: 'scheduled',
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          dataRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          },
          metrics: {
            totalProjects: 6,
            completedTasks: 0,
            activeUsers: 3,
            systemHealth: 0
          },
          size: 'Pending',
          tags: ['monthly', 'security', 'audit']
        }
      ]
      
      setReports(mockReports)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading reports:', error);
      }
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Mock stats loading
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setStats({
        totalReports: 47,
        reportsThisMonth: 12,
        avgGenerationTime: '2.3 min',
        successRate: 98.7,
        lastGenerated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        topReportType: 'Daily'
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading stats:', error);
      }
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || report.type === selectedType
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'generating': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'scheduled': return <Clock className="h-4 w-4 text-orange-600" />
      default: return null
    }
  }

  const getStatusBadge = (status: Report['status']) => {
    const configs = {
      completed: { label: 'Completed', className: 'bg-green-50 text-green-700 border-green-200' },
      generating: { label: 'Generating', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      failed: { label: 'Failed', className: 'bg-red-50 text-red-700 border-red-200' },
      scheduled: { label: 'Scheduled', className: 'bg-orange-50 text-orange-700 border-orange-200' }
    }
    
    const config = configs[status]
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getTypeIcon = (type: Report['type']) => {
    switch (type) {
      case 'daily': return <Calendar className="h-4 w-4" />
      case 'weekly': return <BarChart3 className="h-4 w-4" />
      case 'monthly': return <PieChart className="h-4 w-4" />
      case 'custom': return <Target className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const generateReport = () => {
    console.log('Generate new report')
    // This would open the report generation dialog
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate insights and track system performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={loadReports}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={generateReport}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button variant="outline" onClick={() => alert('Select 2 reports to compare')}>
            Compare Reports
          </Button>
          <Button variant="outline" onClick={() => {
            const data = JSON.stringify({exportedAt: new Date().toISOString(), reports: []}, null, 2)
            const blob = new Blob([data], {type: 'application/json'})
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = 'reports-export.json'; a.click()
          }}>
            Export Reports
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReports}</div>
              <p className="text-xs text-muted-foreground">
                {stats.reportsThisMonth} this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <p className="text-xs text-muted-foreground">
                Generation success
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Generation</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgGenerationTime}</div>
              <p className="text-xs text-muted-foreground">
                Per report
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Generated</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDate(stats.lastGenerated)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.topReportType} report
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
          <TabsTrigger value="improvements" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Improvements</span>
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading reports...</p>
              </div>
            ) : filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="mt-1">
                          {getTypeIcon(report.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg truncate">{report.title}</h3>
                            {report.isStarred && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {report.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {getStatusBadge(report.status)}
                            <Badge variant="outline" className="capitalize">
                              {report.type}
                            </Badge>
                            {report.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground space-x-4">
                            <span>Created: {formatDate(report.createdAt)}</span>
                            {report.generatedAt && (
                              <span>Generated: {formatDate(report.generatedAt)}</span>
                            )}
                            <span>Size: {report.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {getStatusIcon(report.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Report
                            </DropdownMenuItem>
                            {report.downloadUrl && report.status === 'completed' && (
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Star className="h-4 w-4 mr-2" />
                              {report.isStarred ? 'Unstar' : 'Star'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || selectedType !== 'all' || selectedStatus !== 'all' 
                    ? 'Try adjusting your filters or search query.'
                    : 'Generate your first report to get started.'}
                </p>
                <Button onClick={generateReport}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Improvements Tab */}
        <TabsContent value="improvements" className="space-y-4">
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Improvements System</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This section will display system improvement suggestions and proposals.
            </p>
            <p className="text-xs text-muted-foreground">
              Coming in Task 5A-10
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}