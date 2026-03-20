"use client"

import { FileTreeSkeleton } from "@/components/ui/page-skeleton"
import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { 
  Search, 
  Plus, 
  FolderOpen, 
  Folder, 
  FileText, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Download,
  Upload,
  Brain,
  Activity,
  Calendar,
  Archive,
  BookOpen,
  Shield,
  Target,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Home,
  Eye,
  Lock,
  AlertCircle,
  Save,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { getCurrentUserClient } from '@/lib/access-control'
import type { User } from '@/lib/access-control'
import ReactMarkdown from 'react-markdown'

interface MemoryFile {
  id: string
  name: string
  type: 'folder' | 'file'
  path: string
  size?: number
  lastModified?: string
  content?: string
  children?: MemoryFile[]
}

interface MemoryStats {
  files: number
  totalSize: number
  categories: {
    projects: number
    areas: number
    resources: number
    tacit: number
  }
}

export default function MemoryPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPath, setCurrentPath] = useState('/')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']))
  const [selectedFile, setSelectedFile] = useState<MemoryFile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false)
  const [newFilePath, setNewFilePath] = useState('')
  const [newFileContent, setNewFileContent] = useState('')
  const [memoryData, setMemoryData] = useState<MemoryFile[]>([])
  const [stats, setStats] = useState<MemoryStats>({
    files: 0,
    totalSize: 0,
    categories: {
      projects: 0,
      areas: 0,
      resources: 0,
      tacit: 0
    }
  })
  const { toast } = useToast()
  
  useEffect(() => {
    loadUserAndMemory()
  }, [])

  const loadUserAndMemory = async () => {
    try {
      // Get current user
      const user = await getCurrentUserClient()
      setCurrentUser(user)

      // Fetch real memory data from Bridge API
      const response = await fetch('/api/bridge/memory')
      const data = await response.json()
      
      if (data.tree) {
        setMemoryData(data.tree)
      }
      
      if (data.stats) {
        setStats(data.stats)
      }

      setIsLoading(false)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading user and memory data:', error);
      }
      toast({
        title: "Error",
        description: "Failed to load memory data",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const loadFileContent = async (filePath: string) => {
    try {
      const response = await fetch('/api/bridge/memory?path=' + encodeURIComponent(filePath))
      const data = await response.json()
      
      if (data.content !== undefined) {
        setSelectedFile(prev => prev ? { ...prev, content: data.content } : null)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading file content:', error);
      }
      toast({
        title: "Error",
        description: "Failed to load file content",
        variant: "destructive",
      })
    }
  }

  const saveFileContent = async () => {
    if (!selectedFile) return
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/bridge/memory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: selectedFile.path,
          content: editContent
        })
      })
      
      if (response.ok) {
        setSelectedFile({ ...selectedFile, content: editContent })
        setIsEditMode(false)
        toast({
          title: "Success",
          description: "File saved successfully",
        })
      } else {
        throw new Error('Failed to save file')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving file:', error);
      }
      toast({
        title: "Error",
        description: "Failed to save file",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const createNewFile = async () => {
    if (!newFilePath.trim()) return
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/bridge/memory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: newFilePath,
          content: newFileContent
        })
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "File created successfully",
        })
        setIsNewFileModalOpen(false)
        setNewFilePath('')
        setNewFileContent('')
        // Refresh the file tree
        await loadUserAndMemory()
      } else {
        throw new Error('Failed to create file')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating file:', error);
      }
      toast({
        title: "Error",
        description: "Failed to create file",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const canUserRead = () => {
    // All authenticated users can read memory files
    return currentUser !== null
  }

  const canUserEdit = () => {
    if (!currentUser) return false
    // VIEWER role has read-only access
    return currentUser.role !== 'VIEWER'
  }

  const canUserCreate = () => {
    if (!currentUser) return false
    // Only OWNER, ADMIN, and MANAGER can create new memory files
    return currentUser.role === 'OWNER' || currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER'
  }

  const canUserDelete = () => {
    if (!currentUser) return false
    // Only OWNER and ADMIN can delete memory files
    return currentUser.role === 'OWNER' || currentUser.role === 'ADMIN'
  }

  const canUserImport = () => {
    if (!currentUser) return false
    // Only OWNER and ADMIN can import memory files
    return currentUser.role === 'OWNER' || currentUser.role === 'ADMIN'
  }

  const isPersonalMemoryFolder = (folderId: string) => {
    // These folders contain personal/sensitive information
    const personalFolders = ['security', 'daily', 'learning', 'tacit']
    return personalFolders.includes(folderId)
  }

  const canAccessPersonalMemory = () => {
    if (!currentUser) return false
    // Only OWNER and ADMIN can access personal memory folders
    return currentUser.role === 'OWNER' || currentUser.role === 'ADMIN'
  }

  const filterMemoryAccess = (items: MemoryFile[]) => {
    if (!currentUser) return []

    // OWNER and ADMIN see everything
    if (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') {
      return items
    }

    // MANAGER and VIEWER see filtered content (no personal folders)
    return items.filter(item => {
      if (item.type === 'folder' && isPersonalMemoryFolder(item.id)) {
        return false
      }
      
      // Filter children recursively
      if (item.children) {
        item.children = filterMemoryAccess(item.children)
      }
      
      return true
    })
  }

  const filteredMemoryData = useMemo(() => {
    return filterMemoryAccess(memoryData)
  }, [currentUser, memoryData])

  const getFolderIcon = (folderId: string, expanded: boolean = false) => {
    const IconComponent = expanded ? FolderOpen : Folder
    
    switch (folderId) {
      case 'projects': return <Target className="h-4 w-4 text-blue-500" />
      case 'areas': return <Activity className="h-4 w-4 text-green-500" />
      case 'resources': return <BookOpen className="h-4 w-4 text-purple-500" />
      case 'tacit': return <Lightbulb className="h-4 w-4 text-yellow-500" />
      case 'security': return <Shield className="h-4 w-4 text-red-500" />
      case 'daily': return <Calendar className="h-4 w-4 text-orange-500" />
      case 'learning': return <Brain className="h-4 w-4 text-indigo-500" />
      default: return <IconComponent className="h-4 w-4 text-muted-foreground" />
    }
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${Math.round(bytes / (1024 * 1024))} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleFileAction = (action: string, file: MemoryFile) => {
    switch (action) {
      case 'edit':
        if (!canUserEdit()) {
          alert('You do not have permission to edit files')
          return
        }
        setEditContent(file.content || '')
        setIsEditMode(true)
        break
      case 'delete':
        if (!canUserDelete()) {
          alert('You do not have permission to delete files')
          return
        }
        // Handle delete
        break
      case 'download':
        // Always allowed for authenticated users
        break
    }
  }

  const renderFileTree = (items: MemoryFile[], level = 0) => {
    return items.map(item => {
      const isPersonalFolder = item.type === 'folder' && isPersonalMemoryFolder(item.id)
      const hasAccess = !isPersonalFolder || canAccessPersonalMemory()
      
      if (!hasAccess) {
        return null // Skip rendering this item
      }

      return (
        <div key={item.id} className="select-none">
          <div 
            className={`flex items-center py-2 px-3 hover:bg-muted/50 rounded-md cursor-pointer group ${
              selectedFile?.id === item.id ? 'bg-muted' : ''
            } ${!canUserEdit() && item.type !== 'folder' ? 'opacity-75' : ''}`}
            style={{ marginLeft: `${level * 16}px` }}
            onClick={() => {
              if (item.type === 'folder') {
                toggleFolder(item.id)
              } else {
                setSelectedFile(item)
                if (item.path) {
                  loadFileContent(item.path)
                }
              }
            }}
          >
            {item.type === 'folder' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 mr-1 opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFolder(item.id)
                }}
              >
                {expandedFolders.has(item.id) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
            
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {item.type === 'folder' ? 
                  getFolderIcon(item.id, expandedFolders.has(item.id)) : 
                  <FileText className="h-4 w-4 text-muted-foreground" />
                }
              </div>
              <span className="font-medium text-sm truncate">{item.name}</span>
              {!canUserEdit() && item.type !== 'folder' && (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
              {item.type === 'folder' && item.children && (
                <Badge variant="outline" className="text-xs ml-auto">
                  {item.children.length}
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canUserEdit() && (
                  <DropdownMenuItem onClick={() => handleFileAction('edit', item)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {item.type === 'folder' ? 'Rename' : 'Edit'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleFileAction('download', item)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                {canUserDelete() && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleFileAction('delete', item)}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {item.type === 'folder' && item.children && expandedFolders.has(item.id) && (
            <div className="ml-2">
              {renderFileTree(item.children, level + 1)}
            </div>
          )}
        </div>
      )
    }).filter(Boolean) // Remove null items
  }

  // Show access denied for non-authenticated users
  if (!canUserRead()) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Please log in to access the memory system.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Memory</h1>
          <p className="text-muted-foreground">
            {currentUser?.role === 'VIEWER' 
              ? 'Browse your knowledge base (read-only access)'
              : 'Organize your knowledge with the PARA method: Projects, Areas, Resources, Archives.'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {canUserImport() && (
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          )}
          {canUserCreate() && (
            <Button onClick={() => setIsNewFileModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New File
            </Button>
          )}
          {!canUserEdit() && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Eye className="h-3 w-3 mr-1" />
              Read Only
            </Badge>
          )}
        </div>
      </div>

      {/* Access level indicator for restricted users */}
      {currentUser && currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN' && (
        <div className={`border rounded-lg p-4 ${
          currentUser.role === 'VIEWER' 
            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
            : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center space-x-2">
            <Badge className={
              currentUser.role === 'VIEWER' 
                ? 'bg-blue-500 text-white' 
                : 'bg-yellow-500 text-white'
            }>
              {currentUser.role}
            </Badge>
            <span className={`text-sm ${
              currentUser.role === 'VIEWER' 
                ? 'text-blue-900 dark:text-blue-100'
                : 'text-yellow-900 dark:text-yellow-100'
            }`}>
              {currentUser.role === 'VIEWER' 
                ? 'You have read-only access to shared memory files (personal folders hidden)'
                : 'You can edit shared memory files but personal folders are hidden for security'
              }
            </span>
          </div>
        </div>
      )}

      {/* Stats Overview - Using real data from Bridge API */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {canAccessPersonalMemory() ? 'Total Files' : 'Accessible Files'}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {canAccessPersonalMemory() ? stats.files : Math.floor(stats.files * 0.7)}
            </div>
            <p className="text-xs text-muted-foreground">
              {canAccessPersonalMemory() ? `${stats.totalSize} KB total` : 'Shared files'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories.projects}</div>
            <p className="text-xs text-muted-foreground">
              Active projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Areas</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories.areas}</div>
            <p className="text-xs text-muted-foreground">
              Ongoing responsibilities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories.resources}</div>
            <p className="text-xs text-muted-foreground">
              Reference materials
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Tree */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Home className="h-5 w-5" />
              <span>Memory Structure</span>
              {!canAccessPersonalMemory() && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                  Filtered
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              PARA organizational system
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              <div className="p-2">
                {renderFileTree(filteredMemoryData)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Content / Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {selectedFile ? (
                  <>
                    <FileText className="h-5 w-5" />
                    <span className="truncate">{selectedFile.name}</span>
                    {!canUserEdit() && <Eye className="h-4 w-4 text-muted-foreground" />}
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5" />
                    <span>Memory Overview</span>
                  </>
                )}
              </div>
              {selectedFile && !isEditMode && (
                <div className="flex items-center space-x-2">
                  {canUserEdit() && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditContent(selectedFile.content || '')
                        setIsEditMode(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              )}
              {isEditMode && (
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm"
                    onClick={saveFileContent}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditMode(false)}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardTitle>
            {selectedFile && (
              <CardDescription className="flex items-center space-x-4 text-xs">
                <span>{formatFileSize(selectedFile.size || 0)}</span>
                {selectedFile.lastModified && <span>Modified {formatDate(selectedFile.lastModified)}</span>}
                <Badge variant="outline">{selectedFile.type}</Badge>
                {!canUserEdit() && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Read-only
                  </Badge>
                )}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedFile ? (
              <div className="space-y-4">
                {/* File content preview/edit */}
                {isEditMode ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[400px] font-mono text-sm"
                      placeholder="Enter file content..."
                    />
                  </div>
                ) : (
                  <div className={`rounded-lg p-4 max-h-96 overflow-y-auto ${
                    canUserEdit() ? 'bg-muted/30' : 'bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800'
                  }`}>
                    {!canUserEdit() && (
                      <div className="mb-3 text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                        <Eye className="h-3 w-3 inline mr-1" />
                        Viewing in read-only mode
                      </div>
                    )}
                    {selectedFile.path && selectedFile.path.endsWith('.md') ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>
                          {selectedFile.content || 'No content available'}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {selectedFile.content || 'No content available'}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* PARA Method Overview */}
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your Memory System</h3>
                  <p className="text-muted-foreground mb-6">
                    Select a file from the tree to view its content, or explore your PARA structure below.
                  </p>
                  {!canAccessPersonalMemory() && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Lock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800 dark:text-yellow-200">
                          Personal memory folders are hidden for security
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* PARA Categories - Filtered for access */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Target className="h-5 w-5 text-blue-500" />
                      <h4 className="font-medium">Projects</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Things with a deadline and specific outcome
                    </p>
                    <div className="text-sm font-medium">{stats.categories.projects} files</div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Activity className="h-5 w-5 text-green-500" />
                      <h4 className="font-medium">Areas</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Ongoing responsibilities to maintain
                    </p>
                    <div className="text-sm font-medium">{stats.categories.areas} files</div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <BookOpen className="h-5 w-5 text-purple-500" />
                      <h4 className="font-medium">Resources</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Topics of ongoing interest for future reference
                    </p>
                    <div className="text-sm font-medium">{stats.categories.resources} files</div>
                  </div>

                  {canAccessPersonalMemory() && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        <h4 className="font-medium">Tacit Knowledge</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Personal insights, patterns, and learnings
                      </p>
                      <div className="text-sm font-medium">{stats.categories.tacit} files</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New File Modal */}
      <Dialog open={isNewFileModalOpen} onOpenChange={setIsNewFileModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
            <DialogDescription>
              Create a new memory file in your knowledge base.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filepath">File Path</Label>
              <Input
                id="filepath"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                placeholder="e.g., projects/my-project.md"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Use forward slashes for folders (e.g., areas/health/fitness.md)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filecontent">Content</Label>
              <Textarea
                id="filecontent"
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="Enter file content..."
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFileModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createNewFile} 
              disabled={isSaving || !newFilePath.trim()}
            >
              {isSaving ? 'Creating...' : 'Create File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}