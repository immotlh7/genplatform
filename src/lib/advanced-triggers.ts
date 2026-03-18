import { supabase } from './supabase'
import { startWorkflowExecution } from './workflow-triggers'

export interface AdvancedTrigger {
  id: string
  workflow_id: string
  name: string
  type: 'time_based' | 'webhook' | 'condition_group' | 'file_watcher' | 'database_event' | 'api_monitor'
  config: {
    // Time-based triggers
    schedule?: {
      type: 'cron' | 'interval' | 'once'
      expression: string
      timezone: string
      conditions?: {
        date_range?: { start: string; end: string }
        day_of_week?: number[]
        day_of_month?: number[]
        business_hours_only?: boolean
      }
    }
    
    // Webhook triggers
    webhook?: {
      endpoint_id: string
      secret: string
      allowed_sources?: string[]
      payload_validation?: {
        schema: any
        required_fields: string[]
      }
      response_config?: {
        success_response: any
        error_response: any
      }
    }
    
    // Condition group triggers
    condition_group?: {
      logic: 'AND' | 'OR' | 'NOT'
      conditions: {
        id: string
        type: 'api_check' | 'file_exists' | 'database_query' | 'metric_threshold' | 'time_window'
        config: any
        weight?: number
      }[]
      evaluation_interval: number
      timeout_minutes: number
    }
    
    // File watcher triggers
    file_watcher?: {
      path: string
      pattern: string
      events: ('create' | 'modify' | 'delete')[]
      debounce_ms: number
    }
    
    // Database event triggers
    database_event?: {
      table: string
      operation: ('INSERT' | 'UPDATE' | 'DELETE')[]
      filter?: any
      batch_size?: number
      batch_timeout_ms?: number
    }
    
    // API monitoring triggers
    api_monitor?: {
      url: string
      method: string
      headers?: Record<string, string>
      expected_status?: number[]
      expected_response?: any
      check_interval: number
      failure_threshold: number
      success_threshold: number
    }
  }
  is_active: boolean
  last_triggered: string | null
  next_trigger: string | null
  trigger_count: number
  failure_count: number
  metadata: {
    created_by: string
    description?: string
    tags?: string[]
  }
  created_at: string
  updated_at: string
}

export interface TriggerExecution {
  id: string
  trigger_id: string
  workflow_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  trigger_data: any
  execution_time: number
  error_message?: string
  created_at: string
  completed_at?: string
}

export class AdvancedTriggerManager {
  private static activeJobs = new Map<string, any>()

