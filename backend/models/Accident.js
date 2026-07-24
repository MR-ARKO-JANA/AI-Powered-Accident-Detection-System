const mongoose = require('mongoose');

const accidentSchema = new mongoose.Schema({
    camera: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Camera',
        required: true
    },
    detectedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    confidence: {
        type: Number,
        required: true, // 0.0 - 1.0
        min: 0,
        max: 1
    },
    severity: {
        type: String,
        enum: ['minor', 'moderate', 'severe'],
        required: true
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, default: '' }
    },
    evidence: {
        imageUrl: { type: String, default: '' },
        clipUrl: { type: String, default: '' } // short video clip in S3/Cloudinary
    },
    status: {
        type: String,
        enum: ['needs_review', 'confirmed', 'false_positive', 'resolved'],
        default: 'needs_review'
    },
    nearestHospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        default: null
    },
    nearestPolice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        default: null
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewNote: {
        type: String,
        default: ''
    },
    // Legacy compatibility fields (for existing AI service payloads)
    camId: {
        type: String,
        default: ''
    },
    licensePlate: {
        type: String,
        default: 'Unknown'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Fast recent-accidents queries for dashboard
accidentSchema.index({ detectedAt: -1 });
accidentSchema.index({ createdAt: -1 });
// Geospatial queries for nearby lookups and map clustering
accidentSchema.index({ 'location.lat': 1, 'location.lng': 1 });
// Fast filtering for reports page
accidentSchema.index({ status: 1, severity: 1 });
// Camera-based filtering
accidentSchema.index({ camera: 1, detectedAt: -1 });

module.exports = mongoose.model('Accident', accidentSchema);