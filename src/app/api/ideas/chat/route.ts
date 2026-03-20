import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

const SYSTEM_PROMPT = `You are an expert Idea Analyst for GenPlatform.ai. Your role is to deeply analyze ideas and provide structured, professional analysis in Arabic or English (match the user's language).

When analyzing an idea, ALWAYS respond with this exact Markdown structure:

## 🔍 تحليل الفكرة: [Idea Name]

### فهم الفكرة
[2-3 sentence summary of what you understood]

### 💎 القيمة المقترحة
[What makes this idea unique and valuable]

### 📊 تحليل السوق
| المنافس | نقاط القوة | نقاط الضعف | ميزتنا |
|---------|-----------|-----------|--------|
| [Comp 1] | ... | ... | ... |
| [Comp 2] | ... | ... | ... |

### ✨ المميزات الأساسية المقترحة
1. **[Feature 1]** — [description + why important]
2. **[Feature 2]** — [description]
3. **[Feature 3]** — [description]

### 💡 إضافات تُعزّز المشروع
- **[Add-on 1]**: [description + impact on value]
- **[Add-on 2]**: [description]

### 🛠️ Stack التقني الموصى به
| الطبقة | الأداة | السبب |
|--------|--------|-------|
| Frontend | Next.js + TypeScript | ... |
| Backend | Node.js + Express | ... |
| AI | [suitable model] | ... |
| Database | PostgreSQL | ... |

### 💰 تقدير التكاليف الشهرية
| البند | التكلفة |
|------|---------|
| Hosting | $X/mo |
| AI APIs | $X/mo |
| **الإجمالي** | **$X/mo** |

### ⏱️ تقدير الوقت
- MVP: X weeks
- Full version: X months

---
هل تريد مناقشة أي جانب؟ أو نبدأ في التخطيط التقني؟

For discussion mode, respond naturally and helpfully.
For improvement suggestions, add new insights.
Keep responses focused and actionable.`;

export async function POST(request: NextRequest) {
  try {
    const { ideaId, message, stage = 'initial', context = '' } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const messages: any[] = [];

    // Add context if in discussion mode
    if (context && stage !== 'initial') {
      messages.push({ role: 'user', content: `Previous analysis context:\n${context}\n\nUser says: ${message}` });
    } else {
      messages.push({ role: 'user', content: `Analyze this idea: ${message}` });
    }

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';

    // Determine next stage and actions
    let nextStage = stage;
    let actions: string[] = [];

    if (stage === 'initial') {
      nextStage = 'analyzed';
      actions = ['approve', 'discuss', 'improve', 'reject'];
    } else if (stage === 'discuss') {
      nextStage = 'discuss';
      actions = ['approve', 'improve', 'reject'];
    } else if (stage === 'improve') {
      nextStage = 'analyzed';
      actions = ['approve', 'discuss', 'reject'];
    }

    // Save idea to disk if new
    if (stage === 'initial' && ideaId) {
      try {
        await fs.mkdir('/root/genplatform/data/ideas', { recursive: true });
        const ideaFile = `/root/genplatform/data/ideas/${ideaId}.json`;
        const existing = await fs.readFile(ideaFile, 'utf-8').then(JSON.parse).catch(() => null);
        if (!existing) {
          await fs.writeFile(ideaFile, JSON.stringify({
            id: ideaId,
            originalMessage: message,
            analysis: reply,
            stage: nextStage,
            createdAt: new Date().toISOString(),
          }, null, 2));
        }
      } catch {}
    }

    return NextResponse.json({ reply, stage: nextStage, actions });
  } catch (error: any) {
    console.error('Ideas chat error:', error);
    return NextResponse.json({ error: 'Failed to analyze idea', details: error.message }, { status: 500 });
  }
}
