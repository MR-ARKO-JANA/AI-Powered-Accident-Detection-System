const express = require('express');
const router = express.Router();
const { getLocations, getNearbyLocations, createLocation, updateLocation, deleteLocation } = require('../controllers/locationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { audit } = require('../middleware/auditMiddleware');

// Authenticated
router.get('/', protect, getLocations);
router.get('/nearby', protect, getNearbyLocations);

// Admin — manage locations
router.post('/', protect, adminOnly, audit('LOCATION_CREATED', 'Location'), createLocation);
router.put('/:id', protect, adminOnly, audit('LOCATION_UPDATED', 'Location'), updateLocation);
router.delete('/:id', protect, adminOnly, audit('LOCATION_DELETED', 'Location'), deleteLocation);

module.exports = router;
