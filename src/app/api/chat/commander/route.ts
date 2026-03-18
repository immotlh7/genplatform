import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission, checkOwnerAuth } from '@/lib/rbac'
import { logSecurityEvent } from '@/lib/security-logger'
import { detectArabicText, validateArabicCommand } from '@/lib/arabic-detection'

interface ChatCommanderRequest {
  message: {
    id: string
    content: string
    role: 'user' | 'assistant' | 'system'
    timestamp: string
    type?: string
    projectId?: string
    metadata?: any
  }
  context: {
    sessionId: string
    previousMessages: Array<{ role: string; content: string }>
    projectId?: string
    userPermissions: any
  }
}

interface CommanderChatResponse {
  success: boolean
  message?: {
    id: string
    content: string
    role: 'assistant'
    timestamp: string
    type: 'commander'
    metadata: {
      originalArabic: string
      englishTranslation: string
      confidence: number
      commandType: string
      suggestedActions: Array<{
        type: string
        label: string
        data: any
      }>
      processingTime: number
      detectedLanguage: string
    }
  }
  commanderResponse?: {
    translation: string
    confidence: number
    actions: Array<{
      type: string
      label: string
      data: any
    }>
  }
}

/**
 * POST /api/chat/commander
 * Handle Arabic command messages in chat with Commander translation
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const startTime = Date.now()

  try {
    // Check authentication and permissions
    const authCookie = req.cookies.get('auth-token')?.value
    let authorized = false
    let requestorInfo = null

    // Check owner authentication first
    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
      requestorInfo = ownerAuth.user
    } else {
      // Check team member permissions (MANAGER+ can use Commander in chat)
      const permissionCheck = await requirePermission('chat:write')
      if (permissionCheck.authorized) {
        authorized = true
        requestorInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      await logSecurityEvent(ip, 'unauthorized_chat_commander_access_attempt', 'warning', {
        userAgent,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { success: false, message: 'Insufficient permissions for Commander chat feature' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: ChatCommanderRequest = await req.json()
    const { message, context } = body

    // Validate request
    if (!message || !message.content) {
      return NextResponse.json(
        { success: false, message: 'Message content is required' },
        { status: 400 }
      )
    }

    // Detect and validate Arabic text
    const arabicDetection = detectArabicText(message.content)
    const validation = validateArabicCommand(message.content)

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: `Invalid Arabic command: ${validation.issues.join(', ')}` },
        { status: 400 }
      )
    }

    // Call Commander API for translation
    const commanderResult = await callCommanderAPI(message.content, {
      context: 'chat',
      projectId: context.projectId,
      chatHistory: context.previousMessages,
      userId: requestorInfo?.id,
      userRole: requestorInfo?.role,
      sessionId: context.sessionId
    })

    const processingTime = Date.now() - startTime

    // Create response message
    const responseMessage = {
      id: `commander-${Date.now()}`,
      content: generateCommanderResponse(commanderResult, arabicDetection),
      role: 'assistant' as const,
      timestamp: new Date().toISOString(),
      type: 'commander',
      metadata: {
        originalArabic: message.content,
        englishTranslation: commanderResult.englishCommand,
        confidence: commanderResult.confidence,
        commandType: commanderResult.metadata.commandType,
        suggestedActions: commanderResult.suggestedActions,
        processingTime,
        detectedLanguage: commanderResult.metadata.detectedLanguage,
        arabicDetection: arabicDetection,
        userId: requestorInfo?.id,
        sessionId: context.sessionId
      }
    }

    // Store message in chat history (if enabled)
    await storeChatMessage(responseMessage, context.sessionId, requestorInfo?.id)

    // Log successful Commander chat interaction
    await logSecurityEvent(ip, 'chat_commander_translation_success', 'info', {
      requestorEmail: requestorInfo?.email,
      requestorRole: requestorInfo?.role,
      sessionId: context.sessionId,
      arabicTextLength: message.content.length,
      confidence: commanderResult.confidence,
      commandType: commanderResult.metadata.commandType,
      processingTime,
      userAgent
    })

    // Log to security_events table for audit
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('security_events')
        .insert({
          event_type: 'audit',
          severity: 'info',
          description: 'Chat Commander translation performed',
          details: {
            user_id: requestorInfo?.id,
            user_email: requestorInfo?.email,
            user_role: requestorInfo?.role,
            session_id: context.sessionId,
            arabic_text_length: message.content.length,
            confidence: commanderResult.confidence,
            command_type: commanderResult.metadata.commandType,
            project_id: context.projectId,
            processing_time: processingTime,
            detected_language: commanderResult.metadata.detectedLanguage
          },
          resolved: true
        })
    }

    const response: CommanderChatResponse = {
      success: true,
      message: responseMessage,
      commanderResponse: {
        translation: commanderResult.englishCommand,
        confidence: commanderResult.confidence,
        actions: commanderResult.suggestedActions
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('Chat Commander API error:', error)
    
    await logSecurityEvent(ip, 'chat_commander_api_system_error', 'critical', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userAgent,
      processingTime,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Call the Commander API for translation
 */
async function callCommanderAPI(arabicText: string, context: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/commander`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ChatCommander/1.0'
      },
      body: JSON.stringify({
        arabicText,
        context: context.context,
        projectId: context.projectId,
        chatHistory: context.chatHistory
      })
    })

    if (!response.ok) {
      throw new Error(`Commander API failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(`Commander API error: ${data.message}`)
    }

    return data.data

  } catch (error) {
    console.error('Error calling Commander API:', error)
    
    // Fallback response
    return {
      englishCommand: `[Translation Error] ${arabicText}`,
      confidence: 0.1,
      suggestedActions: [
        {
          type: 'edit_text',
          label: 'Edit Command',
          data: { originalText: arabicText }
        }
      ],
      metadata: {
        detectedLanguage: 'arabic',
        commandType: 'translation_error',
        originalText: arabicText
      }
    }
  }
}

