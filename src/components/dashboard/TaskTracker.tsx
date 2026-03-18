"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Hammer, 
  CheckCircle, 
  Pause, 
  Play, 
  Clock,
  Target,
  Activity,
  ChevronRight
} from 'lucide-react'

interface TaskStatus {
  isActive: boolean
  currentTaskNumber?: number
  currentTaskName?: string
  totalTasks: number
  completedTasks: number
  timeElapsed?: string
  status: 'working' | 'idle' | 'complete' | 'waiting'
  sprint?: string
}

export function TaskTracker() {
  const [taskStatus, setTaskStatus] = useState<TaskStatus>({
    isActive: true,
    currentTaskNumber: 1,
    currentTaskName: "Create live task tracker component",
    totalTasks: 23,
    completedTasks: 0,
    timeElapsed: "00:00:00",
    status: 'working',
    sprint: '0D'
  })

  const [startTime] = useState(new Date())

  useEffect(() => {
    if (taskStatus.status === 'working') {
      const interval = setInterval(() => {
        const now = new Date()
        const diff = now.getTime() - startTime.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        setTaskStatus(prev => ({
          ...prev,
          timeElapsed: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }))
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [taskStatus.status, startTime])

  const getStatusIcon = () => {
    switch (taskStatus.status) {
      case 'working':
        return <Hammer className="h-5 w-5 text-orange-500 animate-pulse" />
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'waiting':
        return <Pause className="h-5 w-5 text-gray-500" />
      default:
        return <Activity className="h-5 w-5 text-blue-500" />
    }
  }

  const getStatusText = () => {
    switch (taskStatus.status) {
      case 'working':
        return `🔨 Currently working on: Task ${taskStatus.currentTaskNumber} — ${taskStatus.currentTaskName}`
      case 'complete':
        return "✅ All tasks complete"
      case 'waiting':
        return "⏸️ Waiting for instructions"
      default:
        return "⚡ Ready to begin work"
    }
  }

  const getStatusBadge = () => {
    switch (taskStatus.status) {
      case 'working':
        return <Badge className="bg-orange-500 hover:bg-orange-600">In Progress</Badge>
      case 'complete':
        return <Badge className="bg-green-500 hover:bg-green-600">Complete</Badge>
      case 'waiting':
        return <Badge variant="secondary">Waiting</Badge>
      default:
        return <Badge variant="outline">Ready</Badge>
    }
  }

  const progressPercentage = taskStatus.totalTasks > 0 
    ? Math.round((taskStatus.completedTasks / taskStatus.totalTasks) * 100) 
    : 0

  return (
    <Card className="mb-6 border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>Live Task Monitor</span>
            {getStatusBadge()}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="font-mono">
              Sprint {taskStatus.sprint}
            </Badge>
            {taskStatus.timeElapsed && (
              <Badge variant="outline" className="font-mono flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{taskStatus.timeElapsed}</span>
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-base">
          {getStatusText()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>Sprint Progress</span>
            </div>
            <span className="font-mono font-medium">
              {taskStatus.completedTasks}/{taskStatus.totalTasks} tasks ({progressPercentage}%)
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Current Task Details */}
        {taskStatus.status === 'working' && taskStatus.currentTaskName && (
          <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {taskStatus.currentTaskNumber}
              </div>
              <div>
                <div className="font-medium text-orange-900 dark:text-orange-100">
                  {taskStatus.currentTaskName}
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  Estimated: 15 minutes
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-orange-500" />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{taskStatus.totalTasks}</div>
            <div className="text-xs text-muted-foreground">Total Tasks</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <div className="text-lg font-bold text-green-600">{taskStatus.completedTasks}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <div className="text-lg font-bold text-orange-600">{taskStatus.totalTasks - taskStatus.completedTasks}</div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}