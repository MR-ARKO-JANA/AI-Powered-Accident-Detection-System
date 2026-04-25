const express = require("express");
const router = express.Router();
const { getContacts, addContact, deleteContact } = require("../controllers/contactController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/", protect, getContacts);
router.post("/", protect, adminOnly, addContact);
router.delete("/:id", protect, adminOnly, deleteContact);

module.exports = router;
