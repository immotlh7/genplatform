const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/live-status', require('./routes/live-status'));
app.use('/api/health', require('./routes/health'));
app.use('/api/commander', require('./routes/commander'));

// Health check
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
  console.log(`📊 Health metrics endpoint: http://localhost:${PORT}/api/health/collect`);
  console.log(`🔍 Live status endpoint: http://localhost:${PORT}/api/live-status`);
  console.log(`🔧 Commander endpoint: http://localhost:${PORT}/api/commander`);
});