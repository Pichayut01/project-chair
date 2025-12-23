const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subname: { type: String, default: 'General' },
    imageUrl: { type: String },
    bannerUrl: { type: String },
    color: { type: String, default: '#4CAF50' },
    classCode: { type: String, required: true, unique: true },
    creator: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPublic: { type: Boolean, default: false },
    allowSelfJoin: { type: Boolean, default: true },
    seatingPositions: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    assignedUsers: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    studentScores: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    rows: { type: Number, default: 0 },
    cols: { type: Number, default: 0 },
    chairGroups: { type: mongoose.Schema.Types.Mixed, default: [] },
    chatMessages: {
        type: [{
            senderId: { type: String, required: true },
            senderName: { type: String, required: true },
            senderPhoto: { type: String },
            message: { type: String, required: true },
            timestamp: { type: Number, required: true }
        }],
        default: [] // ✨ CRITICAL: Default empty array so existing classrooms work
    }
});

module.exports = mongoose.model('Class', classSchema);
