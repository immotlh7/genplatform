"use client"

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Edit, 
  Save, 
  X, 
  RefreshCw, 
  Languages, 
  CheckCircle,
  AlertTriangle,
  Copy,
  Undo,
  RotateCcw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { detectArabicText, getTextDirection, getLocalizedPlaceholder } from '@/lib/arabic-detection'

interface EditCommandModalProps {
  open: boolean
  onClose: () => void
  originalArabic?: string
  currentEnglish?: string
  originalConfidence?: number
  onSave?: (editedArabic: string, newTranslation?: string) => void
  onRetranslate?: (editedText: string) => void
}

export function EditCommandModal({
  open,
  onClose,
  originalArabic = '',
  currentEnglish = '',
  originalConfidence = 0,
  onSave,
  onRetranslate
}: EditCommandModalProps) {
  const { toast } = useToast()
  const [editedArabic, setEditedArabic] = useState(originalArabic)
  const [editedEnglish, setEditedEnglish] = useState(currentEnglish)
  const [isRetranslating, setIsRetranslating] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [arabicDetection, setArabicDetection] = useState<any>(null)
  const [editMode, setEditMode] = useState<'arabic' | 'english' | 'both'>('arabic')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const arabicTextareaRef = useRef<HTMLTextAreaElement>(null)
  const englishTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Initialize state when modal opens
  useEffect(() => {
    if (open) {
      setEditedArabic(originalArabic)
      setEditedEnglish(currentEnglish)
      setHasChanges(false)
      setValidationErrors([])
      setEditMode('arabic')
    }
  }, [open, originalArabic, currentEnglish])

  // Detect Arabic text changes in real-time
  useEffect(() => {
    if (editedArabic) {
      const detection = detectArabicText(editedArabic)
      setArabicDetection(detection)
      
      // Validate and set errors
      const errors: string[] = []
      if (!detection.isArabic && editedArabic.trim().length > 0) {
        errors.push('Text does not appear to be Arabic')
      }
      if (detection.confidence < 0.3 && detection.isArabic) {
        errors.push('Low confidence Arabic detection')
      }
      if (editedArabic.length > 2000) {
        errors.push('Text too long (max 2000 characters)')
      }
      
      setValidationErrors(errors)
    }
  }, [editedArabic])

  // Track changes
  useEffect(() => {
    const arabicChanged = editedArabic !== originalArabic
    const englishChanged = editedEnglish !== currentEnglish
    setHasChanges(arabicChanged || englishChanged)
  }, [editedArabic, editedEnglish, originalArabic, currentEnglish])

  const handleRetranslate = async () => {
    if (!editedArabic.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter Arabic text to translate.",
        variant: "destructive",
      })
      return
    }

    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(', '),
        variant: "destructive",
      })
      return
    }

    setIsRetranslating(true)

    try {
      const response = await fetch('/api/commander', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          arabicText: editedArabic,
          context: 'edit_retranslation'
        })
      })

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.data.englishCommand) {
        setEditedEnglish(data.data.englishCommand)
        toast({
          title: "Translation Updated",
          description: `New translation with ${Math.round(data.data.confidence * 100)}% confidence`,
        })
        
        onRetranslate?.(editedArabic)
      } else {
        throw new Error(data.message || 'Translation failed')
      }

    } catch (error) {
      console.error('Retranslation error:', error)
      toast({
        title: "Translation Error",
        description: error instanceof Error ? error.message : 'Failed to retranslate text',
        variant: "destructive",
      })
    } finally {
      setIsRetranslating(false)
    }
  }

  const handleSave = () => {
    if (!editedArabic.trim() && !editedEnglish.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide either Arabic text or English translation.",
        variant: "destructive",
      })
      return
    }

    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(', '),
        variant: "destructive",
      })
      return
    }

    onSave?.(editedArabic, editedEnglish)
    
    toast({
      title: "Changes Saved",
      description: "Command has been updated successfully.",
    })
    
    onClose()
  }

  const handleReset = () => {
    setEditedArabic(originalArabic)
    setEditedEnglish(currentEnglish)
    setHasChanges(false)
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    })
  }

  const getConfidenceDisplay = () => {
    if (!arabicDetection) return null
    
    const confidence = arabicDetection.confidence
    const color = confidence >= 0.8 ? 'green' : confidence >= 0.6 ? 'yellow' : 'red'
    
    return (
      <Badge className={`text-xs ${
        color === 'green' ? 'bg-green-100 text-green-800' :
        color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        Arabic: {Math.round(confidence * 100)}%
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5 text-blue-600" />
            <span>Edit Command</span>
          </DialogTitle>
          <DialogDescription>
            Edit the Arabic text or English translation. Changes will update the command in chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Edit Mode Selector */}
          <div className="flex items-center space-x-2">
            <Label className="text-sm font-medium">Edit Mode:</Label>
            <div className="flex space-x-1">
              <Button
                variant={editMode === 'arabic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode('arabic')}
              >
                Arabic Only
              </Button>
              <Button
                variant={editMode === 'english' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode('english')}
              >
                English Only
              </Button>
              <Button
                variant={editMode === 'both' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode('both')}
              >
                Both
              </Button>
            </div>
          </div>

          {/* Arabic Text Editing */}
          {(editMode === 'arabic' || editMode === 'both') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center space-x-1">
                  <Languages className="h-3 w-3" />
                  <span>Arabic Text:</span>
                </Label>
                <div className="flex items-center space-x-2">
                  {getConfidenceDisplay()}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(editedArabic, 'Arabic text')}
                    disabled={!editedArabic.trim()}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <Textarea
                ref={arabicTextareaRef}
                value={editedArabic}
                onChange={(e) => setEditedArabic(e.target.value)}
                placeholder={getLocalizedPlaceholder(true, 'command')}
                className="min-h-[120px] font-mono text-right"
                dir="rtl"
              />
              
              {/* Arabic Detection Info */}
              {arabicDetection && (
                <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                  <div className="grid grid-cols-2 gap-2">
                    <span>Arabic chars: {arabicDetection.metrics.arabicChars}/{arabicDetection.metrics.totalChars}</span>
                    <span>Words: {arabicDetection.metrics.arabicWords}/{arabicDetection.metrics.wordCount}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Translation Actions */}
          {(editMode === 'arabic' || editMode === 'both') && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Translation</span>
                <Badge variant="outline" className="text-xs">
                  Auto-update available
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetranslate}
                disabled={isRetranslating || !editedArabic.trim() || validationErrors.length > 0}
              >
                {isRetranslating ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retranslate
                  </>
                )}
              </Button>
            </div>
          )}

          {/* English Text Editing */}
          {(editMode === 'english' || editMode === 'both') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center space-x-1">
                  <Languages className="h-3 w-3" />
                  <span>English Translation:</span>
                </Label>
                <div className="flex items-center space-x-2">
                  {originalConfidence > 0 && (
                    <Badge className="text-xs bg-gray-100 text-gray-800">
                      Original: {Math.round(originalConfidence * 100)}%
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(editedEnglish, 'English translation')}
                    disabled={!editedEnglish.trim()}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <Textarea
                ref={englishTextareaRef}
                value={editedEnglish}
                onChange={(e) => setEditedEnglish(e.target.value)}
                placeholder={getLocalizedPlaceholder(false, 'command')}
                className="min-h-[120px] font-mono"
                dir="ltr"
              />
              
              <div className="text-xs text-muted-foreground">
                💡 Tip: You can manually edit the English translation or use "Retranslate" to generate a new one.
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 border border-red-200 rounded-lg bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Validation Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Change Indicator */}
          {hasChanges && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">
                Changes detected. Remember to save your edits.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex space-x-2">
              {hasChanges && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || validationErrors.length > 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-3 w-3 mr-1" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Editing Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Edit Arabic text to improve translation accuracy</li>
              <li>• Use "Retranslate" to generate new English translation</li>
              <li>• Manually adjust English text for better clarity</li>
              <li>• Higher confidence scores indicate better translations</li>
              <li>• Common Arabic development terms work best</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EditCommandModal