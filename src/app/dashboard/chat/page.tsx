"use client"

import { NoChatMessagesEmptyState } from "@/components/ui/empty-states"
import { ChatSkeleton } from "@/components/ui/page-skeleton"
import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CommanderCard } from '@/components/chat/CommanderCard'
import { ProjectSelector } from '@/components/chat/ProjectSelector'
import { NewIdeaModal } from '@/components/chat/NewIdeaModal'
import { ChatNotifications, useChatNotifications } from '@/components/chat/ChatNotifications'
import { 
  MessageCircle, 
  Send, 
  Languages, 
  Bot, 
  User, 
  Settings,
  Plus,
  RefreshCw,
  Mic,
  MicOff,
  Globe,
  Lock,
  AlertCircle,
  Shield,
  Target,
  Lightbulb
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getCurrentUserClient, getUserPermissionSummary } from '@/lib/access-control'
import type { User } from '@/lib/access-control'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: string
  type?: 'message' | 'command' | 'commander'
  projectId?: string
  metadata?: {
    language?: string
    isArabic?: boolean
    originalText?: string
    translatedText?: string
    projectId?: string
    confidence?: number
    userId?: string
    userRole?: string
  }
}

interface CommanderResponse {
  success: boolean
  command: string
  translation: string
  confidence: number
  suggestions?: string[]
  actions?: Array<{
    type: 'send-to-project' | 'create-task' | 'edit-command'
    label: string
    data?: any
  }>
}

interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  tasksCount: number
  completedTasks: number
  lastActivity: string
  isStarred?: boolean
  color?: string
}

// Arabic detection regex - covers Arabic and Arabic-Indic script ranges
const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

