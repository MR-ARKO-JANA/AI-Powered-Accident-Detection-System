const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['hospital', 'police'],
        required: true
    },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    contactNumber: {
        type: String,
        required: true
    },
    address: {
        type: String,
        default: ''
    }
});

// Index for type-based queries (hospital vs police)
locationSchema.index({ type: 1 });
// Index for geospatial proximity queries
locationSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

module.exports = mongoose.model('Location', locationSchema);
