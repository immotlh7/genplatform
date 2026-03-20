import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASK_QUEUE_DIR = '/root/genplatform/data/task-queue';

export async function POST(request: NextRequest) {
  try {
    const { fileId, content } = await request.json();
    
    if (!fileId || !content) {
      return NextResponse.json({ error: 'Missing fileId or content' }, { status: 400 });
    }
    
    // Parse the file content to find all messages and tasks
    const messages = parseTaskFile(content);
    
    // Create task queue directory if it doesn't exist
    await fs.mkdir(TASK_QUEUE_DIR, { recursive: true });
    
    // Create task queue structure
    const taskQueue = {
      fileId,
      fileName: fileId.replace(/^task_\d+_/, ''),
      totalMessages: messages.length,
      totalMicroTasks: messages.reduce((sum, msg) => sum + msg.tasks.length, 0),
      messages: messages.map((msg, idx) => ({
        messageNumber: idx + 1,
        summary: msg.title,
        originalContent: msg.content,
        tasks: msg.tasks.map((task, taskIdx) => ({
          taskId: `task_${idx + 1}_${taskIdx + 1}`,
          taskNumber: taskIdx + 1,
          originalDescription: task,
          status: 'pending',
          approved: false,
          rewritten: false,
          microTasks: [] // Will be filled by rewrite step
        }))
      })),
      analyzedAt: new Date().toISOString(),
      status: 'analyzed'
    };
    
    // Save to queue file
    const queuePath = path.join(TASK_QUEUE_DIR, `${fileId}.json`);
    await fs.writeFile(queuePath, JSON.stringify(taskQueue, null, 2));
    
    // Return analysis data
    return NextResponse.json({
      fileId,
      analysis: {
        totalMessages: taskQueue.totalMessages,
        totalMicroTasks: taskQueue.totalMicroTasks,
        messages: taskQueue.messages
      },
      analyzedAt: taskQueue.analyzedAt,
      status: 'analyzed'
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

function parseTaskFile(content: string): Array<{title: string, content: string, tasks: string[]}> {
  const messages = [];
  
  // Split by message separator (# ─────)
  const sections = content.split(/^#{1,2}\s*─+/m).filter(s => s.trim());
  
  for (const section of sections) {
    const lines = section.trim().split('\n');
    if (lines.length === 0) continue;
    
    // First line is usually the title
    let title = lines[0].trim();
    if (title.startsWith('#')) {
      title = title.replace(/^#+\s*/, '');
    }
    
    // Find all tasks in this section
    const tasks = [];
    const taskPattern = /^Task\s+\d+:|^-\s+Task\s+\d+:|^\d+\.\s+/gm;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (taskPattern.test(line)) {
        // Extract the task description
        let taskDesc = line.replace(/^(Task\s+\d+:|-\s+Task\s+\d+:|\d+\.)\s*/, '').trim();
        
        // Check if task continues on next lines
        let j = i + 1;
        while (j < lines.length && !taskPattern.test(lines[j]) && lines[j].trim() && !lines[j].startsWith('#')) {
          taskDesc += ' ' + lines[j].trim();
          j++;
        }
        
        if (taskDesc) {
          tasks.push(taskDesc);
        }
      }
    }
    
    // If we found tasks, add this message
    if (tasks.length > 0 || title) {
      messages.push({
        title: title || `Message ${messages.length + 1}`,
        content: section.trim(),
        tasks: tasks
      });
    }
  }
  
  // If no messages found with separator, try to parse as a single message
  if (messages.length === 0) {
    const tasks = [];
    const lines = content.split('\n');
    const taskPattern = /^Task\s+\d+:|^-\s+Task\s+\d+:|^\d+\.\s+/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (taskPattern.test(line)) {
        let taskDesc = line.replace(/^(Task\s+\d+:|-\s+Task\s+\d+:|\d+\.)\s*/, '').trim();
        
        // Check if task continues on next lines
        let j = i + 1;
        while (j < lines.length && !taskPattern.test(lines[j]) && lines[j].trim()) {
          taskDesc += ' ' + lines[j].trim();
          j++;
        }
        
        if (taskDesc) {
          tasks.push(taskDesc);
        }
      }
    }
    
    if (tasks.length > 0) {
      messages.push({
        title: 'Tasks',
        content: content,
        tasks: tasks
      });
    }
  }
  
  return messages;
}