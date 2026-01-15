const mongoose = require('mongoose');
const createLogger = require('../utils/logger');
const logger = createLogger('Database');

const connectDB = async () => {
    try {
        logger.info('Connecting to MongoDB...');
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        logger.success(`MongoDB connected successfully! DB: ${mongoose.connection.name}`);
        logger.info(`Database host: ${mongoose.connection.host}`);
    } catch (err) {
        logger.error('MongoDB connection error:', err);
        logger.fatal('Failed to connect to database. Exiting...');
        process.exit(1);
    }
};

module.exports = connectDB;
