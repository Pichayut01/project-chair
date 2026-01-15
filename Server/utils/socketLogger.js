const createLogger = require('./logger');
const logger = createLogger('Socket.IO');

/**
 * Wraps Socket.IO instance with comprehensive logging
 */
function wrapSocketWithLogging(io) {
    io.on('connection', (socket) => {
        logger.success(`Client connected: ${socket.id}`);

        // Log all events
        const originalOn = socket.on.bind(socket);
        const originalEmit = socket.emit.bind(socket);

        // Wrap socket.on to log incoming events
        socket.on = function (event, handler) {
            return originalOn(event, function (...args) {
                if (event !== 'disconnect' && event !== 'disconnecting') {
                    logger.socket(`← ${event}`, args[0]);
                }
                return handler.apply(this, args);
            });
        };

        // Wrap socket.emit to log outgoing events
        socket.emit = function (event, ...args) {
            logger.socket(`→ ${event}`, args[0]);
            return originalEmit(event, ...args);
        };

        // Log disconnection
        socket.on('disconnect', (reason) => {
            logger.warn(`Client disconnected: ${socket.id} (${reason})`);
        });
    });

    return io;
}

/**
 * Helper to log socket room operations
 */
function logRoomOperation(operation, socketId, room, data) {
    logger.info(`${operation}: Socket ${socketId} ${operation.toLowerCase()} room ${room}`, data || '');
}

module.exports = {
    wrapSocketWithLogging,
    logRoomOperation,
    logger
};
