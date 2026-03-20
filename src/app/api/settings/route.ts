import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = '/root/genplatform/data/settings.json';

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Default settings
const defaultSettings = {
  fullName: '',
  email: '',
  timezone: 'UTC',
  dailyReports: true,
  systemAlerts: true
};

export async function GET() {
  try {
    ensureDataDir();
    
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const settings = JSON.parse(data);
      return NextResponse.json(settings);
    }
    
    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('Error reading settings:', error);
    return NextResponse.json(defaultSettings);
  }
}

export async function PUT(request: Request) {
  try {
    ensureDataDir();
    
    const body = await request.json();
    
    // Merge with existing settings
    let existingSettings = defaultSettings;
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      existingSettings = JSON.parse(data);
    }
    
    const newSettings = {
      ...existingSettings,
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));
    
    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
