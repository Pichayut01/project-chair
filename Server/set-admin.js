/**
 * Script to set admin role for an existing user
 * Usage: node set-admin.js <email>
 * Example: node set-admin.js admin@example.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const email = process.argv[2];

if (!email) {
    console.error('Usage: node set-admin.js <email>');
    console.error('Example: node set-admin.js admin@example.com');
    process.exit(1);
}

async function setAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error(`User not found with email: ${email}`);
            process.exit(1);
        }

        console.log(`Found user: ${user.displayName || user.email}`);
        console.log(`Current role: ${user.role || 'undefined (will be set to user)'}`);

        // Update user role to admin
        user.role = 'admin';
        await user.save();

        console.log(`✅ Successfully set ${user.email} as admin!`);
        console.log(`New role: ${user.role}`);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

setAdmin();
