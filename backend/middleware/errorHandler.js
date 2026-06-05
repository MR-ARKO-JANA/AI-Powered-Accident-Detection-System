/**
 * Centralized error handler middleware.
 * Catches all unhandled errors and Multer file validation errors.
 * Must be registered AFTER all routes in Server.js.
 */
const errorHandler = (err, req, res, next) => {
    console.error(`❌ [${req.method}] ${req.originalUrl} — ${err.message}`);

    // Multer file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: "File too large. Maximum size is 10MB." });
    }
    if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({ success: false, message: err.message });
    }

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    // Default 500
    res.status(err.statusCode || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
};

module.exports = errorHandler;
