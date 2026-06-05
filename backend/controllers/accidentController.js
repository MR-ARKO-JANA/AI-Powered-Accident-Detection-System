const Accident = require("../models/Accident");
const Contact = require("../models/EmergencyContact");
const sendEmail = require("../config/mailer");
const { sendEmergencySMS } = require("../utils/smsService");

// @desc    Create a new accident record (Called by Python AI)
// @route   POST /api/accidents
const createAccident = async (req, res) => {
    try {
        const { camId, severity, location, time, coordinates, licensePlate, mediaUrl } = req.body;

        // Input validation
        if (!severity || !location || !coordinates?.lat || !coordinates?.lng) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: severity, location, coordinates.lat, coordinates.lng"
            });
        }

        const validSeverities = ["High", "Low"];
        if (!validSeverities.includes(severity)) {
            return res.status(400).json({
                success: false,
                message: `Invalid severity. Must be one of: ${validSeverities.join(", ")}`
            });
        }

        const accident = await Accident.create({
            camId: camId || "CAM-01",
            severity,
            location,
            time,
            coordinates,
            licensePlate: licensePlate || "Unknown",
            mediaUrl: mediaUrl || ""
        });

        // --- EMERGENCY ALERT SYSTEM ---
        if (process.env.NODE_ENV !== 'test') {
            try {
                const contacts = await Contact.find();
                let contactEmails = contacts.map(c => c.email).filter(e => e);
                
                // Include default alert email from env
                const defaultEmail = process.env.DEFAULT_ALERT_EMAIL;
                if (defaultEmail && !contactEmails.includes(defaultEmail)) {
                    contactEmails.push(defaultEmail);
                }

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

                    // Send to all contacts
                    await sendEmail(contactEmails.join(","), subject, `Emergency: ${severity} accident at ${location}. Map: ${mapLink}`, html);
                }

                // --- SMS ALERT (TWILIO SERVICE) ---
                if (severity === "High") {
                    const mapLink = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
                    
                    let contactPhones = contacts.map(c => c.phone).filter(p => p);
                    
                    // Include default alert phone from env
                    const defaultPhone = process.env.DEFAULT_ALERT_PHONE;
                    if (defaultPhone && !contactPhones.includes(defaultPhone)) {
                        contactPhones.push(defaultPhone);
                    }

                    // Send all SMS in parallel for better performance
                    await Promise.allSettled(
                        contactPhones.map(phone =>
                            sendEmergencySMS(phone, {
                                location: location,
                                severity: severity,
                                url: mapLink
                            })
                        )
                    );
                }
            } catch (alertError) {
                console.error("⚠️ Failed to send emergency alerts:", alertError.message);
            }
        }

        // --- REAL-TIME NOTIFICATION (SOCKET.IO) ---
        const io = req.app.get("io");
        if (io) {
            io.emit("accidentDetected", accident);
            console.log("📡 Real-time alert emitted via Socket.io");
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
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [accidents, total] = await Promise.all([
            Accident.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
            Accident.countDocuments()
        ]);

        res.json({
            success: true,
            data: accidents,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createAccident, getAccidents };