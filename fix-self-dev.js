const fs = require('fs');

console.log('Fixing Self-Dev System...\n');

// 1. Clear execution lock
const lock = {
  locked: false,
  taskId: null,
  lockedAt: null,
  attempts: 0
};
fs.writeFileSync('/root/genplatform/data/execution-lock.json', JSON.stringify(lock, null, 2));
console.log('✅ Execution lock cleared');

// 2. Reset all executing tasks
const queue = JSON.parse(fs.readFileSync('/root/genplatform/data/task-queue/task-queue.json', 'utf-8'));
let resetCount = 0;
queue.messages?.forEach(msg => {
  msg.tasks?.forEach(task => {
    if (task.status === 'executing') {
      task.status = task.approved ? 'approved' : 'pending';
      delete task.startedAt;
      resetCount++;
    }
  });
});
fs.writeFileSync('/root/genplatform/data/task-queue/task-queue.json', JSON.stringify(queue, null, 2));
console.log(`✅ Reset ${resetCount} stuck tasks`);

// 3. Check webhook
const https = require('https');
const checkWebhook = () => {
  return new Promise((resolve) => {
    https.get('https://api.telegram.org/bot8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4/getWebhookInfo', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const info = JSON.parse(data);
        if (info.result?.url) {
          console.log('✅ Webhook is set:', info.result.url);
        } else {
          console.log('❌ Webhook not set!');
        }
        resolve();
      });
    });
  });
};

// 4. Test rewrite endpoint
const testRewrite = async () => {
  const testData = {
    fileId: "task_1773996310129_PRIORITY-1-FIX-ALL-PAGES.md",
    messageNumber: 7,
    forceRewrite: true
  };
  
  console.log('\nTesting rewrite endpoint...');
  const http = require('http');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/self-dev/rewrite',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log('✅ Rewrite API working');
          } else {
            console.log('❌ Rewrite failed:', result.error);
          }
        } catch (e) {
          console.log('❌ Rewrite API error:', e.message);
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.log('❌ Cannot reach API:', e.message);
      resolve();
    });
    
    req.write(JSON.stringify(testData));
    req.end();
  });
};

// Run all checks
(async () => {
  await checkWebhook();
  await testRewrite();
  
  // Show current stats
  const updatedQueue = JSON.parse(fs.readFileSync('/root/genplatform/data/task-queue/task-queue.json', 'utf-8'));
  let stats = {approved: 0, pending: 0, done: 0};
  updatedQueue.messages?.forEach(msg => {
    msg.tasks?.forEach(task => {
      stats[task.status] = (stats[task.status] || 0) + 1;
    });
  });
  console.log('\nTask Stats:', stats);
  console.log('\n✅ System ready for testing');
})();