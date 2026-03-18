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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Edit,
  Languages,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  RotateCcw,
  Lightbulb,
  Send,
  Wand2,
  Copy,
  Volume2
} from 'lucide-react'

interface EditCommandModalProps {
  isOpen: boolean
  onClose: () => void
  originalText?: string
  translatedText: string
  confidence?: number
  onSave?: (editedText: string, metadata?: any) => void
  onSendToProject?: (text: string) => void
}

interface EditSuggestion {
  id: string
  text: string
  reason: string
  confidence: number
  type: 'grammar' | 'clarity' | 'context' | 'terminology'
}

export function EditCommandModal({ 
  isOpen, 
  onClose, 
  originalText, 
  translatedText, 
  confidence = 0.8,
  onSave,
  onSendToProject
}: EditCommandModalProps) {
  const [editedText, setEditedText] = useState(translatedText)
  const [isModified, setIsModified] = useState(false)
  const [suggestions, setSuggestions] = useState<EditSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setEditedText(translatedText)
      setIsModified(false)
      setError('')
      generateSuggestions()
    }
  }, [isOpen, translatedText])

  useEffect(() => {
    setIsModified(editedText !== translatedText)
  }, [editedText, translatedText])

  const generateSuggestions = async () => {
    setLoading(true)
    try {
      // Mock AI-powered suggestions generation
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockSuggestions: EditSuggestion[] = [
        {
          id: '1',
          text: translatedText.replace(/new/gi, 'fresh'),
          reason: 'More specific terminology',
          confidence: 0.85,
          type: 'terminology'
        },
        {
          id: '2', 
          text: translatedText.replace(/create/gi, 'establish'),
          reason: 'Professional tone improvement',
          confidence: 0.78,
          type: 'clarity'
        },
        {
          id: '3',
          text: `Please ${translatedText.toLowerCase()}`,
          reason: 'Added politeness marker',
          confidence: 0.72,
          type: 'context'
        }
      ].filter(s => s.text !== translatedText) // Only show different suggestions

      setSuggestions(mockSuggestions)
    } catch (err) {
      console.error('Error generating suggestions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (editedText.trim()) {
      onSave?.(editedText.trim(), {
        originalText,
        translatedText,
        editedText: editedText.trim(),
        confidence,
        isModified,
        timestamp: new Date().toISOString()
      })
      onClose()
    }
  }

  const handleReset = () => {
    setEditedText(translatedText)
  }

  const applySuggestion = (suggestion: EditSuggestion) => {
    setEditedText(suggestion.text)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedText)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const handlePlayAudio = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(editedText)
      utterance.lang = 'en-US'
      speechSynthesis.speak(utterance)
    }
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'grammar': return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'clarity': return <Lightbulb className="h-3 w-3 text-blue-600" />
      case 'context': return <AlertTriangle className="h-3 w-3 text-orange-600" />
      case 'terminology': return <Wand2 className="h-3 w-3 text-purple-600" />
      default: return <Edit className="h-3 w-3 text-gray-600" />
    }
  }

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'grammar': return 'border-green-200 bg-green-50 hover:bg-green-100'
      case 'clarity': return 'border-blue-200 bg-blue-50 hover:bg-blue-100'
      case 'context': return 'border-orange-200 bg-orange-50 hover:bg-orange-100'
      case 'terminology': return 'border-purple-200 bg-purple-50 hover:bg-purple-100'
      default: return 'border-gray-200 bg-gray-50 hover:bg-gray-100'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Edit Command</span>
            {isModified && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Modified
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Review and edit the translated command before executing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Translation Context */}
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <Languages className="h-4 w-4 text-blue-600" />
                <span>Original Translation</span>
                <Badge className="bg-blue-100 text-blue-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {Math.round(confidence * 100)}% confident
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
                <div className="p-2 bg-white rounded">
                  {translatedText}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="edited-text" className="flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>Edit Translation</span>
              </Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlayAudio}
                  className="h-7 px-2"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
                {isModified && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-7 px-2 text-orange-600 hover:text-orange-700"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
            
            <Textarea
              id="edited-text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              placeholder="Edit your command here..."
              rows={4}
              className="resize-none"
            />
            
            <div className="text-xs text-muted-foreground">
              Characters: {editedText.length} • Words: {editedText.split(/\s+/).filter(w => w).length}
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span>AI Suggestions</span>
              </Label>
              {loading && (
                <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse p-3 bg-muted/30 rounded-lg">
                    <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : suggestions.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {suggestions.map((suggestion) => (
                  <div 
                    key={suggestion.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${getSuggestionColor(suggestion.type)}`}
                    onClick={() => applySuggestion(suggestion)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          {getSuggestionIcon(suggestion.type)}
                          <span className="text-sm font-medium capitalize">{suggestion.type}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(suggestion.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="text-sm">{suggestion.text}</p>
                        <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No suggestions available for this translation</p>
              </div>
            )}
          </div>

          {/* Character/Word Limits Info */}
          {editedText.length > 200 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  Long commands may be harder to execute. Consider breaking into smaller parts.
                </span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onSendToProject?.(editedText)}
              disabled={!editedText.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Project
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!editedText.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {isModified ? 'Save Changes' : 'Use Command'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}