const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    zone: {
        type: String,
        required: true,
        trim: true
    },
    streamUrl: {
        type: String,
        default: null // RTSP/HLS url, or null for simulated/upload-only
    },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'maintenance'],
        default: 'offline'
    },
    edgeMode: {
        type: Boolean,
        default: false // true if running local TFLite inference
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for zone-based queries
cameraSchema.index({ zone: 1 });
// Index for status filtering
cameraSchema.index({ status: 1 });

module.exports = mongoose.model('Camera', cameraSchema);
