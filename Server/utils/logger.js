const chalk = require('chalk');
const logSymbols = require('log-symbols').default; // ES modules ต้องใช้ .default
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const stripAnsi = require('strip-ansi').default; // ES modules ต้องใช้ .default

// Create logs directory if not exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Winston file transport configurations
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Error log file - errors only
const errorFileTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
});

// Combined log file - all levels
const combinedFileTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
});

// Winston logger instance
const winstonLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        errorFileTransport,
        combinedFileTransport
    ]
});

// Define module colors for visual distinction
const moduleColors = {
    'Server': chalk.cyan.bold,
    'Database': chalk.green.bold,
    'Firebase': chalk.magenta.bold,
    'Email': chalk.yellow.bold,
    'HTTP': chalk.blue.bold,
    'Socket.IO': chalk.red.bold,
    'Auth Middleware': chalk.magenta.bold,
    'Upload': chalk.blueBright.bold,
    'AuthController': chalk.greenBright.bold,
    'ClassController': chalk.greenBright.bold
};

// Helper to format timestamp
const getTimestamp = () => {
    const now = new Date();
    return chalk.gray(`[${now.toTimeString().split(' ')[0]}]`);
};

// Helper to summarize large data objects
const summarizeData = (data) => {
    if (!data) return '';

    // If data is small (string or small object), show it
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

    // If less than 100 characters, show full data
    if (dataStr.length < 100) {
        return chalk.gray(dataStr);
    }

    // For large objects, show summary
    if (typeof data === 'object' && data !== null) {
        const keys = Object.keys(data);
        const summary = [];

        // Show important fields
        for (const key of keys.slice(0, 3)) {
            const value = data[key];
            if (typeof value === 'object' && value !== null) {
                const subKeys = Object.keys(value);
                summary.push(`${key}: {${subKeys.length} items}`);
            } else if (Array.isArray(value)) {
                summary.push(`${key}: [${value.length} items]`);
            } else {
                summary.push(`${key}: ${value}`);
            }
        }

        const remaining = keys.length - 3;
        if (remaining > 0) {
            summary.push(`...+${remaining} more`);
        }

        return chalk.gray(`{${summary.join(', ')}}`);
    }

    // For very long strings, truncate
    return chalk.gray(dataStr.substring(0, 80) + '...');
};

// Socket.IO instance
let socketIo = null;

const createLogger = (moduleName) => {
    // Get color for this module, default to cyan if not defined
    const moduleColor = moduleColors[moduleName] || chalk.cyan.bold;
    const modulePrefix = moduleColor(`[${moduleName}]`);

    const log = (level, symbol, msg, data = null) => {
        const timestamp = getTimestamp();
        const dataStr = data ? ` ${summarizeData(data)}` : '';
        const output = `${timestamp} ${modulePrefix} ${symbol} ${msg}${dataStr}`;

        // Console output (colored)
        console.log(output);

        // File output (plain text, no ANSI codes)
        const plainMsg = stripAnsi(msg);
        const logEntry = {
            level: level,
            module: moduleName,
            message: plainMsg,
            data: data || {}
        };

        winstonLogger.log(logEntry);

        // Real-time Socket.IO emission (if configured)
        if (socketIo) {
            socketIo.to('admins').emit('system_log', {
                timestamp: new Date().toISOString(),
                ...logEntry
            });
        }
    };

    return {
        trace: (msg, data) => {
            log('debug', chalk.gray('○'), chalk.gray(msg), data);
        },

        debug: (msg, data) => {
            log('debug', chalk.blue('◆'), chalk.gray(msg), data);
        },

        info: (msg, data) => {
            log('info', logSymbols.info, msg, data);
        },

        warn: (msg, data) => {
            log('warn', logSymbols.warning, chalk.yellow(msg), data);
        },

        error: (msg, data) => {
            log('error', logSymbols.error, chalk.red(msg), data);
        },

        fatal: (msg, data) => {
            log('error', logSymbols.error, chalk.bgRed.white(msg), data);
        },

        // Specialized logging methods
        success: (msg, data) => {
            log('info', logSymbols.success, chalk.green(msg), data);
        },

        http: (method, url, status, duration) => {
            const methodColor = {
                'GET': chalk.blue,
                'POST': chalk.green,
                'PUT': chalk.yellow,
                'DELETE': chalk.red,
                'PATCH': chalk.magenta
            }[method] || chalk.white;

            const statusColor = status >= 500 ? chalk.red :
                status >= 400 ? chalk.yellow :
                    status >= 300 ? chalk.cyan :
                        status >= 200 ? chalk.green :
                            chalk.white;

            const statusSymbol = status >= 500 ? logSymbols.error :
                status >= 400 ? logSymbols.warning :
                    status >= 200 ? logSymbols.success : logSymbols.info;

            const timestamp = getTimestamp();
            const consoleOutput = `${timestamp} ${modulePrefix} ${statusSymbol} ${methodColor(method.padEnd(7))} ${url.padEnd(40)} ${statusColor(status)} ${chalk.gray(`[${duration}ms]`)}`;
            console.log(consoleOutput);

            // File output
            const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
            const logEntry = {
                level: level,
                module: moduleName,
                message: `HTTP ${method} ${url}`,
                data: { method, url, status, duration }
            };

            winstonLogger.log(logEntry);

            // Real-time Socket.IO emission
            if (socketIo) {
                socketIo.to('admins').emit('system_log', {
                    timestamp: new Date().toISOString(),
                    ...logEntry
                });
            }
        },

        socket: (event, data) => {
            const timestamp = getTimestamp();
            const summary = summarizeData(data);
            console.log(`${timestamp} ${modulePrefix} ${chalk.magenta('⚡')} ${chalk.yellow(event)} ${summary}`);

            // File output
            const logEntry = {
                module: moduleName,
                message: `Socket event: ${event}`,
                data: data || {}
            };
            winstonLogger.info(logEntry);

            // Real-time Socket.IO emission
            if (socketIo) {
                socketIo.to('admins').emit('system_log', {
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    ...logEntry
                });
            }
        },

        db: (operation, collection, details) => {
            const timestamp = getTimestamp();
            const detailsStr = details ? ` ${summarizeData(details)}` : '';
            console.log(`${timestamp} ${modulePrefix} ${chalk.blue('💾')} ${operation}: ${chalk.cyan(collection)}${detailsStr}`);

            // File output
            const logEntry = {
                module: moduleName,
                message: `DB ${operation}: ${collection}`,
                data: details || {}
            };
            winstonLogger.info(logEntry);

            // Real-time Socket.IO emission
            if (socketIo) {
                socketIo.to('admins').emit('system_log', {
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    ...logEntry
                });
            }
        },

        auth: (action, user, status) => {
            const statusSymbol = status === 'success' ? logSymbols.success : logSymbols.error;
            const timestamp = getTimestamp();
            console.log(`${timestamp} ${modulePrefix} ${chalk.magenta('🔐')} ${action}: ${user} ${statusSymbol}`);

            // File output
            const level = status === 'success' ? 'info' : 'warn';
            const logEntry = {
                level: level,
                module: moduleName,
                message: `Auth ${action}: ${user}`,
                data: { action, user, status }
            };
            winstonLogger.log(logEntry);

            // Real-time Socket.IO emission
            if (socketIo) {
                socketIo.to('admins').emit('system_log', {
                    timestamp: new Date().toISOString(),
                    ...logEntry
                });
            }
        }
    };
};

// Export method to set socket instance
createLogger.setSocketInstance = (io) => {
    socketIo = io;
};

module.exports = createLogger;
