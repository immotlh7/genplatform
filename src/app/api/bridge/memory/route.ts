import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
try {
const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';
const filePath = request.nextUrl.searchParams.get('path');
if (filePath) {
  const res = await fetch(`${BRIDGE_URL}/api/memory-file?path=${encodeURIComponent(filePath)}`, { cache: 'no-store' });
  return NextResponse.json(await res.json());
}

const res = await fetch(`${BRIDGE_URL}/api/memory`, { cache: 'no-store' });
const raw = await res.json();
const files = raw.files || [];
const tree: any[] = [];
const folders: Record<string, any> = {};

files.forEach((f: any) => {
  if (f.name.startsWith('.')) return;
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
      modified: f.modified
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
return NextResponse.json({ error: e.message, tree: [], files: [] }, { status: 500 });
}
}
export async function PUT(request: NextRequest) {
try {
const BRIDGE_URL = process.env.BRIDGE_API_URL || 'http://localhost:3001';
const body = await request.json();
const { path: filePath, content } = body;
if (!filePath || content === undefined) {
  return NextResponse.json({ error: 'path and content required' }, { status: 400 });
}

const res = await fetch(`${BRIDGE_URL}/api/memory/${encodeURIComponent(filePath)}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content })
});

const data = await res.json();
return NextResponse.json(data);
} catch (e: any) {
return NextResponse.json({ error: e.message }, { status: 500 });
}
}
