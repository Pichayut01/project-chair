const admin = require('firebase-admin');
const path = require('path');
const createLogger = require('../utils/logger');
const logger = createLogger('Firebase');

const serviceAccount = require('../chair-f440c-firebase-adminsdk-fbsvc-92d591e38e.json');

logger.info('Initializing Firebase Admin SDK...');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

logger.success('Firebase Admin SDK initialized successfully!');
logger.debug(`Project ID: ${serviceAccount.project_id}`);

module.exports = admin;
