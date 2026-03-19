import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const authCookie = req.cookies.get('auth-token');
    if (!authCookie) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    
    const sessionData = JSON.parse(Buffer.from(authCookie.value, 'base64').toString());
    
    if (sessionData.role === 'OWNER' && sessionData.exp > Math.floor(Date.now() / 1000)) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: sessionData.userId || 'owner',
          email: sessionData.email || 'owner@genplatform.ai',
          displayName: sessionData.displayName || 'Med',
          role: 'OWNER'
        }
      });
    }
    
    return NextResponse.json({ authenticated: false, user: null });
  } catch (e) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
