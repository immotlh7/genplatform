"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Languages, 
  Send, 
  Edit, 
  FolderOpen,
  Lightbulb,
  Play,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Copy,
  Sparkles
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CommanderAction {
  type: 'send_to_project' | 'create_idea' | 'execute_command' | 'edit_text'
  label: string
  data: any
}

interface CommanderResponse {
  englishCommand: string
  confidence: number
  suggestedActions: CommanderAction[]
  metadata: {
    detectedLanguage: string
    commandType: string
    originalText: string
    processingTime?: number
  }
}

interface CommanderCardProps {
  arabicText: string
  projectId?: string
  chatHistory?: Array<{ role: string; content: string }>
  onActionComplete?: (action: CommanderAction, result?: any) => void
  onEditRequest?: (originalText: string) => void
  className?: string
}

export function CommanderCard({
  arabicText,
  projectId,
  chatHistory = [],
  onActionComplete,
  onEditRequest,
  className = ''
}: CommanderCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<CommanderResponse | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedCommand, setEditedCommand] = useState('')
  const [executingAction, setExecutingAction] = useState<string | null>(null)

  useEffect(() => {
    if (arabicText) {
      translateCommand()
    }
  }, [arabicText, projectId])

  const translateCommand = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/commander', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          arabicText,
          context: 'chat',
          projectId,
          chatHistory: chatHistory.slice(-5) // Last 5 messages
        })
      })

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Translation failed')
      }

      setResponse(data.data)
      setEditedCommand(data.data.englishCommand)

    } catch (err) {
      console.error('Commander translation error:', err)
      setError(err instanceof Error ? err.message : 'Translation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: CommanderAction) => {
    setExecutingAction(action.type)
    
    try {
      let result = null

      switch (action.type) {
        case 'send_to_project':
          result = await handleSendToProject(action)
          break
        case 'create_idea':
          result = await handleCreateIdea(action)
          break
        case 'execute_command':
          result = await handleExecuteCommand(action)
          break
        case 'edit_text':
          handleEditText(action)
          return
      }

      onActionComplete?.(action, result)

    } catch (error) {
      console.error('Action execution error:', error)
      setError(error instanceof Error ? error.message : 'Action failed')
    } finally {
      setExecutingAction(null)
    }
  }

  const handleSendToProject = async (action: CommanderAction) => {
    const { projectId, taskText, content } = action.data
    
    if (!projectId) {
      throw new Error('No project selected')
    }

    // For now, navigate to project or show success message
    // In a full implementation, this would call an API to add content to project
    router.push(`/dashboard/projects/${projectId}`)
    return { success: true, action: 'navigated_to_project' }
  }

  const handleCreateIdea = async (action: CommanderAction) => {
    const { ideaText, type } = action.data
    
    // Navigate to ideas lab with pre-filled content
    const params = new URLSearchParams({
      content: ideaText,
      type: type || 'feature'
    })
    
    router.push(`/dashboard/ideas?${params.toString()}`)
    return { success: true, action: 'navigated_to_ideas_lab' }
  }

  const handleExecuteCommand = async (action: CommanderAction) => {
    const { command } = action.data
    
    // For demonstration, show success message
    // In a full implementation, this would execute the command via OpenClaw
    return { success: true, action: 'command_queued', command }
  }

  const handleEditText = (action: CommanderAction) => {
    setEditMode(true)
    setEditedCommand(action.data.originalText)
  }

  const handleSaveEdit = () => {
    if (response) {
      setResponse({
        ...response,
        englishCommand: editedCommand
      })
    }
    setEditMode(false)
  }

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(response?.englishCommand || '')
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_to_project':
        return <FolderOpen className="h-4 w-4" />
      case 'create_idea':
        return <Lightbulb className="h-4 w-4" />
      case 'execute_command':
        return <Play className="h-4 w-4" />
      case 'edit_text':
        return <Edit className="h-4 w-4" />
      default:
        return <Send className="h-4 w-4" />
    }
  }

  const getActionColor = (type: string) => {
    switch (type) {
      case 'send_to_project':
        return 'bg-blue-600 hover:bg-blue-700'
      case 'create_idea':
        return 'bg-green-600 hover:bg-green-700'
      case 'execute_command':
        return 'bg-purple-600 hover:bg-purple-700'
      case 'edit_text':
        return 'bg-gray-600 hover:bg-gray-700'
      default:
        return 'bg-blue-600 hover:bg-blue-700'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <Card className={`border-blue-200 bg-blue-50/50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Languages className="h-5 w-5 text-blue-600 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-blue-900">Translating Arabic command...</span>
              </div>
              <div className="text-xs text-blue-700 bg-blue-100 rounded p-2 font-mono">
                {arabicText}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50/50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-red-900 mb-1">Translation Failed</h4>
              <p className="text-sm text-red-700 mb-3">{error}</p>
              <div className="text-xs text-red-600 bg-red-100 rounded p-2 font-mono mb-3">
                Original: {arabicText}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={translateCommand}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry Translation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!response) {
    return null
  }

  return (
    <Card className={`border-blue-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Languages className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-blue-900">Commander Translation</span>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`text-xs ${getConfidenceColor(response.confidence)}`}>
              {Math.round(response.confidence * 100)}% confident
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleCopyCommand}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Original Text */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Original Arabic:</label>
          <div className="text-sm bg-gray-100 rounded-lg p-3 font-mono text-right" dir="rtl">
            {response.metadata.originalText}
          </div>
        </div>

        {/* Translated Command */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">English Translation:</label>
          {editMode ? (
            <div className="space-y-2">
              <Textarea
                value={editedCommand}
                onChange={(e) => setEditedCommand(e.target.value)}
                className="min-h-[80px]"
                placeholder="Edit the translated command..."
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="text-sm bg-white border rounded-lg p-3 font-mono">
                {response.englishCommand}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1"
                onClick={() => setEditMode(true)}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <span>Language:</span>
            <Badge variant="outline" className="text-xs">
              {response.metadata.detectedLanguage}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <span>Type:</span>
            <Badge variant="outline" className="text-xs">
              {response.metadata.commandType.replace('_', ' ')}
            </Badge>
          </div>
          {response.metadata.processingTime && (
            <div className="text-xs text-gray-500">
              {response.metadata.processingTime}ms
            </div>
          )}
        </div>

        {/* Suggested Actions */}
        {response.suggestedActions.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Suggested Actions:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {response.suggestedActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={() => handleAction(action)}
                  disabled={executingAction !== null}
                  className={`flex items-center space-x-2 text-white ${getActionColor(action.type)}`}
                  size="sm"
                >
                  {executingAction === action.type ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    getActionIcon(action.type)
                  )}
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Need something different?
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditRequest?.(arabicText)}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit Original
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={translateCommand}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retranslate
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CommanderCard