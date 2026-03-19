import { NextRequest, NextResponse } from 'next/server';

const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(BRIDGE_URL + '/api/config');
    
    if (!response.ok) {
      // Return fallback config if Bridge API fails
      return NextResponse.json({
        agents: {
          defaults: {
            model: 'anthropic/claude-opus-4-20250514'
          }
        },
        version: 'OpenClaw 2026.3.13'
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching config:', error);
    // Return fallback config on error
    return NextResponse.json({
      agents: {
        defaults: {
          model: 'anthropic/claude-opus-4-20250514'
        }
      },
      version: 'OpenClaw 2026.3.13'
    });
  }
}