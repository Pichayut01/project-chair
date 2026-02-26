// presets-backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Require existing models instead of redefining them
const User = require('../models/User');
const Class = require('../models/Class');

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
