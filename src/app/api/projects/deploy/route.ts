import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs/promises';

const CADDY_FILE = '/etc/caddy/Caddyfile';
const PROJECTS_FILE = '/root/genplatform/data/projects.json';

export async function POST(req: NextRequest) {
  try {
    const { projectId, subdomain, port } = await req.json();

    if (!projectId || !subdomain || !port) {
      return NextResponse.json({ error: 'projectId, subdomain, and port are required' }, { status: 400 });
    }

    const domain = `${subdomain}.gen3.ai`;

    // 1. التحقق من أن الـ subdomain غير مسجل مسبقاً
    const caddyContent = await fs.readFile(CADDY_FILE, 'utf-8');
    if (caddyContent.includes(`${domain} {`)) {
      return NextResponse.json({ message: `${domain} already configured`, domain, alreadyExists: true });
    }

    // 2. إضافة الـ subdomain إلى Caddyfile
    const newBlock = `\n${domain} {\n    reverse_proxy 127.0.0.1:${port}\n}\n`;
    await fs.appendFile(CADDY_FILE, newBlock);

    // 3. إعادة تحميل Caddy
    try {
      execSync('caddy reload --config /etc/caddy/Caddyfile', { timeout: 10000 });
    } catch (e: any) {
      // إذا فشل التحميل، نزيل الإضافة
      const restored = caddyContent;
      await fs.writeFile(CADDY_FILE, restored);
      return NextResponse.json({ error: `Caddy reload failed: ${e.message}` }, { status: 500 });
    }

    // 4. تحديث المشروع في قاعدة البيانات
    try {
      const projects = JSON.parse(await fs.readFile(PROJECTS_FILE, 'utf-8'));
      const proj = projects.find((p: any) => p.id === projectId);
      if (proj) {
        proj.subdomain = subdomain;
        proj.deployUrl = `https://${domain}`;
        proj.previewUrl = `https://${domain}`;
        await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
      }
    } catch {}

    return NextResponse.json({
      success: true,
      domain,
      url: `https://${domain}`,
      port,
      message: `تم تسجيل ${domain} بنجاح`
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
