const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require('../chair-f440c-firebase-adminsdk-fbsvc-92d591e38e.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

console.log('Firebase Admin SDK initialized.');

module.exports = admin;
