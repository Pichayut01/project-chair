// Migration script to update existing login history records with detailed info
const mongoose = require('mongoose');
require('dotenv').config();

const LoginHistory = require('./models/LoginHistory');

async function migrateLoginHistory() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all login history without detailed info
        const oldRecords = await LoginHistory.find({
            $or: [
                { 'location.country': { $exists: false } },
                { 'device.type': { $exists: false } },
                { 'browser.name': { $exists: false } }
            ]
        });

        console.log(`Found ${oldRecords.length} records to update`);

        for (const record of oldRecords) {
            // Update with default values for old records
            record.location = {
                country: 'Unknown',
                region: 'Unknown',
                city: 'Unknown',
                timezone: 'Unknown',
            };

            record.device = {
                type: 'desktop',
                vendor: 'Unknown',
                model: 'Unknown',
                icon: '💻',
            };

            record.browser = {
                name: 'Unknown',
                version: 'Unknown',
                icon: '🌐',
            };

            record.os = {
                name: 'Unknown',
                version: 'Unknown',
            };

            record.success = true;

            await record.save();
            console.log(`Updated record ${record._id}`);
        }

        console.log('Migration completed!');

        // Show current count
        const total = await LoginHistory.countDocuments();
        console.log(`Total login history records: ${total}`);

        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrateLoginHistory();
