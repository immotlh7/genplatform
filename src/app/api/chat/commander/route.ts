import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Initialize Supabase client

interface CommanderRequest {
  message: {
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: string;
    type?: 'message' | 'command' | 'commander';
    projectId?: string;
    metadata?: {
      language?: string;
      isArabic?: boolean;
      confidence?: number;
      userId?: string;
      userRole?: string;
      projectId?: string;
    };
  };
  context: {
    sessionId: string;
    previousMessages?: any[];
    projectId?: string;
    userPermissions: any;
  };
}

interface CommanderResponse {
  success: boolean;
  message: {
    id: string;
    content: string;
    role: 'assistant';
    timestamp: string;
    type: 'commander';
    metadata: {
      originalText: string;
      translatedText: string;
      confidence: number;
      language: 'en';
      command_structure?: {
        action_verb: string;
        target_component: string;
        specifications: string[];
        expected_outcome: string;
        description: string;
      };
    };
  };
  commanderResponse: {
    translation: string;
    confidence: number;
    command_structure: {
      action_verb: string;
      target_component: string;
      specifications: string[];
      expected_outcome: string;
      description: string;
    };
    actions: Array<{
      type: 'send-to-project' | 'create-task' | 'edit-command';
      label: string;
      data?: any;
    }>;
    suggestions: string[];
  };
}

