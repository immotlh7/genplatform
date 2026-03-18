'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  FlaskConical, 
  Users, 
  TrendingUp, 
  Target, 
  Play, 
  Pause, 
  Stop,
  Settings,
  BarChart3,
  PieChart as PieChartIcon,
  CheckCircle,
  AlertTriangle,
  Clock,
  Percent,
  Zap,
  Eye,
  Archive
} from 'lucide-react'

interface ABTestVariant {
  id: string
  name: string
  description: string
  workflow_template: any
  traffic_percentage: number
  is_control: boolean
  created_at: string
  updated_at: string
}

interface ABTest {
  id: string
  workflow_id: string
  workflow_name: string
  name: string
  description: string
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived'
  variants: ABTestVariant[]
  traffic_config: {
    total_allocation: number
    randomization_method: 'user_id' | 'session' | 'random'
    exclude_patterns?: string[]
  }
  success_criteria: {
    primary_metric: string
    secondary_metrics: string[]
    minimum_sample_size: number
    confidence_level: number
    minimum_effect_size: number
  }
  results: {
    total_participants: number
    variant_results: {
      [variantId: string]: {
        participants: number
        conversions: number
        conversion_rate: number
        avg_execution_time: number
        success_rate: number
        confidence_interval: [number, number]
      }
    }
    statistical_significance: boolean
    winner?: string
    confidence_score: number
  }
  duration_config: {
    start_date: string
    end_date: string
    max_duration_days: number
    early_stopping: boolean
  }
  created_by: string
  created_at: string
  updated_at: string
}

interface ABTestResults {
  variant_id: string
  variant_name: string
  participants: number
  success_count: number
  success_rate: number
  avg_execution_time: number
  confidence_interval: [number, number]
  is_winner: boolean
  statistical_significance: number
}

