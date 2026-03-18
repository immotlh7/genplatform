import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workflowId = params.id
    const { searchParams } = new URL(req.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // Filter by status
    const offset = (page - 1) * limit

    console.log(`📊 Fetching runs for workflow: ${workflowId}`)

    // Validate workflow exists
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('id, name, config')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      console.error('Workflow not found:', workflowError)
      return NextResponse.json({
        success: false,
        message: 'Workflow not found'
      }, { status: 404 })
    }

    // Build query for workflow runs
    let query = supabase
      .from('workflow_runs')
      .select(`
        id,
        workflow_id,
        project_id,
        status,
        current_step,
        steps_completed,
        steps_total,
        started_at,
        completed_at,
        logs
      `)
      .eq('workflow_id', workflowId)

    // Apply status filter if provided
    if (status && ['running', 'completed', 'failed', 'waiting_approval'].includes(status)) {
      query = query.eq('status', status)
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('workflow_runs')
      .select('*', { count: 'exact', head: true })
      .eq('workflow_id', workflowId)

    if (countError) {
      console.error('Error getting runs count:', countError)
      return NextResponse.json({
        success: false,
        message: 'Failed to get runs count',
        error: countError.message
      }, { status: 500 })
    }

    // Fetch workflow runs with pagination
    const { data: runs, error: runsError } = await query
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (runsError) {
      console.error('Error fetching workflow runs:', runsError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch workflow runs',
        error: runsError.message
      }, { status: 500 })
    }

    // Enrich runs with additional calculated fields
    const enrichedRuns = (runs || []).map(run => {
      const duration = run.completed_at 
        ? new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()
        : new Date().getTime() - new Date(run.started_at).getTime()

      const progress = run.steps_total > 0 
        ? Math.round((run.steps_completed / run.steps_total) * 100)
        : 0

      // Get step information from workflow config
      const steps = workflow.config?.steps || []
      const currentStepInfo = steps[run.steps_completed] || null

      // Calculate step durations from logs
      const stepDurations = calculateStepDurations(run.logs || [], steps)

      // Get error information for failed runs
      const errorInfo = run.status === 'failed' 
        ? getErrorInfo(run.logs || [])
        : null

      return {
        id: run.id,
        workflowId: run.workflow_id,
        projectId: run.project_id,
        status: run.status,
        currentStep: run.current_step,
        stepsCompleted: run.steps_completed,
        stepsTotal: run.steps_total,
        progress,
        startedAt: run.started_at,
        completedAt: run.completed_at,
        duration: Math.round(duration / 1000), // Duration in seconds
        
        // Additional computed fields
        isRunning: ['running', 'waiting_approval'].includes(run.status),
        isCompleted: run.status === 'completed',
        isFailed: run.status === 'failed',
        
        // Step information
        currentStepInfo,
        stepDurations,
        
        // Error information for failed runs
        errorInfo,
        
        // Logs summary
        logCount: run.logs?.length || 0,
        hasLogs: (run.logs?.length || 0) > 0
      }
    })

    // Calculate statistics
    const statusCounts = enrichedRuns.reduce((counts, run) => {
      counts[run.status] = (counts[run.status] || 0) + 1
      return counts
    }, {} as Record<string, number>)

    const averageDuration = enrichedRuns
      .filter(run => run.isCompleted && run.duration > 0)
      .reduce((sum, run, _, arr) => {
        return arr.length > 0 ? sum + run.duration / arr.length : 0
      }, 0)

    console.log(`✅ Retrieved ${enrichedRuns.length} runs for workflow ${workflowId}`)

    return NextResponse.json({
      success: true,
      runs: enrichedRuns,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        stepsCount: workflow.config?.steps?.length || 0
      },
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasMore: (offset + limit) < (totalCount || 0)
      },
      statistics: {
        totalRuns: totalCount || 0,
        statusCounts,
        averageDuration: Math.round(averageDuration),
        successRate: totalCount && statusCounts.completed 
          ? Math.round((statusCounts.completed / totalCount) * 100)
          : 0
      }
    })

  } catch (error) {
    console.error('Workflow runs API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Calculate duration for each step based on logs
 */
function calculateStepDurations(logs: any[], steps: any[]): Record<string, number> {
  const stepDurations: Record<string, number> = {}
  
  // Group logs by step
  const stepLogs = logs.reduce((groups, log) => {
    if (log.step) {
      if (!groups[log.step]) groups[log.step] = []
      groups[log.step].push(log)
    }
    return groups
  }, {} as Record<string, any[]>)

  // Calculate duration for each step
  Object.entries(stepLogs).forEach(([stepName, stepLogEntries]) => {
    const startLog = stepLogEntries.find(log => 
      log.message?.includes('Starting') || log.level === 'info'
    )
    const endLog = stepLogEntries.find(log => 
      log.message?.includes('Completed') || log.level === 'success'
    )

    if (startLog && endLog && startLog.timestamp && endLog.timestamp) {
      const duration = new Date(endLog.timestamp).getTime() - new Date(startLog.timestamp).getTime()
      stepDurations[stepName] = Math.round(duration / 1000) // Convert to seconds
    }
  })

  return stepDurations
}

/**
 * Extract error information from logs
 */
function getErrorInfo(logs: any[]): { message: string; step?: string; timestamp: string } | null {
  const errorLog = logs
    .filter(log => log.level === 'error')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

  if (!errorLog) return null

  return {
    message: errorLog.message || 'Unknown error',
    step: errorLog.step || undefined,
    timestamp: errorLog.timestamp
  }
}