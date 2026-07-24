const Accident = require('../models/Accident');
const Camera = require('../models/Camera');
const Feedback = require('../models/Feedback');
const AlertLog = require('../models/AlertLog');
const EmergencyContact = require('../models/EmergencyContact');
const Location = require('../models/Location');
const sendEmail = require('../config/mailer');
const { sendEmergencySMS } = require('../utils/smsService');

/**
 * Helper: Find nearest Location by type (hospital/police)
 */
const findNearest = async (lat, lng, type) => {
    try {
        const locations = await Location.find({ type });
        if (locations.length === 0) return null;

        let nearest = null;
        let minDist = Infinity;
        for (const loc of locations) {
            const dist = Math.sqrt(
                Math.pow(loc.coordinates.lat - lat, 2) +
                Math.pow(loc.coordinates.lng - lng, 2)
            );
            if (dist < minDist) {
                minDist = dist;
                nearest = loc;
            }
        }
        return nearest;
    } catch {
        return null;
    }
};

/**
 * Helper: Deduplication — check if a similar accident was reported recently
 * Uses a 60-second + ~0.001 degree (~100m) window
 */
const isDuplicate = async (lat, lng) => {
    const timeWindow = new Date(Date.now() - 60 * 1000);
    const coordThreshold = 0.001; // ~100 meters

    const existing = await Accident.findOne({
        detectedAt: { $gte: timeWindow },
        'location.lat': { $gte: lat - coordThreshold, $lte: lat + coordThreshold },
        'location.lng': { $gte: lng - coordThreshold, $lte: lng + coordThreshold }
    });
    return !!existing;
};

/**
 * @desc    Create a new accident record (Called by AI Service)
 * @route   POST /api/accidents
 * @access  API Key Auth
 */
