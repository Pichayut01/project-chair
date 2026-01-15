const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Health check endpoint
router.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const isDbConnected = dbState === 1;

    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    const healthData = {
        status: isDbConnected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: {
            seconds: Math.floor(uptime),
            formatted: formatUptime(uptime),
        },
        database: {
            connected: isDbConnected,
            state: getDbStateName(dbState),
            name: mongoose.connection.name || 'N/A',
        },
        memory: {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            rss: Math.round(memUsage.rss / 1024 / 1024),
        },
        process: {
            pid: process.pid,
            version: process.version,
            platform: process.platform,
        },
    };

    const statusCode = isDbConnected ? 200 : 503;
    res.status(statusCode).json(healthData);
});

// Simple ping endpoint
router.get('/ping', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// Helper functions
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
}

function getDbStateName(state) {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };
    return states[state] || 'unknown';
}

module.exports = router;
