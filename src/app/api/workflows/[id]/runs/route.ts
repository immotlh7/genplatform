import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserServer } from '@/lib/access-control'
import { supabaseHelpers } from '@/lib/supabase'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and permissions
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    // Only OWNER and ADMIN can view workflow runs
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only OWNER and ADMIN can view workflow runs.' },
        { status: 403 }
      )
    }

    const workflowId = params.id

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' }, 
        { status: 400 }
      )
    }

    // Validate workflow exists
    const { data: workflow, error: workflowError } = await supabaseHelpers.supabase
      .from('workflows')
      .select('id, name, description, template_type')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' }, 
        { status: 404 }
      )
    }

    // Parse query parameters for pagination and filtering
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const status = url.searchParams.get('status')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    // Build query
    let query = supabaseHelpers.supabase
      .from('workflow_runs')
      .select(`
        *,
        project:projects(id, name)
      `)
      .eq('workflow_id', workflowId)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('started_at', startDate)
    }

    if (endDate) {
      query = query.lte('started_at', endDate)
    }

    // Apply pagination and ordering
    query = query
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: runs, error: runsError } = await query

    if (runsError) {
      console.error('Error fetching workflow runs:', runsError)
      return NextResponse.json(
        { error: 'Failed to fetch workflow runs' }, 
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabaseHelpers.supabase
      .from('workflow_runs')
      .select('*', { count: 'exact', head: true })
      .eq('workflow_id', workflowId)

    if (countError) {
      console.error('Error fetching workflow runs count:', countError)
    }

    // Process runs data to add calculated fields
    const processedRuns = (runs || []).map(run => {
      const duration = run.completed_at && run.started_at 
        ? Math.floor((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
        : null

      const progressPercentage = run.steps_total > 0 
        ? Math.round((run.steps_completed / run.steps_total) * 100)
        : 0

      return {
        ...run,
        duration,
        progressPercentage,
        isActive: ['running', 'waiting_approval'].includes(run.status)
      }
    })

    // Calculate summary statistics
    const allRuns = runs || []
    const summary = {
      total: totalCount || 0,
      completed: allRuns.filter(r => r.status === 'completed').length,
      failed: allRuns.filter(r => r.status === 'failed').length,
      running: allRuns.filter(r => r.status === 'running').length,
      waitingApproval: allRuns.filter(r => r.status === 'waiting_approval').length,
      averageDuration: calculateAverageDuration(allRuns),
      successRate: allRuns.length > 0 
        ? Math.round((allRuns.filter(r => r.status === 'completed').length / allRuns.length) * 100)
        : 0
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentActivity, error: activityError } = await supabaseHelpers.supabase
      .from('workflow_runs')
      .select('started_at, status')
      .eq('workflow_id', workflowId)
      .gte('started_at', sevenDaysAgo.toISOString())
      .order('started_at', { ascending: true })

    let activityChart: { date: string; runs: number }[] = []
    if (!activityError && recentActivity) {
      activityChart = generateActivityChart(recentActivity)
    }

    return NextResponse.json({
      success: true,
      workflow,
      runs: processedRuns,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount || 0)
      },
      summary,
      activityChart
    })

  } catch (error) {
    console.error('Error in workflow runs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

function calculateAverageDuration(runs: any[]): number {
  const completedRuns = runs.filter(run => 
    run.status === 'completed' && run.started_at && run.completed_at
  )

  if (completedRuns.length === 0) return 0

  const totalDuration = completedRuns.reduce((sum, run) => {
    const duration = new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()
    return sum + duration
  }, 0)

  return Math.floor(totalDuration / completedRuns.length / 1000) // Return in seconds
}

function generateActivityChart(activities: any[]): { date: string; runs: number }[] {
  // Group activities by date
  const grouped = activities.reduce((acc, activity) => {
    const date = new Date(activity.started_at).toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Generate last 7 days chart
  const chart: { date: string; runs: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    chart.push({
      date: dateStr,
      runs: grouped[dateStr] || 0
    })
  }

  return chart
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
        { error: 'Insufficient permissions. Only OWNER and ADMIN can delete workflow runs.' },
        { status: 403 }
      )
    }

    const workflowId = params.id
    const url = new URL(request.url)
    const runId = url.searchParams.get('runId')
    const olderThan = url.searchParams.get('olderThan') // ISO date string

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' }, 
        { status: 400 }
      )
    }

    let deleteQuery = supabaseHelpers.supabase
      .from('workflow_runs')
      .delete()
      .eq('workflow_id', workflowId)

    if (runId) {
      // Delete specific run
      deleteQuery = deleteQuery.eq('id', runId)
    } else if (olderThan) {
      // Delete runs older than specified date
      deleteQuery = deleteQuery.lt('started_at', olderThan)
    } else {
      return NextResponse.json(
        { error: 'Either runId or olderThan parameter is required' }, 
        { status: 400 }
      )
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      console.error('Error deleting workflow runs:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete workflow runs' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: runId 
        ? 'Workflow run deleted successfully'
        : `Workflow runs older than ${olderThan} deleted successfully`
    })

  } catch (error) {
    console.error('Error deleting workflow runs:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}