const express = require("express");
const router = express.Router();
const { createAccident, getAccidents, getAccidentById, updateAccidentStatus, deleteAccident } = require("../controllers/accidentController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const apiKeyAuth = require("../middleware/apiKeyAuth");

// Route to create a new accident record (AI service requires API key auth)
router.post("/", apiKeyAuth, createAccident);

// Route to get all accident records (requires authentication)
router.get("/", protect, getAccidents);

// Route to get a single accident by ID (requires authentication)
router.get("/:id", protect, getAccidentById);

// Route to update accident status (requires authentication)
router.patch("/:id/status", protect, updateAccidentStatus);

// Route to delete an accident (admin only)
router.delete("/:id", protect, adminOnly, deleteAccident);

module.exports = router;
