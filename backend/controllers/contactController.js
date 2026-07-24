const EmergencyContact = require('../models/EmergencyContact');

/**
 * @desc    Get all emergency contacts
 * @route   GET /api/contacts
 * @access  Authenticated
 */
const getContacts = async (req, res) => {
    try {
        const contacts = await EmergencyContact.find()
            .populate('linkedUser', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: contacts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Add a new emergency contact
 * @route   POST /api/contacts
 * @access  Admin
 */
const addContact = async (req, res) => {
    try {
        const { name, phone, email, relation, vehiclePlate, linkedUser } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, phone'
            });
        }

        const contact = await EmergencyContact.create({
            name, phone, email: email || '',
            relation: relation || '',
            vehiclePlate: vehiclePlate || '',
            linkedUser: linkedUser || null
        });

        res.status(201).json({ success: true, data: contact });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update an emergency contact
 * @route   PUT /api/contacts/:id
 * @access  Admin
 */
const updateContact = async (req, res) => {
    try {
        const contact = await EmergencyContact.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        res.json({ success: true, data: contact });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Delete an emergency contact
 * @route   DELETE /api/contacts/:id
 * @access  Admin
 */
const deleteContact = async (req, res) => {
    try {
        const contact = await EmergencyContact.findByIdAndDelete(req.params.id);
        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }
        res.json({ success: true, message: 'Contact removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getContacts, addContact, updateContact, deleteContact };
