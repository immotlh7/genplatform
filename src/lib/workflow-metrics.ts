/**
 * Workflow Metrics Collection Library
 * Real-time performance tracking and metrics collection for workflows
 */

export interface WorkflowRunMetrics {
  runId: string;
  workflowId: string;
  workflowName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  steps: WorkflowStepMetrics[];
  resourceUsage: ResourceMetrics;
  errorDetails?: ErrorMetrics;
  metadata: Record<string, any>;
}

export interface WorkflowStepMetrics {
  stepId: string;
  stepName: string;
  stepType: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  inputSize?: number;
  outputSize?: number;
  resourceUsage: ResourceMetrics;
  errorDetails?: ErrorMetrics;
  retryCount: number;
}

export interface ResourceMetrics {
  cpuUsage: number; // Percentage
  memoryUsage: number; // MB
  diskIO: number; // MB
  networkIO: number; // MB
  timestamp: Date;
}

export interface ErrorMetrics {
  errorType: string;
  errorCode?: string;
  errorMessage: string;
  stackTrace?: string;
  context: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface WorkflowPerformanceStats {
  workflowId: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
  averageDuration: number;
  medianDuration: number;
  p95Duration: number;
  averageResourceUsage: ResourceMetrics;
  errorFrequency: Record<string, number>;
  performanceTrend: 'improving' | 'degrading' | 'stable';
  lastUpdated: Date;
}

class WorkflowMetricsCollector {
  private activeRuns: Map<string, WorkflowRunMetrics> = new Map();
  private metricsBuffer: WorkflowRunMetrics[] = [];
  private resourceMonitorInterval: NodeJS.Timeout | null = null;

  /**
   * Start tracking a new workflow run
   */
  startWorkflowRun(workflowId: string, workflowName: string, metadata: Record<string, any> = {}): string {
    const runId = `${workflowId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const runMetrics: WorkflowRunMetrics = {
      runId,
      workflowId,
      workflowName,
      startTime: new Date(),
      status: 'running',
      steps: [],
      resourceUsage: this.getCurrentResourceMetrics(),
      metadata: {
        ...metadata,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    this.activeRuns.set(runId, runMetrics);
    this.startResourceMonitoring(runId);
    
    console.log(`📊 Started tracking workflow run: ${runId}`);
    return runId;
  }

  /**
   * End workflow run tracking
   */
  endWorkflowRun(runId: string, status: 'completed' | 'failed' | 'cancelled', errorDetails?: ErrorMetrics): void {
    const runMetrics = this.activeRuns.get(runId);
    if (!runMetrics) {
      console.warn(`Workflow run ${runId} not found in active runs`);
      return;
    }

    runMetrics.endTime = new Date();
    runMetrics.duration = runMetrics.endTime.getTime() - runMetrics.startTime.getTime();
    runMetrics.status = status;
    
    if (errorDetails && status === 'failed') {
      runMetrics.errorDetails = errorDetails;
    }

    // Complete any pending steps
    runMetrics.steps.forEach(step => {
      if (step.status === 'running' || step.status === 'pending') {
        step.status = status === 'completed' ? 'completed' : 'failed';
        step.endTime = new Date();
        step.duration = step.endTime.getTime() - step.startTime.getTime();
      }
    });

    this.stopResourceMonitoring(runId);
    this.activeRuns.delete(runId);
    this.metricsBuffer.push(runMetrics);

    console.log(`📊 Completed tracking workflow run: ${runId} (${status})`);
    this.flushMetricsIfNeeded();
  }

  /**
   * Start tracking a workflow step
   */
  startWorkflowStep(runId: string, stepId: string, stepName: string, stepType: string): void {
    const runMetrics = this.activeRuns.get(runId);
    if (!runMetrics) {
      console.warn(`Workflow run ${runId} not found for step tracking`);
      return;
    }

    const stepMetrics: WorkflowStepMetrics = {
      stepId,
      stepName,
      stepType,
      startTime: new Date(),
      status: 'running',
      resourceUsage: this.getCurrentResourceMetrics(),
      retryCount: 0
    };

    runMetrics.steps.push(stepMetrics);
    console.log(`📊 Started tracking step: ${stepId} in run: ${runId}`);
  }

  /**
   * End workflow step tracking
   */
  endWorkflowStep(
    runId: string, 
    stepId: string, 
    status: 'completed' | 'failed' | 'skipped',
    errorDetails?: ErrorMetrics,
    inputSize?: number,
    outputSize?: number
  ): void {
    const runMetrics = this.activeRuns.get(runId);
    if (!runMetrics) return;

    const stepMetrics = runMetrics.steps.find(s => s.stepId === stepId);
    if (!stepMetrics) {
      console.warn(`Step ${stepId} not found in run ${runId}`);
      return;
    }

    stepMetrics.endTime = new Date();
    stepMetrics.duration = stepMetrics.endTime.getTime() - stepMetrics.startTime.getTime();
    stepMetrics.status = status;
    stepMetrics.inputSize = inputSize;
    stepMetrics.outputSize = outputSize;
    
    if (errorDetails && status === 'failed') {
      stepMetrics.errorDetails = errorDetails;
    }

    console.log(`📊 Completed tracking step: ${stepId} (${status})`);
  }

  /**
   * Record step retry attempt
   */
  recordStepRetry(runId: string, stepId: string, errorDetails: ErrorMetrics): void {
    const runMetrics = this.activeRuns.get(runId);
    if (!runMetrics) return;

    const stepMetrics = runMetrics.steps.find(s => s.stepId === stepId);
    if (stepMetrics) {
      stepMetrics.retryCount++;
      stepMetrics.errorDetails = errorDetails;
      console.log(`📊 Recorded retry #${stepMetrics.retryCount} for step: ${stepId}`);
    }
  }

