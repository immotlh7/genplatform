/**
 * Advanced Workflow Triggers System
 * Handles time-based conditional triggers, external API webhook integration,
 * multi-condition logic gates, and custom trigger expressions
 */

export interface WorkflowTrigger {
  id: string;
  workflowId: string;
  name: string;
  description: string;
  type: 'time' | 'webhook' | 'event' | 'condition' | 'composite';
  enabled: boolean;
  config: TriggerConfig;
  conditions: TriggerCondition[];
  actions: TriggerAction[];
  metadata: {
    createdAt: Date;
    createdBy: string;
    lastTriggered?: Date;
    triggerCount: number;
    successCount: number;
    failureCount: number;
  };
}

export interface TriggerConfig {
  // Time-based triggers
  schedule?: {
    cron?: string;
    timezone?: string;
    startDate?: Date;
    endDate?: Date;
    intervals?: {
      every: number;
      unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
    };
  };

  // Webhook triggers
  webhook?: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers: Record<string, string>;
    authentication?: {
      type: 'bearer' | 'basic' | 'apikey';
      credentials: Record<string, string>;
    };
    retries: number;
    timeout: number;
  };

  // Event triggers
  event?: {
    source: string;
    eventType: string;
    filters: Record<string, any>;
  };

  // Condition-based triggers
  condition?: {
    expression: string;
    variables: Record<string, any>;
    evaluationInterval: number; // milliseconds
  };

  // Composite triggers
  composite?: {
    logic: 'AND' | 'OR' | 'NOT' | 'XOR';
    subTriggers: string[]; // IDs of other triggers
    requireAll?: boolean;
    timeWindow?: number; // milliseconds - all conditions must be met within this window
  };
}

export interface TriggerCondition {
  id: string;
  type: 'time' | 'data' | 'system' | 'custom';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'matches' | 'exists' | 'custom';
  field: string;
  value: any;
  expression?: string; // For custom conditions
}

export interface TriggerAction {
  id: string;
  type: 'start_workflow' | 'send_notification' | 'update_data' | 'call_webhook' | 'custom';
  config: Record<string, any>;
  retryPolicy?: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    initialDelay: number;
  };
}

export interface TriggerEvent {
  id: string;
  triggerId: string;
  workflowId: string;
  timestamp: Date;
  eventType: string;
  payload: any;
  source: string;
  processed: boolean;
  result?: 'success' | 'failure' | 'skipped';
  error?: string;
}

