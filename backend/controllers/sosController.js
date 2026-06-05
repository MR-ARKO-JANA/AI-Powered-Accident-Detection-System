const SosAlert = require("../models/SosAlert");
const Contact = require("../models/EmergencyContact");
const sendEmail = require("../config/mailer");
const twilio = require("twilio");

const twilioClient = process.env.TWILIO_SID
    ? twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// Cooldown per device to prevent duplicate SOS spam
const deviceCooldowns = new Map();
const COOLDOWN_MS = 30_000; // 30 seconds

/**
 * Derive severity from confidence score.
 * >= 0.8 → Critical, >= 0.5 → High, else → Medium
 */
function deriveSeverity(confidence) {
    if (confidence >= 0.8) return "Critical";
    if (confidence >= 0.5) return "High";
    return "Medium";
}

/**
 * @desc    Receive a Voice SOS alert from the mobile app
 * @route   POST /api/sos
 * @access  Public (device-authenticated via deviceId)
 */
const createSOS = async (req, res) => {
    try {
        const { domain, transcript, confidence, coordinates, location, deviceId } = req.body;

        // ── Validation ──────────────────────────────────────────────
        if (!domain || !confidence || !coordinates?.lat || !coordinates?.lng) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: domain, confidence, coordinates.lat, coordinates.lng",
            });
        }

        const validDomains = ["Medical", "Fire", "Police"];
        if (!validDomains.includes(domain)) {
            return res.status(400).json({
                success: false,
                message: `Invalid domain. Must be one of: ${validDomains.join(", ")}`,
            });
        }

        // ── Per-Device Cooldown ─────────────────────────────────────
        const did = deviceId || "unknown";
        const lastTime = deviceCooldowns.get(did);
        if (lastTime && Date.now() - lastTime < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastTime)) / 1000);
            return res.status(429).json({
                success: false,
                message: `SOS cooldown active. Retry in ${remaining}s.`,
            });
        }
        deviceCooldowns.set(did, Date.now());

        // ── Persist to Database ─────────────────────────────────────
        const severity = deriveSeverity(confidence);
        const sosAlert = await SosAlert.create({
            domain,
            transcript: transcript || "",
            confidence,
            severity,
            coordinates,
            location: location || "Unknown Location",
            deviceId: did,
        });

        console.log(`🆘 Voice SOS received — Domain: ${domain} | Severity: ${severity} | Confidence: ${confidence}`);

        // ── Real-Time Broadcast via Socket.io ───────────────────────
        const io = req.app.get("io");
        if (io) {
            io.emit("sosAlertReceived", sosAlert);
            console.log("📡 SOS alert broadcast via Socket.io");
        }

        // ── Emergency Alert Pipeline (Email + SMS) ──────────────────
        if (process.env.NODE_ENV !== 'test') {
            try {
                const contacts = await Contact.find();
                const contactEmails = contacts.map((c) => c.email).filter(Boolean);
                const defaultEmail = process.env.DEFAULT_ALERT_EMAIL;
                if (defaultEmail && !contactEmails.includes(defaultEmail)) {
                    contactEmails.push(defaultEmail);
                }

                const domainEmoji = { Medical: "🚑", Fire: "🔥", Police: "🚔" };
                const mapLink = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
                const timeStr = new Date().toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                });

                if (contactEmails.length > 0) {
                    const subject = `${domainEmoji[domain] || "🆘"} VOICE SOS: ${domain} Emergency — ${severity}`;
                    const html = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px;">
                            <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                                <h2 style="margin:0;">${domainEmoji[domain]} Voice SOS Emergency Alert</h2>
                            </div>
                            <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                                <table style="width:100%; border-collapse:collapse;">
                                    <tr><td style="padding:8px; font-weight:bold;">Domain:</td><td style="padding:8px;">${domain}</td></tr>
                                    <tr><td style="padding:8px; font-weight:bold;">Severity:</td><td style="padding:8px; color:${severity === 'Critical' ? '#dc2626' : '#f59e0b'};">${severity}</td></tr>
                                    <tr><td style="padding:8px; font-weight:bold;">Transcript:</td><td style="padding:8px;"><em>"${transcript || 'N/A'}"</em></td></tr>
                                    <tr><td style="padding:8px; font-weight:bold;">Confidence:</td><td style="padding:8px;">${(confidence * 100).toFixed(0)}%</td></tr>
                                    <tr><td style="padding:8px; font-weight:bold;">Time:</td><td style="padding:8px;">${timeStr}</td></tr>
                                    <tr><td style="padding:8px; font-weight:bold;">Location:</td><td style="padding:8px;"><a href="${mapLink}">View on Google Maps</a></td></tr>
                                </table>
                                <p style="margin-top:16px; color:#6b7280; font-size:12px;">Source: Hands-Free Voice SOS Module | Device: ${did}</p>
                            </div>
                        </div>
                    `;
                    await sendEmail(contactEmails.join(","), subject, `Voice SOS: ${domain} at ${location}. Map: ${mapLink}`, html);
                }

                // SMS for Critical alerts
                if (twilioClient && severity === "Critical") {
                    const contactPhones = contacts.map((c) => c.phone).filter(Boolean);
                    const defaultPhone = process.env.DEFAULT_ALERT_PHONE;
                    if (defaultPhone && !contactPhones.includes(defaultPhone)) {
                        contactPhones.push(defaultPhone);
                    }

                    const smsBody = `${domainEmoji[domain]} APADS VOICE SOS: ${domain} emergency (${severity}). "${transcript || 'N/A'}". Map: ${mapLink}`;

                    // Send all SMS in parallel for better performance
                    await Promise.allSettled(
                        contactPhones.map(phone =>
                            twilioClient.messages.create({
                                body: smsBody,
                                from: process.env.TWILIO_PHONE,
                                to: phone,
                            })
                        )
                    );
                }

                // Mark alerts as sent
                sosAlert.alertsSent = true;
                await sosAlert.save();
            } catch (alertError) {
                console.error("⚠️ Failed to send SOS emergency alerts:", alertError.message);
            }
        }

        res.status(201).json({
            success: true,
            data: sosAlert,
        });
    } catch (error) {
        console.error("❌ SOS creation error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get all SOS alerts (newest first) with pagination
 * @route   GET /api/sos
 * @access  Public
 */
const getSOSAlerts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [alerts, total] = await Promise.all([
            SosAlert.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
            SosAlert.countDocuments()
        ]);

        res.json({
            success: true,
            data: alerts,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Cancel an SOS alert within the 30-second grace period
 * @route   POST /api/sos/:id/cancel
 * @access  Public
 */
const cancelSOS = async (req, res) => {
    try {
        const alert = await SosAlert.findById(req.params.id);
        if (!alert) {
            return res.status(404).json({ success: false, message: "SOS alert not found" });
        }

        // Only allow cancellation within 30 seconds of creation
        const elapsed = Date.now() - new Date(alert.createdAt).getTime();
        if (elapsed > 30_000) {
            return res.status(400).json({
                success: false,
                message: "Cancellation window expired (30 seconds). Emergency services have been dispatched.",
            });
        }

        alert.cancelled = true;
        await alert.save();

        // Broadcast cancellation
        const io = req.app.get("io");
        if (io) {
            io.emit("sosCancelled", { id: alert._id });
            console.log("📡 SOS cancellation broadcast via Socket.io");
        }

        res.json({ success: true, message: "SOS alert cancelled.", data: alert });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createSOS, getSOSAlerts, cancelSOS };
