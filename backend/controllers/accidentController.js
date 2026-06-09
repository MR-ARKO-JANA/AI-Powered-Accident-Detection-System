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

        const validSeverities = ["Critical", "High", "Medium", "Low"];
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
            time: time ? new Date(time) : new Date(),
            coordinates,
            licensePlate: licensePlate || "Unknown",
            mediaUrl: mediaUrl || "",
            status: "detected"
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
                    const timeStr = accident.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
                    const html = `
                        <h2>Emergency Alert</h2>
                        <p>An accident has been detected by the AI surveillance system.</p>
                        <ul>
                            <li><strong>Severity:</strong> ${severity}</li>
                            <li><strong>Location:</strong> ${location}</li>
                            <li><strong>Time:</strong> ${timeStr}</li>
                            <li><strong>Map Link:</strong> <a href="${mapLink}">View on Google Maps</a></li>
                        </ul>
                        <p>Please dispatch emergency services immediately.</p>
                    `;

                    // Send to all contacts
                    await sendEmail(contactEmails.join(","), subject, `Emergency: ${severity} accident at ${location}. Map: ${mapLink}`, html);
                }

                // --- SMS ALERT (TWILIO SERVICE) ---
                if (severity === "Critical" || severity === "High") {
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

        // Optional filters
        const filter = {};
        if (req.query.severity) filter.severity = req.query.severity;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.camId) filter.camId = req.query.camId;

        const [accidents, total] = await Promise.all([
            Accident.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Accident.countDocuments(filter)
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

// @desc    Get single accident by ID
// @route   GET /api/accidents/:id
const getAccidentById = async (req, res) => {
    try {
        const accident = await Accident.findById(req.params.id);
        if (!accident) {
            return res.status(404).json({ success: false, message: "Accident not found" });
        }
        res.json({ success: true, data: accident });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update accident status (detected → acknowledged → responding → resolved)
// @route   PATCH /api/accidents/:id/status
const updateAccidentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['detected', 'acknowledged', 'responding', 'resolved'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
            });
        }

        const accident = await Accident.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!accident) {
            return res.status(404).json({ success: false, message: "Accident not found" });
        }

        // Broadcast status change via Socket.io
        const io = req.app.get("io");
        if (io) {
            io.emit("accidentStatusUpdated", { id: accident._id, status: accident.status });
            console.log(`📡 Accident status updated to '${status}' — broadcast sent`);
        }

        res.json({ success: true, data: accident });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete an accident record
// @route   DELETE /api/accidents/:id
const deleteAccident = async (req, res) => {
    try {
        const accident = await Accident.findByIdAndDelete(req.params.id);
        if (!accident) {
            return res.status(404).json({ success: false, message: "Accident not found" });
        }

        // Broadcast deletion via Socket.io
        const io = req.app.get("io");
        if (io) {
            io.emit("accidentDeleted", { id: req.params.id });
        }

        res.json({ success: true, message: "Accident record deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createAccident, getAccidents, getAccidentById, updateAccidentStatus, deleteAccident };