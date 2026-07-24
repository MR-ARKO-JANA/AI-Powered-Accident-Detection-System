const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

const app = express();
const server = http.createServer(app);

const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : '*';

const io = new Server(server, {
    cors: {
        origin: corsOrigins,
        methods: ['GET', 'POST']
    }
});

// Make io accessible to routes/controllers
app.set('io', io);

// ── WebSocket Connection Handling ──
io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    // Listen for raw detections from AI Service
    socket.on('accident_detected_raw', (data) => {
        console.log('🛰️ Raw detection received from AI Service. Broadcasting...');
        socket.broadcast.emit('accident:new', data);
    });

    // Listen for Voice SOS alerts from mobile devices
    socket.on('sos_alert_raw', (data) => {
        console.log('🆘 Voice SOS received via Socket.io. Broadcasting...');
        socket.broadcast.emit('sos:new', data);
    });

    socket.on('disconnect', () => console.log('❌ Client disconnected:', socket.id));
});

// ── Middleware ──
app.use(helmet());
app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: '1mb' }));

const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api', apiLimiter);

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health Check ──
app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'backend',
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// ── API Routes ──
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/accidents', require('./routes/accidentRoutes'));
app.use('/api/cameras', require('./routes/cameraRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/audit-logs', require('./routes/auditLogRoutes'));
app.use('/api/sos', require('./routes/sosRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        message: 'APADS Backend — Running with WebSockets',
        version: '2.0.0',
        timestamp: new Date()
    });
});

// AI Service proxy endpoint
const multer = require('multer');
const upload = multer();
app.post('/api/ai-detect', upload.single('frame'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No frame file uploaded' });
        }

        const formData = new FormData();
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append('frame', blob, req.file.originalname);

        const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
        const aiResponse = await fetch(`${AI_SERVICE_URL}/detect`, {
            method: 'POST',
            body: formData
        });

        if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            throw new Error(`AI service responded with status ${aiResponse.status}: ${errText}`);
        }

        const data = await aiResponse.json();
        res.json(data);
    } catch (error) {
        console.error('Proxy error to AI service:', error.message);
        next(error);
    }
});

// Serve static frontend build
app.use(express.static(path.join(__dirname, '../frontend/my-app/build')));

// Serve index.html for all other client routes (SPA support)
app.get('*all', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path === '/health') {
        return next();
    }
    res.sendFile(path.join(__dirname, '../frontend/my-app/build', 'index.html'));
});

// Centralized error handler (must be AFTER all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`🚀 APADS Backend running on port ${PORT}`);
        console.log(`📡 WebSocket server ready`);
        console.log(`💊 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
        console.log(`\n${signal} received. Shutting down gracefully...`);
        server.close(() => {
            console.log('HTTP server closed.');
            mongoose.connection.close(false).then(() => {
                console.log('MongoDB connection closed.');
                process.exit(0);
            });
        });
        setTimeout(() => process.exit(1), 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { app, server };