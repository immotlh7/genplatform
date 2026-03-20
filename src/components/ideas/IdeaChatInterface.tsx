'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, CheckCircle, MessageCircle, Sparkles, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'ai';
  content: string;
  stage?: string;
  actions?: string[];
}

interface Props {
  ideaId: string;
  onApprove?: (ideaTitle: string, ideaDesc: string) => void;
}

export function IdeaChatInterface({ ideaId, onApprove }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: '## مرحباً! 👋\n\nأنا مستعد لتحليل فكرتك بعمق.\n\nأخبرني عن فكرتك — يمكنك الكتابة بحرية بالعربية أو الإنجليزية. كلما أعطيتني تفاصيل أكثر، كان تحليلي أدق.',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('initial');
  const [context, setContext] = useState('');
  const [ideaTitle, setIdeaTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText?: string, messageStage?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);

    // Extract potential idea title from first message
    if (stage === 'initial' && !ideaTitle) {
      setIdeaTitle(text.substring(0, 60));
    }

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/api/ideas/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId,
          message: text,
          stage: messageStage || stage,
          context
        })
      });

      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'ai', content: data.reply, stage: data.stage, actions: data.actions }]);
        setStage(data.stage);
        setContext(prev => prev + '\n' + data.reply);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: '❌ حدث خطأ. حاول مرة أخرى.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: string) => {
    if (action === 'approve') {
      onApprove?.(ideaTitle, context.substring(0, 200));
    } else if (action === 'discuss') {
      sendMessage('أريد مناقشة التحليل أكثر وطرح بعض الأسئلة', 'discuss');
    } else if (action === 'improve') {
      sendMessage('هل يمكنك اقتراح تحسينات إضافية لرفع قيمة المشروع؟', 'improve');
    } else if (action === 'reject') {
      setMessages(prev => [...prev, { role: 'ai', content: '✅ تم حفظ الفكرة للمراجعة لاحقاً. يمكنك العودة إليها في أي وقت.' }]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3'
              : 'bg-card border rounded-2xl rounded-tl-sm px-4 py-3'
            }`}>
              {msg.role === 'ai' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}

              {/* Action buttons after AI response */}
              {msg.role === 'ai' && msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
                  {msg.actions.includes('approve') && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                      onClick={() => handleAction('approve')}>
                      <CheckCircle className="h-3.5 w-3.5" /> موافق — أطلق المشروع
                    </Button>
                  )}
                  {msg.actions.includes('discuss') && (
                    <Button size="sm" variant="outline" className="gap-1.5"
                      onClick={() => handleAction('discuss')}>
                      <MessageCircle className="h-3.5 w-3.5" /> ناقش
                    </Button>
                  )}
                  {msg.actions.includes('improve') && (
                    <Button size="sm" variant="outline" className="gap-1.5"
                      onClick={() => handleAction('improve')}>
                      <Sparkles className="h-3.5 w-3.5" /> اقتراح تحسينات
                    </Button>
                  )}
                  {msg.actions.includes('reject') && (
                    <Button size="sm" variant="ghost" className="text-muted-foreground gap-1.5"
                      onClick={() => handleAction('reject')}>
                      <XCircle className="h-3.5 w-3.5" /> تجاهل
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-muted-foreground">جاري التحليل العميق...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={stage === 'initial' ? 'أخبرني عن فكرتك...' : 'اكتب ردك أو سؤالك...'}
            className="min-h-[52px] max-h-[120px] resize-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="self-end">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Ctrl+Enter للإرسال</p>
      </div>
    </div>
  );
}
