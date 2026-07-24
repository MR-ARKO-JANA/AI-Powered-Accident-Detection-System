const express = require('express');
const router = express.Router();
const { getDashboardStats, getAnalytics, getUserStats } = require('../controllers/statsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboardStats);
router.get('/analytics', protect, getAnalytics);
router.get('/users', protect, adminOnly, getUserStats);

module.exports = router;
