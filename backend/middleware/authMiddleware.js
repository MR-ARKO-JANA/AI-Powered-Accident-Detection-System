const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT Authentication Middleware
 * Verifies Bearer token and attaches user to request
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-passwordHash');
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }
            if (!req.user.isActive) {
                return res.status(403).json({ success: false, message: 'Account is deactivated' });
            }
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

/**
 * Role-Based Access Control Middleware
 * Usage: requireRole('super_admin', 'zone_admin')
 * Accepts any number of allowed roles
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }
        next();
    };
};

/**
 * Legacy admin-only middleware (backward compatibility)
 */
const adminOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'super_admin' || req.user.role === 'zone_admin')) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied: Admins only' });
    }
};

module.exports = { protect, requireRole, adminOnly };
