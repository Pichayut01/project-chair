// Check login history data
const mongoose = require('mongoose');
require('dotenv').config();

const LoginHistory = require('./models/LoginHistory');
const User = require('./models/User');

async function checkLoginHistory() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all users
        const users = await User.find().select('email displayName');
        console.log(`📊 Total users: ${users.length}\n`);

        // Check login history for each user
        for (const user of users) {
            const count = await LoginHistory.countDocuments({ userId: user._id });
            console.log(`👤 ${user.email} (${user.displayName}): ${count} login records`);

            if (count > 0) {
                const latest = await LoginHistory.findOne({ userId: user._id })
                    .sort({ timestamp: -1 })
                    .lean();

                console.log(`   Latest login:`);
                console.log(`   - Time: ${latest.timestamp}`);
                console.log(`   - IP: ${latest.ipAddress}`);
                console.log(`   - Location: ${latest.location?.city || 'N/A'}, ${latest.location?.country || 'N/A'}`);
                console.log(`   - Device: ${latest.device?.icon || '?'} ${latest.device?.type || 'N/A'}`);
                console.log(`   - Browser: ${latest.browser?.icon || '?'} ${latest.browser?.name || 'N/A'}`);
                console.log(`   - OS: ${latest.os?.name || 'N/A'}\n`);
            } else {
                console.log(`   ⚠️  No login history found\n`);
            }
        }

        // Total login history
        const totalHistory = await LoginHistory.countDocuments();
        console.log(`\n📈 Total login history records: ${totalHistory}`);

        // Recent 5 logins
        console.log(`\n🕒 Recent 5 logins (all users):`);
        const recent = await LoginHistory.find()
            .sort({ timestamp: -1 })
            .limit(5)
            .populate('userId', 'email displayName')
            .lean();

        recent.forEach((login, index) => {
            console.log(`${index + 1}. ${login.userId?.email || 'Unknown'} - ${login.timestamp}`);
            console.log(`   ${login.location?.city || 'N/A'}, ${login.location?.country || 'N/A'}`);
            console.log(`   ${login.device?.icon || '?'} ${login.browser?.icon || '?'} ${login.browser?.name || 'N/A'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkLoginHistory();
