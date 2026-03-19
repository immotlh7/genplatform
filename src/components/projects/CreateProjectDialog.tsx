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
import { Card, CardContent } from '@/components/ui/card'
import { PrioritySelect, ProjectPriority } from './ProjectPrioritySystem'
import { useProjects } from '@/contexts/ProjectContext'
import { 
  Plus,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Palette,
  Github,
  Globe,
  Folder,
  Target,
  Wand2,
  Sparkles,
  Rocket
} from 'lucide-react'

interface ProjectTemplate {
  id: string
  name: string
  description: string
  color: string
  priority: ProjectPriority
  framework?: string
  category: 'web' | 'mobile' | 'ai' | 'data' | 'devtools' | 'other'
  defaultFiles?: string[]
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'web-app',
    name: 'Web Application',
    description: 'Modern web application with React/Next.js',
    color: '#3b82f6',
    priority: 'MEDIUM',
    framework: 'Next.js',
    category: 'web',
    defaultFiles: ['README.md', 'package.json', '.env.example']
  },
  {
    id: 'ai-agent',
    name: 'AI Agent Project',
    description: 'AI agent with skills and automation',
    color: '#7c3aed',
    priority: 'HIGH',
    category: 'ai',
    defaultFiles: ['SKILL.md', 'agent-config.json', 'README.md']
  },
  {
    id: 'mobile-app',
    name: 'Mobile Application',
    description: 'Cross-platform mobile app',
    color: '#059669',
    priority: 'MEDIUM',
    framework: 'React Native',
    category: 'mobile',
    defaultFiles: ['App.tsx', 'package.json', 'app.config.js']
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis',
    description: 'Data science and analytics project',
    color: '#dc2626',
    priority: 'LOW',
    framework: 'Python',
    category: 'data',
    defaultFiles: ['analysis.ipynb', 'requirements.txt', 'data/README.md']
  },
  {
    id: 'dev-tool',
    name: 'Development Tool',
    description: 'CLI tool or development utility',
    color: '#0891b2',
    priority: 'MEDIUM',
    category: 'devtools',
    defaultFiles: ['src/index.ts', 'package.json', 'cli.md']
  },
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with custom setup',
    color: '#6b7280',
    priority: 'LOW',
    category: 'other',
    defaultFiles: ['README.md']
  }
]

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#059669', // Green
  '#7c3aed', // Purple
  '#dc2626', // Red
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#be185d', // Pink
  '#4338ca', // Indigo
  '#059669', // Emerald
  '#9333ea', // Violet
  '#c2410c', // Orange-600
  '#0f766e'  // Teal
]

interface CreateProjectDialogProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onProjectCreated?: (project: any) => void
  className?: string
}

