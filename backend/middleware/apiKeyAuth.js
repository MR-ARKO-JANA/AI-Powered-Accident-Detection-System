/**
 * API Key Authentication Middleware
 * Used to secure service-to-service communication (e.g. AI Service -> Backend)
 */
const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const secretKey = process.env.API_SECRET_KEY || "apads_ai_secret_api_key_2026";

    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed: API Key is missing."
        });
    }

    if (apiKey !== secretKey) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed: Invalid API Key."
        });
    }

    next();
};

module.exports = apiKeyAuth;
