const Accident = require("../models/Accident");
const Contact = require("../models/EmergencyContact");
const sendEmail = require("../config/mailer");
const twilio = require("twilio");

// Twilio Client Setup
const twilioClient = process.env.TWILIO_SID ? twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN) : null;

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
            let contactEmails = contacts.map(c => c.email).filter(e => e);
            
            // Ensure user's specific email is included
            if (!contactEmails.includes("arkojana45@gmail.com")) {
                contactEmails.push("arkojana45@gmail.com");
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
                        <li><strong>Emergency Contact:</strong> 7478435239</li>
                    </ul>
                    <p>Please dispatch emergency services immediately.</p>
                `;

                // Send to all contacts
                await sendEmail(contactEmails.join(","), subject, `Emergency: ${severity} accident at ${location}. Map: ${mapLink}`, html);
            }

            // --- SMS ALERT (TWILIO) ---
            if (twilioClient && severity === "High") {
                const mapLink = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
                const smsBody = `⚠️ APADS EMERGENCY: ${severity} accident at ${location}. Time: ${time}. Map: ${mapLink}`;

                let contactPhones = contacts.map(c => c.phone).filter(p => p);
                
                // Ensure user's specific number is included
                if (!contactPhones.includes("7478435239")) {
                    contactPhones.push("7478435239");
                }

                for (const phone of contactPhones) {
                    await twilioClient.messages.create({
                        body: smsBody,
                        from: process.env.TWILIO_PHONE,
                        to: phone
                    });
                    console.log(`📲 SMS sent to ${phone}`);
                }
            }
        } catch (alertError) {
            console.error("⚠️ Failed to send emergency alerts:", alertError.message);
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
        const accidents = await Accident.find().sort({ createdAt: -1 });
        res.json({ success: true, data: accidents });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createAccident, getAccidents };