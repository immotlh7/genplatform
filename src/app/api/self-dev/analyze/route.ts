import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const ORCHESTRATOR_PROMPT = `You are the Orchestrator Agent for GenPlatform.ai. You receive development task files and decompose them into ultra-precise micro-tasks.

Rules:
1. Read the ENTIRE file content
2. Identify every message/section (separated by ── lines or # headers)  
3. For EACH message, break down into micro-tasks. Each micro-task must be:
   - ONE specific file change (not multiple files)
   - Include the EXACT file path
   - Include EXACTLY what to change (function name, line description)
   - Be completable in under 5 minutes
   - Be independent (no dependencies on unfinished tasks when possible)

4. Group micro-tasks into batches of 5 (each batch ends with build+test)
5. Never include PROTECTED files (see list below) in any task
6. Output as JSON

PROTECTED FILES (NEVER modify):
- src/app/dashboard/self-dev/**
- src/app/api/self-dev/**
- src/components/self-dev/**
- src/app/layout.tsx
- src/app/(dashboard)/layout.tsx
- src/components/layout/navbar.tsx
- src/app/globals.css

Output format:
{
  "totalMessages": 3,
  "totalMicroTasks": 45,
  "messages": [
    {
      "messageNumber": 1,
      "summary": "Fix Dashboard CPU display",
      "microTasks": [
        {
          "taskId": "task_1_1",
          "action": "edit",
          "filePath": "src/app/dashboard/page.tsx",
          "description": "In fetchMetrics function, replace Supabase call with fetch('/api/bridge/metrics')",
          "specificChanges": "Replace supabase.from('system_metrics') with fetch call, return resources.cpu.usage for cpuPercent",
          "estimatedMinutes": 3
        }
      ],
      "commitMessage": "Fix Dashboard to show real CPU data"
    }
  ],
  "executionPlan": {
    "batches": [
      {
        "batchNumber": 1,
        "taskIds": ["task_1_1", "task_1_2", "task_1_3", "task_1_4", "task_1_5"],
        "endsWith": "build_and_test"
      }
    ]
  }
}`;

export async function POST(request: NextRequest) {
  try {
    const { fileId, content } = await request.json();
    
    if (!fileId || !content) {
      return NextResponse.json({ error: 'Missing fileId or content' }, { status: 400 });
    }
    
    // Call Claude API (Sonnet) to analyze the file
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      temperature: 0,
      system: ORCHESTRATOR_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this task file and decompose it into micro-tasks:\n\n${content}`
        }
      ]
    });
    
    // Parse the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Extract JSON from the response (handle code blocks)
    let analysisResult;
    try {
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/({[\s\S]*})/);
      if (jsonMatch && jsonMatch[1]) {
        analysisResult = JSON.parse(jsonMatch[1]);
      } else {
        analysisResult = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      return NextResponse.json({ error: 'Failed to parse analysis result' }, { status: 500 });
    }
    
    // Store the analysis result
    const analysisData = {
      fileId,
      analysis: analysisResult,
      analyzedAt: new Date().toISOString(),
      status: 'analyzed'
    };
    
    // In production, you'd store this in a database
    // For now, we'll return it directly
    return NextResponse.json(analysisData);
    
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}