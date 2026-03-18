"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CommanderCard } from '@/components/chat/CommanderCard'
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
  Globe
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
    projectId?: string
    confidence?: number
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

// Arabic detection regex - covers Arabic and Arabic-Indic script ranges
const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

export default function ChatPage() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isArabicDetected, setIsArabicDetected] = useState(false)
  const [arabicConfidence, setArabicConfidence] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date().toISOString(),
      type: isArabicDetected ? 'commander' : 'message',
      metadata: {
        language: isArabicDetected ? 'ar' : 'en',
        isArabic: isArabicDetected,
        confidence: arabicConfidence
      }
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          context: {
            sessionId: 'chat-session-1',
            previousMessages: messages.slice(-5) // Last 5 messages for context
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Bridge API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message])
      }

    } catch (error) {
      console.error('Failed to send message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })

      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, I couldn't process your message. Please try again.",
        role: 'assistant',
        timestamp: new Date().toISOString(),
        type: 'message'
      }
      setMessages(prev => [...prev, errorMessage])
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
    toast({
      title: "Action triggered",
      description: `Executing: ${action.label}`,
    })
    // Handle different action types here
  }

  const handleEditCommand = (text: string) => {
    setInputValue(text)
    inputRef.current?.focus()
  }

  const handleSendToProject = (text: string) => {
    toast({
      title: "Sent to project",
      description: `Command: "${text}" has been added to the current project.`,
    })
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
        setInputValue(prev => prev + transcript)
      }
      
      recognition.start()
    } else {
      toast({
        title: "Speech recognition not supported",
        description: "Your browser doesn't support voice input.",
        variant: "destructive",
      })
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

  return (
    <div className="flex flex-col h-screen p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Chat</h1>
          <p className="text-muted-foreground">
            AI assistant with Arabic command translation support
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="flex-none">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Conversation</span>
            {isArabicDetected && (
              <Badge className="bg-orange-500 text-white">
                <Languages className="h-3 w-3 mr-1" />
                Commander Mode
              </Badge>
            )}
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
                  Type in English or Arabic. Arabic commands will be automatically translated using Commander.
                </p>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Languages className="h-4 w-4" />
                  <span>Supports: English, Arabic (العربية)</span>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="space-y-3">
                  {/* Regular Message */}
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md lg:max-w-lg xl:max-w-xl space-y-2 ${
                      message.role === 'user' ? 'items-end' : 'items-start'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {message.role === 'user' ? (
                          <User className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Bot className="h-4 w-4 text-green-600" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        {message.metadata?.isArabic && (
                          <Badge variant="outline" className="text-xs">
                            Arabic
                          </Badge>
                        )}
                      </div>
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
                    </div>
                  </div>

                  {/* Commander Card for Arabic messages */}
                  {message.type === 'commander' && message.metadata?.isArabic && (
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

          {/* Input Area */}
          <div className="space-y-3 border-t pt-4">
            {/* Language Detection Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getLanguageIndicator()}
                {isArabicDetected && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <Bot className="h-3 w-3 mr-1" />
                    Commander Ready
                  </Badge>
                )}
              </div>
              {isLoading && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>

            {/* Input Row */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isArabicDetected ? "اكتب أمرك بالعربية..." : "Type your message..."}
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
                className="px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}