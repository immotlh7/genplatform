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
  teamSize?: number
  tasksCompleted?: number
  totalTasks?: number
  lastDeployedAt?: string
}

// This will be shared with the main projects route (temporary until we move to Supabase)
// In production, this would be in a database
declare global {
  var projectsStore: Project[] | undefined
}

// Helper to get projects from the parent route's memory
function getProjects(): Project[] {
  if (!global.projectsStore) {
    // Initialize with the same default projects if not already set
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
        lastActivity: new Date().toISOString(),
        teamSize: 4,
        tasksCompleted: 12,
        totalTasks: 16,
        lastDeployedAt: new Date().toISOString()
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
        lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        teamSize: 2,
        tasksCompleted: 8,
        totalTasks: 18
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
        lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        teamSize: 3,
        tasksCompleted: 4,
        totalTasks: 20
      }
    ]
  }
  return global.projectsStore
}

// GET /api/projects/[id] - Get single project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projects = getProjects()
    const project = projects.find(p => p.id === params.id)

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Return the project directly, not wrapped in an object
    return NextResponse.json(project)
  } catch (error) {
    console.error('Failed to fetch project:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve project' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projects = getProjects()
    const projectIndex = projects.findIndex(p => p.id === params.id)

    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const currentProject = projects[projectIndex]

    // Validate updates
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.length < 3 || body.name.length > 100) {
        return NextResponse.json(
          { error: 'Project name must be between 3 and 100 characters' },
          { status: 400 }
        )
      }

      // Check for duplicate names (excluding current project)
      if (projects.some(p => p.id !== params.id && p.name.toLowerCase() === body.name.toLowerCase())) {
        return NextResponse.json(
          { error: 'Project with this name already exists' },
          { status: 409 }
        )
      }
    }

    if (body.status !== undefined) {
      const validStatuses = ['active', 'paused', 'completed', 'archived']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        )
      }
    }

    if (body.priority !== undefined) {
      const validPriorities = ['high', 'medium', 'low']
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json(
          { error: 'Priority must be high, medium, or low' },
          { status: 400 }
        )
      }
    }

    if (body.progress !== undefined) {
      if (typeof body.progress !== 'number' || body.progress < 0 || body.progress > 100) {
        return NextResponse.json(
          { error: 'Progress must be a number between 0 and 100' },
          { status: 400 }
        )
      }
    }

    // Update project
    const updatedProject: Project = {
      ...currentProject,
      name: body.name !== undefined ? body.name.trim() : currentProject.name,
      description: body.description !== undefined ? body.description : currentProject.description,
      status: body.status !== undefined ? body.status : currentProject.status,
      progress: body.progress !== undefined ? Math.round(body.progress) : currentProject.progress,
      priority: body.priority !== undefined ? body.priority : currentProject.priority,
      githubUrl: body.githubUrl !== undefined ? body.githubUrl || undefined : currentProject.githubUrl,
      previewUrl: body.previewUrl !== undefined ? body.previewUrl || undefined : currentProject.previewUrl,
      techStack: body.techStack !== undefined ? body.techStack : currentProject.techStack,
      lastActivity: new Date().toISOString()
    }

    // Replace in array
    projects[projectIndex] = updatedProject

    // Return the updated project directly
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Failed to update project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Archive project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projects = getProjects()
    const projectIndex = projects.findIndex(p => p.id === params.id)

    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Archive the project instead of deleting
    projects[projectIndex] = {
      ...projects[projectIndex],
      status: 'archived',
      lastActivity: new Date().toISOString()
    }

    return NextResponse.json({
      message: 'Project archived successfully',
      project: projects[projectIndex]
    })
  } catch (error) {
    console.error('Failed to archive project:', error)
    return NextResponse.json(
      { error: 'Failed to archive project' },
      { status: 500 }
    )
  }
}