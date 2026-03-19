import { NextRequest, NextResponse } from 'next/server'

interface Idea {
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
  createdAt: string
  updatedAt: string
}

// Get ideas from the global store
declare global {
  var ideasStore: Idea[] | undefined
}

function getIdeas(): Idea[] {
  return global.ideasStore || []
}

// GET /api/ideas/[id] - Get single idea
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const ideas = getIdeas()
    const idea = ideas.find(i => i.id === params.id)
    
    if (!idea) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(idea)
  } catch (error) {
    console.error('Failed to fetch idea:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve idea' },
      { status: 500 }
    )
  }
}

// PUT /api/ideas/[id] - Update idea
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const ideas = getIdeas()
    const ideaIndex = ideas.findIndex(i => i.id === params.id)
    
    if (ideaIndex === -1) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    const currentIdea = ideas[ideaIndex]
    const now = new Date().toISOString()
    
    // Build updated idea
    const updatedIdea: Idea = {
      ...currentIdea,
      updatedAt: now
    }
    
    // Update fields if provided
    if (body.status !== undefined) {
      const validStatuses = ['pending', 'researching', 'planning', 'approved', 'in_development', 'rejected']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        )
      }
      updatedIdea.status = body.status
    }
    
    if (body.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high']
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json(
          { error: 'Invalid priority value' },
          { status: 400 }
        )
      }
      updatedIdea.priority = body.priority
    }
    
    if (body.votes !== undefined) {
      if (typeof body.votes !== 'number' || body.votes < 0) {
        return NextResponse.json(
          { error: 'Votes must be a non-negative number' },
          { status: 400 }
        )
      }
      updatedIdea.votes = body.votes
    }
    
    if (body.researchNotes !== undefined) {
      updatedIdea.researchNotes = body.researchNotes
    }
    
    if (body.technicalFeasibility !== undefined) {
      const validFeasibility = ['low', 'medium', 'high']
      if (!validFeasibility.includes(body.technicalFeasibility)) {
        return NextResponse.json(
          { error: 'Invalid technical feasibility value' },
          { status: 400 }
        )
      }
      updatedIdea.technicalFeasibility = body.technicalFeasibility
    }
    
    if (body.estimatedEffort !== undefined) {
      updatedIdea.estimatedEffort = body.estimatedEffort
    }
    
    if (body.recommendedTechStack !== undefined) {
      if (!Array.isArray(body.recommendedTechStack)) {
        return NextResponse.json(
          { error: 'Recommended tech stack must be an array' },
          { status: 400 }
        )
      }
      updatedIdea.recommendedTechStack = body.recommendedTechStack
    }
    
    if (body.goNoGoRecommendation !== undefined) {
      const validRecommendations = ['go', 'no-go', 'needs-review']
      if (!validRecommendations.includes(body.goNoGoRecommendation)) {
        return NextResponse.json(
          { error: 'Invalid go/no-go recommendation value' },
          { status: 400 }
        )
      }
      updatedIdea.goNoGoRecommendation = body.goNoGoRecommendation
    }
    
    // Replace in array
    ideas[ideaIndex] = updatedIdea
    
    return NextResponse.json({
      idea: updatedIdea,
      message: 'Idea updated successfully'
    })
  } catch (error) {
    console.error('Failed to update idea:', error)
    return NextResponse.json(
      { error: 'Failed to update idea' },
      { status: 500 }
    )
  }
}

// DELETE /api/ideas/[id] - Delete idea
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const ideas = getIdeas()
    const ideaIndex = ideas.findIndex(i => i.id === params.id)
    
    if (ideaIndex === -1) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      )
    }
    
    // Remove idea from array
    const deletedIdea = ideas.splice(ideaIndex, 1)[0]
    
    return NextResponse.json({
      message: 'Idea deleted successfully',
      idea: deletedIdea
    })
  } catch (error) {
    console.error('Failed to delete idea:', error)
    return NextResponse.json(
      { error: 'Failed to delete idea' },
      { status: 500 }
    )
  }
}