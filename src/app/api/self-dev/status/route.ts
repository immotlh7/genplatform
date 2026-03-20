import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_FILE = '/root/genplatform/data/task-queue/task-queue.json';

export async function GET(request: NextRequest) {
  try {
    // Read task queue
    let queue = null;
    try {
      const data = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
      queue = JSON.parse(data);
    } catch (error) {
      // No queue file yet
    }

    return NextResponse.json({
      queue
    });
    
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}