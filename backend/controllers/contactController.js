const Contact = require("../models/EmergencyContact");

// @desc    Get all emergency contacts
// @route   GET /api/contacts
const getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find();
        res.json({ success: true, data: contacts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add a new emergency contact
// @route   POST /api/contacts
const addContact = async (req, res) => {
    try {
        const { name, role, phone, email } = req.body;
        const contact = await Contact.create({ name, role, phone, email });
        res.status(201).json({ success: true, data: contact });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete an emergency contact
// @route   DELETE /api/contacts/:id
const deleteContact = async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Contact removed" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getContacts, addContact, deleteContact };
