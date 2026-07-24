const Accident = require('../models/Accident');
const SosAlert = require('../models/SosAlert');
const AlertLog = require('../models/AlertLog');
const Camera = require('../models/Camera');
const Feedback = require('../models/Feedback');

/**
 * @desc    Get dashboard summary stats
 * @route   GET /api/stats/dashboard
 * @access  Authenticated
 */
const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const [
            totalAccidents,
            totalSOS,
            todayAccidents,
            todaySOS,
            activeAccidents,
            severityBreakdown,
            statusBreakdown,
            recentAccident,
            totalCameras,
            onlineCameras,
            totalAlertsSent,
            failedAlerts,
            falsePosCount
        ] = await Promise.all([
            Accident.countDocuments(),
            SosAlert.countDocuments({ cancelled: false }),
            Accident.countDocuments({ detectedAt: { $gte: todayStart } }),
            SosAlert.countDocuments({ createdAt: { $gte: todayStart }, cancelled: false }),
            Accident.countDocuments({ status: { $nin: ['resolved', 'false_positive'] } }),
            Accident.aggregate([
                { $group: { _id: '$severity', count: { $sum: 1 } } }
            ]),
            Accident.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Accident.findOne().sort({ detectedAt: -1 }).select('detectedAt'),
            Camera.countDocuments(),
            Camera.countDocuments({ status: 'online' }),
            AlertLog.countDocuments({ status: { $in: ['sent', 'delivered'] } }),
            AlertLog.countDocuments({ status: 'failed' }),
            Feedback.countDocuments({ label: 'false_positive' })
        ]);

        // Build severity map
        const severity = { minor: 0, moderate: 0, severe: 0 };
        severityBreakdown.forEach(s => {
            if (severity.hasOwnProperty(s._id)) severity[s._id] = s.count;
        });

        // Build status map
        const status = { needs_review: 0, confirmed: 0, false_positive: 0, resolved: 0 };
        statusBreakdown.forEach(s => {
            if (status.hasOwnProperty(s._id)) status[s._id] = s.count;
        });

        // Calculate false positive rate
        const totalDetections = totalAccidents || 1;
        const falsePositiveRate = ((falsePosCount / totalDetections) * 100).toFixed(1);

        res.json({
            success: true,
            data: {
                totalAlerts: totalAccidents + totalSOS,
                totalAccidents,
                totalSOS,
                todayAlerts: todayAccidents + todaySOS,
                todayAccidents,
                todaySOS,
                activeIncidents: activeAccidents,
                cameras: {
                    total: totalCameras,
                    online: onlineCameras
                },
                alerts: {
                    sent: totalAlertsSent,
                    failed: failedAlerts
                },
                severity,
                status,
                falsePositiveRate: parseFloat(falsePositiveRate),
                lastAlertTime: recentAccident?.detectedAt || null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get analytics data for charts
 * @route   GET /api/stats/analytics
 * @access  Authenticated
 */
const getAnalytics = async (req, res) => {
    try {
        const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 30));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [
            dailyAccidents,
            dailySOS,
            hourlyDistribution,
            severityDistribution,
            statusDistribution,
            cameraStats,
            avgResponseTime,
            feedbackStats
        ] = await Promise.all([
            // Accidents per day
            Accident.aggregate([
                { $match: { detectedAt: { $gte: startDate } } },
                { $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$detectedAt' } },
                    count: { $sum: 1 }
                }},
                { $sort: { _id: 1 } }
            ]),
            // SOS per day
            SosAlert.aggregate([
                { $match: { createdAt: { $gte: startDate }, cancelled: false } },
                { $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }},
                { $sort: { _id: 1 } }
            ]),
            // Peak hours
            Accident.aggregate([
                { $group: { _id: { $hour: '$detectedAt' }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            // Severity
            Accident.aggregate([
                { $group: { _id: '$severity', count: { $sum: 1 } } }
            ]),
            // Status
            Accident.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            // Camera performance
            Accident.aggregate([
                { $lookup: { from: 'cameras', localField: 'camera', foreignField: '_id', as: 'cam' } },
                { $unwind: { path: '$cam', preserveNullAndEmptyArrays: true } },
                { $group: {
                    _id: { $ifNull: ['$cam.name', '$camId'] },
                    count: { $sum: 1 },
                    zone: { $first: '$cam.zone' }
                }},
                { $sort: { count: -1 } }
            ]),
            // Average response time (detection → first alert sent)
            AlertLog.aggregate([
                { $match: { status: { $in: ['sent', 'delivered'] } } },
                { $lookup: { from: 'accidents', localField: 'accident', foreignField: '_id', as: 'acc' } },
                { $unwind: '$acc' },
                { $project: {
                    responseTime: { $subtract: ['$sentAt', '$acc.detectedAt'] }
                }},
                { $group: { _id: null, avgMs: { $avg: '$responseTime' } } }
            ]),
            // Feedback stats
            Feedback.aggregate([
                { $group: { _id: '$label', count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                period: { days, startDate },
                dailyAccidents,
                dailySOS,
                hourlyDistribution,
                severityDistribution,
                statusDistribution,
                cameraStats,
                avgAlertLatencyMs: avgResponseTime[0]?.avgMs || null,
                feedbackStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get user management data
 * @route   GET /api/stats/users
 * @access  Admin
 */
const getUserStats = async (req, res) => {
    try {
        const User = require('../models/User');

        const [users, roleBreakdown] = await Promise.all([
            User.find().select('-passwordHash').sort({ createdAt: -1 }),
            User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            success: true,
            data: { users, roleBreakdown }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getDashboardStats, getAnalytics, getUserStats };
