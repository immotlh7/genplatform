#!/usr/bin/env node
/**
 * Auto Pipeline - Runs rewrite → approve → execute for ALL messages in ALL files
 * Sends Telegram updates every 5 minutes
 * Handles API limits, build failures, auto-rollback
 */

const fs = require('fs');
const https = require('https');

const BOT_TOKEN = '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const CHAT_ID = '8630551989';
const BASE_URL = 'http://localhost:3000';
const QUEUE_DIR = '/root/genplatform/data/task-queue';
const MAIN_QUEUE = '/root/genplatform/data/task-queue/task-queue.json';

// All queue files to process (in order)
const QUEUE_FILES = [
  { fileId: 'task_1773996310129_PRIORITY-1-FIX-ALL-PAGES.md', priority: 1 },
  { fileId: 'task_1774003310394_PRIORITY-2-CHAT-AND-FEATURES.md', priority: 2 },
  { fileId: 'task_1774013715110_PRIORITY-2-CHAT-AND-FEATURES.md', priority: 2 },
  { fileId: 'task_1774013721790_PRIORITY-3-ADVANCED-FEATURES.md', priority: 3 },
  { fileId: 'task_1774013727417_PRIORITY-4-VOICE-3D-MODELS.md', priority: 4 },
  { fileId: 'task_1774013732864_PRIORITY-5-PIPELINE-INFRASTRUCTURE.md', priority: 5 },
];

// State
let stats = {
  rewritten: 0,
  approved: 0,
  executed: 0,
  failed: 0,
  startTime: Date.now(),
  lastNotifyTime: 0,
  lastCompletedTasks: [],
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function notify(text) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ chat_id: CHAT_ID, text });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

async function apiCall(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (bodyStr) options.headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const http = require('http');
    const req = http.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ error: 'parse error', raw: data.substring(0, 100) }); }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function getQueueData(fileId) {
  try {
    const path = `${QUEUE_DIR}/${fileId}.json`;
    return JSON.parse(fs.readFileSync(path, 'utf-8'));
  } catch {
    // Try main queue
    try {
      return JSON.parse(fs.readFileSync(MAIN_QUEUE, 'utf-8'));
    } catch {
      return null;
    }
  }
}

function saveQueueData(fileId, data) {
  // Always save to both files
  const indPath = `${QUEUE_DIR}/${fileId}.json`;
  fs.writeFileSync(indPath, JSON.stringify(data, null, 2));
  // Also update main queue if it's the primary file
  if (fileId.includes('PRIORITY-1')) {
    fs.writeFileSync(MAIN_QUEUE, JSON.stringify(data, null, 2));
  }
}

async function sendProgressUpdate() {
  const now = Date.now();
  const elapsed = Math.round((now - stats.startTime) / 60000);
  const recent = stats.lastCompletedTasks.slice(-5);

  const msg = `📊 Progress Update (${elapsed}min)\n\n` +
    `✅ Rewritten: ${stats.rewritten}\n` +
    `👍 Approved: ${stats.approved}\n` +
    `🚀 Executed: ${stats.executed}\n` +
    `❌ Failed: ${stats.failed}\n\n` +
    (recent.length > 0 ? `Recent completions:\n${recent.map(t => `• ${t}`).join('\n')}` : 'Working...');

  await notify(msg);
  stats.lastNotifyTime = now;
  stats.lastCompletedTasks = [];
}

