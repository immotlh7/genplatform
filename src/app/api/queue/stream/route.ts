import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial status
      try {
        const [lock, logs, tracker] = await Promise.all([
          fs.readFile('/root/genplatform/data/execution-lock.json', 'utf-8').then(JSON.parse).catch(() => ({ locked: false })),
          fs.readFile('/root/genplatform/data/execution-log.json', 'utf-8').then(JSON.parse).catch(() => []),
          fs.readFile('/root/genplatform/data/session-tracker.json', 'utf-8').then(JSON.parse).catch(() => ({})),
        ]);

        send({
          event: 'connected',
          isRunning: lock.locked,
          currentTask: lock.taskId,
          recentLogs: logs.slice(-5),
          tasksSinceReset: tracker.tasksSinceReset || 0,
        });

        // Poll for updates every 3 seconds
        let lastLogCount = logs.length;
        const interval = setInterval(async () => {
          try {
            const [newLock, newLogs] = await Promise.all([
              fs.readFile('/root/genplatform/data/execution-lock.json', 'utf-8').then(JSON.parse).catch(() => ({ locked: false })),
              fs.readFile('/root/genplatform/data/execution-log.json', 'utf-8').then(JSON.parse).catch(() => []),
            ]);

            if (newLogs.length > lastLogCount) {
              const newEntries = newLogs.slice(lastLogCount);
              lastLogCount = newLogs.length;
              send({ event: 'log_update', logs: newEntries, isRunning: newLock.locked });
            }
          } catch {}
        }, 3000);

        // Clean up after 5 minutes
        setTimeout(() => {
          clearInterval(interval);
          controller.close();
        }, 5 * 60 * 1000);

      } catch (err) {
        send({ event: 'error', message: 'Failed to connect to queue' });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  });
}
