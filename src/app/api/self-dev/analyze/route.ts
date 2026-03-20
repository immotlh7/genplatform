import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';
const TASK_FILES_DIR = '/root/genplatform/data/task-files';

export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json();
    
    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    // Read the uploaded file
    const filePath = path.join(TASK_FILES_DIR, fileId);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(fileId);
    
    // Parse messages - split by lines containing "─────"
    const messageSeparator = /^.*─+.*$/m;
    const rawMessages = fileContent.split(messageSeparator).filter(msg => msg.trim());
    
    const messages = rawMessages.map((content, index) => {
      const lines = content.trim().split('\n');
      
      // Extract title from first non-empty line
      let summary = 'Message ' + (index + 1);
      for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
          summary = line.trim().substring(0, 100);
          break;
        } else if (line.startsWith('# ')) {
          summary = line.replace(/^#\s*/, '').trim().substring(0, 100);
          break;
        }
      }
      
      // Count tasks - find all "Task N:" patterns
      const taskMatches = content.match(/Task \d+:/gi) || [];
      const tasks = taskMatches.map((match, taskIndex) => {
        const taskNumber = parseInt(match.match(/\d+/)?.[0] || '0');
        
        // Extract task description (text after "Task N:")
        const taskStartIndex = content.indexOf(match);
        const taskEndIndex = content.indexOf('\n', taskStartIndex);
        const description = content.substring(
          taskStartIndex + match.length, 
          taskEndIndex > -1 ? taskEndIndex : content.length
        ).trim();
        
        return {
          taskId: `${fileId}-msg${index + 1}-task${taskNumber}`,
          taskNumber: taskNumber,
          originalDescription: description || `Task ${taskNumber}`,
          status: 'pending',
          approved: false,
          rewritten: false,
          microTasks: []
        };
      });
      
      return {
        messageNumber: index + 1,
        summary: summary,
        originalContent: content.trim(),
        tasks: tasks
      };
    });
    
    // Count total micro-tasks (will be 0 until rewrite)
    const totalMicroTasks = 0;
    
    // Create task queue
    const taskQueue = {
      fileId: fileId,
      fileName: fileName,
      uploadedAt: new Date().toISOString(),
      totalMessages: messages.length,
      totalTasks: messages.reduce((sum, msg) => sum + msg.tasks.length, 0),
      totalMicroTasks: totalMicroTasks,
      messages: messages,
      status: 'analyzed',
      hasApprovedTasks: false
    };
    
    // Save to task queue directory
    await fs.mkdir(TASK_QUEUE_DIR, { recursive: true });
    const queuePath = path.join(TASK_QUEUE_DIR, fileId + '.json');
    await fs.writeFile(queuePath, JSON.stringify(taskQueue, null, 2));
    
    // Send immediate response (orchestrator analysis happens async)
    const response = {
      success: true,
      fileId: fileId,
      fileName: fileName,
      analysisResult: {
        totalMessages: messages.length,
        totalTasks: taskQueue.totalTasks,
        messages: messages.map(m => ({
          number: m.messageNumber,
          summary: m.summary,
          taskCount: m.tasks.length
        }))
      }
    };
    
    // Also send to Telegram for orchestrator analysis (async)
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '510906393';
    
    const orchestratorPrompt = `[ORCHESTRATOR] Analyze this uploaded file and prepare for task execution:

File: ${fileName}
Total Messages: ${messages.length}
Total Tasks: ${taskQueue.totalTasks}

I'll send each message for rewriting into micro-tasks.`;
    
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: orchestratorPrompt,
        parse_mode: 'Markdown'
      })
    }).catch(err => console.error('Failed to notify orchestrator:', err));
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}