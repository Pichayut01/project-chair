// presets-backend/server.js

// 1. นำเข้า Environment Variables
require('dotenv').config();

// 2. นำเข้า Modules ที่จำเป็น
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// 3. สร้าง Express App
const app = express();
const port = process.env.PRESETS_PORT || 5001;

// 4. Middleware
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true
}));
app.use(express.json());

// 5. เชื่อมต่อ MongoDB Database (ใช้ database เดียวกับ main backend)
const uri = process.env.MONGODB_URI;
mongoose.connect(uri)
    .then(() => console.log('Presets Backend: MongoDB connected successfully!'))
    .catch(err => console.error('Presets Backend: MongoDB connection error:', err));

// 6. Import Models และ Routes
const RatingPreset = require('./models/RatingPreset');
const authMiddleware = require('./middleware/auth');
const presetsRoutes = require('./routes/presets');

// 7. Use Routes
app.use('/api/presets', presetsRoutes);

// 8. Health Check Route
app.get('/api/health', (req, res) => {
    res.json({ 
        message: 'Presets Backend is running!', 
        port: port,
        timestamp: new Date().toISOString()
    });
});

// 9. Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Presets Backend Error:', err.stack);
    res.status(500).json({ 
        message: 'Something went wrong in presets backend!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 10. 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Presets Backend: Route not found' });
});

// 11. Start Server
app.listen(port, () => {
    console.log(`🎯 Presets Backend server running on port ${port}`);
    console.log(`📊 Presets API available at http://localhost:${port}/api/presets`);
});

module.exports = app;
