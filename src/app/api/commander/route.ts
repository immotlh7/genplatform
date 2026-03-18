import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission, checkOwnerAuth } from '@/lib/rbac'
import { logSecurityEvent } from '@/lib/security-logger'

interface CommanderRequest {
  arabicText: string
  context?: string
  projectId?: string
  chatHistory?: Array<{ role: string; content: string }>
}

interface CommanderResponse {
  success: boolean
  englishCommand: string
  confidence: number
  suggestedActions: Array<{
    type: 'send_to_project' | 'create_idea' | 'execute_command' | 'edit_text'
    label: string
    data: any
  }>
  metadata: {
    detectedLanguage: string
    commandType: string
    originalText: string
    processingTime: number
  }
}

/**
 * POST /api/commander
 * Arabic-to-English command translation service
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const startTime = Date.now()

  try {
    // Check authentication - all users can use commander
    const authCookie = req.cookies.get('auth-token')?.value
    let authorized = false
    let requestorInfo = null

    // Check owner authentication first
    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
      requestorInfo = ownerAuth.user
    } else {
      // Check team member permissions
      const permissionCheck = await requirePermission('chat:read') // Basic chat access required
      if (permissionCheck.authorized) {
        authorized = true
        requestorInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      await logSecurityEvent(ip, 'unauthorized_commander_access_attempt', 'warning', {
        userAgent,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { success: false, message: 'Authentication required for Commander service' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: CommanderRequest = await req.json()
    const { arabicText, context, projectId, chatHistory } = body

    // Validate required fields
    if (!arabicText || typeof arabicText !== 'string') {
      return NextResponse.json(
        { success: false, message: 'arabicText is required and must be a string' },
        { status: 400 }
      )
    }

    if (arabicText.length > 2000) {
      return NextResponse.json(
        { success: false, message: 'arabicText too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Process the Arabic text
    const commanderResult = await processArabicCommand(arabicText, {
      context,
      projectId,
      chatHistory: chatHistory?.slice(-5) || [], // Last 5 messages for context
      userId: requestorInfo?.id,
      userRole: requestorInfo?.role
    })

    const processingTime = Date.now() - startTime

    // Log successful translation
    await logSecurityEvent(ip, 'commander_translation_success', 'info', {
      requestorEmail: requestorInfo?.email,
      requestorRole: requestorInfo?.role,
      arabicTextLength: arabicText.length,
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
          description: 'Commander translation performed',
          details: {
            user_id: requestorInfo?.id,
            user_email: requestorInfo?.email,
            user_role: requestorInfo?.role,
            arabic_text_length: arabicText.length,
            confidence: commanderResult.confidence,
            command_type: commanderResult.metadata.commandType,
            project_id: projectId,
            processing_time: processingTime,
            detected_language: commanderResult.metadata.detectedLanguage
          },
          resolved: true
        })
    }

    const response: CommanderResponse = {
      ...commanderResult,
      metadata: {
        ...commanderResult.metadata,
        processingTime
      }
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('Commander API error:', error)
    
    await logSecurityEvent(ip, 'commander_api_system_error', 'critical', {
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
 * Process Arabic command and generate English translation with actions
 */
async function processArabicCommand(
  arabicText: string, 
  context: {
    context?: string
    projectId?: string
    chatHistory?: Array<{ role: string; content: string }>
    userId?: string
    userRole?: string
  }
): Promise<Omit<CommanderResponse, 'success'>> {
  
  try {
    // Detect if text is actually Arabic
    const isArabic = detectArabicText(arabicText)
    
    if (!isArabic) {
      // If it's already English or other language, return minimal processing
      return {
        englishCommand: arabicText,
        confidence: 0.95,
        suggestedActions: generateActionsForEnglishText(arabicText, context),
        metadata: {
          detectedLanguage: 'english',
          commandType: 'direct_command',
          originalText: arabicText
        }
      }
    }

    // Basic Arabic-to-English translation logic
    const translationResult = await translateArabicToEnglish(arabicText, context)
    
    // Generate suggested actions based on the translated command
    const suggestedActions = generateSuggestedActions(translationResult.englishCommand, context)
    
    // Determine command type
    const commandType = classifyCommand(translationResult.englishCommand)

    return {
      englishCommand: translationResult.englishCommand,
      confidence: translationResult.confidence,
      suggestedActions,
      metadata: {
        detectedLanguage: 'arabic',
        commandType,
        originalText: arabicText
      }
    }

  } catch (error) {
    console.error('Error processing Arabic command:', error)
    
    // Fallback response
    return {
      englishCommand: `Translate: "${arabicText}"`,
      confidence: 0.1,
      suggestedActions: [
        {
          type: 'edit_text',
          label: 'Edit Command',
          data: { originalText: arabicText }
        }
      ],
      metadata: {
        detectedLanguage: 'unknown',
        commandType: 'translation_error',
        originalText: arabicText
      }
    }
  }
}

