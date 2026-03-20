import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';

const SETTINGS_FILE = '/root/genplatform/data/settings.json';

const defaultSettings = {
  fullName: 'Med',
  timezone: 'UTC',
  email: 'owner@genplatform.ai',
  notifications: { dailyReports: true, systemAlerts: true, taskUpdates: true },
  updatedAt: new Date().toISOString()
};

export async function GET() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json(defaultSettings);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = { ...defaultSettings, ...body, updatedAt: new Date().toISOString() };
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
