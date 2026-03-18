import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/access-control-server'

export interface Improvement {
  id: string
  title: string
  description: string
  category: 'performance' | 'usability' | 'feature' | 'bug-fix' | 'security' | 'infrastructure'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'proposed' | 'reviewing' | 'approved' | 'in-progress' | 'completed' | 'rejected'
  impact: 'low' | 'medium' | 'high'
  effort: 'small' | 'medium' | 'large'
  submittedBy: {
    id: string
    name: string
    avatar?: string
  }
  assignedTo?: {
    id: string
    name: string
    avatar?: string
  }
  submittedAt: string
  updatedAt: string
  completedAt?: string
  votes: {
    upvotes: number
    downvotes: number
    userVote?: 'up' | 'down' | null
  }
  comments: number
  tags: string[]
  estimatedHours?: number
  actualHours?: number
  roi?: number // Return on Investment percentage
  dependencies?: string[]
  businessValue?: string
  technicalComplexity?: number // 1-10 scale
  userStories?: string[]
  acceptanceCriteria?: string[]
}

export interface ImprovementStats {
  total: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  byPriority: Record<string, number>
  avgCompletionTime: number
  totalVotes: number
  completionRate: number
  roiAverage: number
}

interface ImprovementsResponse {
  success: boolean
  data: {
    improvements: Improvement[]
    stats: ImprovementStats
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
  meta?: {
    filters: {
      category?: string
      status?: string
      priority?: string
      search?: string
      submittedBy?: string
      assignedTo?: string
    }
    generated: string
  }
}

// Mock data generator
function generateMockImprovements(count: number = 20): Improvement[] {
  const categories: Improvement['category'][] = ['performance', 'usability', 'feature', 'bug-fix', 'security', 'infrastructure']
  const priorities: Improvement['priority'][] = ['low', 'medium', 'high', 'critical']
  const statuses: Improvement['status'][] = ['proposed', 'reviewing', 'approved', 'in-progress', 'completed', 'rejected']
  const impacts: Improvement['impact'][] = ['low', 'medium', 'high']
  const efforts: Improvement['effort'][] = ['small', 'medium', 'large']
  
  const sampleTitles = [
    'Add Dark Mode Support for PDF Reports',
    'Improve Report Generation Performance',
    'Add Real-time Collaboration Features',
    'Fix Memory Leak in Chart Rendering',
    'Enhanced Security Audit Reports',
    'Implement Caching for Large Datasets',
    'Add Mobile-Responsive Report Views',
    'Optimize Database Query Performance',
    'Add Export to Excel Functionality',
    'Implement Auto-Save for Report Drafts',
    'Add Email Notifications for Report Completion',
    'Improve Error Handling and User Feedback',
    'Add Multi-language Support',
    'Implement Role-Based Access Control',
    'Add Chart Customization Options',
    'Optimize Bundle Size for Faster Loading',
    'Add Keyboard Shortcuts for Power Users',
    'Implement Data Validation Framework',
    'Add Integration with External APIs',
    'Improve Search Performance and Accuracy'
  ]
  
  const sampleDescriptions = [
    'Implement dark mode theme option for PDF exports to improve readability in low-light environments.',
    'Optimize report generation algorithms and implement caching to reduce generation time for large datasets.',
    'Enable real-time collaboration on reports with live editing, comments, and notifications.',
    'Address memory leak issue when rendering multiple charts in weekly/monthly reports.',
    'Expand security audit reports to include compliance checks and vulnerability scanning.',
    'Add intelligent caching layer to improve performance for frequently accessed data.',
    'Create responsive design system for mobile and tablet report viewing.',
    'Optimize slow database queries that impact report generation performance.',
    'Add native Excel export functionality with proper formatting and formulas.',
    'Implement auto-save functionality to prevent data loss during report creation.'
  ]
  
  const users = [
    { id: 'user-1', name: 'Med' },
    { id: 'user-2', name: 'Team Member' },
    { id: 'system', name: 'System Analysis' },
    { id: 'security-team', name: 'Security Team' },
    { id: 'agent-1', name: 'Claude Agent' }
  ]
  
  const tagSets = [
    ['pdf', 'dark-mode', 'accessibility'],
    ['performance', 'optimization', 'caching'],
    ['collaboration', 'real-time', 'team'],
    ['bug', 'memory', 'charts', 'performance'],
    ['security', 'compliance', 'audit'],
    ['mobile', 'responsive', 'ui'],
    ['database', 'queries', 'optimization'],
    ['export', 'excel', 'formatting'],
    ['auto-save', 'ux', 'reliability'],
    ['notifications', 'email', 'alerts']
  ]

  return Array.from({ length: count }, (_, index) => {
    const category = categories[Math.floor(Math.random() * categories.length)]
    const priority = priorities[Math.floor(Math.random() * priorities.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const impact = impacts[Math.floor(Math.random() * impacts.length)]
    const effort = efforts[Math.floor(Math.random() * efforts.length)]
    
    const submittedBy = users[Math.floor(Math.random() * users.length)]
    const assignedTo = status !== 'proposed' && Math.random() > 0.3 
      ? users[Math.floor(Math.random() * users.length)]
      : undefined
    
    const submittedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    const updatedAt = new Date(new Date(submittedAt).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    const completedAt = status === 'completed' 
      ? new Date(new Date(updatedAt).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      : undefined

    const estimatedHours = Math.floor(Math.random() * 80) + 8
    const actualHours = status === 'completed' 
      ? Math.floor(estimatedHours * (0.8 + Math.random() * 0.4))
      : undefined
    
    const upvotes = Math.floor(Math.random() * 15) + 1
    const downvotes = Math.floor(Math.random() * 3)
    
    return {
      id: `imp-${index + 1}`,
      title: sampleTitles[index % sampleTitles.length] || `Improvement ${index + 1}`,
      description: sampleDescriptions[index % sampleDescriptions.length] || `Description for improvement ${index + 1}`,
      category,
      priority,
      status,
      impact,
      effort,
      submittedBy,
      assignedTo,
      submittedAt,
      updatedAt,
      completedAt,
      votes: {
        upvotes,
        downvotes,
        userVote: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : null
      },
      comments: Math.floor(Math.random() * 10),
      tags: tagSets[index % tagSets.length] || ['general'],
      estimatedHours,
      actualHours,
      roi: Math.floor(Math.random() * 50) + 10,
      dependencies: Math.random() > 0.7 ? [`imp-${Math.floor(Math.random() * 5) + 1}`] : undefined,
      businessValue: [
        'Improved user experience',
        'Increased productivity',
        'Better performance',
        'Enhanced security',
        'Cost reduction'
      ][Math.floor(Math.random() * 5)],
      technicalComplexity: Math.floor(Math.random() * 10) + 1,
      userStories: Math.random() > 0.5 ? [
        `As a user, I want ${sampleTitles[index % sampleTitles.length]?.toLowerCase()}`,
        'As a developer, I want better tooling and documentation'
      ] : undefined,
      acceptanceCriteria: Math.random() > 0.5 ? [
        'Feature works across all supported browsers',
        'Performance improvement of at least 20%',
        'All existing tests pass'
      ] : undefined
    }
  })
}

function generateMockStats(improvements: Improvement[]): ImprovementStats {
  const byStatus = improvements.reduce((acc, imp) => {
    acc[imp.status] = (acc[imp.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const byCategory = improvements.reduce((acc, imp) => {
    acc[imp.category] = (acc[imp.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const byPriority = improvements.reduce((acc, imp) => {
    acc[imp.priority] = (acc[imp.priority] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const completedImprovements = improvements.filter(imp => imp.status === 'completed' && imp.actualHours)
  const avgCompletionTime = completedImprovements.length > 0
    ? Math.round(completedImprovements.reduce((sum, imp) => sum + (imp.actualHours || 0), 0) / completedImprovements.length)
    : 0
  
  const totalVotes = improvements.reduce((sum, imp) => sum + imp.votes.upvotes + imp.votes.downvotes, 0)
  
  const completionRate = improvements.length > 0
    ? Math.round((byStatus.completed || 0) / improvements.length * 100)
    : 0
  
  const roiAverage = improvements.filter(imp => imp.roi).length > 0
    ? Math.round(improvements.reduce((sum, imp) => sum + (imp.roi || 0), 0) / improvements.filter(imp => imp.roi).length)
    : 0

  return {
    total: improvements.length,
    byStatus,
    byCategory,
    byPriority,
    avgCompletionTime,
    totalVotes,
    completionRate,
    roiAverage
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const submittedBy = searchParams.get('submittedBy')
    const assignedTo = searchParams.get('assignedTo')
    const sortBy = searchParams.get('sortBy') || 'submittedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeCompleted = searchParams.get('includeCompleted') !== 'false'

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Generate mock data
    let improvements = generateMockImprovements(50)

    // Apply filters
    if (category && category !== 'all') {
      improvements = improvements.filter(imp => imp.category === category)
    }

    if (status && status !== 'all') {
      improvements = improvements.filter(imp => imp.status === status)
    }

    if (priority && priority !== 'all') {
      improvements = improvements.filter(imp => imp.priority === priority)
    }

    if (!includeCompleted) {
      improvements = improvements.filter(imp => imp.status !== 'completed')
    }

    if (submittedBy && submittedBy !== 'all') {
      improvements = improvements.filter(imp => imp.submittedBy.id === submittedBy)
    }

    if (assignedTo && assignedTo !== 'all') {
      improvements = improvements.filter(imp => imp.assignedTo?.id === assignedTo)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      improvements = improvements.filter(imp =>
        imp.title.toLowerCase().includes(searchLower) ||
        imp.description.toLowerCase().includes(searchLower) ||
        imp.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        imp.businessValue?.toLowerCase().includes(searchLower)
      )
    }

    // Sort improvements
    improvements.sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortBy) {
        case 'submittedAt':
          aVal = new Date(a.submittedAt).getTime()
          bVal = new Date(b.submittedAt).getTime()
          break
        case 'updatedAt':
          aVal = new Date(a.updatedAt).getTime()
          bVal = new Date(b.updatedAt).getTime()
          break
        case 'title':
          aVal = a.title.toLowerCase()
          bVal = b.title.toLowerCase()
          break
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          aVal = priorityOrder[a.priority]
          bVal = priorityOrder[b.priority]
          break
        case 'votes':
          aVal = a.votes.upvotes - a.votes.downvotes
          bVal = b.votes.upvotes - b.votes.downvotes
          break
        case 'impact':
          const impactOrder = { high: 3, medium: 2, low: 1 }
          aVal = impactOrder[a.impact]
          bVal = impactOrder[b.impact]
          break
        case 'roi':
          aVal = a.roi || 0
          bVal = b.roi || 0
          break
        case 'estimatedHours':
          aVal = a.estimatedHours || 0
          bVal = b.estimatedHours || 0
          break
        default:
          aVal = new Date(a.submittedAt).getTime()
          bVal = new Date(b.submittedAt).getTime()
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })

    // Apply pagination
    const total = improvements.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const paginatedImprovements = improvements.slice(offset, offset + limit)

    // Generate stats
    const stats = generateMockStats(improvements)

    const response: ImprovementsResponse = {
      success: true,
      data: {
        improvements: paginatedImprovements,
        stats,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      meta: {
        filters: {
          ...(category && { category }),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(search && { search }),
          ...(submittedBy && { submittedBy }),
          ...(assignedTo && { assignedTo })
        },
        generated: new Date().toISOString()
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching improvements:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint for creating new improvements
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      category, 
      priority = 'medium',
      impact = 'medium',
      effort = 'medium',
      tags = [],
      estimatedHours,
      businessValue,
      technicalComplexity,
      userStories = [],
      acceptanceCriteria = []
    } = body

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, description, category' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['performance', 'usability', 'feature', 'bug-fix', 'security', 'infrastructure']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Create new improvement
    const newImprovement: Improvement = {
      id: `imp-${Date.now()}`,
      title,
      description,
      category,
      priority,
      status: 'proposed',
      impact,
      effort,
      submittedBy: {
        id: currentUser.id,
        name: currentUser.name || 'User'
      },
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      votes: {
        upvotes: 0,
        downvotes: 0,
        userVote: null
      },
      comments: 0,
      tags: Array.isArray(tags) ? tags : [],
      estimatedHours: estimatedHours ? parseInt(estimatedHours) : undefined,
      businessValue,
      technicalComplexity: technicalComplexity ? parseInt(technicalComplexity) : undefined,
      userStories: Array.isArray(userStories) ? userStories : [],
      acceptanceCriteria: Array.isArray(acceptanceCriteria) ? acceptanceCriteria : []
    }

    // In a real implementation, this would:
    // 1. Save to database
    // 2. Send notifications to relevant team members
    // 3. Trigger review workflows

    return NextResponse.json({
      success: true,
      data: newImprovement,
      message: 'Improvement proposal submitted successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating improvement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create improvement' },
      { status: 500 }
    )
  }
}