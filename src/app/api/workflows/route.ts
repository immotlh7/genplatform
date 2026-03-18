import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    console.log('📋 Fetching all workflows with run information')

    // Fetch all workflows with their last run information
    const { data: workflows, error: workflowsError } = await supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false })

    if (workflowsError) {
      console.error('Error fetching workflows:', workflowsError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch workflows',
        error: workflowsError.message
      }, { status: 500 })
    }

    // Enrich workflows with additional run statistics
    const enrichedWorkflows = await Promise.all(
      (workflows || []).map(async (workflow) => {
        try {
          // Get total runs count
          const { count: totalRuns } = await supabase
            .from('workflow_runs')
            .select('*', { count: 'exact', head: true })
            .eq('workflow_id', workflow.id)

          // Get successful runs count
          const { count: successfulRuns } = await supabase
            .from('workflow_runs')
            .select('*', { count: 'exact', head: true })
            .eq('workflow_id', workflow.id)
            .eq('status', 'completed')

          // Get failed runs count
          const { count: failedRuns } = await supabase
            .from('workflow_runs')
            .select('*', { count: 'exact', head: true })
            .eq('workflow_id', workflow.id)
            .eq('status', 'failed')

          // Get currently running count
          const { count: runningCount } = await supabase
            .from('workflow_runs')
            .select('*', { count: 'exact', head: true })
            .eq('workflow_id', workflow.id)
            .in('status', ['running', 'waiting_approval'])

          // Get latest run details
          const { data: latestRun } = await supabase
            .from('workflow_runs')
            .select('*')
            .eq('workflow_id', workflow.id)
            .order('started_at', { ascending: false })
            .limit(1)
            .single()

          // Calculate success rate
          const successRate = totalRuns && totalRuns > 0 
            ? Math.round((successfulRuns / totalRuns) * 100)
            : 0

          // Calculate average duration for completed runs
          let averageDuration = null
          if (successfulRuns && successfulRuns > 0) {
            const { data: completedRuns } = await supabase
              .from('workflow_runs')
              .select('started_at, completed_at')
              .eq('workflow_id', workflow.id)
              .eq('status', 'completed')
              .not('completed_at', 'is', null)

            if (completedRuns && completedRuns.length > 0) {
              const totalDuration = completedRuns.reduce((sum, run) => {
                const start = new Date(run.started_at).getTime()
                const end = new Date(run.completed_at).getTime()
                return sum + (end - start)
              }, 0)
              
              averageDuration = Math.round(totalDuration / completedRuns.length / 1000) // Convert to seconds
            }
          }

          return {
            ...workflow,
            // Run statistics
            totalRuns: totalRuns || 0,
            successfulRuns: successfulRuns || 0,
            failedRuns: failedRuns || 0,
            runningCount: runningCount || 0,
            successRate,
            averageDuration,
            
            // Latest run info
            latestRun: latestRun ? {
              id: latestRun.id,
              status: latestRun.status,
              started_at: latestRun.started_at,
              completed_at: latestRun.completed_at,
              steps_completed: latestRun.steps_completed,
              steps_total: latestRun.steps_total
            } : null,
            
            // Derived fields for UI
            isActive: workflow.is_active,
            lastRunAt: workflow.last_run_at,
            lastRunStatus: workflow.last_run_status,
            triggerType: workflow.trigger_type,
            
            // Template info
            templateType: workflow.template_type,
            stepsCount: workflow.config?.steps?.length || 0,
            estimatedDuration: workflow.config?.estimatedTotalMinutes || null
          }
        } catch (enrichError) {
          console.error(`Error enriching workflow ${workflow.id}:`, enrichError)
          
          // Return basic workflow data if enrichment fails
          return {
            ...workflow,
            totalRuns: 0,
            successfulRuns: 0,
            failedRuns: 0,
            runningCount: 0,
            successRate: 0,
            averageDuration: null,
            latestRun: null,
            isActive: workflow.is_active,
            lastRunAt: workflow.last_run_at,
            lastRunStatus: workflow.last_run_status,
            triggerType: workflow.trigger_type,
            templateType: workflow.template_type,
            stepsCount: workflow.config?.steps?.length || 0,
            estimatedDuration: workflow.config?.estimatedTotalMinutes || null
          }
        }
      })
    )

    // Calculate summary statistics
    const totalWorkflows = enrichedWorkflows.length
    const activeWorkflows = enrichedWorkflows.filter(w => w.isActive).length
    const totalRuns = enrichedWorkflows.reduce((sum, w) => sum + w.totalRuns, 0)
    const currentlyRunning = enrichedWorkflows.reduce((sum, w) => sum + w.runningCount, 0)

    console.log(`✅ Retrieved ${totalWorkflows} workflows (${activeWorkflows} active)`)

    return NextResponse.json({
      success: true,
      workflows: enrichedWorkflows,
      summary: {
        totalWorkflows,
        activeWorkflows,
        inactiveWorkflows: totalWorkflows - activeWorkflows,
        totalRuns,
        currentlyRunning
      },
      count: totalWorkflows
    })

  } catch (error) {
    console.error('Workflows API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const workflowData = await req.json()

    console.log('➕ Creating new workflow:', workflowData.name)

    // Validate required fields
    const requiredFields = ['name', 'template_type', 'trigger_type']
    const missingFields = requiredFields.filter(field => !workflowData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 })
    }

    // Create workflow
    const { data: workflow, error: createError } = await supabase
      .from('workflows')
      .insert({
        name: workflowData.name,
        description: workflowData.description || null,
        template_type: workflowData.template_type,
        trigger_type: workflowData.trigger_type,
        schedule: workflowData.schedule || null,
        is_active: workflowData.is_active || false,
        config: workflowData.config || {}
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating workflow:', createError)
      return NextResponse.json({
        success: false,
        message: 'Failed to create workflow',
        error: createError.message
      }, { status: 500 })
    }

    console.log(`✅ Created workflow: ${workflow.id}`)

    return NextResponse.json({
      success: true,
      message: 'Workflow created successfully',
      workflow
    })

  } catch (error) {
    console.error('Create workflow API error:', error)
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
        message: 'Workflow ID is required'
      }, { status: 400 })
    }

    console.log(`🔄 Updating workflow: ${id}`)

    // Update workflow
    const { data: workflow, error: updateError } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating workflow:', updateError)
      return NextResponse.json({
        success: false,
        message: 'Failed to update workflow',
        error: updateError.message
      }, { status: 500 })
    }

    console.log(`✅ Updated workflow: ${workflow.id}`)

    return NextResponse.json({
      success: true,
      message: 'Workflow updated successfully',
      workflow
    })

  } catch (error) {
    console.error('Update workflow API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}