// Mock commander translation function
// In production, this would call the OpenClaw commander skill
async function translateArabicCommand(arabicText: string, context: any): Promise<any> {
  // Enhanced command analysis
  const words = arabicText.trim().split(' ');
  
  // Extract action intent from Arabic text
  let action_verb = 'create';
  let target_component = 'feature';
  let specifications: string[] = [];
  let expected_outcome = '';
  
  // Basic Arabic keyword mapping
  if (arabicText.includes('إنشاء') || arabicText.includes('أنشئ') || arabicText.includes('اصنع')) {
    action_verb = 'create';
  } else if (arabicText.includes('تحديث') || arabicText.includes('حدث')) {
    action_verb = 'update';
  } else if (arabicText.includes('حذف') || arabicText.includes('احذف')) {
    action_verb = 'delete';
  } else if (arabicText.includes('تحسين') || arabicText.includes('حسن')) {
    action_verb = 'improve';
  } else if (arabicText.includes('إضافة') || arabicText.includes('أضف')) {
    action_verb = 'add';
  } else if (arabicText.includes('تعديل') || arabicText.includes('عدل')) {
    action_verb = 'modify';
  }

  // Determine target component
  if (arabicText.includes('صفحة') || arabicText.includes('موقع')) {
    target_component = 'page';
  } else if (arabicText.includes('زر') || arabicText.includes('أزرار')) {
    target_component = 'button';
  } else if (arabicText.includes('قائمة') || arabicText.includes('قوائم')) {
    target_component = 'menu';
  } else if (arabicText.includes('نموذج') || arabicText.includes('استمارة')) {
    target_component = 'form';
  } else if (arabicText.includes('جدول') || arabicText.includes('جداول')) {
    target_component = 'table';
  } else if (arabicText.includes('مكون') || arabicText.includes('عنصر')) {
    target_component = 'component';
  } else if (arabicText.includes('واجهة')) {
    target_component = 'interface';
  } else if (arabicText.includes('نظام')) {
    target_component = 'system';
  }

  // Extract specifications
  if (arabicText.includes('أزرق') || arabicText.includes('الأزرق')) {
    specifications.push('blue color');
  }
  if (arabicText.includes('كبير') || arabicText.includes('كبيرة')) {
    specifications.push('large size');
  }
  if (arabicText.includes('صغير') || arabicText.includes('صغيرة')) {
    specifications.push('small size');
  }
  if (arabicText.includes('جميل') || arabicText.includes('جميلة')) {
    specifications.push('attractive design');
  }
  if (arabicText.includes('سريع') || arabicText.includes('سريعة')) {
    specifications.push('fast performance');
  }
  if (arabicText.includes('آمن') || arabicText.includes('آمنة')) {
    specifications.push('secure');
  }

  // Build a descriptive translation
  let translation = `${action_verb.charAt(0).toUpperCase() + action_verb.slice(1)} a ${target_component}`;
  if (specifications.length > 0) {
    translation += ` with ${specifications.join(', ')}`;
  }
  
  // Set expected outcome
  expected_outcome = `A ${target_component} will be ${action_verb}d successfully`;
  if (specifications.length > 0) {
    expected_outcome += ` with the specified features: ${specifications.join(', ')}`;
  }

  // Create detailed description
  const description = `This command requests to ${action_verb} a ${target_component} in the system. The implementation should focus on ${specifications.length > 0 ? specifications.join(', ') : 'standard functionality'}. The expected result is ${expected_outcome.toLowerCase()}.`;

  return {
    translation,
    confidence: Math.min(0.8 + (specifications.length * 0.05), 0.95),
    command_structure: {
      action_verb,
      target_component,
      specifications,
      expected_outcome,
      description
    },
    suggestions: [
      'Consider adding more specific requirements',
      'Specify the target project or module',
      'Add priority level (high/medium/low)',
      'Include any design preferences or constraints'
    ],
    actions: [
      { type: 'send-to-project', label: 'Send to Project' },
      { type: 'create-task', label: 'Create Task' },
      { type: 'edit-command', label: 'Edit Command' }
    ]
  };
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const ownerAuth = cookieStore.get('owner-auth')?.value;

    // Check authentication - require owner or team member
    if (!ownerAuth) {
      // TODO: Check Supabase auth for team members
      return NextResponse.json(
        { error: 'Authentication required for chat access' },
        { status: 401 }
      );
    }

    const body: CommanderRequest = await request.json();
    const { message, context } = body;

    // Validate permissions
    if (!context.userPermissions?.canWrite || !context.userPermissions?.canUseCommander) {
      return NextResponse.json(
        { error: 'Insufficient permissions for Commander' },
        { status: 403 }
      );
    }

    // Validate Arabic input
    if (!message.metadata?.isArabic || !message.content) {
      return NextResponse.json(
        { error: 'Commander requires Arabic input text' },
        { status: 400 }
      );
    }

    // Log the commander request to Supabase
    const { data: logData, error: logError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: message.metadata.userId || 'system',
        message: message.content,
        message_type: 'commander_request',
        project_id: context.projectId || null,
        metadata: {
          ...message.metadata,
          context_type: 'arabic_command',
          session_id: context.sessionId,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging commander request:', logError);
    }

    // Translate Arabic command using our mock translator
    // In production, this would call the OpenClaw commander skill
    const translationResult = await translateArabicCommand(message.content, context);

    // Create response message
    const responseMessage = {
      id: (Date.now() + 1).toString(),
      content: translationResult.translation,
      role: 'assistant' as const,
      timestamp: new Date().toISOString(),
      type: 'commander' as const,
      metadata: {
        originalText: message.content,
        translatedText: translationResult.translation,
        confidence: translationResult.confidence,
        language: 'en' as const,
        command_structure: translationResult.command_structure
      }
    };

    // Save the translation to Supabase
    const { data: translationData, error: translationError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: message.metadata.userId || 'system',
        message: translationResult.description,
        message_type: 'commander_translation',
        project_id: context.projectId || null,
        metadata: {
          original_arabic: message.content,
          command_structure: translationResult.command_structure,
          confidence: translationResult.confidence,
          parent_message_id: logData?.id || null,
          session_id: context.sessionId,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (translationError) {
      console.error('Error saving commander translation:', translationError);
    }

    // Prepare response
    const response: CommanderResponse = {
      success: true,
      message: responseMessage,
      commanderResponse: {
        translation: translationResult.translation,
        confidence: translationResult.confidence,
        command_structure: translationResult.command_structure,
        actions: translationResult.actions,
        suggestions: translationResult.suggestions
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Commander API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process commander request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}