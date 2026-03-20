import { NextRequest } from 'next/server';
import { exec } from 'child_process';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const command = searchParams.get('cmd') || 'echo ready';
  const cwd = searchParams.get('cwd') || '/root/genplatform';

  const blocked = ['rm -rf', 'DROP', 'format'];
  for (const b of blocked) {
    if (command.toLowerCase().includes(b)) {
      return new Response('Blocked', { status: 403 });
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const child = exec(command, { cwd, env: { ...process.env } });

      child.stdout?.on('data', (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ output: data.toString() })}\n\n`));
      });

      child.stderr?.on('data', (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ output: data.toString(), type: 'error' })}\n\n`));
      });

      child.on('close', (code) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, code })}\n\n`));
        controller.close();
      });

      child.on('error', (err) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