export function CreateProjectDialog({
  trigger,
  open,
  onOpenChange,
  onProjectCreated,
  className = ""
}: CreateProjectDialogProps) {
  const { createProject } = useProjects()
  
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'template' | 'details'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'MEDIUM' as ProjectPriority,
    color: '#3b82f6',
    githubUrl: '',
    deployUrl: '',
    framework: '',
    category: 'other' as ProjectTemplate['category']
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
        name: '',
        description: '',
        priority: 'MEDIUM',
        color: '#3b82f6',
        githubUrl: '',
        deployUrl: '',
        framework: '',
        category: 'other'
      })
      setErrors({})
    }
  }

  const selectTemplate = (template: ProjectTemplate) => {
    setSelectedTemplate(template)
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      priority: template.priority,
      color: template.color,
      framework: template.framework || '',
      category: template.category
    }))
    setStep('details')
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Project name must be at least 3 characters'
    } else if (formData.name.length > 50) {
      newErrors.name = 'Project name must be less than 50 characters'
    }
    
    if (formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters'
    }
    
    if (formData.githubUrl && !formData.githubUrl.match(/^https:\/\/github\.com\/[\w-]+\/[\w-]+$/)) {
      newErrors.githubUrl = 'Please enter a valid GitHub repository URL'
    }
    
    if (formData.deployUrl && !formData.deployUrl.match(/^https?:\/\/.+/)) {
      newErrors.deployUrl = 'Please enter a valid URL'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const newProject = await createProject({
        name: formData.name,
        description: formData.description,
        priority: formData.priority,
        color: formData.color,
        status: 'active',
        tasksCount: 0,
        completedTasks: 0,
        teamSize: 1,
        lastActivity: new Date().toISOString(),
        githubUrl: formData.githubUrl || undefined,
        deployUrl: formData.deployUrl || undefined,
        metadata: {
          framework: formData.framework,
          category: formData.category,
          template: selectedTemplate?.id,
          createdVia: 'create-dialog'
        }
      })
      
      onProjectCreated?.(newProject)
      handleOpenChange(false)
    } catch (error) {
      console.error('Error creating project:', error)
      setErrors({ submit: 'Failed to create project. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button className={className}>
      <Plus className="h-4 w-4 mr-2" />
      New Project
    </Button>
  )

  const dialogOpen = open !== undefined ? open : isOpen
  const handleDialogOpenChange = onOpenChange || handleOpenChange

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === 'template' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <span>Choose Project Template</span>
              </DialogTitle>
              <DialogDescription>
                Select a template to get started quickly, or choose blank for custom setup
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {PROJECT_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300 group"
                  onClick={() => selectTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: template.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-sm group-hover:text-blue-600 transition-colors">
                            {template.name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {template.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <div 
                                className={`w-2 h-2 rounded-full ${
                                  template.priority === 'HIGH' ? 'bg-red-500' :
                                  template.priority === 'MEDIUM' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                              />
                              <span className="text-xs text-muted-foreground">
                                {template.priority.toLowerCase()}
                              </span>
                            </div>
                            {template.framework && (
                              <span className="text-xs text-blue-600">
                                {template.framework}
                              </span>
                            )}
                          </div>
                          <Rocket className="h-3 w-3 text-muted-foreground group-hover:text-blue-500 transition-colors" />
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
                <Target className="h-5 w-5 text-blue-500" />
                <span>Project Details</span>
              </DialogTitle>
              <DialogDescription>
                Configure your {selectedTemplate?.name.toLowerCase()} project
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Project Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief project description"
                  className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{errors.description}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/200 characters
                </p>
              </div>

              {/* Priority and Color Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <PrioritySelect
                    value={formData.priority}
                    onValueChange={(priority) => setFormData(prev => ({ ...prev, priority }))}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label className="flex items-center space-x-1">
                    <Palette className="h-3 w-3" />
                    <span>Color</span>
                  </Label>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-md border-2 transition-all duration-200 ${
                          formData.color === color
                            ? 'border-gray-900 scale-110 shadow-md'
                            : 'border-gray-200 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Framework */}
              {selectedTemplate?.category === 'web' && (
                <div className="grid gap-2">
                  <Label htmlFor="framework">Framework</Label>
                  <Input
                    id="framework"
                    value={formData.framework}
                    onChange={(e) => setFormData(prev => ({ ...prev, framework: e.target.value }))}
                    placeholder="e.g., Next.js, React, Vue"
                  />
                </div>
              )}

              {/* URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="githubUrl" className="flex items-center space-x-1">
                    <Github className="h-3 w-3" />
                    <span>GitHub Repository</span>
                  </Label>
                  <Input
                    id="githubUrl"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
                    placeholder="https://github.com/user/repo"
                    className={errors.githubUrl ? 'border-red-500' : ''}
                  />
                  {errors.githubUrl && (
                    <p className="text-sm text-red-500 flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{errors.githubUrl}</span>
                    </p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="deployUrl" className="flex items-center space-x-1">
                    <Globe className="h-3 w-3" />
                    <span>Deploy URL</span>
                  </Label>
                  <Input
                    id="deployUrl"
                    value={formData.deployUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, deployUrl: e.target.value }))}
                    placeholder="https://your-app.vercel.app"
                    className={errors.deployUrl ? 'border-red-500' : ''}
                  />
                  {errors.deployUrl && (
                    <p className="text-sm text-red-500 flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{errors.deployUrl}</span>
                    </p>
                  )}
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
          {step === 'details' && (
            <Button 
              variant="outline" 
              onClick={() => setStep('template')}
              disabled={loading}
            >
              Back
            </Button>
          )}
          
          {step === 'details' && (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Create Project
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}