import { NextRequest, NextResponse } from 'next/server';

const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(BRIDGE_URL + '/api/sessions');
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch sessions from Bridge API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}