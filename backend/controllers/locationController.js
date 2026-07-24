const Location = require('../models/Location');

/**
 * @desc    Get all locations (hospitals & police stations)
 * @route   GET /api/locations
 * @access  Authenticated
 */
const getLocations = async (req, res) => {
    try {
        const filter = {};
        if (req.query.type) filter.type = req.query.type;

        const locations = await Location.find(filter).sort({ name: 1 });
        res.json({ success: true, data: locations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Find nearest hospital and police for given coordinates
 * @route   GET /api/locations/nearby?lat=X&lng=Y
 * @access  Authenticated
 */
const getNearbyLocations = async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                success: false,
                message: 'lat and lng query parameters are required'
            });
        }

        // Find all locations and sort by distance
        const allLocations = await Location.find();

        const withDistance = allLocations.map(loc => ({
            ...loc.toObject(),
            distance: Math.sqrt(
                Math.pow(loc.coordinates.lat - lat, 2) +
                Math.pow(loc.coordinates.lng - lng, 2)
            )
        }));

        const hospitals = withDistance
            .filter(l => l.type === 'hospital')
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);

        const police = withDistance
            .filter(l => l.type === 'police')
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);

        res.json({
            success: true,
            data: {
                nearestHospitals: hospitals,
                nearestPolice: police
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Create a new location
 * @route   POST /api/locations
 * @access  Admin
 */
const createLocation = async (req, res) => {
    try {
        const { name, type, coordinates, contactNumber, address } = req.body;

        if (!name || !type || !coordinates?.lat || !coordinates?.lng || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, type, coordinates, contactNumber'
            });
        }

        const validTypes = ['hospital', 'police'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        const location = await Location.create({
            name, type, coordinates, contactNumber, address: address || ''
        });

        res.status(201).json({ success: true, data: location });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update a location
 * @route   PUT /api/locations/:id
 * @access  Admin
 */
const updateLocation = async (req, res) => {
    try {
        const location = await Location.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!location) {
            return res.status(404).json({ success: false, message: 'Location not found' });
        }

        res.json({ success: true, data: location });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Delete a location
 * @route   DELETE /api/locations/:id
 * @access  Admin
 */
const deleteLocation = async (req, res) => {
    try {
        const location = await Location.findByIdAndDelete(req.params.id);
        if (!location) {
            return res.status(404).json({ success: false, message: 'Location not found' });
        }

        res.json({ success: true, message: 'Location deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getLocations, getNearbyLocations, createLocation, updateLocation, deleteLocation };
