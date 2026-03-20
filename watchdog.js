#!/usr/bin/env node
/**
 * WATCHDOG - Runs every 5 min via cron
 * Checks system health, fixes problems, ensures pipeline never stops
 */

const fs = require('fs');
const http = require('http');
const { execSync, exec } = require('child_process');
const https = require('https');

const BOT_TOKEN = '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4';
const CHAT_ID = '8630551989';
const QUEUE_DIR = '/root/genplatform/data/task-queue';
const LOCK_FILE = '/root/genplatform/data/execution-lock.json';
const LOG_FILE = '/root/genplatform/data/watchdog.log';
const STATE_FILE = '/root/genplatform/data/watchdog-state.json';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
    // Keep log under 500 lines
    const lines = fs.readFileSync(LOG_FILE, 'utf-8').split('\n');
    if (lines.length > 500) {
      fs.writeFileSync(LOG_FILE, lines.slice(-400).join('\n'));
    }
  } catch {}
}

function notify(text) {
  return new Promise(resolve => {
    const body = JSON.stringify({ chat_id: CHAT_ID, text });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.on('error', resolve);
    req.write(body);
    req.end();
  });
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { timeout: 60000, encoding: 'utf-8', ...opts }).trim();
  } catch (e) {
    return null;
  }
}

function apiCall(path, method = 'GET', body = null) {
  return new Promise(resolve => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000, path, method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (bodyStr) opts.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    const req = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } });
    });
    req.on('error', () => resolve({}));
    req.setTimeout(15000, () => { req.destroy(); resolve({}); });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); }
  catch { return { lastActivity: 0, completedTotal: 0, failedTotal: 0, lastNotify: 0, consecutiveIdle: 0 }; }
}

function saveState(s) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
}

function getQueueStats() {
  const stats = { total: 0, done: 0, approved: 0, executing: 0, pending: 0, files: 0 };
  try {
    const files = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json') && f !== 'task-queue.json' && !f.endsWith('.json.json'));
    stats.files = files.length;
    for (const f of files) {
      try {
        const q = JSON.parse(fs.readFileSync(`${QUEUE_DIR}/${f}`, 'utf-8'));
        for (const msg of (q.messages || [])) {
          for (const t of (msg.tasks || [])) {
            stats.total++;
            if (t.status === 'done') stats.done++;
            else if (t.status === 'executing') stats.executing++;
            else if (t.approved && t.status === 'approved') stats.approved++;
            else stats.pending++;
          }
        }
      } catch {}
    }
  } catch {}
  return stats;
}

function findNextPendingMessage() {
  try {
    const files = fs.readdirSync(QUEUE_DIR)
      .filter(f => f.endsWith('.json') && !f.endsWith('.json.json') && f !== 'task-queue.json')
      .sort();

    for (const f of files) {
      const fileId = f.replace('.json', '');
      try {
        const q = JSON.parse(fs.readFileSync(`${QUEUE_DIR}/${f}`, 'utf-8'));
        for (const msg of (q.messages || [])) {
          if (!msg.tasks?.length) continue;
          const allDone = msg.tasks.every(t => t.status === 'done' || t.status === 'skipped');
          if (!allDone) {
            const hasApproved = msg.tasks.some(t => t.approved && t.status === 'approved');
            const needsRewrite = msg.tasks.some(t => !t.rewritten && t.status !== 'done' && t.status !== 'skipped');
            return { fileId, messageNumber: msg.messageNumber, hasApproved, needsRewrite, f };
          }
        }
      } catch {}
    }
  } catch {}
  return null;
}

async function fixSite() {
  log('🔧 Fixing site...');
  const result = run('cd /root/genplatform && npm run build 2>&1 | tail -3');
  if (result && (result.includes('✓') || result.includes('Compiled'))) {
    run('cd /root/genplatform && pm2 restart genplatform-app');
    log('✅ Site fixed and restarted');
    return true;
  }
  // Try restoring from git
  run('cd /root/genplatform && git checkout -- src/');
  const result2 = run('cd /root/genplatform && npm run build 2>&1 | tail -3');
  if (result2 && (result2.includes('✓') || result2.includes('Compiled'))) {
    run('cd /root/genplatform && pm2 restart genplatform-app');
    log('✅ Site restored from git and restarted');
    return true;
  }
  log('❌ Site fix failed');
  return false;
}