class AdvancedTriggerManager {
  private triggers: Map<string, WorkflowTrigger> = new Map();
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();
  private eventQueue: TriggerEvent[] = [];
  private webhookEndpoints: Map<string, string> = new Map();
  private conditionEvaluators: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Register a new trigger
   */
  registerTrigger(trigger: Omit<WorkflowTrigger, 'id' | 'metadata'>): string {
    const id = `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullTrigger: WorkflowTrigger = {
      id,
      ...trigger,
      metadata: {
        createdAt: new Date(),
        createdBy: 'system', // In real implementation, get from auth context
        triggerCount: 0,
        successCount: 0,
        failureCount: 0
      }
    };

    this.triggers.set(id, fullTrigger);
    
    if (trigger.enabled) {
      this.activateTrigger(id);
    }

    console.log(`🎯 Registered trigger: ${trigger.name} (${trigger.type})`);
    return id;
  }

  /**
   * Activate a trigger
   */
  activateTrigger(triggerId: string): void {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) {
      console.error(`Trigger ${triggerId} not found`);
      return;
    }

    if (!trigger.enabled) {
      trigger.enabled = true;
    }

    switch (trigger.type) {
      case 'time':
        this.setupTimeTrigger(trigger);
        break;
      case 'webhook':
        this.setupWebhookTrigger(trigger);
        break;
      case 'condition':
        this.setupConditionTrigger(trigger);
        break;
      case 'composite':
        this.setupCompositeTrigger(trigger);
        break;
      case 'event':
        // Event triggers are passive - they respond to incoming events
        break;
    }

    console.log(`✅ Activated trigger: ${trigger.name}`);
  }

  /**
   * Deactivate a trigger
   */
  deactivateTrigger(triggerId: string): void {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) return;

    trigger.enabled = false;

    // Clear any active timers
    const timer = this.activeTimers.get(triggerId);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(triggerId);
    }

    const evaluator = this.conditionEvaluators.get(triggerId);
    if (evaluator) {
      clearInterval(evaluator);
      this.conditionEvaluators.delete(evaluator);
    }

    console.log(`⏹️ Deactivated trigger: ${trigger.name}`);
  }

  /**
   * Setup time-based trigger
   */
  private setupTimeTrigger(trigger: WorkflowTrigger): void {
    const { schedule } = trigger.config;
    if (!schedule) return;

    if (schedule.cron) {
      // Setup cron-based scheduling
      this.setupCronTrigger(trigger, schedule.cron, schedule.timezone);
    } else if (schedule.intervals) {
      // Setup interval-based scheduling
      this.setupIntervalTrigger(trigger, schedule.intervals);
    }
  }

  /**
   * Setup cron trigger
   */
  private setupCronTrigger(trigger: WorkflowTrigger, cronExpression: string, timezone?: string): void {
    try {
      // Parse cron expression and calculate next execution time
      const nextExecution = this.parseCronExpression(cronExpression, timezone);
      const delay = nextExecution.getTime() - Date.now();

      if (delay > 0) {
        const timer = setTimeout(() => {
          this.executeTrigger(trigger.id, {
            source: 'cron',
            eventType: 'scheduled',
            payload: { cronExpression, nextExecution }
          });

          // Schedule the next execution
          this.setupCronTrigger(trigger, cronExpression, timezone);
        }, delay);

        this.activeTimers.set(trigger.id, timer);
        console.log(`⏰ Scheduled cron trigger ${trigger.name} for ${nextExecution.toISOString()}`);
      }
    } catch (error) {
      console.error(`Error setting up cron trigger for ${trigger.name}:`, error);
    }
  }

  /**
   * Setup interval trigger
   */
  private setupIntervalTrigger(trigger: WorkflowTrigger, intervals: { every: number; unit: string }): void {
    const { every, unit } = intervals;
    let milliseconds = 0;

    switch (unit) {
      case 'minutes': milliseconds = every * 60 * 1000; break;
      case 'hours': milliseconds = every * 60 * 60 * 1000; break;
      case 'days': milliseconds = every * 24 * 60 * 60 * 1000; break;
      case 'weeks': milliseconds = every * 7 * 24 * 60 * 60 * 1000; break;
      case 'months': milliseconds = every * 30 * 24 * 60 * 60 * 1000; break; // Approximate
    }

    if (milliseconds > 0) {
      const timer = setInterval(() => {
        this.executeTrigger(trigger.id, {
          source: 'interval',
          eventType: 'scheduled',
          payload: { interval: intervals }
        });
      }, milliseconds);

      this.activeTimers.set(trigger.id, timer as any);
      console.log(`⏰ Setup interval trigger ${trigger.name} every ${every} ${unit}`);
    }
  }

  /**
   * Setup webhook trigger
   */
  private setupWebhookTrigger(trigger: WorkflowTrigger): void {
    const { webhook } = trigger.config;
    if (!webhook) return;

    // Generate unique webhook endpoint
    const webhookPath = `/webhooks/${trigger.id}`;
    this.webhookEndpoints.set(webhookPath, trigger.id);

    console.log(`🪝 Setup webhook trigger ${trigger.name} at ${webhookPath}`);
  }

  /**
   * Setup condition-based trigger
   */
  private setupConditionTrigger(trigger: WorkflowTrigger): void {
    const { condition } = trigger.config;
    if (!condition) return;

    const evaluator = setInterval(async () => {
      try {
        const result = await this.evaluateCondition(condition.expression, condition.variables);
        
        if (result) {
          this.executeTrigger(trigger.id, {
            source: 'condition',
            eventType: 'condition_met',
            payload: { 
              expression: condition.expression,
              variables: condition.variables,
              result 
            }
          });
        }
      } catch (error) {
        console.error(`Error evaluating condition for trigger ${trigger.name}:`, error);
      }
    }, condition.evaluationInterval || 60000); // Default 1 minute

    this.conditionEvaluators.set(trigger.id, evaluator);
    console.log(`🔍 Setup condition trigger ${trigger.name} with expression: ${condition.expression}`);
  }

  /**
   * Setup composite trigger
   */
  private setupCompositeTrigger(trigger: WorkflowTrigger): void {
    const { composite } = trigger.config;
    if (!composite) return;

    // Composite triggers are evaluated when their sub-triggers fire
    console.log(`🔗 Setup composite trigger ${trigger.name} with logic: ${composite.logic}`);
  }

  /**
   * Execute trigger actions
   */
  private async executeTrigger(triggerId: string, eventData: any): Promise<void> {
    const trigger = this.triggers.get(triggerId);
    if (!trigger || !trigger.enabled) return;

    // Check conditions
    const conditionsMet = await this.checkTriggerConditions(trigger, eventData);
    if (!conditionsMet) {
      console.log(`⏭️ Trigger conditions not met for ${trigger.name}`);
      return;
    }

    // Update metadata
    trigger.metadata.triggerCount++;
    trigger.metadata.lastTriggered = new Date();

    // Create trigger event
    const triggerEvent: TriggerEvent = {
      id: `event_${Date.now()}`,
      triggerId,
      workflowId: trigger.workflowId,
      timestamp: new Date(),
      eventType: eventData.eventType || 'unknown',
      payload: eventData.payload || eventData,
      source: eventData.source || 'system',
      processed: false
    };

    this.eventQueue.push(triggerEvent);

    try {
      // Execute trigger actions
      for (const action of trigger.actions) {
        await this.executeAction(action, triggerEvent);
      }

      triggerEvent.processed = true;
      triggerEvent.result = 'success';
      trigger.metadata.successCount++;

      console.log(`✅ Executed trigger: ${trigger.name}`);
    } catch (error) {
      triggerEvent.processed = true;
      triggerEvent.result = 'failure';
      triggerEvent.error = error instanceof Error ? error.message : 'Unknown error';
      trigger.metadata.failureCount++;

      console.error(`❌ Failed to execute trigger ${trigger.name}:`, error);
    }
  }

  /**
   * Check if trigger conditions are met
   */
  private async checkTriggerConditions(trigger: WorkflowTrigger, eventData: any): Promise<boolean> {
    if (trigger.conditions.length === 0) return true;

    for (const condition of trigger.conditions) {
      const met = await this.evaluateTriggerCondition(condition, eventData);
      if (!met) return false;
    }

    return true;
  }

  /**
   * Evaluate individual trigger condition
   */
  private async evaluateTriggerCondition(condition: TriggerCondition, eventData: any): Promise<boolean> {
    try {
      const fieldValue = this.extractFieldValue(condition.field, eventData);

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'matches':
          return new RegExp(condition.value).test(String(fieldValue));
        case 'exists':
          return fieldValue !== undefined && fieldValue !== null;
        case 'custom':
          if (condition.expression) {
            return await this.evaluateCondition(condition.expression, { 
              ...eventData, 
              fieldValue, 
              value: condition.value 
            });
          }
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error evaluating trigger condition:', error);
      return false;
    }
  }

  /**
   * Execute trigger action
   */
  private async executeAction(action: TriggerAction, event: TriggerEvent): Promise<void> {
    switch (action.type) {
      case 'start_workflow':
        await this.startWorkflow(event.workflowId, action.config, event);
        break;
      case 'send_notification':
        await this.sendNotification(action.config, event);
        break;
      case 'update_data':
        await this.updateData(action.config, event);
        break;
      case 'call_webhook':
        await this.callWebhook(action.config, event);
        break;
      case 'custom':
        await this.executeCustomAction(action.config, event);
        break;
    }
  }

  /**
   * Start workflow action
   */
  private async startWorkflow(workflowId: string, config: any, event: TriggerEvent): Promise<void> {
    console.log(`🚀 Starting workflow ${workflowId} from trigger ${event.triggerId}`);
    
    // In real implementation, this would call the workflow execution engine
    const workflowData = {
      workflowId,
      triggeredBy: event.triggerId,
      triggerEvent: event,
      parameters: config.parameters || {},
      priority: config.priority || 'normal'
    };

    // Mock workflow start
    console.log(`📋 Workflow started with data:`, workflowData);
  }

  /**
   * Send notification action
   */
  private async sendNotification(config: any, event: TriggerEvent): Promise<void> {
    const notification = {
      type: config.type || 'info',
      title: config.title || 'Workflow Triggered',
      message: config.message || `Trigger ${event.triggerId} executed`,
      recipients: config.recipients || [],
      channels: config.channels || ['email']
    };

    console.log(`📧 Sending notification:`, notification);
  }

  /**
   * Update data action
   */
  private async updateData(config: any, event: TriggerEvent): Promise<void> {
    console.log(`📊 Updating data:`, config);
    // Implementation would update database/external system
  }

  /**
   * Call webhook action
   */
  private async callWebhook(config: any, event: TriggerEvent): Promise<void> {
    console.log(`🌐 Calling webhook:`, config.url);
    
    try {
      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify({
          triggerEvent: event,
          data: config.data
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook call failed: ${response.status} ${response.statusText}`);
      }

      console.log(`✅ Webhook called successfully`);
    } catch (error) {
      console.error(`❌ Webhook call failed:`, error);
      throw error;
    }
  }

  /**
   * Execute custom action
   */
  private async executeCustomAction(config: any, event: TriggerEvent): Promise<void> {
    console.log(`⚙️ Executing custom action:`, config);
    // Implementation would execute custom logic based on config
  }

  /**
   * Process incoming webhook
   */
  processWebhook(path: string, method: string, headers: any, body: any): boolean {
    const triggerId = this.webhookEndpoints.get(path);
    if (!triggerId) return false;

    this.executeTrigger(triggerId, {
      source: 'webhook',
      eventType: 'webhook_received',
      payload: { method, headers, body }
    });

    return true;
  }

  /**
   * Process incoming event
   */
  processEvent(eventType: string, source: string, payload: any): void {
    // Find triggers that match this event
    const matchingTriggers = Array.from(this.triggers.values()).filter(trigger => 
      trigger.enabled && 
      trigger.type === 'event' && 
      trigger.config.event?.eventType === eventType &&
      trigger.config.event?.source === source
    );

    matchingTriggers.forEach(trigger => {
      this.executeTrigger(trigger.id, {
        source,
        eventType,
        payload
      });
    });
  }

  /**
   * Utility functions
   */

  private parseCronExpression(cron: string, timezone?: string): Date {
    // Simplified cron parsing - in real implementation, use a cron library
    const now = new Date();
    const nextExecution = new Date(now.getTime() + 60000); // Default to 1 minute from now
    
    // TODO: Implement proper cron parsing
    console.log(`⏰ Parsing cron expression: ${cron}`);
    
    return nextExecution;
  }

  private async evaluateCondition(expression: string, variables: any): Promise<boolean> {
    try {
      // Simple expression evaluation - in production, use a safe expression evaluator
      const func = new Function('vars', `with(vars) { return ${expression}; }`);
      return Boolean(func(variables));
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  private extractFieldValue(fieldPath: string, data: any): any {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], data);
  }

  /**
   * Get trigger statistics
   */
  getTriggerStats(triggerId: string): any {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) return null;

    return {
      id: triggerId,
      name: trigger.name,
      type: trigger.type,
      enabled: trigger.enabled,
      totalTriggers: trigger.metadata.triggerCount,
      successfulTriggers: trigger.metadata.successCount,
      failedTriggers: trigger.metadata.failureCount,
      successRate: trigger.metadata.triggerCount > 0 
        ? (trigger.metadata.successCount / trigger.metadata.triggerCount) * 100 
        : 0,
      lastTriggered: trigger.metadata.lastTriggered,
      nextExecution: this.getNextExecutionTime(trigger)
    };
  }

  private getNextExecutionTime(trigger: WorkflowTrigger): Date | null {
    // Calculate next execution time based on trigger type
    // This is simplified - real implementation would handle all trigger types
    return null;
  }

  /**
   * Get all triggers
   */
  getAllTriggers(): WorkflowTrigger[] {
    return Array.from(this.triggers.values());
  }

  /**
   * Get triggers for specific workflow
   */
  getWorkflowTriggers(workflowId: string): WorkflowTrigger[] {
    return Array.from(this.triggers.values()).filter(t => t.workflowId === workflowId);
  }

  /**
   * Get recent trigger events
   */
  getRecentEvents(limit: number = 50): TriggerEvent[] {
    return this.eventQueue
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

// Singleton instance
export const advancedTriggers = new AdvancedTriggerManager();

// Convenience functions
export const registerTrigger = (trigger: Omit<WorkflowTrigger, 'id' | 'metadata'>) => 
  advancedTriggers.registerTrigger(trigger);

export const activateTrigger = (triggerId: string) => 
  advancedTriggers.activateTrigger(triggerId);

export const deactivateTrigger = (triggerId: string) => 
  advancedTriggers.deactivateTrigger(triggerId);

export const processWebhook = (path: string, method: string, headers: any, body: any) => 
  advancedTriggers.processWebhook(path, method, headers, body);

export const processEvent = (eventType: string, source: string, payload: any) => 
  advancedTriggers.processEvent(eventType, source, payload);

// Export types
export type { WorkflowTrigger, TriggerConfig, TriggerCondition, TriggerAction, TriggerEvent };