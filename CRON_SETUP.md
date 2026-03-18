# Health Check Cron Setup

## Overview
The health check system collects system metrics every hour and saves them to Supabase for monitoring and alerts.

## Setup Instructions

### 1. Install Cron Job
```bash
# Add to crontab (runs every hour at minute 0)
crontab -e
```

Add this line to run health checks every hour:
```
0 * * * * /root/genplatform/scripts/health-check.sh >> /var/log/genplatform-health.log 2>&1
```

Alternative schedules:
```
# Every 30 minutes
*/30 * * * * /root/genplatform/scripts/health-check.sh >> /var/log/genplatform-health.log 2>&1

# Every 15 minutes (for high-frequency monitoring)
*/15 * * * * /root/genplatform/scripts/health-check.sh >> /var/log/genplatform-health.log 2>&1

# Daily at 2 AM (for low-frequency monitoring)
0 2 * * * /root/genplatform/scripts/health-check.sh >> /var/log/genplatform-health.log 2>&1
```

### 2. Verify Cron Job
```bash
# Check cron is running
systemctl status cron

# View current crontab
crontab -l

# Check logs
tail -f /var/log/genplatform-health.log
```

### 3. Manual Test
```bash
# Test the health check script manually
cd /root/genplatform
./scripts/health-check.sh

# Test Bridge API directly
curl -X POST http://localhost:3001/api/health/collect
```

## What Gets Collected

### System Metrics
- **CPU Usage**: Percentage of CPU utilization
- **RAM Usage**: Percentage of memory utilization  
- **Disk Usage**: Percentage of root disk utilization
- **Active Sessions**: Number of active user sessions

### OpenClaw Status
- **Gateway Status**: running | stopped | partial | unknown
- Process monitoring
- Workspace availability

### Security Events
- Health check events logged to `security_events` table
- Automatic severity detection:
  - `critical`: Disk >90%, Gateway stopped
  - `warning`: CPU >90%, RAM >90%  
  - `info`: Normal operations

## Monitoring Dashboard

The collected metrics will be displayed on:
- **Dashboard**: System Health card with latest metrics
- **Monitoring Page**: Historical charts and trends
- **Notifications**: Alerts for critical issues

## Troubleshooting

### Bridge API Not Running
```bash
# Start Bridge API
cd /root/genplatform/api
npm start

# Or with PM2 (recommended for production)
pm2 start server.js --name genplatform-api
pm2 save
pm2 startup
```

### Permission Issues
```bash
# Make script executable
chmod +x /root/genplatform/scripts/health-check.sh

# Create log file with proper permissions
sudo touch /var/log/genplatform-health.log
sudo chmod 664 /var/log/genplatform-health.log
```

### Supabase Connection Issues
1. Check environment variables in `/root/genplatform/api/.env`
2. Verify Supabase project URL and service role key
3. Test connection: `curl -X POST http://localhost:3001/api/health/status`

## Log Rotation

To prevent log files from growing too large:
```bash
# Create logrotate config
sudo nano /etc/logrotate.d/genplatform-health

# Add this content:
/var/log/genplatform-health.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 root root
}
```

This setup ensures continuous monitoring and early detection of system issues.