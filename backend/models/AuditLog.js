const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true // e.g., "ACCIDENT_CONFIRMED", "USER_ROLE_CHANGED"
    },
    targetType: {
        type: String,
        default: '' // e.g., "Accident", "User", "Camera"
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    ipAddress: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Chronological audit browsing (newest first)
auditLogSchema.index({ createdAt: -1 });
// Actor-based filtering
auditLogSchema.index({ actor: 1 });
// Action-type filtering
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
