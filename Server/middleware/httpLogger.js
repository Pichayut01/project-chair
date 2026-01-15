const createLogger = require('../utils/logger');
const logger = createLogger('HTTP');

const httpLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log incoming request
    logger.info(`→ ${req.method} ${req.originalUrl} from ${req.ip}`);

    // Log request body for POST/PUT/PATCH (excluding sensitive data)
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        const sanitizedBody = { ...req.body };
        // Remove sensitive fields
        delete sanitizedBody.password;
        delete sanitizedBody.token;
        delete sanitizedBody.idToken;

        if (Object.keys(sanitizedBody).length > 0) {
            logger.debug(`  Body:`, sanitizedBody);
        }
    }

    // Capture the original end function
    const originalEnd = res.end;

    // Override res.end to log response
    res.end = function (chunk, encoding) {
        res.end = originalEnd;
        res.end(chunk, encoding);

        const duration = Date.now() - startTime;
        logger.http(req.method, req.originalUrl, res.statusCode, duration);

        // Log errors with details
        if (res.statusCode >= 400) {
            logger.warn(`  Response: ${res.statusCode} ${res.statusMessage}`);
        }
    };

    next();
};

module.exports = httpLogger;
