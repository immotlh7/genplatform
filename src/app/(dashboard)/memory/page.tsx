"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Folder, 
  FileText, 
  Search, 
  Download, 
  Edit, 
  Trash2,
  Plus,
  Home,
  ChevronRight
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

export default function MemoryPage() {
  const [files, setFiles] = useState<MemoryFile[]>([])
  const [stats, setStats] = useState<MemoryStats>({ totalFiles: 0, totalDirs: 0, totalSize: 0 })
  const [currentPath, setCurrentPath] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<MemoryFile | null>(null)

  useEffect(() => {
    loadMemoryFiles(currentPath)
  }, [currentPath])

  const loadMemoryFiles = async (path: string) => {
    setLoading(true)
    try {
      const url = `/api/openclaw/memory?path=${encodeURIComponent(path)}&search=${encodeURIComponent(searchTerm)}`
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

  const navigateTo = (path: string) => {
    setCurrentPath(path)
    setSearchTerm('')
  }

  const handleFileClick = (file: MemoryFile) => {
    if (file.type === 'directory') {
      navigateTo(file.path)
    } else {
      setSelectedFile(file)
      // In production would open file viewer/editor
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Memory Browser</h1>
          <p className="text-muted-foreground">
            Browse and manage memory files ({stats.totalFiles} files, {formatFileSize(stats.totalSize)})
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New File
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.totalFiles}</div>
                <div className="text-sm text-muted-foreground">Files</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Folder className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{stats.totalDirs}</div>
                <div className="text-sm text-muted-foreground">Directories</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-green-600"></div>
              <div>
                <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
                <div className="text-sm text-muted-foreground">Total Size</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex items-center space-x-2 p-4 bg-muted/30 rounded-lg">
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search memory files..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              loadMemoryFiles(currentPath)
            }
          }}
        />
      </div>

      {/* File List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Files & Folders</span>
            {currentPath && (
              <Button variant="outline" size="sm" onClick={goUp}>
                Back
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">
                Loading files...
              </div>
            ) : files.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No files found
              </div>
            ) : (
              <div className="space-y-1">
                {files.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer border-b"
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {file.type === 'directory' ? (
                        <Folder className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate">{file.name}</span>
                          {file.isMarkdown && (
                            <Badge variant="outline" className="text-xs">MD</Badge>
                          )}
                        </div>
                        {file.preview && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {file.preview}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                      <div className="flex space-x-1">
                        {file.type === 'file' && (
                          <>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}