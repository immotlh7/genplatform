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
  Lightbulb,
  Save,
  RefreshCw,
  Sparkles,
  Tag,
  FolderOpen,
  CheckCircle,
  AlertTriangle,
  Languages,
  Target,
  Calendar,
  User
} from 'lucide-react'

interface IdeaCategory {
  id: string
  name: string
  description: string
  color: string
  icon: React.ReactNode
}

interface Project {
  id: string
  name: string
  status: string
}

interface NewIdeaModalProps {
  isOpen: boolean
  onClose: () => void
  initialContent?: string
  originalText?: string
  translatedText?: string
  selectedProject?: Project | null
  onSuccess?: (idea: any) => void
}

const ideaCategories: IdeaCategory[] = [
  {
    id: 'feature',
    name: 'Feature Idea',
    description: 'New functionality or enhancement',
    color: 'bg-blue-100 text-blue-800',
    icon: <Sparkles className="h-3 w-3" />
  },
  {
    id: 'improvement',
    name: 'Improvement',
    description: 'Enhancement to existing features',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="h-3 w-3" />
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Investigation or analysis needed',
    color: 'bg-purple-100 text-purple-800',
    icon: <Target className="h-3 w-3" />
  },
  {
    id: 'bug',
    name: 'Bug Report',
    description: 'Issue or problem identified',
    color: 'bg-red-100 text-red-800',
    icon: <AlertTriangle className="h-3 w-3" />
  },
  {
    id: 'general',
    name: 'General',
    description: 'Other ideas or thoughts',
    color: 'bg-gray-100 text-gray-800',
    icon: <Lightbulb className="h-3 w-3" />
  }
]

export function NewIdeaModal({ 
  isOpen, 
  onClose, 
  initialContent = '',
  originalText,
  translatedText,
  selectedProject,
  onSuccess 
}: NewIdeaModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(initialContent)
  const [category, setCategory] = useState('general')
  const [priority, setPriority] = useState('medium')
  const [tags, setTags] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignee, setAssignee] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setTitle('')
      setContent(initialContent || translatedText || '')
      setCategory('general')
      setPriority('medium')
      setTags('')
      setDueDate('')
      setAssignee('')
      setError('')
      
      // Auto-generate title from content
      if (translatedText) {
        const autoTitle = translatedText.length > 50 
          ? translatedText.substring(0, 47) + '...'
          : translatedText
        setTitle(autoTitle)
      }
    }
  }, [isOpen, initialContent, translatedText])

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Idea title is required')
      return
    }

    if (!content.trim()) {
      setError('Idea content is required')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Mock API call to create idea
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const newIdea = {
        id: `idea-${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        dueDate: dueDate || undefined,
        assignee: assignee || undefined,
        projectId: selectedProject?.id,
        source: 'chat',
        metadata: {
          originalText,
          translatedText,
          createdFrom: 'commander-chat'
        },
        createdAt: new Date().toISOString(),
        status: 'open'
      }

      // Success callback
      onSuccess?.(newIdea)
      
      // Close modal
      onClose()

    } catch (err) {
      setError('Failed to save idea. Please try again.')
      console.error('Error creating idea:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const getCategoryData = (categoryId: string) => {
    return ideaCategories.find(cat => cat.id === categoryId) || ideaCategories[0]
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const estimateReadTime = (text: string) => {
    const words = text.split(/\s+/).length
    const minutes = Math.ceil(words / 200) // Average reading speed
    return minutes
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>Capture New Idea</span>
          </DialogTitle>
          <DialogDescription>
            Save your idea for future development and consideration
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
          {/* Translation Context */}
          {(originalText || translatedText) && (
            <Card className="bg-blue-50/50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Languages className="h-4 w-4 text-blue-600" />
                  <span>From Chat</span>
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
                {translatedText && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Translation:</Label>
                    <div className="p-2 bg-white rounded">
                      {translatedText}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Project Context */}
          {selectedProject && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">
                  Project: {selectedProject.name}
                </span>
                <Badge className="bg-green-100 text-green-800">
                  {selectedProject.status}
                </Badge>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Idea Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief, descriptive title for your idea..."
                maxLength={100}
              />
              <div className="text-xs text-muted-foreground">
                {title.length}/100 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Detailed Description *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your idea in detail. What problem does it solve? How would it work?"
                rows={6}
              />
              <div className="text-xs text-muted-foreground">
                {content.split(/\s+/).length} words • ~{estimateReadTime(content)} min read
              </div>
            </div>
          </div>

          {/* Categorization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-1">
                <Tag className="h-3 w-3" />
                <span>Category</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ideaCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center space-x-2">
                        {cat.icon}
                        <div>
                          <div className="font-medium">{cat.name}</div>
                          <div className="text-xs text-muted-foreground">{cat.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge className={getCategoryData(category).color} variant="outline">
                {getCategoryData(category).icon}
                {getCategoryData(category).name}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Low Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Medium Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>High Priority</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ui, enhancement, mobile..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Target Date (Optional)</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee" className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>Assign To (Optional)</span>
            </Label>
            <Input
              id="assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Team member or yourself..."
            />
          </div>

          {/* Preview */}
          <Card className="bg-gray-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-medium">{title || 'Untitled Idea'}</div>
              <div className="text-sm text-muted-foreground line-clamp-3">
                {content || 'No description provided'}
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getCategoryData(category).color} variant="outline">
                  {getCategoryData(category).name}
                </Badge>
                <span className={`text-xs ${getPriorityColor(priority)}`}>
                  {priority.toUpperCase()} PRIORITY
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !title.trim() || !content.trim()}>
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving Idea...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Idea
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}