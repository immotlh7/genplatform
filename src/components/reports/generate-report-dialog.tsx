"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Plus,
  FileText,
  Calendar,
  BarChart3,
  Clock,
  Zap,
  Loader2,
  CheckCircle
} from 'lucide-react'
import { useProjects } from '@/contexts/project-context'

interface GenerateReportDialogProps {
  children?: React.ReactNode
  onSuccess?: (report: any) => void
}

export function GenerateReportDialog({ children, onSuccess }: GenerateReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('custom')
  const [description, setDescription] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [includeMetrics, setIncludeMetrics] = useState({
    performance: true,
    security: true,
    development: true,
    deployment: true,
    testing: false,
    analytics: false
  })
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError] = useState('')

  const { projects } = useProjects()

  const reportTemplates = [
    {
      type: 'daily' as const,
      title: 'Daily Development Report',
      description: 'Daily overview of development activities, commits, and deployments',
      duration: '~2 minutes',
      metrics: ['development', 'deployment', 'testing']
    },
    {
      type: 'weekly' as const,
      title: 'Weekly Sprint Analysis',
      description: 'Weekly sprint progress, velocity analysis, and team performance',
      duration: '~5 minutes',
      metrics: ['development', 'performance', 'analytics']
    },
    {
      type: 'monthly' as const,
      title: 'Monthly System Report',
      description: 'Comprehensive monthly analysis including security, performance, and metrics',
      duration: '~10 minutes',
      metrics: ['performance', 'security', 'analytics', 'development']
    },
    {
      type: 'custom' as const,
      title: 'Custom Report',
      description: 'Tailored report with your specific requirements',
      duration: '~3-15 minutes',
      metrics: []
    }
  ]

  const resetForm = () => {
    setTitle('')
    setType('custom')
    setDescription('')
    setSelectedProject('')
    setDateRange('today')
    setError('')
    setGenerated(false)
    setIncludeMetrics({
      performance: true,
      security: true,
      development: true,
      deployment: true,
      testing: false,
      analytics: false
    })
  }

  const handleClose = () => {
    setOpen(false)
    resetForm()
  }

  const handleTemplateSelect = (template: typeof reportTemplates[0]) => {
    setType(template.type)
    if (template.type !== 'custom') {
      setTitle(template.title + ` - ${new Date().toLocaleDateString()}`)
      setDescription(template.description)
    }

    // Set default metrics based on template
    if (template.metrics.length > 0) {
      const newMetrics = { ...includeMetrics }
      Object.keys(newMetrics).forEach(key => {
        newMetrics[key as keyof typeof newMetrics] = template.metrics.includes(key)
      })
      setIncludeMetrics(newMetrics)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      setError('Report title is required')
      return
    }

    setGenerating(true)
    setError('')

    try {
      // Simulate API call
      const reportData = {
        title: title.trim(),
        type,
        description: description.trim(),
        project: selectedProject,
        dateRange,
        metrics: includeMetrics
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 3000))

      const newReport = {
        id: Date.now().toString(),
        ...reportData,
        status: 'completed',
        createdAt: new Date().toISOString(),
        size: '2.1 MB',
        insights: Math.floor(Math.random() * 20) + 5
      }

      setGenerated(true)
      onSuccess?.(newReport)
      
      // Auto close after success
      setTimeout(() => {
        handleClose()
      }, 2000)

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error generating report:', error);
      }
      setError('Failed to generate report. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const selectedTemplate = reportTemplates.find(t => t.type === type)
  const selectedMetricsCount = Object.values(includeMetrics).filter(Boolean).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Generate New Report</DialogTitle>
          <DialogDescription>
            Create a custom report with AI-powered insights and analytics
          </DialogDescription>
        </DialogHeader>

        {!generated ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Report Templates */}
            <div className="space-y-3">
              <Label>Report Template</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {reportTemplates.map((template) => (
                  <Card
                    key={template.type}
                    className={`cursor-pointer transition-colors ${
                      type === template.type
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-muted-foreground/50'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{template.title}</CardTitle>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{template.duration}</span>
                        </div>
                      </div>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Custom Title for custom reports */}
            <div className="space-y-2">
              <Label htmlFor="report-title">Report Title *</Label>
              <Input
                id="report-title"
                placeholder="Enter report title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={generating || type !== 'custom'}
                className={error && !title.trim() ? 'border-red-500' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-description">Description</Label>
              <Textarea
                id="report-description"
                placeholder="Brief description of what this report should cover..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={generating}
                rows={2}
              />
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="project-select">Project (Optional)</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject} disabled={generating}>
                <SelectTrigger id="project-select">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Projects</SelectItem>
                  {projects.filter(p => p.status === 'active').map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange} disabled={generating}>
                <SelectTrigger id="date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Metrics Selection */}
            <div className="space-y-3">
              <Label>Include Metrics ({selectedMetricsCount} selected)</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(includeMetrics).map(([key, checked]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={checked}
                      onCheckedChange={(checked) =>
                        setIncludeMetrics(prev => ({ ...prev, [key]: checked as boolean }))
                      }
                      disabled={generating}
                    />
                    <Label htmlFor={key} className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{title || 'Report Title'}</span>
                  <Badge variant="outline" className="capitalize">
                    {type}
                  </Badge>
                </div>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {selectedProject ? projects.find(p => p.id === selectedProject)?.name : 'All Projects'}
                  </span>
                  <span>{selectedMetricsCount} metrics • {dateRange}</span>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={generating}>
                Cancel
              </Button>
              <Button type="submit" disabled={generating || !title.trim()}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          // Success state
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Report Generated Successfully!</h3>
            <p className="text-muted-foreground">
              Your report has been generated and is ready to view.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}