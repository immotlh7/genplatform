"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Languages, 
  Send, 
  Edit, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ExternalLink,
  Lightbulb,
  ArrowRight,
  Volume2,
  VolumeX
} from 'lucide-react'

interface CommanderAction {
  type: 'send-to-project' | 'create-task' | 'edit-command'
  label: string
  data?: any
}

interface CommanderCardProps {
  originalText: string
  translatedText: string
  confidence: number
  suggestions?: string[]
  actions?: CommanderAction[]
  onAction?: (action: CommanderAction) => void
  onEdit?: (text: string) => void
  onSendToProject?: (text: string) => void
  className?: string
}

export function CommanderCard({
  originalText,
  translatedText,
  confidence,
  suggestions = [],
  actions = [],
  onAction,
  onEdit,
  onSendToProject,
  className = ""
}: CommanderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'bg-green-100 text-green-800 border-green-300'
    if (conf >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-red-100 text-red-800 border-red-300'
  }

  const getConfidenceIcon = (conf: number) => {
    if (conf >= 0.8) return <CheckCircle className="h-3 w-3" />
    if (conf >= 0.6) return <AlertCircle className="h-3 w-3" />
    return <AlertCircle className="h-3 w-3" />
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const handlePlayAudio = () => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true)
      const utterance = new SpeechSynthesisUtterance(translatedText)
      utterance.lang = 'en-US'
      utterance.onend = () => setIsPlaying(false)
      speechSynthesis.speak(utterance)
    }
  }

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      setIsPlaying(false)
    }
  }

  const handleActionClick = (action: CommanderAction) => {
    if (action.type === 'edit-command' && onEdit) {
      onEdit(translatedText)
    } else if (action.type === 'send-to-project' && onSendToProject) {
      onSendToProject(translatedText)
    } else if (onAction) {
      onAction(action)
    }
  }

  return (
    <Card className={`border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Languages className="h-5 w-5 text-blue-600" />
          <span>Commander Translation</span>
          <Badge className={getConfidenceColor(confidence)} variant="outline">
            {getConfidenceIcon(confidence)}
            {Math.round(confidence * 100)}% confident
          </Badge>
        </CardTitle>
        <CardDescription className="text-sm">
          Arabic command translated to English
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Original Text */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm font-medium text-muted-foreground">Original (Arabic):</span>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg border-r-4 border-orange-500">
            <p className="text-right font-arabic text-base" dir="rtl">
              {originalText}
            </p>
          </div>
        </div>

        {/* Translated Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-muted-foreground">Translation (English):</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2"
              >
                {isCopied ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={isPlaying ? handleStopAudio : handlePlayAudio}
                className="h-7 px-2"
              >
                {isPlaying ? (
                  <VolumeX className="h-3 w-3" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-gray-950 rounded-lg border-l-4 border-blue-500 shadow-sm">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {translatedText}
            </p>
          </div>
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Suggested Actions:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  className="text-xs"
                >
                  {action.type === 'send-to-project' && <Send className="h-3 w-3 mr-1" />}
                  {action.type === 'create-task' && <Plus className="h-3 w-3 mr-1" />}
                  {action.type === 'edit-command' && <Edit className="h-3 w-3 mr-1" />}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full justify-between text-sm"
            >
              <span>Tips & Suggestions ({suggestions.length})</span>
              <ArrowRight className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </Button>
            
            {isExpanded && (
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                    <Lightbulb className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-amber-800 dark:text-amber-200">
                      {suggestion}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-muted">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(translatedText)}
              className="text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendToProject?.(translatedText)}
              className="text-xs"
            >
              <Send className="h-3 w-3 mr-1" />
              Send to Project
            </Button>
          </div>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => onSendToProject?.(translatedText)}
            className="text-xs bg-blue-600 hover:bg-blue-700"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Use Command
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}