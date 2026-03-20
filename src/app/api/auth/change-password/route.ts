import { NextResponse } from 'next/server';
import fs from 'fs';

const AUTH_FILE = '/root/genplatform/data/auth.json';

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = '/root/genplatform/data';
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;
    
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    
    ensureDataDir();
    
    // Load existing auth data or create new
    let authData: { password?: string; updatedAt?: string } = {};
    if (fs.existsSync(AUTH_FILE)) {
      const data = fs.readFileSync(AUTH_FILE, 'utf-8');
      authData = JSON.parse(data);
    }
    
    // Update password (in production, this should be hashed)
    authData.password = password;
    authData.updatedAt = new Date().toISOString();
    
    fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2));
    
    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
