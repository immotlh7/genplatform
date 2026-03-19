import { NextRequest, NextResponse } from 'next/server';
import { routeTask, departmentToRole } from '@/lib/task-router';

export async function POST(request: NextRequest) {
  try {
    const { tasks } = await request.json();
    
    if (!Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'Tasks must be an array' },
        { status: 400 }
      );
    }

    const assignments = tasks.map(task => {
      const routing = routeTask(task.name || '', task.description || '');
      
      return {
        taskId: task.id,
        department: routing.department,
        role: departmentToRole(routing.department),
        confidence: routing.confidence,
        reasoning: routing.reasoning
      };
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error in auto-assign:', error);
    return NextResponse.json(
      { error: 'Failed to process tasks' },
      { status: 500 }
    );
  }
}