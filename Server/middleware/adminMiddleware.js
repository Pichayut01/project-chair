const createLogger = require('../utils/logger');
const logger = createLogger('Admin Middleware');

/**
 * Admin Middleware - Requires authMiddleware to be called first
 * Checks if authenticated user has admin role
 */
const adminMiddleware = async (req, res, next) => {
    if (!req.user) {
        logger.warn(`Admin access denied: No authenticated user for ${req.method} ${req.originalUrl}`);
        return res.status(401).json({ msg: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
        logger.warn(`Admin access denied: User ${req.user.email} attempted admin access to ${req.originalUrl}`);
        return res.status(403).json({ msg: 'Admin access required' });
    }

    logger.auth('Admin access granted', req.user.email, 'success');
    next();
};

module.exports = adminMiddleware;
