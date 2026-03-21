import { subscribeSSE } from '@/lib/queue';
import { LogRepo, NotificationRepo } from '@/lib/repositories';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendInitial = () => {
        try {
          const log = LogRepo.getRecent(10);
          const unread = NotificationRepo.unreadCount();
          const msg = `data: ${JSON.stringify({
            event: 'connected',
            log,
            unreadNotifications: unread,
          })}\n\n`;
          controller.enqueue(encoder.encode(msg));
        } catch {}
      };
      sendInitial();

      const unsubscribe = subscribeSSE((data: string) => {
        try { controller.enqueue(encoder.encode(data)); } catch {}
      });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'ping' })}\n\n`));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 25000);

      (controller as any)._cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
    cancel(controller) {
      if ((controller as any)._cleanup) (controller as any)._cleanup();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
