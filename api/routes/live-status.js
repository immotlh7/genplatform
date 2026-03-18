const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// GET /api/live-status
// Reads current OpenClaw session to determine activity
// Returns: currentTask, currentProject, currentAction, uptime, tokensUsed
router.get('/', async (req, res) => {
  try {
    const liveStatus = await getCurrentLiveStatus();
    res.json(liveStatus);
  } catch (error) {
    console.error('Live status error:', error);
    res.status(500).json({
      error: 'Failed to get live status',
      message: error.message
    });
  }
});

async function getCurrentLiveStatus() {
  const startTime = process.uptime();
  const uptime = Math.floor(startTime);

  // Try to read current session or task tracker state
  let currentTask = null;
  let currentProject = null;
  let currentAction = 'idle';
  let tokensUsed = 0;

  try {
    // Try to read from OpenClaw workspace for current activity
    const workspacePath = '/root/.openclaw/workspace';
    
    // Check if we can read memory files for current activity
    const memoryPath = path.join(workspacePath, 'memory');
    const today = new Date().toISOString().split('T')[0];
    const todayMemoryFile = path.join(memoryPath, `${today}.md`);
    
    try {
      const todayMemory = await fs.readFile(todayMemoryFile, 'utf8');
      
      // Parse memory file for current activity signals
      const activityMatch = todayMemory.match(/(?:Task|Working on|Building|Implementing)\s*(\d+).*?[-—](.+?)$/gim);
      if (activityMatch && activityMatch.length > 0) {
        const lastActivity = activityMatch[activityMatch.length - 1];
        const taskMatch = lastActivity.match(/(\d+).*?[-—](.+?)$/);
        if (taskMatch) {
          currentTask = {
            number: parseInt(taskMatch[1]),
            name: taskMatch[2].trim(),
            stage: determineStage(lastActivity)
          };
          currentAction = determineAction(lastActivity);
        }
      }

      // Estimate tokens from memory file size (rough approximation)
      tokensUsed = Math.floor(todayMemory.length / 4); // ~4 chars per token

    } catch (memoryError) {
      // Memory file might not exist yet
    }

    // Try to detect current project from git or project files
    try {
      const packageJsonPath = '/root/genplatform/package.json';
      const packageJson = await fs.readFile(packageJsonPath, 'utf8');
      const packageData = JSON.parse(packageJson);
      
      currentProject = {
        name: packageData.name || 'GenPlatform.ai',
        id: 'genplatform-main'
      };
    } catch (projectError) {
      // Default project
      currentProject = {
        name: 'GenPlatform.ai',
        id: 'genplatform-main'
      };
    }

    // Check if we're in an active development session
    if (!currentTask) {
      // Look for signs of recent activity
      const recentActivity = await checkRecentActivity();
      if (recentActivity.isActive) {
        currentAction = recentActivity.action;
        currentTask = recentActivity.task;
      }
    }

  } catch (error) {
    console.error('Error reading workspace:', error);
  }

  return {
    currentTask,
    currentProject,
    currentAction,
    uptime,
    tokensUsed,
    timestamp: new Date().toISOString(),
    status: currentTask ? 'active' : 'idle'
  };
}

function determineStage(activity) {
  const activityLower = activity.toLowerCase();
  
  if (activityLower.includes('plan') || activityLower.includes('design')) {
    return 'planning';
  }
  if (activityLower.includes('build') || activityLower.includes('implement') || activityLower.includes('create')) {
    return 'building';
  }
  if (activityLower.includes('test') || activityLower.includes('verify')) {
    return 'testing';
  }
  if (activityLower.includes('deploy') || activityLower.includes('publish')) {
    return 'deploying';
  }
  if (activityLower.includes('review') || activityLower.includes('check')) {
    return 'reviewing';
  }
  
  return 'working';
}

function determineAction(activity) {
  const activityLower = activity.toLowerCase();
  
  if (activityLower.includes('cod') || activityLower.includes('build') || activityLower.includes('implement')) {
    return 'coding';
  }
  if (activityLower.includes('review') || activityLower.includes('check') || activityLower.includes('audit')) {
    return 'reviewing';
  }
  if (activityLower.includes('research') || activityLower.includes('analyz') || activityLower.includes('plan')) {
    return 'researching';
  }
  if (activityLower.includes('deploy') || activityLower.includes('publish') || activityLower.includes('push')) {
    return 'deploying';
  }
  
  return 'working';
}

async function checkRecentActivity() {
  try {
    // Check recent git commits for activity
    const { execSync } = require('child_process');
    const recentCommits = execSync('cd /root/genplatform && git log --oneline -5', { encoding: 'utf8' });
    
    if (recentCommits) {
      const commits = recentCommits.split('\n').filter(line => line.trim());
      if (commits.length > 0) {
        const latestCommit = commits[0];
        
        // Parse task number from commit message
        const taskMatch = latestCommit.match(/Task\s+(\w+-\d+|\d+)/i);
        if (taskMatch) {
          const taskNumber = taskMatch[1];
          
          return {
            isActive: true,
            action: determineAction(latestCommit),
            task: {
              number: taskNumber,
              name: extractTaskName(latestCommit),
              stage: determineStage(latestCommit)
            }
          };
        }
      }
    }
  } catch (gitError) {
    // Git not available or no commits
  }

  return {
    isActive: false,
    action: 'idle',
    task: null
  };
}

function extractTaskName(commitMessage) {
  // Extract task name from commit message
  const parts = commitMessage.split(' - ');
  if (parts.length > 1) {
    return parts[1].split(' ')[0] + '...';
  }
  
  // Fallback to first few words
  const words = commitMessage.split(' ').slice(2, 6);
  return words.join(' ') + (words.length >= 4 ? '...' : '');
}

module.exports = router;