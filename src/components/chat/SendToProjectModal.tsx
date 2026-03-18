"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FolderOpen, 
  Send, 
  X, 
  Plus, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Languages,
  FileText,
  Calendar,
  User
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'archived' | 'completed'
  created_at: string
  taskCount?: number
  isAccessible?: boolean
}

interface SendToProjectModalProps {
  open: boolean
  onClose: () => void
  arabicText?: string
  englishText?: string
  confidence?: number
  preselectedProjectId?: string
  onSuccess?: (projectId: string, result: any) => void
}

export function SendToProjectModal({
  open,
  onClose,
  arabicText = '',
  englishText = '',
  confidence = 0,
  preselectedProjectId,
  onSuccess
}: SendToProjectModalProps) {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState(preselectedProjectId || '')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [contentTitle, setContentTitle] = useState('')
  const [contentDescription, setContentDescription] = useState(englishText)
  const [contentType, setContentType] = useState<'task' | 'idea' | 'note' | 'command'>('task')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [loading, setLoading] = useState(false)
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadAccessibleProjects()
    }
  }, [open])

  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId)
      setSelectedProject(project || null)
    }
  }, [selectedProjectId, projects])

  useEffect(() => {
    // Auto-generate title from content
    if (englishText && !contentTitle) {
      const title = generateTitleFromContent(englishText)
      setContentTitle(title)
    }
    setContentDescription(englishText)
  }, [englishText])

  const loadAccessibleProjects = async () => {
    setProjectsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/projects', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You don\'t have permission to view projects')
        }
        throw new Error(`Failed to load projects: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.data.projects) {
        // Filter for active projects only
        const activeProjects = data.data.projects.filter((p: Project) => 
          p.status === 'active' && p.isAccessible !== false
        )
        setProjects(activeProjects)
        
        // Auto-select first project if none selected
        if (!selectedProjectId && activeProjects.length > 0) {
          setSelectedProjectId(activeProjects[0].id)
        }
      } else {
        throw new Error(data.message || 'Failed to load projects')
      }

    } catch (err) {
      console.error('Error loading projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
      
      // Show demo projects for development
      const demoProjects: Project[] = [
        {
          id: 'demo-1',
          name: 'GenPlatform Development',
          description: 'Main platform development project',
          status: 'active',
          created_at: new Date().toISOString(),
          taskCount: 12,
          isAccessible: true
        },
        {
          id: 'demo-2',
          name: 'Mobile App Project',
          description: 'Cross-platform mobile application',
          status: 'active',
          created_at: new Date().toISOString(),
          taskCount: 8,
          isAccessible: true
        }
      ]
      
      setProjects(demoProjects)
      if (!selectedProjectId) {
        setSelectedProjectId(demoProjects[0].id)
      }
    } finally {
      setProjectsLoading(false)
    }
  }

  const generateTitleFromContent = (content: string): string => {
    // Extract first meaningful sentence or phrase
    const cleaned = content.trim()
    
    // If it's a command, extract the action
    if (cleaned.toLowerCase().includes('create') || cleaned.toLowerCase().includes('أنشئ')) {
      return 'Create Task'
    }
    if (cleaned.toLowerCase().includes('fix') || cleaned.toLowerCase().includes('إصلاح')) {
      return 'Fix Issue'
    }
    if (cleaned.toLowerCase().includes('feature') || cleaned.toLowerCase().includes('ميزة')) {
      return 'New Feature'
    }
    if (cleaned.toLowerCase().includes('deploy') || cleaned.toLowerCase().includes('نشر')) {
      return 'Deployment Task'
    }
    
    // Otherwise, take first few words
    const words = cleaned.split(' ').slice(0, 5).join(' ')
    return words.length > 50 ? words.substring(0, 47) + '...' : words
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle className="h-4 w-4" />
      case 'idea':
        return <Plus className="h-4 w-4" />
      case 'note':
        return <FileText className="h-4 w-4" />
      case 'command':
        return <Languages className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const handleSendToProject = async () => {
    if (!selectedProjectId || !contentDescription.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a project and provide content description.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/projects/add-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          projectId: selectedProjectId,
          content: {
            title: contentTitle || 'Untitled',
            description: contentDescription,
            type: contentType,
            priority: priority,
            source: 'commander_chat',
            metadata: {
              originalArabic: arabicText || null,
              englishTranslation: englishText || null,
              confidence: confidence || null,
              createdVia: 'chat_commander',
              timestamp: new Date().toISOString()
            }
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to add content: ${response.status} - ${errorData}`)
      }

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success!",
          description: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} added to ${selectedProject?.name}`,
        })
        
        onSuccess?.(selectedProjectId, data.data)
        onClose()
      } else {
        throw new Error(data.message || 'Failed to add content to project')
      }

    } catch (err) {
      console.error('Error sending to project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to send to project'
      setError(errorMessage)
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            <span>Send to Project</span>
          </DialogTitle>
          <DialogDescription>
            Add translated command or content to a project as a task, idea, or note.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Source Text Display */}
          {(arabicText || englishText) && (
            <div className="space-y-3">
              {arabicText && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium flex items-center space-x-1">
                    <Languages className="h-3 w-3" />
                    <span>Original Arabic Text:</span>
                  </Label>
                  <div className="text-sm bg-orange-50 border border-orange-200 rounded-lg p-3 font-mono text-right" dir="rtl">
                    {arabicText}
                  </div>
                </div>
              )}

              {englishText && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Languages className="h-3 w-3" />
                      <span>English Translation:</span>
                    </div>
                    {confidence > 0 && (
                      <Badge className={`text-xs ${
                        confidence >= 0.8 ? 'bg-green-100 text-green-800' : 
                        confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(confidence * 100)}% confidence
                      </Badge>
                    )}
                  </Label>
                  <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-3">
                    {englishText}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">Select Project *</Label>
            {projectsLoading ? (
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading projects...</span>
              </div>
            ) : projects.length > 0 ? (
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{project.name}</span>
                        <div className="flex items-center space-x-2 ml-2">
                          <Badge variant="outline" className="text-xs">
                            {project.taskCount || 0} tasks
                          </Badge>
                          <Badge className={`text-xs ${
                            project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center space-x-2 p-3 border border-red-200 rounded-lg bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">No accessible projects found</span>
              </div>
            )}
          </div>

          {/* Selected Project Info */}
          {selectedProject && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">{selectedProject.name}</h4>
                  {selectedProject.description && (
                    <p className="text-sm text-blue-700 mt-1">{selectedProject.description}</p>
                  )}
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {selectedProject.taskCount || 0} tasks
                </Badge>
              </div>
            </div>
          )}

          {/* Content Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contentType">Content Type *</Label>
              <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3" />
                      <span>Task</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="idea">
                    <div className="flex items-center space-x-2">
                      <Plus className="h-3 w-3" />
                      <span>Idea</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="note">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-3 w-3" />
                      <span>Note</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="command">
                    <div className="flex items-center space-x-2">
                      <Languages className="h-3 w-3" />
                      <span>Command</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <Badge className="bg-green-100 text-green-800">Low</Badge>
                  </SelectItem>
                  <SelectItem value="medium">
                    <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                  </SelectItem>
                  <SelectItem value="high">
                    <Badge className="bg-red-100 text-red-800">High</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content Title */}
          <div className="space-y-2">
            <Label htmlFor="contentTitle">Title</Label>
            <Input
              id="contentTitle"
              value={contentTitle}
              onChange={(e) => setContentTitle(e.target.value)}
              placeholder={`Enter ${contentType} title...`}
            />
          </div>

          {/* Content Description */}
          <div className="space-y-2">
            <Label htmlFor="contentDescription">Description *</Label>
            <Textarea
              id="contentDescription"
              value={contentDescription}
              onChange={(e) => setContentDescription(e.target.value)}
              placeholder={`Enter ${contentType} description...`}
              className="min-h-[100px]"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start space-x-2 p-3 border border-red-200 rounded-lg bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Added via Commander Chat</span>
              <Calendar className="h-3 w-3 ml-2" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button 
                onClick={handleSendToProject} 
                disabled={loading || !selectedProjectId || !contentDescription.trim()}
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Send className="h-3 w-3 mr-1" />
                )}
                Send to Project
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SendToProjectModal