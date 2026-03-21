import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Initialize Supabase client

interface CommanderRequest {
  arabicText: string;
  context?: string;
}

interface CommanderResponse {
  success: boolean;
  data: {
    arabicCommand: string;
    englishCommand: string;
    confidence: number;
    commandStructure: {
      action_verb: string;
      target_component: string;
      specifications: string[];
      expected_outcome: string;
      description: string;
    };
    suggestions: string[];
  };
}

// Enhanced Arabic to English command translator
async function translateArabicCommand(arabicText: string, context?: string): Promise<any> {
  const words = arabicText.trim().split(' ');
  
  // Extract action intent from Arabic text with more comprehensive mapping
  let action_verb = 'create';
  let target_component = 'feature';
  let specifications: string[] = [];
  let expected_outcome = '';
  
  // Enhanced Arabic keyword mapping for development commands
  const text = arabicText.toLowerCase();
  
  // Action verbs mapping
  if (text.includes('إنشاء') || text.includes('أنشئ') || text.includes('اصنع') || text.includes('اعمل')) {
    action_verb = 'create';
  } else if (text.includes('تحديث') || text.includes('حدث') || text.includes('محدث')) {
    action_verb = 'update';
  } else if (text.includes('حذف') || text.includes('احذف') || text.includes('امسح')) {
    action_verb = 'delete';
  } else if (text.includes('تحسين') || text.includes('حسن') || text.includes('طور')) {
    action_verb = 'improve';
  } else if (text.includes('إضافة') || text.includes('أضف') || text.includes('زيد')) {
    action_verb = 'add';
  } else if (text.includes('تعديل') || text.includes('عدل') || text.includes('غير')) {
    action_verb = 'modify';
  } else if (text.includes('إصلاح') || text.includes('أصلح') || text.includes('فكس')) {
    action_verb = 'fix';
  } else if (text.includes('نشر') || text.includes('انشر') || text.includes('ديبلوي')) {
    action_verb = 'deploy';
  } else if (text.includes('اختبار') || text.includes('اختبر') || text.includes('تست')) {
    action_verb = 'test';
  } else if (text.includes('تركيب') || text.includes('ركب') || text.includes('انستول')) {
    action_verb = 'install';
  }

  // Target component mapping
  if (text.includes('صفحة') || text.includes('موقع') || text.includes('بيج')) {
    target_component = 'page';
  } else if (text.includes('زر') || text.includes('أزرار') || text.includes('باتن') || text.includes('button')) {
    target_component = 'button';
  } else if (text.includes('قائمة') || text.includes('قوائم') || text.includes('منيو')) {
    target_component = 'menu';
  } else if (text.includes('نموذج') || text.includes('استمارة') || text.includes('فورم')) {
    target_component = 'form';
  } else if (text.includes('جدول') || text.includes('جداول') || text.includes('تيبل')) {
    target_component = 'table';
  } else if (text.includes('مكون') || text.includes('عنصر') || text.includes('كومبوننت')) {
    target_component = 'component';
  } else if (text.includes('واجهة') || text.includes('يوآي') || text.includes('ui')) {
    target_component = 'interface';
  } else if (text.includes('نظام') || text.includes('سيستم')) {
    target_component = 'system';
  } else if (text.includes('ملف') || text.includes('فايل')) {
    target_component = 'file';
  } else if (text.includes('مجلد') || text.includes('فولدر') || text.includes('مجلد')) {
    target_component = 'folder';
  } else if (text.includes('قاعدة بيانات') || text.includes('داتابيس') || text.includes('دب')) {
    target_component = 'database';
  } else if (text.includes('أي بي آي') || text.includes('api') || text.includes('واجهة برمجية')) {
    target_component = 'api';
  } else if (text.includes('تطبيق') || text.includes('آب') || text.includes('برنامج')) {
    target_component = 'application';
  } else if (text.includes('مشروع') || text.includes('بروجكت')) {
    target_component = 'project';
  } else if (text.includes('ميزة') || text.includes('فيتشر')) {
    target_component = 'feature';
  }

  // Extract specifications with more detailed mapping
  if (text.includes('أزرق') || text.includes('الأزرق') || text.includes('blue')) {
    specifications.push('blue color');
  }
  if (text.includes('أحمر') || text.includes('الأحمر') || text.includes('red')) {
    specifications.push('red color');
  }
  if (text.includes('أخضر') || text.includes('الأخضر') || text.includes('green')) {
    specifications.push('green color');
  }
  if (text.includes('كبير') || text.includes('كبيرة') || text.includes('large')) {
    specifications.push('large size');
  }
  if (text.includes('صغير') || text.includes('صغيرة') || text.includes('small')) {
    specifications.push('small size');
  }
  if (text.includes('متوسط') || text.includes('متوسطة') || text.includes('medium')) {
    specifications.push('medium size');
  }
  if (text.includes('جميل') || text.includes('جميلة') || text.includes('beautiful')) {
    specifications.push('attractive design');
  }
  if (text.includes('سريع') || text.includes('سريعة') || text.includes('fast')) {
    specifications.push('fast performance');
  }
  if (text.includes('آمن') || text.includes('آمنة') || text.includes('secure')) {
    specifications.push('secure');
  }
  if (text.includes('ريسبونسيف') || text.includes('متجاوب') || text.includes('responsive')) {
    specifications.push('responsive design');
  }
  if (text.includes('ديناميك') || text.includes('ديناميكي') || text.includes('dynamic')) {
    specifications.push('dynamic functionality');
  }
  if (text.includes('انتراكتيف') || text.includes('تفاعلي') || text.includes('interactive')) {
    specifications.push('interactive');
  }

  // Technology and framework specifications
  if (text.includes('ريآكت') || text.includes('react')) {
    specifications.push('React framework');
  }
  if (text.includes('نيكست') || text.includes('next')) {
    specifications.push('Next.js framework');
  }
  if (text.includes('تايب سكريبت') || text.includes('typescript')) {
    specifications.push('TypeScript');
  }
  if (text.includes('جافا سكريبت') || text.includes('javascript')) {
    specifications.push('JavaScript');
  }
  if (text.includes('تيلويند') || text.includes('tailwind')) {
    specifications.push('Tailwind CSS');
  }

  // Priority specifications
  if (text.includes('عاجل') || text.includes('مهم') || text.includes('urgent') || text.includes('high')) {
    specifications.push('high priority');
  }
  if (text.includes('متوسط الأهمية') || text.includes('medium priority')) {
    specifications.push('medium priority');
  }
  if (text.includes('منخفض الأولوية') || text.includes('low priority')) {
    specifications.push('low priority');
  }

  // Build a more descriptive translation
  let translation = `${action_verb.charAt(0).toUpperCase() + action_verb.slice(1)} a ${target_component}`;
  if (specifications.length > 0) {
    translation += ` with ${specifications.join(', ')}`;
  }
  
  // Set expected outcome with more detail
  expected_outcome = `A ${target_component} will be ${action_verb}d successfully`;
  if (specifications.length > 0) {
    expected_outcome += ` incorporating the specified features: ${specifications.join(', ')}`;
  }

  // Create comprehensive description
  const description = `This command requests to ${action_verb} a ${target_component} in the system. ${
    specifications.length > 0 
      ? `The implementation should focus on ${specifications.join(', ')}. ` 
      : ''
  }The expected result is ${expected_outcome.toLowerCase()}. ${
    context === 'edit_retranslation' 
      ? 'This is a retranslated version with improved accuracy.' 
      : ''
  }`;

  // Calculate confidence based on how many keywords we matched
  let confidence = 0.6; // Base confidence
  if (action_verb !== 'create') confidence += 0.1; // Bonus for specific action
  if (target_component !== 'feature') confidence += 0.1; // Bonus for specific target
  confidence += Math.min(specifications.length * 0.05, 0.15); // Bonus for specifications
  
  // Context bonus
  if (context === 'edit_retranslation') {
    confidence += 0.05; // Slight bonus for edited retranslation
  }

  const finalConfidence = Math.min(confidence, 0.95);

  return {
    arabicCommand: arabicText,
    englishCommand: description,
    confidence: finalConfidence,
    commandStructure: {
      action_verb,
      target_component,
      specifications,
      expected_outcome,
      description
    },
    suggestions: [
      'Consider adding more specific technical requirements',
      'Specify the target project or module if applicable',
      'Add timeline or priority information if needed',
      'Include any design preferences or constraints',
      'Mention specific technologies or frameworks if relevant'
    ]
  };
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const ownerAuth = cookieStore.get('owner-auth')?.value;

    // Check authentication
    if (!ownerAuth) {
      return NextResponse.json(
        { error: 'Authentication required for Commander translation' },
        { status: 401 }
      );
    }

    const body: CommanderRequest = await request.json();
    const { arabicText, context } = body;

    // Validate input
    if (!arabicText || typeof arabicText !== 'string') {
      return NextResponse.json(
        { error: 'Arabic text is required' },
        { status: 400 }
      );
    }

    if (arabicText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Arabic text cannot be empty' },
        { status: 400 }
      );
    }

    if (arabicText.length > 2000) {
      return NextResponse.json(
        { error: 'Arabic text too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Log the translation request
    const { data: logData, error: logError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: 'system',
        message: arabicText,
        message_type: 'commander_translate_request',
        metadata: {
          context: context || 'direct_translation',
          source: 'commander_api',
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging translation request:', logError);
    }

    // Perform translation
    const translationResult = await translateArabicCommand(arabicText, context);

    // Log the translation result
    if (logData) {
      await supabase.from('chat_messages').insert({
        user_id: 'system',
        message: translationResult.englishCommand,
        message_type: 'commander_translate_result',
        metadata: {
          parent_message_id: logData.id,
          confidence: translationResult.confidence,
          command_structure: translationResult.commandStructure,
          context: context || 'direct_translation',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Prepare response
    const response: CommanderResponse = {
      success: true,
      data: translationResult
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Commander API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to translate Arabic command',
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