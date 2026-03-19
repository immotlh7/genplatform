import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return owner as default team member
    return NextResponse.json({
      members: [
        {
          id: 'owner',
          email: 'owner@genplatform.ai',
          display_name: 'Med',
          role: 'OWNER',
          is_active: true,
          status: 'active',
          joined_at: '2026-03-01T00:00:00Z',
          last_active: new Date().toISOString(),
          avatar_url: null
        }
      ],
      total: 1
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, members: [] }, { status: 500 });
  }
}
