const http = require('http');
const mongoose = require('mongoose');
const createLogger = require('./logger');
const logger = createLogger('HealthCheck');

// Health Check Configuration
const healthCheckConfig = {
    interval: 10000, // 10 seconds
    endpoints: [
        { name: 'API Health', url: 'http://localhost:5000/api/health' },
        { name: 'Auth Check', url: 'http://localhost:5000/api/auth/me' }, // Will fail without auth, but checks if endpoint is up
    ],
    timeout: 5000, // 5 second timeout
};

// Global health status
const healthStatus = {
    server: 'unknown',
    database: 'unknown',
    lastCheck: null,
    uptime: 0,
    checks: 0,
    failures: 0,
};

// Make HTTP request to check endpoint
function checkEndpoint(url, timeout = 5000) {
    return new Promise((resolve) => {
        const startTime = Date.now();

        const req = http.get(url, { timeout }, (res) => {
            const duration = Date.now() - startTime;
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    success: true,
                    status: res.statusCode,
                    duration,
                    accessible: true,
                });
            });
        });

        req.on('error', (error) => {
            resolve({
                success: false,
                error: error.message,
                accessible: false,
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                success: false,
                error: 'Request timeout',
                accessible: false,
            });
        });
    });
}

// Check database connectivity
function checkDatabase() {
    try {
        const dbState = mongoose.connection.readyState;

        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
        };

        return {
            status: states[dbState] || 'unknown',
            connected: dbState === 1,
            name: mongoose.connection.name || 'N/A',
            host: mongoose.connection.host || 'N/A',
        };
    } catch (error) {
        return {
            status: 'error',
            connected: false,
            error: error.message,
        };
    }
}

// Get system information
function getSystemInfo() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
        memory: {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        },
        uptime: {
            seconds: Math.floor(uptime),
            formatted: formatUptime(uptime),
        },
        pid: process.pid,
    };
}

// Format uptime
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
}

// Perform health check
async function performHealthCheck() {
    healthStatus.checks++;
    healthStatus.lastCheck = new Date();

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('[HEALTH CHECK] Starting health check...');

    // Check database
    const dbStatus = checkDatabase();
    healthStatus.database = dbStatus.status;

    if (dbStatus.connected) {
        logger.info(`[DATABASE] ✓ Connected to ${dbStatus.name} at ${dbStatus.host}`);
    } else {
        logger.warn(`[DATABASE] ✗ Status: ${dbStatus.status}`);
        healthStatus.failures++;
    }

    // Check endpoints
    for (const endpoint of healthCheckConfig.endpoints) {
        const result = await checkEndpoint(endpoint.url, healthCheckConfig.timeout);

        if (result.accessible) {
            logger.info(`[${endpoint.name}] ✓ Accessible (${result.status}) - ${result.duration}ms`);
        } else {
            logger.warn(`[${endpoint.name}] ✗ Not accessible - ${result.error}`);
            healthStatus.failures++;
        }
    }

    // System information
    const sysInfo = getSystemInfo();
    healthStatus.uptime = sysInfo.uptime.seconds;

    logger.info(`[SYSTEM] Memory: ${sysInfo.memory.heapUsed}/${sysInfo.memory.heapTotal}MB | Uptime: ${sysInfo.uptime.formatted}`);

    // Overall status
    const overallStatus = dbStatus.connected ? '✓ HEALTHY' : '✗ DEGRADED';
    const successRate = ((healthStatus.checks - healthStatus.failures) / healthStatus.checks * 100).toFixed(2);

    logger.info(`[STATUS] ${overallStatus} | Success Rate: ${successRate}% (${healthStatus.checks - healthStatus.failures}/${healthStatus.checks})`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Start health check monitoring
function startHealthCheck() {
    logger.info('🏥 Health Check Monitor Started');
    logger.info(`⏱️  Check Interval: ${healthCheckConfig.interval / 1000} seconds`);
    logger.info(`🎯 Monitoring: Server, Database, API Endpoints`);
    logger.info('');

    // Initial check
    performHealthCheck();

    // Schedule periodic checks
    const intervalId = setInterval(() => {
        performHealthCheck();
    }, healthCheckConfig.interval);

    // Graceful shutdown
    const shutdown = () => {
        logger.info('🛑 Health Check Monitor Stopping...');
        clearInterval(intervalId);

        // Final report
        logger.info('');
        logger.info('━━━━━━━━━━━━ FINAL HEALTH REPORT ━━━━━━━━━━━━');
        logger.info(`Total Checks: ${healthStatus.checks}`);
        logger.info(`Failures: ${healthStatus.failures}`);
        logger.info(`Success Rate: ${((healthStatus.checks - healthStatus.failures) / healthStatus.checks * 100).toFixed(2)}%`);
        logger.info(`Uptime: ${formatUptime(healthStatus.uptime)}`);
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return intervalId;
}

// Export for use in server
module.exports = {
    startHealthCheck,
    performHealthCheck,
    getHealthStatus: () => healthStatus,
    healthCheckConfig,
};
