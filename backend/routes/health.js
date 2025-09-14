// ==================== routes/health.js ====================
const express = require('express');
const router = express.Router();
const { db, pool } = require('../config/database');
const { sql } = require('drizzle-orm');

// Health check route
router.get('/', async (req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database health check
router.get('/database', async (req, res) => {
  try {
    const start = Date.now();
    await db.execute(sql`SELECT NOW()`);
    const responseTime = Date.now() - start;
    
    res.json({
      status: 'OK',
      database: 'Connected',
      response_time: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// System info
router.get('/system', (req, res) => {
  res.json({
    status: 'OK',
    system: {
      node_version: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      cpu_usage: process.cpuUsage()
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;