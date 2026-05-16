const mongoose = require("mongoose");

const sosAlertSchema = new mongoose.Schema({
    // Emergency domain classified by on-device intent engine
    domain: {
        type: String,
        required: true,
        enum: ["Medical", "Fire", "Police"],
    },

    // The raw transcript from on-device speech recognition
    transcript: {
        type: String,
        default: "",
    },

    // Confidence score from the intent classifier (0.0 - 1.0)
    confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
    },

    // Severity derived from confidence: >= 0.8 = Critical, >= 0.5 = High, else = Medium
    severity: {
        type: String,
        required: true,
        enum: ["Critical", "High", "Medium"],
    },

    // GPS coordinates from the mobile device
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },

    // Reverse-geocoded or raw location string
    location: {
        type: String,
        default: "Unknown Location",
    },

    // Device metadata for audit trail
    deviceId: {
        type: String,
        default: "unknown",
    },

    // Whether this SOS was cancelled within the grace period
    cancelled: {
        type: Boolean,
        default: false,
    },

    // Whether emergency alerts (email/SMS) were dispatched
    alertsSent: {
        type: Boolean,
        default: false,
    },

    // Source identifier — distinguishes from camera-detected accidents
    source: {
        type: String,
        default: "voice_sos",
        immutable: true,
    },
}, { timestamps: true });

module.exports = mongoose.model("SosAlert", sosAlertSchema);
