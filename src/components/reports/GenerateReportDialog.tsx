"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  BarChart3,
  PieChart,
  Target,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Zap,
  Settings,
  Filter,
  Sparkles,
  Download,
  Eye,
  Database,
  Users,
  Activity,
  TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  icon: React.ReactNode
  estimatedTime: string
  includes: string[]
  tags: string[]
  isPopular?: boolean
}

interface GenerateReportDialogProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onReportGenerated?: (report: any) => void
  className?: string
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'daily-system',
    name: 'Daily System Report',
    description: 'Comprehensive overview of system performance, project progress, and key metrics from the last 24 hours',
    type: 'daily',
    icon: <Calendar as CalendarIcon className="h-5 w-5" />,
    estimatedTime: '2-3 minutes',
    includes: [
      'System health metrics',
      'Project progress updates',
      'Task completion rates',
      'User activity summary',
      'Performance indicators'
    ],
    tags: ['automated', 'daily', 'system'],
    isPopular: true
  },
  {
    id: 'weekly-performance',
    name: 'Weekly Performance Report',
    description: 'Team productivity analysis and project milestones achieved over the past week',
    type: 'weekly',
    icon: <BarChart3 className="h-5 w-5" />,
    estimatedTime: '3-5 minutes',
    includes: [
      'Team productivity metrics',
      'Project milestone tracking',
      'Sprint completion rates',
      'Resource utilization',
      'Trend analysis'
    ],
    tags: ['weekly', 'team', 'performance'],
    isPopular: true
  },
  {
    id: 'monthly-summary',
    name: 'Monthly Executive Summary',
    description: 'High-level business metrics and strategic insights for executive review',
    type: 'monthly',
    icon: <PieChart className="h-5 w-5" />,
    estimatedTime: '5-8 minutes',
    includes: [
      'Executive dashboard',
      'Business KPIs',
      'Strategic goals progress',
      'Resource allocation',
      'Risk assessment'
    ],
    tags: ['monthly', 'executive', 'business']
  },
  {
    id: 'security-audit',
    name: 'Security Audit Report',
    description: 'Comprehensive security review including access logs, vulnerabilities, and compliance status',
    type: 'custom',
    icon: <Target className="h-5 w-5" />,
    estimatedTime: '4-6 minutes',
    includes: [
      'Security events log',
      'Access control review',
      'Vulnerability assessment',
      'Compliance status',
      'Recommendations'
    ],
    tags: ['security', 'audit', 'compliance']
  },
  {
    id: 'project-deep-dive',
    name: 'Project Deep Dive',
    description: 'Detailed analysis of specific project performance, timelines, and deliverables',
    type: 'custom',
    icon: <Activity className="h-5 w-5" />,
    estimatedTime: '3-4 minutes',
    includes: [
      'Project timeline analysis',
      'Resource allocation review',
      'Deliverable status',
      'Risk identification',
      'Next steps planning'
    ],
    tags: ['project', 'analysis', 'custom']
  },
  {
    id: 'custom-report',
    name: 'Custom Report',
    description: 'Build your own report with specific metrics, date ranges, and focus areas',
    type: 'custom',
    icon: <Settings className="h-5 w-5" />,
    estimatedTime: '2-10 minutes',
    includes: [
      'Custom date range',
      'Selectable metrics',
      'Multiple data sources',
      'Flexible formatting',
      'Advanced filtering'
    ],
    tags: ['custom', 'flexible', 'advanced']
  }
]

