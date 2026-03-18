"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Zap,
  Plus,
  Activity,
  Settings,
  PlayCircle,
  PauseCircle,
  Clock,
  BarChart3,
  Shield,
  Cpu,
  RefreshCw
} from 'lucide-react'
import { WorkflowCard } from '@/components/automations/WorkflowCard'
import { getCurrentUserClient } from '@/lib/access-control'
import type { User } from '@/lib/access-control'

interface Workflow {
  id: string
  name: string
  description: string
  template_type: string
  is_active: boolean
  trigger_type: 'manual' | 'new_idea' | 'task_complete' | 'schedule'
  schedule?: string
  last_run_at?: string
  last_run_status?: string
  created_at: string
}

interface AutomationStats {
  total: number
  active: number
  running: number
  pendingApproval: number
}

export default function AutomationsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [stats, setStats] = useState<AutomationStats>({
    total: 0,
    active: 0,
    running: 0,
    pendingApproval: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAutomationsData()
  }, [])

  const loadAutomationsData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check user permissions
      const user = await getCurrentUserClient()
      setCurrentUser(user)

      if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
        setError('Access denied. Only OWNER and ADMIN can manage automations.')
        return
      }

      // Mock data for now - will be replaced with real API calls
      const mockWorkflows: Workflow[] = [
        {
          id: 'wf-1',
          name: 'Idea to MVP',
          description: 'Complete pipeline from idea submission to deployed MVP',
          template_type: 'idea_to_mvp',
          is_active: true,
          trigger_type: 'new_idea',
          last_run_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          last_run_status: 'completed',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'wf-2',
          name: 'Bug Fix Pipeline',
          description: 'Automated bug reproduction, fix, and deployment',
          template_type: 'bug_fix',
          is_active: true,
          trigger_type: 'manual',
          last_run_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          last_run_status: 'completed',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'wf-3',
          name: 'New Feature Development',
          description: 'Plan, code, review, and deploy new features',
          template_type: 'new_feature',
          is_active: false,
          trigger_type: 'manual',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'wf-4',
          name: 'Deploy Pipeline',
          description: 'Build, test, and deploy with approval gates',
          template_type: 'deploy_pipeline',
          is_active: true,
          trigger_type: 'manual',
          last_run_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          last_run_status: 'waiting_approval',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'wf-5',
          name: 'Nightly Maintenance',
          description: 'Daily code review, security scan, and cleanup',
          template_type: 'nightly_maintenance',
          is_active: true,
          trigger_type: 'schedule',
          schedule: '0 2 * * *', // Daily at 2 AM Africa/Casablanca
          last_run_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          last_run_status: 'completed',
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      setWorkflows(mockWorkflows)

      // Calculate stats
      const activeCount = mockWorkflows.filter(w => w.is_active).length
      const runningCount = 1 // Mock running count
      const pendingApprovalCount = mockWorkflows.filter(w => w.last_run_status === 'waiting_approval').length

      setStats({
        total: mockWorkflows.length,
        active: activeCount,
        running: runningCount,
        pendingApproval: pendingApprovalCount
      })

    } catch (err) {
      console.error('Failed to load automations:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      // API call to toggle workflow
      setWorkflows(prev => 
        prev.map(w => 
          w.id === workflowId 
            ? { ...w, is_active: isActive }
            : w
        )
      )
      
      // Update stats
      setStats(prev => ({
        ...prev,
        active: prev.active + (isActive ? 1 : -1)
      }))
    } catch (err) {
      console.error('Failed to toggle workflow:', err)
    }
  }

  const handleRunWorkflow = async (workflowId: string) => {
    try {
      // API call to run workflow
      console.log('Running workflow:', workflowId)
      // Update stats
      setStats(prev => ({ ...prev, running: prev.running + 1 }))
    } catch (err) {
      console.error('Failed to run workflow:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center space-x-2">
              <Zap className="h-8 w-8 text-amber-600" />
              <span>⚡ Automations</span>
            </h1>
          </div>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center space-x-2">
            <Zap className="h-8 w-8 text-amber-600" />
            <span>⚡ Automations</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Active: {stats.active}/{stats.total} workflows
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadAutomationsData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <PlayCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingApproval}</div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Templates Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Workflow Templates</h2>
          <Badge variant="secondary" className="text-xs">
            {stats.active} active
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onToggle={handleToggleWorkflow}
              onRun={handleRunWorkflow}
            />
          ))}
        </div>
      </div>

      {/* Empty State */}
      {workflows.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Workflows Found</h3>
              <p className="text-sm mb-4">
                Create your first automation workflow to get started.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}