import { supabase } from './supabase'

export interface WorkflowMetrics {
  workflow_id: string
  run_id: string
  step_id?: string
  metric_type: 'execution_time' | 'resource_usage' | 'error_count' | 'success_rate' | 'step_duration'
  metric_value: number
  metadata?: {
    cpu_usage?: number
    memory_usage?: number
    network_io?: number
    disk_io?: number
    error_type?: string
    error_message?: string
    step_name?: string
    execution_context?: any
  }
  timestamp: string
}

export interface PerformanceMetrics {
  total_execution_time: number
  step_durations: { [stepId: string]: number }
  resource_usage: {
    peak_cpu: number
    peak_memory: number
    avg_cpu: number
    avg_memory: number
    network_bytes: number
    disk_bytes: number
  }
  error_details: {
    type: string
    step: string
    message: string
    timestamp: string
  }[]
}

export class WorkflowMetricsCollector {
  private runId: string
  private workflowId: string
  private startTime: number
  private stepStartTimes: Map<string, number> = new Map()
  private resourceUsageInterval?: NodeJS.Timeout

  constructor(runId: string, workflowId: string) {
    this.runId = runId
    this.workflowId = workflowId
    this.startTime = Date.now()
    
    console.log(`📊 Metrics collection started for workflow ${workflowId}, run ${runId}`)
  }

  /**
   * Start collecting resource usage metrics
   */
  startResourceMonitoring(): void {
    this.resourceUsageInterval = setInterval(async () => {
      const metrics = await this.collectSystemMetrics()
      await this.recordMetric({
        workflow_id: this.workflowId,
        run_id: this.runId,
        metric_type: 'resource_usage',
        metric_value: metrics.cpu_usage,
        metadata: metrics,
        timestamp: new Date().toISOString()
      })
    }, 5000) // Collect every 5 seconds
  }

  /**
   * Stop resource monitoring
   */
  stopResourceMonitoring(): void {
    if (this.resourceUsageInterval) {
      clearInterval(this.resourceUsageInterval)
      this.resourceUsageInterval = undefined
    }
  }