/**
 * Detect if text contains Arabic characters
 */
function detectArabicText(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
  return arabicPattern.test(text)
}

/**
 * Translate Arabic text to English
 */
async function translateArabicToEnglish(
  arabicText: string, 
  context: any
): Promise<{ englishCommand: string; confidence: number }> {
  
  // Basic translation patterns for common development commands
  const translationPatterns = [
    // Project management
    { arabic: /إنشاء مشروع|أنشئ مشروع|مشروع جديد/, english: 'Create new project', confidence: 0.9 },
    { arabic: /احذف المشروع|مسح المشروع/, english: 'Delete project', confidence: 0.9 },
    { arabic: /فتح المشروع|افتح المشروع/, english: 'Open project', confidence: 0.9 },
    
    // Task management
    { arabic: /إنشاء مهمة|أنشئ مهمة|مهمة جديدة/, english: 'Create new task', confidence: 0.9 },
    { arabic: /إكمال المهمة|أكملت المهمة/, english: 'Complete task', confidence: 0.9 },
    { arabic: /حذف المهمة|امسح المهمة/, english: 'Delete task', confidence: 0.9 },
    
    // Ideas and features
    { arabic: /فكرة جديدة|أضف فكرة|اكتب فكرة/, english: 'Add new idea', confidence: 0.9 },
    { arabic: /ميزة جديدة|أضف ميزة/, english: 'Add new feature', confidence: 0.9 },
    
    // Development commands
    { arabic: /تشغيل التطبيق|شغل التطبيق/, english: 'Run application', confidence: 0.9 },
    { arabic: /بناء المشروع|ابني المشروع/, english: 'Build project', confidence: 0.9 },
    { arabic: /نشر التطبيق|انشر التطبيق/, english: 'Deploy application', confidence: 0.9 },
    { arabic: /اختبار الكود|تشغيل الاختبارات/, english: 'Run tests', confidence: 0.9 },
    
    // General commands
    { arabic: /مساعدة|ساعدني/, english: 'Help', confidence: 0.9 },
    { arabic: /عرض|اعرض|أرني/, english: 'Show me', confidence: 0.8 },
    { arabic: /البحث عن|ابحث عن/, english: 'Search for', confidence: 0.8 },
    { arabic: /حفظ|احفظ/, english: 'Save', confidence: 0.9 },
    { arabic: /إلغاء|ألغي/, english: 'Cancel', confidence: 0.9 }
  ]

  // Try to match against known patterns
  for (const pattern of translationPatterns) {
    if (pattern.arabic.test(arabicText)) {
      const englishCommand = arabicText.replace(pattern.arabic, pattern.english)
      return {
        englishCommand: englishCommand.trim(),
        confidence: pattern.confidence
      }
    }
  }

  // Fallback: Basic word-by-word translation for common terms
  let englishCommand = arabicText
  const wordTranslations = [
    { ar: 'مشروع', en: 'project' },
    { ar: 'مهمة', en: 'task' },
    { ar: 'فكرة', en: 'idea' },
    { ar: 'ميزة', en: 'feature' },
    { ar: 'تطبيق', en: 'application' },
    { ar: 'كود', en: 'code' },
    { ar: 'ملف', en: 'file' },
    { ar: 'إنشاء', en: 'create' },
    { ar: 'حذف', en: 'delete' },
    { ar: 'تعديل', en: 'edit' },
    { ar: 'عرض', en: 'show' },
    { ar: 'حفظ', en: 'save' },
    { ar: 'تشغيل', en: 'run' },
    { ar: 'بناء', en: 'build' },
    { ar: 'نشر', en: 'deploy' }
  ]

  for (const translation of wordTranslations) {
    const regex = new RegExp(translation.ar, 'g')
    englishCommand = englishCommand.replace(regex, translation.en)
  }

  return {
    englishCommand: englishCommand.trim() || `Translate: "${arabicText}"`,
    confidence: englishCommand !== arabicText ? 0.6 : 0.3
  }
}

/**
 * Generate suggested actions for English text
 */
