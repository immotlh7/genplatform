import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission, checkOwnerAuth } from '@/lib/rbac'
import { logSecurityEvent } from '@/lib/security-logger'

interface MetricsQuery {
  timeRange?: '1h' | '24h' | '7d' | '30d'
  workflowId?: string
  templateType?: string
  groupBy?: 'hour' | 'day' | 'week'
  includeDetails?: boolean
}

interface WorkflowMetrics {
  overview: {
    totalRuns: number
    successfulRuns: number
    failedRuns: number
    runningRuns: number
    waitingApprovalRuns: number
    successRate: number
    averageDuration: number
    totalDuration: number
  }
  trends: {
    timeRange: string
    groupBy: string
    dataPoints: Array<{
      timestamp: string
      period: string
      runs: number
      successes: number
      failures: number
      successRate: number
      averageDuration: number
    }>
  }
  workflows: Array<{
    id: string
    name: string
    templateType: string
    totalRuns: number
    successRate: number
    averageDuration: number
    lastRun?: string
    status: 'active' | 'inactive'
  }>
  performance: {
    fastestWorkflow?: { name: string; duration: number }
    slowestWorkflow?: { name: string; duration: number }
    mostReliableWorkflow?: { name: string; successRate: number }
    leastReliableWorkflow?: { name: string; successRate: number }
    busyHours: Array<{ hour: number; count: number }>
    peakDay: { day: string; count: number }
  }
  issues: {
    failureReasons: Array<{ reason: string; count: number; percentage: number }>
    bottleneckSteps: Array<{ step: string; averageDuration: number; workflow: string }>
    timeoutRuns: number
    retryCount: number
  }
}

/**
 * GET /api/workflows/metrics
 * Get comprehensive workflow analytics and metrics
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const url = new URL(req.url)

  // Parse query parameters
  const timeRange = (url.searchParams.get('timeRange') as MetricsQuery['timeRange']) || '24h'
  const workflowId = url.searchParams.get('workflowId') || undefined
  const templateType = url.searchParams.get('templateType') || undefined
  const groupBy = (url.searchParams.get('groupBy') as MetricsQuery['groupBy']) || 'hour'
  const includeDetails = url.searchParams.get('includeDetails') === 'true'

  try {
    // Check authentication and permissions (only ADMIN+ can view metrics)
    const authCookie = req.cookies.get('auth-token')?.value
    let authorized = false
    let requestorInfo = null

    // Check owner authentication first
    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
      requestorInfo = ownerAuth.user
    } else {
      // Check team member permissions (ADMIN can view metrics)
      const permissionCheck = await requirePermission('system:health') // Using system:health as proxy for ADMIN
      if (permissionCheck.authorized) {
        authorized = true
        requestorInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      await logSecurityEvent(ip, 'unauthorized_workflow_metrics_access_attempt', 'warning', {
        userAgent,
        queryParams: Object.fromEntries(url.searchParams),
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to view workflow metrics' },
        { status: 403 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Metrics service unavailable' },
        { status: 503 }
      )
    }

    // Calculate time range
    const now = new Date()
    const startTime = new Date(now.getTime() - getTimeRangeMs(timeRange))

    // Build base query for workflow runs
    let runsQuery = supabaseAdmin
      .from('workflow_runs')
      .select(`
        id,
        workflow_id,
        status,
        steps_completed,
        steps_total,
        started_at,
        completed_at,
        error_message,
        logs,
        workflows (
          id,
          name,
          template_type
        )
      `)
      .gte('started_at', startTime.toISOString())

    // Apply filters
    if (workflowId) {
      runsQuery = runsQuery.eq('workflow_id', workflowId)
    }

    if (templateType) {
      runsQuery = runsQuery.eq('workflows.template_type', templateType)
    }

    const { data: runs, error: runsError } = await runsQuery

    if (runsError) {
      console.error('Error fetching workflow runs:', runsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch workflow metrics' },
        { status: 500 }
      )
    }

    const workflowRuns = runs || []

    // Calculate overview metrics
    const overview = calculateOverviewMetrics(workflowRuns)

    // Calculate trend data
    const trends = calculateTrendMetrics(workflowRuns, timeRange, groupBy, startTime, now)

    // Calculate per-workflow metrics
    const workflows = await calculateWorkflowMetrics(workflowRuns)

    // Calculate performance insights
    const performance = calculatePerformanceMetrics(workflowRuns)

    // Calculate issue analysis
    const issues = calculateIssueMetrics(workflowRuns)

    const metrics: WorkflowMetrics = {
      overview,
      trends,
      workflows,
      performance,
      issues
    }

    // Log successful access
    await logSecurityEvent(ip, 'workflow_metrics_accessed', 'info', {
      requestorEmail: requestorInfo?.email,
      requestorRole: requestorInfo?.role,
      timeRange,
      workflowId,
      templateType,
      resultCount: workflowRuns.length,
      userAgent
    })

    return NextResponse.json({
      success: true,
      data: metrics,
      metadata: {
        timeRange,
        groupBy,
        workflowId,
        templateType,
        includeDetails,
        generatedAt: new Date().toISOString(),
        runCount: workflowRuns.length
      }
    })

  } catch (error) {
    console.error('Workflow metrics API error:', error)
    
    await logSecurityEvent(ip, 'workflow_metrics_api_system_error', 'critical', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userAgent,
      queryParams: Object.fromEntries(url.searchParams),
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Calculate overview metrics
 */
