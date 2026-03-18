const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const fs = require('fs').promises;
const { execSync } = require('child_process');

// POST /api/health/collect
// Collects system metrics and saves to Supabase
router.post('/collect', async (req, res) => {
  try {
    console.log('🔍 Starting health check and metrics collection...');
    
    // Collect system metrics
    const metrics = await collectSystemMetrics();
    
    // Save to Supabase system_metrics table
    const { data, error } = await supabase
      .from('system_metrics')
      .insert(metrics);

    if (error) {
      console.error('Failed to save metrics to Supabase:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save metrics',
        metrics // Return metrics anyway for debugging
      });
    }

    console.log('✅ Health check metrics saved successfully');
    
    // Also log a security event for the health check
    await logSecurityHealthCheck(metrics);

    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
      message: 'Health check completed and metrics saved'
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

// GET /api/health/status
// Get current system status without saving
router.get('/status', async (req, res) => {
  try {
    const metrics = await collectSystemMetrics();
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health status',
      message: error.message
    });
  }
});

async function collectSystemMetrics() {
  const metrics = {
    recorded_at: new Date().toISOString()
  };

  try {
    // CPU Usage (Linux/Mac)
    if (process.platform !== 'win32') {
      try {
        // Get CPU usage using top command (1 second sample)
        const cpuOutput = execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | sed 's/%us,//'", { 
          encoding: 'utf8',
          timeout: 5000 
        }).trim();
        
        const cpuPercent = parseFloat(cpuOutput) || null;
        if (cpuPercent && cpuPercent >= 0 && cpuPercent <= 100) {
          metrics.cpu_percent = cpuPercent;
        }
      } catch (cpuError) {
        console.warn('Could not get CPU usage:', cpuError.message);
      }
    }

    // Memory Usage
    try {
      const memInfo = await fs.readFile('/proc/meminfo', 'utf8');
      const totalMatch = memInfo.match(/MemTotal:\s*(\d+)/);
      const availableMatch = memInfo.match(/MemAvailable:\s*(\d+)/);
      
      if (totalMatch && availableMatch) {
        const totalKB = parseInt(totalMatch[1]);
        const availableKB = parseInt(availableMatch[1]);
        const usedKB = totalKB - availableKB;
        const ramPercent = Math.round((usedKB / totalKB) * 100);
        
        if (ramPercent >= 0 && ramPercent <= 100) {
          metrics.ram_percent = ramPercent;
        }
      }
    } catch (memError) {
      console.warn('Could not get memory usage:', memError.message);
      
      // Fallback: try using free command
      try {
        const freeOutput = execSync("free | grep Mem | awk '{printf \"%.1f\", ($3/$2) * 100.0}'", {
          encoding: 'utf8',
          timeout: 3000
        }).trim();
        
        const ramPercent = parseFloat(freeOutput);
        if (ramPercent >= 0 && ramPercent <= 100) {
          metrics.ram_percent = ramPercent;
        }
      } catch (freeError) {
        console.warn('Could not get memory usage with free command:', freeError.message);
      }
    }

    // Disk Usage
    try {
      const diskOutput = execSync("df -h / | awk 'NR==2{print $5}' | sed 's/%//'", { 
        encoding: 'utf8',
        timeout: 3000 
      }).trim();
      
      const diskPercent = parseInt(diskOutput);
      if (diskPercent >= 0 && diskPercent <= 100) {
        metrics.disk_percent = diskPercent;
      }
    } catch (diskError) {
      console.warn('Could not get disk usage:', diskError.message);
    }

    // OpenClaw Gateway Status
    try {
      // Check if OpenClaw gateway is running
      const gatewayStatus = await checkOpenClawGateway();
      metrics.gateway_status = gatewayStatus;
    } catch (gatewayError) {
      console.warn('Could not check OpenClaw gateway:', gatewayError.message);
      metrics.gateway_status = 'unknown';
    }

    // Active Sessions (estimate)
    metrics.active_sessions = 1; // At least this Bridge API session

    console.log('📊 Collected metrics:', JSON.stringify(metrics, null, 2));
    return metrics;

  } catch (error) {
    console.error('Error collecting system metrics:', error);
    throw error;
  }
}

async function checkOpenClawGateway() {
  try {
    // Check if OpenClaw processes are running
    const psOutput = execSync("ps aux | grep -i openclaw | grep -v grep || echo 'no_processes'", {
      encoding: 'utf8',
      timeout: 3000
    }).trim();

    if (psOutput === 'no_processes' || psOutput === '') {
      return 'stopped';
    }

    // Check if OpenClaw workspace exists
    try {
      await fs.access('/root/.openclaw/workspace');
      return 'running';
    } catch (workspaceError) {
      return 'partial';
    }

  } catch (error) {
    console.warn('Gateway check error:', error.message);
    return 'unknown';
  }
}

async function logSecurityHealthCheck(metrics) {
  try {
    // Determine severity based on metrics
    let severity = 'info';
    let description = 'Routine health check completed successfully';
    
    if (metrics.cpu_percent && metrics.cpu_percent > 90) {
      severity = 'warning';
      description = `Health check: High CPU usage detected (${metrics.cpu_percent}%)`;
    } else if (metrics.ram_percent && metrics.ram_percent > 90) {
      severity = 'warning';
      description = `Health check: High memory usage detected (${metrics.ram_percent}%)`;
    } else if (metrics.disk_percent && metrics.disk_percent > 90) {
      severity = 'critical';
      description = `Health check: Low disk space (${metrics.disk_percent}% used)`;
    } else if (metrics.gateway_status === 'stopped') {
      severity = 'critical';
      description = 'Health check: OpenClaw gateway is not running';
    }

    const { error } = await supabase
      .from('security_events')
      .insert({
        event_type: 'health_check',
        severity,
        description,
        details: {
          metrics,
          check_type: 'automated_health_check',
          system_info: {
            platform: process.platform,
            node_version: process.version,
            uptime: process.uptime()
          }
        }
      });

    if (error) {
      console.error('Failed to log security health check:', error);
    } else {
      console.log('🛡️ Security health check event logged');
    }

  } catch (error) {
    console.error('Error logging security health check:', error);
  }
}

module.exports = router;