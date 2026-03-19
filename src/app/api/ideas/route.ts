import { NextRequest, NextResponse } from 'next/server'
import { ideaSchema } from '@/lib/validators'
import { z } from 'zod'

export interface Idea {
  id: string
  title: string
  description: string
  status: 'pending' | 'researching' | 'planning' | 'approved' | 'in_development' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  votes: number
  submittedBy: string
  submittedAt: string
  researchNotes?: string
  technicalFeasibility?: 'low' | 'medium' | 'high'
  estimatedEffort?: string
  recommendedTechStack?: string[]
  goNoGoRecommendation?: 'go' | 'no-go' | 'needs-review'
  category?: 'feature' | 'improvement' | 'bug' | 'research'
  createdAt: string
  updatedAt: string
}

// Global in-memory store for ideas
declare global {
  var ideasStore: Idea[] | undefined
}

// Initialize with sample ideas
if (!global.ideasStore) {
  global.ideasStore = [
    {
      id: 'idea-1',
      title: 'AI-Powered Code Review Assistant',
      description: 'Integrate AI to automatically review code changes, suggest improvements, and catch potential bugs before they reach production.',
      status: 'approved',
      priority: 'high',
      category: 'feature',
      votes: 15,
      submittedBy: 'Med',
      submittedAt: '2024-01-15T10:00:00Z',
      researchNotes: 'Strong market demand. Multiple API options available (GitHub Copilot, CodeRabbit). High technical feasibility.',
      technicalFeasibility: 'high',
      estimatedEffort: '2-3 weeks',
      recommendedTechStack: ['GitHub API', 'OpenAI API', 'Node.js', 'TypeScript'],
      goNoGoRecommendation: 'go',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-16T14:30:00Z'
    },
    {
      id: 'idea-2',
      title: 'Real-time Collaboration Canvas',
      description: 'Build a collaborative whiteboard where team members can brainstorm, draw diagrams, and share ideas in real-time during video calls.',
      status: 'researching',
      priority: 'medium',
      category: 'feature',
      votes: 8,
      submittedBy: 'Sarah',
      submittedAt: '2024-01-20T09:00:00Z',
      createdAt: '2024-01-20T09:00:00Z',
      updatedAt: '2024-01-20T09:00:00Z'
    },
    {
      id: 'idea-3',
      title: 'Mobile App Performance Dashboard',
      description: 'Create a comprehensive dashboard to monitor mobile app performance metrics, crash reports, and user behavior analytics in real-time.',
      status: 'planning',
      priority: 'high',
      category: 'improvement',
      votes: 12,
      submittedBy: 'Ahmed',
      submittedAt: '2024-01-18T11:00:00Z',
      researchNotes: 'Growing need for mobile analytics. Can integrate with Firebase, Sentry, and custom metrics.',
      technicalFeasibility: 'medium',
      estimatedEffort: '4 weeks',
      recommendedTechStack: ['React Native', 'Firebase', 'Chart.js', 'WebSocket'],
      createdAt: '2024-01-18T11:00:00Z',
      updatedAt: '2024-01-19T15:00:00Z'
    },
    {
      id: 'idea-4',
      title: 'Voice-Controlled Task Management',
      description: 'Enable users to create, update, and manage tasks using voice commands through integration with voice assistants.',
      status: 'pending',
      priority: 'low',
      category: 'feature',
      votes: 5,
      submittedBy: 'Lisa',
      submittedAt: '2024-01-22T13:00:00Z',
      createdAt: '2024-01-22T13:00:00Z',
      updatedAt: '2024-01-22T13:00:00Z'
    }
  ]
}

function getIdeas(): Idea[] {
  return global.ideasStore || []
}

// GET /api/ideas
export async function GET() {
  try {
    const ideas = getIdeas()
    
    // Calculate statistics
    const stats = {
      total: ideas.length,
      pending: ideas.filter(i => i.status === 'pending').length,
      researching: ideas.filter(i => i.status === 'researching').length,
      planning: ideas.filter(i => i.status === 'planning').length,
      approved: ideas.filter(i => i.status === 'approved').length,
      inDevelopment: ideas.filter(i => i.status === 'in_development').length,
      rejected: ideas.filter(i => i.status === 'rejected').length,
      highPriority: ideas.filter(i => i.priority === 'high').length,
      totalVotes: ideas.reduce((sum, i) => sum + i.votes, 0)
    }
    
    return NextResponse.json({
      ideas: ideas.sort((a, b) => b.votes - a.votes),
      stats
    })
  } catch (error) {
    console.error('Failed to fetch ideas:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve ideas' },
      { status: 500 }
    )
  }
}

// POST /api/ideas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate with Zod schema
    let validatedData
    try {
      validatedData = ideaSchema.parse(body)
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
    
    const ideas = getIdeas()
    const now = new Date().toISOString()
    
    // Create new idea
    const newIdea: Idea = {
      id: `idea-${Date.now()}`,
      title: validatedData.title.trim(),
      description: validatedData.description?.trim() || '',
      status: 'pending',
      priority: validatedData.priority,
      category: validatedData.category,
      votes: 0,
      submittedBy: body.submittedBy || 'Anonymous',
      submittedAt: now,
      createdAt: now,
      updatedAt: now
    }
    
    // Add to store
    ideas.push(newIdea)
    
    return NextResponse.json({
      idea: newIdea,
      message: 'Idea created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create idea:', error)
    return NextResponse.json(
      { error: 'Failed to create idea' },
      { status: 500 }
    )
  }
}