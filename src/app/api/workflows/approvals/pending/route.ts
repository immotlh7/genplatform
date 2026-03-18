import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    // Fetch workflow runs that are waiting for approval
    const { data: workflowRuns, error: runsError } = await supabase
      .from('workflow_runs')
      .select(`
        *,
        workflows (
          name,
          config
        )
      `)
      .eq('status', 'waiting_approval')
      .order('started_at', { ascending: false })

    if (runsError) {
      console.error('Error fetching workflow runs:', runsError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch pending approvals',
        error: runsError.message
      }, { status: 500 })
    }

    // Transform runs into approval notifications
    const approvals = (workflowRuns || []).map(run => {
      const workflow = run.workflows
      const steps = workflow?.config?.steps || []
      const currentStep = steps[run.steps_completed] || null
      
      return {
        runId: run.id,
        workflowName: workflow?.name || 'Unknown Workflow',
        stepName: currentStep?.name || run.current_step || 'Unknown Step',
        stepNumber: run.steps_completed + 1,
        totalSteps: run.steps_total,
        approver: currentStep?.config?.approver || 'owner',
        requestedAt: run.started_at, // Use started_at as fallback, ideally we'd track when approval was requested
        description: currentStep?.description || null,
        workflowId: run.workflow_id,
        projectId: run.project_id
      }
    })

    console.log(`📋 Found ${approvals.length} pending approval(s)`)

    return NextResponse.json({
      success: true,
      approvals,
      count: approvals.length
    })

  } catch (error) {
    console.error('Pending approvals API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}