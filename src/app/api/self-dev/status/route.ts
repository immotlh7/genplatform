import { NextRequest, NextResponse } from 'next/server';
import { executionState } from '../control/route';

export async function GET(request: NextRequest) {
  try {
    // Calculate elapsed time if executing
    let elapsedTime = executionState.elapsedTime;
    if (executionState.status === 'executing' && executionState.startTime) {
      elapsedTime = Math.floor((Date.now() - executionState.startTime) / 1000);
    }
    
    const status = {
      status: executionState.status,
      overallProgress: executionState.overallProgress,
      contextEstimate: executionState.contextEstimate,
      elapsedTime: elapsedTime,
      currentMessage: executionState.currentMessage,
      currentFile: executionState.currentFile
    };
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        overallProgress: {
          filesTotal: 0,
          filesDone: 0,
          messagesTotal: 0,
          messagesDone: 0,
          tasksTotal: 0,
          tasksDone: 0,
          percentage: 0
        },
        contextEstimate: 0,
        elapsedTime: 0
      },
      { status: 200 }
    );
  }
}