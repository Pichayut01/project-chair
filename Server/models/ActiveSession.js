const mongoose = require('mongoose');

const activeSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionToken: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    location: { type: String },
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('ActiveSession', activeSessionSchema);
