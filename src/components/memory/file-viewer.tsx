import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactMarkdown from 'react-markdown'
import { 
  FileText, 
  Download, 
  Copy, 
  ExternalLink,
  Check,
  AlertCircle
} from 'lucide-react'

interface FileViewerProps {
  filePath: string
  fileName: string
  onEdit?: () => void
  canEdit?: boolean
}

export function FileViewer({ filePath, fileName, onEdit, canEdit = false }: FileViewerProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [fileSize, setFileSize] = useState(0)
  const [lastModified, setLastModified] = useState<Date | null>(null)

  useEffect(() => {
    loadFileContent()
  }, [filePath])

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
      
      // Set file metadata if available
      if (data.size) setFileSize(data.size)
      if (data.lastModified) setLastModified(new Date(data.lastModified))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file')
      setContent('')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to copy content:', err);
      }
    }
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isMarkdown = filePath.endsWith('.md')
  const isJSON = filePath.endsWith('.json')

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span className="font-mono text-sm">{fileName}</span>
            {isMarkdown && <Badge variant="secondary">Markdown</Badge>}
            {isJSON && <Badge variant="secondary">JSON</Badge>}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={loading || !content}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={loading || !content}
            >
              <Download className="h-4 w-4" />
            </Button>
            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                Edit
              </Button>
            )}
          </div>
        </CardTitle>
        {(fileSize > 0 || lastModified) && (
          <div className="text-xs text-muted-foreground mt-1">
            {fileSize > 0 && <span>{formatFileSize(fileSize)}</span>}
            {fileSize > 0 && lastModified && <span> • </span>}
            {lastModified && <span>Modified {lastModified.toLocaleDateString()}</span>}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading file content...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={loadFileContent} variant="outline" size="sm">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : !content ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>This file is empty</p>
              </div>
            ) : isMarkdown ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : isJSON ? (
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code className="text-sm font-mono">
                  {JSON.stringify(JSON.parse(content), null, 2)}
                </code>
              </pre>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-sm">{content}</pre>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}