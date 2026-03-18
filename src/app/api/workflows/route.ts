import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserServer } from '@/lib/access-control'
import { supabaseHelpers } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    // Only OWNER and ADMIN can view workflows
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only OWNER and ADMIN can view workflows.' },
        { status: 403 }
      )
    }

    // Get all workflows with last run info
    const { data: workflows, error: workflowsError } = await supabaseHelpers.supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false })

    if (workflowsError) {
      console.error('Error fetching workflows:', workflowsError)
      return NextResponse.json(
        { error: 'Failed to fetch workflows' }, 
        { status: 500 }
      )
    }

    // Get running workflows count for each workflow
    const workflowsWithRunInfo = await Promise.all(
      (workflows || []).map(async (workflow) => {
        try {
          // Get latest run info
          const { data: latestRun } = await supabaseHelpers.supabase
            .from('workflow_runs')
            .select('status, started_at, completed_at, steps_completed, steps_total')
            .eq('workflow_id', workflow.id)
            .order('started_at', { ascending: false })
            .limit(1)
            .single()

          // Get count of running workflows
          const { count: runningCount } = await supabaseHelpers.supabase
            .from('workflow_runs')
            .select('*', { count: 'exact', head: true })
            .eq('workflow_id', workflow.id)
            .eq('status', 'running')

          // Get count of waiting approval workflows
          const { count: waitingApprovalCount } = await supabaseHelpers.supabase
            .from('workflow_runs')
            .select('*', { count: 'exact', head: true })
            .eq('workflow_id', workflow.id)
            .eq('status', 'waiting_approval')

          // Get total runs count
          const { count: totalRuns } = await supabaseHelpers.supabase
            .from('workflow_runs')
            .select('*', { count: 'exact', head: true })
            .eq('workflow_id', workflow.id)

          // Calculate success rate
          const { count: successfulRuns } = await supabaseHelpers.supabase
            .from('workflow_runs')
            .select('*', { count: 'exact', head: true })
            .eq('workflow_id', workflow.id)
            .eq('status', 'completed')

          const successRate = totalRuns && totalRuns > 0 
            ? Math.round((successfulRuns || 0) / totalRuns * 100) 
            : 0

          return {
            ...workflow,
            latestRun,
            runningCount: runningCount || 0,
            waitingApprovalCount: waitingApprovalCount || 0,
            totalRuns: totalRuns || 0,
            successRate
          }
        } catch (error) {
          console.error(`Error fetching run info for workflow ${workflow.id}:`, error)
          return {
            ...workflow,
            latestRun: null,
            runningCount: 0,
            waitingApprovalCount: 0,
            totalRuns: 0,
            successRate: 0
          }
        }
      })
    )

    // Calculate summary statistics
    const summary = {
      total: workflowsWithRunInfo.length,
      active: workflowsWithRunInfo.filter(w => w.is_active).length,
      running: workflowsWithRunInfo.reduce((sum, w) => sum + w.runningCount, 0),
      waitingApproval: workflowsWithRunInfo.reduce((sum, w) => sum + w.waitingApprovalCount, 0),
      totalRuns: workflowsWithRunInfo.reduce((sum, w) => sum + w.totalRuns, 0)
    }

    return NextResponse.json({
      success: true,
      workflows: workflowsWithRunInfo,
      summary
    })

  } catch (error) {
    console.error('Error in workflows API:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only OWNER and ADMIN can create workflows.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      template_type, 
      trigger_type, 
      schedule, 
      is_active = false,
      config = {}
    } = body

    // Validate required fields
    if (!name || !template_type || !trigger_type) {
      return NextResponse.json(
        { error: 'name, template_type, and trigger_type are required' }, 
        { status: 400 }
      )
    }

    // Validate trigger_type
    const validTriggers = ['manual', 'new_idea', 'task_complete', 'schedule']
    if (!validTriggers.includes(trigger_type)) {
      return NextResponse.json(
        { error: `trigger_type must be one of: ${validTriggers.join(', ')}` }, 
        { status: 400 }
      )
    }

    // Validate schedule if trigger_type is 'schedule'
    if (trigger_type === 'schedule' && !schedule) {
      return NextResponse.json(
        { error: 'schedule is required when trigger_type is "schedule"' }, 
        { status: 400 }
      )
    }

    // Create workflow
    const { data: workflow, error: createError } = await supabaseHelpers.supabase
      .from('workflows')
      .insert({
        name,
        description,
        template_type,
        trigger_type,
        schedule,
        is_active,
        config
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating workflow:', createError)
      return NextResponse.json(
        { error: 'Failed to create workflow' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      workflow,
      message: 'Workflow created successfully'
    })

  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and permissions
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only OWNER and ADMIN can update workflows.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Workflow ID is required' }, 
        { status: 400 }
      )
    }

    // Validate workflow exists
    const { data: existingWorkflow, error: fetchError } = await supabaseHelpers.supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' }, 
        { status: 404 }
      )
    }

    // Update workflow
    const { data: workflow, error: updateError } = await supabaseHelpers.supabase
      .from('workflows')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating workflow:', updateError)
      return NextResponse.json(
        { error: 'Failed to update workflow' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      workflow,
      message: 'Workflow updated successfully'
    })

  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}