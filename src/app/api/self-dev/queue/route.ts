import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_FILE = '/root/genplatform/data/task-queue/task-queue.json';
const CONFIG_FILE = '/root/genplatform/data/self-dev-config.json';

export async function GET(request: NextRequest) {
  try {
    // Load task queue
    let queue;
    try {
      const data = await fs.readFile(TASK_QUEUE_FILE, 'utf-8');
      queue = JSON.parse(data);
    } catch (error) {
      return NextResponse.json(null);
    }

    // Load config for autoMode
    let autoMode = false;
    try {
      const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
      const config = JSON.parse(configData);
      autoMode = config.autoMode || false;
    } catch {}

    // Add autoMode to queue
    queue.autoMode = autoMode;

    return NextResponse.json(queue);
  } catch (error) {
    console.error('Failed to load queue:', error);
    return NextResponse.json(null);
  }
}