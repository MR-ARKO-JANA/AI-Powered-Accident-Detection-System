const Camera = require('../models/Camera');

/**
 * @desc    Get all cameras
 * @route   GET /api/cameras
 * @access  Authenticated
 */
const getCameras = async (req, res) => {
    try {
        const filter = {};
        if (req.query.zone) filter.zone = req.query.zone;
        if (req.query.status) filter.status = req.query.status;

        const cameras = await Camera.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: cameras });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get single camera
 * @route   GET /api/cameras/:id
 * @access  Authenticated
 */
const getCameraById = async (req, res) => {
    try {
        const camera = await Camera.findById(req.params.id);
        if (!camera) {
            return res.status(404).json({ success: false, message: 'Camera not found' });
        }
        res.json({ success: true, data: camera });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Add a new camera
 * @route   POST /api/cameras
 * @access  Admin
 */
const createCamera = async (req, res) => {
    try {
        const { name, zone, streamUrl, coordinates, edgeMode } = req.body;

        if (!name || !zone || !coordinates?.lat || !coordinates?.lng) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, zone, coordinates.lat, coordinates.lng'
            });
        }

        const camera = await Camera.create({
            name, zone, streamUrl,
            coordinates, edgeMode: edgeMode || false,
            status: 'offline'
        });

        const io = req.app.get('io');
        if (io) io.emit('camera:added', camera);

        res.status(201).json({ success: true, data: camera });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update a camera
 * @route   PUT /api/cameras/:id
 * @access  Admin
 */
const updateCamera = async (req, res) => {
    try {
        const { name, zone, streamUrl, coordinates, status, edgeMode } = req.body;

        const camera = await Camera.findByIdAndUpdate(
            req.params.id,
            { name, zone, streamUrl, coordinates, status, edgeMode },
            { new: true, runValidators: true }
        );

        if (!camera) {
            return res.status(404).json({ success: false, message: 'Camera not found' });
        }

        const io = req.app.get('io');
        if (io) io.emit('camera:updated', camera);

        res.json({ success: true, data: camera });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Delete a camera
 * @route   DELETE /api/cameras/:id
 * @access  Admin
 */
const deleteCamera = async (req, res) => {
    try {
        const camera = await Camera.findByIdAndDelete(req.params.id);
        if (!camera) {
            return res.status(404).json({ success: false, message: 'Camera not found' });
        }

        const io = req.app.get('io');
        if (io) io.emit('camera:deleted', { id: req.params.id });

        res.json({ success: true, message: 'Camera deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getCameras, getCameraById, createCamera, updateCamera, deleteCamera };
