const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    accident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Accident',
        required: true
    },
    labeledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    label: {
        type: String,
        enum: ['true_positive', 'false_positive'],
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    usedInTrainingBatch: {
        type: String,
        default: null // batch ID once consumed for retraining
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Fast lookup by accident
feedbackSchema.index({ accident: 1 });
// Find unconsumed feedback for retraining export
feedbackSchema.index({ usedInTrainingBatch: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
