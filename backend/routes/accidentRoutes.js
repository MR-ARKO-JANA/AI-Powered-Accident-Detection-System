const express = require('express');
const router = express.Router();
const { createAccident, getAccidents, getAccidentById, updateAccidentStatus, addFeedback, deleteAccident } = require('../controllers/accidentController');
const { protect, requireRole, adminOnly } = require('../middleware/authMiddleware');
const { audit } = require('../middleware/auditMiddleware');
const apiKeyAuth = require('../middleware/apiKeyAuth');

// AI Service creates accident records (API key auth)
router.post('/', apiKeyAuth, createAccident);

// Authenticated routes
router.get('/', protect, getAccidents);
router.get('/:id', protect, getAccidentById);

// Status updates (responder+)
router.patch('/:id/status', protect, requireRole('super_admin', 'zone_admin', 'responder'),
    audit('ACCIDENT_STATUS_CHANGED', 'Accident'), updateAccidentStatus);

// Feedback for retraining (responder+)
router.patch('/:id/feedback', protect, requireRole('super_admin', 'zone_admin', 'responder'),
    audit('ACCIDENT_FEEDBACK_ADDED', 'Accident'), addFeedback);

// Delete (admin only)
router.delete('/:id', protect, adminOnly, audit('ACCIDENT_DELETED', 'Accident'), deleteAccident);

module.exports = router;
