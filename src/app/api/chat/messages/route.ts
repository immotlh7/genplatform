import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('chat_messages')
      .select('*')
      .in('message_type', ['user_message', 'ai_response', 'commander_request', 'commander_translation'])
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching chat messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Transform Supabase data to frontend format
    const messages = (data || []).map((msg: any) => ({
      id: msg.id.toString(),
      content: msg.message,
      role: msg.message_type === 'user_message' || msg.message_type === 'commander_request' 
        ? 'user' 
        : 'assistant',
      timestamp: msg.created_at,
      type: msg.message_type === 'commander_request' || msg.message_type === 'commander_translation'
        ? 'commander'
        : 'message',
      projectId: msg.project_id,
      metadata: {
        ...msg.metadata,
        userId: msg.user_id,
        isArabic: msg.message_type === 'commander_request',
        language: msg.message_type === 'commander_request' ? 'ar' : 'en'
      }
    }));

    return NextResponse.json({
      success: true,
      messages,
      count: messages.length
    });

  } catch (error) {
    console.error('Chat messages API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch chat messages',
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