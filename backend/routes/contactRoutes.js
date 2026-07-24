const express = require('express');
const router = express.Router();
const { getContacts, addContact, updateContact, deleteContact } = require('../controllers/contactController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { audit } = require('../middleware/auditMiddleware');

router.get('/', protect, getContacts);
router.post('/', protect, adminOnly, audit('CONTACT_CREATED', 'EmergencyContact'), addContact);
router.put('/:id', protect, adminOnly, audit('CONTACT_UPDATED', 'EmergencyContact'), updateContact);
router.delete('/:id', protect, adminOnly, audit('CONTACT_DELETED', 'EmergencyContact'), deleteContact);

module.exports = router;
