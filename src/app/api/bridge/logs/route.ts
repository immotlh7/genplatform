import { NextRequest, NextResponse } from 'next/server';

const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(BRIDGE_URL + '/api/logs');
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch logs from Bridge API' },
        { status: response.status }
      );
    }

    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    // Parse JSON log lines
    const logs = lines.map(line => {
      try {
        const parsed = JSON.parse(line);
        return {
          timestamp: parsed.timestamp || new Date().toISOString(),
          level: parsed.level || 'info',
          message: parsed.message || line
        };
      } catch {
        // Fallback for non-JSON lines
        return {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: line
        };
      }
    });

    // Return last 100 logs
    return NextResponse.json(logs.slice(-100));
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}