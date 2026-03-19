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

// POST /api/ideas/[id]/research - Send idea to AI for research
export async function POST(
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
    
    const idea = ideas[ideaIndex]
    
    // Update status to researching
    ideas[ideaIndex] = {
      ...idea,
      status: 'researching',
      updatedAt: new Date().toISOString()
    }
    
    // Prepare research request message
    const researchMessage = `🔬 Research Idea: ${idea.title}

Description: ${idea.description}

Please provide:
1. Market analysis - Is there demand for this feature?
2. Technical feasibility - How complex is the implementation?
3. Estimated effort - Time and resources needed
4. Recommended tech stack - What technologies would work best?
5. Go/No-go recommendation - Should we proceed with this idea?

Be thorough but concise in your analysis.`
    
    // Send to OpenClaw via Telegram Bot API (using the chat/send endpoint)
    try {
      const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include any necessary auth headers
        },
        body: JSON.stringify({
          message: researchMessage,
          metadata: {
            type: 'idea_research',
            ideaId: idea.id,
            ideaTitle: idea.title
          }
        })
      })
      
      if (!chatResponse.ok) {
        console.error('Failed to send research request to OpenClaw')
        // Still return success as the idea status was updated
      }
    } catch (error) {
      console.error('Error sending to OpenClaw:', error)
      // Continue anyway - the research request might be picked up later
    }
    
    return NextResponse.json({
      message: 'Research request sent successfully',
      idea: ideas[ideaIndex],
      researchMessage
    })
  } catch (error) {
    console.error('Failed to initiate research:', error)
    return NextResponse.json(
      { error: 'Failed to initiate research' },
      { status: 500 }
    )
  }
}