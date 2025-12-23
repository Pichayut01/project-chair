const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // 'login', 'logout', 'password_changed', '2fa_enabled', etc.
    ipAddress: { type: String },
    userAgent: { type: String },
    location: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
