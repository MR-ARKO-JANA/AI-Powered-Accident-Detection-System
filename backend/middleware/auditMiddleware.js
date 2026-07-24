const AuditLog = require('../models/AuditLog');

/**
 * Audit Logging Middleware Factory
 * Creates middleware that logs sensitive actions to the AuditLog collection.
 * 
 * Usage:
 *   router.patch('/:id/status', protect, audit('ACCIDENT_STATUS_CHANGED', 'Accident'), updateAccidentStatus);
 * 
 * @param {string} action - The action name (e.g., 'ACCIDENT_CONFIRMED')
 * @param {string} targetType - The entity type (e.g., 'Accident', 'User', 'Camera')
 */
const audit = (action, targetType = '') => {
    return async (req, res, next) => {
        // Store original res.json to intercept the response
        const originalJson = res.json.bind(res);

        res.json = async function (data) {
            // Only log on successful responses
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                try {
                    await AuditLog.create({
                        actor: req.user._id,
                        action,
                        targetType,
                        targetId: req.params.id || null,
                        metadata: {
                            method: req.method,
                            path: req.originalUrl,
                            body: sanitizeBody(req.body),
                            statusCode: res.statusCode
                        },
                        ipAddress: req.ip || req.connection?.remoteAddress || ''
                    });
                } catch (err) {
                    console.error('⚠️ Audit log write failed:', err.message);
                    // Don't fail the request if audit logging fails
                }
            }
            return originalJson(data);
        };

        next();
    };
};

/**
 * Remove sensitive fields from request body before logging
 */
function sanitizeBody(body) {
    if (!body) return {};
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'apiKey'];
    sensitiveFields.forEach(field => {
        if (sanitized[field]) sanitized[field] = '[REDACTED]';
    });
    return sanitized;
}

module.exports = { audit };
