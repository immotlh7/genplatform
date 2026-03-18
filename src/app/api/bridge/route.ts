import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/access-control'

interface BridgeMessage {
  id?: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp?: string
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

interface BridgeRequest {
  message: BridgeMessage
  context?: {
    projectId?: string
    previousMessages?: BridgeMessage[]
    sessionId?: string
  }
}

// Arabic detection regex - covers Arabic and Arabic-Indic script ranges
const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

// Simple Arabic text detector
function detectArabic(text: string): boolean {
  return ARABIC_REGEX.test(text)
}

// Mock Commander skill integration
async function callCommanderSkill(arabicText: string): Promise<CommanderResponse> {
  // In a real implementation, this would call the Commander skill via OpenClaw API
  // For now, we'll simulate the translation logic
  
  const translations: Record<string, string> = {
    'انشئ مشروع جديد': 'Create a new project',
    'اظهر المشاريع': 'Show all projects',
    'احفظ التقدم': 'Save progress',
    'ارسل تقرير': 'Send report',
    'فتح الاعدادات': 'Open settings',
    'تشغيل المهام': 'Run tasks',
    'توقف': 'Stop',
    'مساعدة': 'Help',
    'حالة النظام': 'System status',
    'نظف الذاكرة': 'Clean memory'
  }

  // Simple translation lookup
  const translation = translations[arabicText.trim()] || `Translate: ${arabicText}`
  const confidence = translations[arabicText.trim()] ? 0.9 : 0.6

  // Generate action suggestions based on the translation
  const actions = []
  
  if (translation.toLowerCase().includes('project')) {
    actions.push({
      type: 'send-to-project' as const,
      label: 'Send to Project',
      data: { action: 'create-project' }
    })
  }
  
  if (translation.toLowerCase().includes('task')) {
    actions.push({
      type: 'create-task' as const,
      label: 'Create Task',
      data: { action: 'create-task' }
    })
  }

  actions.push({
    type: 'edit-command' as const,
    label: 'Edit Command',
    data: { originalText: arabicText, translatedText: translation }
  })

  return {
    success: true,
    command: translation,
    translation,
    confidence,
    suggestions: [
      'Consider adding more context',
      'Specify target project if applicable',
      'Add priority level if needed'
    ],
    actions
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check user authentication
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: BridgeRequest = await request.json()
    const { message, context } = body

    if (!message || !message.content) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Detect if the message contains Arabic text
    const isArabic = detectArabic(message.content)
    
    // If Arabic detected, route to Commander skill
    if (isArabic) {
      try {
        const commanderResponse = await callCommanderSkill(message.content)
        
        // Create response message with Commander translation
        const responseMessage: BridgeMessage = {
          id: Date.now().toString(),
          content: commanderResponse.command,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          type: 'commander',
          metadata: {
            language: 'ar',
            isArabic: true,
            originalText: message.content,
            translatedText: commanderResponse.translation,
            confidence: commanderResponse.confidence,
            projectId: context?.projectId
          }
        }

        return NextResponse.json({
          success: true,
          message: responseMessage,
          commanderResponse,
          type: 'commander-translation',
          actions: commanderResponse.actions || [],
          metadata: {
            detectedLanguage: 'Arabic',
            confidence: commanderResponse.confidence,
            translationMethod: 'commander-skill'
          }
        })

      } catch (commanderError) {
        console.error('Commander skill error:', commanderError)
        
        // Fallback response if Commander skill fails
        return NextResponse.json({
          success: true,
          message: {
            id: Date.now().toString(),
            content: `I detected Arabic text but couldn't process it: "${message.content}". Please try in English or contact support.`,
            role: 'assistant',
            timestamp: new Date().toISOString(),
            type: 'message',
            metadata: {
              language: 'ar',
              isArabic: true,
              originalText: message.content,
              confidence: 0.3
            }
          },
          type: 'error-fallback',
          error: 'Commander skill unavailable'
        })
      }
    }

    // Handle non-Arabic messages (regular chat flow)
    const responseMessage: BridgeMessage = {
      id: Date.now().toString(),
      content: `Received: "${message.content}". This is a regular message response from the Bridge API.`,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      type: 'message',
      metadata: {
        language: 'en',
        isArabic: false,
        projectId: context?.projectId
      }
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      type: 'regular-message',
      metadata: {
        detectedLanguage: 'English',
        processingMethod: 'standard-chat'
      }
    })

  } catch (error) {
    console.error('Bridge API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for Bridge status and capabilities
export async function GET(request: NextRequest) {
  try {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      status: 'Bridge API operational',
      capabilities: {
        arabicDetection: true,
        commanderIntegration: true,
        languageSupport: ['en', 'ar'],
        features: [
          'Arabic text detection',
          'Commander skill integration',
          'Context-aware responses',
          'Action suggestions',
          'Project integration'
        ]
      },
      version: '1.0.0',
      user: {
        id: currentUser.id,
        role: currentUser.role
      }
    })
  } catch (error) {
    console.error('Bridge status error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}