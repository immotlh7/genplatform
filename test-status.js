const http = require('http');

// Get queue status
http.get('http://localhost:3000/api/self-dev/queues', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const queues = JSON.parse(data).queues[0];
    console.log('\n📊 QUEUE STATUS:');
    console.log('Total Messages:', queues.totalMessages);
    console.log('Total Tasks:', queues.totalTasks);
    
    // Count task statuses
    let stats = {approved: 0, pending: 0, done: 0, executing: 0, skipped: 0};
    queues.messages?.forEach(msg => {
      msg.tasks?.forEach(task => {
        if (task.approved) stats.approved++;
        stats[task.status] = (stats[task.status] || 0) + 1;
      });
    });
    
    console.log('\n✅ TASK BREAKDOWN:');
    console.log('Approved:', stats.approved);
    console.log('Done:', stats.done);
    console.log('Executing:', stats.executing);
    console.log('Skipped:', stats.skipped);
    console.log('Pending:', stats.pending);
    
    // Show approved ready tasks
    console.log('\n🚀 READY TO EXECUTE:');
    let readyCount = 0;
    queues.messages?.forEach(msg => {
      msg.tasks?.forEach(task => {
        if (task.approved && task.status === 'approved') {
          readyCount++;
          console.log(`- Message ${msg.messageNumber}, Task ${task.taskNumber}: ${task.originalDescription?.substring(0, 60)}...`);
        }
      });
    });
    
    if (readyCount === 0) {
      console.log('No tasks ready to execute (need approved + status=approved)');
    }
    
    // Get execution status
    http.get('http://localhost:3000/api/self-dev/status', (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        const status = JSON.parse(data2);
        console.log('\n🔨 EXECUTION STATUS:');
        console.log('Auto-mode:', status.autoMode);
        console.log('Currently Executing:', status.isExecuting);
        if (status.currentTask) {
          console.log('Current Task:', status.currentTask.task?.description?.substring(0, 60) + '...');
        }
      });
    });
  });
});