export default function ABTesting({ 
  workflowId,
  onTestCreated,
  onTestUpdated 
}: { 
  workflowId?: string
  onTestCreated?: (test: ABTest) => void
  onTestUpdated?: (test: ABTest) => void
}) {
  const [tests, setTests] = useState<ABTest[]>([])
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Form state for new test
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    workflow_id: workflowId || '',
    variants: [
      { name: 'Control', description: 'Original workflow', traffic_percentage: 50, is_control: true },
      { name: 'Variant A', description: 'Test variation', traffic_percentage: 50, is_control: false }
    ],
    success_criteria: {
      primary_metric: 'success_rate',
      confidence_level: 95,
      minimum_sample_size: 100,
      minimum_effect_size: 5
    },
    duration_days: 14
  })

  useEffect(() => {
    fetchABTests()
  }, [workflowId])

  const fetchABTests = async () => {
    try {
      const query = workflowId ? `?workflowId=${workflowId}` : ''
      const response = await fetch(`/api/workflows/ab-tests${query}`)
      
      if (response.ok) {
        const data = await response.json()
        setTests(data.tests || [])
      } else {
        // Load mock data for development
        setTests(generateMockTests())
      }
    } catch (error) {
      console.error('Error fetching A/B tests:', error)
      setTests(generateMockTests())
    }
    setLoading(false)
  }

  const generateMockTests = (): ABTest[] => {
    return [
      {
        id: 'test-1',
        workflow_id: 'idea-to-mvp',
        workflow_name: 'Idea to MVP',
        name: 'Code Generation Speed Test',
        description: 'Testing different AI models for code generation speed vs quality',
        status: 'running',
        variants: [
          {
            id: 'control',
            name: 'GPT-4 Control',
            description: 'Current GPT-4 implementation',
            workflow_template: {},
            traffic_percentage: 40,
            is_control: true,
            created_at: '2026-03-10T10:00:00Z',
            updated_at: '2026-03-10T10:00:00Z'
          },
          {
            id: 'variant-a',
            name: 'Claude Sonnet',
            description: 'Using Claude Sonnet for generation',
            workflow_template: {},
            traffic_percentage: 30,
            is_control: false,
            created_at: '2026-03-10T10:00:00Z',
            updated_at: '2026-03-10T10:00:00Z'
          },
          {
            id: 'variant-b',
            name: 'Hybrid Approach',
            description: 'GPT-4 + Claude ensemble',
            workflow_template: {},
            traffic_percentage: 30,
            is_control: false,
            created_at: '2026-03-10T10:00:00Z',
            updated_at: '2026-03-10T10:00:00Z'
          }
        ],
        traffic_config: {
          total_allocation: 100,
          randomization_method: 'user_id'
        },
        success_criteria: {
          primary_metric: 'success_rate',
          secondary_metrics: ['execution_time', 'user_satisfaction'],
          minimum_sample_size: 200,
          confidence_level: 95,
          minimum_effect_size: 10
        },
        results: {
          total_participants: 387,
          variant_results: {
            'control': {
              participants: 155,
              conversions: 143,
              conversion_rate: 92.3,
              avg_execution_time: 480,
              success_rate: 92.3,
              confidence_interval: [87.2, 96.1]
            },
            'variant-a': {
              participants: 116,
              conversions: 109,
              conversion_rate: 94.0,
              avg_execution_time: 420,
              success_rate: 94.0,
              confidence_interval: [88.5, 97.2]
            },
            'variant-b': {
              participants: 116,
              conversions: 111,
              conversion_rate: 95.7,
              avg_execution_time: 445,
              success_rate: 95.7,
              confidence_interval: [90.8, 98.3]
            }
          },
          statistical_significance: true,
          winner: 'variant-b',
          confidence_score: 89.2
        },
        duration_config: {
          start_date: '2026-03-10T10:00:00Z',
          end_date: '2026-03-24T10:00:00Z',
          max_duration_days: 14,
          early_stopping: true
        },
        created_by: 'user123',
        created_at: '2026-03-10T09:30:00Z',
        updated_at: '2026-03-18T15:30:00Z'
      }
    ]
  }

  const createABTest = async () => {
    try {
      const response = await fetch('/api/workflows/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTest)
      })

      if (response.ok) {
        const data = await response.json()
        setTests(prev => [...prev, data.test])
        setIsCreating(false)
        onTestCreated?.(data.test)
        
        // Reset form
        setNewTest({
          name: '',
          description: '',
          workflow_id: workflowId || '',
          variants: [
            { name: 'Control', description: 'Original workflow', traffic_percentage: 50, is_control: true },
            { name: 'Variant A', description: 'Test variation', traffic_percentage: 50, is_control: false }
          ],
          success_criteria: {
            primary_metric: 'success_rate',
            confidence_level: 95,
            minimum_sample_size: 100,
            minimum_effect_size: 5
          },
          duration_days: 14
        })
      }
    } catch (error) {
      console.error('Error creating A/B test:', error)
    }
  }

  const updateTestStatus = async (testId: string, status: string) => {
    try {
      const response = await fetch(`/api/workflows/ab-tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        setTests(prev => prev.map(test => 
          test.id === testId ? { ...test, status: status as any } : test
        ))
      }
    } catch (error) {
      console.error('Error updating test status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'archived': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'draft': return <Settings className="h-4 w-4" />
      case 'archived': return <Archive className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const calculateTestProgress = (test: ABTest) => {
    const { results, success_criteria, duration_config } = test
    
    // Sample size progress
    const sampleProgress = Math.min(100, (results.total_participants / success_criteria.minimum_sample_size) * 100)
    
    // Time progress
    const startDate = new Date(duration_config.start_date).getTime()
    const endDate = new Date(duration_config.end_date).getTime()
    const now = Date.now()
    const timeProgress = Math.min(100, ((now - startDate) / (endDate - startDate)) * 100)
    
    return { sampleProgress, timeProgress }
  }

  const generateComparisonData = (test: ABTest) => {
    return test.variants.map(variant => {
      const results = test.results.variant_results[variant.id]
      return {
        name: variant.name,
        success_rate: results?.success_rate || 0,
        avg_time: results?.avg_execution_time || 0,
        participants: results?.participants || 0,
        is_winner: test.results.winner === variant.id
      }
    })
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1']

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 animate-pulse" />
            Loading A/B Tests...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6" />
            Workflow A/B Testing
          </h2>
          <p className="text-gray-600 mt-1">Optimize workflows through data-driven experimentation</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          New A/B Test
        </Button>
      </div>

      {/* Tests Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.filter(t => t.status === 'running').length}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tests.reduce((sum, test) => sum + test.results.total_participants, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all tests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Significant Results</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tests.filter(t => t.results.statistical_significance).length}
            </div>
            <p className="text-xs text-muted-foreground">Statistically significant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tests.length > 0 
                ? Math.round(tests.reduce((sum, test) => sum + test.results.confidence_score, 0) / tests.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Confidence level</p>
          </CardContent>
        </Card>
      </div>

      {/* Tests List */}
      <div className="space-y-4">
        {tests.map((test) => {
          const { sampleProgress, timeProgress } = calculateTestProgress(test)
          const comparisonData = generateComparisonData(test)

          return (
            <Card key={test.id} className={`hover:shadow-md transition-shadow ${selectedTest?.id === test.id ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(test.status)}`}>
                      {getStatusIcon(test.status)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {test.description}
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>Workflow: {test.workflow_name}</span>
                        <span>•</span>
                        <span>{test.variants.length} variants</span>
                        <span>•</span>
                        <span>{test.results.total_participants} participants</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(test.status)}>
                      {test.status.toUpperCase()}
                    </Badge>
                    {test.results.statistical_significance && (
                      <Badge variant="outline" className="text-green-600">
                        Significant
                      </Badge>
                    )}
                    {test.results.winner && (
                      <Badge variant="outline" className="text-blue-600">
                        Winner: {test.variants.find(v => v.id === test.results.winner)?.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="progress" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="variants">Variants</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="progress" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Sample Size Progress</span>
                          <span>{Math.round(sampleProgress)}%</span>
                        </div>
                        <Progress value={sampleProgress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          {test.results.total_participants} / {test.success_criteria.minimum_sample_size} participants
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Time Progress</span>
                          <span>{Math.round(timeProgress)}%</span>
                        </div>
                        <Progress value={timeProgress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(timeProgress / 100 * test.duration_config.max_duration_days)} / {test.duration_config.max_duration_days} days
                        </p>
                      </div>
                    </div>

                    {test.results.statistical_significance && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Statistical significance achieved!</strong> 
                          {test.results.winner && (
                            <span> Winner: {test.variants.find(v => v.id === test.results.winner)?.name} with {test.results.confidence_score}% confidence.</span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  <TabsContent value="results">
                    <div className="space-y-4">
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                          <BarChart data={comparisonData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar 
                              dataKey="success_rate" 
                              fill="#8884d8" 
                              name="Success Rate (%)"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {test.variants.map((variant) => {
                          const results = test.results.variant_results[variant.id]
                          const isWinner = test.results.winner === variant.id

                          return (
                            <Card key={variant.id} className={`${isWinner ? 'ring-2 ring-green-500' : ''}`}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm">{variant.name}</CardTitle>
                                  {variant.is_control && (
                                    <Badge variant="outline" size="sm">Control</Badge>
                                  )}
                                  {isWinner && (
                                    <Badge className="bg-green-100 text-green-800" size="sm">Winner</Badge>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-2 pt-0">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Participants:</span>
                                    <div className="font-semibold">{results?.participants || 0}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Success Rate:</span>
                                    <div className="font-semibold">{results?.success_rate.toFixed(1) || 0}%</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Avg Time:</span>
                                    <div className="font-semibold">{results?.avg_execution_time || 0}s</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Traffic:</span>
                                    <div className="font-semibold">{variant.traffic_percentage}%</div>
                                  </div>
                                </div>
                                
                                {results?.confidence_interval && (
                                  <div className="text-xs text-gray-500">
                                    CI: [{results.confidence_interval[0].toFixed(1)}, {results.confidence_interval[1].toFixed(1)}]
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="variants">
                    <div className="space-y-3">
                      {test.variants.map((variant) => (
                        <div key={variant.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{variant.name}</h4>
                              {variant.is_control && (
                                <Badge variant="outline" size="sm">Control</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{variant.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{variant.traffic_percentage}%</div>
                            <div className="text-sm text-gray-500">Traffic</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="actions">
                    <div className="flex gap-2">
                      {test.status === 'running' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateTestStatus(test.id, 'paused')}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateTestStatus(test.id, 'completed')}
                          >
                            <Stop className="h-4 w-4 mr-1" />
                            Stop
                          </Button>
                        </>
                      )}
                      
                      {test.status === 'paused' && (
                        <Button 
                          size="sm"
                          onClick={() => updateTestStatus(test.id, 'running')}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      )}
                      
                      {test.status === 'completed' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedTest(test)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateTestStatus(test.id, 'archived')}
                          >
                            <Archive className="h-4 w-4 mr-1" />
                            Archive
                          </Button>
                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {tests.length === 0 && (
        <Alert>
          <FlaskConical className="h-4 w-4" />
          <AlertDescription>
            No A/B tests found. Create your first test to start optimizing workflow performance through experimentation.
          </AlertDescription>
        </Alert>
      )}

      {/* Create Test Modal/Form would go here */}
      {isCreating && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Create New A/B Test</CardTitle>
            <CardDescription>Set up a new experiment to optimize your workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-name">Test Name</Label>
                <Input
                  id="test-name"
                  value={newTest.name}
                  onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Code Generation Speed Test"
                />
              </div>
              <div>
                <Label htmlFor="workflow-select">Workflow</Label>
                <Input
                  id="workflow-select"
                  value={newTest.workflow_id}
                  onChange={(e) => setNewTest(prev => ({ ...prev, workflow_id: e.target.value }))}
                  placeholder="Workflow ID"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="test-description">Description</Label>
              <Textarea
                id="test-description"
                value={newTest.description}
                onChange={(e) => setNewTest(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what you're testing and why..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={createABTest} disabled={!newTest.name || !newTest.workflow_id}>
                Create Test
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}