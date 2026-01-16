require('dotenv').config();
const mongoose = require('mongoose');
const SystemSettings = require('./models/SystemSettings');

const run = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/myreactdb';
        await mongoose.connect(uri);
        console.log('Connected to DB');

        // Delete ALL settings
        const result = await SystemSettings.deleteMany({});
        console.log(`Deleted ${result.deletedCount} settings documents.`);

        console.log('Database cleaned. Next API call will recreate a fresh settings document.');

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
