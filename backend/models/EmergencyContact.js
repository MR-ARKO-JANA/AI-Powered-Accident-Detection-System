const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
    linkedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // optional link to a registered user
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: ''
    },
    relation: {
        type: String,
        default: '' // e.g., "Family", "Fleet Manager"
    },
    vehiclePlate: {
        type: String,
        default: '' // optional, for future license-plate matching
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Lookup by linked user
emergencyContactSchema.index({ linkedUser: 1 });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);