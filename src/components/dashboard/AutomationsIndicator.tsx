"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Zap,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

interface AutomationsStats {
  active: number
  running: number
  waitingApproval: number
}

export function AutomationsIndicator() {
  const [stats, setStats] = useState<AutomationsStats>({
    active: 0,
    running: 0,
    waitingApproval: 0
  })

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      // Mock data - replace with real API call
      setStats({
        active: 3,
        running: 1,
        waitingApproval: 1
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load automation stats:', error);
      }
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <Zap className="h-5 w-5 text-amber-600" />
          <span>⚡ Automations</span>
        </CardTitle>
        <CardDescription>
          {stats.active} active, {stats.running} running, {stats.waitingApproval} waiting approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Running</span>
            </div>
            <Badge variant={stats.running > 0 ? "default" : "secondary"}>
              {stats.running}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm">Waiting Approval</span>
            </div>
            <Badge variant={stats.waitingApproval > 0 ? "destructive" : "secondary"}>
              {stats.waitingApproval}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Active Workflows</span>
            </div>
            <Badge variant="outline">
              {stats.active}
            </Badge>
          </div>

          <Button variant="outline" size="sm" className="w-full mt-3" asChild>
            <a href="/dashboard/automations">
              <ArrowRight className="h-3 w-3 mr-2" />
              View Automations
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}