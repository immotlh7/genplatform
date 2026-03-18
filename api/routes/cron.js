const express = require('express');
const { execSync } = require('child_process');
const router = express.Router();

// GET /api/cron - Read cron jobs
router.get('/', async (req, res) => {
  try {
    const user = req.query.user || 'root';
    let cronJobs = [];

    try {
      // Get crontab for specified user
      const cronOutput = execSync(`crontab -u ${user} -l 2>/dev/null || echo "no crontab"`, {
        encoding: 'utf8',
        timeout: 5000
      }).trim();

      if (cronOutput && cronOutput !== 'no crontab') {
        const lines = cronOutput.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        
        cronJobs = lines.map((line, index) => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 6) {
            return {
              id: index + 1,
              schedule: parts.slice(0, 5).join(' '),
              command: parts.slice(5).join(' '),
              user: user,
              enabled: true,
              nextRun: calculateNextRun(parts.slice(0, 5)),
              raw: line
            };
          }
          return {
            id: index + 1,
            raw: line,
            invalid: true,
            user: user
          };
        });
      }

    } catch (cronError) {
      console.warn(`Could not read crontab for user ${user}:`, cronError.message);
    }

    // Also check system cron directories
    const systemCronJobs = await getSystemCronJobs();
    
    // Get currently running cron processes
    const runningJobs = await getRunningCronJobs();

    res.json({
      success: true,
      user: user,
      userCronJobs: cronJobs,
      systemCronJobs,
      runningJobs,
      total: cronJobs.length + systemCronJobs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error reading cron jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read cron jobs',
      message: error.message
    });
  }
});

/**
 * Get system cron jobs from directories
 */
async function getSystemCronJobs() {
  const systemJobs = [];
  const cronDirectories = [
    '/etc/cron.d',
    '/etc/cron.daily',
    '/etc/cron.hourly',
    '/etc/cron.weekly',
    '/etc/cron.monthly'
  ];

  for (const dir of cronDirectories) {
    try {
      const files = execSync(`find ${dir} -type f 2>/dev/null || echo ""`, {
        encoding: 'utf8',
        timeout: 3000
      }).trim().split('\n').filter(Boolean);

      for (const file of files) {
        try {
          const content = execSync(`head -20 "${file}" 2>/dev/null || echo ""`, {
            encoding: 'utf8',
            timeout: 2000
          }).trim();

          if (content) {
            systemJobs.push({
              file: file,
              directory: dir,
              type: getDirectoryType(dir),
              preview: content.substring(0, 200),
              enabled: true
            });
          }
        } catch (fileError) {
          // Skip files we can't read
        }
      }
    } catch (dirError) {
      // Skip directories we can't access
    }
  }

  return systemJobs;
}

/**
 * Get currently running cron jobs
 */
async function getRunningCronJobs() {
  try {
    const cronProcesses = execSync(`ps aux | grep -E "(cron|crond)" | grep -v grep || echo ""`, {
      encoding: 'utf8',
      timeout: 3000
    }).trim();

    if (!cronProcesses) return [];

    const processes = cronProcesses.split('\n').filter(Boolean).map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        pid: parts[1],
        user: parts[0],
        cpu: parts[2],
        memory: parts[3],
        startTime: parts[8],
        command: parts.slice(10).join(' ')
      };
    });

    return processes;
  } catch (error) {
    console.warn('Could not get running cron jobs:', error.message);
    return [];
  }
}

/**
 * Calculate next run time for cron expression
 */
function calculateNextRun(cronParts) {
  try {
    // This is a simplified calculation - real implementation would use a cron library
    const now = new Date();
    const minute = cronParts[0] === '*' ? now.getMinutes() : parseInt(cronParts[0]) || 0;
    const hour = cronParts[1] === '*' ? now.getHours() : parseInt(cronParts[1]) || 0;
    const day = cronParts[2] === '*' ? now.getDate() : parseInt(cronParts[2]) || 1;
    const month = cronParts[3] === '*' ? now.getMonth() + 1 : parseInt(cronParts[3]) || 1;

    // Simple approximation - add 1 hour to current time
    const nextRun = new Date(now.getTime() + (60 * 60 * 1000));
    return nextRun.toISOString();
  } catch (error) {
    return null;
  }
}

/**
 * Get directory type for system cron
 */
function getDirectoryType(dir) {
  if (dir.includes('daily')) return 'daily';
  if (dir.includes('hourly')) return 'hourly';
  if (dir.includes('weekly')) return 'weekly';
  if (dir.includes('monthly')) return 'monthly';
  return 'custom';
}

module.exports = router;