import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token");

    if (authToken && authToken.value) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: '1',
          email: 'owner@genplatform.ai',
          displayName: 'Med',
          name: 'Med',
          role: 'OWNER'
        }
      });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
