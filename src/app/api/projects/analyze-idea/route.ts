import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { callWithRotation } from '@/lib/account-rotation';

const SYSTEM = `You are an expert product strategist and technical architect.
Take ANY idea (even vague) and produce an exhaustive professional analysis.
RULES: Be specific to THIS idea. Extract implied features. Suggest AI tools. Be granular.
OUTPUT: Valid JSON only. No markdown outside JSON.`;

function generateSlug(text: string): string {
  return text.split(' ').slice(0, 3).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 30).replace(/-$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const { ideaText, projectId } = await req.json();
    if (!ideaText) return NextResponse.json({ error: 'ideaText required' }, { status: 400 });

    const userPrompt = `Idea: "${ideaText}"

Return ONLY this JSON (no other text):
{
  "projectName": "...",
  "tagline": "one line",
  "problemSolved": "...",
  "targetAudience": ["primary", "secondary"],
  "coreFeatures": [{"name":"...","description":"...","priority":"must|should|nice"}],
  "enhancementIdeas": [{"name":"...","description":"...","valueAdd":"..."}],
  "competitors": [{"name":"...","strengths":"...","weaknesses":"...","ourAdvantage":"..."}],
  "techStack": {"frontend":"...","backend":"...","database":"...","aiModels":[{"model":"...","useCase":"..."}]},
  "pages": [{"name":"...","route":"/...","role":"...","keyComponents":["..."]}],
  "costEstimation": {"hosting":"$X/mo","aiApis":"$X/mo","total":"$X/mo"},
  "timeline": {"mvp":"X weeks","fullVersion":"X months"},
  "slug": "${generateSlug(ideaText)}"
}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

    const response = await callWithRotation(async (apiKey) => {
      const client = new Anthropic({ apiKey });
      return await client.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 4000,
        system: SYSTEM,
        messages: [{ role: 'user', content: userPrompt }]
      });
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { projectName: 'New Project', slug: generateSlug(ideaText) };

    return NextResponse.json({ analysis, slug: analysis.slug || generateSlug(ideaText) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, analysis: { projectName: 'New Project', slug: 'new-project' } }, { status: 500 });
  }
}
