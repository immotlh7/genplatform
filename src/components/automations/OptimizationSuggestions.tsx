'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb,
  AlertTriangle,
  ClockIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  CheckCircle2,
  XMarkIcon,
  ChevronRightIcon
} from 'lucide-react';
import { WorkflowPerformanceStats } from '@/lib/workflow-metrics';

interface OptimizationSuggestion {
  id: string;
  type: 'performance' | 'cost' | 'reliability' | 'efficiency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    timeReduction?: number; // percentage
    costReduction?: number; // percentage
    reliabilityImprovement?: number; // percentage
  };
  effort: 'low' | 'medium' | 'high';
  recommendation: string;
  implementation: {
    steps: string[];
    estimatedTime: string;
    requiredSkills: string[];
  };
  metrics: {
    currentValue: number;
    targetValue: number;
    unit: string;
    metric: string;
  };
  applicable: boolean;
  dismissed: boolean;
  implementedAt?: Date;
}

interface Props {
  workflowId: string;
  performanceStats?: WorkflowPerformanceStats;
  onImplementSuggestion?: (suggestionId: string) => void;
  onDismissSuggestion?: (suggestionId: string) => void;
}

export default function OptimizationSuggestions({ 
  workflowId, 
  performanceStats, 
  onImplementSuggestion,
  onDismissSuggestion 
}: Props) {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  useEffect(() => {
    generateSuggestions();
  }, [workflowId, performanceStats]);

  const generateSuggestions = async () => {
    try {
      setLoading(true);

      // Simulate AI-powered analysis with realistic suggestions
      const mockSuggestions: OptimizationSuggestion[] = [
        {
          id: '1',
          type: 'performance',
          severity: 'high',
          title: 'Optimize Database Query Execution',
          description: 'Multiple database queries are executing sequentially, causing significant delays. Consider implementing query batching or parallel execution.',
          impact: {
            timeReduction: 35,
            reliabilityImprovement: 15
          },
          effort: 'medium',
          recommendation: 'Implement batch processing for database operations and add query result caching.',
          implementation: {
            steps: [
              'Identify sequential database calls in workflow',
              'Implement batch query functionality',
              'Add Redis caching layer for frequently accessed data',
              'Update workflow to use batched operations',
              'Monitor performance improvement'
            ],
            estimatedTime: '2-3 hours',
            requiredSkills: ['Database Optimization', 'Caching', 'Performance Tuning']
          },
          metrics: {
            currentValue: 45,
            targetValue: 29,
            unit: 'seconds',
            metric: 'Average Execution Time'
          },
          applicable: true,
          dismissed: false
        },
        {
          id: '2',
          type: 'cost',
          severity: 'medium',
          title: 'Reduce API Call Frequency',
          description: 'Workflow makes redundant API calls for the same data. Implementing intelligent caching could significantly reduce costs.',
          impact: {
            costReduction: 42,
            timeReduction: 18
          },
          effort: 'low',
          recommendation: 'Add TTL-based caching for API responses and implement request deduplication.',
          implementation: {
            steps: [
              'Analyze API call patterns to identify duplicates',
              'Implement response caching with appropriate TTL',
              'Add request deduplication logic',
              'Monitor cost savings and cache hit rates'
            ],
            estimatedTime: '1-2 hours',
            requiredSkills: ['API Integration', 'Caching', 'Cost Optimization']
          },
          metrics: {
            currentValue: 150,
            targetValue: 87,
            unit: 'API calls/hour',
            metric: 'API Usage Rate'
          },
          applicable: true,
          dismissed: false
        },
        {
          id: '3',
          type: 'reliability',
          severity: 'critical',
          title: 'Implement Robust Error Handling',
          description: 'Workflow fails completely when encountering minor errors. Adding retry logic and graceful degradation would improve reliability.',
          impact: {
            reliabilityImprovement: 60,
            timeReduction: 25
          },
          effort: 'high',
          recommendation: 'Implement exponential backoff retry logic and circuit breaker pattern for external services.',
          implementation: {
            steps: [
              'Categorize error types and determine retry strategies',
              'Implement exponential backoff retry mechanism',
              'Add circuit breaker for external service calls',
              'Create fallback mechanisms for non-critical operations',
              'Add comprehensive error logging and alerting'
            ],
            estimatedTime: '4-6 hours',
            requiredSkills: ['Error Handling', 'Resilience Patterns', 'Monitoring']
          },
          metrics: {
            currentValue: 87.6,
            targetValue: 99.2,
            unit: '%',
            metric: 'Success Rate'
          },
          applicable: true,
          dismissed: false
        },
        {
          id: '4',
          type: 'efficiency',
          severity: 'medium',
          title: 'Parallel Step Execution',
          description: 'Several workflow steps are independent and could run in parallel, reducing overall execution time.',
          impact: {
            timeReduction: 28,
            reliabilityImprovement: 8
          },
          effort: 'medium',
          recommendation: 'Refactor workflow to execute independent steps in parallel using worker pools.',
          implementation: {
            steps: [
              'Analyze step dependencies and identify parallel opportunities',
              'Implement worker pool for parallel execution',
              'Update workflow engine to support parallel branches',
              'Add synchronization points for dependent steps',
              'Test and monitor parallel execution performance'
            ],
            estimatedTime: '3-4 hours',
            requiredSkills: ['Workflow Design', 'Parallel Processing', 'Concurrency']
          },
          metrics: {
            currentValue: 128,
            targetValue: 92,
            unit: 'seconds',
            metric: 'Total Execution Time'
          },
          applicable: true,
          dismissed: false
        },
        {
          id: '5',
          type: 'cost',
          severity: 'low',
          title: 'Optimize Resource Allocation',
          description: 'Workflow is over-provisioned for most executions. Dynamic resource scaling could reduce costs.',
          impact: {
            costReduction: 23,
            timeReduction: 5
          },
          effort: 'low',
          recommendation: 'Implement auto-scaling based on workload characteristics and historical patterns.',
          implementation: {
            steps: [
              'Analyze resource usage patterns',
              'Implement workload-based scaling rules',
              'Add monitoring for resource utilization',
              'Test scaling behavior under various loads'
            ],
            estimatedTime: '1-2 hours',
            requiredSkills: ['Resource Management', 'Auto-scaling', 'Monitoring']
          },
          metrics: {
            currentValue: 2.5,
            targetValue: 1.9,
            unit: 'GB',
            metric: 'Peak Memory Usage'
          },
          applicable: true,
          dismissed: false
        }
      ];

      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setSuggestions(mockSuggestions);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to generate optimization suggestions:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: OptimizationSuggestion['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-700 bg-blue-100 border-blue-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getTypeIcon = (type: OptimizationSuggestion['type']) => {
    switch (type) {
      case 'performance': return <ClockIcon className="h-5 w-5" />;
      case 'cost': return <CurrencyDollarIcon className="h-5 w-5" />;
      case 'reliability': return <AlertTriangle className="h-5 w-5" />;
      case 'efficiency': return <CpuChipIcon className="h-5 w-5" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getEffortColor = (effort: OptimizationSuggestion['effort']) => {
    switch (effort) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (suggestion.dismissed) return false;
    if (selectedType !== 'all' && suggestion.type !== selectedType) return false;
    if (selectedSeverity !== 'all' && suggestion.severity !== selectedSeverity) return false;
    return suggestion.applicable;
  });

  const handleImplement = (suggestionId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, implementedAt: new Date() }
        : s
    ));
    onImplementSuggestion?.(suggestionId);
  };

  const handleDismiss = (suggestionId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, dismissed: true }
        : s
    ));
    onDismissSuggestion?.(suggestionId);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Analyzing workflow for optimization opportunities...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <SparklesIcon className="h-6 w-6 text-purple-600" />
          AI Optimization Suggestions
        </h2>
        
        <div className="flex gap-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Types</option>
            <option value="performance">Performance</option>
            <option value="cost">Cost</option>
            <option value="reliability">Reliability</option>
            <option value="efficiency">Efficiency</option>
          </select>
          
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {filteredSuggestions.length === 0 && (
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All Optimized!</h3>
          <p className="text-gray-600">No optimization suggestions available. Your workflow is performing efficiently.</p>
        </Card>
      )}

      <div className="space-y-4">
        {filteredSuggestions.map((suggestion) => (
          <Card key={suggestion.id} className={`overflow-hidden border-l-4 ${getSeverityColor(suggestion.severity).includes('red') ? 'border-l-red-500' : 
            getSeverityColor(suggestion.severity).includes('orange') ? 'border-l-orange-500' :
            getSeverityColor(suggestion.severity).includes('yellow') ? 'border-l-yellow-500' : 'border-l-blue-500'
          }`}>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0">
                    {getTypeIcon(suggestion.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{suggestion.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(suggestion.severity)}`}>
                        {suggestion.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEffortColor(suggestion.effort)}`}>
                        {suggestion.effort.toUpperCase()} EFFORT
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{suggestion.description}</p>
                    
                    {/* Impact Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {suggestion.impact.timeReduction && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm text-blue-600 font-medium">Time Reduction</div>
                          <div className="text-2xl font-bold text-blue-700">{suggestion.impact.timeReduction}%</div>
                        </div>
                      )}
                      
                      {suggestion.impact.costReduction && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm text-green-600 font-medium">Cost Reduction</div>
                          <div className="text-2xl font-bold text-green-700">{suggestion.impact.costReduction}%</div>
                        </div>
                      )}
                      
                      {suggestion.impact.reliabilityImprovement && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-sm text-purple-600 font-medium">Reliability Improvement</div>
                          <div className="text-2xl font-bold text-purple-700">{suggestion.impact.reliabilityImprovement}%</div>
                        </div>
                      )}
                    </div>

                    {/* Metric Improvement */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">{suggestion.metrics.metric}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          Current: <span className="font-bold">{suggestion.metrics.currentValue} {suggestion.metrics.unit}</span>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                        <div className="text-sm">
                          Target: <span className="font-bold text-green-600">{suggestion.metrics.targetValue} {suggestion.metrics.unit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedSuggestion(expandedSuggestion === suggestion.id ? null : suggestion.id)}
                  >
                    {expandedSuggestion === suggestion.id ? 'Hide Details' : 'View Details'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDismiss(suggestion.id)}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleImplement(suggestion.id)}
                  >
                    Implement
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSuggestion === suggestion.id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Recommendation</h4>
                      <p className="text-gray-600 mb-4">{suggestion.recommendation}</p>
                      
                      <h4 className="font-semibold text-gray-900 mb-3">Implementation Steps</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        {suggestion.implementation.steps.map((step, index) => (
                          <li key={index} className="text-sm text-gray-600">{step}</li>
                        ))}
                      </ol>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Implementation Details</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Estimated Time:</span>
                          <span className="text-sm text-gray-600 ml-2">{suggestion.implementation.estimatedTime}</span>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-gray-700">Required Skills:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {suggestion.implementation.requiredSkills.map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}