require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Config
const connectDB = require('./config/db');
require('./config/firebase'); // Init Firebase Admin
require('./config/email'); // Init Email

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3001", "http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/users', require('./routes/users'));
app.use('/api/presets', require('./routes/presets')); // From presets-backend

// Socket Handler
require('./socket/socketHandler')(io);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Start Server
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Socket.IO initialized`);
});