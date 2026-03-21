import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Initialize Supabase client

interface AddContentRequest {
  projectId: string;
  content: {
    title: string;
    description: string;
    type: 'task' | 'idea' | 'note' | 'command';
    priority: 'low' | 'medium' | 'high';
    source: string;
    metadata?: {
      originalArabic?: string;
      englishTranslation?: string;
      confidence?: number;
      createdVia?: string;
      timestamp?: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const ownerAuth = cookieStore.get('owner-auth')?.value;

    // Check authentication
    if (!ownerAuth) {
      return NextResponse.json(
        { error: 'Authentication required to add project content' },
        { status: 401 }
      );
    }

    const body: AddContentRequest = await request.json();
    const { projectId, content } = body;

    // Validate input
    if (!projectId || !content.title || !content.description) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, title, description' },
        { status: 400 }
      );
    }

    // Check if project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Determine target table based on content type
    let targetTable = 'project_tasks';
    let insertData: any = {
      project_id: projectId,
      title: content.title,
      description: content.description,
      status: content.type === 'task' ? 'pending' : 'open',
      priority: content.priority.toUpperCase(),
      assigned_to: null,
      due_date: null,
      metadata: {
        source: content.source,
        content_type: content.type,
        created_via: 'commander_chat',
        ...content.metadata
      }
    };

    // Handle different content types
    switch (content.type) {
      case 'task':
        // Use project_tasks table
        insertData = {
          ...insertData,
          task_type: 'feature',
          estimated_hours: null
        };
        break;

      case 'idea':
        // Use ideas table
        targetTable = 'ideas';
        insertData = {
          title: content.title,
          description: content.description,
          status: 'pending',
          priority: content.priority.toUpperCase(),
          user_id: 'system',
          project_id: projectId,
          metadata: {
            source: content.source,
            content_type: content.type,
            created_via: 'commander_chat',
            ...content.metadata
          }
        };
        break;

      case 'note':
      case 'command':
        // Use project_tasks with special type
        insertData = {
          ...insertData,
          task_type: content.type,
          status: 'completed' // Notes and commands are informational
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported content type: ${content.type}` },
          { status: 400 }
        );
    }

    // Insert the content
    const { data: insertedData, error: insertError } = await supabase
      .from(targetTable)
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting content:', insertError);
      return NextResponse.json(
        { error: 'Failed to add content to project', details: insertError.message },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from('security_events').insert({
      event_type: 'content_added',
      description: `Added ${content.type} "${content.title}" to project ${project.name}`,
      user_id: 'system',
      severity: 'info',
      metadata: {
        project_id: projectId,
        content_type: content.type,
        content_id: insertedData.id,
        source: content.source,
        created_via: 'commander_chat'
      }
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: `${content.type.charAt(0).toUpperCase() + content.type.slice(1)} added to project successfully`,
      data: {
        id: insertedData.id,
        type: content.type,
        title: content.title,
        project: {
          id: project.id,
          name: project.name
        },
        created_at: insertedData.created_at || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Add content API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add content to project',
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