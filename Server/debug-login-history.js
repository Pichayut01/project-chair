// Debug script - Check if login history has detailed data
const mongoose = require('mongoose');
require('dotenv').config();

const LoginHistory = require('./models/LoginHistory');

async function debugLoginHistory() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get the most recent login
        const recent = await LoginHistory.findOne()
            .sort({ timestamp: -1 })
            .lean();

        if (!recent) {
            console.log('❌ No login history found');
            process.exit(1);
        }

        console.log('📊 Most Recent Login History:');
        console.log('=====================================');
        console.log('ID:', recent._id);
        console.log('User ID:', recent.userId);
        console.log('Action:', recent.action);
        console.log('Timestamp:', recent.timestamp);
        console.log('IP Address:', recent.ipAddress);
        console.log('\n📍 Location Data:');
        console.log(JSON.stringify(recent.location, null, 2));
        console.log('\n💻 Device Data:');
        console.log(JSON.stringify(recent.device, null, 2));
        console.log('\n🌐 Browser Data:');
        console.log(JSON.stringify(recent.browser, null, 2));
        console.log('\n🖥️  OS Data:');
        console.log(JSON.stringify(recent.os, null, 2));
        console.log('\n📱 User Agent:');
        console.log(recent.userAgent);
        console.log('\n✅ Success:', recent.success);
        console.log('=====================================');

        // Check if location is populated
        if (!recent.location || !recent.location.country) {
            console.log('\n⚠️  WARNING: Location data is missing or empty!');
        }
        if (!recent.device || !recent.device.type) {
            console.log('⚠️  WARNING: Device data is missing or empty!');
        }
        if (!recent.browser || !recent.browser.name) {
            console.log('⚠️  WARNING: Browser data is missing or empty!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugLoginHistory();
