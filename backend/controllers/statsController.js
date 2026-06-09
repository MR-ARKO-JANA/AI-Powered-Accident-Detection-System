const Accident = require("../models/Accident");
const SosAlert = require("../models/SosAlert");

// @desc    Get dashboard summary stats
// @route   GET /api/stats/dashboard
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
            recentAccident
        ] = await Promise.all([
            Accident.countDocuments(),
            SosAlert.countDocuments({ cancelled: false }),
            Accident.countDocuments({ createdAt: { $gte: todayStart } }),
            SosAlert.countDocuments({ createdAt: { $gte: todayStart }, cancelled: false }),
            Accident.countDocuments({ status: { $ne: 'resolved' } }),
            Accident.aggregate([
                { $group: { _id: "$severity", count: { $sum: 1 } } }
            ]),
            Accident.findOne().sort({ createdAt: -1 }).select('createdAt')
        ]);

        // Unique camera IDs that have reported
        const activeCameras = await Accident.distinct('camId');

        // Build severity map
        const severity = { Critical: 0, High: 0, Medium: 0, Low: 0 };
        severityBreakdown.forEach(s => {
            if (severity.hasOwnProperty(s._id)) severity[s._id] = s.count;
        });

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
                activeCameras: activeCameras.length,
                cameraIds: activeCameras,
                severity,
                lastAlertTime: recentAccident?.createdAt || null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get analytics data (charts: daily trend, hourly distribution, severity pie)
// @route   GET /api/stats/analytics
const getAnalytics = async (req, res) => {
    try {
        const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 30));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Accidents per day (last N days)
        const dailyAccidents = await Accident.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // SOS per day (last N days)
        const dailySOS = await SosAlert.aggregate([
            { $match: { createdAt: { $gte: startDate }, cancelled: false } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Peak hours distribution (0-23)
        const hourlyDistribution = await Accident.aggregate([
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Severity distribution
        const severityDistribution = await Accident.aggregate([
            { $group: { _id: "$severity", count: { $sum: 1 } } }
        ]);

        // Status distribution
        const statusDistribution = await Accident.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Camera performance (accidents per camera)
        const cameraStats = await Accident.aggregate([
            { $group: { _id: "$camId", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
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
                cameraStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getDashboardStats, getAnalytics };
