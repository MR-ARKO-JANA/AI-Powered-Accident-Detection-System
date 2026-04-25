const express = require("express");
const router = express.Router();
const { createAccident, getAccidents } = require("../controllers/accidentController");

// Route to create a new accident record
router.post("/", createAccident);

// Route to get all accident records
router.get("/", getAccidents);

module.exports = router;