export function GenerateReportDialog({
  trigger,
  open,
  onOpenChange,
  onReportGenerated,
  className = ""
}: GenerateReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'template' | 'configure'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    includeProjects: true,
    includeTasks: true,
    includeUsers: true,
    includeMetrics: true,
    tags: [] as string[],
    format: 'pdf',
    priority: 'normal'
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setIsOpen(newOpen)
    }
    
    if (!newOpen) {
      // Reset form when closing
      setStep('template')
      setSelectedTemplate(null)
      setFormData({
        title: '',
        description: '',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        includeProjects: true,
        includeTasks: true,
        includeUsers: true,
        includeMetrics: true,
        tags: [],
        format: 'pdf',
        priority: 'normal'
      })
      setErrors({})
    }
  }

  const selectTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    
    // Auto-fill form based on template
    setFormData(prev => ({
      ...prev,
      title: template.name,
      description: template.description,
      tags: template.tags,
      startDate: getDefaultStartDate(template.type),
      endDate: new Date()
    }))
    
    setStep('configure')
  }

  const getDefaultStartDate = (type: ReportTemplate['type']) => {
    const now = new Date()
    switch (type) {
      case 'daily':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case 'weekly':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'monthly':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Report title is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Report description is required'
    }
    
    if (formData.startDate >= formData.endDate) {
      newErrors.dateRange = 'End date must be after start date'
    }
    
    const daysDiff = (formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > 365) {
      newErrors.dateRange = 'Date range cannot exceed 365 days'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGenerate = async () => {
    if (!validateForm() || !selectedTemplate) return
    
    setLoading(true)
    try {
      // Mock API call to generate report
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newReport = {
        id: `report-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        type: selectedTemplate.type,
        status: 'generating',
        createdAt: new Date().toISOString(),
        dataRange: {
          start: formData.startDate.toISOString(),
          end: formData.endDate.toISOString()
        },
        metrics: {
          totalProjects: 0,
          completedTasks: 0,
          activeUsers: 0,
          systemHealth: 0
        },
        size: 'Calculating...',
        tags: formData.tags,
        template: selectedTemplate.id,
        priority: formData.priority
      }
      
      onReportGenerated?.(newReport)
      handleOpenChange(false)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error generating report:', error);
      }
      setErrors({ submit: 'Failed to generate report. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const dialogOpen = open !== undefined ? open : isOpen
  const handleDialogOpenChange = onOpenChange || handleOpenChange

  const defaultTrigger = (
    <Button className={className}>
      <Plus className="h-4 w-4 mr-2" />
      Generate Report
    </Button>
  )

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        {step === 'template' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <span>Generate New Report</span>
              </DialogTitle>
              <DialogDescription>
                Choose a report template to get started, or create a custom report
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {REPORT_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300 group relative"
                  onClick={() => selectTemplate(template)}
                >
                  {template.isPopular && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                        Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-sm group-hover:text-blue-600 transition-colors">
                            {template.name}
                          </h3>
                          <Badge variant="outline" className="text-xs capitalize">
                            {template.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {template.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>~{template.estimatedTime}</span>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-xs font-medium">Includes:</p>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              {template.includes.slice(0, 3).map((item, index) => (
                                <li key={index} className="flex items-center space-x-1">
                                  <CheckCircle className="h-2 w-2 text-green-500" />
                                  <span>{item}</span>
                                </li>
                              ))}
                              {template.includes.length > 3 && (
                                <li className="text-blue-600">
                                  +{template.includes.length - 3} more features
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-blue-500" />
                <span>Configure Report</span>
              </DialogTitle>
              <DialogDescription>
                Customize your {selectedTemplate?.name.toLowerCase()} settings
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Report Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Date Range</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.startDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.endDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, endDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {errors.dateRange && (
                  <p className="text-sm text-red-500">{errors.dateRange}</p>
                )}
              </div>

              {/* Data Sources */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>Data Sources</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeProjects"
                      checked={formData.includeProjects}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeProjects: checked as boolean }))}
                    />
                    <Label htmlFor="includeProjects" className="flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span>Projects</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeTasks"
                      checked={formData.includeTasks}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeTasks: checked as boolean }))}
                    />
                    <Label htmlFor="includeTasks" className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Tasks</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeUsers"
                      checked={formData.includeUsers}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeUsers: checked as boolean }))}
                    />
                    <Label htmlFor="includeUsers" className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Users</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeMetrics"
                      checked={formData.includeMetrics}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeMetrics: checked as boolean }))}
                    />
                    <Label htmlFor="includeMetrics" className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>System Metrics</span>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Output Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Output Format</Label>
                  <Select value={formData.format} onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="html">HTML Report</SelectItem>
                      <SelectItem value="json">JSON Data</SelectItem>
                      <SelectItem value="csv">CSV Export</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="normal">Normal Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600 flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.submit}</span>
                  </p>
                </div>
              )}
            </div>
          </>
        )}
        
        <DialogFooter>
          {step === 'configure' && (
            <Button 
              variant="outline" 
              onClick={() => setStep('template')}
              disabled={loading}
            >
              Back
            </Button>
          )}
          
          {step === 'configure' && (
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}