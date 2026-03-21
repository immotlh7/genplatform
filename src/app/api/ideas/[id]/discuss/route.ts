import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const GATEWAY = 'http://127.0.0.1:18789/v1/chat/completions';
const TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || 'bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { message, currentAnalysis } = await req.json();
  
  const prompt = `You are managing a product analysis document. The user wants to modify it.

Current project: ${currentAnalysis?.projectName || 'Unknown'}
Current features count: ${currentAnalysis?.coreFeatures?.length || 0}
Current features: ${JSON.stringify((currentAnalysis?.coreFeatures || []).map((f: any) => ({ id: f.id, name: f.name })))}

User message: "${message}"

Analyze what the user wants and return ONLY valid JSON (no markdown):
{
  "action": "add_feature|remove_feature|add_suggestion|update_section|answer_question",
  "targetId": "ID of item to modify (if applicable, otherwise null)",
  "newData": { "name": "...", "description": "...", "userValue": "...", "complexity": "medium", "impact": "high" },
  "reply": "conversational reply to show the user (in the same language they used)",
  "changes": ["human readable list of what changed"]
}

Be smart about detecting intent. Arabic and English both supported.
If user says 'أضف' or 'add' → action is add_feature
If user says 'احذف' or 'remove' → action is remove_feature
If user says 'غيّر' or 'change' → action is update_section
If it's a question → action is answer_question`;

  try {
    const res = await fetch(GATEWAY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
      body: JSON.stringify({ model: 'openclaw', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '{}';
    
    const action = JSON.parse(reply.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
    
    // Apply the change to the stored idea
    const ideasPath = path.join(process.cwd(), 'data', 'ideas.json');
    let ideas: any[] = [];
    try { ideas = JSON.parse(await fs.readFile(ideasPath, 'utf-8')); } catch {}
    const idea = ideas.find((i: any) => i.id === params.id);
    
    if (idea?.analysis?.expanded) {
      if (action.action === 'add_feature' && action.newData) {
        idea.analysis.expanded.coreFeatures = idea.analysis.expanded.coreFeatures || [];
        idea.analysis.expanded.coreFeatures.push({ ...action.newData, id: `F${Date.now()}`, userAdded: true });
      } else if (action.action === 'remove_feature' && action.targetId) {
        idea.analysis.expanded.coreFeatures = (idea.analysis.expanded.coreFeatures || [])
          .filter((f: any) => f.id !== action.targetId);
      } else if (action.action === 'add_suggestion' && action.newData) {
        idea.analysis.expanded.suggestedAdditions = idea.analysis.expanded.suggestedAdditions || [];
        idea.analysis.expanded.suggestedAdditions.push({ ...action.newData, id: `A${Date.now()}`, userAdded: true });
      }
      
      idea.updatedAt = new Date().toISOString();
      await fs.writeFile(ideasPath, JSON.stringify(ideas, null, 2));
    }
    
    return NextResponse.json(action);
  } catch (e: any) {
    return NextResponse.json({ action: 'answer_question', reply: `خطأ: ${e.message}`, changes: [] });
  }
}