export default function ChatPage() {
  const { toast } = useToast()
  const {
    notifications,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showCommanderSuccess,
    showTaskCreated,
    showIdeaSaved,
    showSystemUpdate
  } = useChatNotifications()
  
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userPermissions, setUserPermissions] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isArabicDetected, setIsArabicDetected] = useState(false)
  const [arabicConfidence, setArabicConfidence] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showNewIdeaModal, setShowNewIdeaModal] = useState(false)
  const [ideaContext, setIdeaContext] = useState<{
    originalText?: string
    translatedText?: string
    content?: string
  }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Authentication and authorization check
  useEffect(() => {
    checkUserAccess()
  }, [])

  // Load initial messages if user has access
  useEffect(() => {
    if (currentUser && userPermissions?.canRead) {
      loadChatHistory()
    }
  }, [currentUser, userPermissions])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time Arabic detection as user types
  useEffect(() => {
    if (inputValue.trim()) {
      const arabicMatches = inputValue.match(ARABIC_REGEX)
      const totalChars = inputValue.length
      const arabicChars = arabicMatches ? arabicMatches.join('').length : 0
      const confidence = totalChars > 0 ? arabicChars / totalChars : 0
      
      setIsArabicDetected(confidence > 0.1) // 10% threshold for Arabic detection
      setArabicConfidence(confidence)
    } else {
      setIsArabicDetected(false)
      setArabicConfidence(0)
    }
  }, [inputValue])

  const checkUserAccess = async () => {
    setAuthLoading(true)
    try {
      let user = await getCurrentUserClient().catch(() => null)
      if (!user) {
        user = { id: '1', name: 'Med', email: 'owner@genplatform.ai', role: 'OWNER' as any, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      }
      setCurrentUser(user)

      if (user) {
        const permissions = getUserPermissionSummary(user)
        const isOwner = user.role === 'OWNER'
        setUserPermissions({
          canRead: true, // All authenticated users can read chat
          canWrite: true, // All authenticated users can send messages
          canModerate: isOwner || permissions.isAdmin,
          canUseCommander: isOwner || permissions.isManager || permissions.isAdmin,
          canCreateIdeas: true
        })
        
        // Show welcome notification for new users
        if (permissions.isManager || permissions.isAdmin) {
          showSystemUpdate(`Welcome to chat, ${user.displayName}! Commander is ${permissions.isManager || permissions.isAdmin ? 'enabled' : 'disabled'}.`)
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking user access:', error);
      }
      toast({
        title: "Authentication Error",
        description: "Failed to verify access permissions.",
        variant: "destructive",
      })
      showError("Authentication Failed", "Unable to verify your permissions. Please refresh and try again.")
    } finally {
      setAuthLoading(false)
    }
  }

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.messages) {
          setMessages(data.messages)
          showSystemUpdate(`Loaded ${data.messages.length} previous messages`)
        }
      } else if (response.status === 403) {
        showError("Access Denied", "You don't have permission to view chat history.")
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load chat history:', error);
      }
      showWarning("Chat History", "Could not load previous messages, but you can still chat.")
    }
  }

  const detectArabic = (text: string): boolean => {
    return ARABIC_REGEX.test(text)
  }

  const calculateArabicRatio = (text: string): number => {
    if (!text.trim()) return 0
    const arabicMatches = text.match(ARABIC_REGEX)
    const arabicChars = arabicMatches ? arabicMatches.join('').length : 0
    return arabicChars / text.length
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || !userPermissions?.canWrite) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date().toISOString(),
      type: isArabicDetected ? 'commander' : 'message',
      projectId: selectedProject?.id || undefined,
      metadata: {
        language: isArabicDetected ? 'ar' : 'en',
        isArabic: isArabicDetected,
        confidence: arabicConfidence,
        userId: currentUser?.id,
        userRole: currentUser?.role,
        projectId: selectedProject?.id
      }
    }

    setMessages(prev => [...prev, newMessage])
    const originalInputValue = inputValue
    setInputValue('')
    setIsLoading(true)

    try {
      const endpoint = isArabicDetected && userPermissions?.canUseCommander 
        ? '/api/chat/commander'
        : '/api/chat/send'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': currentUser?.role || '',
          'X-User-ID': currentUser?.id || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          message: newMessage,
          context: {
            sessionId: `chat-${currentUser?.id}-${Date.now()}`,
            previousMessages: messages.slice(-5),
            projectId: selectedProject?.id,
            userPermissions
          }
        })
      })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You don\'t have permission to send messages')
        }
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message])
        showSuccess("Message Sent", "Your message was processed successfully.")
      }

      // Handle Commander-specific response
      if (data.commanderResponse && isArabicDetected) {
        const commanderMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.commanderResponse.translation,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          type: 'commander',
          metadata: {
            originalText: newMessage.content,
            translatedText: data.commanderResponse.translation,
            confidence: data.commanderResponse.confidence,
            language: 'en'
          }
        }
        setMessages(prev => [...prev, commanderMessage])
        
        // Show Commander success notification
        showCommanderSuccess(
          originalInputValue,
          data.commanderResponse.translation,
          selectedProject?.id
        )
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send message:', error);
      }
      const errorMessage = error instanceof Error ? error.message : "Failed to send message. Please try again."
      
      showError("Message Failed", errorMessage)

      // Add error message to chat
      const errorChatMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, I couldn't process your message. Please check your permissions and try again.",
        role: 'assistant',
        timestamp: new Date().toISOString(),
        type: 'message'
      }
      setMessages(prev => [...prev, errorChatMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleCommanderAction = (action: any) => {
    if (!userPermissions?.canUseCommander) {
      showError("Access Denied", "You don't have permission to use Commander actions.")
      return
    }

    showSuccess("Action Triggered", `Executing: ${action.label}`)
    // Handle different action types here
  }

  const handleEditCommand = (text: string) => {
    if (!userPermissions?.canWrite) {
      showError("Access Denied", "You don't have permission to edit commands.")
      return
    }

    setInputValue(text)
    inputRef.current?.focus()
    showSystemUpdate("Command loaded into input field for editing.")
  }

  const handleSendToProject = (text: string) => {
    if (!userPermissions?.canUseCommander) {
      showError("Access Denied", "You don't have permission to send commands to projects.")
      return
    }

    if (!selectedProject) {
      showWarning("No Project Selected", "Please select a project first to send commands.")
      return
    }

    // Mock task creation
    const taskId = `task-${Date.now()}`
    showTaskCreated(
      text.length > 50 ? text.substring(0, 47) + '...' : text,
      selectedProject.name,
      taskId
    )
  }

  const handleCreateIdeaFromMessage = (message: Message) => {
    if (!userPermissions?.canCreateIdeas) {
      showError("Access Denied", "You don't have permission to create ideas.")
      return
    }

    setIdeaContext({
      originalText: message.metadata?.isArabic ? message.content : undefined,
      translatedText: message.metadata?.translatedText || (!message.metadata?.isArabic ? message.content : undefined),
      content: message.content
    })
    setShowNewIdeaModal(true)
  }

  const handleQuickCreateIdea = () => {
    if (!userPermissions?.canCreateIdeas) {
      showError("Access Denied", "You don't have permission to create ideas.")
      return
    }

    setIdeaContext({
      content: inputValue.trim()
    })
    setShowNewIdeaModal(true)
  }

  const handleIdeaSuccess = (idea: any) => {
    showIdeaSaved(idea.title, idea.id)
    
    // Optionally clear input if it was used for the idea
    if (inputValue.trim() === idea.content) {
      setInputValue('')
    }
  }

  const startVoiceInput = () => {
    if (!userPermissions?.canWrite) {
      showError("Access Denied", "You don't have permission to use voice input.")
      return
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.lang = isArabicDetected ? 'ar-SA' : 'en-US'
      recognition.continuous = false
      recognition.interimResults = false
      
      recognition.onstart = () => {
        setIsListening(true)
        showSystemUpdate("Voice input started. Speak now...")
      }
      recognition.onend = () => {
        setIsListening(false)
        showSystemUpdate("Voice input stopped.")
      }
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue(prev => prev + transcript)
        showSuccess("Voice Input", `Captured: "${transcript}"`)
      }
      recognition.onerror = () => {
        setIsListening(false)
        showError("Voice Input Failed", "Could not capture audio. Please try again.")
      }
      
      recognition.start()
    } else {
      showError("Not Supported", "Your browser doesn't support voice input.")
    }
  }

  const getLanguageIndicator = () => {
    if (!inputValue.trim()) return null
    
    if (isArabicDetected) {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          <Languages className="h-3 w-3 mr-1" />
          Arabic {Math.round(arabicConfidence * 100)}%
        </Badge>
      )
    }
    
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Globe className="h-3 w-3 mr-1" />
        English
      </Badge>
    )
  }

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="flex flex-col h-screen p-4 md:p-6">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse space-y-4 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>Checking access permissions...</div>
          </div>
        </div>
      </div>
    )
  }

  // Show access denied state
  if (!currentUser || !userPermissions?.canRead) {
    return (
      <div className="flex flex-col h-screen p-4 md:p-6">
        <div className="flex items-center justify-center h-full">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <Shield className="h-5 w-5" />
                <span>Access Denied</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium">Chat access requires MANAGER level permissions or higher.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {!currentUser 
                      ? "Please sign in to access the chat system."
                      : `Your current role (${currentUser.role}) doesn't have chat access. Contact your administrator to request permissions.`
                    }
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-900 text-sm mb-2">What you can do:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Visit the Dashboard to see available projects</li>
                  <li>• Access Ideas Lab to submit suggestions</li>
                  <li>• Contact your administrator for chat access</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard'}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/ideas'}>
                  Ideas Lab
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen p-4 md:p-6">
      {/* Inline Notifications */}
      <div className="mb-4">
        <ChatNotifications
          notifications={notifications}
          onDismiss={removeNotification}
          position="top"
          maxVisible={3}
        />
      </div>

      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold">AI Chat</h1>
              <p className="text-muted-foreground">
                Communicate with your AI assistant{userPermissions?.canUseCommander ? ', with Arabic command support' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={userPermissions?.canWrite ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}>
              {userPermissions?.canWrite ? 'Read/Write' : 'Read Only'}
            </Badge>
            {userPermissions?.canUseCommander && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                Commander Enabled
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Project Context Selector */}
      {userPermissions?.canWrite && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Project Context</span>
            <span className="text-xs text-muted-foreground">(Optional - for project-specific commands)</span>
          </div>
          <ProjectSelector
            selectedProject={selectedProject}
            onProjectChange={(project) => {
              setSelectedProject(project)
              if (project) {
                showSystemUpdate(`Project context set to: ${project.name}`)
              } else {
                showSystemUpdate("Project context cleared")
              }
            }}
            variant="compact"
            className="max-w-64"
          />
        </div>
      )}

      {/* Permission indicator */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Chat Permissions:</span>
            <Badge variant="outline" className={userPermissions?.canWrite ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}>
              {userPermissions?.canWrite ? 'Read/Write' : 'Read Only'}
            </Badge>
            {userPermissions?.canUseCommander && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                Commander Enabled
              </Badge>
            )}
          </div>
          {selectedProject && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Context:</span>
              <Badge variant="outline" className="text-xs">
                {selectedProject.name}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="flex-none">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Conversation</span>
              {isArabicDetected && userPermissions?.canUseCommander && (
                <Badge className="bg-orange-500 text-white">
                  <Languages className="h-3 w-3 mr-1" />
                  Commander Mode
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {currentUser.displayName}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col min-h-0 p-4">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  {userPermissions?.canUseCommander 
                    ? "Type in English or Arabic. Arabic commands will be automatically translated using Commander."
                    : "Type your messages in English."
                  }
                </p>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Languages className="h-4 w-4" />
                  <span>
                    Supports: English{userPermissions?.canUseCommander ? ', Arabic (العربية)' : ''}
                  </span>
                </div>
                {selectedProject && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
                    <Target className="h-4 w-4" />
                    <span>Context: {selectedProject.name}</span>
                  </div>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%] space-y-2">
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        {message.role === 'user' ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                        <span>{message.role === 'user' ? 'You' : 'Assistant'}</span>
                        <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                        {message.metadata?.language && (
                          <Badge variant="outline" className="text-xs">
                            {message.metadata.language.toUpperCase()}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {message.metadata?.userRole || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="relative group">
                        <div className={`p-3 rounded-lg ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white ml-auto' 
                            : 'bg-muted'
                        }`}>
                          <p className={message.metadata?.isArabic ? 'text-right' : 'text-left'} 
                             dir={message.metadata?.isArabic ? 'rtl' : 'ltr'}>
                            {message.content}
                          </p>
                        </div>
                        
                        {/* Message Actions */}
                        {message.role === 'user' && userPermissions?.canCreateIdeas && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCreateIdeaFromMessage(message)}
                              className="h-6 px-2 bg-black/10 hover:bg-black/20 text-white"
                            >
                              <Lightbulb className="h-3 w-3 mr-1" />
                              <span className="text-xs">Idea</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Commander Card for Arabic messages */}
                  {message.type === 'commander' && message.metadata?.isArabic && userPermissions?.canUseCommander && (
                    <CommanderCard
                      originalText={message.content}
                      translatedText={message.metadata.translatedText || message.content}
                      confidence={message.metadata.confidence || 0.5}
                      suggestions={[
                        'Consider adding more context',
                        'Specify target project if applicable',
                        'Add priority level if needed'
                      ]}
                      actions={[
                        { type: 'send-to-project', label: 'Send to Project' },
                        { type: 'create-task', label: 'Create Task' },
                        { type: 'edit-command', label: 'Edit Command' }
                      ]}
                      onAction={handleCommanderAction}
                      onEdit={handleEditCommand}
                      onSendToProject={handleSendToProject}
                    />
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Only show if user has write permission */}
          {userPermissions?.canWrite ? (
            <div className="space-y-3 border-t pt-4">
              {/* Language Detection Indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getLanguageIndicator()}
                  {isArabicDetected && userPermissions?.canUseCommander && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Bot className="h-3 w-3 mr-1" />
                      Commander Ready
                    </Badge>
                  )}
                  {isArabicDetected && !userPermissions?.canUseCommander && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Commander Disabled
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {isLoading && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}
                  
                  {/* Quick Create Idea */}
                  {inputValue.trim() && userPermissions?.canCreateIdeas && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleQuickCreateIdea}
                      className="flex items-center space-x-1"
                    >
                      <Lightbulb className="h-3 w-3" />
                      <span>Save as Idea</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Input Row */}
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      isArabicDetected && userPermissions?.canUseCommander 
                        ? "اكتب أمرك بالعربية..." 
                        : selectedProject
                        ? `Type your message (Context: ${selectedProject.name})...`
                        : "Type your message..."
                    }
                    className={`pr-12 ${isArabicDetected ? 'text-right' : 'text-left'}`}
                    dir={isArabicDetected ? 'rtl' : 'ltr'}
                    disabled={isLoading}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={startVoiceInput}
                    disabled={isLoading}
                  >
                    {isListening ? (
                      <MicOff className="h-3 w-3" />
                    ) : (
                      <Mic className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <Button 
                  onClick={sendMessage} 
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Context Info */}
              {selectedProject && (
                <div className="text-xs text-muted-foreground flex items-center space-x-2">
                  <Target className="h-3 w-3" />
                  <span>Commands will be sent to: <strong>{selectedProject.name}</strong></span>
                </div>
              )}
            </div>
          ) : (
            <div className="border-t pt-4 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Read-only access. You cannot send messages.</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Idea Modal */}
      <NewIdeaModal
        isOpen={showNewIdeaModal}
        onClose={() => {
          setShowNewIdeaModal(false)
          setIdeaContext({})
        }}
        initialContent={ideaContext.content}
        originalText={ideaContext.originalText}
        translatedText={ideaContext.translatedText}
        selectedProject={selectedProject}
        onSuccess={handleIdeaSuccess}
      />
    </div>
  )
}