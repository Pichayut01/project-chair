const rateLimit = require('express-rate-limit');
const createLogger = require('../utils/logger');
const logger = createLogger('RateLimit');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        });
    },
});

// Strict limiter for login/register endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Increased from 5 to 20 for development (adjust for production)
    skipSuccessfulRequests: true, // Don't count successful requests
    message: {
        error: 'Too many login attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    handler: (req, res) => {
        logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many login attempts, please try again later.',
            retryAfter: '15 minutes'
        });
    },
});

// Login history endpoint limiter (prevent spam requests)
const loginHistoryLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Increased from 10 to 30 for better UX
    message: {
        error: 'Too many requests, please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Login history rate limit exceeded for IP: ${req.ip}, User: ${req.user?.email || 'Unknown'}`);
        res.status(429).json({
            error: 'Too many requests, please slow down.',
            retryAfter: '1 minute'
        });
    },
});

// Active sessions endpoint limiter
const activeSessionsLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Increased from 10 to 30 for better UX
    message: {
        error: 'Too many requests, please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    authLimiter,
    loginHistoryLimiter,
    activeSessionsLimiter,
};
