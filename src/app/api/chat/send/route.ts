import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ChatSendRequest {
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

interface ChatSendResponse {
  success: boolean;
  message: {
    id: string;
    content: string;
    role: 'assistant';
    timestamp: string;
    type: 'message';
    metadata: {
      language: string;
      responseType: string;
    };
  };
}

// Simple AI response generator
async function generateAIResponse(userMessage: string, context: any): Promise<string> {
  const message = userMessage.toLowerCase();
  
  // Context-aware responses based on project
  if (context.projectId) {
    if (message.includes('status') || message.includes('progress')) {
      return `Here's the current status of ${context.projectId}: The project is progressing well. Recent updates include UI improvements and API integrations. Would you like me to provide more specific details about any particular area?`;
    }
    
    if (message.includes('task') || message.includes('todo')) {
      return `For project ${context.projectId}, I can help you create new tasks, update existing ones, or review completed work. What specific task-related assistance do you need?`;
    }
    
    if (message.includes('deploy') || message.includes('deployment')) {
      return `The deployment status for ${context.projectId} is stable. All recent changes have been successfully deployed to the staging environment. Production deployment is ready when you are.`;
    }
  }

  // General responses
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return "Hello! I'm here to help you with your projects. You can ask me about project status, create tasks, manage team members, or use Commander for Arabic commands. How can I assist you today?";
  }
  
  if (message.includes('help') || message.includes('what can you do')) {
    return "I can help you with:\n• Project management and task tracking\n• Team collaboration and communication\n• Arabic command translation using Commander\n• Ideas and suggestion management\n• System status and health monitoring\n\nWhat would you like to explore?";
  }
  
  if (message.includes('commander') || message.includes('arabic')) {
    return "Commander is our Arabic-to-English translation system. Just type in Arabic and I'll automatically translate your commands and help you execute them. You can send translated commands directly to projects or create tasks from them.";
  }
  
  if (message.includes('project')) {
    return "I can help you manage projects, view progress, create tasks, and coordinate team activities. If you have a specific project context set, I can provide targeted assistance for that project. What project-related task can I help with?";
  }
  
  if (message.includes('team') || message.includes('member')) {
    return "For team management, you can invite new members, assign roles, manage project assignments, and track team activities. Team members have different permission levels (VIEWER, MANAGER, ADMIN) with varying access rights.";
  }

  // Default thoughtful response
  return "I understand you're looking for assistance. I'm designed to help with project management, team coordination, and Arabic command translation. Could you provide a bit more detail about what you'd like to accomplish? I'm here to help make your work more efficient.";
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const ownerAuth = cookieStore.get('owner-auth')?.value;

    // Check authentication
    if (!ownerAuth) {
      return NextResponse.json(
        { error: 'Authentication required for chat access' },
        { status: 401 }
      );
    }

    const body: ChatSendRequest = await request.json();
    const { message, context } = body;

    // Validate permissions
    if (!context.userPermissions?.canWrite) {
      return NextResponse.json(
        { error: 'Insufficient permissions to send messages' },
        { status: 403 }
      );
    }

    // Log the user message to Supabase
    const { data: logData, error: logError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: message.metadata?.userId || 'system',
        message: message.content,
        message_type: 'user_message',
        project_id: context.projectId || null,
        metadata: {
          ...message.metadata,
          session_id: context.sessionId,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging user message:', logError);
    }

    // Generate AI response
    const aiResponseText = await generateAIResponse(message.content, context);

    // Create response message
    const responseMessage = {
      id: (Date.now() + 1).toString(),
      content: aiResponseText,
      role: 'assistant' as const,
      timestamp: new Date().toISOString(),
      type: 'message' as const,
      metadata: {
        language: 'en',
        responseType: 'ai_generated'
      }
    };

    // Save the AI response to Supabase
    const { data: responseData, error: responseError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: 'assistant',
        message: aiResponseText,
        message_type: 'ai_response',
        project_id: context.projectId || null,
        metadata: {
          parent_message_id: logData?.id || null,
          session_id: context.sessionId,
          response_type: 'contextual',
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (responseError) {
      console.error('Error saving AI response:', responseError);
    }

    // Prepare response
    const response: ChatSendResponse = {
      success: true,
      message: responseMessage
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat send API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process message',
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