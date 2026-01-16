const nodemailer = require('nodemailer');
const createLogger = require('../utils/logger');
const SystemSettings = require('../models/SystemSettings');
const logger = createLogger('Email');

let cachedTransporter = null;
let lastConfigHash = '';

const getTransporter = async () => {
    try {
        const settings = await SystemSettings.getSettings();
        if (!settings || !settings.email || !settings.email.user) {
            // Fallback to env if DB is empty (shouldn't happen with getSettings logic but safe fallback)
            logger.warn('Email settings not found in DB, using environment variables');
            return nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: { rejectUnauthorized: false }
            });
        }

        const configHash = `${settings.email.user}:${settings.email.pass}:${settings.email.service}`;

        if (cachedTransporter && lastConfigHash === configHash) {
            return cachedTransporter;
        }

        logger.info(`Creating new email transporter for: ${settings.email.user}`);
        cachedTransporter = nodemailer.createTransport({
            service: settings.email.service || 'gmail',
            auth: {
                user: settings.email.user,
                pass: settings.email.pass
            },
            tls: { rejectUnauthorized: false }
        });
        lastConfigHash = configHash;
        return cachedTransporter;

    } catch (error) {
        logger.error('Failed to get email transporter:', error);
        throw error;
    }
};

// Wrapper that mimics the nodemailer transporter interface
const dynamicTransporter = {
    sendMail: async (mailOptions) => {
        const transporter = await getTransporter();
        return transporter.sendMail(mailOptions);
    },
    verify: async (callback) => {
        try {
            const transporter = await getTransporter();
            transporter.verify((err, success) => {
                if (callback) callback(err, success);
            });
        } catch (error) {
            if (callback) callback(error, false);
        }
    }
};

// Verify on startup (non-blocking)
getTransporter().then(t => {
    t.verify((error, success) => {
        if (error) {
            logger.warn('Initial email verification failed (check settings):', error.message);
        } else {
            logger.success('Email system ready');
        }
    });
}).catch(err => logger.warn('Could not initialize email system:', err.message));

module.exports = dynamicTransporter;