async function main() {
  const state = loadState();
  const issues = [];
  const fixes = [];

  log('--- Watchdog run ---');

  // ── CHECK 1: Site up? ──
  let siteUp = false;
  try {
    const res = await new Promise(resolve => {
      const req = http.request({ hostname: 'localhost', port: 3000, path: '/', method: 'HEAD', timeout: 5000 }, r => resolve(r.statusCode));
      req.on('error', () => resolve(0));
      req.on('timeout', () => { req.destroy(); resolve(0); });
      req.end();
    });
    siteUp = res > 0 && res < 500;
  } catch {}

  if (!siteUp) {
    issues.push('Site down (localhost:3000)');
    log('❌ Site is DOWN - attempting fix...');
    const fixed = await fixSite();
    if (fixed) fixes.push('Site rebuilt and restarted');
    else issues.push('Site fix FAILED');
  } else {
    log('✅ Site up');
  }

  // ── CHECK 2: pm2 status ──
  const pm2Status = run('pm2 jlist 2>/dev/null');
  if (pm2Status) {
    try {
      const procs = JSON.parse(pm2Status);
      const app = procs.find(p => p.name === 'genplatform-app');
      if (app && app.pm2_env.status !== 'online') {
        issues.push(`pm2 genplatform-app is ${app.pm2_env.status}`);
        run('cd /root/genplatform && pm2 restart genplatform-app');
        fixes.push('pm2 restarted genplatform-app');
        log('🔧 Restarted genplatform-app');
      } else {
        log('✅ pm2 online');
      }
    } catch {}
  }

  // ── CHECK 3: Execution lock stuck? ──
  try {
    const lock = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
    if (lock.locked && lock.lockedAt) {
      const ageMin = (Date.now() - new Date(lock.lockedAt).getTime()) / 60000;
      if (ageMin > 10) {
        issues.push(`Execution lock stuck for ${ageMin.toFixed(0)} min`);
        // Clear lock and reset stuck task
        try {
          const q = JSON.parse(fs.readFileSync('/root/genplatform/data/task-queue/task-queue.json', 'utf-8'));
          q.messages?.forEach(m => m.tasks?.forEach(t => {
            if (t.taskId === lock.taskId && t.status === 'executing') {
              t.status = 'approved'; delete t.startedAt;
            }
          }));
          fs.writeFileSync('/root/genplatform/data/task-queue/task-queue.json', JSON.stringify(q, null, 2));
        } catch {}
        fs.writeFileSync(LOCK_FILE, JSON.stringify({ locked: false, taskId: null, lockedAt: null, attempts: 0 }, null, 2));
        fixes.push(`Lock cleared (was stuck ${ageMin.toFixed(0)}min)`);
        log(`🔧 Cleared stuck lock (${ageMin.toFixed(0)} min old)`);
      }
    }
  } catch {}

  // ── CHECK 4: Is pipeline making progress? ──
  const qStats = getQueueStats();
  log(`📊 Queue: ${qStats.done}/${qStats.total} done, ${qStats.approved} approved, ${qStats.executing} executing`);

  const lastActivityAge = (Date.now() - state.lastActivity) / 60000;
  const hasWork = qStats.approved > 0 || qStats.pending > 0;

  if (hasWork && qStats.executing === 0 && lastActivityAge > 6) {
    // Pipeline stalled — find next message and trigger
    issues.push(`Pipeline idle for ${lastActivityAge.toFixed(0)} min`);
    log('⚠️ Pipeline stalled — finding next message...');

    const next = findNextPendingMessage();
    if (next) {
      log(`→ Found: ${next.fileId} Msg ${next.messageNumber} (needsRewrite: ${next.needsRewrite})`);

      if (next.needsRewrite) {
        // Rewrite first
        const rw = await apiCall('/api/self-dev/rewrite', 'POST', {
          fileId: next.fileId,
          messageNumber: next.messageNumber,
          forceRewrite: true
        });
        if (rw.success) {
          log(`✅ Rewrote Msg ${next.messageNumber}: ${rw.microTasksGenerated} tasks`);
          await new Promise(r => setTimeout(r, 1000));
          // Approve
          const ap = await apiCall('/api/self-dev/approve', 'POST', {
            fileId: next.fileId,
            messageNumber: next.messageNumber,
            approved: true
          });
          if (ap.approvedTasks > 0) {
            fixes.push(`Rewrite+Approved Msg ${next.messageNumber} (${ap.approvedTasks} tasks)`);
            state.lastActivity = Date.now();
            state.consecutiveIdle = 0;
          }
        } else {
          log(`❌ Rewrite failed: ${JSON.stringify(rw).substring(0, 100)}`);
          state.consecutiveIdle = (state.consecutiveIdle || 0) + 1;
        }
      } else if (next.hasApproved) {
        // Trigger execution
        const ex = await apiCall('/api/self-dev/execute-next', 'POST');
        if (ex.sent || ex.success) {
          fixes.push(`Triggered execution Msg ${next.messageNumber}`);
          state.lastActivity = Date.now();
          state.consecutiveIdle = 0;
          log(`✅ Triggered execution`);
        } else {
          log(`❌ Execute failed: ${JSON.stringify(ex).substring(0, 100)}`);
        }
      }
    } else {
      log('✅ No pending messages found — all done!');
    }
  } else if (qStats.executing > 0) {
    state.lastActivity = Date.now();
    state.consecutiveIdle = 0;
    log('✅ Pipeline is executing');
  }

  // ── CHECK 5: Stale executing task in non-main queues ──
  // Check all individual files for stuck tasks and reset them
  try {
    const files = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json') && !f.endsWith('.json.json') && f !== 'task-queue.json');
    for (const f of files) {
      try {
        const fPath = `${QUEUE_DIR}/${f}`;
        const q = JSON.parse(fs.readFileSync(fPath, 'utf-8'));
        let changed = false;
        q.messages?.forEach(m => m.tasks?.forEach(t => {
          if (t.status === 'executing' && t.startedAt) {
            const age = (Date.now() - new Date(t.startedAt).getTime()) / 60000;
            if (age > 10) {
              t.status = 'approved';
              delete t.startedAt;
              changed = true;
              log(`🔧 Reset stuck task in ${f}: Msg${m.messageNumber}-T${t.taskNumber}`);
            }
          }
        }));
        if (changed) fs.writeFileSync(fPath, JSON.stringify(q, null, 2));
      } catch {}
    }
  } catch {}

  // ── UPDATE STATE ──
  state.lastRun = Date.now();
  if (qStats.done > state.completedTotal) {
    state.completedTotal = qStats.done;
    state.lastActivity = Date.now();
  }
  saveState(state);

  // ── NOTIFY every 5 min with status ──
  const now = Date.now();
  const timeSinceNotify = (now - (state.lastNotify || 0)) / 60000;

  if (issues.length > 0 || timeSinceNotify >= 5) {
    const elapsed = Math.round((now - (state.startTime || now)) / 60000);
    let msg = `🤖 Watchdog Report\n\n`;
    msg += `📊 Progress: ${qStats.done}/${qStats.total} tasks done\n`;
    msg += `🔄 Executing: ${qStats.executing} | Approved: ${qStats.approved}\n`;

    if (issues.length > 0) {
      msg += `\n⚠️ Issues found:\n${issues.map(i => `• ${i}`).join('\n')}\n`;
    }
    if (fixes.length > 0) {
      msg += `\n🔧 Fixed:\n${fixes.map(f => `• ${f}`).join('\n')}\n`;
    }

    if (qStats.done === qStats.total && qStats.total > 0) {
      msg += `\n🎉 ALL TASKS COMPLETE!`;
    }

    await notify(msg);
    state.lastNotify = now;
    if (!state.startTime) state.startTime = now;
    saveState(state);
  }

  log(`Done. Issues: ${issues.length}, Fixes: ${fixes.length}`);
}

main().catch(async e => {
  const msg = `❌ Watchdog error: ${e.message}`;
  console.error(msg);
  fs.appendFileSync(LOG_FILE, msg + '\n');
  await notify(msg);
});
