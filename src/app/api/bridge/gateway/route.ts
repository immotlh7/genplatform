import { NextRequest, NextResponse } from 'next/server';

const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';
const RATE_LIMIT_MS = 2 * 60 * 1000; // 2 minutes

// Module-level timestamp for rate limiting
let lastRestartTime = 0;

export async function POST(request: NextRequest) {
  try {
    const now = Date.now();
    const timeSinceLastRestart = now - lastRestartTime;
    
    // Check rate limit
    if (timeSinceLastRestart < RATE_LIMIT_MS) {
      const waitSeconds = Math.ceil((RATE_LIMIT_MS - timeSinceLastRestart) / 1000);
      return NextResponse.json(
        { error: 'wait ' + waitSeconds + ' seconds' },
        { status: 429 }
      );
    }

    // Make request to Bridge API
    const response = await fetch(BRIDGE_URL + '/api/gateway/restart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to restart gateway via Bridge API' },
        { status: response.status }
      );
    }

    // Update last restart time on success
    lastRestartTime = now;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error restarting gateway:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}