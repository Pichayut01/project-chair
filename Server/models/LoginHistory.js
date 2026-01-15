const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // 'login', 'logout', 'password_changed', '2fa_enabled', etc.

    // IP and Location
    ipAddress: { type: String },
    location: {
        country: { type: String },
        region: { type: String },
        city: { type: String },
        timezone: { type: String },
        coordinates: { type: [Number] }, // [latitude, longitude]
    },

    // Device and Browser Info
    device: {
        type: { type: String }, // mobile, tablet, desktop, etc.
        vendor: { type: String },
        model: { type: String },
        icon: { type: String }, // emoji icon
    },
    browser: {
        name: { type: String },
        version: { type: String },
        icon: { type: String }, // emoji icon
    },
    os: {
        name: { type: String },
        version: { type: String },
    },

    // Raw user agent for reference
    userAgent: { type: String },

    // Status
    success: { type: Boolean, default: true },

    timestamp: { type: Date, default: Date.now },
});

// Index for faster queries
loginHistorySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
