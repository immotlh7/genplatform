import { NextRequest, NextResponse } from 'next/server'

interface Improvement {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'approved' | 'rejected' | 'implemented'
  estimatedImpact: 'high' | 'medium' | 'low'
  estimatedEffort: 'high' | 'medium' | 'low'
  category: 'performance' | 'security' | 'usability' | 'feature' | 'bug'
  createdAt: string
  updatedAt: string
  reviewedBy?: string
  reviewedAt?: string
  implementedAt?: string
}

// Mock data for development
const MOCK_IMPROVEMENTS: Improvement[] = [
  {
    id: '1',
    title: 'Optimize Database Query Performance',
    description: 'Add indexes to frequently queried columns in project_tasks table to reduce response times from 2.3s to <500ms',
    priority: 'high',
    status: 'pending',
    estimatedImpact: 'high',
    estimatedEffort: 'low',
    category: 'performance',
    createdAt: '2026-03-18T20:00:00Z',
    updatedAt: '2026-03-18T20:00:00Z'
  },
  {
    id: '2',
    title: 'Implement Caching for Static Assets',
    description: 'Add Redis caching layer for API responses and static content to improve load times',
    priority: 'medium',
    status: 'approved',
    estimatedImpact: 'medium',
    estimatedEffort: 'medium',
    category: 'performance',
    createdAt: '2026-03-18T18:30:00Z',
    updatedAt: '2026-03-18T19:15:00Z',
    reviewedBy: 'Med',
    reviewedAt: '2026-03-18T19:15:00Z'
  },
  {
    id: '3',
    title: 'Add Two-Factor Authentication',
    description: 'Implement 2FA using TOTP for enhanced security on all user accounts',
    priority: 'high',
    status: 'pending',
    estimatedImpact: 'high',
    estimatedEffort: 'high',
    category: 'security',
    createdAt: '2026-03-18T16:45:00Z',
    updatedAt: '2026-03-18T16:45:00Z'
  },
  {
    id: '4',
    title: 'Improve Mobile Navigation',
    description: 'Enhance mobile navigation with better touch targets and gesture support',
    priority: 'medium',
    status: 'rejected',
    estimatedImpact: 'medium',
    estimatedEffort: 'low',
    category: 'usability',
    createdAt: '2026-03-18T14:20:00Z',
    updatedAt: '2026-03-18T15:30:00Z',
    reviewedBy: 'System',
    reviewedAt: '2026-03-18T15:30:00Z'
  },
  {
    id: '5',
    title: 'Auto-save Draft Reports',
    description: 'Automatically save report drafts every 30 seconds to prevent data loss',
    priority: 'low',
    status: 'implemented',
    estimatedImpact: 'medium',
    estimatedEffort: 'low',
    category: 'feature',
    createdAt: '2026-03-17T12:00:00Z',
    updatedAt: '2026-03-18T10:00:00Z',
    reviewedBy: 'Med',
    reviewedAt: '2026-03-17T14:00:00Z',
    implementedAt: '2026-03-18T10:00:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let filteredImprovements = [...MOCK_IMPROVEMENTS]

    // Apply filters
    if (status) {
      filteredImprovements = filteredImprovements.filter(imp => imp.status === status)
    }
    if (priority) {
      filteredImprovements = filteredImprovements.filter(imp => imp.priority === priority)
    }
    if (category) {
      filteredImprovements = filteredImprovements.filter(imp => imp.category === category)
    }

    // Sort by priority (high > medium > low) then by creation date (newest first)
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    filteredImprovements.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Apply pagination
    const total = filteredImprovements.length
    const improvements = filteredImprovements.slice(offset, offset + limit)

    // Calculate aggregations
    const aggregations = {
      totalImprovements: total,
      pendingImprovements: filteredImprovements.filter(i => i.status === 'pending').length,
      approvedImprovements: filteredImprovements.filter(i => i.status === 'approved').length,
      implementedImprovements: filteredImprovements.filter(i => i.status === 'implemented').length,
      rejectedImprovements: filteredImprovements.filter(i => i.status === 'rejected').length,
      categoryBreakdown: {
        performance: filteredImprovements.filter(i => i.category === 'performance').length,
        security: filteredImprovements.filter(i => i.category === 'security').length,
        usability: filteredImprovements.filter(i => i.category === 'usability').length,
        feature: filteredImprovements.filter(i => i.category === 'feature').length,
        bug: filteredImprovements.filter(i => i.category === 'bug').length
      },
      priorityBreakdown: {
        high: filteredImprovements.filter(i => i.priority === 'high').length,
        medium: filteredImprovements.filter(i => i.priority === 'medium').length,
        low: filteredImprovements.filter(i => i.priority === 'low').length
      }
    }

    return NextResponse.json({
      success: true,
      data: improvements,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      aggregations
    })

  } catch (error) {
    console.error('Error fetching improvements:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch improvements',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, priority = 'medium', category, estimatedImpact = 'medium', estimatedEffort = 'medium' } = body

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      )
    }

    // Create new improvement
    const newImprovement: Improvement = {
      id: Date.now().toString(),
      title,
      description,
      priority,
      status: 'pending',
      estimatedImpact,
      estimatedEffort,
      category: category || 'feature',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: newImprovement,
      message: 'Improvement suggestion created successfully'
    })

  } catch (error) {
    console.error('Error creating improvement:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create improvement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}