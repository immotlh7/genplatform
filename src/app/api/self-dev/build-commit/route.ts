import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const TELEGRAM_BOT_TOKEN = '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const TELEGRAM_CHAT_ID = '510906393';

export async function POST(request: NextRequest) {
  try {
    const { fileId, messageNumber, commitMessage } = await request.json();
    
    console.log(`Running final build and commit for message ${messageNumber}`);
    
    // Step 1: Run build
    let buildSuccess = false;
    let buildOutput = '';
    
    try {
      const { stdout, stderr } = await execAsync('cd /root/genplatform && npm run build', {
        env: { ...process.env, CI: 'true' },
        timeout: 120000 // 2 minutes timeout
      });
      
      buildSuccess = true;
      buildOutput = 'Build successful';
      console.log('Build completed successfully');
      
      // Log to monitor
      await logToMonitor('build_success', {
        fileId,
        messageNumber,
        details: 'Final build successful after message completion'
      });
      
    } catch (buildError: any) {
      buildSuccess = false;
      buildOutput = buildError.stdout || buildError.stderr || 'Build failed';
      console.error('Build failed:', buildOutput);
      
      // Log to monitor
      await logToMonitor('build_failed', {
        fileId,
        messageNumber,
        details: `Final build failed: ${buildOutput.substring(0, 200)}...`
      });
    }
    
    // Step 2: If build successful, restart app
    if (buildSuccess) {
      try {
        await execAsync('cd /root/genplatform && pm2 restart genplatform-app');
        console.log('App restarted successfully');
      } catch (restartError) {
        console.error('App restart failed:', restartError);
      }
    }
    
    // Step 3: Commit changes
    let commitSuccess = false;
    let commitOutput = '';
    
    if (buildSuccess) {
      try {
        // Check if there are changes to commit
        const { stdout: statusOut } = await execAsync('cd /root/genplatform && git status --porcelain');
        
        if (statusOut.trim()) {
          // There are changes to commit
          await execAsync('cd /root/genplatform && git add -A');
          await execAsync(`cd /root/genplatform && git commit -m "${commitMessage || 'Auto-commit: Self-dev tasks completed'}"`);
          
          try {
            await execAsync('cd /root/genplatform && git push origin main');
            commitSuccess = true;
            commitOutput = 'Changes committed and pushed successfully';
            console.log('Git commit and push successful');
          } catch (pushError) {
            commitSuccess = true;
            commitOutput = 'Changes committed locally (push failed)';
            console.log('Git commit successful, push failed');
          }
        } else {
          commitOutput = 'No changes to commit';
          console.log('No changes to commit');
        }
      } catch (gitError: any) {
        commitOutput = gitError.message || 'Git operation failed';
        console.error('Git error:', gitError);
      }
    }
    
    // Step 4: Send final notification
    const finalMessage = `📦 **Message ${messageNumber} Build & Deployment**

${buildSuccess ? '✅ Build: SUCCESS' : '❌ Build: FAILED'}
${buildOutput ? `\`\`\`\n${buildOutput.substring(0, 200)}${buildOutput.length > 200 ? '...' : ''}\n\`\`\`` : ''}

${buildSuccess ? (commitSuccess ? '✅ Git: Committed & Pushed' : '⚠️ Git: ' + commitOutput) : '⏭️ Git: Skipped (build failed)'}

${buildSuccess ? '🚀 App restarted and live at https://app.gen3.ai' : '🔧 Please fix build errors and retry'}`;
    
    await sendTelegramNotification(finalMessage);
    
    return NextResponse.json({
      success: buildSuccess,
      buildSuccess,
      buildOutput: buildOutput.substring(0, 500),
      commitSuccess,
      commitOutput
    });
    
  } catch (error) {
    console.error('Build-commit error:', error);
    
    await sendTelegramNotification(
      `❌ Build & Commit failed for Message ${request.body?.messageNumber || 'unknown'}\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    
    return NextResponse.json(
      { error: 'Build-commit failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
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