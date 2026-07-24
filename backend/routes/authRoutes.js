const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updatePassword } = require('../controllers/authController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { audit } = require('../middleware/auditMiddleware');

// Public
router.post('/login', loginUser);

// Admin-only registration
router.post('/register', protect, requireRole('super_admin', 'zone_admin'), audit('USER_REGISTERED', 'User'), registerUser);

// Authenticated
router.get('/me', protect, getMe);
router.patch('/password', protect, audit('PASSWORD_CHANGED', 'User'), updatePassword);

module.exports = router;