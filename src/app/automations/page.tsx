'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Play, 
  Pause, 
  Settings, 
  BarChart3,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { Workflow } from '@/types/workflow'

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    failed: 0,
    successRate: 0
  })
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const calculateStats = (workflows: Workflow[]) => {
    const total = workflows.length
    const active = workflows.filter(w => w.status === 'active').length
    const completed = workflows.filter(w => w.status === 'completed').length
    const failed = workflows.filter(w => w.status === 'failed').length
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0

    setStats({
      total,
      active,
      completed,
      failed,
      successRate
    })
  }

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        setIsLoading(true)
        
        // Try fetching from Bridge API
        try {
          const bridgeResponse = await fetch('/api/bridge/workflows')
          if (bridgeResponse.ok) {
            const bridgeData = await bridgeResponse.json()
            if (bridgeData.workflows) {
              setWorkflows(bridgeData.workflows)
              calculateStats(bridgeData.workflows)
              return
            }
          }
        } catch (bridgeError) {
          console.error('Error fetching from Bridge API:', bridgeError)
        }
        
        // Try the workflows API
        try {
          const response = await fetch('/api/workflows')
          if (response.ok) {
            const data = await response.json()
            if (data.workflows) {
              setWorkflows(data.workflows)
              calculateStats(data.workflows)
              return
            }
          }
        } catch (error) {
          console.error('Error fetching workflows:', error)
        }
        
        // If all APIs fail, set empty state
        setWorkflows([])
        calculateStats([])
        
      } catch (error) {
        console.error('Error loading workflows:', error)
        setWorkflows([])
        calculateStats([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkflows()
  }, [])

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesFilter = filter === 'all' || workflow.status === filter
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workflow.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'failed':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'blue'
      case 'completed':
        return 'green'
      case 'failed':
        return 'red'
      default:
        return 'gray'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground">
            Manage and monitor your automated workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/automations/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Workflow
            </Button>
          </Link>
          <Link href="/automations/marketplace">
            <Button variant="outline">
              Browse Marketplace
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Workflows
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Workflows
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <Progress value={(stats.active / Math.max(stats.total, 1)) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Success Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Failed Workflows
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs value={filter} onValueChange={setFilter} className="w-full md:w-auto">
          <TabsList className="grid w-full md:w-auto grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 md:w-[300px]"
          />
        </div>
      </div>

      {/* Workflows List */}
      <Card>
        <CardHeader>
          <CardTitle>Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No workflows found</p>
              <Link href="/automations/new">
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first workflow
                </Button>
              </Link>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {filteredWorkflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`mt-1 p-2 rounded-full bg-${getStatusColor(workflow.status)}-100 dark:bg-${getStatusColor(workflow.status)}-900/20`}>
                        {getStatusIcon(workflow.status)}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            v{workflow.version}
                          </Badge>
                        </div>
                        {workflow.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {workflow.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Type: {workflow.type}</span>
                          <span>•</span>
                          <span>
                            Last run: {workflow.lastRun 
                              ? formatDistanceToNow(new Date(workflow.lastRun), { addSuffix: true })
                              : 'Never'
                            }
                          </span>
                          {workflow.nextRun && (
                            <>
                              <span>•</span>
                              <span>
                                Next run: {formatDistanceToNow(new Date(workflow.nextRun), { addSuffix: true })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {workflow.status === 'active' ? (
                        <Button variant="ghost" size="sm">
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Link href={`/automations/${workflow.id}/runs`}>
                        <Button variant="ghost" size="sm">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/automations/${workflow.id}`}>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}