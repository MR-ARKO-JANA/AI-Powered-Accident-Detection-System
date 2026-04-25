const Accident = require("../models/Accident");

// @desc    Create a new accident record (Called by Python AI)
// @route   POST /api/accidents
const createAccident = async (req, res) => {
    try {
        const { severity, location, time, coordinates } = req.body;

        const accident = await Accident.create({
            severity,
            location,
            time,
            coordinates
        });

        res.status(201).json({
            success: true,
            data: accident
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createAccident };