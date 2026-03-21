import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase';
// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
export async function GET(req: NextRequest) {
  try {
    // Fetch currently running workflow runs with workflow details
    const { data: runningWorkflows, error } = await supabase
      .from('workflow_runs')
      .select(`
        id,
        status,
        current_step,
        steps_completed,
        steps_total,
        started_at,
        workflows!inner (
          id,
          name,
          description,
          template_type
        )
      `)
      .eq('status', 'running')
      .order('started_at', { ascending: false })
      .limit(10) // Limit to 10 most recent running workflows

    if (error) {
      throw error
    }

    // Format the response
    const workflows = runningWorkflows?.map(run => ({
      id: run.id,
      name: run.workflows.name,
      status: run.status,
      current_step: run.current_step || 'Initializing...',
      steps_completed: run.steps_completed || 0,
      steps_total: run.steps_total || 1,
      started_at: run.started_at,
      template_type: run.workflows.template_type,
      description: run.workflows.description
    })) || []

    return NextResponse.json({
      success: true,
      workflows,
      count: workflows.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching running workflows:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      workflows: [],
      count: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}