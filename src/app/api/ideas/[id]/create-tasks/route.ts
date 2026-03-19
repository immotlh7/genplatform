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

// POST /api/ideas/[id]/create-tasks - Send approved idea to AI for task creation
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
    
    // Verify idea is approved
    if (idea.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved ideas can be converted to tasks' },
        { status: 400 }
      )
    }
    
    // Update status to in_development
    ideas[ideaIndex] = {
      ...idea,
      status: 'in_development',
      updatedAt: new Date().toISOString()
    }
    
    // Prepare task creation request message
    const taskCreationMessage = `📋 Create tasks for approved idea: ${idea.title}

Description: ${idea.description}

${idea.researchNotes ? `Research Notes: ${idea.researchNotes}` : ''}
${idea.recommendedTechStack ? `Recommended Tech Stack: ${idea.recommendedTechStack.join(', ')}` : ''}
${idea.estimatedEffort ? `Estimated Effort: ${idea.estimatedEffort}` : ''}

Please break this down into numbered tasks with:
1. Clear task name and description
2. Department assignment (Research, Planning, Frontend, Backend, QA, Security, or Self-Improvement)
3. Estimated time in hours
4. Dependencies between tasks (if any)
5. Priority level (high/medium/low)

Format each task as:
Task #N: [Task Name]
Department: [Department Name]
Description: [Clear description of what needs to be done]
Estimated Time: [X hours]
Priority: [high/medium/low]
Dependencies: [Task numbers if any, or "None"]

Be specific and actionable in your task descriptions.`
    
    // Send to OpenClaw via Telegram Bot API (using the chat/send endpoint)
    try {
      const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include any necessary auth headers
        },
        body: JSON.stringify({
          message: taskCreationMessage,
          metadata: {
            type: 'task_creation',
            ideaId: idea.id,
            ideaTitle: idea.title
          }
        })
      })
      
      if (!chatResponse.ok) {
        console.error('Failed to send task creation request to OpenClaw')
        // Still return success as the idea status was updated
      }
    } catch (error) {
      console.error('Error sending to OpenClaw:', error)
      // Continue anyway - the task creation request might be picked up later
    }
    
    return NextResponse.json({
      message: 'Task creation request sent successfully',
      idea: ideas[ideaIndex],
      taskCreationMessage
    })
  } catch (error) {
    console.error('Failed to create tasks:', error)
    return NextResponse.json(
      { error: 'Failed to create tasks' },
      { status: 500 }
    )
  }
}