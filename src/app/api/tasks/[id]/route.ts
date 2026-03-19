import { NextRequest, NextResponse } from 'next/server'

interface Task {
  id: string
  number: string
  name: string
  description: string
  status: 'backlog' | 'planned' | 'in_progress' | 'review' | 'done'
  assignedRole: Role
  estimatedTime: number // in hours
  actualTime?: number // in hours
  sprint: string
  priority: 'low' | 'medium' | 'high'
  startedAt?: string
  completedAt?: string
  blockedReason?: string
  projectId?: string
  createdAt: string
  updatedAt: string
}

interface Role {
  id: string
  name: string
  icon: string
}

// Roles definition
const roles: Role[] = [
  { id: 'frontend', name: 'Frontend', icon: '💻' },
  { id: 'backend', name: 'Backend', icon: '⚙️' },
  { id: 'security', name: 'Security', icon: '🛡️' },
  { id: 'qa', name: 'QA', icon: '🔍' },
  { id: 'research', name: 'Research', icon: '🔬' },
  { id: 'planning', name: 'Planning', icon: '📋' },
  { id: 'improvement', name: 'Self-Improvement', icon: '📈' }
]

// Get tasks from the global store (shared with main tasks route)
declare global {
  var tasksStore: Task[] | undefined
}

function getTasks(): Task[] {
  if (!global.tasksStore) {
    return []
  }
  return global.tasksStore
}

// GET /api/tasks/[id] - Get single task
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const tasks = getTasks()
    const task = tasks.find(t => t.id === params.id)

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Failed to fetch task:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve task' },
      { status: 500 }
    )
  }
}

// PUT /api/tasks/[id] - Update task
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const tasks = getTasks()
    const taskIndex = tasks.findIndex(t => t.id === params.id)

    if (taskIndex === -1) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const currentTask = tasks[taskIndex]
    const now = new Date().toISOString()
    
    // Build updated task
    const updatedTask: Task = {
      ...currentTask,
      updatedAt: now
    }

    // Update fields if provided
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.length < 3) {
        return NextResponse.json(
          { error: 'Task name must be at least 3 characters' },
          { status: 400 }
        )
      }
      updatedTask.name = body.name.trim()
    }
    
    if (body.description !== undefined) {
      updatedTask.description = body.description
    }
    
    if (body.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high']
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json(
          { error: 'Invalid priority value' },
          { status: 400 }
        )
      }
      updatedTask.priority = body.priority
    }
    
    if (body.estimatedTime !== undefined) {
      if (typeof body.estimatedTime !== 'number' || body.estimatedTime <= 0) {
        return NextResponse.json(
          { error: 'Estimated time must be a positive number' },
          { status: 400 }
        )
      }
      updatedTask.estimatedTime = body.estimatedTime
    }
    
    if (body.sprint !== undefined) {
      updatedTask.sprint = body.sprint
    }
    
    if (body.assignedRoleId !== undefined) {
      const role = roles.find(r => r.id === body.assignedRoleId)
      if (!role) {
        return NextResponse.json(
          { error: 'Invalid role ID' },
          { status: 400 }
        )
      }
      updatedTask.assignedRole = role
    }
    
    if (body.blockedReason !== undefined) {
      updatedTask.blockedReason = body.blockedReason || undefined
    }
    
    // Handle status changes with special logic
    if (body.status !== undefined) {
      const validStatuses = ['backlog', 'planned', 'in_progress', 'review', 'done']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        )
      }
      
      const previousStatus = currentTask.status
      updatedTask.status = body.status
      
      // Status change logic
      if (body.status === 'in_progress' && previousStatus !== 'in_progress') {
        // Starting work on the task
        updatedTask.startedAt = now
        updatedTask.completedAt = undefined
        updatedTask.actualTime = undefined
      } else if (body.status === 'done' && previousStatus !== 'done') {
        // Completing the task
        updatedTask.completedAt = now
        
        // Calculate actual time if we have a start time
        if (updatedTask.startedAt) {
          const startTime = new Date(updatedTask.startedAt).getTime()
          const endTime = new Date(now).getTime()
          const hoursElapsed = Math.ceil((endTime - startTime) / (1000 * 60 * 60))
          updatedTask.actualTime = Math.max(1, hoursElapsed) // Minimum 1 hour
        } else {
          // If no start time, use estimated time as actual
          updatedTask.actualTime = updatedTask.estimatedTime
        }
      } else if (body.status === 'backlog') {
        // Resetting the task
        updatedTask.startedAt = undefined
        updatedTask.completedAt = undefined
        updatedTask.actualTime = undefined
      }
    }
    
    // Replace in array
    tasks[taskIndex] = updatedTask
    
    return NextResponse.json({
      task: updatedTask,
      message: 'Task updated successfully'
    })
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const tasks = getTasks()
    const taskIndex = tasks.findIndex(t => t.id === params.id)

    if (taskIndex === -1) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Remove task from array
    const deletedTask = tasks.splice(taskIndex, 1)[0]

    return NextResponse.json({
      message: 'Task deleted successfully',
      task: deletedTask
    })
  } catch (error) {
    console.error('Failed to delete task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}