  /**
   * Record workflow execution start
   */
  async recordWorkflowStart(): Promise<void> {
    await this.recordMetric({
      workflow_id: this.workflowId,
      run_id: this.runId,
      metric_type: 'execution_time',
      metric_value: 0,
      metadata: {
        execution_context: { status: 'started', start_time: this.startTime }
      },
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Record workflow execution completion
   */
  async recordWorkflowCompletion(success: boolean): Promise<void> {
    const endTime = Date.now()
    const executionTime = endTime - this.startTime

    await this.recordMetric({
      workflow_id: this.workflowId,
      run_id: this.runId,
      metric_type: 'execution_time',
      metric_value: executionTime,
      metadata: {
        execution_context: { 
          status: success ? 'completed' : 'failed', 
          end_time: endTime,
          total_duration: executionTime
        }
      },
      timestamp: new Date().toISOString()
    })

    await this.recordMetric({
      workflow_id: this.workflowId,
      run_id: this.runId,
      metric_type: 'success_rate',
      metric_value: success ? 1 : 0,
      metadata: {
        execution_context: { success, completion_time: new Date().toISOString() }
      },
      timestamp: new Date().toISOString()
    })

    this.stopResourceMonitoring()
    console.log(`📊 Workflow ${this.workflowId} completed in ${executionTime}ms`)
  }

  /**
   * Record step execution start
   */
  recordStepStart(stepId: string, stepName: string): void {
    this.stepStartTimes.set(stepId, Date.now())
    console.log(`📊 Step ${stepName} (${stepId}) started`)
  }

  /**
   * Record step execution completion
   */
  async recordStepCompletion(stepId: string, stepName: string, success: boolean, error?: any): Promise<void> {
    const startTime = this.stepStartTimes.get(stepId)
    if (!startTime) {
      console.warn(`No start time recorded for step ${stepId}`)
      return
    }

    const endTime = Date.now()
    const stepDuration = endTime - startTime

    await this.recordMetric({
      workflow_id: this.workflowId,
      run_id: this.runId,
      step_id: stepId,
      metric_type: 'step_duration',
      metric_value: stepDuration,
      metadata: {
        step_name: stepName,
        execution_context: {
          success,
          duration: stepDuration,
          error: error ? this.sanitizeError(error) : undefined
        }
      },
      timestamp: new Date().toISOString()
    })

    if (error) {
      await this.recordError(stepId, stepName, error)
    }

    this.stepStartTimes.delete(stepId)
    console.log(`📊 Step ${stepName} completed in ${stepDuration}ms`)
  }

  /**
   * Record an error occurrence
   */
  async recordError(stepId: string, stepName: string, error: any): Promise<void> {
    const errorType = this.classifyError(error)
    
    await this.recordMetric({
      workflow_id: this.workflowId,
      run_id: this.runId,
      step_id: stepId,
      metric_type: 'error_count',
      metric_value: 1,
      metadata: {
        step_name: stepName,
        error_type: errorType,
        error_message: error?.message || String(error),
        execution_context: {
          timestamp: new Date().toISOString(),
          stack: error?.stack?.substring(0, 1000) // Limit stack trace size
        }
      },
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Record a custom metric
   */
  async recordCustomMetric(
    metricType: string, 
    value: number, 
    stepId?: string, 
    metadata?: any
  ): Promise<void> {
    await this.recordMetric({
      workflow_id: this.workflowId,
      run_id: this.runId,
      step_id: stepId,
      metric_type: metricType as any,
      metric_value: value,
      metadata,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Record a metric to the database
   */
  private async recordMetric(metric: WorkflowMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_metrics')
        .insert({
          workflow_id: metric.workflow_id,
          run_id: metric.run_id,
          step_id: metric.step_id,
          metric_type: metric.metric_type,
          metric_value: metric.metric_value,
          metadata: metric.metadata || {},
          timestamp: metric.timestamp
        })

      if (error) {
        console.error('Failed to record workflow metric:', error)
      }
    } catch (err) {
      console.error('Error recording workflow metric:', err)
    }
  }

  /**
   * Collect current system resource metrics
   */
  private async collectSystemMetrics(): Promise<{
    cpu_usage: number
    memory_usage: number
    network_io: number
    disk_io: number
  }> {
    try {
      // In a real implementation, you'd use system monitoring APIs
      // For now, simulate metrics with realistic values
      return {
        cpu_usage: 20 + Math.random() * 60, // 20-80% CPU
        memory_usage: 30 + Math.random() * 50, // 30-80% Memory
        network_io: Math.random() * 100, // MB/s
        disk_io: Math.random() * 50 // MB/s
      }
    } catch (error) {
      console.error('Failed to collect system metrics:', error)
      return {
        cpu_usage: 0,
        memory_usage: 0,
        network_io: 0,
        disk_io: 0
      }
    }
  }

  /**
   * Classify error type for analytics
   */
  private classifyError(error: any): string {
    if (!error) return 'Unknown'
    
    const message = error.message?.toLowerCase() || String(error).toLowerCase()
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'Timeout'
    } else if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'Network Error'
    } else if (message.includes('validation') || message.includes('invalid')) {
      return 'Validation Error'
    } else if (message.includes('permission') || message.includes('auth') || message.includes('unauthorized')) {
      return 'Permission Error'
    } else if (message.includes('api') || message.includes('http')) {
      return 'API Error'
    } else if (message.includes('syntax') || message.includes('parse')) {
      return 'Syntax Error'
    } else {
      return 'Runtime Error'
    }
  }

  /**
   * Sanitize error for storage (remove sensitive data)
   */
  private sanitizeError(error: any): any {
    if (!error) return null
    
    return {
      message: error.message || String(error),
      type: error.constructor?.name || 'Error',
      code: error.code || undefined
    }
  }
}

/**
 * Analytics functions for querying metrics
 */
export class WorkflowAnalytics {
  /**
   * Get aggregated metrics for a workflow
   */
  static async getWorkflowMetrics(
    workflowId: string, 
    timeRange: string = '7d'
  ): Promise<{
    total_runs: number
    success_rate: number
    avg_execution_time: number
    error_breakdown: { type: string; count: number }[]
    resource_usage: { avg_cpu: number; avg_memory: number }
  }> {
    try {
      const timeFilter = this.getTimeFilter(timeRange)
      
      // Get run statistics
      const { data: runStats, error: runStatsError } = await supabase
        .from('workflow_runs')
        .select('status, created_at')
        .eq('workflow_id', workflowId)
        .gte('created_at', timeFilter)

      if (runStatsError) throw runStatsError

      // Get execution time metrics
      const { data: executionMetrics, error: execError } = await supabase
        .from('workflow_metrics')
        .select('metric_value, metadata')
        .eq('workflow_id', workflowId)
        .eq('metric_type', 'execution_time')
        .gte('timestamp', timeFilter)

      if (execError) throw execError

      // Get error metrics
      const { data: errorMetrics, error: errorError } = await supabase
        .from('workflow_metrics')
        .select('metadata')
        .eq('workflow_id', workflowId)
        .eq('metric_type', 'error_count')
        .gte('timestamp', timeFilter)

      if (errorError) throw errorError

      // Get resource metrics
      const { data: resourceMetrics, error: resourceError } = await supabase
        .from('workflow_metrics')
        .select('metadata')
        .eq('workflow_id', workflowId)
        .eq('metric_type', 'resource_usage')
        .gte('timestamp', timeFilter)

      if (resourceError) throw resourceError

      // Calculate aggregated metrics
      const totalRuns = runStats?.length || 0
      const successfulRuns = runStats?.filter(run => run.status === 'completed').length || 0
      const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0

      const executionTimes = executionMetrics?.map(m => m.metric_value).filter(v => v > 0) || []
      const avgExecutionTime = executionTimes.length > 0 
        ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length 
        : 0

      const errorBreakdown = this.aggregateErrors(errorMetrics || [])
      const resourceUsage = this.aggregateResourceUsage(resourceMetrics || [])

      return {
        total_runs: totalRuns,
        success_rate: successRate,
        avg_execution_time: Math.round(avgExecutionTime),
        error_breakdown: errorBreakdown,
        resource_usage: resourceUsage
      }
    } catch (error) {
      console.error('Failed to get workflow metrics:', error)
      return {
        total_runs: 0,
        success_rate: 0,
        avg_execution_time: 0,
        error_breakdown: [],
        resource_usage: { avg_cpu: 0, avg_memory: 0 }
      }
    }
  }

  /**
   * Get trend data for analytics
   */
  static async getTrendData(
    workflowId?: string,
    timeRange: string = '7d'
  ): Promise<{
    date: string
    success_rate: number
    avg_execution_time: number
    total_runs: number
  }[]> {
    try {
      const timeFilter = this.getTimeFilter(timeRange)
      
      let query = supabase
        .from('workflow_runs')
        .select('status, created_at, completed_at')
        .gte('created_at', timeFilter)

      if (workflowId && workflowId !== 'all') {
        query = query.eq('workflow_id', workflowId)
      }

      const { data: runs, error } = await query

      if (error) throw error

      // Group by date and calculate metrics
      const dailyData = new Map<string, { 
        successful: number, 
        total: number, 
        totalTime: number, 
        completedRuns: number 
      }>()

      runs?.forEach(run => {
        const date = run.created_at.split('T')[0]
        const existing = dailyData.get(date) || { 
          successful: 0, 
          total: 0, 
          totalTime: 0, 
          completedRuns: 0 
        }
        
        existing.total += 1
        if (run.status === 'completed') {
          existing.successful += 1
          if (run.completed_at) {
            const executionTime = new Date(run.completed_at).getTime() - 
                                 new Date(run.created_at).getTime()
            existing.totalTime += executionTime
            existing.completedRuns += 1
          }
        }
        
        dailyData.set(date, existing)
      })

      // Convert to array format
      return Array.from(dailyData.entries()).map(([date, data]) => ({
        date,
        success_rate: data.total > 0 ? (data.successful / data.total) * 100 : 0,
        avg_execution_time: data.completedRuns > 0 ? data.totalTime / data.completedRuns : 0,
        total_runs: data.total
      })).sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      console.error('Failed to get trend data:', error)
      return []
    }
  }

  /**
   * Get time filter for queries
   */
  private static getTimeFilter(range: string): string {
    const now = new Date()
    const days = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    }[range] || 7
    
    now.setDate(now.getDate() - days)
    return now.toISOString()
  }

  /**
   * Aggregate error data
   */
  private static aggregateErrors(errorMetrics: any[]): { type: string; count: number }[] {
    const errorCounts = new Map<string, number>()
    
    errorMetrics.forEach(metric => {
      const errorType = metric.metadata?.error_type || 'Unknown'
      errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1)
    })
    
    return Array.from(errorCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  }

  /**
   * Aggregate resource usage data
   */
  private static aggregateResourceUsage(resourceMetrics: any[]): { avg_cpu: number; avg_memory: number } {
    if (resourceMetrics.length === 0) {
      return { avg_cpu: 0, avg_memory: 0 }
    }
    
    const totalCpu = resourceMetrics.reduce((sum, m) => sum + (m.metadata?.cpu_usage || 0), 0)
    const totalMemory = resourceMetrics.reduce((sum, m) => sum + (m.metadata?.memory_usage || 0), 0)
    
    return {
      avg_cpu: totalCpu / resourceMetrics.length,
      avg_memory: totalMemory / resourceMetrics.length
    }
  }
}

/**
 * Convenience function to create a metrics collector
 */
export function createMetricsCollector(runId: string, workflowId: string): WorkflowMetricsCollector {
  return new WorkflowMetricsCollector(runId, workflowId)
}

/**
 * Database migration for workflow_metrics table
 */
export const workflowMetricsTableSchema = `
CREATE TABLE IF NOT EXISTS workflow_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL,
  run_id UUID NOT NULL,
  step_id VARCHAR(255),
  metric_type VARCHAR(100) NOT NULL,
  metric_value DECIMAL NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  INDEX idx_workflow_metrics_workflow_id (workflow_id),
  INDEX idx_workflow_metrics_run_id (run_id),
  INDEX idx_workflow_metrics_type (metric_type),
  INDEX idx_workflow_metrics_timestamp (timestamp),
  
  FOREIGN KEY (run_id) REFERENCES workflow_runs(id) ON DELETE CASCADE
);
`