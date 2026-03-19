'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Wand2, Users, BarChart } from 'lucide-react'

interface Role {
  id: string
  name: string
  icon: string
}

interface Task {
  id: string
  number: string
  name: string
  description: string
  status: 'backlog' | 'planned' | 'in_progress' | 'review' | 'done'
  assignedRole: Role
  estimatedTime: number
  actualTime?: number
  sprint: string
  priority: 'low' | 'medium' | 'high'
  startedAt?: string
  completedAt?: string
  blockedReason?: string
  projectId?: string
}

interface TaskAssignmentPanelProps {
  tasks: Task[]
  onAutoAssign: () => Promise<void>
}

const departments = [
  { id: 'research', name: 'Research Analyst', icon: '🔬' },
  { id: 'planning', name: 'Architecture & Planning', icon: '📋' },
  { id: 'frontend', name: 'Frontend Development', icon: '💻' },
  { id: 'backend', name: 'Backend Development', icon: '⚙️' },
  { id: 'qa', name: 'Quality Assurance', icon: '🔍' },
  { id: 'security', name: 'Security', icon: '🛡️' },
  { id: 'improvement', name: 'Self-Improvement', icon: '📈' }
]

export default function TaskAssignmentPanel({ tasks, onAutoAssign }: TaskAssignmentPanelProps) {
  // Calculate task distribution by department
  const tasksByDepartment = departments.map(dept => {
    const deptTasks = tasks.filter(task => task.assignedRole.id === dept.id)
    return {
      ...dept,
      taskCount: deptTasks.length
    }
  })
  
  // Calculate unassigned tasks (defaulted to frontend)
  const unassignedCount = tasks.filter(task => !task.assignedRole || task.assignedRole.id === 'frontend').length
  
  // Calculate total tasks by status
  const totalTasks = tasks.length
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length
  const completedTasks = tasks.filter(task => task.status === 'done').length
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Task Assignment Dashboard</h3>
          </div>
          
          <Button
            onClick={onAutoAssign}
            variant="outline"
            className="gap-2"
          >
            <Wand2 className="w-4 h-4" />
            Auto-assign Tasks
          </Button>
        </div>
        
        {/* Department Stats */}
        <div className="grid grid-cols-7 gap-3">
          {tasksByDepartment.map(dept => (
            <div
              key={dept.id}
              className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border"
            >
              <div className="text-2xl mb-1">{dept.icon}</div>
              <div className="text-sm font-medium truncate" title={dept.name}>
                {dept.name.split(' ')[0]}
              </div>
              <div className="text-xl font-bold mt-1">{dept.taskCount}</div>
              <div className="text-xs text-muted-foreground">tasks</div>
            </div>
          ))}
        </div>
        
        {/* Summary Stats */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <BarChart className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Total: {totalTasks}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span>In Progress: {inProgressTasks}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Completed: {completedTasks}</span>
            </div>
          </div>
          
          {unassignedCount > 0 && (
            <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              {unassignedCount} tasks need assignment
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}