  /**
   * Get current resource metrics
   */
  private getCurrentResourceMetrics(): ResourceMetrics {
    // In browser environment, use performance API
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as any).memory;
      return {
        cpuUsage: 0, // Not available in browser
        memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0,
        diskIO: 0, // Not available in browser
        networkIO: 0, // Would need separate tracking
        timestamp: new Date()
      };
    }

    // In Node.js environment
    if (typeof process !== 'undefined') {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      return {
        cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
        memoryUsage: memUsage.heapUsed / 1024 / 1024,
        diskIO: 0, // Would need filesystem monitoring
        networkIO: 0, // Would need network monitoring
        timestamp: new Date()
      };
    }

    // Fallback
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      diskIO: 0,
      networkIO: 0,
      timestamp: new Date()
    };
  }

  /**
   * Start continuous resource monitoring for a run
   */
  private startResourceMonitoring(runId: string): void {
    const interval = setInterval(() => {
      const runMetrics = this.activeRuns.get(runId);
      if (!runMetrics) {
        clearInterval(interval);
        return;
      }

      runMetrics.resourceUsage = this.getCurrentResourceMetrics();
      
      // Update resource usage for currently running steps
      const runningSteps = runMetrics.steps.filter(s => s.status === 'running');
      runningSteps.forEach(step => {
        step.resourceUsage = this.getCurrentResourceMetrics();
      });

    }, 5000); // Update every 5 seconds

    this.resourceMonitorInterval = interval;
  }

  /**
   * Stop resource monitoring
   */
  private stopResourceMonitoring(runId: string): void {
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval);
      this.resourceMonitorInterval = null;
    }
  }

  /**
   * Flush metrics to storage if buffer is full
   */
  private flushMetricsIfNeeded(): void {
    if (this.metricsBuffer.length >= 10) {
      this.flushMetrics();
    }
  }

  /**
   * Flush all buffered metrics to storage
   */
  async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      // In a real implementation, this would save to database
      console.log(`📊 Flushing ${metricsToFlush.length} workflow metrics to storage`);
      
      // Mock API call
      const response = await fetch('/api/workflows/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metricsToFlush)
      });

      if (!response.ok) {
        throw new Error(`Failed to flush metrics: ${response.statusText}`);
      }

      console.log(`📊 Successfully flushed ${metricsToFlush.length} metrics`);
    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Re-add to buffer for retry
      this.metricsBuffer.unshift(...metricsToFlush);
    }
  }

  /**
   * Calculate performance statistics for a workflow
   */
  async calculateWorkflowStats(workflowId: string, timeRange?: { start: Date; end: Date }): Promise<WorkflowPerformanceStats> {
    // Mock implementation - in real app, would query database
    const mockStats: WorkflowPerformanceStats = {
      workflowId,
      totalRuns: 156,
      successfulRuns: 149,
      failedRuns: 7,
      successRate: 95.5,
      averageDuration: 45000, // milliseconds
      medianDuration: 42000,
      p95Duration: 68000,
      averageResourceUsage: {
        cpuUsage: 25.5,
        memoryUsage: 128.7,
        diskIO: 45.2,
        networkIO: 12.8,
        timestamp: new Date()
      },
      errorFrequency: {
        'API Timeout': 3,
        'Data Missing': 2,
        'Permission Error': 2
      },
      performanceTrend: 'stable',
      lastUpdated: new Date()
    };

    return mockStats;
  }

  /**
   * Get active workflow runs
   */
  getActiveRuns(): WorkflowRunMetrics[] {
    return Array.from(this.activeRuns.values());
  }

  /**
   * Get metrics for a specific run
   */
  getRunMetrics(runId: string): WorkflowRunMetrics | undefined {
    return this.activeRuns.get(runId);
  }

  /**
   * Classification of errors by type and severity
   */
  classifyError(error: Error | any): ErrorMetrics {
    let errorType = 'Unknown';
    let severity: ErrorMetrics['severity'] = 'medium';
    
    if (error.name) {
      errorType = error.name;
    } else if (error.message) {
      // Classify based on message patterns
      if (error.message.includes('timeout')) {
        errorType = 'Timeout Error';
        severity = 'high';
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        errorType = 'Permission Error';
        severity = 'high';
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorType = 'Network Error';
        severity = 'medium';
      } else if (error.message.includes('validation')) {
        errorType = 'Validation Error';
        severity = 'low';
      }
    }

    return {
      errorType,
      errorCode: error.code,
      errorMessage: error.message || 'Unknown error occurred',
      stackTrace: error.stack,
      context: {
        ...error,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
      },
      timestamp: new Date(),
      severity
    };
  }
}

