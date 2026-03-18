"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  X, 
  Eye, 
  Edit3,
  AlertCircle,
  CheckCircle,
  Undo,
  Redo
} from 'lucide-react'

interface FileEditorProps {
  filePath: string
  onClose: () => void
  onSave: (path: string, content: string) => Promise<boolean>
}

export function FileEditor({ filePath, onClose, onSave }: FileEditorProps) {
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [filename, setFilename] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])

  useEffect(() => {
    if (filePath) {
      loadFileContent()
    }
  }, [filePath])

  useEffect(() => {
    setHasChanges(content !== originalContent)
  }, [content, originalContent])

  const loadFileContent = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/openclaw/memory?path=${encodeURIComponent(filePath)}`)
      const data = await response.json()
      
      if (data.type === 'file') {
        setContent(data.content)
        setOriginalContent(data.content)
        setFilename(data.name)
        setUndoStack([data.content])
        setRedoStack([])
      }
    } catch (error) {
      console.error('Failed to load file:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('saving')
    
    try {
      const success = await onSave(filePath, content)
      if (success) {
        setOriginalContent(content)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Save failed:', error)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const handleContentChange = (newContent: string) => {
    // Add current content to undo stack before changing
    if (content !== newContent && undoStack[undoStack.length - 1] !== content) {
      setUndoStack(prev => [...prev.slice(-19), content]) // Keep last 20 states
      setRedoStack([]) // Clear redo stack when making new changes
    }
    setContent(newContent)
  }

  const handleUndo = () => {
    if (undoStack.length > 1) {
      const previousContent = undoStack[undoStack.length - 2]
      setRedoStack(prev => [...prev, content])
      setContent(previousContent)
      setUndoStack(prev => prev.slice(0, -1))
    }
  }

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[redoStack.length - 1]
      setUndoStack(prev => [...prev, content])
      setContent(nextContent)
      setRedoStack(prev => prev.slice(0, -1))
    }
  }

  const renderPreview = () => {
    const lines = content.split('\n')
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none h-full overflow-y-auto p-4 bg-muted/30">
        {lines.map((line, index) => {
          if (line.startsWith('# ')) {
            return <h1 key={index} className="text-2xl font-bold mt-6 mb-4">{line.slice(2)}</h1>
          } else if (line.startsWith('## ')) {
            return <h2 key={index} className="text-xl font-semibold mt-5 mb-3">{line.slice(3)}</h2>
          } else if (line.startsWith('### ')) {
            return <h3 key={index} className="text-lg font-medium mt-4 mb-2">{line.slice(4)}</h3>
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            return <li key={index} className="ml-4">{line.slice(2)}</li>
          } else if (line.startsWith('```')) {
            return <pre key={index} className="bg-muted p-3 rounded mt-2 mb-2 text-sm overflow-x-auto"><code>{line}</code></pre>
          } else if (line.trim() === '') {
            return <br key={index} />
          } else {
            return <p key={index} className="mb-2">{line}</p>
          }
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading file...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Editor Header */}
      <div className="border-b p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5" />
            <h2 className="font-semibold">Editing: {filename}</h2>
            {hasChanges && <Badge variant="outline">Unsaved Changes</Badge>}
            {saveStatus === 'saved' && <Badge className="bg-green-100 text-green-800">Saved</Badge>}
            {saveStatus === 'error' && <Badge variant="destructive">Save Failed</Badge>}
          </div>
          
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              disabled={undoStack.length <= 1}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>

            <Button size="sm" variant="outline" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* File path and status */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>{filePath}</div>
          <div className="flex items-center space-x-4">
            <span>{content.length} characters</span>
            <span>{content.split('\n').length} lines</span>
            {hasChanges && (
              <div className="flex items-center space-x-1 text-yellow-600">
                <AlertCircle className="h-3 w-3" />
                <span>Unsaved changes</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>All changes saved</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {previewMode ? (
          renderPreview()
        ) : (
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="h-full w-full border-0 resize-none focus:ring-0 font-mono text-sm p-4"
            placeholder="Start typing your content here..."
            onKeyDown={(e) => {
              // Handle keyboard shortcuts
              if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                  e.preventDefault()
                  if (hasChanges && !saving) {
                    handleSave()
                  }
                } else if (e.key === 'z' && !e.shiftKey) {
                  e.preventDefault()
                  handleUndo()
                } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
                  e.preventDefault()
                  handleRedo()
                }
              }
            }}
          />
        )}
      </div>
    </div>
  )
}