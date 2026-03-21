export async function notify(type: string, message: string, options?: { projectId?: string; link?: string }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    await fetch(`${baseUrl}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message, ...options })
    });
  } catch {}
}
