const nodemailer = require('nodemailer');
const createLogger = require('../utils/logger');
const logger = createLogger('Email');

logger.info('Configuring email transporter...');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Test email configuration on startup
transporter.verify(function (error, success) {
    if (error) {
        logger.error('Email configuration error:', error);
        logger.warn('Email functionality may not work properly');
    } else {
        logger.success('Email server is ready to send messages');
        logger.debug(`Email user: ${process.env.EMAIL_USER}`);
    }
});

module.exports = transporter;
