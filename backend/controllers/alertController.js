const AlertLog = require('../models/AlertLog');

/**
 * @desc    Get alert delivery status for an accident
 * @route   GET /api/alerts/:accidentId/status
 * @access  Authenticated
 */
const getAlertStatus = async (req, res) => {
    try {
        const alerts = await AlertLog.find({ accident: req.params.accidentId })
            .sort({ sentAt: -1 });

        // Group by channel
        const summary = {
            email: alerts.filter(a => a.channel === 'email'),
            sms: alerts.filter(a => a.channel === 'sms'),
            websocket: alerts.filter(a => a.channel === 'websocket'),
            voice_call: alerts.filter(a => a.channel === 'voice_call'),
        };

        res.json({ success: true, data: alerts, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get all alert logs (paginated)
 * @route   GET /api/alerts
 * @access  Admin
 */
const getAllAlerts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.channel) filter.channel = req.query.channel;
        if (req.query.status) filter.status = req.query.status;

        const [alerts, total] = await Promise.all([
            AlertLog.find(filter)
                .populate('accident', 'severity location detectedAt')
                .sort({ sentAt: -1 })
                .skip(skip)
                .limit(limit),
            AlertLog.countDocuments(filter)
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

module.exports = { getAlertStatus, getAllAlerts };
