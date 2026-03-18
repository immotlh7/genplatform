import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(req: NextRequest) {
  try {
    // Get current date for "today" calculations
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // Fetch workflow statistics
    const [
      { data: allWorkflows, error: workflowsError },
      { data: activeWorkflows, error: activeError },
      { data: runningWorkflows, error: runningError },
      { data: waitingApproval, error: approvalError },
      { data: completedToday, error: completedError },
      { data: failedToday, error: failedError }
    ] = await Promise.all([
      // Total workflows
      supabase
        .from('workflows')
        .select('id'),
      
      // Active workflows  
      supabase
        .from('workflows')
        .select('id')
        .eq('is_active', true),
      
      // Currently running workflows
      supabase
        .from('workflow_runs')
        .select('id')
        .eq('status', 'running'),
      
      // Workflows waiting for approval
      supabase
        .from('workflow_runs')
        .select('id')
        .eq('status', 'waiting_approval'),
      
      // Workflows completed today
      supabase
        .from('workflow_runs')
        .select('id')
        .eq('status', 'completed')
        .gte('completed_at', todayISO),
      
      // Workflows failed today
      supabase
        .from('workflow_runs')
        .select('id')
        .eq('status', 'failed')
        .gte('started_at', todayISO)
    ])

    // Check for errors
    if (workflowsError) throw workflowsError
    if (activeError) throw activeError
    if (runningError) throw runningError
    if (approvalError) throw approvalError
    if (completedError) throw completedError
    if (failedError) throw failedError

    // Build response
    const status = {
      total_workflows: allWorkflows?.length || 0,
      active_workflows: activeWorkflows?.length || 0,
      running_workflows: runningWorkflows?.length || 0,
      waiting_approval: waitingApproval?.length || 0,
      completed_today: completedToday?.length || 0,
      failed_today: failedToday?.length || 0
    }

    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching workflow status:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}