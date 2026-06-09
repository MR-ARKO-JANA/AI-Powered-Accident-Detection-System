const express = require("express");
const router = express.Router();
const { createSOS, getSOSAlerts, cancelSOS } = require("../controllers/sosController");
const { protect } = require("../middleware/authMiddleware");
const { sosLimiter } = require("../middleware/rateLimiter");

// POST /api/sos — Receive a new voice SOS alert from mobile (rate limited)
router.post("/", sosLimiter, createSOS);

// GET /api/sos — Retrieve all SOS alerts for dashboard (requires auth)
router.get("/", protect, getSOSAlerts);

// POST /api/sos/:id/cancel — Cancel an SOS within the 30s grace window (rate limited)
router.post("/:id/cancel", sosLimiter, cancelSOS);

module.exports = router;
