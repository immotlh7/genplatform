"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  FolderOpen, 
  Brain, 
  Database, 
  Clock, 
  Activity, 
  Server 
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  projects: number
  skills: number
  memory: number
  cron: number
  systemStatus: 'online' | 'offline'
  uptime: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    projects: 0,
    skills: 0,
    memory: 0,
    cron: 0,
    systemStatus: 'online',
    uptime: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load system status
      const statusResponse = await fetch('/api/openclaw/status')
      const statusData = await statusResponse.json()
      
      // Load skills count
      const skillsResponse = await fetch('/api/openclaw/skills')
      const skillsData = await skillsResponse.json()
      
      // Load cron jobs count  
      const cronResponse = await fetch('/api/openclaw/cron')
      const cronData = await cronResponse.json()
      
      // Load memory files count
      const memoryResponse = await fetch('/api/openclaw/memory')
      const memoryData = await memoryResponse.json()

      setStats({
        projects: 3, // Demo value
        skills: skillsData.count || 0,
        memory: memoryData.stats?.totalFiles || 0,
        cron: cronData.count || 0,
        systemStatus: statusData.error ? 'offline' : 'online',
        uptime: statusData.system?.uptime || 0
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setStats(prev => ({ ...prev, systemStatus: 'offline' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to GenPlatform.ai Mission Control
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Projects"
          value={loading ? "..." : stats.projects}
          description="Active development projects"
          icon={FolderOpen}
          trend={{ value: 12, direction: 'up' }}
        />
        
        <StatCard
          title="Active Skills"
          value={loading ? "..." : stats.skills}
          description="Available agent capabilities"
          icon={Brain}
          status="online"
        />
        
        <StatCard
          title="Memory Files"
          value={loading ? "..." : stats.memory}
          description="Stored memory documents"
          icon={Database}
          trend={{ value: 8, direction: 'up' }}
        />
        
        <StatCard
          title="Cron Jobs"
          value={loading ? "..." : stats.cron}
          description="Scheduled automation tasks"
          icon={Clock}
          status="online"
        />
        
        <StatCard
          title="System Status"
          value={stats.systemStatus === 'online' ? 'Online' : 'Offline'}
          description={`Uptime: ${stats.uptime}h`}
          icon={Activity}
          status={stats.systemStatus}
        />
        
        <StatCard
          title="Gateway Status"
          value="Running"
          description="OpenClaw gateway service"
          icon={Server}
          status="online"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/projects">
                <Button variant="outline" className="h-20 flex-col w-full">
                  <FolderOpen className="h-6 w-6 mb-2" />
                  <span className="text-sm">Projects</span>
                </Button>
              </Link>
              <Link href="/skills">
                <Button variant="outline" className="h-20 flex-col w-full">
                  <Brain className="h-6 w-6 mb-2" />
                  <span className="text-sm">Skills</span>
                </Button>
              </Link>
              <Link href="/memory">
                <Button variant="outline" className="h-20 flex-col w-full">
                  <Database className="h-6 w-6 mb-2" />
                  <span className="text-sm">Memory</span>
                </Button>
              </Link>
              <Link href="/cron">
                <Button variant="outline" className="h-20 flex-col w-full">
                  <Clock className="h-6 w-6 mb-2" />
                  <span className="text-sm">Cron Jobs</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <ActivityFeed />
      </div>
    </div>
  )
}