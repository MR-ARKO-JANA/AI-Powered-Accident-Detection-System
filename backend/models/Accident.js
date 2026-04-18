const mongoose = require("mongoose");

const accidentSchema = new mongoose.Schema({
    severity: {
        type: String,
        required: true,
        enum: ['High', 'Low']
    },
    location: {
        type: String,
        require: true
    },
    time: {
        type: String,
        require: true
    },
    coordinates: {
        lat: { type: Number, require: true },
        lng: { type: Number, require: true }
    },
    alertSent: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model('Accident', accidentSchema);