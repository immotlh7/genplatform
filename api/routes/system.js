const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const router = express.Router();

// GET /api/system/metrics - Return CPU, RAM, disk usage
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await collectSystemMetrics();

    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      hostname: require('os').hostname(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    });

  } catch (error) {
    console.error('Error collecting system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect system metrics',
      message: error.message
    });
  }
});

/**
 * Collect comprehensive system metrics
 */
async function collectSystemMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    cpu: await getCpuUsage(),
    memory: await getMemoryUsage(),
    disk: await getDiskUsage(),
    network: await getNetworkUsage(),
    load: await getLoadAverage(),
    processes: await getProcessCount(),
    uptime: await getSystemUptime()
  };

  return metrics;
}

/**
 * Get CPU usage percentage
 */
async function getCpuUsage() {
  try {
    // Method 1: Use top command
    const topOutput = execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | sed 's/%us,//'", { 
      encoding: 'utf8',
      timeout: 5000 
    }).trim();
    
    const cpuPercent = parseFloat(topOutput);
    
    if (cpuPercent && cpuPercent >= 0 && cpuPercent <= 100) {
      return {
        usage: cpuPercent,
        idle: 100 - cpuPercent,
        cores: require('os').cpus().length,
        model: require('os').cpus()[0]?.model || 'Unknown',
        method: 'top'
      };
    }

    // Method 2: Calculate from /proc/stat
    const statData = await fs.readFile('/proc/stat', 'utf8');
    const cpuLine = statData.split('\n')[0];
    const cpuTimes = cpuLine.split(/\s+/).slice(1).map(Number);
    
    const idle = cpuTimes[3];
    const total = cpuTimes.reduce((sum, time) => sum + time, 0);
    const usage = Math.round((1 - idle / total) * 100);

    return {
      usage: usage,
      idle: 100 - usage,
      cores: require('os').cpus().length,
      model: require('os').cpus()[0]?.model || 'Unknown',
      method: 'proc_stat'
    };

  } catch (error) {
    console.warn('Could not get CPU usage:', error.message);
    return {
      usage: 0,
      idle: 0,
      cores: require('os').cpus().length,
      error: error.message
    };
  }
}

/**
 * Get memory usage
 */
async function getMemoryUsage() {
  try {
    const memInfo = await fs.readFile('/proc/meminfo', 'utf8');
    const lines = memInfo.split('\n');
    
    const getValueKB = (key) => {
      const line = lines.find(line => line.startsWith(key));
      if (line) {
        const match = line.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }
      return 0;
    };

    const totalKB = getValueKB('MemTotal');
    const freeKB = getValueKB('MemFree');
    const buffersKB = getValueKB('Buffers');
    const cachedKB = getValueKB('Cached');
    const availableKB = getValueKB('MemAvailable') || (freeKB + buffersKB + cachedKB);
    
    const usedKB = totalKB - availableKB;
    const usagePercent = totalKB > 0 ? Math.round((usedKB / totalKB) * 100) : 0;

    return {
      total: Math.round(totalKB / 1024), // Convert to MB
      used: Math.round(usedKB / 1024),
      free: Math.round(freeKB / 1024),
      available: Math.round(availableKB / 1024),
      cached: Math.round(cachedKB / 1024),
      buffers: Math.round(buffersKB / 1024),
      usage: usagePercent,
      unit: 'MB'
    };

  } catch (error) {
    console.warn('Could not get memory usage:', error.message);
    
    // Fallback: try using free command
    try {
      const freeOutput = execSync("free -m | grep Mem", {
        encoding: 'utf8',
        timeout: 3000
      }).trim();

      const parts = freeOutput.split(/\s+/);
      if (parts.length >= 7) {
        const total = parseInt(parts[1]);
        const used = parseInt(parts[2]);
        const free = parseInt(parts[3]);
        const available = parseInt(parts[6]);

        return {
          total,
          used,
          free,
          available,
          usage: total > 0 ? Math.round((used / total) * 100) : 0,
          unit: 'MB',
          method: 'free_command'
        };
      }
    } catch (freeError) {
      console.warn('Free command also failed:', freeError.message);
    }

    return { error: error.message };
  }
}

/**
 * Get disk usage
 */
