const express = require("express");
const router = express.Router();
const { getDashboardStats, getAnalytics } = require("../controllers/statsController");
const { protect } = require("../middleware/authMiddleware");

// GET /api/stats/dashboard — Summary stats for the dashboard cards
router.get("/dashboard", protect, getDashboardStats);

// GET /api/stats/analytics — Detailed analytics for charts (optional ?days=30)
router.get("/analytics", protect, getAnalytics);

module.exports = router;
