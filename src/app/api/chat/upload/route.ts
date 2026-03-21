import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = '/root/genplatform/data/chat-uploads';

export async function POST(req: NextRequest) {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const ext = path.extname(file.name) || '.bin';
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(file.name);

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        savedAs: safeName,
        size: file.size,
        type: file.type,
        isImage,
        url: `/api/chat/upload/${safeName}`,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
