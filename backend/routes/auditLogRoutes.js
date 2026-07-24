const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Super Admin only — immutable action log
router.get('/', protect, requireRole('super_admin'), getAuditLogs);

module.exports = router;
