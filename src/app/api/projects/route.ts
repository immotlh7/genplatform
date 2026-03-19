import { NextRequest, NextResponse } from 'next/server'

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  progress: number // 0-100
  priority: 'high' | 'medium' | 'low'
  githubUrl?: string
  previewUrl?: string
  techStack: string[]
  createdAt: string
  lastActivity: string
}

// Use global store to share with [id]/route.ts
declare global {
  var projectsStore: Project[] | undefined
}

// Initialize projects store
if (!global.projectsStore) {
  global.projectsStore = [
    {
      id: 'proj-genplatform-ai',
      name: 'GenPlatform.ai',
      description: 'AI-powered business intelligence platform with real-time analytics and automation',
      status: 'active',
      progress: 75,
      priority: 'high',
      githubUrl: 'https://github.com/immotlh7/genplatform',
      previewUrl: 'https://app.gen3.ai',
      techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Bridge API', 'PM2'],
      createdAt: '2024-01-15T08:00:00Z',
      lastActivity: new Date().toISOString()
    },
    {
      id: 'proj-agent-skills',
      name: 'Agent Skills Library',
      description: 'Comprehensive library of AI agent skills for task automation and workflow optimization',
      status: 'active',
      progress: 45,
      priority: 'medium',
      githubUrl: 'https://github.com/openclaw/skills',
      techStack: ['Node.js', 'TypeScript', 'OpenClaw SDK', 'Markdown'],
      createdAt: '2024-02-20T10:30:00Z',
      lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    },
    {
      id: 'proj-memory-system',
      name: 'Distributed Memory System',
      description: 'Scalable distributed memory storage for AI agents with real-time synchronization',
      status: 'paused',
      progress: 20,
      priority: 'low',
      techStack: ['Rust', 'Redis', 'WebSocket', 'Protocol Buffers'],
      createdAt: '2024-03-01T14:00:00Z',
      lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
    }
  ]
}

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const projects = global.projectsStore!
    
    // Filter out archived projects unless explicitly requested
    const url = new URL(request.url)
    const includeArchived = url.searchParams.get('archived') === 'true'
    const status = url.searchParams.get('status')
    const priority = url.searchParams.get('priority')
    const sort = url.searchParams.get('sort') || 'lastActivity'
    const order = url.searchParams.get('order') || 'desc'

    let filteredProjects = [...projects]

    // Apply filters
    if (!includeArchived) {
      filteredProjects = filteredProjects.filter(p => p.status !== 'archived')
    }

    if (status) {
      filteredProjects = filteredProjects.filter(p => p.status === status)
    }

    if (priority) {
      filteredProjects = filteredProjects.filter(p => p.priority === priority)
    }

    // Apply sorting
    filteredProjects.sort((a, b) => {
      let compareValue = 0
      
      switch (sort) {
        case 'name':
          compareValue = a.name.localeCompare(b.name)
          break
        case 'progress':
          compareValue = a.progress - b.progress
          break
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          compareValue = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'createdAt':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'lastActivity':
        default:
          compareValue = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime()
          break
      }

      return order === 'desc' ? -compareValue : compareValue
    })

    return NextResponse.json({
      projects: filteredProjects,
      total: filteredProjects.length
    })
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const projects = global.projectsStore!
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    // Validate name length
    if (body.name.length < 3 || body.name.length > 100) {
      return NextResponse.json(
        { error: 'Project name must be between 3 and 100 characters' },
        { status: 400 }
      )
    }

    // Check for duplicate names
    if (projects.some(p => p.name.toLowerCase() === body.name.toLowerCase())) {
      return NextResponse.json(
        { error: 'Project with this name already exists' },
        { status: 409 }
      )
    }

    // Validate priority if provided
    const validPriorities = ['high', 'medium', 'low']
    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { error: 'Priority must be high, medium, or low' },
        { status: 400 }
      )
    }

    // Create new project
    const newProject: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: body.name.trim(),
      description: body.description || '',
      status: 'active',
      progress: 0,
      priority: body.priority || 'medium',
      githubUrl: body.githubUrl || undefined,
      previewUrl: body.previewUrl || undefined,
      techStack: body.techStack || [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    }

    // Add to projects array
    projects.push(newProject)

    return NextResponse.json({
      project: newProject,
      message: 'Project created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}