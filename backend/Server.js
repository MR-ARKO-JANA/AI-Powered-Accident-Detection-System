const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const http = require("http");
const { Server } = require("socket.io");

dotenv.config(); // load env variable from  .env file  

if (process.env.NODE_ENV !== 'test') {
    connectDB(); // connect to database 
}

const app = express();  // initialize express app
const server = http.createServer(app);

const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : "*";

const io = new Server(server, {
    cors: {
        origin: corsOrigins,
        methods: ["GET", "POST"]
    }
});

// Make io accessible to our routes/controllers
app.set("io", io);

io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);
    
    // Listen for raw detections from AI Service
    socket.on("accident_detected_raw", (data) => {
        console.log("🛰️ Raw detection received from AI Service. Broadcasting...");
        // Broadcast to all other clients (React)
        socket.broadcast.emit("accidentDetected", data);
    });

    // Listen for Voice SOS alerts from mobile devices
    socket.on("sos_alert_raw", (data) => {
        console.log("🆘 Voice SOS received via Socket.io. Broadcasting...");
        socket.broadcast.emit("sosAlertReceived", data);
    });

    socket.on("disconnect", () => console.log("❌ Client disconnected"));
});

// middleware
app.use(helmet()); // HTTP security headers
app.use(cors({ origin: corsOrigins })); // allow cross origin requests 
app.use(express.json({ limit: "1mb" })); // Prevent large payload DoS

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/accidents', require('./routes/accidentRoutes'));
app.use('/api/sos', require('./routes/sosRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "Server is running with WebSockets",
        timestamp: new Date()
    })
})

// Centralized error handler (must be AFTER all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
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
        // Force exit after 10 seconds
        setTimeout(() => process.exit(1), 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { app, server };