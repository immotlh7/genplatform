"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Download,
  Share2,
  Calendar,
  BarChart3,
  Activity,
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  Zap,
  RefreshCw,
  Eye,
  X
} from 'lucide-react'
import { ReportData } from './ReportCard'

interface ComparisonMetric {
  label: string
  valueA: number | string
  valueB: number | string
  change?: number
  trend?: 'up' | 'down' | 'stable'
  format?: 'number' | 'percentage' | 'duration' | 'bytes'
  category: 'performance' | 'activity' | 'quality' | 'general'
}

interface ReportComparisonProps {
  reportA?: ReportData | null
  reportB?: ReportData | null
  isOpen: boolean
  onClose: () => void
  onReportSelect?: (report: ReportData, slot: 'A' | 'B') => void
  availableReports?: ReportData[]
  className?: string
}

export function ReportComparison({
  reportA,
  reportB,
  isOpen,
  onClose,
  onReportSelect,
  availableReports = [],
  className = ""
}: ReportComparisonProps) {
  const [selectedReportA, setSelectedReportA] = useState<ReportData | null>(reportA || null)
  const [selectedReportB, setSelectedReportB] = useState<ReportData | null>(reportB || null)
  const [comparisonData, setComparisonData] = useState<ComparisonMetric[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay' | 'diff'>('side-by-side')

  useEffect(() => {
    if (reportA) setSelectedReportA(reportA)
    if (reportB) setSelectedReportB(reportB)
  }, [reportA, reportB])

  useEffect(() => {
    if (selectedReportA && selectedReportB) {
      generateComparisonData()
    }
  }, [selectedReportA, selectedReportB])

  const generateComparisonData = async () => {
    if (!selectedReportA || !selectedReportB) return

    setLoading(true)
    try {
      // Simulate API call for comparison data
      await new Promise(resolve => setTimeout(resolve, 1000))

      const metrics: ComparisonMetric[] = [
        // Performance Metrics
        {
          label: 'System Health',
          valueA: selectedReportA.metrics?.systemHealth || 95,
          valueB: selectedReportB.metrics?.systemHealth || 92,
          format: 'percentage',
          category: 'performance'
        },
        {
          label: 'Generation Time',
          valueA: selectedReportA.generationTime || 120,
          valueB: selectedReportB.generationTime || 180,
          format: 'duration',
          category: 'performance'
        },
        {
          label: 'File Size',
          valueA: parseFloat(selectedReportA.size?.replace(' MB', '') || '2.5') * 1024 * 1024,
          valueB: parseFloat(selectedReportB.size?.replace(' MB', '') || '3.2') * 1024 * 1024,
          format: 'bytes',
          category: 'performance'
        },

        // Activity Metrics
        {
          label: 'Total Projects',
          valueA: selectedReportA.metrics?.totalProjects || 6,
          valueB: selectedReportB.metrics?.totalProjects || 5,
          format: 'number',
          category: 'activity'
        },
        {
          label: 'Completed Tasks',
          valueA: selectedReportA.metrics?.completedTasks || 23,
          valueB: selectedReportB.metrics?.completedTasks || 18,
          format: 'number',
          category: 'activity'
        },
        {
          label: 'Active Users',
          valueA: selectedReportA.metrics?.activeUsers || 3,
          valueB: selectedReportB.metrics?.activeUsers || 3,
          format: 'number',
          category: 'activity'
        },

        // Quality Metrics
        {
          label: 'Confidence Score',
          valueA: selectedReportA.confidence || 88,
          valueB: selectedReportB.confidence || 85,
          format: 'percentage',
          category: 'quality'
        },
        {
          label: 'View Count',
          valueA: selectedReportA.viewCount || 12,
          valueB: selectedReportB.viewCount || 8,
          format: 'number',
          category: 'quality'
        }
      ]

      // Calculate trends and changes
      const metricsWithTrends = metrics.map(metric => {
        const valueA = typeof metric.valueA === 'number' ? metric.valueA : 0
        const valueB = typeof metric.valueB === 'number' ? metric.valueB : 0
        
        if (valueA === valueB) {
          return { ...metric, change: 0, trend: 'stable' as const }
        }
        
        const change = ((valueA - valueB) / valueB) * 100
        const trend = change > 0 ? 'up' as const : 'down' as const
        
        return { ...metric, change: Math.abs(change), trend }
      })

      setComparisonData(metricsWithTrends)
    } catch (error) {
      console.error('Error generating comparison data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value: number | string, format?: string) => {
    if (typeof value === 'string') return value

    switch (format) {
      case 'percentage':
        return `${value}%`
      case 'duration':
        return value < 60 ? `${value}s` : `${Math.floor(value / 60)}m ${value % 60}s`
      case 'bytes':
        const mb = value / (1024 * 1024)
        return `${mb.toFixed(1)} MB`
      case 'number':
      default:
        return value.toLocaleString()
    }
  }

  const getTrendIcon = (trend?: string, size = "h-4 w-4") => {
    switch (trend) {
      case 'up': return <TrendingUp className={`${size} text-green-600`} />
      case 'down': return <TrendingDown className={`${size} text-red-600`} />
      default: return <Minus className={`${size} text-gray-600`} />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Zap className="h-4 w-4 text-yellow-600" />
      case 'activity': return <Activity className="h-4 w-4 text-blue-600" />
      case 'quality': return <Target className="h-4 w-4 text-green-600" />
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const swapReports = () => {
    const temp = selectedReportA
    setSelectedReportA(selectedReportB)
    setSelectedReportB(temp)
  }

  const clearComparison = () => {
    setSelectedReportA(null)
    setSelectedReportB(null)
    setComparisonData([])
  }

  const exportComparison = () => {
    // Mock export functionality
    console.log('Exporting comparison data...')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <GitCompare className="h-5 w-5 text-blue-600" />
            <span>Report Comparison</span>
          </DialogTitle>
          <DialogDescription>
            Compare metrics and performance between two reports
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Report A Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Report A</label>
              <Select 
                value={selectedReportA?.id || ""} 
                onValueChange={(value) => {
                  const report = availableReports.find(r => r.id === value)
                  if (report) {
                    setSelectedReportA(report)
                    onReportSelect?.(report, 'A')
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select first report" />
                </SelectTrigger>
                <SelectContent>
                  {availableReports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      <div className="flex items-center space-x-2">
                        <span>{report.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {report.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedReportA && (
                <Card className="p-3 bg-blue-50 border-blue-200">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">{selectedReportA.title}</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Created: {formatDate(selectedReportA.createdAt)}</div>
                      <div>Size: {selectedReportA.size}</div>
                      <div>Type: {selectedReportA.type}</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Swap Controls */}
            <div className="flex items-center justify-center">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={swapReports}
                  disabled={!selectedReportA || !selectedReportB}
                  className="w-full"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  <ArrowRight className="h-3 w-3 ml-1" />
                  Swap
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearComparison}
                  className="w-full"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Report B Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Report B</label>
              <Select 
                value={selectedReportB?.id || ""} 
                onValueChange={(value) => {
                  const report = availableReports.find(r => r.id === value)
                  if (report) {
                    setSelectedReportB(report)
                    onReportSelect?.(report, 'B')
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select second report" />
                </SelectTrigger>
                <SelectContent>
                  {availableReports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      <div className="flex items-center space-x-2">
                        <span>{report.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {report.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedReportB && (
                <Card className="p-3 bg-green-50 border-green-200">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">{selectedReportB.title}</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Created: {formatDate(selectedReportB.createdAt)}</div>
                      <div>Size: {selectedReportB.size}</div>
                      <div>Type: {selectedReportB.type}</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Comparison Results */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Generating comparison...</p>
              </div>
            </div>
          ) : selectedReportA && selectedReportB ? (
            <>
              {/* View Mode Selector */}
              <div className="flex items-center justify-between">
                <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="side-by-side">Side by Side</SelectItem>
                    <SelectItem value="overlay">Overlay View</SelectItem>
                    <SelectItem value="diff">Difference Only</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={exportComparison}>
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Metrics Comparison */}
              <div className="space-y-4">
                {['performance', 'activity', 'quality'].map((category) => {
                  const categoryMetrics = comparisonData.filter(m => m.category === category)
                  if (categoryMetrics.length === 0) return null

                  return (
                    <Card key={category}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center space-x-2">
                          {getCategoryIcon(category)}
                          <span className="capitalize">{category} Metrics</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {categoryMetrics.map((metric, index) => (
                            <div key={index} className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center py-2 border-b last:border-b-0">
                              <div className="font-medium text-sm">{metric.label}</div>
                              
                              {viewMode === 'side-by-side' && (
                                <>
                                  <div className="text-center">
                                    <div className="font-mono text-blue-600">
                                      {formatValue(metric.valueA, metric.format)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Report A</div>
                                  </div>
                                  
                                  <div className="flex items-center justify-center">
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  
                                  <div className="text-center">
                                    <div className="font-mono text-green-600">
                                      {formatValue(metric.valueB, metric.format)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Report B</div>
                                  </div>
                                </>
                              )}
                              
                              {viewMode === 'diff' && (
                                <div className="col-span-3 text-center">
                                  <div className="font-mono">
                                    {formatValue(metric.valueA, metric.format)} → {formatValue(metric.valueB, metric.format)}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-center space-x-2">
                                {getTrendIcon(metric.trend)}
                                {metric.change !== undefined && (
                                  <span className={`text-sm font-medium ${
                                    metric.trend === 'up' ? 'text-green-600' : 
                                    metric.trend === 'down' ? 'text-red-600' : 
                                    'text-gray-600'
                                  }`}>
                                    {metric.change.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Comparison Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {comparisonData.filter(m => m.trend === 'up').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Improvements</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {comparisonData.filter(m => m.trend === 'down').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Regressions</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {comparisonData.filter(m => m.trend === 'stable').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Unchanged</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Select Two Reports to Compare</h3>
              <p className="text-sm">Choose reports from the dropdowns above to start comparing metrics and performance.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {selectedReportA && selectedReportB && (
            <Button onClick={exportComparison}>
              <Download className="h-4 w-4 mr-2" />
              Export Comparison
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Comparison trigger button component
interface CompareButtonProps {
  reports: ReportData[]
  selectedReports?: ReportData[]
  onCompare?: (reportA: ReportData, reportB: ReportData) => void
  className?: string
}

export function CompareButton({ reports, selectedReports = [], onCompare, className = "" }: CompareButtonProps) {
  const [showComparison, setShowComparison] = useState(false)

  const canCompare = selectedReports.length === 2 || reports.length >= 2

  if (!canCompare) return null

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowComparison(true)}
        className={className}
        disabled={!canCompare}
      >
        <GitCompare className="h-4 w-4 mr-2" />
        Compare Reports
      </Button>

      <ReportComparison
        reportA={selectedReports[0]}
        reportB={selectedReports[1]}
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        availableReports={reports}
        onReportSelect={(report, slot) => {
          if (onCompare && selectedReports.length === 2) {
            const otherReport = slot === 'A' ? selectedReports[1] : selectedReports[0]
            onCompare(report, otherReport)
          }
        }}
      />
    </>
  )
}