/**
 * Generate a helpful response message for Commander translations
 */
function generateCommanderResponse(commanderResult: any, arabicDetection: any): string {
  const { englishCommand, confidence, suggestedActions } = commanderResult
  
  let response = `🔄 **Commander Translation**\n\n`
  
  // Add confidence indicator
  if (confidence >= 0.8) {
    response += `✅ **High Confidence Translation** (${Math.round(confidence * 100)}%)\n`
  } else if (confidence >= 0.5) {
    response += `⚠️ **Medium Confidence Translation** (${Math.round(confidence * 100)}%)\n`
  } else {
    response += `❗ **Low Confidence Translation** (${Math.round(confidence * 100)}%)\n`
  }
  
  response += `**English Command:** ${englishCommand}\n\n`
  
  // Add suggested actions
  if (suggestedActions && suggestedActions.length > 0) {
    response += `**Suggested Actions:**\n`
    suggestedActions.forEach((action: any, index: number) => {
      const emoji = getActionEmoji(action.type)
      response += `${index + 1}. ${emoji} ${action.label}\n`
    })
    response += `\n`
  }
  
  // Add helpful tips based on detection
  if (arabicDetection.confidence < 0.7) {
    response += `💡 **Tip:** For better translation accuracy, try using more Arabic text or common Arabic development terms.\n\n`
  }
  
  // Add usage instructions
  response += `**Next Steps:**\n`
  response += `• Use the action buttons below to execute your command\n`
  response += `• Edit the translation if needed\n`
  response += `• Send the command to your current project\n`
  
  return response
}

/**
 * Get appropriate emoji for action types
 */
function getActionEmoji(actionType: string): string {
  switch (actionType) {
    case 'send_to_project':
      return '📁'
    case 'create_idea':
      return '💡'
    case 'execute_command':
      return '⚡'
    case 'edit_text':
      return '✏️'
    default:
      return '🔧'
  }
}

/**
 * Store chat message in database (if chat history is enabled)
 */
async function storeChatMessage(message: any, sessionId: string, userId?: string) {
  if (!supabaseAdmin) return

  try {
    await supabaseAdmin
      .from('chat_messages')
      .insert({
        id: message.id,
        session_id: sessionId,
        user_id: userId,
        content: message.content,
        role: message.role,
        type: message.type,
        metadata: message.metadata,
        created_at: message.timestamp
      })
  } catch (error) {
    console.warn('Failed to store chat message:', error)
    // Non-critical error, continue processing
  }
}

/**
 * GET /api/chat/commander
 * Get Commander chat statistics and configuration
 */
export async function GET(req: NextRequest) {
  try {
    const authCookie = req.cookies.get('auth-token')?.value
    let authorized = false
    let requestorInfo = null

    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
      requestorInfo = ownerAuth.user
    } else {
      const permissionCheck = await requirePermission('chat:read')
      if (permissionCheck.authorized) {
        authorized = true
        requestorInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get Commander chat statistics
    const stats = await getCommanderChatStats(requestorInfo?.id)

    return NextResponse.json({
      success: true,
      data: {
        service: 'Commander Chat Integration',
        version: '1.0',
        status: 'active',
        userPermissions: {
          canUseCommander: true, // Based on auth check above
          canViewHistory: requestorInfo?.role !== 'VIEWER',
          canModerate: requestorInfo?.role === 'ADMIN'
        },
        statistics: stats,
        features: [
          'Real-time Arabic detection',
          'Command translation',
          'Action suggestions',
          'Chat history integration',
          'Project context awareness'
        ]
      }
    })

  } catch (error) {
    console.error('GET Commander chat error:', error)
    return NextResponse.json(
      { success: false, message: 'Service unavailable' },
      { status: 500 }
    )
  }
}

/**
 * Get Commander chat statistics
 */
async function getCommanderChatStats(userId?: string): Promise<any> {
  if (!supabaseAdmin) {
    return {
      totalTranslations: 0,
      averageConfidence: 0,
      popularCommands: [],
      recentActivity: 0
    }
  }

  try {
    // Get last 24 hours of Commander translations
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: recentTranslations, error } = await supabaseAdmin
      .from('security_events')
      .select('details')
      .eq('event_type', 'audit')
      .ilike('description', '%Commander translation%')
      .gte('created_at', yesterday)
      .limit(100)

    if (error) {
      console.warn('Error fetching Commander stats:', error)
      return { totalTranslations: 0, averageConfidence: 0 }
    }

    const translations = recentTranslations || []
    const totalTranslations = translations.length
    
    // Calculate average confidence
    let totalConfidence = 0
    const commandTypes = new Map()

    translations.forEach(event => {
      const details = event.details
      if (details?.confidence) {
        totalConfidence += details.confidence
      }
      if (details?.command_type) {
        commandTypes.set(
          details.command_type, 
          (commandTypes.get(details.command_type) || 0) + 1
        )
      }
    })

    const averageConfidence = totalTranslations > 0 ? totalConfidence / totalTranslations : 0
    
    // Get popular command types
    const popularCommands = Array.from(commandTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))

    return {
      totalTranslations,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      popularCommands,
      recentActivity: totalTranslations
    }

  } catch (error) {
    console.warn('Error calculating Commander stats:', error)
    return { totalTranslations: 0, averageConfidence: 0 }
  }
}