import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
const LOG_PATH = path.join(process.cwd(), 'data', 'execution-log.json');
export async function GET() {
  try {
    const data = await fs.readFile(LOG_PATH, 'utf-8');
    const log = JSON.parse(data);
    return NextResponse.json(Array.isArray(log) ? log.slice(-50) : []);
  } catch { return NextResponse.json([]); }
}
