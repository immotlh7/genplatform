import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { notify } from '@/lib/notify';

const GATEWAY = 'http://127.0.0.1:18789/v1/chat/completions';
const TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || 'bd8c8bd58ce00e2cebbcff1d7c406fdb5eca73f38da0d7df';

async function callGateway(prompt: string, maxTokens = 4000): Promise<string> {
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
    body: JSON.stringify({
      model: 'openclaw',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function safeJSON(text: string): any {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch { return { raw: text }; }
}

export async function POST(req: Request) {
  const { ideaText, ideaId } = await req.json();
  if (!ideaText?.trim()) return NextResponse.json({ error: 'No idea text' }, { status: 400 });

  try {
    await notify('analysis_started', `Analyzing: "${ideaText.slice(0, 50)}..."`, { link: '/dashboard/ideas' });

    // Single comprehensive analysis call
    const expansionPrompt = `
You are an expert product visionary and strategist. A user gave you this idea:
"${ideaText}"

Generate a COMPLETE project vision document. Be exhaustive and detailed.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "projectName": "suggested name",
  "tagline": "one line description",
  "vision": "full vision paragraph (2-3 sentences)",
  
  "marketOpportunity": {
    "tam": "Total Addressable Market size",
    "sam": "Serviceable Addressable Market",
    "som": "Serviceable Obtainable Market",
    "summary": "2-3 sentences about the opportunity"
  },
  
  "coreFeatures": [
    {
      "id": "F001",
      "name": "feature name",
      "description": "detailed description",
      "userValue": "why users need this",
      "complexity": "low|medium|high",
      "impact": "low|medium|high"
    }
  ],
  
  "suggestedAdditions": [
    {
      "id": "A001", 
      "name": "addition name",
      "description": "what it adds",
      "inspiration": "where the idea came from",
      "impact": "high|medium|low"
    }
  ],
  
  "pages": [
    {
      "id": "P001",
      "name": "page name",
      "route": "/route",
      "purpose": "what this page does",
      "components": ["component1", "component2"],
      "wireframeDescription": "describe the layout"
    }
  ],
  
  "agents": [
    {
      "name": "agent name",
      "role": "what it does",
      "capabilities": ["capability1"],
      "triggers": "when it activates"
    }
  ],
  
  "techStack": {
    "frontend": { "framework": "...", "why": "...", "cost": "..." },
    "backend": { "framework": "...", "why": "...", "cost": "..." },
    "database": { "type": "...", "why": "...", "cost": "..." },
    "aiModels": [{ "name": "...", "useCase": "...", "cost": "..." }],
    "infrastructure": { "hosting": "...", "cdn": "...", "cost": "..." }
  },
  
  "financials": {
    "monthlyCosts": { "hosting": "$X", "ai": "$X", "apis": "$X", "total": "$X" },
    "revenueModel": "how the product makes money",
    "pricing": [{ "plan": "...", "price": "...", "features": ["..."] }],
    "projections": { "month3": "...", "month6": "...", "month12": "..." }
  },
  
  "competitors": [
    {
      "name": "competitor",
      "strengths": "what they do well",
      "weaknesses": "where they fall short",
      "ourAdvantage": "how we beat them"
    }
  ],
  
  "phases": [
    {
      "name": "Phase 1: MVP",
      "duration": "X weeks",
      "goal": "what we ship",
      "features": ["F001", "F002"],
      "successMetrics": ["metric1"]
    }
  ],
  
  "risks": [
    { "risk": "...", "probability": "low|medium|high", "mitigation": "..." }
  ]
}

Include at least 8 core features, 5 suggested additions, 6 pages, 3 agents, 4 competitors, 3 phases, and 5 risks.
Answer in the same language as the user's idea.`;

    const expansion = await callGateway(expansionPrompt, 8000);
    const expandedData = safeJSON(expansion);
    
    // Save analysis
    const ideasPath = path.join(process.cwd(), 'data', 'ideas.json');
    let ideas: any[] = [];
    try { ideas = JSON.parse(await fs.readFile(ideasPath, 'utf-8')); } catch {}
    
    const ideaRecord = {
      id: ideaId || Date.now().toString(),
      ideaText,
      status: 'analyzed',
      analysis: {
        expanded: expandedData
      },
      approvedFeatures: [],
      skippedFeatures: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const idx = ideas.findIndex((i: any) => i.id === ideaRecord.id);
    if (idx >= 0) ideas[idx] = ideaRecord;
    else ideas.push(ideaRecord);
    
    await fs.writeFile(ideasPath, JSON.stringify(ideas, null, 2));
    await notify('analysis_complete', `Analysis complete: ${expandedData.projectName || 'New project'}`, { link: '/dashboard/ideas' });
    
    return NextResponse.json({ ideaId: ideaRecord.id, analysis: expandedData });
    
  } catch (error: any) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
