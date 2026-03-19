/**
 * Workflow Costing Module
 * 
 * Provides cost analysis and budget tracking for workflow executions:
 * - Resource usage cost calculation
 * - Budget tracking per workflow
 * - Cost optimization recommendations
 * - Billing integration
 */

import { supabase } from '@/lib/supabase-client';

export interface ResourceCost {
  type: 'compute' | 'storage' | 'api_call' | 'data_transfer' | 'external_service';
  unit: string;
  pricePerUnit: number;
  currency: string;
}

export interface WorkflowCost {
  workflowId: string;
  executionId: string;
  totalCost: number;
  currency: string;
  breakdown: CostBreakdown[];
  timestamp: Date;
  duration: number; // in milliseconds
}

export interface CostBreakdown {
  stepId: string;
  stepName: string;
  resourceType: ResourceCost['type'];
  usage: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface BudgetConfig {
  workflowId: string;
  monthlyLimit: number;
  dailyLimit?: number;
  alertThreshold: number; // percentage (e.g., 80 for 80%)
  currency: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface CostOptimization {
  type: 'reduce_frequency' | 'optimize_resources' | 'cache_results' | 'batch_operations' | 'use_cheaper_service';
  description: string;
  potentialSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

// Default pricing model (would be configurable in production)
const DEFAULT_PRICING: Record<ResourceCost['type'], ResourceCost> = {
  compute: {
    type: 'compute',
    unit: 'second',
    pricePerUnit: 0.0001, // $0.0001 per second
    currency: 'USD'
  },
  storage: {
    type: 'storage',
    unit: 'GB-hour',
    pricePerUnit: 0.00003, // $0.00003 per GB-hour
    currency: 'USD'
  },
  api_call: {
    type: 'api_call',
    unit: 'request',
    pricePerUnit: 0.00001, // $0.00001 per API call
    currency: 'USD'
  },
  data_transfer: {
    type: 'data_transfer',
    unit: 'GB',
    pricePerUnit: 0.01, // $0.01 per GB
    currency: 'USD'
  },
  external_service: {
    type: 'external_service',
    unit: 'call',
    pricePerUnit: 0.001, // $0.001 per external service call
    currency: 'USD'
  }
};

export class WorkflowCostCalculator {
  private pricing: Record<ResourceCost['type'], ResourceCost>;
  
  constructor(customPricing?: Partial<Record<ResourceCost['type'], ResourceCost>>) {
    this.pricing = { ...DEFAULT_PRICING, ...customPricing };
  }

  /**
   * Calculate cost for a workflow execution
   */
  async calculateWorkflowCost(
    workflowId: string,
    executionId: string,
    steps: WorkflowStep[]
  ): Promise<WorkflowCost> {
    const breakdown: CostBreakdown[] = [];
    let totalCost = 0;
    let totalDuration = 0;

    for (const step of steps) {
      const stepCosts = await this.calculateStepCost(step);
      breakdown.push(...stepCosts);
      totalCost += stepCosts.reduce((sum, cost) => sum + cost.totalCost, 0);
      totalDuration += step.duration || 0;
    }

    const workflowCost: WorkflowCost = {
      workflowId,
      executionId,
      totalCost,
      currency: 'USD',
      breakdown,
      timestamp: new Date(),
      duration: totalDuration
    };

    // Store cost data
    await this.storeCostData(workflowCost);

    return workflowCost;
  }

  /**
   * Calculate cost for a single step
   */
  private async calculateStepCost(step: WorkflowStep): Promise<CostBreakdown[]> {
    const costs: CostBreakdown[] = [];

    // Compute cost (based on duration)
    if (step.duration) {
      const computeSeconds = step.duration / 1000;
      costs.push({
        stepId: step.id,
        stepName: step.name,
        resourceType: 'compute',
        usage: computeSeconds,
        unit: 'second',
        unitCost: this.pricing.compute.pricePerUnit,
        totalCost: computeSeconds * this.pricing.compute.pricePerUnit
      });
    }

    // API call cost
    if (step.type === 'api' || step.type === 'webhook') {
      costs.push({
        stepId: step.id,
        stepName: step.name,
        resourceType: 'api_call',
        usage: 1,
        unit: 'request',
        unitCost: this.pricing.api_call.pricePerUnit,
        totalCost: this.pricing.api_call.pricePerUnit
      });
    }

    // External service cost
    if (step.type === 'external' && step.metadata?.service) {
      const serviceCost = await this.getExternalServiceCost(step.metadata.service);
      costs.push({
        stepId: step.id,
        stepName: step.name,
        resourceType: 'external_service',
        usage: 1,
        unit: 'call',
        unitCost: serviceCost,
        totalCost: serviceCost
      });
    }

    // Data transfer cost (if applicable)
    if (step.metadata?.dataTransferSize) {
      const gbTransferred = step.metadata.dataTransferSize / (1024 * 1024 * 1024);
      costs.push({
        stepId: step.id,
        stepName: step.name,
        resourceType: 'data_transfer',
        usage: gbTransferred,
        unit: 'GB',
        unitCost: this.pricing.data_transfer.pricePerUnit,
        totalCost: gbTransferred * this.pricing.data_transfer.pricePerUnit
      });
    }

    return costs;
  }

  /**
   * Get cost for external service calls (would integrate with service providers)
   */
  private async getExternalServiceCost(serviceName: string): Promise<number> {
    // In production, this would query actual service pricing
    const servicePricing: Record<string, number> = {
      'openai': 0.002,
      'sendgrid': 0.0001,
      'twilio': 0.001,
      'aws-s3': 0.0001,
      'google-cloud': 0.0001
    };

    return servicePricing[serviceName] || this.pricing.external_service.pricePerUnit;
  }

  /**
   * Store cost data in the database
   */
  private async storeCostData(cost: WorkflowCost): Promise<void> {
    try {
      await supabase.from('workflow_costs').insert({
        workflow_id: cost.workflowId,
        execution_id: cost.executionId,
        total_cost: cost.totalCost,
        currency: cost.currency,
        breakdown: cost.breakdown,
        timestamp: cost.timestamp,
        duration: cost.duration
      });
    } catch (error) {
      console.error('Error storing cost data:', error);
    }
  }

  /**
   * Get workflow cost history
   */
  async getWorkflowCostHistory(
    workflowId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WorkflowCost[]> {
    const { data, error } = await supabase
      .from('workflow_costs')
      .select('*')
      .eq('workflow_id', workflowId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching cost history:', error);
      return [];
    }

    return data.map(row => ({
      workflowId: row.workflow_id,
      executionId: row.execution_id,
      totalCost: row.total_cost,
      currency: row.currency,
      breakdown: row.breakdown,
      timestamp: new Date(row.timestamp),
      duration: row.duration
    }));
  }

  /**
   * Calculate cost statistics for a workflow
   */
  async getWorkflowCostStats(workflowId: string, period: 'day' | 'week' | 'month' | 'year') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const costs = await this.getWorkflowCostHistory(workflowId, startDate, now);

    return {
      totalCost: costs.reduce((sum, cost) => sum + cost.totalCost, 0),
      averageCost: costs.length > 0 ? costs.reduce((sum, cost) => sum + cost.totalCost, 0) / costs.length : 0,
      executionCount: costs.length,
      costByResource: this.aggregateCostsByResource(costs),
      costTrend: this.calculateCostTrend(costs)
    };
  }

  /**
   * Aggregate costs by resource type
   */
  private aggregateCostsByResource(costs: WorkflowCost[]): Record<ResourceCost['type'], number> {
    const aggregated: Record<ResourceCost['type'], number> = {
      compute: 0,
      storage: 0,
      api_call: 0,
      data_transfer: 0,
      external_service: 0
    };

    costs.forEach(cost => {
      cost.breakdown.forEach(item => {
        aggregated[item.resourceType] += item.totalCost;
      });
    });

    return aggregated;
  }

  /**
   * Calculate cost trend
   */
  private calculateCostTrend(costs: WorkflowCost[]): 'increasing' | 'decreasing' | 'stable' {
    if (costs.length < 2) return 'stable';

    const recentCosts = costs.slice(0, Math.min(5, costs.length));
    const olderCosts = costs.slice(Math.min(5, costs.length));

    const recentAvg = recentCosts.reduce((sum, cost) => sum + cost.totalCost, 0) / recentCosts.length;
    const olderAvg = olderCosts.length > 0 
      ? olderCosts.reduce((sum, cost) => sum + cost.totalCost, 0) / olderCosts.length
      : recentAvg;

    const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (percentChange > 10) return 'increasing';
    if (percentChange < -10) return 'decreasing';
    return 'stable';
  }
}

export class WorkflowBudgetManager {
  private calculator: WorkflowCostCalculator;

  constructor() {
    this.calculator = new WorkflowCostCalculator();
  }

  /**
   * Set budget for a workflow
   */
  async setBudget(budget: BudgetConfig): Promise<void> {
    await supabase.from('workflow_budgets').upsert({
      workflow_id: budget.workflowId,
      monthly_limit: budget.monthlyLimit,
      daily_limit: budget.dailyLimit,
      alert_threshold: budget.alertThreshold,
      currency: budget.currency,
      effective_from: budget.effectiveFrom,
      effective_to: budget.effectiveTo
    });
  }

  /**
   * Check if workflow is within budget
   */
  async checkBudget(workflowId: string): Promise<{
    withinBudget: boolean;
    currentSpend: number;
    budgetLimit: number;
    percentUsed: number;
    alertThresholdReached: boolean;
  }> {
    // Get budget config
    const { data: budgetData } = await supabase
      .from('workflow_budgets')
      .select('*')
      .eq('workflow_id', workflowId)
      .single();

    if (!budgetData) {
      return {
        withinBudget: true,
        currentSpend: 0,
        budgetLimit: Infinity,
        percentUsed: 0,
        alertThresholdReached: false
      };
    }

    // Calculate current month spend
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const costs = await this.calculator.getWorkflowCostHistory(workflowId, startOfMonth, now);
    const currentSpend = costs.reduce((sum, cost) => sum + cost.totalCost, 0);

    const percentUsed = (currentSpend / budgetData.monthly_limit) * 100;

    return {
      withinBudget: currentSpend <= budgetData.monthly_limit,
      currentSpend,
      budgetLimit: budgetData.monthly_limit,
      percentUsed,
      alertThresholdReached: percentUsed >= budgetData.alert_threshold
    };
  }

  /**
   * Get cost optimization recommendations
   */
  async getOptimizationRecommendations(workflowId: string): Promise<CostOptimization[]> {
    const recommendations: CostOptimization[] = [];
    const stats = await this.calculator.getWorkflowCostStats(workflowId, 'month');

    // High API call costs
    if (stats.costByResource.api_call > stats.totalCost * 0.3) {
      recommendations.push({
        type: 'batch_operations',
        description: 'Consider batching API calls to reduce per-request overhead',
        potentialSavings: stats.costByResource.api_call * 0.2,
        implementationEffort: 'medium',
        impact: 'high'
      });
    }

    // High compute costs
    if (stats.costByResource.compute > stats.totalCost * 0.5) {
      recommendations.push({
        type: 'optimize_resources',
        description: 'Optimize compute-intensive steps or consider caching results',
        potentialSavings: stats.costByResource.compute * 0.3,
        implementationEffort: 'high',
        impact: 'high'
      });
    }

    // Frequent executions
    if (stats.executionCount > 1000) {
      recommendations.push({
        type: 'reduce_frequency',
        description: 'Consider reducing execution frequency or implementing smart triggers',
        potentialSavings: stats.totalCost * 0.25,
        implementationEffort: 'low',
        impact: 'medium'
      });
    }

    // External service costs
    if (stats.costByResource.external_service > stats.totalCost * 0.4) {
      recommendations.push({
        type: 'use_cheaper_service',
        description: 'Evaluate alternative services or negotiate better rates',
        potentialSavings: stats.costByResource.external_service * 0.15,
        implementationEffort: 'medium',
        impact: 'medium'
      });
    }

    // Always recommend caching for workflows with increasing costs
    if (stats.costTrend === 'increasing') {
      recommendations.push({
        type: 'cache_results',
        description: 'Implement result caching to avoid redundant computations',
        potentialSavings: stats.totalCost * 0.2,
        implementationEffort: 'low',
        impact: 'medium'
      });
    }

    return recommendations;
  }
}

// Type definitions for workflow steps
interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  duration?: number;
  metadata?: {
    service?: string;
    dataTransferSize?: number;
    [key: string]: any;
  };
}

// Export convenience functions
export async function calculateWorkflowCost(
  workflowId: string,
  executionId: string,
  steps: WorkflowStep[]
): Promise<WorkflowCost> {
  const calculator = new WorkflowCostCalculator();
  return calculator.calculateWorkflowCost(workflowId, executionId, steps);
}

export async function checkWorkflowBudget(workflowId: string) {
  const manager = new WorkflowBudgetManager();
  return manager.checkBudget(workflowId);
}

export async function getWorkflowCostOptimizations(workflowId: string) {
  const manager = new WorkflowBudgetManager();
  return manager.getOptimizationRecommendations(workflowId);
}