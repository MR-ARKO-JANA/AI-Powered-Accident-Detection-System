const express = require("express");
const router = express.Router();
const { createAccident } = require("../controllers/accidentController");

// Route to create a new accident record
router.post("/", createAccident);

module.exports = router;
