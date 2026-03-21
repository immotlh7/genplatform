import fs from 'fs';
import path from 'path';

// In-memory event store (shared across requests in same process)
const clients = new Set<ReadableStreamDefaultController>();

// Push event to all connected clients
export function broadcastEvent(type: string, data: any) {
  const message = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
  clients.forEach(controller => {
    try { controller.enqueue(new TextEncoder().encode(message)); } catch {}
  });
}

// Also save to execution-log.json
const LOG_PATH = path.join(process.cwd(), 'data', 'execution-log.json');

export function logEvent(type: string, message: string, projectId?: string) {
  const entry = {
    timestamp: new Date().toISOString(),
    type,
    message,
    projectId: projectId || null
  };
  
  try {
    let log: any[] = [];
    try { log = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8')); } catch {}
    log.push(entry);
    // Keep last 500 entries
    if (log.length > 500) log = log.slice(-500);
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
  } catch {}
  
  broadcastEvent(type, { message, projectId });
}

// SSE endpoint
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      // Send initial connection message
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
    },
    cancel(controller) {
      clients.delete(controller);
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
