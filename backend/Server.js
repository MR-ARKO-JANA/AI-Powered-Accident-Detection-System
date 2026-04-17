const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config(); // load env variable from .env file

connectDB(); // connect to database

const app = express() ; // initialize express app

// middleware
app.use(cors()); // allow cross origin requests
app.use(express.json()); // allow json data in requests

app.get("/api/status", (req,res) =>{
    res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date()
    })
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})
