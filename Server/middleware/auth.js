// presets-backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// User Schema (same as main backend)
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, select: false },
    displayName: { type: String },
    photoURL: { type: String },
    uid: { type: String, unique: true, sparse: true, default: null },
    createdClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    enrolledClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    pinnedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorCode: { type: String, select: false },
    twoFactorExpires: { type: Date, select: false },
    loginOtpCode: { type: String, select: false },
    loginOtpExpires: { type: Date, select: false }
});

// Class Schema (same as main backend)
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
});

const User = mongoose.model('User', userSchema);
const Class = mongoose.model('Class', classSchema);

// Authentication Middleware
const authMiddleware = async (req, res, next) => {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
