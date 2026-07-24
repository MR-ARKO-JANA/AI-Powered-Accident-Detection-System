const express = require('express');
const router = express.Router();
const { getCameras, getCameraById, createCamera, updateCamera, deleteCamera } = require('../controllers/cameraController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { audit } = require('../middleware/auditMiddleware');

// Authenticated — view cameras
router.get('/', protect, getCameras);
router.get('/:id', protect, getCameraById);

// Admin — manage cameras
router.post('/', protect, adminOnly, audit('CAMERA_CREATED', 'Camera'), createCamera);
router.put('/:id', protect, adminOnly, audit('CAMERA_UPDATED', 'Camera'), updateCamera);
router.delete('/:id', protect, adminOnly, audit('CAMERA_DELETED', 'Camera'), deleteCamera);

module.exports = router;
