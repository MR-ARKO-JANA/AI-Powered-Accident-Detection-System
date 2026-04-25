const Accident = require("../models/Accident");
const Contact = require("../models/EmergencyContact");
const sendEmail = require("../config/mailer");

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

        // --- EMERGENCY ALERT SYSTEM ---
        try {
            const contacts = await Contact.find();
            const contactEmails = contacts.map(c => c.email).filter(e => e); // Assume email field exists in model
            
            if (contactEmails.length > 0) {
                const subject = `⚠️ EMERGENCY: ${severity} Severity Accident Detected`;
                const mapLink = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
                const html = `
                    <h2>Emergency Alert</h2>
                    <p>An accident has been detected by the AI surveillance system.</p>
                    <ul>
                        <li><strong>Severity:</strong> ${severity}</li>
                        <li><strong>Location:</strong> ${location}</li>
                        <li><strong>Time:</strong> ${time}</li>
                        <li><strong>Map Link:</strong> <a href="${mapLink}">View on Google Maps</a></li>
                    </ul>
                    <p>Please dispatch emergency services immediately.</p>
                `;
                
                // Send to all contacts (for demo, we just send to the first one or a test email)
                await sendEmail(contactEmails.join(","), subject, "", html);
            }
        } catch (alertError) {
            console.error("⚠️ Failed to send emergency alerts:", alertError.message);
        }

        res.status(201).json({
            success: true,
            data: accident
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all accident records
// @route   GET /api/accidents
const getAccidents = async (req, res) => {
    try {
        const accidents = await Accident.find().sort({ createdAt: -1 });
        res.json({ success: true, data: accidents });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createAccident, getAccidents };