'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, Settings, Play, BarChart3, Plus } from 'lucide-react'
import WorkflowCard from '@/components/automations/WorkflowCard'
import { useAuth } from '@/hooks/useAuth'

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

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, userRole } = useAuth()

  // Check if user can manage automations (only OWNER and ADMIN)
  const canManageAutomations = userRole === 'OWNER' || userRole === 'ADMIN'

  useEffect(() => {
    if (!user) return

    fetchWorkflows()
  }, [user])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workflows')
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflows')
      }
      
      const data = await response.json()
      setWorkflows(data.workflows || [])
    } catch (error) {
      console.error('Error fetching workflows:', error)
      setError('Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  const activeWorkflowsCount = workflows.filter(w => w.is_active).length
  const totalWorkflowsCount = workflows.length

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view automations.</p>
        </div>
      </div>
    )
  }

  if (!canManageAutomations) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">
            Only OWNER and ADMIN users can manage automations.
          </p>
          <Badge variant="outline" className="mt-2">
            Your role: {userRole}
          </Badge>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading automations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-8 w-8 text-yellow-500" />
            Automations
          </h1>
          <p className="text-muted-foreground mt-1">
            Automate workflows with pre-built templates
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm">
            Active: {activeWorkflowsCount}/{totalWorkflowsCount} workflows
          </Badge>
          
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Workflows Grid */}
      {workflows.length === 0 && !error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No automations yet</h3>
              <p className="text-muted-foreground mb-4">
                Workflow templates will appear here once they're created.
              </p>
              <Badge variant="outline">
                Coming soon: Pre-built workflow templates
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onUpdate={fetchWorkflows}
            />
          ))}
        </div>
      )}

      {/* Stats Cards */}
      {workflows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{activeWorkflowsCount}</p>
                  <p className="text-sm text-muted-foreground">Active Workflows</p>
                </div>
                <Play className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{totalWorkflowsCount}</p>
                  <p className="text-sm text-muted-foreground">Total Templates</p>
                </div>
                <Settings className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {workflows.filter(w => w.last_run_status === 'completed').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Successful Runs</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}