function generateActionsForEnglishText(
  text: string,
  context: any
): Array<{ type: string; label: string; data: any }> {
  
  const actions = []
  const lowerText = text.toLowerCase()

  // Project-related actions
  if (lowerText.includes('create') && (lowerText.includes('project') || lowerText.includes('new project'))) {
    actions.push({
      type: 'create_idea',
      label: 'Create New Project',
      data: { ideaText: text, type: 'project' }
    })
  }

  // Task-related actions
  if (lowerText.includes('task') || lowerText.includes('todo')) {
    if (context.projectId) {
      actions.push({
        type: 'send_to_project',
        label: 'Add to Project Tasks',
        data: { projectId: context.projectId, taskText: text }
      })
    }
  }

  // Idea-related actions
  if (lowerText.includes('idea') || lowerText.includes('feature') || lowerText.includes('implement')) {
    actions.push({
      type: 'create_idea',
      label: 'Create New Idea',
      data: { ideaText: text, type: 'feature' }
    })
  }

  // Always include edit and send options
  actions.push({
    type: 'edit_text',
    label: 'Edit Command',
    data: { originalText: text }
  })

  if (context.projectId) {
    actions.push({
      type: 'send_to_project',
      label: 'Send to Project',
      data: { projectId: context.projectId, content: text }
    })
  }

  return actions
}

/**
 * Generate suggested actions based on translated command
 */
function generateSuggestedActions(
  englishCommand: string,
  context: any
): Array<{ type: string; label: string; data: any }> {
  
  const actions = []
  const lowerCommand = englishCommand.toLowerCase()

  // Analyze command and suggest appropriate actions
  if (lowerCommand.includes('create') || lowerCommand.includes('new')) {
    if (lowerCommand.includes('project')) {
      actions.push({
        type: 'create_idea',
        label: 'Start New Project',
        data: { ideaText: englishCommand, type: 'project' }
      })
    } else if (lowerCommand.includes('task')) {
      actions.push({
        type: 'send_to_project',
        label: 'Add Task to Project',
        data: { projectId: context.projectId, taskText: englishCommand }
      })
    } else if (lowerCommand.includes('idea') || lowerCommand.includes('feature')) {
      actions.push({
        type: 'create_idea',
        label: 'Submit as New Idea',
        data: { ideaText: englishCommand, type: 'feature' }
      })
    }
  }

  // Command execution actions
  if (lowerCommand.includes('run') || lowerCommand.includes('execute') || lowerCommand.includes('deploy')) {
    actions.push({
      type: 'execute_command',
      label: 'Execute Command',
      data: { command: englishCommand }
    })
  }

  // Always include basic actions
  actions.push({
    type: 'edit_text',
    label: 'Edit Translation',
    data: { originalText: englishCommand }
  })

  if (context.projectId) {
    actions.push({
      type: 'send_to_project',
      label: 'Send to Current Project',
      data: { projectId: context.projectId, content: englishCommand }
    })
  }

  return actions.slice(0, 4) // Limit to 4 actions max
}

/**
 * Classify the type of command
 */
function classifyCommand(command: string): string {
  const lowerCommand = command.toLowerCase()

  if (lowerCommand.includes('create') || lowerCommand.includes('new')) return 'creation_command'
  if (lowerCommand.includes('delete') || lowerCommand.includes('remove')) return 'deletion_command'
  if (lowerCommand.includes('edit') || lowerCommand.includes('update')) return 'modification_command'
  if (lowerCommand.includes('show') || lowerCommand.includes('display') || lowerCommand.includes('view')) return 'query_command'
  if (lowerCommand.includes('run') || lowerCommand.includes('execute') || lowerCommand.includes('deploy')) return 'execution_command'
  if (lowerCommand.includes('help')) return 'help_command'

  return 'general_command'
}

/**
 * GET /api/commander
 * Get commander service status and statistics
 */
export async function GET(req: NextRequest) {
  try {
    const authCookie = req.cookies.get('auth-token')?.value
    let authorized = false

    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
    } else {
      const permissionCheck = await requirePermission('chat:read')
      if (permissionCheck.authorized) {
        authorized = true
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Return service status
    return NextResponse.json({
      success: true,
      data: {
        service: 'Commander Arabic-to-English Translation',
        version: '1.0',
        status: 'active',
        features: [
          'Arabic text detection',
          'Command translation',
          'Action suggestions',
          'Context awareness',
          'Project integration'
        ],
        supportedLanguages: ['arabic', 'english'],
        maxTextLength: 2000
      }
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Service unavailable' },
      { status: 500 }
    )
  }
}