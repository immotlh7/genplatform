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
        { error: 'Authentication required to view projects' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const includeStats = searchParams.get('include_stats') === 'true';

    // Fetch projects
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: projects, error: projectsError } = await query;

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    // Add task statistics if requested
    let enhancedProjects = projects || [];
    
    if (includeStats) {
      for (const project of enhancedProjects) {
        // Get task count
        const { count: taskCount } = await supabase
          .from('project_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id);

        // Get completed task count
        const { count: completedCount } = await supabase
          .from('project_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id)
          .eq('status', 'completed');

        project.taskCount = taskCount || 0;
        project.completedTasks = completedCount || 0;
        project.isAccessible = true; // All projects are accessible in this context
      }
    } else {
      // Add basic task count without detailed stats
      enhancedProjects = await Promise.all(
        enhancedProjects.map(async (project) => {
          const { count: taskCount } = await supabase
            .from('project_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          return {
            ...project,
            taskCount: taskCount || 0,
            isAccessible: true
          };
        })
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        projects: enhancedProjects,
        total: enhancedProjects.length
      }
    });

  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch projects',
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