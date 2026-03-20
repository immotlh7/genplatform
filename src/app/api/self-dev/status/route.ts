import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_FILES_DIR = '/root/genplatform/data/task-files';

// In-memory storage for execution status (in production, use database)
const executionStatus = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    
    if (fileId) {
      // Get status for specific file
      const status = executionStatus.get(fileId) || { status: 'not_started' };
      return NextResponse.json(status);
    }
    
    // Get all files and their status
    const files = await fs.readdir(TASK_FILES_DIR).catch(() => []);
    const allStatus = [];
    
    for (const file of files) {
      const filePath = path.join(TASK_FILES_DIR, file);
      const stats = await fs.stat(filePath);
      const status = executionStatus.get(file) || { status: 'not_started' };
      
      allStatus.push({
        fileId: file,
        fileName: file.replace(/^task_\d+_/, ''),
        uploadedAt: stats.mtime.toISOString(),
        ...status
      });
    }
    
    return NextResponse.json({ files: allStatus });
    
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    const { fileId, ...statusData } = update;
    
    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }
    
    // Update status
    executionStatus.set(fileId, {
      ...executionStatus.get(fileId),
      ...statusData,
      lastUpdated: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}