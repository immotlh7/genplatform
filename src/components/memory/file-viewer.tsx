"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Edit, 
  Copy, 
  ExternalLink,
  Calendar,
  HardDrive
} from 'lucide-react'

interface FileContent {
  content: string
  name: string
  path: string
  size: number
  lastModified: string
  type: 'file'
}

interface FileViewerProps {
  filePath: string
  onEdit: (path: string) => void
}

export function FileViewer({ filePath, onEdit }: FileViewerProps) {
  const [fileData, setFileData] = useState<FileContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (filePath) {
      loadFileContent()
    }
  }, [filePath])

  const loadFileContent = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/openclaw/memory?path=${encodeURIComponent(filePath)}`)
      const data = await response.json()
      
      if (data.type === 'file') {
        setFileData(data)
      } else {
        setError('Selected item is not a file')
      }
    } catch (error) {
      console.error('Failed to load file:', error)
      setError('Failed to load file content')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (fileData?.content) {
      try {
        await navigator.clipboard.writeText(fileData.content)
        // TODO: Add toast notification
        console.log('Content copied to clipboard')
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }

  const downloadFile = () => {
    if (!fileData) return
    
    const blob = new Blob([fileData.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileData.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const isMarkdownFile = (filename: string) => {
    return filename.toLowerCase().endsWith('.md') || filename.toLowerCase().endsWith('.markdown')
  }

  const renderContent = () => {
    if (!fileData) return null

    const isMarkdown = isMarkdownFile(fileData.name)
    
    if (isMarkdown) {
      // Basic markdown rendering (simplified)
      const lines = fileData.content.split('\n')
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
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
    } else {
      // Plain text with line numbers
      const lines = fileData.content.split('\n')
      return (
        <div className="font-mono text-sm">
          {lines.map((line, index) => (
            <div key={index} className="flex">
              <span className="text-muted-foreground mr-4 select-none w-12 text-right">
                {index + 1}
              </span>
              <span className="flex-1">{line}</span>
            </div>
          ))}
        </div>
      )
    }
  }

  if (!filePath) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4" />
          <p>Select a file to view its contents</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading file content...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <FileText className="h-12 w-12 mx-auto mb-4" />
          <p>{error}</p>
          <Button variant="outline" onClick={loadFileContent} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!fileData) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No file data available</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* File Header */}
      <div className="border-b p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <h2 className="font-semibold">{fileData.name}</h2>
            {isMarkdownFile(fileData.name) && (
              <Badge variant="outline">Markdown</Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button size="sm" variant="outline" onClick={downloadFile}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button size="sm" onClick={() => onEdit(filePath)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
        
        {/* File Metadata */}
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <HardDrive className="h-3 w-3" />
            <span>{formatFileSize(fileData.size)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(fileData.lastModified).toLocaleString()}</span>
          </div>
          <div className="text-xs">
            {fileData.path}
          </div>
        </div>
      </div>

      {/* File Content */}
      <ScrollArea className="flex-1 p-4">
        {renderContent()}
      </ScrollArea>
    </div>
  )
}