// Singleton instance
export const workflowMetrics = new WorkflowMetricsCollector();

// Convenience functions
export const startWorkflowRun = (workflowId: string, workflowName: string, metadata?: Record<string, any>) => 
  workflowMetrics.startWorkflowRun(workflowId, workflowName, metadata);

export const endWorkflowRun = (runId: string, status: 'completed' | 'failed' | 'cancelled', errorDetails?: ErrorMetrics) => 
  workflowMetrics.endWorkflowRun(runId, status, errorDetails);

export const startWorkflowStep = (runId: string, stepId: string, stepName: string, stepType: string) => 
  workflowMetrics.startWorkflowStep(runId, stepId, stepName, stepType);

export const endWorkflowStep = (runId: string, stepId: string, status: 'completed' | 'failed' | 'skipped', errorDetails?: ErrorMetrics, inputSize?: number, outputSize?: number) => 
  workflowMetrics.endWorkflowStep(runId, stepId, status, errorDetails, inputSize, outputSize);

export const recordStepRetry = (runId: string, stepId: string, errorDetails: ErrorMetrics) => 
  workflowMetrics.recordStepRetry(runId, stepId, errorDetails);

export const classifyError = (error: Error | any) => 
  workflowMetrics.classifyError(error);

// Export types for external use
export type { WorkflowRunMetrics, WorkflowStepMetrics, ResourceMetrics, ErrorMetrics, WorkflowPerformanceStats };