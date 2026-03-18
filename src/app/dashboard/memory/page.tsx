"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileTree } from '@/components/memory/file-tree'
import { FileViewer } from '@/components/memory/file-viewer'
import { FileEditor } from '@/components/memory/file-editor'
import { 
  Folder, 
  FileText, 
  Search, 
  Download, 
  Edit, 
  Trash2,
  Plus,
  Home,
  ChevronRight,
  RefreshCw,
  FolderPlus,
  Upload
} from 'lucide-react'

interface MemoryFile {
  name: string
  path: string
  size: number
  lastModified: string
  type: 'file' | 'directory'
  isMarkdown: boolean
  preview?: string
}

interface MemoryStats {
  totalFiles: number
  totalDirs: number
  totalSize: number
}

interface SearchResult {
  path: string
  name: string
  matches: any[]
  score: number
  size: number
  lastModified: string
}

export default function MemoryPage() {
  const [files, setFiles] = useState<MemoryFile[]>([])
  const [stats, setStats] = useState<MemoryStats>({ totalFiles: 0, totalDirs: 0, totalSize: 0 })
  const [currentPath, setCurrentPath] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [mode, setMode] = useState<'browse' | 'view' | 'edit' | 'search'>('browse')

  useEffect(() => {
    loadMemoryFiles(currentPath)
  }, [currentPath])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      performSearch()
    } else {
      setSearchResults([])
      if (mode === 'search') setMode('browse')
    }
  }, [searchTerm])

  const loadMemoryFiles = async (path: string) => {
    setLoading(true)
    try {
      const url = `/api/openclaw/memory?path=${encodeURIComponent(path)}&search=${encodeURIComponent('')}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.type === 'directory') {
        setFiles(data.files || [])
        setStats(data.stats || { totalFiles: 0, totalDirs: 0, totalSize: 0 })
      }
    } catch (error) {
      console.error('Failed to load memory files:', error)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async () => {
    if (!searchTerm || searchTerm.length < 2) return

    setSearching(true)
    try {
      const response = await fetch(`/api/openclaw/memory/search?q=${encodeURIComponent(searchTerm)}&limit=50&content=true`)
      const data = await response.json()
      setSearchResults(data.results || [])
      setMode('search')
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const navigateTo = (path: string) => {
    setCurrentPath(path)
    setSearchTerm('')
    setMode('browse')
  }

  const handleFileSelect = (path: string, isDirectory: boolean) => {
    if (isDirectory) {
      navigateTo(path)
    } else {
      setSelectedFile(path)
      setMode('view')
    }
  }

  const handleEditFile = (path: string) => {
    setSelectedFile(path)
    setMode('edit')
  }

  const handleSaveFile = async (path: string, content: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/openclaw/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', path, content })
      })
      return response.ok
    } catch (error) {
      console.error('Failed to save file:', error)
      return false
    }
  }

  const handleCreateFile = async () => {
    const filename = prompt('Enter filename (include .md extension for markdown):')
    if (!filename) return

    const fullPath = currentPath ? `${currentPath}/${filename}` : filename

    try {
      const response = await fetch('/api/openclaw/memory/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          path: fullPath,
          content: '# New File\n\nStart writing your content here...',
          isDirectory: false
        })
      })

      if (response.ok) {
        await loadMemoryFiles(currentPath)
        setSelectedFile(fullPath)
        setMode('edit')
      }
    } catch (error) {
      console.error('Failed to create file:', error)
    }
  }

  const handleCreateFolder = async () => {
    const foldername = prompt('Enter folder name:')
    if (!foldername) return

    const fullPath = currentPath ? `${currentPath}/${foldername}` : foldername

    try {
      const response = await fetch('/api/openclaw/memory/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          path: fullPath,
          isDirectory: true
        })
      })

      if (response.ok) {
        await loadMemoryFiles(currentPath)
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  const goUp = () => {
    const pathParts = currentPath.split('/').filter(Boolean)
    pathParts.pop()
    navigateTo(pathParts.join('/'))
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

  const pathParts = currentPath.split('/').filter(Boolean)

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Memory Browser</h1>
            <p className="text-muted-foreground">
              Browse and manage memory files ({stats.totalFiles} files, {formatFileSize(stats.totalSize)})
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => loadMemoryFiles(currentPath)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleCreateFolder}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button onClick={handleCreateFile}>
              <Plus className="h-4 w-4 mr-2" />
              New File
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search across all memory files..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searching && <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - File Tree or Search Results */}
        <div className="w-1/3 border-r bg-muted/10">
          {mode === 'search' && searchResults.length > 0 ? (
            <div className="h-full overflow-y-auto">
              <div className="p-4">
                <h3 className="font-medium mb-3">Search Results ({searchResults.length})</h3>
                {searchResults.map((result) => (
                  <div
                    key={result.path}
                    className="p-3 border rounded-lg mb-2 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleFileSelect(result.path, false)}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">{result.name}</span>
                      <Badge variant="outline" className="text-xs">Score: {result.score}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{result.path}</div>
                    {result.matches.slice(0, 2).map((match, idx) => (
                      <div key={idx} className="text-xs bg-muted p-1 rounded mt-1">
                        Line {match.line}: {match.highlighted}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Navigation Breadcrumb */}
              {mode === 'browse' && (
                <div className="p-4 border-b bg-muted/20">
                  <div className="flex items-center space-x-2 text-sm">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigateTo('')}
                      className="p-1 h-auto"
                    >
                      <Home className="h-4 w-4" />
                    </Button>
                    {pathParts.map((part, index) => (
                      <div key={index} className="flex items-center">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigateTo(pathParts.slice(0, index + 1).join('/'))}
                          className="h-auto p-1 px-2"
                        >
                          {part}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <FileTree 
                onFileSelect={handleFileSelect}
                selectedPath={selectedFile}
              />
            </>
          )}
        </div>

        {/* Right Panel - Content */}
        <div className="flex-1 bg-background">
          {mode === 'view' && selectedFile ? (
            <FileViewer 
              filePath={selectedFile}
              onEdit={handleEditFile}
            />
          ) : mode === 'edit' && selectedFile ? (
            <FileEditor
              filePath={selectedFile}
              onClose={() => setMode('view')}
              onSave={handleSaveFile}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                {mode === 'search' && searchTerm ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4" />
                    <p>Search results will appear here</p>
                    {searching && <p className="text-sm mt-2">Searching...</p>}
                  </>
                ) : (
                  <>
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>Select a file to view its contents</p>
                    <p className="text-sm mt-2">Or create a new file to get started</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}