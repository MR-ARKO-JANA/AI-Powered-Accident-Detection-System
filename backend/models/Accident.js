const mongoose = require("mongoose");

const accidentSchema = new mongoose.Schema({
    camId: {
        type: String,
        default: "CAM-01"
    },
    severity: {
        type: String,
        required: true,
        enum: ['Critical', 'High', 'Medium', 'Low']
    },
    location: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        default: Date.now
    },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    status: {
        type: String,
        enum: ['detected', 'acknowledged', 'responding', 'resolved'],
        default: 'detected'
    },
    alertSent: {
        type: Boolean,
        default: false
    },
    licensePlate: {
        type: String,
        default: "Unknown"
    },
    mediaUrl: {
        type: String,
        default: ""
    }

}, { timestamps: true });

// Index for dashboard queries (newest first)
accidentSchema.index({ createdAt: -1 });
// Index for camera-based filtering
accidentSchema.index({ camId: 1, createdAt: -1 });
// Index for status-based filtering
accidentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Accident', accidentSchema);