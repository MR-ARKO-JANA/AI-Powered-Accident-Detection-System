const express = require("express");
const router = express.Router();
const { createSOS, getSOSAlerts, cancelSOS } = require("../controllers/sosController");

// POST /api/sos — Receive a new voice SOS alert from mobile
router.post("/", createSOS);

// GET /api/sos — Retrieve all SOS alerts for dashboard
router.get("/", getSOSAlerts);

// POST /api/sos/:id/cancel — Cancel an SOS within the 30s grace window
router.post("/:id/cancel", cancelSOS);

module.exports = router;
