require('dotenv').config();
const mongoose = require('mongoose');
const SystemSettings = require('./models/SystemSettings');

const run = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/myreactdb';
        await mongoose.connect(uri);
        console.log('Connected to DB');

        let settings = await SystemSettings.getSettings();
        console.log('1. Initial Settings Security:', JSON.stringify(settings.security, null, 2));

        console.log('2. Simulating Controller Update to 120...');

        // Simulate Controller Logic
        const security = { allowRegistration: true, sessionTimeout: 120 };

        if (!settings.security) settings.security = {};
        if (security.allowRegistration !== undefined) settings.security.allowRegistration = security.allowRegistration;
        if (security.sessionTimeout !== undefined) settings.security.sessionTimeout = security.sessionTimeout;
        settings.markModified('security');
        settings.updatedAt = Date.now();

        await settings.save();
        console.log('3. Updates Saved.');

        // Re-fetch clean
        settings = await SystemSettings.findOne({ key: 'general' });
        console.log('4. Refetched Settings Security:', JSON.stringify(settings.security, null, 2));

        if (settings.security && settings.security.sessionTimeout === 120) {
            console.log('SUCCESS: Persistence verified.');
        } else {
            console.log('FAILURE: Value reverted to', settings.security ? settings.security.sessionTimeout : 'undefined');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