  /**
   * Create a new advanced trigger
   */
  static async createTrigger(trigger: Omit<AdvancedTrigger, 'id' | 'created_at' | 'updated_at' | 'last_triggered' | 'next_trigger' | 'trigger_count' | 'failure_count'>): Promise<{ success: boolean; trigger?: AdvancedTrigger; error?: string }> {
    try {
      // Validate trigger configuration
      const validation = this.validateTriggerConfig(trigger.type, trigger.config)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Calculate next trigger time for scheduled triggers
      let nextTrigger = null
      if (trigger.type === 'time_based' && trigger.config.schedule) {
        nextTrigger = this.calculateNextTriggerTime(trigger.config.schedule)
      }

      const { data, error } = await supabase
        .from('advanced_triggers')
        .insert({
          workflow_id: trigger.workflow_id,
          name: trigger.name,
          type: trigger.type,
          config: trigger.config,
          is_active: trigger.is_active,
          next_trigger: nextTrigger,
          trigger_count: 0,
          failure_count: 0,
          metadata: trigger.metadata
        })
        .select()
        .single()

      if (error) throw error

      // Start monitoring if active
      if (trigger.is_active) {
        await this.startTriggerMonitoring(data.id)
      }

      return { success: true, trigger: data }
    } catch (error) {
      console.error('Failed to create advanced trigger:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update an existing trigger
   */
  static async updateTrigger(triggerId: string, updates: Partial<AdvancedTrigger>): Promise<{ success: boolean; trigger?: AdvancedTrigger; error?: string }> {
    try {
      const { data: currentTrigger, error: fetchError } = await supabase
        .from('advanced_triggers')
        .select('*')
        .eq('id', triggerId)
        .single()

      if (fetchError) throw fetchError

      // Stop current monitoring
      if (this.activeJobs.has(triggerId)) {
        this.stopTriggerMonitoring(triggerId)
      }

      // Update next trigger time if schedule changed
      let nextTrigger = updates.next_trigger
      if (updates.config?.schedule) {
        nextTrigger = this.calculateNextTriggerTime(updates.config.schedule)
      }

      const { data, error } = await supabase
        .from('advanced_triggers')
        .update({
          ...updates,
          next_trigger: nextTrigger,
          updated_at: new Date().toISOString()
        })
        .eq('id', triggerId)
        .select()
        .single()

      if (error) throw error

      // Restart monitoring if active
      if (data.is_active) {
        await this.startTriggerMonitoring(triggerId)
      }

      return { success: true, trigger: data }
    } catch (error) {
      console.error('Failed to update advanced trigger:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete a trigger
   */
  static async deleteTrigger(triggerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Stop monitoring
      this.stopTriggerMonitoring(triggerId)

      const { error } = await supabase
        .from('advanced_triggers')
        .delete()
        .eq('id', triggerId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Failed to delete advanced trigger:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Start monitoring all active triggers
   */
  static async startAllTriggerMonitoring(): Promise<void> {
    try {
      const { data: triggers, error } = await supabase
        .from('advanced_triggers')
        .select('*')
        .eq('is_active', true)

      if (error) throw error

      for (const trigger of triggers || []) {
        await this.startTriggerMonitoring(trigger.id)
      }

      console.log(`🚀 Started monitoring ${triggers?.length || 0} advanced triggers`)
    } catch (error) {
      console.error('Failed to start trigger monitoring:', error)
    }
  }

  /**
   * Start monitoring a specific trigger
   */
  static async startTriggerMonitoring(triggerId: string): Promise<void> {
    try {
      const { data: trigger, error } = await supabase
        .from('advanced_triggers')
        .select('*')
        .eq('id', triggerId)
        .single()

      if (error) throw error
      if (!trigger || !trigger.is_active) return

      switch (trigger.type) {
        case 'time_based':
          this.setupTimeBasedTrigger(trigger)
          break
        case 'condition_group':
          this.setupConditionGroupTrigger(trigger)
          break
        case 'api_monitor':
          this.setupApiMonitorTrigger(trigger)
          break
        case 'webhook':
          this.setupWebhookTrigger(trigger)
          break
        case 'file_watcher':
          this.setupFileWatcherTrigger(trigger)
          break
        case 'database_event':
          this.setupDatabaseEventTrigger(trigger)
          break
      }

      console.log(`✅ Started monitoring trigger ${trigger.name} (${trigger.type})`)
    } catch (error) {
      console.error(`Failed to start monitoring trigger ${triggerId}:`, error)
    }
  }

  /**
   * Stop monitoring a specific trigger
   */
  static stopTriggerMonitoring(triggerId: string): void {
    const job = this.activeJobs.get(triggerId)
    if (job) {
      if (job.destroy) {
        job.destroy()
      } else if (job.cancel) {
        job.cancel()
      } else if (typeof job === 'function') {
        clearInterval(job)
      }
      this.activeJobs.delete(triggerId)
      console.log(`⏹️ Stopped monitoring trigger ${triggerId}`)
    }
  }

  /**
   * Execute a trigger
   */
  static async executeTrigger(triggerId: string, triggerData: any = {}): Promise<{ success: boolean; execution?: TriggerExecution; error?: string }> {
    const startTime = Date.now()
    let executionRecord: any = null

    try {
      // Get trigger details
      const { data: trigger, error: triggerError } = await supabase
        .from('advanced_triggers')
        .select('*')
        .eq('id', triggerId)
        .single()

      if (triggerError) throw triggerError
      if (!trigger) throw new Error('Trigger not found')

      // Create execution record
      const { data: execution, error: execError } = await supabase
        .from('trigger_executions')
        .insert({
          trigger_id: triggerId,
          workflow_id: trigger.workflow_id,
          status: 'running',
          trigger_data: triggerData
        })
        .select()
        .single()

      if (execError) throw execError
      executionRecord = execution

      // Execute the workflow
      const workflowResult = await startWorkflowExecution(trigger.workflow_id, null, {
        triggered_by: 'advanced_trigger',
        trigger_id: triggerId,
        trigger_data: triggerData
      })

      if (!workflowResult.success) {
        throw new Error(workflowResult.error || 'Workflow execution failed')
      }

      const executionTime = Date.now() - startTime

      // Update execution record
      const { data: completedExecution, error: updateError } = await supabase
        .from('trigger_executions')
        .update({
          status: 'completed',
          execution_time: executionTime,
          completed_at: new Date().toISOString()
        })
        .eq('id', execution.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Update trigger statistics
      await supabase
        .from('advanced_triggers')
        .update({
          last_triggered: new Date().toISOString(),
          trigger_count: trigger.trigger_count + 1,
          next_trigger: trigger.type === 'time_based' ? this.calculateNextTriggerTime(trigger.config.schedule) : trigger.next_trigger
        })
        .eq('id', triggerId)

      console.log(`✅ Trigger ${trigger.name} executed successfully in ${executionTime}ms`)

      return { success: true, execution: completedExecution }
    } catch (error) {
      console.error(`Failed to execute trigger ${triggerId}:`, error)

      const executionTime = Date.now() - startTime

      // Update execution record with error
      if (executionRecord) {
        await supabase
          .from('trigger_executions')
          .update({
            status: 'failed',
            execution_time: executionTime,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', executionRecord.id)
      }

      // Update trigger failure count
      await supabase
        .from('advanced_triggers')
        .update({
          failure_count: supabase.rpc('increment_failure_count', { trigger_id: triggerId })
        })
        .eq('id', triggerId)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Setup time-based trigger monitoring
   */
  private static setupTimeBasedTrigger(trigger: AdvancedTrigger): void {
    if (!trigger.config.schedule) return

    const { schedule } = trigger.config
    let interval: any = null

    switch (schedule.type) {
      case 'cron':
        // Use a lightweight cron parser/scheduler
        interval = this.setupCronTrigger(trigger)
        break
      case 'interval':
        // Parse interval expression (e.g., "5m", "1h", "30s")
        const ms = this.parseInterval(schedule.expression)
        if (ms > 0) {
          interval = setInterval(() => {
            if (this.shouldTriggerNow(trigger)) {
              this.executeTrigger(trigger.id)
            }
          }, ms)
        }
        break
      case 'once':
        // Schedule one-time execution
        const executeAt = new Date(schedule.expression).getTime()
        const delay = executeAt - Date.now()
        if (delay > 0) {
          interval = setTimeout(() => {
            this.executeTrigger(trigger.id)
            this.stopTriggerMonitoring(trigger.id)
          }, delay)
        }
        break
    }

    if (interval) {
      this.activeJobs.set(trigger.id, interval)
    }
  }

  /**
   * Setup condition group trigger monitoring
   */
  private static setupConditionGroupTrigger(trigger: AdvancedTrigger): void {
    if (!trigger.config.condition_group) return

    const { condition_group } = trigger.config
    const interval = setInterval(async () => {
      try {
        const conditionResults = await Promise.all(
          condition_group.conditions.map(condition => 
            this.evaluateCondition(condition)
          )
        )

        const shouldTrigger = this.evaluateLogic(condition_group.logic, conditionResults)

        if (shouldTrigger) {
          await this.executeTrigger(trigger.id, { condition_results: conditionResults })
        }
      } catch (error) {
        console.error(`Error evaluating condition group for trigger ${trigger.id}:`, error)
      }
    }, condition_group.evaluation_interval * 1000)

    this.activeJobs.set(trigger.id, interval)
  }

  /**
   * Setup API monitor trigger
   */
  private static setupApiMonitorTrigger(trigger: AdvancedTrigger): void {
    if (!trigger.config.api_monitor) return

    const { api_monitor } = trigger.config
    let failureCount = 0
    let successCount = 0

    const interval = setInterval(async () => {
      try {
        const response = await fetch(api_monitor.url, {
          method: api_monitor.method,
          headers: api_monitor.headers
        })

        const isSuccess = api_monitor.expected_status 
          ? api_monitor.expected_status.includes(response.status)
          : response.ok

        if (isSuccess) {
          successCount++
          failureCount = 0

          if (successCount >= api_monitor.success_threshold) {
            await this.executeTrigger(trigger.id, { 
              api_status: 'healthy',
              response_status: response.status,
              check_time: new Date().toISOString()
            })
            successCount = 0
          }
        } else {
          failureCount++
          successCount = 0

          if (failureCount >= api_monitor.failure_threshold) {
            await this.executeTrigger(trigger.id, {
              api_status: 'unhealthy',
              response_status: response.status,
              failure_count: failureCount,
              check_time: new Date().toISOString()
            })
            failureCount = 0
          }
        }
      } catch (error) {
        failureCount++
        console.error(`API monitor error for trigger ${trigger.id}:`, error)

        if (failureCount >= api_monitor.failure_threshold) {
          await this.executeTrigger(trigger.id, {
            api_status: 'error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            failure_count: failureCount,
            check_time: new Date().toISOString()
          })
          failureCount = 0
        }
      }
    }, api_monitor.check_interval * 1000)

    this.activeJobs.set(trigger.id, interval)
  }

  /**
   * Setup webhook trigger (placeholder - would integrate with webhook system)
   */
  private static setupWebhookTrigger(trigger: AdvancedTrigger): void {
    // Webhook triggers are handled by the webhook endpoint
    // Just register the trigger as active
    console.log(`Webhook trigger ${trigger.id} registered and waiting for requests`)
  }

  /**
   * Setup file watcher trigger (placeholder)
   */
  private static setupFileWatcherTrigger(trigger: AdvancedTrigger): void {
    // Would use fs.watch or similar for file system monitoring
    console.log(`File watcher trigger ${trigger.id} would monitor ${trigger.config.file_watcher?.path}`)
  }

  /**
   * Setup database event trigger (placeholder)
   */
  private static setupDatabaseEventTrigger(trigger: AdvancedTrigger): void {
    // Would use database triggers or CDC (Change Data Capture)
    console.log(`Database event trigger ${trigger.id} would monitor ${trigger.config.database_event?.table}`)
  }

  /**
   * Validate trigger configuration
   */
  private static validateTriggerConfig(type: string, config: any): { valid: boolean; error?: string } {
    switch (type) {
      case 'time_based':
        if (!config.schedule) {
          return { valid: false, error: 'Schedule configuration is required for time-based triggers' }
        }
        break
      case 'condition_group':
        if (!config.condition_group || !config.condition_group.conditions?.length) {
          return { valid: false, error: 'Condition group configuration is required' }
        }
        break
      case 'api_monitor':
        if (!config.api_monitor || !config.api_monitor.url) {
          return { valid: false, error: 'API monitor URL is required' }
        }
        break
    }
    return { valid: true }
  }

  /**
   * Calculate next trigger time for scheduled triggers
   */
  private static calculateNextTriggerTime(schedule: any): string {
    // Simple implementation - would use a proper cron library in production
    const now = new Date()
    switch (schedule.type) {
      case 'interval':
        const ms = this.parseInterval(schedule.expression)
        return new Date(now.getTime() + ms).toISOString()
      case 'cron':
        // Would use cron parser to calculate next execution
        return new Date(now.getTime() + 3600000).toISOString() // Default to 1 hour
      case 'once':
        return schedule.expression
      default:
        return new Date(now.getTime() + 3600000).toISOString()
    }
  }

  /**
   * Parse interval expressions like "5m", "1h", "30s"
   */
  private static parseInterval(expression: string): number {
    const match = expression.match(/^(\d+)([smhd])$/)
    if (!match) return 0

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
      case 's': return value * 1000
      case 'm': return value * 60 * 1000
      case 'h': return value * 60 * 60 * 1000
      case 'd': return value * 24 * 60 * 60 * 1000
      default: return 0
    }
  }

  /**
   * Check if a time-based trigger should execute now
   */
  private static shouldTriggerNow(trigger: AdvancedTrigger): boolean {
    if (!trigger.config.schedule?.conditions) return true

    const now = new Date()
    const conditions = trigger.config.schedule.conditions

    // Check business hours
    if (conditions.business_hours_only) {
      const hour = now.getHours()
      if (hour < 9 || hour > 17) return false
    }

    // Check day of week
    if (conditions.day_of_week && !conditions.day_of_week.includes(now.getDay())) {
      return false
    }

    // Check day of month
    if (conditions.day_of_month && !conditions.day_of_month.includes(now.getDate())) {
      return false
    }

    return true
  }

  /**
   * Setup cron trigger (simplified)
   */
  private static setupCronTrigger(trigger: AdvancedTrigger): any {
    // In production, use a proper cron library like node-cron
    // For now, use a simple interval
    return setInterval(() => {
      if (this.shouldTriggerNow(trigger)) {
        this.executeTrigger(trigger.id)
      }
    }, 60000) // Check every minute
  }

  /**
   * Evaluate a single condition
   */
  private static async evaluateCondition(condition: any): Promise<boolean> {
    switch (condition.type) {
      case 'api_check':
        try {
          const response = await fetch(condition.config.url)
          return response.ok
        } catch {
          return false
        }
      case 'file_exists':
        // Would check if file exists
        return true // Placeholder
      case 'metric_threshold':
        // Would check metric value against threshold
        return Math.random() > 0.5 // Placeholder
      default:
        return false
    }
  }

  /**
   * Evaluate logic for condition groups
   */
  private static evaluateLogic(logic: string, results: boolean[]): boolean {
    switch (logic) {
      case 'AND':
        return results.every(r => r)
      case 'OR':
        return results.some(r => r)
      case 'NOT':
        return !results.every(r => r)
      default:
        return false
    }
  }
}

/**
 * Database schemas for advanced triggers
 */
export const advancedTriggersTableSchemas = `
-- Advanced triggers table
CREATE TABLE IF NOT EXISTS advanced_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered TIMESTAMPTZ,
  next_trigger TIMESTAMPTZ,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  INDEX idx_advanced_triggers_workflow_id (workflow_id),
  INDEX idx_advanced_triggers_type (type),
  INDEX idx_advanced_triggers_active (is_active),
  INDEX idx_advanced_triggers_next_trigger (next_trigger),
  
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- Trigger executions table
CREATE TABLE IF NOT EXISTS trigger_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_id UUID NOT NULL,
  workflow_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  trigger_data JSONB DEFAULT '{}',
  execution_time INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  INDEX idx_trigger_executions_trigger_id (trigger_id),
  INDEX idx_trigger_executions_workflow_id (workflow_id),
  INDEX idx_trigger_executions_status (status),
  INDEX idx_trigger_executions_created_at (created_at),
  
  FOREIGN KEY (trigger_id) REFERENCES advanced_triggers(id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);
`