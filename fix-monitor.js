const fs = require('fs');

const filePath = '/root/genplatform/src/components/self-dev/ExecutionMonitor.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the empty queue condition
content = content.replace(
  'if (stats.totalTasks === 0) {',
  'if (stats.approvedTasks === 0 && stats.executingTasks === 0) {'
);

// Update stats to include approvedTasks
content = content.replace(
  `const stats = status?.stats || {
    totalTasks: 0,
    completedTasks: 0,
    executingTasks: 0
  };`,
  `const stats = status?.stats || {
    totalTasks: 0,
    completedTasks: 0,
    executingTasks: 0,
    approvedTasks: 0,
    pendingTasks: 0,
    skippedTasks: 0
  };`
);

fs.writeFileSync(filePath, content);
console.log('✅ Fixed ExecutionMonitor component');