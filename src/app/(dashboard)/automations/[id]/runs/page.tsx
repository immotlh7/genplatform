'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Play,
  Pause,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Activity,
  BarChart3,
  FileText,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import WorkflowProgress from '@/components/automations/WorkflowProgress'
import Link from 'next/link'

interface WorkflowRun {
  id: string
  workflow_id: string
  project_id?: string
  status: 'running' | 'completed' | 'failed' | 'waiting_approval' | 'paused'
  current_step?: string
  steps_completed: number
  steps_total: number
  logs: any[]
  started_at: string
  completed_at?: string
  workflow?: {
    id: string
    name: string
    description: string
    template_type: string
  }
}

export default function WorkflowRunDetailPage() {
  const params = useParams()
  const router = useRouter()
  const runId = params.id as string

  const [workflowRun, setWorkflowRun] = useState<WorkflowRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    fetchWorkflowRun()
    
    // Auto-refresh for running workflows
    const interval = setInterval(() => {
      if (workflowRun?.status === 'running' || workflowRun?.status === 'waiting_approval') {
        fetchWorkflowRun(false) // Silent refresh
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [runId, workflowRun?.status])

  const fetchWorkflowRun = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/workflows/runs/${runId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Workflow run not found')
        } else {
          const errorData = await response.json()
          setError(errorData.message || 'Failed to fetch workflow run')
        }
        return
      }

      const data = await response.json()
      setWorkflowRun(data.workflowRun)
    } catch (err) {
      console.error('Error fetching workflow run:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleApproval = async (approved: boolean) => {
    if (!workflowRun) return

    try {
      setApproving(true)
      
      const response = await fetch('/api/workflows/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          runId: workflowRun.id,
          approved
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to process approval')
      }

      // Refresh the workflow run data
      await fetchWorkflowRun(false)
    } catch (error) {
      console.error('Error processing approval:', error)
      setError(error instanceof Error ? error.message : 'Failed to process approval')
    } finally {
      setApproving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'waiting_approval':
        return <Clock className="h-5 w-5 text-amber-600" />
      case 'paused':
        return <Pause className="h-5 w-5 text-gray-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'running': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      case 'waiting_approval': return 'bg-amber-500'
      case 'paused': return 'bg-gray-500'
      default: return 'bg-gray-300'
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime()
    const end = endTime ? new Date(endTime).getTime() : Date.now()
    const duration = end - start
    
    const minutes = Math.floor(duration / (1000 * 60))
    const seconds = Math.floor((duration % (1000 * 60)) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !workflowRun) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Workflow Run</h2>
            <p className="text-muted-foreground text-center mb-4">
              {error || 'The workflow run could not be found.'}
            </p>
            <Button onClick={() => fetchWorkflowRun()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {workflowRun.workflow?.name || 'Workflow Run'}
            </h1>
            <p className="text-muted-foreground">
              Run #{workflowRun.id.slice(-8)} • Started {new Date(workflowRun.started_at).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon(workflowRun.status)}
            <Badge 
              variant="outline" 
              className={cn('text-white font-medium', getStatusColor(workflowRun.status))}
            >
              {workflowRun.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          <Button variant="outline" size="sm" onClick={() => fetchWorkflowRun()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(workflowRun.status)}
              <span className="font-semibold capitalize">
                {workflowRun.status.replace('_', ' ')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="font-semibold">
                {workflowRun.steps_completed}/{workflowRun.steps_total} Steps
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round((workflowRun.steps_completed / workflowRun.steps_total) * 100)}% Complete
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="font-semibold">
                {formatDuration(workflowRun.started_at, workflowRun.completed_at)}
              </div>
              <div className="text-sm text-muted-foreground">
                {workflowRun.completed_at ? 'Total time' : 'Elapsed time'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Step</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="font-semibold truncate">
                {workflowRun.current_step || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">
                Step {workflowRun.steps_completed + 1}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Section */}
      {workflowRun.status === 'waiting_approval' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-amber-800">
              <Clock className="h-5 w-5" />
              <span>Approval Required</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-amber-700">
                This workflow is waiting for your approval to continue with the next step: 
                <span className="font-medium"> {workflowRun.current_step}</span>
              </p>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleApproval(true)}
                  disabled={approving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {approving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4 mr-2" />
                  )}
                  Approve & Continue
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleApproval(false)}
                  disabled={approving}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Reject & Stop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="progress" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Progress</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Logs</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Details</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress">
          <WorkflowProgress 
            workflowRun={workflowRun} 
            onRefresh={() => fetchWorkflowRun(false)}
            showLogs={true}
          />
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Execution Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                {workflowRun.logs && workflowRun.logs.length > 0 ? (
                  workflowRun.logs.map((log, index) => (
                    <div key={index} className="mb-2 flex space-x-2">
                      <span className="text-gray-400 flex-shrink-0">
                        {new Date(log.timestamp || Date.now()).toLocaleTimeString()}
                      </span>
                      <span className={cn(
                        'flex-shrink-0 font-medium',
                        log.level === 'error' && 'text-red-400',
                        log.level === 'warn' && 'text-yellow-400',
                        log.level === 'info' && 'text-blue-400',
                        log.level === 'success' && 'text-green-400'
                      )}>
                        [{log.level?.toUpperCase() || 'INFO'}]
                      </span>
                      <span className="flex-1">{log.message || JSON.stringify(log)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    No logs available for this workflow run
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Run Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Workflow</h4>
                    <div>
                      <div className="font-medium">{workflowRun.workflow?.name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">
                        {workflowRun.workflow?.description || 'No description'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Template Type</h4>
                    <div className="capitalize">
                      {workflowRun.workflow?.template_type?.replace('_', ' ') || 'Unknown'}
                    </div>
                  </div>

                  {workflowRun.project_id && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Project</h4>
                      <Link 
                        href={`/dashboard/projects/${workflowRun.project_id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Project →
                      </Link>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Run ID</h4>
                    <div className="font-mono text-sm">{workflowRun.id}</div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Started At</h4>
                    <div>{new Date(workflowRun.started_at).toLocaleString()}</div>
                  </div>

                  {workflowRun.completed_at && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Completed At</h4>
                      <div>{new Date(workflowRun.completed_at).toLocaleString()}</div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Total Duration</h4>
                    <div>{formatDuration(workflowRun.started_at, workflowRun.completed_at)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}