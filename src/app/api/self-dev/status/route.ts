import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_FILE = '/root/genplatform/data/task-queue/task-queue.json';
const CONFIG_FILE = '/root/genplatform/data/self-dev-config.json';

interface SelfDevConfig {
  autoMode: boolean;
  lastUpdated: string;
}

async function getConfig(): Promise<SelfDevConfig> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { autoMode: false, lastUpdated: new Date().toISOString() };
  }
}

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

    // Get config
    const config = await getConfig();

    // Sync auto-mode between config and queue
    if (queue && config.autoMode !== undefined) {
      queue.autoMode = config.autoMode;
    }

    return NextResponse.json({
      queue,
      autoMode: config.autoMode,
      configLastUpdated: config.lastUpdated
    });
    
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}