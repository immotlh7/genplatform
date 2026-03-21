import { NextResponse } from 'next/server';
import { IdeaRepo } from '@/lib/repositories';

const GATEWAY = 'http://127.0.0.1:18789/v1/chat/completions';
const TOKEN   = 'bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { message, currentAnalysis } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  const idea = IdeaRepo.getById(id);
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });

  const projectName = currentAnalysis?.projectName || 'Unknown';
  const featureCount = currentAnalysis?.coreFeatures?.length || 0;

  const prompt = `You are managing a product analysis document.
The user wants to modify it.

Project: "${projectName}"
Current feature count: ${featureCount}
User message: "${message}"

Detect what the user wants and return JSON only:
{
  "action": "add_feature|remove_feature|add_suggestion|update_section|answer_question",
  "targetId": "ID of item to modify if applicable, or null",
  "newItem": {
    "id": "auto-generated ID like F099",
    "name": "feature name",
    "description": "what it does and why it matters",
    "impact": "high|medium|low",
    "complexity": "low|medium|high",
    "aiTools": [],
    "pages": []
  },
  "sectionName": "which section changes: coreFeatures|suggestedAdditions|pages|techStack|phases",
  "reply": "Friendly confirmation of what was done, in same language as user",
  "changes": ["human-readable description of each change"]
}

Rules:
- Arabic and English both supported — detect the language and reply in same language
- "أضف" or "add" = add_feature or add_suggestion
- "احذف" or "remove" or "delete" = remove_feature
- "غيّر" or "change" or "update" = update_section
- Any question = answer_question
- If unclear, ask for clarification via answer_question`;

  try {
    const res = await fetch(GATEWAY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
      body: JSON.stringify({ model: 'claude', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
    });

    if (!res.ok) throw new Error(`Gateway ${res.status}`);
    const data = await res.json();
    const rawReply = data.choices?.[0]?.message?.content || '{}';

    let action: any;
    try {
      action = JSON.parse(rawReply.replace(/```json|```/g, '').trim());
    } catch {
      return NextResponse.json({ action: 'answer_question', reply: rawReply, changes: [] });
    }

    if (action.action !== 'answer_question' && idea.analysis?.expanded) {
      const expanded = { ...idea.analysis.expanded };

      if (action.action === 'add_feature' && action.newItem) {
        expanded.coreFeatures = [...(expanded.coreFeatures || []), { ...action.newItem, userAdded: true }];
      }
      if (action.action === 'add_suggestion' && action.newItem) {
        expanded.suggestedAdditions = [...(expanded.suggestedAdditions || []), { ...action.newItem, userAdded: true }];
      }
      if (action.action === 'remove_feature' && action.targetId) {
        expanded.coreFeatures = (expanded.coreFeatures || []).filter((f: any) => f.id !== action.targetId);
        expanded.suggestedAdditions = (expanded.suggestedAdditions || []).filter((f: any) => f.id !== action.targetId);
      }

      IdeaRepo.update(id, { analysis: { ...idea.analysis, expanded } });
    }

    return NextResponse.json(action);
  } catch (e: any) {
    return NextResponse.json({ action: 'answer_question', reply: `Error: ${e.message}`, changes: [] });
  }
}
