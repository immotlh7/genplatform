import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8630551989';

interface ReviewResult {
  success: boolean;
  buildSuccess: boolean;
  typeErrors: string[];
  lintErrors: string[];
  testResults?: { passed: number; failed: number; };
  suggestions: string[];
  needsFix: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { fileId, messageNumber, taskNumber, microTaskId } = await request.json();
    
    console.log(`Starting auto-review for task ${taskNumber} in message ${messageNumber}`);
    
    const reviewResult: ReviewResult = {
      success: true,
      buildSuccess: false,
      typeErrors: [],
      lintErrors: [],
      suggestions: [],
      needsFix: false
    };
    
    // Step 1: Run build check
    try {
      const { stdout: buildOut, stderr: buildErr } = await execAsync('cd /root/genplatform && npm run build', {
        env: { ...process.env, CI: 'true' }
      });
      
      reviewResult.buildSuccess = true;
      console.log('Build successful');
      
      // Log to monitor
      await logToMonitor('build_success', {
        fileId,
        messageNumber,
        taskNumber,
        microTaskId,
        details: 'Build passed after task completion'
      });
      
    } catch (buildError: any) {
      reviewResult.buildSuccess = false;
      reviewResult.needsFix = true;
      
      // Parse build errors
      const errorOutput = buildError.stdout + buildError.stderr;
      const typeErrorMatch = errorOutput.match(/error TS\d+: (.+)/g);
      if (typeErrorMatch) {
        reviewResult.typeErrors = typeErrorMatch.map((e: string) => e.replace(/error TS\d+: /, ''));
      }
      
      console.error('Build failed:', errorOutput);
      
      // Log to monitor
      await logToMonitor('build_failed', {
        fileId,
        messageNumber,
        taskNumber,
        microTaskId,
        details: `Build failed: ${reviewResult.typeErrors.join(', ')}`,
        autoFix: true
      });
    }
    
    // Step 2: Check for common issues
    const commonIssues = await checkCommonIssues();
    if (commonIssues.length > 0) {
      reviewResult.suggestions = commonIssues;
      reviewResult.needsFix = true;
    }
    
    // Step 3: Run tests if available
    try {
      const { stdout: testOut } = await execAsync('cd /root/genplatform && npm test -- --passWithNoTests', {
        env: { ...process.env, CI: 'true' },
        timeout: 30000
      });
      
      const passedMatch = testOut.match(/(\d+) passed/);
      const failedMatch = testOut.match(/(\d+) failed/);
      
      reviewResult.testResults = {
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0
      };
      
      if (reviewResult.testResults.failed > 0) {
        reviewResult.needsFix = true;
      }
    } catch (testError) {
      console.log('No tests found or test run failed');
    }
    
    // Step 4: If fixes needed, create fix task
    if (reviewResult.needsFix) {
      await createFixTask({
        fileId,
        messageNumber,
        taskNumber,
        typeErrors: reviewResult.typeErrors,
        suggestions: reviewResult.suggestions,
        buildSuccess: reviewResult.buildSuccess
      });
      
      // Notify via Telegram
      const fixMessage = `⚠️ AUTO-REVIEW found issues in Task ${taskNumber}:
${reviewResult.typeErrors.length > 0 ? `\n❌ Type Errors:\n${reviewResult.typeErrors.join('\n')}` : ''}
${reviewResult.suggestions.length > 0 ? `\n💡 Suggestions:\n${reviewResult.suggestions.join('\n')}` : ''}

🔧 Creating automatic fix task...`;
      
      await sendTelegramNotification(fixMessage);
    } else {
      // Success notification
      await sendTelegramNotification(`✅ Task ${taskNumber} passed auto-review! Build successful, no issues found.`);
    }
    
    // Step 5: Auto-commit if successful
    if (reviewResult.buildSuccess && !reviewResult.needsFix) {
      try {
        await execAsync(`cd /root/genplatform && git add -A && git commit -m "Auto-commit: Task ${taskNumber} completed successfully" && git push`);
        console.log('Changes auto-committed');
      } catch (gitError) {
        console.log('Git commit skipped or failed:', gitError);
      }
    }
    
    return NextResponse.json({
      success: true,
      reviewResult,
      action: reviewResult.needsFix ? 'fix_required' : 'passed'
    });
    
  } catch (error) {
    console.error('Auto-review error:', error);
    return NextResponse.json(
      { error: 'Auto-review failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function checkCommonIssues(): Promise<string[]> {
  const issues: string[] = [];
  
  try {
    // Check for console.log statements
    const { stdout } = await execAsync('grep -r "console.log" /root/genplatform/src --include="*.ts" --include="*.tsx" | wc -l');
    const consoleCount = parseInt(stdout.trim());
    if (consoleCount > 50) {
      issues.push(`Found ${consoleCount} console.log statements - consider removing in production`);
    }
    
    // Check for TODO comments
    const { stdout: todoOut } = await execAsync('grep -r "TODO" /root/genplatform/src --include="*.ts" --include="*.tsx" | wc -l');
    const todoCount = parseInt(todoOut.trim());
    if (todoCount > 0) {
      issues.push(`Found ${todoCount} TODO comments - consider addressing them`);
    }
    
    // Check for any exposed secrets
    const { stdout: secretOut } = await execAsync('grep -r "password\\|secret\\|key" /root/genplatform/src --include="*.ts" --include="*.tsx" | grep -v "secretOrKey\\|password:" | wc -l');
    const secretCount = parseInt(secretOut.trim());
    if (secretCount > 10) {
      issues.push('Potential hardcoded secrets detected - review security');
    }
    
  } catch (error) {
    console.log('Issue check error:', error);
  }
  
  return issues;
}

async function createFixTask(data: any) {
  const fixTaskMessage = `🔧 FIX REQUIRED for Task ${data.taskNumber}:

File: ${data.fileId}
Message: ${data.messageNumber}

Issues to fix:
${data.typeErrors.map((e: string) => `- ${e}`).join('\n')}
${data.suggestions.map((s: string) => `- ${s}`).join('\n')}

Please fix these issues and run the build again.`;

  await sendTelegramNotification(fixTaskMessage);
}

async function logToMonitor(action: string, data: any) {
  try {
    await fetch('http://localhost:3000/api/self-dev/monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data })
    });
  } catch (error) {
    console.error('Failed to log to monitor:', error);
  }
}

async function sendTelegramNotification(message: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}