const createAccident = async (req, res) => {
    try {
        const { camId, severity, location, coordinates, confidence, licensePlate, mediaUrl } = req.body;

        // Input validation
        if (!severity || !coordinates?.lat || !coordinates?.lng) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: severity, coordinates.lat, coordinates.lng'
            });
        }

        const validSeverities = ['minor', 'moderate', 'severe'];
        // Map legacy severity names for backward compatibility
        const severityMap = {
            'Critical': 'severe', 'High': 'severe',
            'Medium': 'moderate', 'Low': 'minor',
            'minor': 'minor', 'moderate': 'moderate', 'severe': 'severe'
        };
        const mappedSeverity = severityMap[severity];
        if (!mappedSeverity) {
            return res.status(400).json({
                success: false,
                message: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`
            });
        }

        // Deduplication check
        if (await isDuplicate(coordinates.lat, coordinates.lng)) {
            return res.status(200).json({
                success: true,
                message: 'Duplicate detection — incident already logged',
                deduplicated: true
            });
        }

        // Find or create camera reference
        let cameraId = null;
        if (camId) {
            let camera = await Camera.findOne({ name: camId });
            if (!camera) {
                // Auto-create camera entry from legacy camId
                camera = await Camera.create({
                    name: camId,
                    zone: 'Default Zone',
                    coordinates: { lat: coordinates.lat, lng: coordinates.lng },
                    status: 'online'
                });
            }
            cameraId = camera._id;
        } else {
            // Use first available camera or create default
            let defaultCamera = await Camera.findOne();
            if (!defaultCamera) {
                defaultCamera = await Camera.create({
                    name: 'CAM-DEFAULT',
                    zone: 'Default Zone',
                    coordinates: { lat: coordinates.lat, lng: coordinates.lng },
                    status: 'online'
                });
            }
            cameraId = defaultCamera._id;
        }

        // Find nearest hospital and police station
        const nearestHospital = await findNearest(coordinates.lat, coordinates.lng, 'hospital');
        const nearestPolice = await findNearest(coordinates.lat, coordinates.lng, 'police');

        const accident = await Accident.create({
            camera: cameraId,
            detectedAt: new Date(),
            confidence: confidence || 0.5,
            severity: mappedSeverity,
            location: {
                lat: coordinates.lat,
                lng: coordinates.lng,
                address: location || ''
            },
            evidence: {
                imageUrl: mediaUrl || '',
                clipUrl: ''
            },
            status: 'needs_review',
            nearestHospital: nearestHospital?._id || null,
            nearestPolice: nearestPolice?._id || null,
            camId: camId || '',
            licensePlate: licensePlate || 'Unknown'
        });

        // --- EMERGENCY ALERT SYSTEM ---
        if (process.env.NODE_ENV !== 'test') {
            try {
                const contacts = await EmergencyContact.find();
                const mapLink = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
                const timeStr = accident.detectedAt.toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit', hour12: true
                });

                // Email alerts
                let contactEmails = contacts.map(c => c.email).filter(Boolean);
                const defaultEmail = process.env.DEFAULT_ALERT_EMAIL;
                if (defaultEmail && !contactEmails.includes(defaultEmail)) {
                    contactEmails.push(defaultEmail);
                }

                if (contactEmails.length > 0) {
                    const subject = `⚠️ EMERGENCY: ${mappedSeverity.toUpperCase()} Accident Detected`;
                    const html = `
                        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px;">
                            <div style="background: ${mappedSeverity === 'severe' ? '#DC2626' : mappedSeverity === 'moderate' ? '#F59E0B' : '#3B82F6'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                                <h2 style="margin:0;">🚨 Accident Detection Alert</h2>
                            </div>
                            <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                                <table style="width:100%; border-collapse:collapse;">
                                    <tr><td style="padding:8px; font-weight:bold;">Severity:</td><td style="padding:8px;">${mappedSeverity.toUpperCase()}</td></tr>
                                    <tr><td style="padding:8px; font-weight:bold;">Location:</td><td style="padding:8px;">${location || 'GPS Coordinates'}</td></tr>
                                    <tr><td style="padding:8px; font-weight:bold;">Time:</td><td style="padding:8px;">${timeStr}</td></tr>
                                    <tr><td style="padding:8px; font-weight:bold;">Confidence:</td><td style="padding:8px;">${((confidence || 0.5) * 100).toFixed(0)}%</td></tr>
                                    <tr><td style="padding:8px; font-weight:bold;">Camera:</td><td style="padding:8px;">${camId || 'Unknown'}</td></tr>
                                    <tr><td style="padding:8px; font-weight:bold;">Map:</td><td style="padding:8px;"><a href="${mapLink}">View on Google Maps</a></td></tr>
                                </table>
                                ${nearestHospital ? `<p style="margin-top:12px;">🏥 Nearest Hospital: ${nearestHospital.name} — ${nearestHospital.contactNumber}</p>` : ''}
                                ${nearestPolice ? `<p>🚔 Nearest Police: ${nearestPolice.name} — ${nearestPolice.contactNumber}</p>` : ''}
                            </div>
                        </div>
                    `;

                    await sendEmail(contactEmails.join(','), subject,
                        `Emergency: ${mappedSeverity} accident detected. Map: ${mapLink}`, html);

                    // Log email alerts
                    for (const email of contactEmails) {
                        await AlertLog.create({
                            accident: accident._id,
                            channel: 'email',
                            recipient: email,
                            status: 'sent'
                        });
                    }
                }

                // SMS alerts (for moderate and severe only)
                if (mappedSeverity !== 'minor') {
                    let contactPhones = contacts.map(c => c.phone).filter(Boolean);
                    const defaultPhone = process.env.DEFAULT_ALERT_PHONE;
                    if (defaultPhone && !contactPhones.includes(defaultPhone)) {
                        contactPhones.push(defaultPhone);
                    }

                    const smsResults = await Promise.allSettled(
                        contactPhones.map(phone =>
                            sendEmergencySMS(phone, {
                                location: location || 'GPS Location',
                                severity: mappedSeverity,
                                url: mapLink
                            })
                        )
                    );

                    // Log SMS alerts
                    for (let i = 0; i < contactPhones.length; i++) {
                        await AlertLog.create({
                            accident: accident._id,
                            channel: 'sms',
                            recipient: contactPhones[i],
                            status: smsResults[i]?.status === 'fulfilled' ? 'sent' : 'failed',
                            providerResponse: smsResults[i]?.reason?.message || null
                        });
                    }
                }
            } catch (alertError) {
                console.error('⚠️ Failed to send emergency alerts:', alertError.message);
            }
        }

        // --- REAL-TIME NOTIFICATION (SOCKET.IO) ---
        const io = req.app.get('io');
        if (io) {
            const populated = await Accident.findById(accident._id)
                .populate('camera', 'name zone')
                .populate('nearestHospital', 'name contactNumber')
                .populate('nearestPolice', 'name contactNumber');

            io.emit('accident:new', populated);

            // Log WebSocket alert
            await AlertLog.create({
                accident: accident._id,
                channel: 'websocket',
                recipient: 'all_clients',
                status: 'sent'
            }).catch(() => {});
        }

        res.status(201).json({ success: true, data: accident });
    } catch (error) {
        console.error('❌ Accident creation error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get all accidents with filtering and pagination
 * @route   GET /api/accidents
 * @access  Authenticated
 */
const getAccidents = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.severity) filter.severity = req.query.severity;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.camera) filter.camera = req.query.camera;
        if (req.query.camId) filter.camId = req.query.camId;

        // Date range filter
        if (req.query.startDate || req.query.endDate) {
            filter.detectedAt = {};
            if (req.query.startDate) filter.detectedAt.$gte = new Date(req.query.startDate);
            if (req.query.endDate) filter.detectedAt.$lte = new Date(req.query.endDate);
        }

        const [accidents, total] = await Promise.all([
            Accident.find(filter)
                .populate('camera', 'name zone status')
                .populate('nearestHospital', 'name contactNumber')
                .populate('nearestPolice', 'name contactNumber')
                .populate('reviewedBy', 'name email')
                .sort({ detectedAt: -1 })
                .skip(skip)
                .limit(limit),
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

/**
 * @desc    Get single accident by ID with full details
 * @route   GET /api/accidents/:id
 * @access  Authenticated
 */
const getAccidentById = async (req, res) => {
    try {
        const accident = await Accident.findById(req.params.id)
            .populate('camera', 'name zone streamUrl coordinates status')
            .populate('nearestHospital', 'name contactNumber address coordinates')
            .populate('nearestPolice', 'name contactNumber address coordinates')
            .populate('reviewedBy', 'name email role');

        if (!accident) {
            return res.status(404).json({ success: false, message: 'Accident not found' });
        }

        // Also fetch alert logs for this accident
        const alertLogs = await AlertLog.find({ accident: accident._id }).sort({ sentAt: -1 });

        // Fetch feedback if exists
        const feedback = await Feedback.findOne({ accident: accident._id })
            .populate('labeledBy', 'name email');

        res.json({
            success: true,
            data: accident,
            alertLogs,
            feedback
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update accident status
 * @route   PATCH /api/accidents/:id/status
 * @access  Authenticated
 */
const updateAccidentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['needs_review', 'confirmed', 'false_positive', 'resolved'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const update = { status };
        if (req.user) {
            update.reviewedBy = req.user._id;
        }

        const accident = await Accident.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true, runValidators: true }
        );

        if (!accident) {
            return res.status(404).json({ success: false, message: 'Accident not found' });
        }

        // Broadcast status change
        const io = req.app.get('io');
        if (io) {
            io.emit('accident:statusUpdated', { id: accident._id, status: accident.status });
        }

        res.json({ success: true, data: accident });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Mark accident as true/false positive (feedback for retraining)
 * @route   PATCH /api/accidents/:id/feedback
 * @access  Responder / Admin
 */
const addFeedback = async (req, res) => {
    try {
        const { label, notes } = req.body;
        const validLabels = ['true_positive', 'false_positive'];

        if (!label || !validLabels.includes(label)) {
            return res.status(400).json({
                success: false,
                message: `Invalid label. Must be one of: ${validLabels.join(', ')}`
            });
        }

        const accident = await Accident.findById(req.params.id);
        if (!accident) {
            return res.status(404).json({ success: false, message: 'Accident not found' });
        }

        // Create feedback record
        const feedback = await Feedback.create({
            accident: accident._id,
            labeledBy: req.user._id,
            label,
            notes: notes || ''
        });

        // Update accident status based on feedback
        accident.status = label === 'false_positive' ? 'false_positive' : 'confirmed';
        accident.reviewedBy = req.user._id;
        accident.reviewNote = notes || '';
        await accident.save();

        // Broadcast update
        const io = req.app.get('io');
        if (io) {
            io.emit('accident:feedbackAdded', {
                id: accident._id,
                status: accident.status,
                label
            });
        }

        res.json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Delete an accident record
 * @route   DELETE /api/accidents/:id
 * @access  Admin only
 */
const deleteAccident = async (req, res) => {
    try {
        const accident = await Accident.findByIdAndDelete(req.params.id);
        if (!accident) {
            return res.status(404).json({ success: false, message: 'Accident not found' });
        }

        // Clean up related records
        await Promise.all([
            AlertLog.deleteMany({ accident: req.params.id }),
            Feedback.deleteMany({ accident: req.params.id })
        ]);

        const io = req.app.get('io');
        if (io) {
            io.emit('accident:deleted', { id: req.params.id });
        }

        res.json({ success: true, message: 'Accident record deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createAccident, getAccidents, getAccidentById,
    updateAccidentStatus, addFeedback, deleteAccident
};