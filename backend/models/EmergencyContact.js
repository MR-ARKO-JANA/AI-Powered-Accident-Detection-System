const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: false } // Added for email alerts
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);