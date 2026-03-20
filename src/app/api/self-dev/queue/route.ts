import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_FILE = '/root/genplatform/data/task-queue.json';

export async function GET(request: NextRequest) {
  try {
    // Check if file exists
    try {
      await fs.access(TASK_QUEUE_FILE);
    } catch {
      // File doesn't exist, return empty structure
      return NextResponse.json({
        files: [],
        currentMessage: null,
        overallProgress: {
          done: 0,
          total: 0,
          percentage: 0
        }
      });
    }
    
    // Read and parse the file
    const content = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
    const data = JSON.parse(content);
    
    // Ensure proper structure
    const response = {
      files: data.files || [],
      currentMessage: data.currentMessage || null,
      overallProgress: data.overallProgress || {
        done: 0,
        total: 0,
        percentage: 0
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Failed to read task queue:', error);
    return NextResponse.json({
      files: [],
      currentMessage: null,
      overallProgress: {
        done: 0,
        total: 0,
        percentage: 0
      }
    }, { status: 200 }); // Return 200 with empty data instead of error
  }
}