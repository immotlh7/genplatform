import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const LOG_PATH = path.join(process.cwd(), 'data', 'execution-log.json');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    let logs: any[] = [];
    try {
      const data = await fs.readFile(LOG_PATH, 'utf-8');
      logs = JSON.parse(data);
    } catch {
      return NextResponse.json({ logs: [], total: 0 });
    }

    // Filter by project if projectId is in the entry
    let filtered = logs;
    if (projectId && projectId !== 'all') {
      filtered = logs.filter((entry: any) => 
        !entry.projectId || entry.projectId === projectId
      );
    }

    // Sort by timestamp descending, take last 20
    const sorted = filtered
      .sort((a: any, b: any) => {
        const ta = new Date(a.timestamp || a.completedAt || 0).getTime();
        const tb = new Date(b.timestamp || b.completedAt || 0).getTime();
        return tb - ta;
      })
      .slice(0, 20);

    return NextResponse.json({ logs: sorted, total: filtered.length });
  } catch (error: any) {
    return NextResponse.json({ logs: [], total: 0, error: error.message });
  }
}