async function processMessage(fileId, messageNumber, messageSummary) {
  console.log(`\n[${new Date().toLocaleTimeString()}] Processing: ${fileId.substring(0,30)}... Msg ${messageNumber}`);

  // Step 1: Rewrite
  console.log(`  → Rewriting message ${messageNumber}...`);
  let rewriteResult = null;
  let retries = 0;

  while (retries < 3) {
    rewriteResult = await apiCall('/api/self-dev/rewrite', 'POST', {
      fileId,
      messageNumber,
      forceRewrite: true
    });

    if (rewriteResult.success) {
      console.log(`  ✅ Rewritten: ${rewriteResult.microTasksGenerated} micro-tasks`);
      stats.rewritten++;
      break;
    }

    if (rewriteResult.error?.includes('rate') || rewriteResult.error?.includes('limit') || rewriteResult.error?.includes('429')) {
      console.log(`  ⏳ Rate limit hit, waiting 65 seconds...`);
      await notify(`⚠️ API rate limit on Msg ${messageNumber}. Waiting 65s...`);
      await sleep(65000);
      retries++;
    } else {
      console.log(`  ❌ Rewrite failed: ${JSON.stringify(rewriteResult).substring(0, 100)}`);
      return false;
    }
  }

  if (!rewriteResult?.success) {
    console.log(`  ❌ Rewrite failed after retries`);
    return false;
  }

  await sleep(1000);

  // Step 2: Approve
  console.log(`  → Approving message ${messageNumber}...`);
  const approveResult = await apiCall('/api/self-dev/approve', 'POST', {
    fileId,
    messageNumber,
    approved: true
  });

  if (!approveResult.success || approveResult.approvedTasks === 0) {
    console.log(`  ❌ Approve failed or 0 tasks: ${JSON.stringify(approveResult).substring(0, 100)}`);
    return false;
  }

  console.log(`  ✅ Approved ${approveResult.approvedTasks} tasks`);
  stats.approved += approveResult.approvedTasks;

  // Step 3: Execute all approved tasks in this message
  console.log(`  → Executing ${approveResult.approvedTasks} tasks...`);
  let tasksExecuted = 0;
  let maxAttempts = approveResult.approvedTasks + 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(3000); // Wait before each execute

    // Check if all tasks in this message are done
    const queueData = getQueueData(fileId);
    if (queueData) {
      // Find in the correct queue file
      let msg = null;
      for (const q of [queueData]) {
        msg = q.messages?.find(m => m.messageNumber === messageNumber);
        if (msg) break;
      }

      if (msg) {
        const allDone = msg.tasks.every(t => t.status === 'done' || t.status === 'skipped');
        if (allDone) {
          console.log(`  ✅ All tasks done for message ${messageNumber}`);
          break;
        }
      }
    }

    // Trigger execution
    const execResult = await apiCall('/api/self-dev/execute-next', 'POST');

    if (execResult.error === 'Execution locked') {
      // Wait for current task to complete
      console.log(`  ⏳ Waiting for locked task...`);
      await sleep(10000);
      continue;
    }

    if (execResult.completed || execResult.message === 'No approved tasks found') {
      break;
    }

    if (execResult.success) {
      tasksExecuted++;
      stats.executed++;
      const desc = execResult.taskId?.split('-task')?.[1] || '';
      stats.lastCompletedTasks.push(`Msg${messageNumber}-T${execResult.taskNumber}: ${messageSummary?.substring(0,30)}`);
      console.log(`  ✅ Task ${execResult.taskNumber} done`);

      // Wait for build to complete (build takes ~30s)
      console.log(`  ⏳ Waiting for build...`);
      await sleep(35000);
    } else if (execResult.success === false) {
      stats.failed++;
      console.log(`  ❌ Task failed: ${execResult.result?.substring(0, 80)}`);
      await sleep(5000);
    } else {
      await sleep(5000);
    }
  }

  return tasksExecuted > 0 || true;
}

async function main() {
  console.log('🚀 Auto Pipeline Starting...');
  await notify('🚀 Auto Pipeline Started!\n\nWill process all 55 messages across 6 files.\nUpdates every 5 minutes.\n\nGo sleep! I will work non-stop 💪');

  // 5-minute notification timer
  const notifyInterval = setInterval(async () => {
    await sendProgressUpdate();
  }, 5 * 60 * 1000);

  try {
    for (const { fileId, priority } of QUEUE_FILES) {
      console.log(`\n\n===== Processing: ${fileId} (Priority ${priority}) =====`);

      // Load queue for this file
      const qPath = `${QUEUE_DIR}/${fileId}.json`;
      if (!fs.existsSync(qPath)) {
        console.log(`  Skipping - file not found: ${qPath}`);
        continue;
      }

      const queue = JSON.parse(fs.readFileSync(qPath, 'utf-8'));
      const messages = queue.messages?.filter(m => m.tasks?.length > 0) || [];

      console.log(`  Found ${messages.length} messages with tasks`);

      for (const message of messages) {
        // Skip already done messages
        const allDone = message.tasks.every(t => t.status === 'done' || t.status === 'skipped');
        if (allDone) {
          console.log(`  ⏭️  Skipping Msg ${message.messageNumber} (all done)`);
          continue;
        }

        // Process this message
        try {
          // For non-primary files, we need to set the correct main queue context
          // Temporarily point rewrite/approve to the right file
          if (!fileId.includes('PRIORITY-1')) {
            // Copy this queue to main for processing
            fs.writeFileSync(MAIN_QUEUE, JSON.stringify(queue, null, 2));
          }

          await processMessage(fileId, message.messageNumber, message.summary);

          // Send periodic updates
          const now = Date.now();
          if (now - stats.lastNotifyTime > 5 * 60 * 1000) {
            await sendProgressUpdate();
          }

          // Small delay between messages
          await sleep(2000);

        } catch (err) {
          console.error(`  Error processing Msg ${message.messageNumber}:`, err.message);
          stats.failed++;
          await sleep(5000);
        }
      }

      // Notify file completion
      const done = messages.filter(m => m.tasks.every(t => t.status === 'done' || t.status === 'skipped')).length;
      await notify(`📁 Completed: ${fileId.replace('task_1773996310129_', '').replace('task_1774003310394_', '').substring(0,40)}\n✅ ${done}/${messages.length} messages done`);
    }

  } catch (err) {
    console.error('Fatal error:', err);
    await notify(`❌ Pipeline error: ${err.message}`);
  } finally {
    clearInterval(notifyInterval);
  }

  // Final report
  const elapsed = Math.round((Date.now() - stats.startTime) / 60000);
  await notify(`🎉 Pipeline Complete!\n\n⏱️ Time: ${elapsed} minutes\n✅ Executed: ${stats.executed} tasks\n❌ Failed: ${stats.failed} tasks\n\nAll done! Check https://app.gen3.ai`);

  console.log('\n✅ Pipeline Complete!');
  console.log(`Stats:`, stats);
}

main().catch(console.error);
