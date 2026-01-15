/**
 * Script to set password for OAuth users who don't have one
 * Usage: node set-password.js <email> <new_password>
 * Example: node set-password.js admin@example.com MySecurePassword123!
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.error('Usage: node set-password.js <email> <new_password>');
    console.error('Example: node set-password.js admin@example.com MySecurePassword123!');
    process.exit(1);
}

if (password.length < 8) {
    console.error('Password must be at least 8 characters long');
    process.exit(1);
}

async function setPassword() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            console.error(`User not found with email: ${email}`);
            process.exit(1);
        }

        console.log(`Found user: ${user.displayName || user.email}`);
        console.log(`Current password: ${user.password ? '(set)' : '(not set - OAuth user)'}`);

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user password
        user.password = hashedPassword;
        await user.save();

        console.log(`✅ Password set successfully for ${user.email}!`);
        console.log(`You can now login with email/password`);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

setPassword();
