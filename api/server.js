const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple health endpoint MUST come before route modules to avoid conflicts
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.floor(process.uptime()) });
});

// Routes - health route moved to different path
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/live-status', require('./routes/live-status'));
app.use('/api/health-metrics', require('./routes/health')); // renamed to avoid conflict
app.use('/api/commander', require('./routes/commander'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/memory', require('./routes/memory'));
app.use('/api/cron', require('./routes/cron'));
app.use('/api/system', require('./routes/system'));

// Detailed health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'GenPlatform Bridge API',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Bridge API Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.originalUrl 
  });
});

app.listen(PORT, () => {
  console.log(`🌉 GenPlatform Bridge API running on port ${PORT}`);
  console.log(`📊 Health metrics endpoint: http://localhost:${PORT}/api/health-metrics/collect`);
  console.log(`🔍 Live status endpoint: http://localhost:${PORT}/api/live-status`);
  console.log(`🔧 Commander endpoint: http://localhost:${PORT}/api/commander`);
  console.log(`🔧 Skills endpoint: http://localhost:${PORT}/api/skills`);
  console.log(`🧠 Memory endpoint: http://localhost:${PORT}/api/memory`);
  console.log(`⏰ Cron endpoint: http://localhost:${PORT}/api/cron`);
  console.log(`💻 System metrics endpoint: http://localhost:${PORT}/api/system/metrics`);
  console.log(`❤️ Simple health check: http://localhost:${PORT}/api/health`);
  console.log(`🩺 Detailed health: http://localhost:${PORT}/health`);
});