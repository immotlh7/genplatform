import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';
    const filePath = request.nextUrl.searchParams.get('path');

    if (filePath) {
      // Fetch specific file content
      const res = await fetch(`${BRIDGE_URL}/api/memory-file?path=${encodeURIComponent(filePath)}`, { cache: 'no-store' });
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Fetch memory tree
    const res = await fetch(`${BRIDGE_URL}/api/memory`, { cache: 'no-store' });
    const raw = await res.json();

    // Transform flat file list into tree structure
    const files = raw.files || [];
    const tree: any[] = [];
    const folders: Record<string, any> = {};

    files.forEach((f: any) => {
      if (f.name.startsWith('.')) return; // skip hidden
      const parts = f.path.split('/');
      if (parts.length === 1) {
        tree.push({
          name: f.name,
          path: '/' + f.path,
          type: 'file',
          size: f.size,
          modified: f.modified,
          category: f.name.endsWith('.md') ? 'document' : 'data'
        });
      } else {
        const folderName = parts[0];
        if (!folders[folderName]) {
          folders[folderName] = {
            name: folderName,
            path: '/' + folderName,
            type: 'folder',
            children: []
          };
          tree.push(folders[folderName]);
        }
        folders[folderName].children.push({
          name: f.name,
          path: '/' + f.path,
          type: 'file',
          size: f.size,
          modified: f.modified,
          category: f.name.endsWith('.md') ? 'document' : 'data'
        });
      }
    });

    const totalSize = files.reduce((sum: number, f: any) => sum + (f.size || 0), 0);

    return NextResponse.json({
      tree,
      files,
      stats: {
        totalFiles: files.length,
        totalFolders: Object.keys(folders).length,
        totalSize
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, tree: [], files: [], stats: {} }, { status: 500 });
  }
}
