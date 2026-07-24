const express = require('express');
const router = express.Router();
const { getAlertStatus, getAllAlerts } = require('../controllers/alertController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Authenticated — get alert delivery status for a specific accident
router.get('/:accidentId/status', protect, getAlertStatus);

// Admin — view all alert logs
router.get('/', protect, adminOnly, getAllAlerts);

module.exports = router;