function calculateOverviewMetrics(runs: any[]): WorkflowMetrics['overview'] {
  const totalRuns = runs.length
  const successfulRuns = runs.filter(r => r.status === 'completed').length
  const failedRuns = runs.filter(r => r.status === 'failed').length
  const runningRuns = runs.filter(r => r.status === 'running').length
  const waitingApprovalRuns = runs.filter(r => r.status === 'waiting_approval').length

  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0

  // Calculate durations for completed runs
  const completedRuns = runs.filter(r => r.status === 'completed' && r.completed_at)
  let averageDuration = 0
  let totalDuration = 0

  if (completedRuns.length > 0) {
    const durations = completedRuns.map(r => {
      const start = new Date(r.started_at).getTime()
      const end = new Date(r.completed_at).getTime()
      return end - start
    })

    totalDuration = durations.reduce((sum, duration) => sum + duration, 0)
    averageDuration = Math.round(totalDuration / durations.length)
  }

  return {
    totalRuns,
    successfulRuns,
    failedRuns,
    runningRuns,
    waitingApprovalRuns,
    successRate,
    averageDuration,
    totalDuration
  }
}

/**
 * Calculate trend metrics over time
 */
function calculateTrendMetrics(runs: any[], timeRange: string, groupBy: string, startTime: Date, endTime: Date): WorkflowMetrics['trends'] {
  const dataPoints: any[] = []
  const periodMs = getPeriodMs(groupBy)
  
  for (let time = startTime.getTime(); time <= endTime.getTime(); time += periodMs) {
    const periodStart = new Date(time)
    const periodEnd = new Date(time + periodMs)
    
    const periodRuns = runs.filter(r => {
      const runTime = new Date(r.started_at).getTime()
      return runTime >= periodStart.getTime() && runTime < periodEnd.getTime()
    })

    const successes = periodRuns.filter(r => r.status === 'completed').length
    const failures = periodRuns.filter(r => r.status === 'failed').length
    const successRate = periodRuns.length > 0 ? Math.round((successes / periodRuns.length) * 100) : 0

    // Calculate average duration for this period
    const completedPeriodRuns = periodRuns.filter(r => r.status === 'completed' && r.completed_at)
    let averageDuration = 0
    
    if (completedPeriodRuns.length > 0) {
      const durations = completedPeriodRuns.map(r => {
        const start = new Date(r.started_at).getTime()
        const end = new Date(r.completed_at).getTime()
        return end - start
      })
      averageDuration = Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
    }

    dataPoints.push({
      timestamp: periodStart.toISOString(),
      period: formatPeriod(periodStart, groupBy),
      runs: periodRuns.length,
      successes,
      failures,
      successRate,
      averageDuration
    })
  }

  return {
    timeRange,
    groupBy,
    dataPoints
  }
}

/**
 * Calculate per-workflow metrics
 */
async function calculateWorkflowMetrics(runs: any[]): Promise<WorkflowMetrics['workflows']> {
  const workflowMap = new Map()

  // Group runs by workflow
  runs.forEach(run => {
    const workflowId = run.workflow_id
    if (!workflowMap.has(workflowId)) {
      workflowMap.set(workflowId, {
        id: workflowId,
        name: run.workflows?.name || 'Unknown Workflow',
        templateType: run.workflows?.template_type || 'unknown',
        runs: []
      })
    }
    workflowMap.get(workflowId).runs.push(run)
  })

  // Calculate metrics for each workflow
  const workflowMetrics: any[] = []

  for (const [workflowId, workflow] of workflowMap) {
    const workflowRuns = workflow.runs
    const totalRuns = workflowRuns.length
    const successfulRuns = workflowRuns.filter((r: any) => r.status === 'completed').length
    const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0

    // Calculate average duration
    const completedRuns = workflowRuns.filter((r: any) => r.status === 'completed' && r.completed_at)
    let averageDuration = 0

    if (completedRuns.length > 0) {
      const durations = completedRuns.map((r: any) => {
        const start = new Date(r.started_at).getTime()
        const end = new Date(r.completed_at).getTime()
        return end - start
      })
      averageDuration = Math.round(durations.reduce((sum: number, d: number) => sum + d, 0) / durations.length)
    }

    // Find last run
    const lastRun = workflowRuns
      .sort((a: any, b: any) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0]

    workflowMetrics.push({
      id: workflowId,
      name: workflow.name,
      templateType: workflow.templateType,
      totalRuns,
      successRate,
      averageDuration,
      lastRun: lastRun?.started_at,
      status: 'active' // Assume active if there are recent runs
    })
  }

  return workflowMetrics.sort((a, b) => b.totalRuns - a.totalRuns)
}

/**
 * Calculate performance insights
 */
