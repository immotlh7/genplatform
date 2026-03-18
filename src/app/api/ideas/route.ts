import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { triggerNewIdeaWorkflows } from '@/lib/workflow-triggers'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: ideas, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching ideas:', error)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch ideas',
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ideas: ideas || [],
      count: ideas?.length || 0
    })

  } catch (error) {
    console.error('Ideas GET API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ideaData = await req.json()

    console.log('💡 Creating new idea:', ideaData.title)

    // Validate required fields
    if (!ideaData.title || !ideaData.description) {
      return NextResponse.json({
        success: false,
        message: 'Title and description are required'
      }, { status: 400 })
    }

    // Create the idea
    const { data: idea, error: createError } = await supabase
      .from('ideas')
      .insert({
        title: ideaData.title,
        description: ideaData.description,
        category: ideaData.category || 'general',
        priority: ideaData.priority || 'MEDIUM',
        status: ideaData.status || 'proposed',
        tags: ideaData.tags || [],
        metadata: ideaData.metadata || {},
        user_id: ideaData.user_id || null
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating idea:', createError)
      return NextResponse.json({
        success: false,
        message: 'Failed to create idea',
        error: createError.message
      }, { status: 500 })
    }

    console.log(`✅ Created idea: ${idea.id}`)

    // Task 7-17: Check if "Idea to MVP" workflow is active and trigger it
    try {
      const workflowTriggerResult = await triggerNewIdeaWorkflows(
        idea.id, 
        idea, 
        ideaData.user_id
      )

      if (workflowTriggerResult.success && workflowTriggerResult.triggeredWorkflows.length > 0) {
        console.log(`🚀 Triggered ${workflowTriggerResult.triggeredWorkflows.length} workflow(s) for idea: ${idea.id}`)
        
        // Add workflow trigger information to response
        return NextResponse.json({
          success: true,
          message: 'Idea created successfully',
          idea: {
            ...idea,
            automatedPipelineStarted: true,
            triggeredWorkflows: workflowTriggerResult.triggeredWorkflows
          },
          automation: {
            enabled: true,
            message: workflowTriggerResult.message,
            triggeredWorkflows: workflowTriggerResult.triggeredWorkflows
          }
        })
      } else {
        // No workflows triggered, return standard response
        return NextResponse.json({
          success: true,
          message: 'Idea created successfully',
          idea: {
            ...idea,
            automatedPipelineStarted: false
          },
          automation: {
            enabled: false,
            message: 'No automated workflows are currently active for new ideas'
          }
        })
      }

    } catch (triggerError) {
      console.error('Error triggering workflows for new idea:', triggerError)
      
      // Don't fail the idea creation if workflow trigger fails
      return NextResponse.json({
        success: true,
        message: 'Idea created successfully (automation trigger failed)',
        idea: {
          ...idea,
          automatedPipelineStarted: false
        },
        automation: {
          enabled: false,
          error: 'Failed to trigger automated workflows',
          details: triggerError instanceof Error ? triggerError.message : 'Unknown error'
        }
      })
    }

  } catch (error) {
    console.error('Ideas POST API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Idea ID is required'
      }, { status: 400 })
    }

    console.log(`🔄 Updating idea: ${id}`)

    const { data: idea, error: updateError } = await supabase
      .from('ideas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating idea:', updateError)
      return NextResponse.json({
        success: false,
        message: 'Failed to update idea',
        error: updateError.message
      }, { status: 500 })
    }

    console.log(`✅ Updated idea: ${idea.id}`)

    return NextResponse.json({
      success: true,
      message: 'Idea updated successfully',
      idea
    })

  } catch (error) {
    console.error('Ideas PATCH API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}