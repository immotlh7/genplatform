'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  Zap, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Target,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Info
} from 'lucide-react'

interface OptimizationSuggestion {
  id: string
  type: 'performance' | 'cost' | 'reliability' | 'security'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: {
    performance_gain?: string
    cost_savings?: string
    reliability_improvement?: string
    time_savings?: string
  }
  implementation: {
    effort: 'low' | 'medium' | 'high'
    steps: string[]
    estimated_time: string
  }
  metrics: {
    current_value: number
    potential_value: number
    unit: string
  }
  workflow_id?: string
  workflow_name?: string
}

interface WorkflowAnalysis {
  workflow_id: string
  workflow_name: string
  current_metrics: {
    avg_execution_time: number
    success_rate: number
    resource_usage: number
    cost_per_run: number
  }
  bottlenecks: {
    step_id: string
    step_name: string
    avg_duration: number
    failure_rate: number
    resource_usage: number
  }[]
  trends: {
    execution_time_trend: 'improving' | 'degrading' | 'stable'
    success_rate_trend: 'improving' | 'degrading' | 'stable'
    usage_trend: 'increasing' | 'decreasing' | 'stable'
  }
}

export default function OptimizationSuggestions({ 
  workflowId, 
  onApplySuggestion 
}: { 
  workflowId?: string
  onApplySuggestion?: (suggestionId: string) => void 
}) {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [analysis, setAnalysis] = useState<WorkflowAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')

  useEffect(() => {
    generateOptimizationSuggestions()
  }, [workflowId])

  const generateOptimizationSuggestions = async () => {
    setLoading(true)
    try {
      // Fetch workflow analytics data
      const response = await fetch(`/api/workflows/analytics/optimization${workflowId ? `?workflow=${workflowId}` : ''}`)
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setAnalysis(data.analysis || [])
      } else {
        // Generate mock suggestions for development
        const mockSuggestions = generateMockSuggestions()
        setSuggestions(mockSuggestions)
        setAnalysis(generateMockAnalysis())
      }
    } catch (error) {
      console.error('Error fetching optimization data:', error)
      setSuggestions(generateMockSuggestions())
      setAnalysis(generateMockAnalysis())
    }
    setLoading(false)
  }

  const generateMockSuggestions = (): OptimizationSuggestion[] => {
    return [
      {
        id: 'parallel-execution',
        type: 'performance',
        priority: 'high',
        title: 'Enable Parallel Step Execution',
        description: 'Several workflow steps can run concurrently instead of sequentially, reducing total execution time significantly.',
        impact: {
          performance_gain: '45-60%',
          time_savings: '3-5 minutes per run'
        },
        implementation: {
          effort: 'medium',
          estimated_time: '2-3 hours',
          steps: [
            'Analyze step dependencies to identify parallelizable steps',
            'Update workflow template to enable parallel execution',
            'Configure resource allocation for concurrent steps',
            'Test parallel execution with sample data',
            'Monitor performance improvements'
          ]
        },
        metrics: {
          current_value: 8.5,
          potential_value: 4.2,
          unit: 'minutes'
        },
        workflow_id: 'idea-to-mvp',
        workflow_name: 'Idea to MVP'
      },
      {
        id: 'api-call-optimization',
        type: 'performance',
        priority: 'medium',
        title: 'Optimize API Call Patterns',
        description: 'Batch multiple API calls together and implement caching to reduce network overhead and improve response times.',
        impact: {
          performance_gain: '25-35%',
          cost_savings: '$12-18 per month'
        },
        implementation: {
          effort: 'low',
          estimated_time: '1-2 hours',
          steps: [
            'Identify repetitive API calls in workflows',
            'Implement request batching where possible',
            'Add intelligent caching layer',
            'Configure cache TTL based on data freshness requirements',
            'Monitor API usage reduction'
          ]
        },
        metrics: {
          current_value: 245,
          potential_value: 150,
          unit: 'API calls/day'
        },
        workflow_id: 'bug-fix',
        workflow_name: 'Bug Fix'
      },
      {
        id: 'error-handling-improvement',
        type: 'reliability',
        priority: 'high',
        title: 'Enhanced Error Handling & Retry Logic',
        description: 'Implement smart retry mechanisms and better error classification to improve workflow success rates.',
        impact: {
          reliability_improvement: '12-15%',
          performance_gain: 'Reduced manual interventions'
        },
        implementation: {
          effort: 'medium',
          estimated_time: '3-4 hours',
          steps: [
            'Analyze common failure patterns',
            'Implement exponential backoff retry logic',
            'Add circuit breaker patterns for external services',
            'Create detailed error classification system',
            'Set up automated recovery procedures'
          ]
        },
        metrics: {
          current_value: 87.5,
          potential_value: 96.2,
          unit: '% success rate'
        },
        workflow_id: 'new-feature',
        workflow_name: 'New Feature'
      },
      {
        id: 'resource-optimization',
        type: 'cost',
        priority: 'medium',
        title: 'Optimize Resource Allocation',
        description: 'Right-size compute resources based on actual usage patterns to reduce infrastructure costs.',
        impact: {
          cost_savings: '30-40%',
          performance_gain: 'Better resource utilization'
        },
        implementation: {
          effort: 'low',
          estimated_time: '1 hour',
          steps: [
            'Analyze current resource usage patterns',
            'Identify over-provisioned resources',
            'Implement auto-scaling based on demand',
            'Configure resource limits per workflow type',
            'Monitor cost reduction'
          ]
        },
        metrics: {
          current_value: 156,
          potential_value: 98,
          unit: '$/month'
        }
      },
      {
        id: 'data-preprocessing',
        type: 'performance',
        priority: 'low',
        title: 'Pre-process Workflow Data',
        description: 'Pre-process and cache frequently used data to reduce processing time in subsequent workflow runs.',
        impact: {
          performance_gain: '15-20%',
          time_savings: '30-60 seconds per run'
        },
        implementation: {
          effort: 'high',
          estimated_time: '6-8 hours',
          steps: [
            'Identify data processing bottlenecks',
            'Design data preprocessing pipeline',
            'Implement data caching strategy',
            'Create data invalidation rules',
            'Set up monitoring for cache hit rates'
          ]
        },
        metrics: {
          current_value: 3.2,
          potential_value: 2.6,
          unit: 'minutes'
        },
        workflow_id: 'deploy-pipeline',
        workflow_name: 'Deploy Pipeline'
      },
      {
        id: 'security-hardening',
        type: 'security',
        priority: 'high',
        title: 'Implement Security Best Practices',
        description: 'Add security scanning, secrets management, and access control to improve workflow security posture.',
        impact: {
          reliability_improvement: 'Reduced security risks',
          performance_gain: 'Better compliance'
        },
        implementation: {
          effort: 'high',
          estimated_time: '4-6 hours',
          steps: [
            'Audit current security practices',
            'Implement secrets management integration',
            'Add security scanning to workflow steps',
            'Configure role-based access controls',
            'Set up security monitoring and alerts'
          ]
        },
        metrics: {
          current_value: 3,
          potential_value: 9,
          unit: 'security score'
        }
      }
    ]
  }

  const generateMockAnalysis = (): WorkflowAnalysis[] => {
    return [
      {
        workflow_id: 'idea-to-mvp',
        workflow_name: 'Idea to MVP',
        current_metrics: {
          avg_execution_time: 8.5,
          success_rate: 93.3,
          resource_usage: 67.2,
          cost_per_run: 2.45
        },
        bottlenecks: [
          {
            step_id: 'code-generation',
            step_name: 'Code Generation',
            avg_duration: 4.2,
            failure_rate: 5.2,
            resource_usage: 78.5
          },
          {
            step_id: 'testing',
            step_name: 'Testing & Validation',
            avg_duration: 2.8,
            failure_rate: 3.1,
            resource_usage: 45.3
          }
        ],
        trends: {
          execution_time_trend: 'degrading',
          success_rate_trend: 'stable',
          usage_trend: 'increasing'
        }
      }
    ]
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <Zap className="h-4 w-4" />
      case 'cost': return <DollarSign className="h-4 w-4" />
      case 'reliability': return <CheckCircle className="h-4 w-4" />
      case 'security': return <Target className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'performance': return 'text-blue-600 bg-blue-50'
      case 'cost': return 'text-green-600 bg-green-50'
      case 'reliability': return 'text-purple-600 bg-purple-50'
      case 'security': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const filteredSuggestions = suggestions.filter(suggestion => {
    const typeMatch = selectedType === 'all' || suggestion.type === selectedType
    const priorityMatch = selectedPriority === 'all' || suggestion.priority === selectedPriority
    const workflowMatch = !workflowId || suggestion.workflow_id === workflowId
    return typeMatch && priorityMatch && workflowMatch
  })

  const calculatePotentialImpact = () => {
    const performanceGains = filteredSuggestions
      .filter(s => s.impact.performance_gain)
      .map(s => parseFloat(s.impact.performance_gain!.split('-')[0]))
    
    const costSavings = filteredSuggestions
      .filter(s => s.impact.cost_savings)
      .map(s => parseFloat(s.impact.cost_savings!.replace(/[^0-9.-]/g, '')))

    return {
      avgPerformanceGain: performanceGains.length > 0 
        ? Math.round(performanceGains.reduce((a, b) => a + b, 0) / performanceGains.length) 
        : 0,
      totalCostSavings: costSavings.reduce((a, b) => a + b, 0)
    }
  }

  const impact = calculatePotentialImpact()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Analyzing Workflows...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Generating optimization suggestions based on workflow performance data...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Optimization Overview
          </CardTitle>
          <CardDescription>
            AI-powered recommendations to improve your workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{filteredSuggestions.length}</div>
              <p className="text-sm text-gray-600">Active Suggestions</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{impact.avgPerformanceGain}%</div>
              <p className="text-sm text-gray-600">Avg Performance Gain</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">${impact.totalCostSavings}</div>
              <p className="text-sm text-gray-600">Potential Monthly Savings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Types</option>
            <option value="performance">Performance</option>
            <option value="cost">Cost</option>
            <option value="reliability">Reliability</option>
            <option value="security">Security</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        <Button onClick={generateOptimizationSuggestions} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {filteredSuggestions.map((suggestion) => (
          <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(suggestion.type)}`}>
                    {getTypeIcon(suggestion.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {suggestion.description}
                    </CardDescription>
                    {suggestion.workflow_name && (
                      <Badge variant="outline" className="mt-2">
                        {suggestion.workflow_name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityColor(suggestion.priority)}>
                    {suggestion.priority.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className={getTypeColor(suggestion.type)}>
                    {suggestion.type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Impact Metrics */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Expected Impact
                  </h4>
                  <div className="space-y-2 text-sm">
                    {suggestion.impact.performance_gain && (
                      <div className="flex justify-between">
                        <span>Performance:</span>
                        <span className="font-medium text-blue-600">
                          +{suggestion.impact.performance_gain}
                        </span>
                      </div>
                    )}
                    {suggestion.impact.cost_savings && (
                      <div className="flex justify-between">
                        <span>Cost Savings:</span>
                        <span className="font-medium text-green-600">
                          {suggestion.impact.cost_savings}
                        </span>
                      </div>
                    )}
                    {suggestion.impact.time_savings && (
                      <div className="flex justify-between">
                        <span>Time Savings:</span>
                        <span className="font-medium text-purple-600">
                          {suggestion.impact.time_savings}
                        </span>
                      </div>
                    )}
                    {suggestion.impact.reliability_improvement && (
                      <div className="flex justify-between">
                        <span>Reliability:</span>
                        <span className="font-medium text-orange-600">
                          +{suggestion.impact.reliability_improvement}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current vs Potential */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    Metrics Comparison
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Current:</span>
                      <span>{suggestion.metrics.current_value} {suggestion.metrics.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Potential:</span>
                      <span className="font-medium text-green-600">
                        {suggestion.metrics.potential_value} {suggestion.metrics.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(suggestion.metrics.potential_value / suggestion.metrics.current_value) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Implementation Details */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Implementation
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Effort:</span>
                      <Badge variant="outline" size="sm">
                        {suggestion.implementation.effort}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>{suggestion.implementation.estimated_time}</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-600 mb-1">Steps:</p>
                      <div className="max-h-20 overflow-y-auto">
                        {suggestion.implementation.steps.slice(0, 2).map((step, index) => (
                          <div key={index} className="flex items-start gap-1 text-xs">
                            <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{step}</span>
                          </div>
                        ))}
                        {suggestion.implementation.steps.length > 2 && (
                          <div className="text-xs text-gray-500 mt-1">
                            +{suggestion.implementation.steps.length - 2} more steps...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <Button 
                  size="sm"
                  onClick={() => onApplySuggestion?.(suggestion.id)}
                >
                  Apply Suggestion
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSuggestions.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No optimization suggestions found for the selected criteria. 
            Try adjusting your filters or check back later as we analyze more workflow data.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}