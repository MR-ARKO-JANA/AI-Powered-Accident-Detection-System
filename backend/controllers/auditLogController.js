const AuditLog = require('../models/AuditLog');

/**
 * @desc    Get audit logs (paginated, filterable)
 * @route   GET /api/audit-logs
 * @access  Super Admin
 */
const getAuditLogs = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.action) filter.action = req.query.action;
        if (req.query.actor) filter.actor = req.query.actor;
        if (req.query.targetType) filter.targetType = req.query.targetType;

        // Date range
        if (req.query.startDate || req.query.endDate) {
            filter.createdAt = {};
            if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
            if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
        }

        // Search in action or targetType
        if (req.query.search) {
            filter.$or = [
                { action: { $regex: req.query.search, $options: 'i' } },
                { targetType: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .populate('actor', 'name email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            AuditLog.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: logs,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAuditLogs };
