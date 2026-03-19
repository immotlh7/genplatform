import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  X, 
  FileText, 
  Clock,
  AlertCircle
} from 'lucide-react'

interface FileEditorProps {
  filePath: string
  fileName: string
  onSave?: (content: string) => void
  onCancel?: () => void
  readOnly?: boolean
  initialContent?: string
}

export function FileEditor({ 
  filePath, 
  fileName, 
  onSave, 
  onCancel,
  readOnly = false,
  initialContent
}: FileEditorProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialContent !== undefined) {
      setContent(initialContent)
      setLoading(false)
    } else {
      loadFileContent()
    }
  }, [filePath, initialContent])

  const loadFileContent = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/bridge/memory?path=${encodeURIComponent(filePath)}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`)
      }
      
      const data = await response.json()
      setContent(data.content || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file')
      setContent('')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (readOnly || saving) return
    
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/bridge/memory`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: filePath,
          content: content
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to save file: ${response.statusText}`)
      }
      
      setLastSaved(new Date())
      setIsDirty(false)
      
      if (onSave) {
        onSave(content)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file')
    } finally {
      setSaving(false)
    }
  }

  const handleContentChange = (value: string) => {
    setContent(value)
    setIsDirty(true)
  }

  const handleCancel = () => {
    if (isDirty && !confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      return
    }
    
    if (onCancel) {
      onCancel()
    }
  }

  const getFileIcon = () => {
    if (filePath.endsWith('.md')) return '📝'
    if (filePath.endsWith('.json')) return '📋'
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) return '⚙️'
    if (filePath.endsWith('.txt')) return '📄'
    return '📄'
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span className="font-mono text-sm">{fileName}</span>
            {readOnly && (
              <Badge variant="secondary">Read Only</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {lastSaved && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
            {isDirty && !readOnly && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                Unsaved changes
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading file...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadFileContent} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 p-4">
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="h-full min-h-[400px] font-mono text-sm resize-none"
                placeholder={readOnly ? 'File is empty' : 'Enter file content...'}
                readOnly={readOnly}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-xs text-muted-foreground">
                {content.length} characters • {content.split('\n').length} lines
              </div>
              
              <div className="flex items-center space-x-2">
                {!readOnly && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving || !isDirty}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}