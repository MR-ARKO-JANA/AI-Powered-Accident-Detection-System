const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");


const http = require("http");
const { Server } = require("socket.io");

dotenv.config(); // load env variable from  .env file  

connectDB(); // connect to database 

const app = express();  // initialize express app
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust in production
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

    socket.on("disconnect", () => console.log("❌ Client disconnected"));
});

// middleware
app.use(cors()); // allow cross origin requests 
app.use(express.json()); // allow json data in requests 

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/accidents', require('./routes/accidentRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "Server is running with WebSockets",
        timestamp: new Date()
    })
})

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})