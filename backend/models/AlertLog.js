const mongoose = require('mongoose');

const alertLogSchema = new mongoose.Schema({
    accident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Accident',
        required: true
    },
    channel: {
        type: String,
        enum: ['sms', 'email', 'websocket', 'voice_call'],
        required: true
    },
    recipient: {
        type: String,
        required: true // phone/email/socket-room id
    },
    status: {
        type: String,
        enum: ['queued', 'sent', 'delivered', 'failed'],
        default: 'queued'
    },
    providerResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: null // raw Twilio/SMTP response for debugging
    },
    attempt: {
        type: Number,
        default: 1
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
});

// Fast lookup of all alert attempts for a given incident
alertLogSchema.index({ accident: 1 });
// Status-based filtering
alertLogSchema.index({ status: 1 });

module.exports = mongoose.model('AlertLog', alertLogSchema);
