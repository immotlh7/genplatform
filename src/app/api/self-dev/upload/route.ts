import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_FILES_DIR = '/root/genplatform/data/task-files';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type
    if (!file.name.endsWith('.md')) {
      return NextResponse.json({ error: 'Only .md files are allowed' }, { status: 400 });
    }
    
    // Read file content
    const bytes = await file.arrayBuffer();
    const content = new TextDecoder().decode(bytes);
    
    // Generate unique file ID based on timestamp
    const fileId = `task_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(TASK_FILES_DIR, fileId);
    
    // Ensure directory exists
    await fs.mkdir(TASK_FILES_DIR, { recursive: true });
    
    // Save file
    await fs.writeFile(filePath, content);
    
    return NextResponse.json({
      fileId,
      fileName: file.name,
      rawContent: content,
      uploadedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}