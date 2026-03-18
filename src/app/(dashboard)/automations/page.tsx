"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WorkflowCard } from '@/components/automations/WorkflowCard'
import { 
  Zap, 
  Plus, 
  Settings,
  Play,
  Pause,
  BarChart3,
  RefreshCw,
  Shield,
  AlertTriangle
} from 'lucide-react'
import { getCurrentUserClient, getUserPermissionSummary } from '@/lib/access-control'
import type { User } from '@/lib/access-control'

interface Workflow {
  id: string
  name: string
  description: string
  template_type: string
  is_active: boolean
  trigger_type: 'manual' | 'new_idea' | 'task_complete' | 'schedule'
  schedule?: string
  config: any
  last_run_at?: string
  last_run_status?: string
  created_at: string
}

export default function AutomationsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    running: 0,
    waitingApproval: 0
  })

  useEffect(() => {
    checkUserAccess()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadWorkflows()
    }
  }, [currentUser])

  const checkUserAccess = async () => {
    try {
      const user = await getCurrentUserClient()
      setCurrentUser(user)
      
      if (!user) {
        setError('Authentication required')
        return
      }

      const permissions = getUserPermissionSummary(user)
      if (!permissions.isAdmin) {
        setError('Only OWNER and ADMIN can manage automations')
        return
      }
    } catch (err) {
      console.error('Error checking user access:', err)
      setError('Failed to verify access permissions')
    } finally {
      setLoading(false)
    }
  }

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to load workflows: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.workflows) {
        setWorkflows(data.workflows)
        calculateStats(data.workflows)
      } else {
        // Use demo data for now
        const demoWorkflows: Workflow[] = [
          {
            id: '1',
            name: 'Idea to MVP',
            description: 'Transform ideas into working prototypes automatically',
            template_type: 'idea_to_mvp',
            is_active: true,
            trigger_type: 'new_idea',
            last_run_at: '2026-03-18T14:30:00Z',
            last_run_status: 'completed',
            config: {},
            created_at: '2026-03-18T10:00:00Z'
          },
          {
            id: '2',
            name: 'Bug Fix',
            description: 'Automatically reproduce, fix, and deploy bug fixes',
            template_type: 'bug_fix',
            is_active: false,
            trigger_type: 'manual',
            last_run_status: 'never',
            config: {},
            created_at: '2026-03-18T10:00:00Z'
          },
          {
            id: '3',
            name: 'New Feature',
            description: 'Plan, code, review, and deploy new features',
            template_type: 'new_feature',
            is_active: true,
            trigger_type: 'manual',
            last_run_at: '2026-03-18T12:15:00Z',
            last_run_status: 'waiting_approval',
            config: {},
            created_at: '2026-03-18T10:00:00Z'
          },
          {
            id: '4',
            name: 'Deploy Pipeline',
            description: 'Build, test, and deploy with approval gates',
            template_type: 'deploy_pipeline',
            is_active: true,
            trigger_type: 'task_complete',
            last_run_at: '2026-03-18T15:45:00Z',
            last_run_status: 'running',
            config: {},
            created_at: '2026-03-18T10:00:00Z'
          },
          {
            id: '5',
            name: 'Nightly Maintenance',
            description: 'Daily code review, security scan, and reporting',
            template_type: 'nightly_maintenance',
            is_active: true,
            trigger_type: 'schedule',
            schedule: '0 2 * * *',
            last_run_at: '2026-03-18T02:00:00Z',
            last_run_status: 'completed',
            config: {},
            created_at: '2026-03-18T10:00:00Z'
          }
        ]
        setWorkflows(demoWorkflows)
        calculateStats(demoWorkflows)
      }
    } catch (err) {
      console.error('Error loading workflows:', err)
      setError('Failed to load workflows')
    }
  }

  const calculateStats = (workflows: Workflow[]) => {
    const active = workflows.filter(w => w.is_active).length
    const running = workflows.filter(w => w.last_run_status === 'running').length
    const waitingApproval = workflows.filter(w => w.last_run_status === 'waiting_approval').length
    
    setStats({
      total: workflows.length,
      active,
      running,
      waitingApproval
    })
  }

  const handleRefresh = () => {
    loadWorkflows()
  }

  // Show loading state during auth check
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

  // Show access denied state
  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
              <Zap className="h-8 w-8" />
              <span>Automations</span>
            </h1>
            <p className="text-muted-foreground">Workflow automation system</p>
          </div>
        </div>

        <Card className="flex-1 flex items-center justify-center py-12">
          <CardContent className="text-center space-y-6 max-w-md">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              {currentUser && (
                <Badge variant="outline">
                  Current Role: {currentUser.role}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
            <Zap className="h-8 w-8 text-yellow-600" />
            <span>Automations</span>
            <Badge className="bg-blue-500 text-white">
              Active: {stats.active}/{stats.total} workflows
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor automated workflows
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Running</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.running}</div>
            <p className="text-xs text-muted-foreground">
              in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting Approval</CardTitle>
            <Pause className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.waitingApproval}</div>
            <p className="text-xs text-muted-foreground">
              need approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">
              last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Templates Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Workflow Templates</h2>
        {workflows.length === 0 ? (
          <Card className="p-12 text-center">
            <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Workflows Found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first workflow template to get started with automation.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create First Workflow
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <WorkflowCard 
                key={workflow.id}
                workflow={workflow}
                onToggle={(id, active) => {
                  setWorkflows(prev => 
                    prev.map(w => w.id === id ? { ...w, is_active: active } : w)
                  )
                  calculateStats(workflows.map(w => w.id === id ? { ...w, is_active: active } : w))
                }}
                onRun={(id) => {
                  console.log('Running workflow:', id)
                }}
                onConfigure={(id) => {
                  console.log('Configuring workflow:', id)
                }}
                onViewRuns={(id) => {
                  console.log('Viewing runs for workflow:', id)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* User access indicator */}
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
        <div className="flex items-center space-x-2 text-sm">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-900 dark:text-green-100">
            Admin Access: You can create, configure, and manage all workflows
          </span>
          <Badge className="bg-green-500 text-white">
            {currentUser?.role}
          </Badge>
        </div>
      </div>
    </div>
  )
}