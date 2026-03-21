import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = 'http://127.0.0.1:18789/v1/chat/completions';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || 'bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Support both formats: { message: { content } } and { message: "text" }
    let userMessage = '';
    let sessionId = 'web-chat-default';
    
    if (typeof body.message === 'string') {
      userMessage = body.message;
    } else if (body.message?.content) {
      userMessage = body.message.content;
    }
    
    if (!userMessage.trim()) {
      return NextResponse.json({ 
        success: false, 
        message: { id: Date.now().toString(), content: 'رسالة فارغة', role: 'assistant', timestamp: new Date().toISOString(), type: 'message' }
      });
    }

    // Build conversation history from context
    const previousMessages = (body.context?.previousMessages || body.history || [])
      .filter((m: any) => m.content && m.role)
      .slice(-10)
      .map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      }));

    // Use session ID for conversation continuity  
    if (body.context?.sessionId) {
      sessionId = body.context.sessionId;
    }

    const messages = [
      ...previousMessages,
      { role: 'user', content: userMessage }
    ];

    // Call OpenClaw Gateway - same agent, same tools, same memory as Telegram
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        'x-openclaw-agent-id': 'main',
        'x-openclaw-session-key': `web:${sessionId}`
      },
      body: JSON.stringify({
        model: 'openclaw',
        messages,
        user: sessionId,
        stream: false,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenClaw Gateway error:', response.status, errorText);
      return NextResponse.json({
        success: false,
        message: {
          id: Date.now().toString(),
          content: `خطأ في الاتصال بالـ Gateway (${response.status})`,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          type: 'message'
        }
      }, { status: 500 });
    }

    const data = await response.json();
    
    // Extract reply from OpenAI-compatible response
    const replyContent = data.choices?.[0]?.message?.content || 'لا يوجد رد';

    return NextResponse.json({
      success: true,
      reply: replyContent,
      message: {
        id: data.id || Date.now().toString(),
        content: replyContent,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        type: 'message',
        metadata: {
          model: data.model,
          via: 'openclaw-gateway',
          usage: data.usage
        }
      }
    });

  } catch (e: any) {
    console.error('Chat send error:', e);
    return NextResponse.json({
      success: false,
      reply: `خطأ: ${e.message}`,
      message: {
        id: Date.now().toString(),
        content: `خطأ: ${e.message}`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        type: 'message'
      }
    }, { status: 500 });
  }
}
