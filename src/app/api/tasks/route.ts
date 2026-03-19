import { NextRequest, NextResponse } from 'next/server'
import { taskSchema } from '@/lib/validators'
import { z } from 'zod'

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

// Initialize with the same tasks from Kanban
declare global {
  var tasksStore: Task[] | undefined
  var taskCounter: number | undefined
}

function getTaskNumber(): string {
  if (!global.taskCounter) {
    global.taskCounter = 16 // Starting after T-15
  }
  const num = global.taskCounter++
  return `T-${String(num).padStart(2, '0')}`
}

function getTasks(): Task[] {
  if (!global.tasksStore) {
    const now = new Date().toISOString()
    global.tasksStore = [
      // Done tasks
      {
        id: '1',
        number: 'T-01',
        name: 'Set up project repository',
        description: 'Initialize Git repository, set up branch protection rules, and create initial README',
        status: 'done',
        assignedRole: roles[1],
        estimatedTime: 2,
        actualTime: 1.5,
        sprint: 'Sprint 1',
        priority: 'high',
        completedAt: '2024-03-15T10:00:00Z',
        createdAt: '2024-03-01T08:00:00Z',
        updatedAt: now,
        projectId: 'proj-genplatform-ai'
      },
      {
        id: '2',
        number: 'T-02',
        name: 'Design system architecture',
        description: 'Create high-level system design and component architecture diagrams',
        status: 'done',
        assignedRole: roles[5],
        estimatedTime: 8,
        actualTime: 10,
        sprint: 'Sprint 1',
        priority: 'high',
        completedAt: '2024-03-16T15:30:00Z',
        createdAt: '2024-03-02T09:00:00Z',
        updatedAt: now,
        projectId: 'proj-genplatform-ai'
      },
      {
        id: '3',
        number: 'T-03',
        name: 'Implement authentication system',
        description: 'Set up JWT-based authentication with refresh tokens and secure session management',
        status: 'done',
        assignedRole: roles[1],
        estimatedTime: 16,
        actualTime: 14,
        sprint: 'Sprint 1',
        priority: 'high',
        completedAt: '2024-03-17T18:00:00Z',
        startedAt: '2024-03-16T09:00:00Z',
        createdAt: '2024-03-03T10:00:00Z',
        updatedAt: now,
        projectId: 'proj-genplatform-ai'
      },
      
      // In Progress tasks
      {
        id: '4',
        number: 'T-04',
        name: 'Build dashboard UI components',
        description: 'Create reusable React components for the main dashboard with TypeScript',
        status: 'in_progress',
        assignedRole: roles[0],
        estimatedTime: 20,
        sprint: 'Sprint 2',
        priority: 'high',
        startedAt: '2024-03-19T09:00:00Z',
        createdAt: '2024-03-10T11:00:00Z',
        updatedAt: now,
        projectId: 'proj-genplatform-ai'
      },
      {
        id: '5',
        number: 'T-05',
        name: 'API endpoint development',
        description: 'Develop RESTful API endpoints for user management and data operations',
        status: 'in_progress',
        assignedRole: roles[1],
        estimatedTime: 24,
        sprint: 'Sprint 2',
        priority: 'medium',
        startedAt: '2024-03-18T14:00:00Z',
        createdAt: '2024-03-11T09:00:00Z',
        updatedAt: now,
        projectId: 'proj-genplatform-ai'
      },
      
      // Review tasks
      {
        id: '6',
        number: 'T-06',
        name: 'Security audit preparation',
        description: 'Prepare codebase for security audit, document security measures and create threat model',
        status: 'review',
        assignedRole: roles[2],
        estimatedTime: 12,
        sprint: 'Sprint 2',
        priority: 'high',
        createdAt: '2024-03-12T14:00:00Z',
        updatedAt: now,
        projectId: 'proj-genplatform-ai'
      },
      {
        id: '7',
        number: 'T-07',
        name: 'Database optimization',
        description: 'Optimize database queries, add proper indexes, and implement caching strategy',
        status: 'review',
        assignedRole: roles[1],
        estimatedTime: 16,
        sprint: 'Sprint 2',
        priority: 'medium',
        createdAt: '2024-03-13T10:00:00Z',
        updatedAt: now,
        projectId: 'proj-memory-system'
      },
      
      // Planned tasks
      {
        id: '8',
        number: 'T-08',
        name: 'User onboarding flow',
        description: 'Design and implement a smooth user onboarding experience with tutorials',
        status: 'planned',
        assignedRole: roles[0],
        estimatedTime: 20,
        sprint: 'Sprint 3',
        priority: 'medium',
        createdAt: '2024-03-15T08:00:00Z',
        updatedAt: now,
        projectId: 'proj-genplatform-ai'
      },
      {
        id: '9',
        number: 'T-09',
        name: 'Integration testing',
        description: 'Write comprehensive integration tests for all API endpoints',
        status: 'planned',
        assignedRole: roles[3],
        estimatedTime: 18,
        sprint: 'Sprint 3',
        priority: 'high',
        createdAt: '2024-03-16T13:00:00Z',
        updatedAt: now,
        projectId: 'proj-genplatform-ai'
      },
      {
        id: '10',
        number: 'T-10',
        name: 'Automated testing setup',
        description: 'Set up Jest, React Testing Library, and E2E tests with Playwright',
        status: 'planned',
        assignedRole: roles[3],
        estimatedTime: 24,
        sprint: 'Sprint 3',
        priority: 'high',
        createdAt: '2024-03-17T12:00:00Z',
        updatedAt: now,
        projectId: 'proj-genplatform-ai'
      },
      
      // Backlog tasks
      {
        id: '11',
        number: 'T-11',
        name: 'Performance monitoring',
        description: 'Integrate APM tools and set up performance monitoring dashboards',
        status: 'backlog',
        assignedRole: roles[6],
        estimatedTime: 12,
        sprint: 'Sprint 4',
        priority: 'low',
        createdAt: '2024-03-18T09:00:00Z',
        updatedAt: now,
        projectId: 'proj-memory-system'
      },
      {
        id: '12',
        number: 'T-12',
        name: 'Multi-language support',
        description: 'Implement i18n with support for Arabic, English, and French',
        status: 'backlog',
        assignedRole: roles[0],
        estimatedTime: 30,
        sprint: 'Sprint 4',
        priority: 'medium',
        createdAt: '2024-03-18T10:00:00Z',
        updatedAt: now,
        projectId: 'proj-genplatform-ai'
      },
      {
        id: '13',
        number: 'T-13',
        name: 'Data export functionality',
        description: 'Allow users to export their data in CSV, JSON, and PDF formats',
        status: 'backlog',
        assignedRole: roles[1],
        estimatedTime: 15,
        sprint: 'Sprint 4',
        priority: 'low',
        createdAt: '2024-03-18T11:00:00Z',
        updatedAt: now,
        projectId: 'proj-genplatform-ai'
      },
      {
        id: '14',
        number: 'T-14',
        name: 'AI integration research',
        description: 'Research and prototype AI/ML features for intelligent task suggestions',
        status: 'backlog',
        assignedRole: roles[4],
        estimatedTime: 40,
        sprint: 'Sprint 5',
        priority: 'medium',
        createdAt: '2024-03-18T14:00:00Z',
        updatedAt: now,
        projectId: 'proj-memory-system'
      },
      {
        id: '15',
        number: 'T-15',
        name: 'Mobile app planning',
        description: 'Create technical specification for React Native mobile app',
        status: 'backlog',
        assignedRole: roles[5],
        estimatedTime: 20,
        sprint: 'Sprint 5',
        priority: 'low',
        createdAt: '2024-03-18T15:00:00Z',
        updatedAt: now,
        projectId: 'proj-genplatform-ai'
      }
    ]
  }
  return global.tasksStore
}

