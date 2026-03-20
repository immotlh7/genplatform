'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Clock, 
  AlertTriangle,
  Cpu,
  TrendingUp,
  CheckCircle2
} from 'lucide-react'

interface WorkflowMetrics {
  id: string
  name: string
  totalRuns: number
  successRate: number
  avgExecutionTime: number
  lastRun: string
}

export default function WorkflowAnalyticsPage() {
  const [workflows, setWorkflows] = useState<WorkflowMetrics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkflowMetrics()
  }, [])

  const loadWorkflowMetrics = async () => {
    try {
      setLoading(true)
      
      // Try Bridge API
      const response = await fetch('/api/bridge/workflows/metrics')
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.metrics || [])
      } else {
        setWorkflows([])
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load workflow metrics:', error);
      }
      setWorkflows([])
    } finally {
      setLoading(false)
    }
  }

  const totalRuns = workflows.reduce((sum, w) => sum + w.totalRuns, 0)
  const avgSuccessRate = workflows.length > 0 
    ? workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length 
    : 0
  const avgExecutionTime = workflows.length > 0
    ? workflows.reduce((sum, w) => sum + w.avgExecutionTime, 0) / workflows.length
    : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Workflow Analytics</h1>
        <Button onClick={loadWorkflowMetrics}>
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Runs</p>
                <p className="text-2xl font-bold">{totalRuns.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Execution Time</p>
                <p className="text-2xl font-bold">{avgExecutionTime.toFixed(0)}s</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold">{workflows.length}</p>
              </div>
              <Cpu className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows Table */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading metrics...
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No workflow data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Workflow Name</th>
                    <th className="text-right p-4">Total Runs</th>
                    <th className="text-right p-4">Success Rate</th>
                    <th className="text-right p-4">Avg Time</th>
                    <th className="text-right p-4">Last Run</th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map(workflow => (
                    <tr key={workflow.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{workflow.name}</td>
                      <td className="text-right p-4">{workflow.totalRuns.toLocaleString()}</td>
                      <td className="text-right p-4">
                        <span className={workflow.successRate >= 90 ? 'text-green-600' : workflow.successRate >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                          {workflow.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right p-4">{workflow.avgExecutionTime.toFixed(1)}s</td>
                      <td className="text-right p-4 text-gray-600">
                        {workflow.lastRun ? new Date(workflow.lastRun).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}