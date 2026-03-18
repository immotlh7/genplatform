"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Mic, 
  MicOff, 
  Menu, 
  X, 
  Languages, 
  Globe, 
  Zap, 
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Target,
  Plus,
  MoreVertical,
  Settings,
  Minimize2,
  Maximize2
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CommanderCard } from './CommanderCard'
import { QuickCommands } from './QuickCommands'
import { ProjectSelector } from './ProjectSelector'
import { ChatNotifications, useChatNotifications } from './ChatNotifications'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: string
  type?: 'message' | 'command' | 'commander'
  metadata?: {
    language?: string
    isArabic?: boolean
    originalText?: string
    translatedText?: string
    confidence?: number
  }
}

interface MobileChatLayoutProps {
  messages: Message[]
  inputValue: string
  onInputChange: (value: string) => void
  onSendMessage: () => void
  isLoading?: boolean
  selectedProject?: any
  onProjectChange?: (project: any) => void
  isArabicDetected?: boolean
  arabicConfidence?: number
  className?: string
}

export function MobileChatLayout({
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading = false,
  selectedProject,
  onProjectChange,
  isArabicDetected = false,
  arabicConfidence = 0,
  className = ""
}: MobileChatLayoutProps) {
  const [isListening, setIsListening] = useState(false)
  const [showQuickCommands, setShowQuickCommands] = useState(false)
  const [showProjectSelector, setShowProjectSelector] = useState(false)
  const [isCompactMode, setIsCompactMode] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const {
    notifications,
    removeNotification,
    showSuccess,
    showCommanderSuccess
  } = useChatNotifications()

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle virtual keyboard on mobile
  useEffect(() => {
    const handleResize = () => {
      const visualViewport = window.visualViewport
      if (visualViewport) {
        const keyboardHeight = window.innerHeight - visualViewport.height
        setKeyboardHeight(keyboardHeight)
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      return () => window.visualViewport?.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage()
      
      // Show notification for Arabic commands
      if (isArabicDetected) {
        showCommanderSuccess(
          inputValue,
          "Command translated successfully",
          selectedProject?.id
        )
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.lang = isArabicDetected ? 'ar-SA' : 'en-US'
      recognition.continuous = false
      recognition.interimResults = false
      
      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        onInputChange(inputValue + transcript)
      }
      
      recognition.start()
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'now'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  const getLanguageIndicator = () => {
    if (!inputValue.trim()) return null
    
    if (isArabicDetected) {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
          <Languages className="h-2 w-2 mr-1" />
          AR {Math.round(arabicConfidence * 100)}%
        </Badge>
      )
    }
    
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
        <Globe className="h-2 w-2 mr-1" />
        EN
      </Badge>
    )
  }

  return (
    <div className={`flex flex-col h-screen bg-background ${className}`}>
      {/* Mobile Header */}
      <div className="flex-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <div>
                <h1 className="font-semibold text-sm">Commander Chat</h1>
                <p className="text-xs text-muted-foreground">
                  AI + Arabic Translation
                </p>
              </div>
            </div>
            {isArabicDetected && (
              <Badge className="bg-orange-500 text-white text-xs">
                <Languages className="h-2 w-2 mr-1" />
                AR
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Project Context Indicator */}
            {selectedProject && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowProjectSelector(true)}
                className="h-7 px-2 text-xs"
              >
                <Target className="h-3 w-3 mr-1" />
                {selectedProject.name.slice(0, 8)}
                {selectedProject.name.length > 8 && '...'}
              </Button>
            )}

            {/* More Options */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Chat Settings</SheetTitle>
                  <SheetDescription>
                    Configure your mobile chat experience
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Compact Mode</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCompactMode(!isCompactMode)}
                    >
                      {isCompactMode ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Language Detection</h4>
                    <div className="text-xs text-muted-foreground">
                      Current: {isArabicDetected ? 'Arabic' : 'English'}
                      {isArabicDetected && ` (${Math.round(arabicConfidence * 100)}% confidence)`}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Project Context Bar */}
        {selectedProject && !isCompactMode && (
          <div className="px-3 pb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
              <div className="flex items-center space-x-2">
                <Target className="h-3 w-3 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {selectedProject.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {selectedProject.status}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="flex-none p-3">
          <ChatNotifications
            notifications={notifications}
            onDismiss={removeNotification}
            maxVisible={2}
            className="space-y-2"
          />
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-3 pb-2"
        style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : undefined }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Bot className="h-12 w-12 text-blue-600 mb-4 opacity-60" />
            <h3 className="font-semibold mb-2">Start Chatting</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-xs">
              Type in English or Arabic. Arabic commands will be automatically translated.
            </p>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Languages className="h-3 w-3" />
              <span>English • العربية</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                {/* Regular Message */}
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] space-y-1`}>
                    <div className="flex items-center space-x-2 mb-1">
                      {message.role === 'user' ? (
                        <User className="h-3 w-3 text-blue-600" />
                      ) : (
                        <Bot className="h-3 w-3 text-green-600" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(message.timestamp)}
                      </span>
                      {message.metadata?.isArabic && (
                        <Badge variant="outline" className="text-xs h-4">
                          AR
                        </Badge>
                      )}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-muted'
                    }`}>
                      <p className={message.metadata?.isArabic ? 'text-right' : 'text-left'} 
                         dir={message.metadata?.isArabic ? 'rtl' : 'ltr'}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Commander Card for Arabic messages */}
                {message.type === 'commander' && message.metadata?.isArabic && (
                  <div className="px-2">
                    <CommanderCard
                      originalText={message.content}
                      translatedText={message.metadata.translatedText || message.content}
                      confidence={message.metadata.confidence || 0.5}
                      suggestions={['Add more context', 'Specify project']}
                      actions={[
                        { type: 'send-to-project', label: 'Send' },
                        { type: 'edit-command', label: 'Edit' }
                      ]}
                    />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Commands Sheet */}
      <Sheet open={showQuickCommands} onOpenChange={setShowQuickCommands}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader className="pb-4">
            <SheetTitle>Quick Commands</SheetTitle>
            <SheetDescription>
              Tap any command to use it instantly
            </SheetDescription>
          </SheetHeader>
          <QuickCommands
            variant="grid"
            onCommandSelect={(command) => {
              onInputChange(command.arabicText)
              setShowQuickCommands(false)
              inputRef.current?.focus()
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Project Selector Sheet */}
      <Sheet open={showProjectSelector} onOpenChange={setShowProjectSelector}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader className="pb-4">
            <SheetTitle>Select Project</SheetTitle>
            <SheetDescription>
              Choose project context for your commands
            </SheetDescription>
          </SheetHeader>
          <ProjectSelector
            selectedProject={selectedProject}
            onProjectChange={(project) => {
              onProjectChange?.(project)
              setShowProjectSelector(false)
            }}
            variant="full"
          />
        </SheetContent>
      </Sheet>

      {/* Input Area */}
      <div className="flex-none border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Language & Mode Indicators */}
        {!isCompactMode && (
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="flex items-center space-x-2">
              {getLanguageIndicator()}
              {isArabicDetected && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                  <Bot className="h-2 w-2 mr-1" />
                  Commander
                </Badge>
              )}
            </div>
            
            {isLoading && (
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                <span>Processing...</span>
              </div>
            )}
          </div>
        )}

        {/* Main Input Row */}
        <div className="flex items-center space-x-2 p-3">
          {/* Quick Commands Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickCommands(true)}
            className="h-9 w-9 p-0 flex-shrink-0"
          >
            <Zap className="h-4 w-4" />
          </Button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isArabicDetected ? "اكتب أمرك..." : "Type your message..."}
              className={`pr-10 ${isArabicDetected ? 'text-right' : 'text-left'} text-sm`}
              dir={isArabicDetected ? 'rtl' : 'ltr'}
              disabled={isLoading}
            />
            
            {/* Voice Input Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={startVoiceInput}
              disabled={isLoading}
            >
              {isListening ? (
                <MicOff className="h-3 w-3 text-red-500" />
              ) : (
                <Mic className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* Send Button */}
          <Button 
            onClick={handleSend} 
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="h-9 w-9 p-0 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}