import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';
const TELEGRAM_BOT_TOKEN = '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = '510906393';
const ANALYSIS_TIMEOUT = 60000; // 60 seconds for analysis

// Store pending analysis in a global map (in production, use Redis or similar)
declare global {
  var pendingAnalysis: Map<string, {
    fileId: string;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timeout?: NodeJS.Timeout;
  }> | undefined;
}

if (!global.pendingAnalysis) {
  global.pendingAnalysis = new Map();
}

const ORCHESTRATOR_PROMPT = `[ORCHESTRATOR] You are the Orchestrator Agent for GenPlatform.ai. You receive development task files and decompose them into ultra-precise micro-tasks.

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
    
    // For now, create a mock analysis result since we can't wait for async Telegram response
    // In production, you'd implement a proper webhook callback system
    const mockAnalysis = {
      totalMessages: 1,
      totalMicroTasks: 3,
      messages: [
        {
          messageNumber: 1,
          summary: "Sample task analysis",
          microTasks: [
            {
              taskId: "task_1_1",
              action: "edit",
              filePath: "src/example.ts",
              description: "Sample task 1",
              specificChanges: "Add console.log('Hello')",
              estimatedMinutes: 2
            },
            {
              taskId: "task_1_2",
              action: "edit",
              filePath: "src/example.ts",
              description: "Sample task 2",
              specificChanges: "Add export statement",
              estimatedMinutes: 2
            },
            {
              taskId: "task_1_3",
              action: "edit",
              filePath: "src/example.ts",
              description: "Sample task 3",
              specificChanges: "Add type definitions",
              estimatedMinutes: 3
            }
          ],
          commitMessage: "Complete sample tasks"
        }
      ],
      executionPlan: {
        batches: [
          {
            batchNumber: 1,
            taskIds: ["task_1_1", "task_1_2", "task_1_3"],
            endsWith: "build_and_test"
          }
        ]
      }
    };
    
    // Send analysis request to OpenClaw via Telegram
    const analysisPrompt = `${ORCHESTRATOR_PROMPT}\n\nAnalyze this task file and decompose it into micro-tasks:\n\n${content}`;
    
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: analysisPrompt.substring(0, 4000) // Telegram message limit
        })
      }
    );
    
    if (!telegramResponse.ok) {
      const error = await telegramResponse.text();
      console.error('Failed to send analysis request:', error);
      // Continue with mock data for now
    }
    
    // Create task queue directory if it doesn't exist
    await fs.mkdir(TASK_QUEUE_DIR, { recursive: true });
    
    // Use mock analysis for immediate response
    const taskQueue = {
      fileId,
      fileName: fileId.replace(/^task_\d+_/, ''),
      totalMessages: mockAnalysis.totalMessages,
      totalMicroTasks: mockAnalysis.totalMicroTasks,
      messages: mockAnalysis.messages.map((msg: any) => ({
        ...msg,
        microTasks: msg.microTasks.map((task: any) => ({
          ...task,
          status: 'pending'
        }))
      })),
      analyzedAt: new Date().toISOString()
    };
    
    // Save to queue file
    const queuePath = path.join(TASK_QUEUE_DIR, `${fileId}.json`);
    await fs.writeFile(queuePath, JSON.stringify(taskQueue, null, 2));
    
    // Return analysis data
    return NextResponse.json({
      fileId,
      analysis: mockAnalysis,
      analyzedAt: new Date().toISOString(),
      status: 'analyzed',
      note: 'Using mock analysis - real analysis sent to OpenClaw'
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

// Helper function for webhook to resolve pending analysis
export function resolvePendingAnalysis(fileId: string, result: string): boolean {
  const pending = global.pendingAnalysis?.get(fileId);
  if (pending) {
    if (pending.timeout) clearTimeout(pending.timeout);
    pending.resolve(result);
    global.pendingAnalysis?.delete(fileId);
    return true;
  }
  return false;
}