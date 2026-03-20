import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';

export async function GET(request: NextRequest) {
  try {
    await fs.mkdir(TASK_QUEUE_DIR, { recursive: true });
    const files = await fs.readdir(TASK_QUEUE_DIR).catch(() => []);
    const queues = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const queuePath = path.join(TASK_QUEUE_DIR, file);
        const queueData = JSON.parse(await fs.readFile(queuePath, 'utf-8'));
        queues.push(queueData);
      } catch (error) {
        console.error(`Failed to read queue file ${file}:`, error);
      }
    }
    
    // Sort by upload date (newest first)
    queues.sort((a, b) => {
      const dateA = new Date(a.uploadedAt || 0).getTime();
      const dateB = new Date(b.uploadedAt || 0).getTime();
      return dateB - dateA;
    });
    
    return NextResponse.json({ queues });
  } catch (error) {
    console.error('Failed to load queues:', error);
    return NextResponse.json({ queues: [] });
  }
}