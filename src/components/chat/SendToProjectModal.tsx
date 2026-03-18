"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Send,
  FolderOpen,
  Plus,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Target,
  Flag,
  User,
  Calendar,
  Languages,
  Lightbulb
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'completed'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  tasksCount?: number
}

interface TaskData {
  title: string
  description: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  dueDate?: string
  assignee?: string
  tags?: string[]
}

interface SendToProjectModalProps {
  isOpen: boolean
  onClose: () => void
  originalText?: string
  translatedText: string
  confidence?: number
  onSuccess?: (result: { projectId: string; taskId: string; taskData: TaskData }) => void
}

export function SendToProjectModal({ 
  isOpen, 
  onClose, 
  originalText, 
  translatedText, 
  confidence = 0.8,
  onSuccess 
}: SendToProjectModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [taskData, setTaskData] = useState<TaskData>({
    title: translatedText,
    description: originalText ? `Original: ${originalText}\n\nTranslated: ${translatedText}` : translatedText,
    priority: 'MEDIUM'
  })

  useEffect(() => {
    if (isOpen) {
      loadProjects()
      // Reset form when modal opens
      setTaskData({
        title: translatedText,
        description: originalText ? `Original: ${originalText}\n\nTranslated: ${translatedText}` : translatedText,
        priority: 'MEDIUM'
      })
      setSelectedProjectId('')
      setError('')
    }
  }, [isOpen, translatedText, originalText])

  const loadProjects = async () => {
    setLoading(true)
    try {
      // Mock project loading - in real app, this would call /api/projects
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockProjects: Project[] = [
        {
          id: 'genplatform',
          name: 'GenPlatform.ai',
          description: 'Mission Control Dashboard for AI agents',
          status: 'active',
          priority: 'HIGH',
          tasksCount: 23
        },
        {
          id: 'agent-skills',
          name: 'Agent Skills Library',
          description: 'Collection of reusable AI agent skills',
          status: 'active',
          priority: 'MEDIUM',
          tasksCount: 12
        },
        {
          id: 'commander-enhancement',
          name: 'Commander Enhancement',
          description: 'Arabic-to-English command translation system',
          status: 'active',
          priority: 'HIGH',
          tasksCount: 8
        },
        {
          id: 'memory-system',
          name: 'Memory System',
          description: 'Distributed knowledge management',
          status: 'paused',
          priority: 'LOW',
          tasksCount: 5
        }
      ]
      
      setProjects(mockProjects)
      
      // Auto-select first active project
      const firstActive = mockProjects.find(p => p.status === 'active')
      if (firstActive) {
        setSelectedProjectId(firstActive.id)
      }
      
    } catch (err) {
      setError('Failed to load projects')
      console.error('Error loading projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedProjectId) {
      setError('Please select a project')
      return
    }

    if (!taskData.title.trim()) {
      setError('Task title is required')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Mock API call to create task
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Simulate API call
      const response = await fetch('/api/projects/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          ...taskData,
          source: 'commander-chat',
          metadata: {
            originalText,
            translatedText,
            confidence,
            createdFrom: 'chat'
          }
        })
      }).catch(() => ({ ok: false })) // Mock failure handling

      const taskId = `task-${Date.now()}`
      const selectedProject = projects.find(p => p.id === selectedProjectId)

      // Success callback
      onSuccess?.({
        projectId: selectedProjectId,
        taskId,
        taskData: {
          ...taskData,
          title: taskData.title,
          description: taskData.description
        }
      })

      // Close modal
      onClose()

    } catch (err) {
      setError('Failed to create task. Please try again.')
      console.error('Error creating task:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-300'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'completed': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Send to Project</span>
          </DialogTitle>
          <DialogDescription>
            Create a new task from your Commander translation
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Translation Preview */}
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <Languages className="h-4 w-4 text-blue-600" />
                <span>Commander Translation</span>
                <Badge className="bg-blue-100 text-blue-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {Math.round((confidence || 0.8) * 100)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {originalText && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Original (Arabic):</Label>
                  <div className="p-2 bg-orange-50 rounded text-right font-arabic" dir="rtl">
                    {originalText}
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Translation (English):</Label>
                <div className="p-2 bg-white rounded font-medium">
                  {translatedText}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Selection */}
          <div className="space-y-3">
            <Label htmlFor="project" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Select Project</span>
            </Label>
            
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                <span>Loading projects...</span>
              </div>
            ) : (
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center space-x-3 py-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`}></div>
                        <div className="flex-1">
                          <div className="font-medium">{project.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {project.tasksCount} tasks • {project.status}
                          </div>
                        </div>
                        <Badge className={getPriorityColor(project.priority)} variant="outline">
                          {project.priority}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedProjectId && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-sm">
                  <strong>Selected Project:</strong> {projects.find(p => p.id === selectedProjectId)?.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {projects.find(p => p.id === selectedProjectId)?.description}
                </div>
              </div>
            )}
          </div>

          {/* Task Details */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center space-x-2">
              <Lightbulb className="h-4 w-4" />
              <span>Task Details</span>
            </h3>

            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={taskData.title}
                onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={taskData.description}
                onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Task description..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="flex items-center space-x-1">
                  <Flag className="h-3 w-3" />
                  <span>Priority</span>
                </Label>
                <Select 
                  value={taskData.priority} 
                  onValueChange={(value) => setTaskData(prev => ({ ...prev, priority: value as 'HIGH' | 'MEDIUM' | 'LOW' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>High Priority</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Medium Priority</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="LOW">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Low Priority</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate" className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Due Date (Optional)</span>
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={taskData.dueDate || ''}
                  onChange={(e) => setTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading || !selectedProjectId}>
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating Task...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to Project
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}