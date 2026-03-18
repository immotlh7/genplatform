'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  RefreshCw
} from 'lucide-react'

interface WorkflowMetrics {
  id: string
  name: string
  total_runs: number
  successful_runs: number
  failed_runs: number
  avg_execution_time: number
  success_rate: number
  last_run: string
}

interface TrendData {
  date: string
  success_rate: number
  avg_time: number
  total_runs: number
}

interface ErrorData {
  type: string
  count: number
  percentage: number
}

interface ResourceMetrics {
  cpu_usage: number
  memory_usage: number
  network_io: number
  disk_io: number
}

export default function AnalyticsPage() {
  const [workflows, setWorkflows] = useState<WorkflowMetrics[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [errorData, setErrorData] = useState<ErrorData[]>([])
  const [resourceMetrics, setResourceMetrics] = useState<ResourceMetrics | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalyticsData, 30000)
    return () => clearInterval(interval)
  }, [selectedWorkflow, timeRange])

  const fetchAnalyticsData = async () => {
    try {
      // Fetch workflow metrics
      const workflowsResponse = await fetch('/api/workflows/analytics', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json()
        setWorkflows(workflowsData.workflows || [])
      }

      // Fetch trend data
      const trendsResponse = await fetch(`/api/workflows/analytics/trends?range=${timeRange}&workflow=${selectedWorkflow}`)
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json()
        setTrendData(trendsData.trends || generateMockTrendData())
      }

      // Fetch error analysis
      const errorsResponse = await fetch(`/api/workflows/analytics/errors?range=${timeRange}`)
      if (errorsResponse.ok) {
        const errorsData = await errorsResponse.json()
        setErrorData(errorsData.errors || generateMockErrorData())
      }

      // Fetch resource metrics
      const resourceResponse = await fetch('/api/workflows/analytics/resources')
      if (resourceResponse.ok) {
        const resourceData = await resourceResponse.json()
        setResourceMetrics(resourceData.metrics || generateMockResourceData())
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      // Load mock data for development
      loadMockData()
      setLoading(false)
    }
  }

  const loadMockData = () => {
    setWorkflows([
      {
        id: 'idea-to-mvp',
        name: 'Idea to MVP',
        total_runs: 45,
        successful_runs: 42,
        failed_runs: 3,
        avg_execution_time: 1250,
        success_rate: 93.3,
        last_run: '2026-03-18T14:30:00Z'
      },
      {
        id: 'bug-fix',
        name: 'Bug Fix',
        total_runs: 78,
        successful_runs: 73,
        failed_runs: 5,
        avg_execution_time: 680,
        success_rate: 93.6,
        last_run: '2026-03-18T15:15:00Z'
      },
      {
        id: 'new-feature',
        name: 'New Feature',
        total_runs: 32,
        successful_runs: 28,
        failed_runs: 4,
        avg_execution_time: 980,
        success_rate: 87.5,
        last_run: '2026-03-18T13:45:00Z'
      },
      {
        id: 'deploy-pipeline',
        name: 'Deploy Pipeline',
        total_runs: 67,
        successful_runs: 63,
        failed_runs: 4,
        avg_execution_time: 420,
        success_rate: 94.0,
        last_run: '2026-03-18T15:20:00Z'
      },
      {
        id: 'nightly-maintenance',
        name: 'Nightly Maintenance',
        total_runs: 15,
        successful_runs: 15,
        failed_runs: 0,
        avg_execution_time: 340,
        success_rate: 100.0,
        last_run: '2026-03-18T02:00:00Z'
      }
    ])
    setTrendData(generateMockTrendData())
    setErrorData(generateMockErrorData())
    setResourceMetrics(generateMockResourceData())
  }

  const generateMockTrendData = (): TrendData[] => {
    const data = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toISOString().split('T')[0],
        success_rate: 85 + Math.random() * 10,
        avg_time: 500 + Math.random() * 300,
        total_runs: Math.floor(10 + Math.random() * 20)
      })
    }
    return data
  }

  const generateMockErrorData = (): ErrorData[] => {
    return [
      { type: 'Timeout', count: 8, percentage: 40 },
      { type: 'API Error', count: 5, percentage: 25 },
      { type: 'Validation Error', count: 4, percentage: 20 },
      { type: 'Network Error', count: 2, percentage: 10 },
      { type: 'Other', count: 1, percentage: 5 }
    ]
  }

  const generateMockResourceData = (): ResourceMetrics => {
    return {
      cpu_usage: 45.2,
      memory_usage: 62.1,
      network_io: 23.8,
      disk_io: 31.5
    }
  }

  const calculateOverallMetrics = () => {
    const totals = workflows.reduce(
      (acc, workflow) => ({
        total_runs: acc.total_runs + workflow.total_runs,
        successful_runs: acc.successful_runs + workflow.successful_runs,
        failed_runs: acc.failed_runs + workflow.failed_runs,
        total_time: acc.total_time + (workflow.avg_execution_time * workflow.total_runs)
      }),
      { total_runs: 0, successful_runs: 0, failed_runs: 0, total_time: 0 }
    )

    return {
      total_runs: totals.total_runs,
      success_rate: totals.total_runs > 0 ? (totals.successful_runs / totals.total_runs) * 100 : 0,
      avg_execution_time: totals.total_runs > 0 ? totals.total_time / totals.total_runs : 0,
      failed_runs: totals.failed_runs
    }
  }

  const overallMetrics = calculateOverallMetrics()
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1']

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading analytics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Workflow Analytics</h1>
          <p className="text-gray-600 mt-1">Performance insights and optimization recommendations</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <select
            value={selectedWorkflow}
            onChange={(e) => setSelectedWorkflow(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Workflows</option>
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>
          <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.total_runs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {workflows.length} active workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            {overallMetrics.success_rate >= 90 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallMetrics.success_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overallMetrics.failed_runs} failed runs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(overallMetrics.avg_execution_time)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Across all workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resource Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resourceMetrics?.cpu_usage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              CPU utilization
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Success Rate Trends
                </CardTitle>
                <CardDescription>Workflow success rates over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="success_rate" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Execution Time Trends
                </CardTitle>
                <CardDescription>Average execution time over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="avg_time" 
                      stroke="#82ca9d" 
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Error Distribution
                </CardTitle>
                <CardDescription>Types of errors by frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={errorData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({type, percentage}) => `${type}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {errorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Error Analysis
                </CardTitle>
                <CardDescription>Detailed error breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {errorData.map((error, index) => (
                  <div key={error.type} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{error.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{error.count} errors</div>
                      <div className="text-sm text-gray-500">{error.percentage}%</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          {resourceMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resource Utilization</CardTitle>
                  <CardDescription>Current system resource usage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>CPU Usage</span>
                      <span>{resourceMetrics.cpu_usage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${resourceMetrics.cpu_usage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Memory Usage</span>
                      <span>{resourceMetrics.memory_usage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${resourceMetrics.memory_usage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Network I/O</span>
                      <span>{resourceMetrics.network_io.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: `${resourceMetrics.network_io}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Disk I/O</span>
                      <span>{resourceMetrics.disk_io.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${resourceMetrics.disk_io}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Recommendations</CardTitle>
                  <CardDescription>Optimization suggestions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resourceMetrics.cpu_usage > 70 && (
                    <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50">
                      <p className="text-sm"><strong>High CPU Usage:</strong> Consider optimizing workflow steps or scaling horizontally</p>
                    </div>
                  )}
                  {resourceMetrics.memory_usage > 80 && (
                    <div className="p-3 border-l-4 border-red-500 bg-red-50">
                      <p className="text-sm"><strong>High Memory Usage:</strong> Memory optimization needed - review data processing steps</p>
                    </div>
                  )}
                  {overallMetrics.success_rate < 90 && (
                    <div className="p-3 border-l-4 border-orange-500 bg-orange-50">
                      <p className="text-sm"><strong>Low Success Rate:</strong> Review failed workflows and implement better error handling</p>
                    </div>
                  )}
                  {overallMetrics.avg_execution_time > 600 && (
                    <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                      <p className="text-sm"><strong>Slow Execution:</strong> Consider parallelizing workflow steps or optimizing API calls</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Performance Comparison</CardTitle>
              <CardDescription>Individual workflow metrics and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{workflow.name}</h3>
                      <Badge variant={workflow.success_rate >= 95 ? 'default' : workflow.success_rate >= 90 ? 'secondary' : 'destructive'}>
                        {workflow.success_rate.toFixed(1)}% success
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total Runs:</span>
                        <div className="font-semibold">{workflow.total_runs}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Successful:</span>
                        <div className="font-semibold text-green-600">{workflow.successful_runs}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Failed:</span>
                        <div className="font-semibold text-red-600">{workflow.failed_runs}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg Time:</span>
                        <div className="font-semibold">{workflow.avg_execution_time}s</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${workflow.success_rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}