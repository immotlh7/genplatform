import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const EXECUTION_LOG_FILE = '/root/genplatform/data/execution-log.json';

export async function GET(request: NextRequest) {
  try {
    let logs = [];
    
    try {
      const data = await fs.readFile(EXECUTION_LOG_FILE, 'utf-8');
      logs = JSON.parse(data);
      
      // Return last 100 logs
      if (logs.length > 100) {
        logs = logs.slice(-100);
      }
    } catch (error) {
      // No log file yet, return empty array
    }

    return NextResponse.json(logs);
    
  } catch (error) {
    console.error('Logs error:', error);
    return NextResponse.json(
      { error: 'Failed to get logs' },
      { status: 500 }
    );
  }
}