async function getDiskUsage() {
  try {
    const dfOutput = execSync("df -h / | awk 'NR==2{print $2,$3,$4,$5}'", { 
      encoding: 'utf8',
      timeout: 3000 
    }).trim();

    const [total, used, available, usageStr] = dfOutput.split(/\s+/);
    const usage = parseInt(usageStr.replace('%', ''));

    // Get additional disk info
    const diskInfo = execSync("lsblk -o NAME,SIZE,TYPE,MOUNTPOINT | grep -E '(disk|part)' | head -10", {
      encoding: 'utf8',
      timeout: 3000
    }).trim();

    return {
      root: {
        total,
        used,
        available,
        usage,
        unit: 'human-readable'
      },
      diskInfo: diskInfo.split('\n').map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          device: parts[0],
          size: parts[1],
          type: parts[2],
          mountpoint: parts[3] || ''
        };
      })
    };

  } catch (error) {
    console.warn('Could not get disk usage:', error.message);
    return { error: error.message };
  }
}

/**
 * Get network usage (basic info)
 */
async function getNetworkUsage() {
  try {
    // Get network interfaces
    const interfaces = execSync("ip -o link show | awk -F': ' '{print $2}'", {
      encoding: 'utf8',
      timeout: 3000
    }).trim().split('\n').filter(iface => !iface.includes('lo'));

    const networkInfo = [];
    
    for (const iface of interfaces.slice(0, 5)) { // Limit to first 5 interfaces
      try {
        const stats = await fs.readFile(`/sys/class/net/${iface}/statistics/rx_bytes`, 'utf8');
        const rxBytes = parseInt(stats.trim());
        
        const txStats = await fs.readFile(`/sys/class/net/${iface}/statistics/tx_bytes`, 'utf8');
        const txBytes = parseInt(txStats.trim());

        networkInfo.push({
          interface: iface,
          rxBytes: Math.round(rxBytes / 1024 / 1024), // Convert to MB
          txBytes: Math.round(txBytes / 1024 / 1024),
          unit: 'MB'
        });
      } catch (ifaceError) {
        // Skip interfaces we can't read
      }
    }

    return {
      interfaces: networkInfo,
      activeConnections: await getActiveConnections()
    };

  } catch (error) {
    console.warn('Could not get network usage:', error.message);
    return { error: error.message };
  }
}

/**
 * Get active network connections
 */
async function getActiveConnections() {
  try {
    const connections = execSync("netstat -tn | grep ESTABLISHED | wc -l", {
      encoding: 'utf8',
      timeout: 3000
    }).trim();

    const listening = execSync("netstat -tln | grep LISTEN | wc -l", {
      encoding: 'utf8',
      timeout: 3000
    }).trim();

    return {
      established: parseInt(connections) || 0,
      listening: parseInt(listening) || 0
    };
  } catch (error) {
    return { established: 0, listening: 0 };
  }
}

/**
 * Get load average
 */
async function getLoadAverage() {
  try {
    const loadavg = await fs.readFile('/proc/loadavg', 'utf8');
    const [load1, load5, load15] = loadavg.trim().split(/\s+/).map(Number);

    return {
      load1min: load1,
      load5min: load5,
      load15min: load15
    };
  } catch (error) {
    console.warn('Could not get load average:', error.message);
    return { error: error.message };
  }
}

/**
 * Get process count
 */
async function getProcessCount() {
  try {
    const processes = execSync("ps aux | wc -l", {
      encoding: 'utf8',
      timeout: 3000
    }).trim();

    const running = execSync("ps aux | awk '$8 ~ /^[Rr]/ {count++} END {print count+0}'", {
      encoding: 'utf8',
      timeout: 3000
    }).trim();

    const sleeping = execSync("ps aux | awk '$8 ~ /^[Ss]/ {count++} END {print count+0}'", {
      encoding: 'utf8',
      timeout: 3000
    }).trim();

    return {
      total: parseInt(processes) - 1 || 0, // Subtract header line
      running: parseInt(running) || 0,
      sleeping: parseInt(sleeping) || 0
    };
  } catch (error) {
    console.warn('Could not get process count:', error.message);
    return { error: error.message };
  }
}

/**
 * Get system uptime
 */
async function getSystemUptime() {
  try {
    const uptime = await fs.readFile('/proc/uptime', 'utf8');
    const [uptimeSeconds] = uptime.trim().split(/\s+/).map(Number);

    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    return {
      seconds: Math.round(uptimeSeconds),
      formatted: `${days}d ${hours}h ${minutes}m`,
      days,
      hours,
      minutes
    };
  } catch (error) {
    console.warn('Could not get system uptime:', error.message);
    return { error: error.message };
  }
}

module.exports = router;