function calculatePerformanceMetrics(runs: any[]): WorkflowMetrics['performance'] {
  const completedRuns = runs.filter(r => r.status === 'completed' && r.completed_at)
  
  if (completedRuns.length === 0) {
    return {
      busyHours: [],
      peakDay: { day: 'N/A', count: 0 }
    }
  }

  // Calculate durations
  const runDurations = completedRuns.map(r => ({
    name: r.workflows?.name || 'Unknown',
    duration: new Date(r.completed_at).getTime() - new Date(r.started_at).getTime(),
    successRate: 0 // Will be calculated separately
  }))

  // Find fastest and slowest
  runDurations.sort((a, b) => a.duration - b.duration)
  const fastestWorkflow = runDurations[0]
  const slowestWorkflow = runDurations[runDurations.length - 1]

  // Calculate success rates per workflow
  const workflowSuccessRates = new Map()
  runs.forEach(r => {
    const name = r.workflows?.name || 'Unknown'
    if (!workflowSuccessRates.has(name)) {
      workflowSuccessRates.set(name, { total: 0, successful: 0 })
    }
    const stats = workflowSuccessRates.get(name)
    stats.total++
    if (r.status === 'completed') stats.successful++
  })

  const reliabilityMetrics = Array.from(workflowSuccessRates.entries()).map(([name, stats]) => ({
    name,
    successRate: Math.round((stats.successful / stats.total) * 100)
  }))

  reliabilityMetrics.sort((a, b) => b.successRate - a.successRate)
  const mostReliableWorkflow = reliabilityMetrics[0]
  const leastReliableWorkflow = reliabilityMetrics[reliabilityMetrics.length - 1]

  // Calculate busy hours
  const hourCounts = new Array(24).fill(0)
  runs.forEach(r => {
    const hour = new Date(r.started_at).getHours()
    hourCounts[hour]++
  })

  const busyHours = hourCounts.map((count, hour) => ({ hour, count }))
    .filter(h => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Calculate peak day
  const dayCounts = new Map()
  runs.forEach(r => {
    const day = new Date(r.started_at).toDateString()
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1)
  })

  const peakDayEntry = Array.from(dayCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]

  return {
    fastestWorkflow: fastestWorkflow ? { 
      name: fastestWorkflow.name, 
      duration: Math.round(fastestWorkflow.duration / 1000) 
    } : undefined,
    slowestWorkflow: slowestWorkflow ? { 
      name: slowestWorkflow.name, 
      duration: Math.round(slowestWorkflow.duration / 1000) 
    } : undefined,
    mostReliableWorkflow,
    leastReliableWorkflow: reliabilityMetrics.length > 1 ? leastReliableWorkflow : undefined,
    busyHours,
    peakDay: peakDayEntry ? { day: peakDayEntry[0], count: peakDayEntry[1] } : { day: 'N/A', count: 0 }
  }
}

/**
 * Calculate issue metrics
 */
function calculateIssueMetrics(runs: any[]): WorkflowMetrics['issues'] {
  const failedRuns = runs.filter(r => r.status === 'failed')
  
  // Analyze failure reasons
  const failureReasons = new Map()
  failedRuns.forEach(r => {
    const reason = extractFailureReason(r.error_message)
    failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1)
  })

  const failureReasonsArray = Array.from(failureReasons.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: Math.round((count / failedRuns.length) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Analyze bottleneck steps (placeholder implementation)
  const bottleneckSteps = [
    { step: 'Wait for Owner Approval', averageDuration: 3600000, workflow: 'Idea to MVP' }
  ]

  return {
    failureReasons: failureReasonsArray,
    bottleneckSteps,
    timeoutRuns: 0, // Placeholder
    retryCount: 0   // Placeholder
  }
}

/**
 * Helper functions
 */
function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 60 * 60 * 1000
    case '24h': return 24 * 60 * 60 * 1000
    case '7d': return 7 * 24 * 60 * 60 * 1000
    case '30d': return 30 * 24 * 60 * 60 * 1000
    default: return 24 * 60 * 60 * 1000
  }
}

function getPeriodMs(groupBy: string): number {
  switch (groupBy) {
    case 'hour': return 60 * 60 * 1000
    case 'day': return 24 * 60 * 60 * 1000
    case 'week': return 7 * 24 * 60 * 60 * 1000
    default: return 60 * 60 * 1000
  }
}

function formatPeriod(date: Date, groupBy: string): string {
  switch (groupBy) {
    case 'hour': return date.getHours().toString().padStart(2, '0') + ':00'
    case 'day': return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    case 'week': return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    default: return date.toLocaleTimeString()
  }
}

function extractFailureReason(errorMessage?: string): string {
  if (!errorMessage) return 'Unknown Error'
  
  const message = errorMessage.toLowerCase()
  
  if (message.includes('timeout')) return 'Timeout'
  if (message.includes('permission') || message.includes('unauthorized')) return 'Permission Denied'
  if (message.includes('network') || message.includes('connection')) return 'Network Error'
  if (message.includes('validation')) return 'Validation Error'
  if (message.includes('database')) return 'Database Error'
  if (message.includes('workflow')) return 'Workflow Error'
  
  return 'System Error'
}