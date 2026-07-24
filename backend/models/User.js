const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['super_admin', 'zone_admin', 'responder', 'viewer'],
        default: 'viewer'
    },
    assignedZones: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Camera'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLoginAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for email lookups
userSchema.index({ email: 1 });
// Index for role-based queries
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);