// GET /api/tasks - Get all tasks with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const assignedRole = searchParams.get('assignedRole')
    const sprint = searchParams.get('sprint')
    
    let tasks = getTasks()
    
    // Apply filters
    if (projectId) {
      tasks = tasks.filter(task => task.projectId === projectId)
    }
    if (status) {
      tasks = tasks.filter(task => task.status === status)
    }
    if (assignedRole) {
      tasks = tasks.filter(task => task.assignedRole.id === assignedRole)
    }
    if (sprint) {
      tasks = tasks.filter(task => task.sprint === sprint)
    }
    
    return NextResponse.json({
      tasks,
      total: tasks.length
    })
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve tasks' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate with Zod schema
    let validatedData
    try {
      validatedData = taskSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: error.errors.map(e => e.message).join(', ') 
          },
          { status: 400 }
        )
      }
      throw error
    }
    
    const tasks = getTasks()
    
    // Find role
    const assignedRole = validatedData.assignedRole ? 
      roles.find(r => r.id === validatedData.assignedRole) || roles[0] : 
      roles[0]
    
    const now = new Date().toISOString()
    const newTask: Task = {
      id: String(Date.now()),
      number: getTaskNumber(),
      name: validatedData.name.trim(),
      description: validatedData.description?.trim() || '',
      status: body.status || 'backlog',
      assignedRole,
      estimatedTime: body.estimatedTime || 8,
      sprint: body.sprint || 'Backlog',
      priority: body.priority || 'medium',
      projectId: body.projectId,
      createdAt: now,
      updatedAt: now
    }
    
    // Add timestamps based on status
    if (newTask.status === 'in_progress') {
      newTask.startedAt = now
    } else if (newTask.status === 'done') {
      newTask.completedAt = now
      newTask.actualTime = newTask.estimatedTime
    }
    
    tasks.push(newTask)
    
    return NextResponse.json({
      task: newTask,
      message: 'Task created successfully'
    })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}